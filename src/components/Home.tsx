import { Coffee, Shield, ArrowRight, Star, Sparkles, Trophy, Check } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect, FormEvent } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Review, Product } from "../types";

interface HomeProps {
  setCurrentTab: (tab: string) => void;
  onBookEvent: (eventId: string) => void;
}

const DEFAULT_BESTSELLERS = [
  {
    id: "prod-1",
    name: "Kopi Obsidian Khas Stuck",
    nameEn: "Stuck Obsidian Signature Latte",
    price: 68000,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop",
    tag: "Terlaris",
    tagEn: "Bestseller",
    desc: "Espresso ganda dipadukan dengan sirup gula aren asin khas Indonesia, aroma cloche asap kayu alami, dan kepingan emas.",
    descEn: "Double-shot espresso infused with local palm sugar, real wood smoke aroma, and subtle gold flakes."
  },
  {
    id: "prod-9",
    name: "Cohiba Behike 52 Grand Reserve",
    nameEn: "Cohiba Behike 52 Grand Reserve",
    price: 1850000,
    image: "https://images.unsplash.com/photo-1606149479366-07f917dfa4fa?q=80&w=600&auto=format&fit=crop",
    tag: "Kuba Premium",
    tagEn: "Cuba Premium",
    desc: "Cerutu Kuba legendaris dengan daun medio-tiempo pilihan. Menawarkan aroma espresso lembut bercampur kulit manis.",
    descEn: "An absolutely legendary Cuban cigar with elite wrapper leaves. Harmonizes with our single origin coffees."
  },
  {
    id: "prod-3",
    name: "Geisha Esmeralda Pour-Over",
    nameEn: "Geisha Esmeralda Pour-Over",
    price: 125000,
    image: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?q=80&w=600&auto=format&fit=crop",
    tag: "Panama Langka",
    tagEn: "Panama Rare",
    desc: "Seduhan manual kopi Geisha yang menonjolkan aroma melati floral, kamomil, dan rasa manis buah buah persik.",
    descEn: "Elite manual pour-over exhibiting fragrant jasmine blossoms, honeysuckle tea, and rich peach accents."
  }
];

export default function Home({ setCurrentTab, onBookEvent }: HomeProps) {
  const { lang, t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>(DEFAULT_BESTSELLERS);
  const [loading, setLoading] = useState(true);

  // Guest review submission states
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [productId, setProductId] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch reviews
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching reviews:", err);
        setLoading(false);
      });

    // Fetch products
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));

    // Fetch special menu
    fetch("/api/special-menu")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length) {
          setBestSellers(data);
        }
      })
      .catch((err) => console.error("Error fetching special menu:", err));
  }, []);

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    setSuccess(false);

    const chosenProduct = products.find(p => p.id === productId);
    const productName = chosenProduct ? chosenProduct.name : "General Experience";

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productName,
          rating,
          comment,
          customerName: customerName.trim() || undefined,
          email: email.trim() || undefined
        }),
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews((prev) => [newReview, ...prev]);
        setSuccess(true);
        setComment("");
        setRating(5);
        setProductId("general");
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const valueProps = [
    {
      icon: <Shield className="w-6 h-6 text-lokale-orange" />,
      title: lang === "id" ? "Suasana Terbuka yang Sejuk" : "Charming Open-Air Courtyard",
      desc: lang === "id"
        ? "Nikmati semilir angin sepoi-sepoi di bawah rimbunnya pepohonan hijau halaman outdoor kami di Kesawan, menciptakan tempat bersantai yang asri dan rileks."
        : "Breathe in the clean open-air breeze inside our little pocket of greenery. Settle into our vintage backyard courtyard illuminated by warm string lights."
    },
    {
      icon: <Coffee className="w-6 h-6 text-lokale-orange" />,
      title: lang === "id" ? "Penyangraian Mikro-Artisan" : "Micro-Artisan Roasts",
      desc: lang === "id"
        ? "Setiap biji kopi nusantara didatangkan dalam kelompok kecil dari perkebunan tinggi pilihan dan disangrai khusus demi cita rasa lokal nusantara yang manis."
        : "Every single origin crop is sourced in small batches from elite farms and custom-roasted to highlight the ultimate sweetness and balanced fruit acids."
    },
    {
      icon: <Trophy className="w-6 h-6 text-lokale-orange" />,
      title: lang === "id" ? "Sommelier Kopi & Cerutu Bersertifikasi" : "Certified Coffee & Cigar Sommeliers",
      desc: lang === "id"
        ? "Pakar terakreditasi kami siap menawarkan rekomendasi pencocokan rasa yang teliti, menyelaraskan keasaman seduhan kopi dengan aroma cerutu impor terbaik."
        : "Our accredited experts offer meticulous taste pairings, matching the structural sweetness of local crops with premium wrapper leaves."
    }
  ];

  return (
    <div className="pb-16 lux-grid bg-lokale-cream">
      
      {/* 1. Cozy & Chic Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-lokale-border px-4 py-12">
        
        {/* Visual Ambient Background - Replicating Lokale warm tone imagery */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop" 
            alt="Warm Outdoor Cozy Café Garden" 
            className="w-full h-full object-cover opacity-15 scale-102 filter sepia transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lokale-cream via-lokale-cream/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-lokale-orange-light border border-lokale-orange/30 text-lokale-green text-xs font-mono font-bold mb-6 tracking-wider uppercase"
          >
            <span>#stuckinmedan</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-lokale-green leading-tight"
          >
            {t("home.heroTitle1")} <br />
            <span className="text-lokale-orange font-serif italic">
              {t("home.heroTitle2")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lokale-wood/85 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-normal"
          >
            {lang === "id" 
              ? "Tempat nongkrong kecil yang asri dan sejuk di sudut historis Kesawan, Medan. Dikelilingi rimbun tanaman hijau, lampu tali gantung yang hangat, dan embusan angin sepoi-sepoi alam terbuka terbuka (outdoor) yang nyaman ditemani racikan kopi lokal premium." 
              : "A cozy little pocket of nature nestled in historic Kesawan, Medan. Settle down inside our lush garden patio characterized by rich wood details, fresh open-air tropical breezes, and custom micro-roasted Sumatra coffee."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => setCurrentTab("menu")}
              className="w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-lokale-green hover:bg-lokale-green-light text-lokale-cream font-medium text-sm transition-all shadow-md flex items-center justify-center space-x-2 group cursor-pointer"
            >
              <span>{t("home.btnCatalog")}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </motion.div>
        </div>
        
        {/* Micro Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-lokale-wood/40 flex flex-col items-center space-y-1.5 opacity-80">
          <span className="text-[10px] tracking-[0.3em] uppercase font-bold">{lang === "id" ? "GULIR" : "SCROLL"}</span>
          <div className="w-1.5 h-6 rounded-full bg-lokale-beige border border-lokale-border relative overflow-hidden">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 rounded-full bg-lokale-orange animate-bounce" />
          </div>
        </div>
      </section>

      {/* 2. Signature Pairings Grid - Clean & Aesthetic White Cards on Cream */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-lokale-orange text-xs font-mono uppercase tracking-[0.2em] font-bold block mb-2">{t("home.signatureSeals")}</span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-lokale-green">
            {lang === "id" ? "Rekomendasi Menu Spesial" : "Aesthetic Curated Favorites"}
          </h2>
          <div className="w-12 h-1 bg-lokale-orange mx-auto mt-4 rounded-full" />
          <p className="mt-4 text-lokale-wood/75 text-sm sm:text-base font-normal">
            {lang === "id"
              ? "Menu pilihan terbaik dari kedai kami yang paling digemari para pengunjung harian."
              : "Our supreme handpicked coffee bar specialties and humidor pairings loved by regular guests."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {bestSellers.map((item) => (
            <div 
              key={item.id}
              className="group bg-white border border-lokale-border rounded-3xl overflow-hidden hover:border-lokale-green/40 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-lokale-beige">
                <img 
                  src={item.image || null} 
                  alt={lang === "id" ? item.name : (item.nameEn || item.name)} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 bg-lokale-green text-lokale-cream text-[10px] font-bold font-mono px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {lang === "id" ? item.tag : (item.tagEn || item.tag)}
                </span>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-serif text-lg font-bold text-lokale-green group-hover:text-lokale-orange transition-colors">
                  {lang === "id" ? item.name : (item.nameEn || item.name)}
                </h3>
                <p className="text-lokale-wood/80 text-xs mt-2 line-clamp-3 leading-relaxed flex-grow">
                  {lang === "id" ? item.desc : (item.descEn || item.desc)}
                </p>
                <div className="mt-6 pt-4 border-t border-lokale-border flex items-center justify-between">
                  <span className="text-lokale-green font-mono text-sm font-extrabold">
                    Rp {Number(item.price || 0).toLocaleString()}
                  </span>
                  <button
                    onClick={() => setCurrentTab("menu")}
                    className="text-lokale-wood/80 hover:text-lokale-orange text-xs font-mono font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <span>{lang === "id" ? "Lihat Menu" : "View Menu"}</span>
                    <ArrowRight className="w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. The Atmosphere - Cozy Cream Interior highlight */}
      <section className="bg-lokale-beige/50 border-y border-lokale-border py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual description */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-lokale-orange text-xs font-mono uppercase tracking-[0.2em] font-bold block">{lang === "id" ? "SUASANA KEDAI OUTDOOR" : "COZY OUTDOOR VIBES"}</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-lokale-green">
                {lang === "id" ? "Nongkrong Santai. Suasana Hijau Terbuka." : "Lush Greenery. Open-Air Freshness."}
              </h2>
              <p className="text-lokale-wood/85 text-sm leading-relaxed">
                {lang === "id"
                  ? "Stuck Coffee & Cigar memadukan pesona arsitektur kolonial Kesawan dengan keasrian taman terbuka hijau. Kami menata bangku-bangku kayu dan pot tanaman tropis subur demi sensasi nongkrong sore yang teduh dan rileks."
                  : "We redefine the cozy neighborhood hang-out in Kesawan. Settle down inside our warm backyard backyard courtyard bordered by vibrant Monstera and leafy ferns under open skies."}
              </p>
              <p className="text-lokale-wood/85 text-sm leading-relaxed">
                {lang === "id"
                  ? "Nikmati seruputan kopi susu dingin, camilan renyah, dan kepulan cerutu aromatis bersama tiupan angin sepoi alami kota Medan."
                  : "Enjoy chilled manual brew drippers, artisan pastries, or fine hand-rolled wrappers with fresh tropical breezes filtering through local tree branches."}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setCurrentTab("menu")}
                  className="px-6 py-3 rounded-xl border border-lokale-green/35 text-lokale-green hover:bg-lokale-green hover:text-lokale-cream text-xs font-mono font-bold uppercase tracking-[0.1em] transition-all flex items-center space-x-2 cursor-pointer shadow-xs"
                >
                  <span>{lang === "id" ? "Jelajahi Menu & Katalog" : "Explore Menu & Catalog"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Value Proposition Points - Soft cream container boxes */}
            <div className="lg:col-span-7 grid grid-cols-1 gap-6">
              {valueProps.map((prop, idx) => (
                <div 
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-lokale-border flex items-start space-x-4 hover:border-lokale-green/20 transition-all shadow-xs"
                >
                  <div className="p-3 bg-lokale-orange-light rounded-xl border border-lokale-orange/20 flex-shrink-0">
                    {prop.icon}
                  </div>
                  <div>
                    <h3 className="text-lokale-green font-serif font-bold text-base md:text-lg">
                      {prop.title}
                    </h3>
                    <p className="text-lokale-wood/75 text-xs mt-1.5 leading-relaxed font-normal">
                      {prop.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 5. Cozy Guest Reviews & Dynamic Ratings Form */}
      <section className="bg-lokale-orange-light/40 border-t border-lokale-border py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-lokale-orange text-xs font-mono uppercase tracking-[0.2em] font-bold block mb-2">
              {lang === "id" ? "SUARA GUEST & PENIKMAT KOPI" : "CONNOISSEUR VOICE INDEX"}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-lokale-green">
              {lang === "id" ? "Ulasan Tamu & Skala Rating" : "Guest Reviews & Experience Ratings"}
            </h2>
            <div className="w-12 h-1 bg-lokale-orange mx-auto mt-4 rounded-full" />
            <p className="mt-4 text-lokale-wood/75 text-sm sm:text-base font-normal">
              {lang === "id"
                ? "Sampaikan pengalaman rasa menyeduh manual, bersantai di patio, atau pairing cerutu premium Anda."
                : "Leave your authentic commentary on open-air garden vibes, micro-roasted drops, or cigar service."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Frame: Form Submission */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-lokale-border shadow-sm">
              <h3 className="font-serif text-xl font-bold text-lokale-green mb-2">
                {lang === "id" ? "Tulis Ulasan Baru" : "Log New Guest Review"}
              </h3>
              <p className="text-xs text-lokale-wood/65 mb-6">
                {lang === "id" 
                  ? "Bagikan aroma rasa ulasan Anda langsung ke papan komunitas @stuckinmedan."
                  : "Contribute your expert opinion instantly onto our localized public sensory board."}
              </p>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold mb-6 flex items-center space-x-2"
                >
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    {lang === "id"
                      ? "Terima kasih! Ulasan sensorik Anda telah berhasil dipublikasikan."
                      : "Thank you! Your dynamic sensory feedback has been safely published."}
                  </span>
                </motion.div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-lokale-green mb-1.5">
                    {lang === "id" ? "Nama Penikmat" : "Guest Name"}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder={lang === "id" ? "Ketik nama lengkap Anda..." : "Enter your public name..."}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl bg-lokale-cream/50 border border-lokale-border text-lokale-wood focus:outline-none focus:ring-2 focus:ring-lokale-orange"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-lokale-green mb-1.5">
                    {lang === "id" ? "Alamat Email" : "Email Address"} <span className="text-lokale-orange/70 font-normal">({lang === "id" ? "opsional" : "optional"})</span>
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl bg-lokale-cream/50 border border-lokale-border text-lokale-wood focus:outline-none focus:ring-2 focus:ring-lokale-orange"
                  />
                </div>

                {/* Star rating selector */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-lokale-green mb-1.5">
                    {lang === "id" ? "Skala Rating" : "Rating Score"}
                  </label>
                  <div className="flex items-center space-x-1.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= (hoverRating || rating)
                              ? "text-lokale-orange fill-lokale-orange"
                              : "text-stone-200"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono font-bold text-lokale-orange ml-2">
                      {rating} / 5
                    </span>
                  </div>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-lokale-green mb-1.5">
                    {lang === "id" ? "Pilih Menu yang Diulas" : "Select Reserve item to Rate"}
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl bg-lokale-cream/50 border border-lokale-border text-lokale-wood focus:outline-none focus:ring-2 focus:ring-lokale-orange appearance-none cursor-pointer"
                  >
                    <option value="general">💎 {lang === "id" ? "Umum (Suasana / Pelayanan)" : "General (Vibes & Service)"}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        ☕ {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-lokale-green mb-1.5">
                    {lang === "id" ? "Ulasan / Catatan Sensorik" : "Your Review Description"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={300}
                    placeholder={lang === "id" ? "Ceritakan cita rasa seduhan kopi, makanan, atau kenyamanan patio..." : "Write about your manual brewing taste, cigar pairings, or ambient garden cozy level..."}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl bg-lokale-cream/50 border border-lokale-border text-lokale-wood focus:outline-none focus:ring-2 focus:ring-lokale-orange resize-none"
                  />
                  <div className="text-right text-[10px] font-mono text-stone-400 mt-1">
                    {300 - comment.length} {lang === "id" ? "karakter tersisa" : "chars remaining"}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-lokale-green hover:bg-lokale-green-light text-lokale-cream font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting 
                    ? (lang === "id" ? "Menyimpan Ulasan..." : "Recording Sensory Review...") 
                    : (lang === "id" ? "Kirim Ulasan" : "Publish Guest Review")}
                </button>
              </form>
            </div>

            {/* Right Frame: Active Review Board Feed */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between border-b border-lokale-border/60 pb-4">
                <h3 className="font-serif text-xl font-bold text-lokale-green">
                  {lang === "id" ? "Papan Feedback Kolektif" : "Collective Feedback Bulletin"}
                </h3>
                <span className="bg-lokale-orange-light text-lokale-orange text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {reviews.length} {lang === "id" ? "Total Ulasan" : "Reviews total"}
                </span>
              </div>

              {loading ? (
                <div className="py-20 text-center text-stone-400 font-mono text-xs">
                  <div className="inline-block w-6 h-6 border-2 border-lokale-green border-t-transparent rounded-full animate-spin mb-2" />
                  <div>{lang === "id" ? "Memuat ulasan kedai..." : "Accessing sensory board..."}</div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white/50 border border-dashed border-lokale-border text-lokale-wood/60 text-xs sm:text-sm font-serif">
                  {lang === "id" 
                    ? "Belum ada ulasan yang dicatat. Jadilah penikmat pertama yang meninggalkan catatan!"
                    : "No logged reviews. Be the very first regular guest to list an review footprint!"}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[620px] overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.map((rev) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={rev.id}
                      className="bg-white border border-lokale-border p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        {/* Rating stars & Date */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating 
                                    ? "text-lokale-orange fill-lokale-orange" 
                                    : "text-stone-100"
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-stone-400">
                            {rev.date}
                          </span>
                        </div>

                        {/* Comment content */}
                        <p className="text-lokale-wood text-xs italic leading-relaxed line-clamp-4">
                          "{rev.comment}"
                        </p>
                      </div>

                      {/* Customer name & verified tag */}
                      <div className="mt-4 pt-3 border-t border-lokale-border/40 flex items-center justify-between">
                        <div>
                          <span className="text-lokale-green font-serif font-bold text-xs block">
                            {rev.customerName}
                          </span>
                          <span className="text-[9px] font-mono text-lokale-orange font-semibold tracking-wider block uppercase">
                            {rev.productName}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-lokale-beige px-2 py-0.5 rounded-lg text-lokale-green">
                          ✓ Verified
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
