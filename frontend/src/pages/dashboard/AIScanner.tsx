import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, CheckCircle2, Download, Leaf, Lock, ScanLine, ShieldCheck, Upload, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type ScanResult = {
  disease: string;
  scientificName: string;
  crop: string;
  confidence: number;
  severity: "Low" | "Moderate" | "High";
  spreadRisk: "Low" | "Moderate" | "High";
  affectedArea: string;
  description: string;
  treatment: string;
  organicAlternatives: string[];
  prevention: string;
};

type ScanHistoryItem = {
  id: string;
  disease: string;
  crop: string;
  severity: ScanResult["severity"];
  confidence: number;
  scannedAt: string;
};

const sampleResults: ScanResult[] = [
  {
    disease: "Tomato Late Blight",
    scientificName: "Phytophthora infestans",
    crop: "Tomato",
    confidence: 97.8,
    severity: "Moderate",
    spreadRisk: "High",
    affectedArea: "35-50%",
    description:
      "The crop image shows water-soaked lesions and dark blighting that suggest an active late blight infection with moderate spread across the affected tissue.",
    treatment: "Apply a copper-based fungicide within 48 hours and remove heavily infected leaves to reduce spread.",
    organicAlternatives: [
      "Apply an approved copper soap or copper hydroxide product at the recommended interval.",
      "Remove heavily infected plant material and destroy it away from the field.",
      "Improve airflow around the crop canopy to reduce moisture retention.",
    ],
    prevention: "Improve air flow, reduce leaf wetness, and avoid late evening irrigation.",
  },
  {
    disease: "Maize Leaf Streak",
    scientificName: "Maize streak virus",
    crop: "Maize",
    confidence: 95.4,
    severity: "High",
    spreadRisk: "High",
    affectedArea: "50-60%",
    description:
      "The image shows visible streaking and chlorotic damage across the leaf surface, consistent with a strong maize streak infection that is already spreading.",
    treatment: "Rogue out severely affected plants and start a targeted pest control plan for leafhoppers in the next spray cycle.",
    organicAlternatives: [
      "Remove severely affected plants early to reduce field pressure.",
      "Control alternate grass hosts around the plot to lower vector activity.",
      "Use neem-based pest suppression where suitable for early vector management.",
    ],
    prevention: "Use resistant seed varieties and maintain clean field edges before the next planting cycle.",
  },
  {
    disease: "Healthy Produce",
    scientificName: "No disease detected",
    crop: "Mixed crop",
    confidence: 99.1,
    severity: "Low",
    spreadRisk: "Low",
    affectedArea: "0-5%",
    description:
      "The scanned crop image does not show clear disease symptoms. Tissue color and surface structure appear largely normal in the captured area.",
    treatment: "No disease detected. Maintain your current irrigation and scouting schedule.",
    organicAlternatives: [
      "Continue using compost or organic foliar feeds as planned.",
      "Keep the field clean and remove weak plant tissue early.",
      "Maintain balanced soil moisture and avoid plant stress.",
    ],
    prevention: "Keep monitoring twice a week and continue feeding with balanced nutrients.",
  },
];

function ProGate() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-lg overflow-hidden rounded-[2.25rem] border border-emerald-200/60 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.92))] p-10 text-center shadow-[0_25px_80px_-40px_rgba(5,150,105,0.5)] dark:border-emerald-500/30 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_40%),linear-gradient(135deg,rgba(15,23,42,0.97),rgba(17,24,39,0.96))]"
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-100 text-primary shadow-inner">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">AI Crop Scanner</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Upgrade to Pro for faster diagnostics, treatment suggestions, and a cleaner field-health workflow built for daily scouting.
        </p>
        <div className="mt-6 grid gap-3 text-left text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 dark:border-white/10 dark:bg-background/60">
            <p className="font-semibold text-foreground">Instant diagnosis</p>
            <p className="mt-1">Identify likely crop diseases from a field image in seconds.</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 dark:border-white/10 dark:bg-background/60">
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useLocalStorage<ScanHistoryItem[]>("agrixl-scan-history", []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const formatRelativeTime = (value: string) => {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const scanningTips = useMemo(() => {
    if (!selectedImage) {
      return [
        "Use natural light when possible.",
        "Frame the affected leaf, fruit, or vegetable clearly against a simple background.",
        "Retake if the image is blurry or shadowed.",
      ];
    }

    if (!result) {
      return [
        "Keep one affected area centered before starting the scan.",
        "Avoid hands or tools covering the crop surface in the photo.",
        "If the crop is wet or dark, retake the image in brighter light.",
      ];
    }

    if (result.severity === "High") {
      return [
        "Isolate badly affected plants or produce quickly to reduce spread.",
        "Use the treatment plan soon and monitor nearby crops within 24 hours.",
        "Take another scan after intervention to compare progression.",
      ];
    }

    if (result.severity === "Moderate") {
      return [
        "Rescan a second angle of the same crop part to confirm consistency.",
        "Check neighboring plants for similar symptoms before treatment.",
        "Track changes over the next few days with repeat scans.",
      ];
    }

    return [
      "No major symptoms were detected, but keep scouting routinely.",
      "Scan again if color, texture, or spots change over time.",
      "Store this result and compare it with future scans from the same crop.",
    ];
  }, [result, selectedImage]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;

      setSelectedImage(reader.result);
      setResult(null);
      setCameraError(null);
      setCameraOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setCameraOpen(true);

      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 0);
    } catch {
      setCameraError("Camera access was blocked. You can still upload an image from your device.");
      setCameraOpen(false);
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSelectedImage(canvas.toDataURL("image/jpeg", 0.92));
    setResult(null);
    closeCamera();
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
        {
          id: crypto.randomUUID(),
          disease: nextResult.disease,
          crop: nextResult.crop,
          severity: nextResult.severity,
          confidence: nextResult.confidence,
          scannedAt: new Date().toISOString(),
        },
        ...current.slice(0, 5),
      ]);
    }, 2200);
  };

  const severityTone =
    result?.severity === "High"
      ? "text-red-600 bg-red-50 border-red-200"
      : result?.severity === "Moderate"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-emerald-700 bg-emerald-50 border-emerald-200";

  const treatmentItems = result?.treatment
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

  const preventionItems = result?.prevention
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadResult = () => {
    if (!result || !selectedImage) return;

    const generatedAt = new Date().toLocaleString();
    const preventionItems = result.prevention
      .split(".")
      .map((item) => item.trim())
      .filter(Boolean);
    const treatmentItems = result.treatment
      .split(".")
      .map((item) => item.trim())
      .filter(Boolean);

    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Crop Diagnosis Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #ffffff;
      color: #10231a;
      margin: 0;
      padding: 0;
    }
    .report {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 18px 16px;
      background: #17642f;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.2;
    }
    .meta {
      padding: 12px 16px 0;
      color: #6b7280;
      font-size: 14px;
    }
    .content {
      flex: 1;
      padding: 10px 16px 28px;
    }
    .footer {
      margin-top: auto;
      background: #17642f;
      color: #ffffff;
      padding: 14px 16px;
      font-size: 13px;
    }
    .top {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .image {
      width: 235px;
      height: 205px;
      object-fit: cover;
      display: block;
    }
    .summary {
      flex: 1;
    }
    .summary h2 {
      margin: 0 0 8px;
      font-size: 18px;
      color: #222222;
    }
    .latin {
      margin: 0 0 8px;
      color: #8b8b8b;
      font-style: italic;
    }
    .detail {
      margin: 0 0 6px;
      font-size: 14px;
      color: #444444;
    }
    .section {
      margin-top: 12px;
    }
    .section h3 {
      margin: 0 0 6px;
      color: #17642f;
      font-size: 18px;
    }
    .section p,
    .section li {
      font-size: 14px;
      line-height: 1.45;
      color: #4b5563;
    }
    .section ul {
      margin: 0;
      padding-left: 18px;
    }
    .section li {
      margin-bottom: 4px;
    }
    @media (max-width: 640px) {
      .top {
        flex-direction: column;
      }
      .image {
        width: 100%;
        height: auto;
      }
    }
  </style>
</head>
<body>
  <div class="report">
    <div class="header">
      <h1>Agrilink X AI Diagnosis Report</h1>
    </div>
    <div class="meta">Generated: ${generatedAt}</div>
    <div class="content">
      <div class="top">
        <img class="image" src="${selectedImage}" alt="Crop scan image" />
        <div class="summary">
          <h2>${result.disease}</h2>
          <p class="latin">${result.scientificName}</p>
          <p class="detail">Plant: ${result.crop}</p>
          <p class="detail">Confidence: ${result.confidence}%</p>
          <p class="detail">Severity: ${result.severity}</p>
          <p class="detail">Spread Risk: ${result.spreadRisk}</p>
          <p class="detail">Affected Area: ${result.affectedArea}</p>
        </div>
      </div>
      <div class="section">
        <h3>Description</h3>
        <p>${result.description}</p>
      </div>
      <div class="section">
        <h3>Treatment Plan</h3>
        <ul>${treatmentItems.map((item) => `<li>${item}.</li>`).join("")}</ul>
      </div>
      <div class="section">
        <h3>Organic Alternatives</h3>
        <ul>${result.organicAlternatives.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="section">
        <h3>Prevention Tips</h3>
        <ul>${preventionItems.map((item) => `<li>${item}.</li>`).join("")}</ul>
      </div>
    </div>
    <div class="footer">Agrilink X AI crop health analysis report.</div>
  </div>
</body>
</html>`;

    downloadFile("crop-diagnosis-report.html", reportHtml, "text/html;charset=utf-8");
  };

  return (
    <div className="space-y-6">
      <section className="px-1 py-2 sm:px-2">
        <div className="w-full max-w-5xl space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-emerald-700">
              <Leaf className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">AI Crop Diagnosis</span>
            </div>
            <h2 className="max-w-5xl break-words font-display text-[1.85rem] font-bold leading-[1.15] text-foreground sm:text-[2.2rem] lg:text-[2.5rem]">
              AI Disease Diagnosis
            </h2>
            <p className="max-w-4xl break-words text-sm leading-7 text-muted-foreground sm:text-[15px]">
              Upload a clear crop image for instant AI-powered analysis of a leaf, fruit, or vegetable with diagnosis guidance made for growers on the move.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden p-0">
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
          <canvas ref={canvasRef} className="hidden" />

          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-semibold text-foreground">Live scan panel</p>
              <p className="text-sm text-muted-foreground">Use the camera in the field or upload from your gallery.</p>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">AI Ready</div>
          </div>

          <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden bg-[#f5f7f6] p-6 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.98))]">
            {cameraOpen ? (
              <div className="w-full max-w-2xl text-center">
                <div className="overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-black shadow-md">
                  <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" />
                </div>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={captureFromCamera} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                    <Camera className="mr-2 h-4 w-4" /> Capture Photo
                  </Button>
                  <Button type="button" variant="outline" onClick={closeCamera} className="rounded-xl">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : scanning ? (
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
                <div className="absolute bottom-8 rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg backdrop-blur dark:bg-background/85 dark:text-emerald-300">
                  Analyzing crop image...
                </div>
              </>
            ) : selectedImage ? (
              <div className="w-full max-w-2xl text-center">
                <img src={selectedImage} alt="Selected crop" className="mx-auto aspect-video w-full rounded-[1.5rem] border border-emerald-200 bg-white object-cover shadow-md dark:border-emerald-500/30 dark:bg-card" />
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
                <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-[1.25rem] bg-transparent text-primary">
                  <Camera className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">Ready for a field check</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Capture a clear photo of the leaf, fruit, or vegetable in daylight for the best result. Focus on spots, streaks, rot, or discoloration.
                </p>
                {cameraError && <p className="mt-3 text-sm text-destructive">{cameraError}</p>}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={() => void openCamera()} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
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
            className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]"
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
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleDownloadResult} className="rounded-xl">
                    <Download className="mr-2 h-4 w-4" /> Download Diagnosis Result
                  </Button>
                </div>
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

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-emerald-200/80 bg-white p-5 shadow-sm dark:border-emerald-500/30 dark:bg-background/70">
                    <div className="flex items-center gap-3">
                      <ScanLine className="h-5 w-5 text-emerald-600" />
                      <div>
                        <h4 className="font-display text-xl font-bold text-foreground">Treatment Plan</h4>
                        <p className="text-sm text-muted-foreground">
                          Recommended next steps for {result.disease.toLowerCase()} on {result.crop.toLowerCase()}.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-4">
                      {treatmentItems.map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                          <p className="text-sm leading-7 text-foreground">{item}.</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-200/80 bg-white p-5 shadow-sm dark:border-emerald-500/30 dark:bg-background/70">
                    <div className="flex items-center gap-3">
                      <Leaf className="h-5 w-5 text-emerald-600" />
                      <div>
                        <h4 className="font-display text-xl font-bold text-foreground">Organic Alternatives</h4>
                        <p className="text-sm text-muted-foreground">
                          Lower-input options matched to this diagnosis result.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-4">
                      {result.organicAlternatives.map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                          <p className="text-sm leading-7 text-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-200/80 bg-white p-5 shadow-sm dark:border-emerald-500/30 dark:bg-background/70">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <div>
                        <h4 className="font-display text-xl font-bold text-foreground">Prevention Tips</h4>
                        <p className="text-sm text-muted-foreground">
                          Follow these steps after this diagnosis to reduce repeat spread.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-4">
                      {preventionItems.map((item, index) => (
                        <div key={item} className="flex items-start gap-3">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-600 text-[11px] font-semibold text-emerald-700">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-7 text-foreground">{item}.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-muted/30 text-center">
                <div>
                  <Leaf className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Diagnosis details, treatment plan, organic alternatives, and prevention tips will appear after a scan.
                  </p>
                </div>
              </div>
            )}
          </motion.section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-5 shadow-sm dark:bg-card/90">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold text-foreground">Scanning tips</p>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {scanningTips.map((tip, index) => (
                  <li key={tip} className="flex gap-2">
                    <span className="font-semibold text-foreground">{index + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-5 shadow-sm dark:bg-card/90">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <p className="font-semibold text-foreground">Recent scans</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {recentScans.length > 0 ? (
                  recentScans.map((scan) => (
                    <div key={scan.id} className="rounded-xl bg-muted/40 px-3 py-2">
                      <p className="font-medium text-foreground">{scan.disease}</p>
                      <p className="text-xs text-muted-foreground">
                        {scan.crop} • {scan.severity} • {scan.confidence}% • {formatRelativeTime(scan.scannedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-muted/40 px-3 py-2">
                    No scans yet. Your recent scan history will appear here.
                  </div>
                )}
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
