import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import avocadoImage from "@/assets/Avocados Fruits.jpg";
import maizeImage from "@/assets/maize.jpg";
import onionImage from "@/assets/onions.jpg";
import tomatoImage from "@/assets/tomatoes.jpg";
import vegetablesImage from "@/assets/vegetables.jpg";

const VISIBLE_CROPS = 3;
const SLIDE_DURATION_MS = 800;
const SLIDE_INTERVAL_MS = 2000;

const crops = [
  {
    name: "Tomatoes",
    headline: "Fresh harvest highlights",
    image: tomatoImage,
  },
  {
    name: "Maize",
    headline: "Healthy fields in focus",
    image: maizeImage,
  },
  {
    name: "Avocados",
    headline: "Produce showcase",
    image: avocadoImage,
  },
  {
    name: "Onions",
    headline: "Color from every harvest",
    image: onionImage,
  },
  {
    name: "Vegetables",
    headline: "Vegetable harvest collection",
    image: vegetablesImage,
  },
];

export default function CropSpotlightSection() {
  const [activeIndex, setActiveIndex] = useState(VISIBLE_CROPS);
  const [isResetting, setIsResetting] = useState(false);
  const loopedCrops = [...crops.slice(-VISIBLE_CROPS), ...crops, ...crops.slice(0, VISIBLE_CROPS)];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsResetting(false);
      setActiveIndex((current) => current + 1);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeIndex !== crops.length + VISIBLE_CROPS) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setIsResetting(true);
      setActiveIndex(VISIBLE_CROPS);
    }, SLIDE_DURATION_MS);

    return () => window.clearTimeout(resetTimer);
  }, [activeIndex]);

  useEffect(() => {
    if (!isResetting) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setIsResetting(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isResetting]);

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="container">
        <div className="mb-6 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-accent">
            Crop Gallery
          </span>
          <h2 className="mt-2 text-2xl font-display font-bold text-foreground md:text-4xl">
            Fresh Produce
          </h2>
        </div>

        <div className="mx-auto max-w-5xl overflow-hidden rounded-[1.5rem]">
          <motion.div
            animate={{ x: `-${activeIndex * (100 / VISIBLE_CROPS)}%` }}
            transition={{ duration: isResetting ? 0 : SLIDE_DURATION_MS / 1000, ease: "easeInOut" }}
            className="flex"
          >
            {loopedCrops.map((crop, index) => (
              <div key={`${crop.name}-${index}`} className="relative min-w-full md:min-w-[33.3333%]">
                <img
                  src={crop.image}
                  alt={crop.name}
                  className="h-[200px] w-full object-cover md:h-[240px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                  <h3 className="mt-1 text-2xl font-display font-bold text-white md:text-4xl">
                    {crop.headline}
                  </h3>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
