import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-agri-gold-500 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary blur-[100px]" />
      </div>

      <div className="container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6 leading-tight">
            The Future of Kenyan
            <br />
            Agriculture Starts <span className="text-gradient-gold">Now</span>
          </h2>
          <p className="text-agri-green-200/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Join 10,000+ farmers and buyers already transforming how food moves from
            farm to table across Kenya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-10 text-base font-semibold text-foreground hover:opacity-90 bg-gold-gradient">
              <Link to="/login">
                Join
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" className="h-14 px-10 text-base font-semibold text-white hover:bg-[#0b4a24] bg-[#0f5c2e]">
              <a href="#buyer-enterprise">
                Buyer Enterprise
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
