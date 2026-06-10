import { Coffee, ShoppingBag, Menu as MenuIcon, X, Sparkles, MessageSquare, Shield, Clock } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { BrandLogo } from "../types";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  cartCount: number;
  userPoints: number;
  userLevel: string;
  brandLogo: BrandLogo;
}

export default function Navbar({ currentTab, setCurrentTab, cartCount, userPoints, userLevel, brandLogo }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const navItems = [
    { id: "home", label: t("nav.home") },
    { id: "menu", label: t("nav.menu") },
    { id: "sommelier", label: t("nav.sommelier") },
    { id: "admin", label: t("nav.admin"), luxury: true }
  ];

  return (
    <header className="sticky top-0 z-50 bg-lokale-cream/95 backdrop-blur-md border-b border-lokale-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo - Styled beautifully in Lokale Coffee forest green */}
          <div 
            onClick={() => setCurrentTab("home")} 
            className="flex items-center space-x-3 cursor-pointer group animate-fadeIn"
          >
            <div className="w-10 h-10 rounded-2xl bg-lokale-green/10 group-hover:bg-lokale-orange/15 transition-all text-lokale-green group-hover:text-lokale-orange flex items-center justify-center border border-lokale-green/20 group-hover:border-lokale-orange/30 shadow-3xs">
              <Coffee className="w-5.5 h-5.5 transform group-hover:rotate-12 transition-all duration-350" />
            </div>
            <div>
              <span className="font-serif text-base sm:text-lg font-bold tracking-wider text-lokale-green block group-hover:text-lokale-orange transition-colors">
                {brandLogo ? brandLogo.text : "STUCK COFFEE & CIGAR"}
              </span>
              <span className="text-[11px] font-mono tracking-wider text-lokale-orange block -mt-1 uppercase font-bold">
                #stuckinmedan
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-350 flex items-center space-x-1.5 ${
                    isActive
                      ? "text-lokale-green font-semibold"
                      : item.luxury
                      ? "text-lokale-orange hover:text-lokale-orange/90 bg-lokale-orange-light border border-lokale-orange/30 font-semibold"
                      : "text-lokale-wood/80 hover:text-lokale-green hover:bg-lokale-beige/50"
                  }`}
                >
                  {item.luxury && <Shield className="w-3.5 h-3.5 text-lokale-green" />}
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-lokale-green"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Club Badges & Cart */}
          <div className="flex items-center space-x-3">
            
            {/* Language Switcher */}
            <div className="flex items-center space-x-0.5 p-1 rounded-xl bg-lokale-beige border border-lokale-border">
              <button
                onClick={() => setLang("en")}
                className={`text-[10px] font-mono tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                  lang === "en" ? "text-lokale-white font-bold bg-lokale-green shadow-sm" : "text-lokale-wood/65 hover:text-lokale-green"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("id")}
                className={`text-[10px] font-mono tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                  lang === "id" ? "text-lokale-white font-bold bg-lokale-green shadow-sm" : "text-lokale-wood/65 hover:text-lokale-green"
                }`}
              >
                ID
              </button>
            </div>
            
            {/* Shopping Cart Indicator */}
            <button
              onClick={() => setCurrentTab("cart")}
              className="relative p-2.5 rounded-xl bg-lokale-white border border-lokale-border text-lokale-wood hover:text-lokale-green hover:border-lokale-green transition-all shadow-xs group cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-lokale-orange text-[10px] font-bold text-lokale-white animate-bounce shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Login Admin button for Mobile */}
            <button
              onClick={() => setCurrentTab("admin")}
              className={`lg:hidden px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all duration-300 flex items-center space-x-1 border ${
                currentTab === "admin"
                  ? "text-lokale-green bg-lokale-orange-light border-lokale-orange/40"
                  : "text-lokale-orange bg-lokale-orange-light hover:bg-lokale-orange-light/85 border-lokale-orange/30"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-lokale-green" />
              <span>{t("nav.admin")}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden rounded-xl bg-lokale-white border border-lokale-border text-lokale-wood hover:text-lokale-green transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="lg:hidden bg-lokale-cream border-b border-lokale-border px-4 pt-2 pb-6 space-y-2 absolute top-20 left-0 w-full shadow-lg"
        >
          {navItems.filter(item => item.id !== "admin").map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-base font-medium transition-all ${
                  isActive
                    ? "bg-lokale-orange-light text-lokale-wood border-l-4 border-lokale-orange font-semibold"
                    : "text-lokale-wood/80 hover:text-lokale-green hover:bg-lokale-beige/50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {item.luxury && <Shield className="w-4 h-4 text-lokale-green" />}
                  <span>{item.label}</span>
                </div>
                {item.luxury && <span className="text-[10px] bg-lokale-orange-light text-lokale-wood font-semibold px-2 py-0.5 rounded uppercase font-mono">{t("nav.staffOnly")}</span>}
              </button>
            );
          })}
        </motion.div>
      )}
    </header>
  );
}
