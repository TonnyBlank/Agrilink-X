type MpesaAccessTokenResponse = {
  access_token: string;
  expires_in: string;
};

type StkPushResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

type StkQueryResponse = {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode?: string;
  ResultDesc?: string;
};

function getBaseUrl() {
  return process.env.MPESA_ENV === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function getConfiguredValue(names: string[], fallback?: string) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }

  if (fallback != null) return fallback;

  throw new Error(`Missing ${names[0]} in backend environment`);
}

function getSandboxShortcode() {
  return process.env.MPESA_ENV === "live" ? undefined : "174379";
}

function getShortcode() {
  return getConfiguredValue(["MPESA_SHORTCODE", "MPESA_SHORT_CODE"], getSandboxShortcode());
}

function getPasskey() {
  return getConfiguredValue(["MPESA_PASSKEY", "MPESA_PASS_KEY", "MPESA_ONLINE_PASSKEY"]);
}

function getCallbackUrl() {
  return getConfiguredValue(
    ["MPESA_CALLBACK_URL"],
    "https://example.com/api/payments/mpesa/callback",
  );
}

export function normalizeKenyanPhone(phone: string) {
  const digits = phone.replace(/\D+/g, "");

  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;

  throw new Error("Phone number must be a valid Kenyan mobile number");
}

function getTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

function getPassword(shortcode: string, passkey: string, timestamp: string) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

export async function getMpesaAccessToken() {
  const consumerKey = getConfiguredValue(["MPESA_CONSUMER_KEY"]);
  const consumerSecret = getConfiguredValue(["MPESA_CONSUMER_SECRET"]);

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get M-Pesa access token: ${await response.text()}`);
  }

  return response.json() as Promise<MpesaAccessTokenResponse>;
}

export async function initiateStkPush(input: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}) {
  const shortcode = getShortcode();
  const passkey = getPasskey();
  const callbackUrl = getCallbackUrl();
  const { access_token } = await getMpesaAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(shortcode, passkey, timestamp);

  const response = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(input.amount),
      PartyA: input.phoneNumber,
      PartyB: shortcode,
      PhoneNumber: input.phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: input.accountReference,
      TransactionDesc: input.transactionDesc,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate M-Pesa payment: ${await response.text()}`);
  }

  return response.json() as Promise<StkPushResponse>;
}

export async function queryStkPush(checkoutRequestId: string) {
  const shortcode = getShortcode();
  const passkey = getPasskey();
  const { access_token } = await getMpesaAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(shortcode, passkey, timestamp);

  const response = await fetch(`${getBaseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to query M-Pesa payment: ${await response.text()}`);
  }

  return response.json() as Promise<StkQueryResponse>;
}
