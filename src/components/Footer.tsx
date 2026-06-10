import { Coffee, MapPin, Phone, Mail, Instagram, Compass, ExternalLink } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { BrandLogo } from "../types";

interface FooterProps {
  setCurrentTab: (tab: string) => void;
  brandLogo: BrandLogo;
}

export default function Footer({ setCurrentTab, brandLogo }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-lokale-green border-t border-lokale-orange/30 text-stone-300 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-start">
          
          {/* Logo brand intro */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 font-normal">
              {brandLogo && brandLogo.type === "image" && brandLogo.image ? (
                <img 
                  src={brandLogo.image || null} 
                  alt="Logo" 
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover border border-lokale-orange/20"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-lokale-orange flex items-center justify-center border border-lokale-orange/20">
                  <Coffee className="w-4.5 h-4.5 text-lokale-green" />
                </div>
              )}
              <div>
                <span className="font-serif text-sm sm:text-base font-bold tracking-wider text-lokale-cream block">
                  {brandLogo ? brandLogo.text : "STUCK COFFEE & CIGAR"}
                </span>
                <span className="text-[8px] font-mono tracking-[0.1em] text-lokale-orange uppercase block -mt-1 leading-normal font-bold">
                  {brandLogo ? brandLogo.subtext : "Kopi & Cigar"}
                </span>
              </div>
            </div>
            <p className="text-stone-300/80 leading-relaxed font-light text-[11px]">
              {t("footer.intro")}
            </p>
          </div>

          {/* Table Navigations */}
          <div className="space-y-3.5">
            <h4 className="text-lokale-orange font-serif font-bold text-sm tracking-wide">{t("footer.directory")}</h4>
            <div className="space-y-2 flex flex-col font-light text-[11px] text-stone-300">
              <button onClick={() => setCurrentTab("home")} className="text-left hover:text-lokale-orange transition-colors cursor-pointer">{t("footer.loungeHome")}</button>
              <button onClick={() => setCurrentTab("menu")} className="text-left hover:text-lokale-orange transition-colors cursor-pointer">{t("footer.coffeeHumidor")}</button>
              <button onClick={() => setCurrentTab("sommelier")} className="text-left hover:text-lokale-orange transition-colors cursor-pointer">{t("footer.aiSommelier")}</button>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-3.5">
            <h4 className="text-lokale-orange font-serif font-bold text-sm tracking-wide">{t("footer.hoursTitle")}</h4>
            <div className="font-mono text-xs text-stone-200 font-medium">
              Open 07:00 AM - 11:00 PM
            </div>
            
            {/* Google Maps Location */}
            <div className="pt-3 border-t border-lokale-green-light/40">
              <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400 block mb-2 font-semibold">Our Location</span>
              <a 
                href="https://share.google/WnlqPznPuT7DNmDXr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group block p-3 rounded-xl bg-lokale-green-light/20 border border-lokale-orange/30 hover:bg-lokale-green-light/40 hover:border-lokale-orange/70 transition-all duration-300"
              >
                <div className="flex items-center space-x-2 text-lokale-cream font-medium text-xs">
                  <Compass className="w-4 h-4 text-lokale-orange group-hover:rotate-45 transition-transform duration-500" />
                  <span className="font-semibold text-stone-100">Stuck on Google Maps</span>
                </div>
                <p className="text-[10.5px] text-stone-300/80 mt-1.5 font-light leading-relaxed">
                  Kesawan, Medan Kota, Indonesia
                </p>
                <span className="inline-flex items-center space-x-1 text-[9.5px] text-lokale-orange font-mono font-bold mt-2 hover:underline">
                  <span>Open Maps</span>
                  <span>→</span>
                </span>
              </a>
            </div>
          </div>

          {/* Dynamic grounding address details */}
          <div className="space-y-3.5">
            <h4 className="text-lokale-orange font-serif font-bold text-sm tracking-wide">{t("footer.scbdSanctuary")}</h4>
            <div className="space-y-2 leading-relaxed text-stone-300/85 font-light text-[11px]">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-lokale-orange flex-shrink-0 mt-0.5" />
                <span>Jalan Sutoyo Sismowiharjo, Kesawan, Kec. Medan Bar., Kota Medan, Sumatera Utara 20111.</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-lokale-orange flex-shrink-0" />
                <span>+62 61 451 8821</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-lokale-orange flex-shrink-0" />
                <span>concierge@stuckcoffeecigar.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer closing signatures */}
        <div className="border-t border-lokale-green-light/40 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 font-mono">
          <p>© {currentYear} {brandLogo ? brandLogo.text : "Stuck Coffee & Cigar"} | {brandLogo ? brandLogo.subtext : "#stuckinmedan"}. All Rights Reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <span className="hover:text-lokale-orange cursor-pointer">{t("footer.sitemap")}</span>
            <span>•</span>
            <span className="hover:text-lokale-orange cursor-pointer">{t("footer.terms")}</span>
            <span>•</span>
            <span className="hover:text-lokale-orange cursor-pointer flex items-center space-x-1">
              <span>{t("footer.maps")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
