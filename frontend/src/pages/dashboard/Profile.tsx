import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, KeyRound, Save, UploadCloud, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useIdVerification } from "@/hooks/useIdVerification";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Profile() {
  const { profile, refreshProfile, user } = useAuth();
  const { verification, uploading, loading, uploadDocuments } = useIdVerification();
  const status = verification?.status || "unverified";

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    county: profile?.county || "",
    bio: profile?.bio || "",
    payout_method: profile?.payout_method || "",
    payout_mpesa_number: profile?.payout_mpesa_number || "",
    bank_name: profile?.bank_name || "",
    bank_account_name: profile?.bank_account_name || "",
    bank_account_number: profile?.bank_account_number || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const photoPreview = useMemo(() => localPhotoPreview || profile?.photo_url || "", [localPhotoPreview, profile?.photo_url]);

  useEffect(() => {
    return () => {
      if (localPhotoPreview) {
        URL.revokeObjectURL(localPhotoPreview);
      }
    };
  }, [localPhotoPreview]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await apiFetch("/profiles/me", {
        method: "PATCH",
        body: {
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          county: profileForm.county,
          bio: profileForm.bio,
          payout_method: profileForm.payout_method || null,
          payout_mpesa_number: profileForm.payout_method === "mpesa" ? profileForm.payout_mpesa_number : null,
          bank_name: profileForm.payout_method === "bank" ? profileForm.bank_name : null,
          bank_account_name: profileForm.payout_method === "bank" ? profileForm.bank_account_name : null,
          bank_account_number: profileForm.payout_method === "bank" ? profileForm.bank_account_number : null,
        } as unknown as BodyInit,
      });
      toast.success("Profile updated successfully!");
      await refreshProfile();
    } catch (error) {
      toast.error("Failed to update profile: " + (error as Error).message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5MB or less.");
      event.target.value = "";
      return;
    }

    if (localPhotoPreview) {
      URL.revokeObjectURL(localPhotoPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPhotoPreview(objectUrl);

    const formData = new FormData();
    formData.append("photo", file);

    setPhotoUploading(true);
    try {
      await apiFetch("/profiles/me/photo", {
        method: "POST",
        body: formData,
      });
      toast.success("Profile photo uploaded!");
      await refreshProfile();
    } catch (error) {
      if (!user) {
        toast.error("Sign in again and try uploading the photo.");
        setLocalPhotoPreview(null);
        event.target.value = "";
        setPhotoUploading(false);
        return;
      }

      try {
        const filePath = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ photo_url: publicUrlData.publicUrl })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        toast.success("Profile photo uploaded!");
        await refreshProfile();
      } catch (fallbackError) {
        console.error("Failed to upload profile photo", fallbackError);
        toast.error("Failed to upload profile photo");
        setLocalPhotoPreview(null);
      }
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  };

  const handleUploadId = async () => {
    if (!frontFile || !backFile) {
      toast.error("Upload both front and back ID images.");
      return;
    }

    await uploadDocuments(frontFile, backFile);
    setFrontFile(null);
    setBackFile(null);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.password || passwordForm.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
    setIsChangingPassword(false);

    if (error) {
      toast.error(error.message || "Failed to change password");
      return;
    }

    setPasswordForm({ password: "", confirmPassword: "" });
    toast.success("Password updated successfully!");
  };

  return (
    <DashboardShell title="My Profile">
      <div className="grid max-w-6xl grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="bento-card xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Personal Information</h3>
              <p className="mt-1 text-sm text-muted-foreground">Update your public profile, contact info, and photo.</p>
            </div>
            <Button onClick={() => void handleSaveProfile()} disabled={isSavingProfile} className="rounded-xl">
              <Save className="mr-2 h-4 w-4" />
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
            <div className="space-y-4">
              <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/30">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-14 w-14 text-muted-foreground" />
                )}
              </div>
              <label className={`mx-auto flex w-fit cursor-pointer items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold ${photoUploading ? "pointer-events-none opacity-60" : ""}`}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {photoUploading ? "Uploading..." : "Upload Photo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhotoUpload(e)} />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>County / Location</Label>
                <Input value={profileForm.county} onChange={(e) => setProfileForm({ ...profileForm, county: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>About You</Label>
                <Textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} className="min-h-[110px] rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>How you receive payouts</Label>
                <Select
                  value={profileForm.payout_method}
                  onValueChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      payout_method: value,
                      payout_mpesa_number: value === "mpesa" ? current.payout_mpesa_number : "",
                      bank_name: value === "bank" ? current.bank_name : "",
                      bank_account_name: value === "bank" ? current.bank_account_name : "",
                      bank_account_number: value === "bank" ? current.bank_account_number : "",
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank">Bank Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {profileForm.payout_method === "mpesa" && (
                <div className="space-y-2 md:col-span-2">
                  <Label>M-Pesa Number</Label>
                  <Input
                    value={profileForm.payout_mpesa_number}
                    onChange={(e) => setProfileForm({ ...profileForm, payout_mpesa_number: e.target.value })}
                    placeholder="2547XXXXXXXX"
                    className="rounded-xl"
                  />
                </div>
              )}
              {profileForm.payout_method === "bank" && (
                <>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={profileForm.bank_name}
                      onChange={(e) => setProfileForm({ ...profileForm, bank_name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input
                      value={profileForm.bank_account_name}
                      onChange={(e) => setProfileForm({ ...profileForm, bank_account_name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Account Number</Label>
                    <Input
                      value={profileForm.bank_account_number}
                      onChange={(e) => setProfileForm({ ...profileForm, bank_account_number: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bento-card">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold text-foreground">Change Password</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="rounded-xl" />
            </div>
            <Button onClick={() => void handleChangePassword()} disabled={isChangingPassword} className="w-full rounded-xl">
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>

        <div className="bento-card xl:col-span-3">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">ID Verification</h3>
              <p className="mt-1 text-sm text-muted-foreground">Upload both the front and back side of your ID document.</p>
            </div>
            <Badge
              className={`w-fit rounded-full border text-xs shadow-sm ${
                status === "verified"
                  ? "border-[#4CAF50]/30 bg-[#4CAF50]/15 text-[#4CAF50]"
                  : status === "pending"
                    ? "border-gold-500/30 bg-gold-500/15 text-gold-500"
                    : "border-destructive/30 bg-destructive/15 text-destructive"
              }`}
              variant="outline"
            >
              {status === "verified" && <CheckCircle className="mr-1 h-3 w-3" />}
              {status === "pending" && <Clock className="mr-1 h-3 w-3" />}
              {status === "unverified" && "Unverified"}
              {status === "verified" && "Verified"}
              {status === "pending" && "Pending Review"}
              {status === "rejected" && "Rejected"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-dashed border-border p-5">
              <Label className="mb-2 block">Front Side</Label>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setFrontFile(e.target.files?.[0] || null)} className="rounded-xl" />
              {verification?.front_doc_url && <p className="mt-2 text-xs text-muted-foreground">Front side uploaded.</p>}
            </div>
            <div className="rounded-2xl border-2 border-dashed border-border p-5">
              <Label className="mb-2 block">Back Side</Label>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setBackFile(e.target.files?.[0] || null)} className="rounded-xl" />
              {verification?.back_doc_url && <p className="mt-2 text-xs text-muted-foreground">Back side uploaded.</p>}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {loading ? "Loading verification status..." : "Supported formats: JPG, PNG, PDF"}
            </div>
            <Button onClick={() => void handleUploadId()} disabled={uploading} className="rounded-xl">
              {uploading ? "Uploading..." : "Upload ID Documents"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
