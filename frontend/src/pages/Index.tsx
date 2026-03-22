import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import IntelligenceSection from "@/components/landing/IntelligenceSection";
import CropSpotlightSection from "@/components/landing/CropSpotlightSection";
import MicroLoansSection from "@/components/landing/MicroLoansSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <IntelligenceSection />
      <CropSpotlightSection />
      <MicroLoansSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
