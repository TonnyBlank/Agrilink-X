import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Edit3, MapPin, Package, Ruler, Shield, Sprout, Tractor, Trees, Video, Wheat } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useMyProducts } from "@/hooks/useProducts";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const farmChecklist = [
  { key: "county", label: "Location added" },
  { key: "farm_size", label: "Farm size recorded" },
  { key: "main_crops", label: "Main crops listed" },
  { key: "bio", label: "Farm story written" },
];

const countyOptions = [
  "Bungoma",
  "Embu",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Machakos",
  "Meru",
  "Mombasa",
  "Murang'a",
  "Nakuru",
  "Narok",
  "Nyeri",
  "Siaya",
  "Trans Nzoia",
  "Uasin Gishu",
];

const subCountyOptions: Record<string, string[]> = {
  Bungoma: ["Bumula", "Kabuchai", "Kimilili", "Mt. Elgon", "Tongaren", "Webuye East", "Webuye West"],
  Embu: ["Manyatta", "Mbeere North", "Mbeere South", "Runyenjes"],
  Kakamega: ["Butere", "Khwisero", "Lugari", "Lurambi", "Malava", "Matungu", "Mumias East", "Navakholo"],
  Kericho: ["Ainamoi", "Belgut", "Bureti", "Kipkelion East", "Kipkelion West", "Soin/Sigowet"],
  Kiambu: ["Gatundu North", "Gatundu South", "Juja", "Kabete", "Kiambaa", "Kikuyu", "Limuru", "Ruiru", "Thika Town"],
  Kilifi: ["Ganze", "Kaloleni", "Kilifi North", "Kilifi South", "Malindi", "Magarini", "Rabai"],
  Kirinyaga: ["Gichugu", "Kirinyaga Central", "Mwea East", "Mwea West", "Ndia"],
  Kisii: ["Bomachoge Borabu", "Bomachoge Chache", "Bonchari", "Kitutu Chache North", "Kitutu Chache South", "Nyaribari Chache", "Nyaribari Masaba"],
  Kisumu: ["Kisumu Central", "Kisumu East", "Kisumu West", "Muhoroni", "Nyakach", "Nyando", "Seme"],
  Machakos: ["Athi River", "Kangundo", "Kathiani", "Masinga", "Matungulu", "Mavoko", "Mwala", "Yatta"],
  Meru: ["Buuri", "Igembe Central", "Igembe North", "Igembe South", "Imenti Central", "Imenti North", "Imenti South", "Tigania East", "Tigania West"],
  Mombasa: ["Changamwe", "Jomvu", "Kisauni", "Likoni", "Mvita", "Nyali"],
  "Murang'a": ["Gatanga", "Kahuro", "Kandara", "Kangema", "Kigumo", "Kiharu", "Mathioya"],
  Nakuru: ["Bahati", "Gilgil", "Kuresoi North", "Kuresoi South", "Molo", "Naivasha", "Nakuru Town East", "Nakuru Town West", "Njoro", "Rongai", "Subukia"],
  Narok: ["Emurua Dikirr", "Kilgoris", "Narok East", "Narok North", "Narok South", "Narok West"],
  Nyeri: ["Kieni East", "Kieni West", "Mathira East", "Mathira West", "Mukurweini", "Nyeri Central", "Othaya", "Tetu"],
  Siaya: ["Alego Usonga", "Bondo", "Gem", "Rarieda", "Ugenya", "Unguja"],
  "Trans Nzoia": ["Cherangany", "Endebess", "Kiminini", "Kwanza", "Saboti"],
  "Uasin Gishu": ["Ainabkoi", "Kapseret", "Kesses", "Moiben", "Soy", "Turbo"],
};

const farmSizeOptions = ["Under 1 Acre", "1-3 Acres", "4-10 Acres", "11-25 Acres", "26-50 Acres", "50+ Acres"];
const cropOptions = ["Maize", "Beans", "Tomatoes", "Potatoes", "Onions", "Cabbage", "Spinach", "Kale", "Avocado", "Bananas", "Coffee", "Tea", "Rice", "Wheat", "Dairy Feed"];

export default function MyFarm() {
  const { profile, refreshProfile } = useAuth();
  const { products } = useMyProducts();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subCounty, setSubCounty] = useState<string>(() => localStorage.getItem("farm_sub_county") || "");
  const [formData, setFormData] = useState({
    county: "",
    farm_size: "",
    main_crops: "",
    custom_crops: "",
    bio: "",
    sub_county: "",
  });
  const bioCharacterLimit = 50;

  const profileCompletion = useMemo(() => {
    const checks = {
      county: Boolean(profile?.county),
      farm_size: Boolean(profile?.farm_size),
      main_crops: Boolean(profile?.main_crops?.length),
      bio: Boolean(profile?.bio),
    };

    const completed = Object.values(checks).filter(Boolean).length;
    return {
      checks,
      completed,
      percent: Math.round((completed / farmChecklist.length) * 100),
    };
  }, [profile]);

  const farmInsights = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const videoListings = products.filter((product) => product.video_url).length;
    const categories = new Set(products.map((product) => product.category).filter(Boolean));

    return {
      totalListings: products.length,
      totalStock,
      videoListings,
      categories: categories.size,
    };
  }, [products]);

  const topCrops = useMemo(() => {
    return profile?.main_crops?.slice(0, 4) ?? [];
  }, [profile]);

  const handleEdit = () => {
    setFormData({
      county: profile?.county || "",
      farm_size: profile?.farm_size || "",
      main_crops: (profile?.main_crops || []).filter((crop) => cropOptions.includes(crop)).join(", "),
      custom_crops: (profile?.main_crops || []).filter((crop) => !cropOptions.includes(crop)).join(", "),
      bio: profile?.bio || "",
      sub_county: localStorage.getItem("farm_sub_county") || "",
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem("farm_sub_county", formData.sub_county);
    setSubCounty(formData.sub_county);

    if (formData.bio.trim().length > bioCharacterLimit) {
      toast.error(`About your farm must be ${bioCharacterLimit} characters or less.`);
      setIsSaving(false);
      return;
    }

    try {
      const selectedCrops = formData.main_crops
        .split(",")
        .map((crop) => crop.trim())
        .filter(Boolean);
      const customCrops = formData.custom_crops
        .split(",")
        .map((crop) => crop.trim())
        .filter(Boolean);

      await apiFetch("/profiles/me", {
        method: "PATCH",
        body: {
          county: formData.county,
          farm_size: formData.farm_size,
          main_crops: [...new Set([...selectedCrops, ...customCrops])],
          bio: formData.bio,
        } as unknown as BodyInit,
      });

      toast.success("Farm profile updated successfully!");
      await refreshProfile();
      setIsEditOpen(false);
    } catch (error) {
      toast.error("Failed to update profile: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const availableSubCounties = useMemo(() => subCountyOptions[formData.county] || [], [formData.county]);

  const selectedCropValues = useMemo(
    () =>
      formData.main_crops
        .split(",")
        .map((crop) => crop.trim())
        .filter(Boolean),
    [formData.main_crops],
  );

  const toggleCrop = (crop: string) => {
    const nextSelected = selectedCropValues.includes(crop)
      ? selectedCropValues.filter((item) => item !== crop)
      : [...selectedCropValues, crop];

    setFormData((current) => ({
      ...current,
      main_crops: nextSelected.join(", "),
    }));
  };

  return (
    <DashboardShell title="My Farm">
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Tractor className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Farm Command</span>
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                  Build a stronger farm profile buyers can trust
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Keep your farm details complete, track your listed produce, and show buyers where your harvest is coming from.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:w-[420px] lg:shrink-0">
              <div className="rounded-lg bg-muted/35 p-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{profileCompletion.percent}%</p>
              </div>
              <div className="rounded-lg bg-muted/35 p-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Package className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Listings</p>
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{farmInsights.totalListings}</p>
              </div>
              <div className="rounded-lg bg-muted/35 p-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Video className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Video</p>
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{farmInsights.videoListings}</p>
              </div>
              <div className="rounded-lg bg-muted/35 p-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Sprout className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Stock</p>
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{farmInsights.totalStock}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">Farm Profile</h3>
                  <p className="mt-1 text-sm text-muted-foreground">The details here help buyers understand your farm quickly.</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={handleEdit}>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Location</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {subCounty ? `${subCounty}, ` : ""}
                        {profile?.county || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <Ruler className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Farm Size</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{profile?.farm_size || "Not set"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <Wheat className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Main Crops</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {profile?.main_crops?.join(", ") || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Readiness</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {profileCompletion.percent >= 75 ? "Buyer ready" : "Needs a few details"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[linear-gradient(135deg,rgba(236,253,245,0.9),rgba(255,255,255,0.95))] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">About the Farm</p>
                <p className="mt-2 text-sm leading-7 text-foreground">
                  {profile?.bio || "Add a short story about your farm, your growing methods, and what makes your produce special."}
                </p>
              </div>

              {!!topCrops.length && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Crop Focus</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topCrops.map((crop) => (
                      <span key={crop} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">Farm Location Map</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Your saved location details are shown here in a lighter, more stable format.</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">Optional</span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.95))] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Primary Area</p>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">{profile?.county || "County not set"}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {subCounty || "Add a sub-county in your farm profile to make your location more specific."}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-border bg-muted/30 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Location Snapshot</p>
                  <div className="mt-4 space-y-3 text-sm text-foreground">
                    <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                      <span className="text-muted-foreground">County</span>
                      <span className="font-semibold">{profile?.county || "Not set"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                      <span className="text-muted-foreground">Sub-county</span>
                      <span className="font-semibold">{subCounty || "Not set"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                      <span className="text-muted-foreground">Farm size</span>
                      <span className="font-semibold">{profile?.farm_size || "Not set"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-6"
          >
            <div className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)]">
              <h3 className="font-display text-xl font-bold text-foreground">Farm Readiness</h3>
              <p className="mt-1 text-sm text-muted-foreground">Complete these details to make your farm profile stronger.</p>
              <div className="mt-5 space-y-3">
                {farmChecklist.map((item) => {
                  const complete = profileCompletion.checks[item.key as keyof typeof profileCompletion.checks];
                  return (
                    <div key={item.key} className="flex items-center justify-between rounded-2xl bg-muted/35 px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {complete ? "Done" : "Missing"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)]">
              <h3 className="font-display text-xl font-bold text-foreground">Listing Summary</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-muted/40 p-4 text-center">
                  <Package className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">{farmInsights.totalListings}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 text-center">
                  <Video className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">{farmInsights.videoListings}</p>
                  <p className="text-xs text-muted-foreground">With Video</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 text-center">
                  <Trees className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">{farmInsights.categories}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 text-center">
                  <Sprout className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">{farmInsights.totalStock}</p>
                  <p className="text-xs text-muted-foreground">Stock Units</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.95))] p-6 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.2)]">
              <h3 className="font-display text-xl font-bold text-foreground">What Buyers Want</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>Keep your county and farm size filled in so your profile feels trustworthy.</p>
                <p>Add clear crop names and a short farm story so buyers know what you specialize in.</p>
                <p>Publish product videos from Upload & Sell to help buyers judge freshness faster.</p>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Farm Profile</DialogTitle>
            <DialogDescription>Update your farm details to build trust with buyers.</DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Select
                  value={formData.county}
                  onValueChange={(value) => setFormData({ ...formData, county: value, sub_county: "" })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose county" />
                  </SelectTrigger>
                  <SelectContent>
                    {countyOptions.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_county">Sub-County</Label>
                <Select
                  value={formData.sub_county}
                  onValueChange={(value) => setFormData({ ...formData, sub_county: value })}
                  disabled={!formData.county}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={formData.county ? "Choose sub-county" : "Choose county first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubCounties.map((subCountyOption) => (
                      <SelectItem key={subCountyOption} value={subCountyOption}>
                        {subCountyOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="farm_size">Farm Size</Label>
              <Select
                value={formData.farm_size}
                onValueChange={(value) => setFormData({ ...formData, farm_size: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose farm size" />
                </SelectTrigger>
                <SelectContent>
                  {farmSizeOptions.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="main_crops">Main Crops</Label>
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
                {cropOptions.map((crop) => (
                  <label key={crop} className="flex items-center gap-3 rounded-xl bg-white/80 px-3 py-2 text-sm">
                    <Checkbox checked={selectedCropValues.includes(crop)} onCheckedChange={() => toggleCrop(crop)} />
                    <span className="font-medium text-foreground">{crop}</span>
                  </label>
                ))}
              </div>
              <Input
                id="main_crops"
                value={formData.custom_crops}
                onChange={(e) => setFormData({ ...formData, custom_crops: e.target.value })}
                placeholder="Type other crops not listed, separated by commas"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Use the checkboxes for common crops, and type any extra crops here.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">About your farm</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, bioCharacterLimit) })}
                placeholder="Short farm summary..."
                className="resize-none rounded-xl"
                maxLength={bioCharacterLimit}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{formData.bio.length}/{bioCharacterLimit} characters</p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="rounded-xl">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
