import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { initiateStkPush, normalizeKenyanPhone, queryStkPush } from "../lib/mpesa";
import { getSupabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();

function isMockMpesaEnabled() {
  return process.env.MPESA_ENV !== "live" && process.env.MPESA_MOCK_MODE !== "false";
}

async function markOrderPaid(orderId: string, checkoutRequestId: string, receiptNumber?: string | null) {
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({
      payment_status: "paid",
      payment_ref: receiptNumber || checkoutRequestId,
      paid_at: new Date().toISOString(),
      payment_error: null,
    })
    .eq("id", orderId);

  if (error) throw error;
}

// POST /api/payments/orders/:id/mpesa
router.post("/orders/:id/mpesa", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const orderId = req.params.id;
  const phoneNumber = normalizeKenyanPhone(String(req.body?.phoneNumber || ""));

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("buyer_id", req.userId!)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "cancelled") return res.status(400).json({ error: "Cancelled orders cannot be paid" });
  if (order.payment_status === "paid") return res.status(400).json({ error: "This order has already been paid" });

  const { data: sellerProfile, error: sellerProfileError } = await supabase
    .from("profiles")
    .select("full_name, payout_method, payout_mpesa_number, bank_name, bank_account_name, bank_account_number")
    .eq("user_id", order.farmer_id)
    .maybeSingle();

  if (sellerProfileError) throw sellerProfileError;

  if (!sellerProfile?.payout_method) {
    return res.status(400).json({ error: "Seller has not configured where payments should be settled yet." });
  }

  if (
    (sellerProfile.payout_method === "mpesa" && !sellerProfile.payout_mpesa_number) ||
    (
      sellerProfile.payout_method === "bank" &&
      (!sellerProfile.bank_name || !sellerProfile.bank_account_name || !sellerProfile.bank_account_number)
    )
  ) {
    return res.status(400).json({ error: "Seller payout details are incomplete. Ask the seller to update their profile." });
  }

  const amount = Number(order.total_price) + Number(order.delivery_fee || 0);
  let stk: {
    CheckoutRequestID: string;
    MerchantRequestID: string;
    CustomerMessage?: string;
    ResponseDescription?: string;
  };

  try {
    stk = await initiateStkPush({
      phoneNumber,
      amount,
      accountReference: order.id.slice(0, 12),
      transactionDesc: `AgriLink order ${order.id.slice(0, 8)}`,
    });
  } catch (error) {
    if (!isMockMpesaEnabled()) throw error;

    stk = {
      CheckoutRequestID: `mock-checkout-${order.id}`,
      MerchantRequestID: `mock-merchant-${order.id}`,
      CustomerMessage: "Sandbox mock payment started. Use Check Payment to confirm.",
      ResponseDescription: "Sandbox mock payment started",
    };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_method: "mpesa",
      payment_status: "initiated",
      checkout_request_id: stk.CheckoutRequestID,
      merchant_request_id: stk.MerchantRequestID,
      payment_error: null,
    })
    .eq("id", order.id);

  if (updateError) throw updateError;

  res.json({
    message: stk.CustomerMessage || stk.ResponseDescription,
    checkoutRequestId: stk.CheckoutRequestID,
    merchantRequestId: stk.MerchantRequestID,
  });
});

// GET /api/payments/orders/:id/mpesa-status
router.get("/orders/:id/mpesa-status", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const orderId = req.params.id;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("buyer_id", req.userId!)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (!order.checkout_request_id) return res.status(400).json({ error: "No M-Pesa request found for this order" });

  let result: { ResultCode?: string; ResultDesc?: string; ResponseDescription?: string };

  try {
    result = await queryStkPush(order.checkout_request_id);
  } catch (error) {
    if (!isMockMpesaEnabled()) throw error;
    result = {
      ResultCode: "0",
      ResultDesc: "Sandbox mock payment confirmed",
      ResponseDescription: "Sandbox mock payment confirmed",
    };
  }
  const resultCode = String(result.ResultCode ?? "");
  const resultDesc = result.ResultDesc || result.ResponseDescription || "Unknown payment status";

  if (resultCode === "0") {
    await markOrderPaid(order.id, order.checkout_request_id, order.payment_ref);
    return res.json({ payment_status: "paid", resultCode, resultDesc });
  }

  if (resultCode) {
    const normalizedStatus = resultCode === "1032" ? "failed" : "pending_confirmation";
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: normalizedStatus,
        payment_error: resultDesc,
      })
      .eq("id", order.id);
    if (updateError) throw updateError;
  }

  res.json({
    payment_status: resultCode ? (resultCode === "0" ? "paid" : resultCode === "1032" ? "failed" : "pending_confirmation") : "initiated",
    resultCode,
    resultDesc,
  });
});

// POST /api/payments/mpesa/callback
router.post("/mpesa/callback", async (req, res) => {
  const callback = req.body?.Body?.stkCallback;
  const checkoutRequestId = callback?.CheckoutRequestID;
  const resultCode = String(callback?.ResultCode ?? "");
  const resultDesc = callback?.ResultDesc || "Callback received";

  if (!checkoutRequestId) {
    return res.status(200).json({ ok: true });
  }

  const itemMap = new Map<string, unknown>();
  const metadataItems = callback?.CallbackMetadata?.Item;
  if (Array.isArray(metadataItems)) {
    for (const item of metadataItems) {
      itemMap.set(item.Name, item.Value);
    }
  }

  const receiptNumber = typeof itemMap.get("MpesaReceiptNumber") === "string"
    ? String(itemMap.get("MpesaReceiptNumber"))
    : null;

  if (resultCode === "0") {
    const { data: order, error } = await getSupabaseAdmin()
      .from("orders")
      .select("id")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();
    if (error) throw error;
    if (order) {
      await markOrderPaid(order.id, checkoutRequestId, receiptNumber);
    }
  } else {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "failed",
        payment_error: resultDesc,
      })
      .eq("checkout_request_id", checkoutRequestId);
    if (error) throw error;
  }

  res.status(200).json({ ok: true });
});

export default router;
