import DashboardShell from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, CheckCircle2, Leaf, Lock, ScanLine, ShieldCheck, Sparkles, Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type ScanResult = {
  disease: string;
  confidence: number;
  severity: "Low" | "Moderate" | "High";
  treatment: string;
  prevention: string;
};

const sampleResults: ScanResult[] = [
  {
    disease: "Tomato Late Blight",
    confidence: 97.8,
    severity: "Moderate",
    treatment: "Apply a copper-based fungicide within 48 hours and remove heavily infected leaves to reduce spread.",
    prevention: "Improve air flow, reduce leaf wetness, and avoid late evening irrigation.",
  },
  {
    disease: "Maize Leaf Streak",
    confidence: 95.4,
    severity: "High",
    treatment: "Rogue out severely affected plants and start a targeted pest control plan for leafhoppers in the next spray cycle.",
    prevention: "Use resistant seed varieties and maintain clean field edges before the next planting cycle.",
  },
  {
    disease: "Healthy Leaf",
    confidence: 99.1,
    severity: "Low",
    treatment: "No disease detected. Maintain your current irrigation and scouting schedule.",
    prevention: "Keep monitoring twice a week and continue feeding with balanced nutrients.",
  },
];

function ProGate() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-lg overflow-hidden rounded-[2.25rem] border border-emerald-200/60 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.92))] p-10 text-center shadow-[0_25px_80px_-40px_rgba(5,150,105,0.5)]"
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-100 text-primary shadow-inner">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">AI Crop Scanner</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Upgrade to Pro for faster diagnostics, treatment suggestions, and a cleaner field-health workflow built for daily scouting.
        </p>
        <div className="mt-6 grid gap-3 text-left text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
            <p className="font-semibold text-foreground">Instant diagnosis</p>
            <p className="mt-1">Identify likely crop diseases from a field image in seconds.</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
            <p className="font-semibold text-foreground">Treatment guidance</p>
            <p className="mt-1">Get a practical next-step plan and prevention reminders.</p>
          </div>
        </div>
        <Button asChild className="mt-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/dashboard/upgrade">
            <Zap className="mr-2 h-4 w-4" /> Upgrade to Pro
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}

function ScannerLab() {
  const [scanning, setScanning] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<string[]>([
    "Healthy leaf review • 2 days ago",
    "Tomato late blight alert • 5 days ago",
  ]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scannerStats = useMemo(
    () => [
      { label: "Model confidence", value: result ? `${result.confidence}%` : "99.2%" },
      { label: "Average scan time", value: "4 sec" },
      { label: "Advisory mode", value: "Field-ready" },
    ],
    [result],
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const startScan = () => {
    if (!selectedImage) return;

    setScanning(true);
    setResult(null);

    window.setTimeout(() => {
      const nextResult = sampleResults[Math.floor(Math.random() * sampleResults.length)];
      setScanning(false);
      setResult(nextResult);
      setRecentScans((current) => [
        `${nextResult.disease} • just now`,
        ...current.slice(0, 3),
      ]);
    }, 2200);
  };

  const severityTone =
    result?.severity === "High"
      ? "text-red-600 bg-red-50 border-red-200"
      : result?.severity === "Moderate"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-emerald-700 bg-emerald-50 border-emerald-200";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.88))] p-6 shadow-[0_20px_60px_-28px_rgba(5,150,105,0.35)]">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Crop Intelligence
            </span>
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Scan crop health with a cleaner field workflow</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Upload a leaf photo, review likely disease severity, and act quickly with treatment guidance made for growers on the move.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {scannerStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]"
        >
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleImageSelect} />
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />

          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Live scan panel</p>
              <p className="text-sm text-muted-foreground">Use camera capture in the field or upload from your gallery.</p>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">AI Ready</div>
          </div>

          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-emerald-300/70 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(236,253,245,0.9))] p-6">
            {scanning ? (
              <>
                {selectedImage && (
                  <img src={selectedImage} alt="Scanning crop" className="absolute inset-0 h-full w-full object-cover opacity-35 grayscale" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.1))]" />
                <div className="relative h-60 w-60">
                  <div className="absolute inset-0 rounded-full border border-emerald-200" />
                  <div className="absolute inset-4 rounded-full border border-emerald-200/80" />
                  <div className="absolute inset-8 rounded-full border border-emerald-200/60" />
                  <div className="radar-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.3)_56deg,transparent_70deg)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="sensor-pulse h-4 w-4 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="absolute bottom-8 rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg backdrop-blur">
                  Analyzing crop image...
                </div>
              </>
            ) : selectedImage ? (
              <div className="w-full max-w-2xl text-center">
                <img src={selectedImage} alt="Selected crop" className="mx-auto aspect-video w-full rounded-[1.5rem] border border-emerald-200 bg-white object-cover shadow-md" />
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={startScan} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                    <ScanLine className="mr-2 h-4 w-4" /> Start Diagnosis
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedImage(null)} className="rounded-xl">
                    Choose Another Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-100 text-primary">
                  <Camera className="h-9 w-9" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">Ready for a field check</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Capture a clear photo of the leaf surface in daylight for the best result. Focus on spots, streaks, or discoloration.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={() => cameraInputRef.current?.click()} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                    <Camera className="mr-2 h-4 w-4" /> Open Camera
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-xl">
                    <Upload className="mr-2 h-4 w-4" /> Upload Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Diagnosis Result</h3>
                <p className="text-sm text-muted-foreground">Review severity, confidence, and what to do next.</p>
              </div>
            </div>

            {result ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-border bg-muted/40 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Likely diagnosis</p>
                    <p className="mt-2 font-display text-xl font-bold text-foreground">{result.disease}</p>
                  </div>
                  <div className={`rounded-[1.25rem] border p-4 ${severityTone}`}>
                    <p className="text-[11px] uppercase tracking-[0.18em]">Severity</p>
                    <p className="mt-2 font-display text-xl font-bold">{result.severity}</p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Model confidence</p>
                    <p className="font-semibold text-foreground">{result.confidence}%</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div className="h-full rounded-full bg-emerald-gradient" style={{ width: `${result.confidence}%` }} />
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">Treatment plan</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-950">{result.treatment}</p>
                </div>

                <div className="rounded-[1.25rem] border border-sky-200 bg-sky-50/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-sky-700">Prevention</p>
                  <p className="mt-2 text-sm leading-6 text-sky-950">{result.prevention}</p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-muted/30 text-center">
                <div>
                  <Leaf className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Diagnosis details will appear after a scan.</p>
                </div>
              </div>
            )}
          </motion.section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold text-foreground">Scanning tips</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Use natural light when possible.</li>
                <li>Frame one leaf clearly against a simple background.</li>
                <li>Retake if the image is blurry or shadowed.</li>
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <p className="font-semibold text-foreground">Recent scans</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {recentScans.map((scan, index) => (
                  <div key={`${scan}-${index}`} className="rounded-xl bg-muted/40 px-3 py-2">
                    {scan}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AIScanner() {
  const { role } = useAuth();
  const hasAccess = role === "farmer_pro" || role === "buyer_enterprise";

  return <DashboardShell title="AI Crop Scanner">{hasAccess ? <ScannerLab /> : <ProGate />}</DashboardShell>;
}
