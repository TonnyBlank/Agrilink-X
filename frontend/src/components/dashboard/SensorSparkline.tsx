import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface SensorSparklineProps {
  label: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  min: number;
  max: number;
  baseValue: number;
  variance: number;
}

function generatePoints(count: number, base: number, variance: number, min: number, max: number): number[] {
  const pts: number[] = [];
  let val = base;
  for (let i = 0; i < count; i++) {
    val += (Math.random() - 0.5) * variance;
    val = Math.max(min, Math.min(max, val));
    pts.push(val);
  }
  return pts;
}

function buildPath(points: number[], width: number, height: number, min: number, max: number): string {
  const padding = 4;
  const w = width;
  const h = height - padding * 2;
  const range = max - min || 1;

  return points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = padding + h - ((p - min) / range) * h;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export default function SensorSparkline({ label, unit, icon, color, min, max, baseValue, variance }: SensorSparklineProps) {
  const [points, setPoints] = useState(() => generatePoints(20, baseValue, variance, min, max));
  const currentValue = points[points.length - 1];

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => {
        const next = [...prev.slice(1)];
        let last = prev[prev.length - 1];
        last += (Math.random() - 0.5) * variance;
        last = Math.max(min, Math.min(max, last));
        next.push(last);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [min, max, variance]);

  const svgWidth = 120;
  const svgHeight = 40;
  const path = buildPath(points, svgWidth, svgHeight, min, max);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`} style={{
        background: `hsl(${color} / 0.1)`,
      }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-display font-bold text-foreground">
          {currentValue.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
      <svg width={svgWidth} height={svgHeight} className="shrink-0">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={`hsl(${color} / 0.3)`} />
            <stop offset="100%" stopColor={`hsl(${color})`} />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={`url(#grad-${label})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}
