import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data } = await supabase
    .from("id_verifications")
    .select("*")
    .eq("user_id", req.userId!)
    .maybeSingle();

  res.json(data || { status: "unverified" });
});

router.post(
  "/upload",
  authenticate,
  upload.fields([
    { name: "front_side", maxCount: 1 },
    { name: "back_side", maxCount: 1 },
  ]),
  async (req: AuthRequest, res) => {
    const supabase = req.supabase!;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const frontFile = files?.front_side?.[0];
    const backFile = files?.back_side?.[0];

    if (!frontFile || !backFile) {
      return res.status(400).json({ error: "Both front and back ID files are required" });
    }

    const uid = req.userId!;
    const frontPath = `${uid}/front_${Date.now()}_${frontFile.originalname}`;
    const backPath = `${uid}/back_${Date.now()}_${backFile.originalname}`;

    const { error: frontStorageErr } = await supabase.storage
      .from("id-documents")
      .upload(frontPath, frontFile.buffer, { contentType: frontFile.mimetype, upsert: true });
    if (frontStorageErr) throw frontStorageErr;

    const { error: backStorageErr } = await supabase.storage
      .from("id-documents")
      .upload(backPath, backFile.buffer, { contentType: backFile.mimetype, upsert: true });
    if (backStorageErr) throw backStorageErr;

    const { data: frontUrlData } = await supabase.storage.from("id-documents").createSignedUrl(frontPath, 31536000);
    const { data: backUrlData } = await supabase.storage.from("id-documents").createSignedUrl(backPath, 31536000);

    const { data, error } = await supabase
      .from("id_verifications")
      .upsert(
        {
          user_id: uid,
          doc_url: frontUrlData?.signedUrl || frontPath,
          front_doc_url: frontUrlData?.signedUrl || frontPath,
          back_doc_url: backUrlData?.signedUrl || backPath,
          status: "pending",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  },
);

export default router;
