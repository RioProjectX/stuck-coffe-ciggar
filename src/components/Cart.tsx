import { Trash2, ShoppingBag, ArrowRight, Percent, ShieldCheck, CreditCard, Receipt, Sparkles, Check, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { CartItem, Order } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { motion } from "motion/react";

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, q: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  userPoints: number;
  userLevel: string;
  onRefreshProfile: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart, userPoints, userLevel, onRefreshProfile, setCurrentTab }: CartProps) {
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountPercent: number; description: string } | null>(null);
  const [voucherError, setVoucherError] = useState("");
  
  const { lang, t } = useLanguage();

  // Checkout particulars
  const [address, setAddress] = useState(lang === "id" ? "Apartemen Sudirman Luxury Suites 14B, Jakarta Selatan" : "Sudirman Luxury Suites Apt 14B, South Jakarta");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("QRIS");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentChannels, setPaymentChannels] = useState<any[]>([]);
  
  // Confirmed final order
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [showQRIS, setShowQRIS] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Fetch Payment Methods on mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch("/api/payment-methods");
        if (res.ok) {
          const data = await res.json();
          const activePMs = data.filter((pm: any) => pm.isActive);
          setPaymentChannels(activePMs);
          if (activePMs.length > 0) {
            setPaymentMethod(activePMs[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to load payment mechanisms:", err);
      }
    };
    fetchChannels();
  }, []);

  // Poll current order status to catch Admin's payment verification checkbox
  useEffect(() => {
    if (!confirmedOrder || confirmedOrder.status === "Paid" || confirmedOrder.status === "Completed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${confirmedOrder.id}`);
        if (res.ok) {
          const freshOrder = await res.json();
          if (freshOrder.status === "Paid" || freshOrder.status === "Completed") {
            setConfirmedOrder(freshOrder);
            onRefreshProfile();
          }
        }
      } catch (err) {
        console.error("Error polling order confirmation status:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [confirmedOrder]);

  // Automatically dismiss the receipt / close the order view if the administrative status becomes Paid or Completed
  useEffect(() => {
    if (confirmedOrder && (confirmedOrder.status === "Paid" || confirmedOrder.status === "Completed")) {
      const timer = setTimeout(() => {
        setConfirmedOrder(null);
      }, 4500); // Allow guest to view success checkmark animation for 4.5s
      return () => clearTimeout(timer);
    }
  }, [confirmedOrder]);

  // Auto calculate values
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = appliedVoucher ? Math.round((subtotal * appliedVoucher.discountPercent) / 100) : 0;
  const tax = 0; // Stuck does not have tax
  const shippingFee = subtotal > 150000 ? 0 : 25000; // Free shipping over 150K
  const total = subtotal - discountAmount + tax + shippingFee;
  const pointsEarned = Math.round(subtotal / 1000);

  // Apply voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherError("");
    try {
      const res = await fetch("/api/vouchers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode, subtotal })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedVoucher(data);
        setVoucherCode("");
      } else {
        setVoucherError(data.error || (lang === "id" ? "Kode kupon tidak valid" : "Invalid voucher code"));
      }
    } catch (err) {
      setVoucherError(lang === "id" ? "Gagal tersambung ke layanan kupon" : "Error connecting to voucher registry");
    }
  };

  const handleApplyQuickVoucher = (codeStr: string) => {
    setVoucherCode(codeStr);
  };

  const handleCheckout = async () => {
    if (!cartItems.length) return;
    setCheckoutLoading(true);
    
    try {
      const payload = {
        items: cartItems.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        paymentMethod,
        address,
        phone,
        voucherCode: appliedVoucher?.code || null
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const orderData = await res.json();
      if (res.ok) {
        setConfirmedOrder(orderData);
        setShowQRIS(true);
        onClearCart();
        onRefreshProfile(); // point update
      } else {
        alert((lang === "id" ? "Gagal mengirim pesanan: " : "Failed to submit lounge checkout: ") + (orderData.error || "Internal Error"));
      }
    } catch (err) {
      console.error(err);
      alert(lang === "id" ? "Terjadi kesalahan pembayaran. Silakan coba lagi." : "Error checking out. Try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Simulate payment gateway scan
  const handleSimulatePayment = async () => {
    if (!confirmedOrder) return;
    setPaymentProcessing(true);
    
    // Simulate payment bank authorization delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const res = await fetch(`/api/orders/${confirmedOrder.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Paid" })
      });
      const updatedOrder = await res.json();
      if (res.ok) {
        setConfirmedOrder(updatedOrder);
        setShowQRIS(false);
        onRefreshProfile();
        const alertMsg = lang === "id"
          ? "💎 Pembayaran terotorisasi! Midtrans telah memproses pelunasan simulasi ini dan memperbarui status pesanan menjadi 'Lunas'. Pelayan bar dan humidor kami telah diberi notifikasi."
          : "💎 Payment authorized! Midtrans has processed the mock payout and updated order to 'Paid'. Your kitchen and humidor staff have been alerted.";
        alert(alertMsg);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lux-grid min-h-screen bg-lokale-cream">
      
      <div className="mb-10 text-center sm:text-left animate-fadeIn">
        <span className="text-lokale-orange font-mono text-xs uppercase tracking-[0.2em] font-bold">{lang === "id" ? "PEMBAYARAN & KONSILIASI" : "CHECKOUT & CONCILIATION"}</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-lokale-green mt-2">
          {lang === "id" ? "Keranjang Meja Anda" : "Your Table Cart"}
        </h1>
        <p className="text-lokale-wood/80 text-sm mt-3 font-normal max-w-xl">
          {lang === "id" 
            ? "Lengkapi pesanan Anda di bawah profil anggota terdaftar atau selesaikan total pesanan meja." 
            : "Complete your orders under your registered membership profile or finalize your table totals."}
        </p>
      </div>

      {confirmedOrder ? (
        /* Confirmed Order & Gateway Simulator Display */
        <div className="max-w-3xl mx-auto bg-white border border-lokale-border p-6 sm:p-10 rounded-3xl shadow-lg space-y-8 animate-fadeIn text-lokale-wood">
          
          <div className="text-center">
            <div className="w-16 h-16 bg-lokale-cream rounded-2xl border border-lokale-border flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-lokale-orange" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-lokale-green">
              {lang === "id" ? "Faktur Lounge Terbit" : "Lounge Invoice Committed"}
            </h2>
            <p className="text-lokale-orange text-xs mt-1 font-mono font-semibold">{confirmedOrder.invoiceNumber}</p>
          </div>

          {/* Details breakdown */}
          <div className="bg-lokale-cream p-6 rounded-2xl border border-lokale-border space-y-4">
            <h3 className="text-lokale-green text-xs font-mono uppercase tracking-wider border-b border-lokale-border pb-2 font-bold">
              {lang === "id" ? "Spesifikasi Pesanan" : "Order Specifics"}
            </h3>
            {confirmedOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-lokale-wood font-medium">{item.name} <strong className="text-lokale-orange">x{item.quantity}</strong></span>
                <span className="text-lokale-green font-mono font-bold">IDR {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            
            <div className="border-t border-lokale-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-lokale-wood/65">
                <span>Subtotal:</span>
                <span className="font-mono">IDR {confirmedOrder.subtotal.toLocaleString()}</span>
              </div>
              {confirmedOrder.discount > 0 && (
                <div className="flex justify-between text-lokale-orange font-bold">
                  <span>{lang === "id" ? "Diskon Kupon Berhasil:" : "Applied Discount:"} ({confirmedOrder.voucherCode}):</span>
                  <span className="font-mono">- IDR {confirmedOrder.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lokale-green font-extrabold text-sm pt-2 border-t border-lokale-border">
                <span>Grand Total:</span>
                <span className="text-lokale-green font-mono">IDR {confirmedOrder.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Checkout simulation overlay */}
          <div className="p-6 rounded-2xl bg-lokale-orange-light border border-lokale-orange/30 space-y-4 text-center">
            
            <h3 className="text-lokale-green font-serif font-bold text-lg flex items-center justify-center space-x-2">
              <CreditCard className="w-5 h-5 text-lokale-orange" />
              <span>Gerbang Pembayaran Stuck Coffee & Cigar (Simulator Interaktif)</span>
            </h3>

            <div className="flex flex-col items-center space-y-4 py-3">
              {confirmedOrder.status === 'Paid' || confirmedOrder.status === 'Completed' ? (
                /* GLORIOUS SUCCESS CHECKMARK ANIMATION */
                <div className="flex flex-col items-center justify-center p-8 space-y-5 w-full">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Animated Ripple ring 1 */}
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full bg-emerald-500/25"
                    />
                    {/* Animated Ripple ring 2 */}
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 2.0, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut", delay: 0.6 }}
                      className="absolute inset-0 rounded-full bg-emerald-500/15"
                    />
                    
                    {/* Core animated green checkmark bubble */}
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="w-10 h-10 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={4}
                      >
                        <motion.path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M5 13l4 4L19 7" 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                        />
                      </svg>
                    </motion.div>
                  </div>

                  <div className="text-center space-y-2 max-w-sm">
                    <motion.h4 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="font-serif text-2xl font-black text-emerald-700 uppercase tracking-wide"
                    >
                      {lang === "id" ? "Pembayaran Lunas!" : "Payment Confirmed!"}
                    </motion.h4>
                    <motion.span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full animate-bounce inline-block">
                      {lang === "id" ? "TERVERIFIKASI OLEH ADMIN" : "VERIFIED BY ADMIN"}
                    </motion.span>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="text-stone-600 font-sans text-xs font-medium leading-relaxed"
                    >
                      {lang === "id"
                        ? "Pembayaran Anda telah sukses divalidasi oleh administrator! Barista kami sedang menyeduh minuman Anda secara presisi."
                        : "Awesome! The system detected the administrator validation checkmark. Your handcrafted orders are in preparation now!"}
                    </motion.p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  <p className="text-lokale-wood text-xs font-normal max-w-md mx-auto leading-relaxed">
                    {lang === "id"
                      ? `Silakan lakukan proses penyelesaian sesuai info rekening di bawah ini untuk `
                      : `Please proceed with manual transaction using the details below for `}
                    <strong className="text-lokale-green font-bold block text-sm mt-1 uppercase">
                      {confirmedOrder.paymentMethod}
                    </strong>
                  </p>

                  {/* Render exact custom image logo/QRIS code of chosen custom option */}
                  {(() => {
                    const activeChan = paymentChannels.find(c => c.name === confirmedOrder.paymentMethod);
                    if (activeChan) {
                      return (
                        <div className="space-y-4 flex flex-col items-center">
                          {activeChan.image ? (
                            <div className="p-4 bg-white rounded-2xl inline-block border-4 border-lokale-orange shadow-md max-w-xs mx-auto animate-fadeIn">
                              <img 
                                src={activeChan.image} 
                                alt={activeChan.name} 
                                className="max-w-[190px] max-h-[190px] object-contain rounded-xl mx-auto" 
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] font-mono text-lokale-orange font-bold block mt-2 tracking-widest uppercase">
                                SCAN / TRANSFER 
                              </span>
                            </div>
                          ) : activeChan.type === "qris" ? (
                            <div className="p-4 bg-white rounded-2xl inline-block border-4 border-lokale-orange shadow-md">
                              <QrCode className="w-44 h-44 text-stone-900 mx-auto" />
                              <span className="text-[10px] font-mono text-lokale-orange font-bold block mt-2 tracking-widest">STUCK COFFEE QRIS</span>
                            </div>
                          ) : null}

                          <div className="p-4 bg-white border border-lokale-border rounded-2xl text-xs max-w-md mx-auto text-center space-y-1 mt-1 shadow-3xs">
                            <span className="text-[9px] font-mono font-bold text-lokale-orange uppercase tracking-wider block">INSTRUKSI TRANSFER MANUAL:</span>
                            <p className="whitespace-pre-wrap font-sans text-stone-600 mt-1 leading-relaxed">{activeChan.details}</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      confirmedOrder.paymentMethod === "QRIS" && (
                        <div className="p-4 bg-white rounded-2xl inline-block border-4 border-lokale-orange shadow-md">
                          <QrCode className="w-44 h-44 text-stone-900 mx-auto" />
                          <span className="text-[10px] font-mono text-lokale-orange font-bold block mt-2 tracking-widest">STUCK COFFEE COG QRIS-D</span>
                        </div>
                      )
                    );
                  })()}

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 border-dashed text-[11px] text-stone-500 max-w-md mx-auto mb-2 text-left font-sans">
                    💡 <strong className="text-lokale-green">{lang === "id" ? "Menunggu Admin:" : "Awaiting Verification:"}</strong> {lang === "id" ? "Silakan selesaikan pembayaran. Tampilan ini otomatis berubah lunas saat admin mengecek centang di dashboard kasir/admin." : "Please transfer to the details above. This invoice automatically shows a success animation as soon as the admin ticks the verification checkbox."}
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleSimulatePayment}
                      disabled={paymentProcessing}
                      className="px-6 py-3 bg-lokale-green hover:bg-lokale-green-light text-lokale-cream rounded-xl font-bold font-mono text-xs hover:scale-102 transition-all uppercase tracking-wide cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {paymentProcessing 
                        ? (lang === "id" ? "Mengotorisasi..." : "Authorizing Payout...") 
                        : (lang === "id" ? "✓ Simulasi Bayar Instan" : "✓ Settle Instantly")}
                    </button>
                    <button
                      onClick={() => setConfirmedOrder(null)}
                      className="px-6 py-3 bg-white border border-lokale-border text-lokale-wood hover:text-lokale-green rounded-xl font-mono text-xs transition-colors cursor-pointer"
                    >
                      {lang === "id" ? "Kembali ke Keranjang" : "Menu Checklist"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : cartItems.length === 0 ? (
        /* Empty state */
        <div className="max-w-2xl mx-auto text-center py-24 bg-white border border-lokale-border rounded-3xl p-8 space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-lokale-cream border border-lokale-border flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7 text-lokale-orange" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-lokale-green">
              {lang === "id" ? "Keranjang Anda kosong" : "No items in your basket"}
            </h3>
            <p className="text-lokale-wood/75 text-xs mt-2 max-w-sm mx-auto font-normal leading-relaxed">
              {lang === "id"
                ? "Jelajahi pilihan biji kopi single origin Geisha legendaris, jajaran kue pastry manis, atau periksa koleksi cerutu humidor Kuba premium kami."
                : "Explore our luxurious geisha single origin beans, tahitian pastries, or check out our high-end Cuban cigar humidors."}
            </p>
          </div>
          <button
            onClick={() => setCurrentTab("menu")}
            className="px-6 py-3.5 rounded-xl bg-lokale-green hover:bg-lokale-green-light text-lokale-cream font-bold uppercase font-mono tracking-wider text-xs transition-all cursor-pointer shadow-sm"
          >
            {lang === "id" ? "Buka Katalog Menu & Humidor" : "Open Menu & Humidor"}
          </button>
        </div>
      ) : (
        /* Cart detail screens grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* List items left */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl border border-lokale-border p-6 space-y-4 shadow-sm text-lokale-wood">
              <h2 className="text-lokale-green font-serif font-bold text-lg border-b border-lokale-cream pb-3">
                {lang === "id" ? "Pesanan Terpilih" : "Selected Delicacies"}
              </h2>
              
              <div className="divide-y divide-lokale-cream">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                    <div className="flex items-center space-x-3.5">
                      <img 
                        src={item.product?.images?.[0] || null} 
                        alt={item.product.name} 
                        className="w-16 h-16 rounded-xl object-cover bg-lokale-cream border border-lokale-border"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-lokale-green font-serif text-[14px] font-extrabold leading-tight">{item.product.name}</h4>
                        <span className="text-[10px] font-mono text-lokale-orange block mt-1 uppercase tracking-wide font-semibold">{item.product.subcategory}</span>
                        <span className="text-xs font-mono text-lokale-wood/75 block mt-0.5">IDR {item.product.price.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Adjuster */}
                      <div className="flex items-center border border-lokale-border bg-lokale-cream rounded-lg p-1">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-2 text-lokale-wood font-bold hover:text-lokale-green transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono text-lokale-wood font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 text-lokale-wood font-bold hover:text-lokale-green transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Line amount */}
                      <div className="text-xs font-mono font-bold text-lokale-green w-24 text-right">
                        IDR {(item.product.price * item.quantity).toLocaleString()}
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 rounded text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Vouchers Board Card */}
            <div className="p-6 bg-lokale-orange-light/50 rounded-3xl border border-lokale-orange/20 space-y-4">
              <h3 className="text-xs font-mono font-bold text-lokale-green uppercase tracking-widest flex items-center space-x-1.5 border-b border-lokale-orange/25 pb-3">
                <Percent className="w-4 h-4 text-lokale-orange" />
                <span>{lang === "id" ? "Pusat Kupon Diskon Premium" : "Premium Vouchers Hub"}</span>
              </h3>
              <p className="text-lokale-wood/80 text-[11px] leading-relaxed font-normal">
                {lang === "id" 
                  ? "Ketuk salah satu kode kupon keanggotaan ini untuk menerapkannya secara instan:" 
                  : "Click any code matching your membership points level to apply it automatically:"}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div 
                  onClick={() => handleApplyQuickVoucher("STUCKCLUB")}
                  className="bg-white hover:bg-lokale-cream cursor-pointer p-3 rounded-xl border border-lokale-border transition-all hover:border-lokale-orange shadow-2xs"
                >
                  <strong className="text-lokale-green text-xs font-mono block">STUCKCLUB</strong>
                  <span className="text-[10px] text-lokale-wood/65 block font-normal mt-0.5">
                    {lang === "id" ? "Diskon 15% pesanan pertama untuk semua" : "15% off first order for all guests"}
                  </span>
                </div>
                <div 
                  onClick={() => handleApplyQuickVoucher("STUCKNEW")}
                  className="bg-white hover:bg-lokale-cream cursor-pointer p-3 rounded-xl border border-lokale-border transition-all hover:border-lokale-orange shadow-2xs"
                >
                  <strong className="text-lokale-green text-xs font-mono block">STUCKNEW</strong>
                  <span className="text-[10px] text-lokale-wood/65 block font-normal mt-0.5">
                    {lang === "id" ? "Diskon 20% khusus semua jenis seduh manual" : "20% off all manual coffee extractions"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout variables & Order summary right */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Delivery address particulars */}
            <div className="p-6 bg-white rounded-3xl border border-lokale-border space-y-4 shadow-sm text-lokale-wood">
              <h3 className="text-lokale-green font-serif font-bold text-sm border-b border-lokale-cream pb-3">
                {lang === "id" ? "Detail Pengantaran & Kamar" : "Delivery & Logistics Suite"}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-lokale-wood/60 uppercase tracking-wide font-bold">
                    {lang === "id" ? "Alamat Kamar / Hotel / Suite Tamu" : "Customer Suites Address"}
                  </label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood text-xs focus:outline-none focus:border-lokale-green"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-lokale-wood/60 uppercase tracking-wide font-bold">
                    {lang === "id" ? "Nomor Kontak Telepon Keanggotaan (Opsional)" : "Connoisseur Phone Contact (Optional)"}
                  </label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood text-xs focus:outline-none focus:border-lokale-green"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-lokale-wood/60 uppercase block tracking-wider mb-2 font-bold select-none text-left">
                    {lang === "id" ? "Pilih Metode Pembayaran Aktif" : "Select Payment Gateway Channel"}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {paymentChannels.length > 0 ? (
                      paymentChannels.map((channel) => (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => setPaymentMethod(channel.name)}
                          className={`p-3 rounded-2xl text-xs flex items-center justify-between border cursor-pointer font-bold font-serif shadow-3xs transition-all ${
                            paymentMethod === channel.name
                              ? "bg-lokale-green border-lokale-green text-white"
                              : "bg-lokale-cream border-lokale-border text-lokale-wood hover:border-lokale-green"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            {channel.image ? (
                              <img 
                                src={channel.image} 
                                alt={channel.name} 
                                className="w-7 h-7 object-cover rounded-lg border border-lokale-border bg-white flex-shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-lokale-green/10 flex items-center justify-center font-bold font-mono text-[9px] text-lokale-green uppercase">
                                {channel.name.slice(0, 2)}
                              </div>
                            )}
                            <div className="text-left font-sans">
                              <span className="block font-bold">{channel.name}</span>
                            </div>
                          </div>
                          <span className="text-[8px] font-mono uppercase bg-white/25 px-2 py-0.5 rounded italic">
                            {channel.type}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 bg-lokale-cream border border-lokale-border rounded-2xl text-center text-[10px] uppercase font-bold text-lokale-orange animate-pulse">
                        {lang === "id" ? "Menghubungkan Saluran Pembayaran..." : "Connecting payment service..."}
                      </div>
                    )}
                  </div>

                  {paymentChannels.find(c => c.name === paymentMethod) && (
                    <div className="mt-3.5 p-3.5 bg-lokale-cream rounded-2xl border border-lokale-border text-xs text-lokale-wood leading-relaxed font-sans shadow-3xs text-left animate-fadeIn">
                      <span className="text-[9px] font-mono uppercase text-lokale-orange font-bold tracking-widest block mb-1">📋 Detail Rekening & Metode:</span>
                      <p className="whitespace-pre-wrap text-stone-600 leading-relaxed font-medium">{paymentChannels.find(c => c.name === paymentMethod)?.details}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calculations breakdown order summaries */}
            <div className="p-6 bg-white rounded-3xl border border-lokale-border space-y-5 shadow-sm text-lokale-wood">
              <h3 className="text-lokale-green font-serif font-bold text-sm border-b border-lokale-cream pb-3">
                {lang === "id" ? "Pernyataan Faktur Operasional" : "Operational Invoice Statement"}
              </h3>
              
              {/* Voucher apply box */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-lokale-wood/60 uppercase block tracking-wide font-bold">
                  {lang === "id" ? "Kode Promo / Voucher" : "Promo Coupon code"}
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter STUCKCLUB..."
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="flex-grow uppercase font-mono px-3 py-2 bg-lokale-cream border border-lokale-border text-xs text-lokale-wood rounded-xl focus:outline-none focus:border-lokale-green"
                  />
                  <button
                    onClick={handleApplyVoucher}
                    className="px-4 py-2 rounded-xl bg-lokale-orange text-white hover:bg-lokale-orange/90 font-mono text-xs font-bold cursor-pointer"
                  >
                    {lang === "id" ? "Terapkan" : "Apply"}
                  </button>
                </div>
                {appliedVoucher && (
                  <span className="text-[10px] text-emerald-800 font-mono bg-emerald-50 p-2.5 rounded-lg border border-emerald-400/30 flex items-center justify-between font-bold">
                    <span>✓ Coupon {appliedVoucher.code} ({appliedVoucher.discountPercent}% OFF) applied!</span>
                    <button onClick={() => setAppliedVoucher(null)} className="text-[11px] underline">Clear</button>
                  </span>
                )}
                {voucherError && (
                  <span className="text-[10px] text-red-500 font-mono block mt-1">✗ {voucherError}</span>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-2.5 text-xs border-t border-lokale-cream pt-4">
                <div className="flex justify-between text-lokale-wood/65">
                  <span>{lang === "id" ? "Subtotal Pesanan:" : "Cart Items Subtotal:"}</span>
                  <span className="font-mono">IDR {subtotal.toLocaleString()}</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-lokale-orange font-bold">
                    <span>{lang === "id" ? "Diskon Loyalitas:" : "Loyalty Voucher Discount:"}</span>
                    <span className="font-mono">- IDR {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lokale-wood/65">
                  <span>{lang === "id" ? "Biaya Penataran Suite:" : "Acoustic Room Shipping:"}</span>
                  <span className="font-mono">{shippingFee === 0 ? "FREE" : `IDR ${shippingFee.toLocaleString()}`}</span>
                </div>
                
                <div className="pt-3 border-t border-lokale-cream flex justify-between items-center text-sm">
                  <span className="font-serif font-extrabold text-lokale-green">{lang === "id" ? "Nilai Jumlah Total:" : "Total Invoice Amount:"}</span>
                  <span className="font-mono font-black text-lokale-green text-[15px]">IDR {total.toLocaleString()}</span>
                </div>
                
                <div className="pt-1.5 text-lokale-wood/50 text-[10px] font-mono flex items-center justify-between">
                  <span>{lang === "id" ? "Poin Penikmat diperoleh:" : "Earn Connoisseur points:"}</span>
                  <span className="text-emerald-700 font-bold">+ {pointsEarned} Points</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || cartItems.length === 0}
                className="w-full py-4 rounded-xl bg-lokale-green hover:bg-lokale-green-light text-lokale-cream font-bold font-mono tracking-wider text-xs uppercase flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-45"
              >
                <span>{checkoutLoading 
                  ? (lang === "id" ? "MENGIRIM KE MIDTRANS..." : "SUBMITTING TO MIDTRANS...") 
                  : (lang === "id" ? "PROSES KE PEMBAYARAN SANDBOX" : "PROCEED TO SECURE SANDBOX PAYPOINT")}</span>
                <ArrowRight className="w-3.5 h-3.5 text-lokale-cream" />
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] text-lokale-wood/50 font-mono flex items-center justify-center space-x-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-lokale-orange" />
                  <span>XSS Validated, Role Permission Encrypted</span>
                </span>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
