import { Search, SlidersHorizontal, ShoppingCart, Star, Share2, Plus, Minus, Tag, Check, Award, AlertCircle, X } from "lucide-react";
import { useState, useEffect, FormEvent } from "react";
import { Product, ProductCategory, Review } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface MenuProps {
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product) => void;
}

export default function Menu({ onAddToCart, onBuyNow }: MenuProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useLanguage();

  // Filters State
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default');

  // Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [activeDetailImage, setActiveDetailImage] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Submit Review form
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Fetch products & initial setups
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search, filter and sort
  useEffect(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    setFilteredProducts(result);
  }, [products, activeCategory, searchQuery, sortBy]);

  const handleOpenDetail = async (prod: Product) => {
    setSelectedProduct(prod);
    setDetailQuantity(1);
    setActiveDetailImage(prod.images[0]);
    setNewComment("");
    setNewRating(5);
    setReviewSuccess(false);

    // Fetch related reviews from server
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      const filteredReviews = data.filter((r: Review) => r.productId === prod.id);
      setReviews(filteredReviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const handleAddReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newComment.trim()) return;
    setSubmittingReview(true);
    
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          rating: newRating,
          comment: newComment
        }),
      });
      
      const newCreatedReview = await response.json();
      setReviews(prev => [newCreatedReview, ...prev]);
      setReviewSuccess(true);
      setNewComment("");
      
      if (selectedProduct) {
        const updatedRating = parseFloat(((selectedProduct.rating + newRating) / 2).toFixed(1));
        setSelectedProduct({
          ...selectedProduct,
          rating: updatedRating
        });
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, rating: updatedRating } : p));
      }

    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const shareProduct = (name: string) => {
    const shareMessage = lang === "id"
      ? `Tautan berbagi premium disiapkan untuk ${name}! Salin kelengkapan atribut dan kirim ke kolega Anda.`
      : `Polished share code generated for ${name}! Copy linking attributes and share with friends.`;
    alert(shareMessage);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lux-grid min-h-screen bg-lokale-cream">
      
      {/* Page Header */}
      <div className="mb-12 text-center md:text-left md:flex md:items-end justify-between">
        <div>
          <span className="text-lokale-orange font-mono text-xs uppercase tracking-[0.25em] font-semibold">CRAFT COFFEE BAR & HUMIDOR</span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-lokale-green mt-2">
            {lang === "id" ? "Katalog Menu Pilihan" : "Kopi & Cigar Reserves"}
          </h1>
          <p className="text-lokale-wood/80 mt-3 text-sm font-normal max-w-xl">
            {lang === "id"
              ? "Pilih racikan kopi khas Indonesia seduhan manual V60, espresso dingin yang manis, atau koleksi cerutu humidor impor kami. Disimpan secara cermat demi kesegaran rasa terbaik."
              : "Pick from local Indonesian V60 manual drips, sweet espresso classics, or premium Cuban legendary wrapper leaves. Carefully preserved under constant microclimate control."}
          </p>
        </div>

        {/* Categories Fast Selector */}
        <div className="flex flex-wrap gap-2 mt-6 md:mt-0 justify-center">
          {(['all', 'coffee', 'non-coffee', 'food', 'cigar'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                activeCategory === cat
                  ? "bg-lokale-green text-lokale-cream border-lokale-green font-bold shadow-sm"
                  : "bg-white text-lokale-wood/80 border-lokale-border hover:bg-lokale-beige hover:text-lokale-green"
              }`}
            >
              {cat === 'all' 
                ? (lang === "id" ? "Semua Menu" : "All Reserves") 
                : cat === 'non-coffee' 
                  ? (lang === "id" ? "Non-Kopi" : "Non-Coffee") 
                  : cat === 'coffee' 
                    ? (lang === "id" ? "Kopi Bar" : "Coffee Crafts") 
                    : cat === 'food' 
                      ? (lang === "id" ? "Camilan & Roti" : "Foods & Pastry") 
                      : (lang === "id" ? "Cerutu" : "Premium Cigar")}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-lokale-border shadow-xs mb-8">
        
        {/* Search Field */}
        <div className="relative w-full md:w-96 flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-lokale-wood/50" />
          <input
            type="text"
            placeholder={lang === "id" ? "Cari es kopi susu, latte, croissant, Cohiba..." : "Search for espresso, Geisha, croissant..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-lokale-cream border border-lokale-border rounded-xl text-lokale-wood text-sm focus:outline-none focus:border-lokale-green focus:ring-1 focus:ring-lokale-green"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <SlidersHorizontal className="w-4 h-4 text-lokale-orange" />
          <span className="text-lokale-wood/60 text-xs font-mono uppercase hidden sm:inline">{lang === "id" ? "Urutkan:" : "Sort:"}</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-lokale-cream border border-lokale-border rounded-xl text-lokale-wood text-xs focus:outline-none focus:border-lokale-green cursor-pointer font-medium"
          >
            <option value="default">{lang === "id" ? "Urutan Menu Standar" : "Default Catalog Arrangement"}</option>
            <option value="price-low">{lang === "id" ? "Harga: Rendah ke Tinggi" : "Price: Low to High"}</option>
            <option value="price-high">{lang === "id" ? "Harga: Tinggi ke Rendah" : "Price: High to Low"}</option>
            <option value="rating">{lang === "id" ? "Ulasan Penikmat Tertinggi" : "Expert Rating Reviews"}</option>
          </select>
        </div>
      </div>

      {/* Loading & Grid Rendering */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-10 h-10 border-2 border-lokale-green border-t-transparent rounded-full animate-spin" />
          <span className="text-lokale-wood/70 text-xs font-mono">
            {lang === "id" ? "Memuat katalog menu segar dari suaka..." : "Selecting humidor inventory and coffee beans..."}
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-lokale-border rounded-3xl bg-white shadow-xs">
          <AlertCircle className="w-10 h-10 text-lokale-orange mx-auto opacity-70" />
          <h3 className="text-lokale-green font-serif font-bold text-lg mt-4">
            {lang === "id" ? "Kompisis tidak ditemukan" : "We found no cigars or brews matching your criteria"}
          </h3>
          <p className="text-lokale-wood/65 text-xs max-w-sm mx-auto mt-2 font-normal leading-relaxed">
            {lang === "id"
              ? "Silakan kurangi keasaman kata kunci pencarian Anda untuk melihat persediaan kedai kami."
              : "Please adjust your search keywords or clear current filters to view our ultimate gold reserve selections."}
          </p>
          <button 
            onClick={() => { setSearchQuery(""); setActiveCategory("all"); setSortBy("default"); }}
            className="mt-6 px-4 py-2 rounded-xl bg-lokale-green text-white text-xs font-mono font-bold cursor-pointer hover:bg-lokale-green-light transition-all"
          >
            {lang === "id" ? "Atur Ulang Filter" : "Reset Catalog Filters"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => handleOpenDetail(p)}
              className="group bg-white border border-lokale-border rounded-2xl overflow-hidden hover:border-lokale-green/40 hover:shadow-md transition-all cursor-pointer flex flex-col h-full hover:-translate-y-1 duration-350"
            >
              
              {/* Image Frame */}
              <div className="relative aspect-square overflow-hidden bg-lokale-beige">
                <img
                  src={p.images[0] || null}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Category Label */}
                <div className="absolute top-3 left-3 bg-lokale-green text-lokale-cream text-[9px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                  {p.subcategory}
                </div>

                {/* Star rating overlay */}
                <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-white/95 px-2 py-1 rounded-lg border border-lokale-border text-lokale-orange text-[10px] font-mono font-bold shadow-sm">
                  <Star className="w-3 h-3 text-lokale-orange fill-lokale-orange" />
                  <span>{p.rating}</span>
                </div>
              </div>

              {/* Information */}
              <div className="p-5 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="font-serif text-[15px] font-bold text-lokale-green group-hover:text-lokale-orange transition-colors leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-lokale-wood/75 text-xs font-normal mt-1.5 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-lokale-border flex items-center justify-between">
                  <span className="text-lokale-green font-mono text-sm font-extrabold">
                    Rp {p.price.toLocaleString()}
                  </span>
                  
                  {p.status === 'out_of_stock' ? (
                    <span className="text-[10px] bg-lokale-beige text-lokale-wood/50 px-2.5 py-1 rounded font-mono font-bold border border-lokale-border">
                      {lang === "id" ? "Habis" : "Sold out"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono bg-lokale-orange-light text-lokale-wood hover:bg-lokale-orange hover:text-white border border-lokale-orange/30 px-2.5 py-1 rounded-lg transition-colors font-bold">
                      {lang === "id" ? "Periksa Rasa" : "Examine Specs"}
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 4. Luxury Detail Overlay Dialog - Soft light beige/white card popup */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-lokale-green/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white border border-lokale-border w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible text-lokale-wood">
            
            {/* Close trigger button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-lokale-cream border border-lokale-border text-lokale-wood hover:text-lokale-green transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Frame: Image display & specifications */}
            <div className="md:w-1/2 p-6 md:p-8 bg-lokale-cream flex flex-col justify-between border-b md:border-b-0 md:border-r border-lokale-border">
              <div className="space-y-4">
                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-lokale-beige border border-lokale-border">
                  <img
                    src={activeDetailImage || null}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                

              </div>

              {/* Technical Specifications details box */}
              {selectedProduct.details && (
                <div className="mt-8 bg-white p-5 rounded-2xl border border-lokale-border shadow-xs">
                  <h4 className="text-lokale-green text-xs font-mono uppercase tracking-wider mb-3 flex items-center space-x-1.5 font-bold">
                    <Award className="w-4 h-4 text-lokale-orange" />
                    <span>{lang === "id" ? "Spesifikasi Menu Lokale" : "Taste Profile Specifications"}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono text-lokale-wood/80">
                    {selectedProduct.details.origin && (
                      <div className="flex justify-between border-b border-lokale-cream pb-1">
                        <span className="text-lokale-wood/50">{lang === "id" ? "Kawasan Asal:" : "Origin:"}</span>
                        <span className="text-lokale-green font-bold max-w-[120px] truncate text-right">{selectedProduct.details.origin}</span>
                      </div>
                    )}
                    {selectedProduct.details.roastLevel && (
                      <div className="flex justify-between border-b border-lokale-cream pb-1">
                        <span className="text-lokale-wood/50">{lang === "id" ? "Profil Panggang:" : "Roast Profile:"}</span>
                        <span className="text-lokale-green font-bold text-right">{selectedProduct.details.roastLevel}</span>
                      </div>
                    )}
                    {selectedProduct.details.strength && (
                      <div className="flex justify-between border-b border-lokale-cream pb-1">
                        <span className="text-lokale-wood/50">{lang === "id" ? "Ketajaman Rasa:" : "Body Strength:"}</span>
                        <span className="text-lokale-green font-bold text-right">{selectedProduct.details.strength}</span>
                      </div>
                    )}
                    {selectedProduct.details.ringGauge && (
                      <div className="flex justify-between border-b border-lokale-cream pb-1">
                        <span className="text-lokale-wood/50">{lang === "id" ? "Ukuran Cerutu:" : "Ring Gauge:"}</span>
                        <span className="text-lokale-orange font-bold text-right">{selectedProduct.details.ringGauge}</span>
                      </div>
                    )}
                    {selectedProduct.details.length && (
                      <div className="flex justify-between border-b border-lokale-cream pb-1">
                        <span className="text-lokale-wood/50">{lang === "id" ? "Panjang:" : "Cigar Length:"}</span>
                        <span className="text-lokale-green font-bold text-right">{selectedProduct.details.length}</span>
                      </div>
                    )}
                    {selectedProduct.details.notes && (
                      <div className="col-span-2 text-lokale-wood mt-2 text-[11px] leading-relaxed italic bg-lokale-cream/55 p-2 rounded">
                        "{selectedProduct.details.notes}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Frame: Buying controls, customer reviews */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between max-h-[80vh] md:max-h-none overflow-y-auto">
              <div>
                <span className="text-lokale-orange text-xs font-mono uppercase tracking-widest font-semibold">{selectedProduct.subcategory}</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-lokale-green mt-1 leading-snug">
                  {selectedProduct.name}
                </h2>
                
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-1 text-lokale-orange text-sm font-mono font-bold">
                    <Star className="w-4 h-4 text-lokale-orange fill-lokale-orange" />
                    <span>{selectedProduct.rating} / 5</span>
                  </div>
                  <span className="text-lokale-border">|</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedProduct.stock > 0 ? "bg-lokale-orange-light text-lokale-wood" : "bg-lokale-beige text-lokale-wood/40"}`}>
                    {selectedProduct.stock > 0 
                      ? (lang === "id" ? `Tersedia (${selectedProduct.stock} sisa)` : `In Stock (${selectedProduct.stock} left)`)
                      : (lang === "id" ? "Habis" : "Sold out")}
                  </span>
                </div>

                <p className="text-lokale-wood/80 text-sm mt-5 leading-relaxed">
                  {selectedProduct.description}
                </p>

                {/* Buying actions */}
                {selectedProduct.status === 'available' && (
                  <div className="mt-8 pt-6 border-t border-lokale-border">
                    <span className="text-lokale-wood/50 text-xs font-mono block font-bold">{lang === "id" ? "PEMILIHAN JUMLAH" : "QUANTITY SELECTION"}</span>
                    <div className="flex items-center space-x-4 mt-3">
                      
                      {/* Counter */}
                      <div className="flex items-center border border-lokale-border rounded-xl bg-lokale-cream p-1">
                        <button
                          onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}
                          className="p-2 hover:bg-lokale-beige text-lokale-wood rounded-lg transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-5 font-mono text-sm text-lokale-wood font-extrabold">{detailQuantity}</span>
                        <button
                          onClick={() => setDetailQuantity(q => Math.min(selectedProduct.stock, q + 1))}
                          className="p-2 hover:bg-lokale-beige text-lokale-wood rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Display price */}
                      <div className="font-mono text-xl text-lokale-green font-extrabold">
                        Rp {(selectedProduct.price * detailQuantity).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions button */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <button
                        onClick={() => {
                          onAddToCart(selectedProduct, detailQuantity);
                          setSelectedProduct(null);
                        }}
                        className="py-3 px-4 rounded-xl border border-lokale-green/35 text-lokale-green hover:bg-lokale-cream text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4 text-lokale-orange" />
                        <span>{lang === "id" ? "Ambil Kamar" : "Add To Order"}</span>
                      </button>
                      <button
                        onClick={() => {
                          onBuyNow(selectedProduct);
                          setSelectedProduct(null);
                        }}
                        className="py-3 px-4 rounded-xl bg-lokale-green hover:bg-lokale-green-light text-lokale-cream text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center transition-all cursor-pointer shadow-sm"
                      >
                        <span>{lang === "id" ? "Beli Langsung" : "Buy Direct"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* REVIEW SECTION */}
              <div className="mt-10 pt-6 border-t border-lokale-border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lokale-green font-serif font-bold text-base flex items-center space-x-2">
                    <span>{lang === "id" ? "Diskusi Rasa Penikmat" : "Tasting Conversation"}</span>
                    <span className="text-xs bg-lokale-beige text-lokale-green font-mono font-bold px-2 py-0.5 rounded-full border border-lokale-border">
                      {reviews.length}
                    </span>
                  </h4>
                  <button 
                    onClick={() => shareProduct(selectedProduct.name)} 
                    className="p-1.5 rounded-lg border border-lokale-border hover:border-lokale-green text-lokale-wood cursor-pointer bg-white"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {reviewSuccess ? (
                  <div className="p-4 rounded-xl bg-lokale-orange-light border border-lokale-orange/30 text-lokale-green text-xs font-mono mb-4 text-center font-bold animate-pulse">
                    {lang === "id" 
                      ? "💎 Terima kasih! Ulasan rasa Anda kini tersimpan." 
                      : "💎 Thank you! Your review has been saved successfully."}
                  </div>
                ) : (
                  <form onSubmit={handleAddReview} className="bg-lokale-cream border border-lokale-border p-4 rounded-2xl space-y-3 mb-6">
                    <span className="text-lokale-wood/50 text-[10px] font-mono block uppercase font-bold">{lang === "id" ? "Kirimkan ulasan sensorik Anda" : "Share your tasting notes"}</span>
                    
                    {/* Stars Selector */}
                    <div className="flex items-center space-x-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${star <= newRating ? 'fill-lokale-orange text-lokale-orange' : 'text-lokale-beige fill-lokale-beige'}`} />
                        </button>
                      ))}
                    </div>

                    {/* Comment text */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder={lang === "id" ? "Notes keasaman, rasa manis manis, aroma..." : "Fragrant, smooth body, delicious..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-grow px-3 py-2 bg-white border border-lokale-border text-lokale-wood text-xs rounded-xl focus:outline-none focus:border-lokale-green"
                      />
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 bg-lokale-green hover:bg-lokale-green-light text-lokale-cream rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {submittingReview 
                          ? (lang === "id" ? 'Menyimpan...' : 'Saving...') 
                          : (lang === "id" ? 'Kirim' : 'Post')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Review Feed */}
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                  {reviews.length === 0 ? (
                    <div className="text-center py-6 text-lokale-wood/50 text-xs italic">
                      {lang === "id" 
                        ? "Belum ada ulasan untuk menu ini. Jadilah yang pertama!" 
                        : "Be the first regular guest to share your tasting experience."}
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="border-b border-lokale-cream pb-3 text-xs leading-relaxed">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lokale-green font-bold">{rev.customerName}</span>
                          <span className="text-lokale-wood/40 text-[10px] font-mono">{rev.date}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-lokale-orange mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-2.5 h-2.5 ${i < rev.rating ? 'text-lokale-orange fill-lokale-orange' : 'text-lokale-beige fill-lokale-beige'}`} />
                          ))}
                        </div>
                        <p className="text-lokale-wood/80 font-light italic">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
