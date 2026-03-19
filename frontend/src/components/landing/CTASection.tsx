import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            The Future of African
            <br />
            Agriculture Starts <span className="text-gradient-gold">Now</span>
          </h2>
          <p className="text-agri-green-200/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Join 10,000+ farmers and buyers already transforming how food moves from
            farm to table across Kenya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-10 h-14 bg-gold-gradient text-foreground font-semibold hover:opacity-90">
              Join the Waitlist
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-10 h-14 border-agri-green-200/30 text-primary-foreground hover:bg-agri-green-700/30 hover:text-primary-foreground"
            >
              Talk to Our Team
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
