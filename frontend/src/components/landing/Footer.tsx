const links = {
  Product: ["Features", "Pricing", "API", "Mobile App"],
  Company: ["About", "Careers", "Blog", "Press"],
  Resources: ["Documentation", "Help Center", "Community", "Partners"],
  Legal: ["Privacy", "Terms", "Cookie Policy"],
};

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold">A</span>
              </div>
              <span className="font-display font-bold text-lg">AgriLink X</span>
            </div>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              The intelligent agricultural commerce platform connecting Africa's farmers to global markets.
            </p>
          </div>
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-display font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            © 2026 AgriLink X. All rights reserved. Made with ❤️ in Nairobi.
          </p>
          <div className="flex gap-6">
            {["Twitter", "LinkedIn", "Instagram"].map((s) => (
              <a key={s} href="#" className="text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
