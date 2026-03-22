import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  CreditCard,
  KeyRound,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UploadCloud,
  UserCircle2,
  Wallet,
} from "lucide-react";
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
  const [searchParams] = useSearchParams();
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
  const [activeSection, setActiveSection] = useState<
    "personal" | "contact" | "payout" | "security" | "verification"
  >("personal");

  const photoPreview = useMemo(() => localPhotoPreview || profile?.photo_url || "", [localPhotoPreview, profile?.photo_url]);

  const profileCompletion = useMemo(() => {
    const fields = [
      profileForm.full_name.trim(),
      profileForm.phone.trim(),
      profileForm.county.trim(),
      profileForm.bio.trim(),
      profileForm.payout_method,
    ];

    if (profileForm.payout_method === "mpesa") {
      fields.push(profileForm.payout_mpesa_number.trim());
    }

    if (profileForm.payout_method === "bank") {
      fields.push(profileForm.bank_name.trim(), profileForm.bank_account_name.trim(), profileForm.bank_account_number.trim());
    }

    const completed = fields.filter(Boolean).length;
    return Math.max(20, Math.round((completed / fields.length) * 100));
  }, [profileForm]);

  useEffect(() => {
    const section = searchParams.get("section");
    if (
      section === "personal" ||
      section === "contact" ||
      section === "payout" ||
      section === "security" ||
      section === "verification"
    ) {
      setActiveSection(section);
    }
  }, [searchParams]);

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
        const { error: uploadError } = await supabase.storage.from("profile-photos").upload(filePath, file, {
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
      <div className="space-y-6">
        <section className="bento-card overflow-hidden">
          <div className="rounded-[1.75rem] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,250,0.9))] p-5 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94))]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start lg:w-[360px] lg:flex-col lg:items-center">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/30">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-14 w-14 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center sm:text-left lg:text-center">
                  <h2 className="font-display text-2xl font-bold text-foreground">{profileForm.full_name || "Your Name"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{user?.email || "Signed in user"}</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {profileForm.county || "County not set"}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void handleSaveProfile()} disabled={isSavingProfile} className="rounded-xl">
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                  <label
                    className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold dark:bg-card/90 ${
                      photoUploading ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {photoUploading ? "Uploading..." : "Change Photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhotoUpload(e)} />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:max-w-md">
                  <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-center dark:bg-background/50">
                    <p className="font-display text-xl font-bold text-foreground">{profileCompletion}%</p>
                    <p className="text-xs text-muted-foreground">Profile</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-center dark:bg-background/50">
                    <p className="font-display text-xl font-bold text-foreground">{status === "verified" ? "Yes" : "No"}</p>
                    <p className="text-xs text-muted-foreground">Verified</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-center dark:bg-background/50">
                    <p className="font-display text-xl font-bold text-foreground">{profileForm.payout_method || "None"}</p>
                    <p className="text-xs text-muted-foreground">Payout</p>
                  </div>
                </div>

                <div className="max-w-2xl">
                  <p className="text-sm font-semibold text-foreground">Bio</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {profileForm.bio || "Add a short bio so buyers and other farmers understand who you are and what you do."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="bento-card p-0 overflow-hidden">
            {[
              { id: "personal", label: "Personal Details", icon: UserCircle2 },
              { id: "contact", label: "Contacts Details", icon: Phone },
              { id: "payout", label: "Payout Details", icon: Wallet },
              { id: "security", label: "Change Password", icon: KeyRound },
              { id: "verification", label: "Verification", icon: ShieldCheck },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id as typeof activeSection)}
                className={`flex w-full items-center gap-3 border-b border-border px-5 py-4 text-left text-sm font-semibold transition-colors last:border-b-0 ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </aside>

          <div className="space-y-6">
            {activeSection === "personal" && (
              <section className="bento-card">
                <h3 className="font-display text-xl font-bold text-foreground">Personal Details</h3>
                <p className="mt-1 text-sm text-muted-foreground">Name, bio, and the photo people recognize first.</p>
                <div className="mt-5 space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/30">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle2 className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <label
                      className={`inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold dark:bg-card/90 ${
                        photoUploading ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      {photoUploading ? "Uploading..." : "Change Photo"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhotoUpload(e)} />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>About You</Label>
                    <Textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="min-h-[120px] rounded-xl bg-background dark:bg-card/90"
                    />
                  </div>
                </div>
              </section>
            )}

            {activeSection === "contact" && (
              <section className="bento-card">
                <h3 className="font-display text-xl font-bold text-foreground">Contacts Details</h3>
                <p className="mt-1 text-sm text-muted-foreground">How buyers and the platform identify your location and number.</p>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>County / Location</Label>
                    <Input value={profileForm.county} onChange={(e) => setProfileForm({ ...profileForm, county: e.target.value })} className="rounded-xl" />
                  </div>
                </div>
              </section>
            )}

            {activeSection === "payout" && (
              <section className="bento-card">
                <h3 className="font-display text-xl font-bold text-foreground">Payout Details</h3>
                <p className="mt-1 text-sm text-muted-foreground">Choose where money should go after successful buyer payment.</p>
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
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
                    <div className="space-y-2">
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input value={profileForm.bank_name} onChange={(e) => setProfileForm({ ...profileForm, bank_name: e.target.value })} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input value={profileForm.bank_account_name} onChange={(e) => setProfileForm({ ...profileForm, bank_account_name: e.target.value })} className="rounded-xl" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Account Number</Label>
                        <Input value={profileForm.bank_account_number} onChange={(e) => setProfileForm({ ...profileForm, bank_account_number: e.target.value })} className="rounded-xl" />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeSection === "security" && (
              <section className="bento-card">
                <h3 className="font-display text-xl font-bold text-foreground">Change Password</h3>
                <p className="mt-1 text-sm text-muted-foreground">Update your account password.</p>
                <div className="mt-5 space-y-4">
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
              </section>
            )}

            {activeSection === "verification" && (
              <section className="bento-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">Verification</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Identity confirmation for trust and payouts.</p>
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

                <div className="mt-5 grid grid-cols-1 gap-4">
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
              </section>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
