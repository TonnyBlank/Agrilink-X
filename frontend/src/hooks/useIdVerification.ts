import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type IDVerification = {
  id?: string;
  user_id?: string;
  doc_url?: string | null;
  front_doc_url?: string | null;
  back_doc_url?: string | null;
  status: VerificationStatus;
  reviewer_note?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
};

export function useIdVerification() {
  const { user } = useAuth();
  const [verification, setVerification] = useState<IDVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setVerification(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<IDVerification>("/id-verification");
      setVerification(data);
    } catch (error) {
      console.error("Failed to load ID verification", error);
      toast.error("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadDocuments = async (frontFile: File, backFile: File) => {
    const formData = new FormData();
    formData.append("front_side", frontFile);
    formData.append("back_side", backFile);

    setUploading(true);
    try {
      const data = await apiFetch<IDVerification>("/id-verification/upload", {
        method: "POST",
        body: formData,
      });
      setVerification(data);
      toast.success("ID documents uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload ID documents");
    } finally {
      setUploading(false);
    }
  };

  return {
    verification,
    loading,
    uploading,
    uploadDocuments,
    refetch: load,
  };
}
