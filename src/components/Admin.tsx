import { Shield, Sparkles, TrendingUp, Users, Calendar, ShoppingBag, Receipt, ArrowRight, Star, RefreshCw, Send, Check, X, ClipboardSignature, Plus, Minus, Trash2, ShoppingCart, Lock, Calculator, QrCode, Coins, User, Edit, FileText, Coffee, Upload, Link, Image, LogOut } from "lucide-react";
import { useState, useEffect, FormEvent } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "motion/react";
import { Order, Reservation, Product, ChatMessage, BrandLogo } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface AdminProps {
  brandLogo: BrandLogo;
  onRefreshLogo: () => void;
}

export default function Admin({ brandLogo, onRefreshLogo }: AdminProps) {
  const { lang } = useLanguage();
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  
  // Login credentials flow
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem("admin_logged_in") === "true";
    } catch {
      return false;
    }
  });
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Active states: Defaulting to 'pos' for direct checkout access
  const [activeSegment, setActiveSegment] = useState<'pos' | 'kpi' | 'orders' | 'chat' | 'items' | 'payments' | 'special_menu'>('pos');
  
  // Payment Methods States
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any | null>(null);
  const [newPmName, setNewPmName] = useState("");
  const [newPmType, setNewPmType] = useState("bank");
  const [newPmDetails, setNewPmDetails] = useState("");
  const [newPmImage, setNewPmImage] = useState("");
  const [newPmIsActive, setNewPmIsActive] = useState(true);
  const [pmUploadMethod, setPmUploadMethod] = useState<'upload' | 'url'>('upload');

  // POS States
  const [posCart, setPosCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [posCustomerName, setPosCustomerName] = useState("Pelanggan Stuck");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posCustomerEmail, setPosCustomerEmail] = useState("guest@stuck.com");
  const [posPaymentMethod, setPosPaymentMethod] = useState<'Midtrans' | 'Xendit' | 'QRIS' | 'Transfer Bank'>("QRIS");
  const [posCategoryFilter, setPosCategoryFilter] = useState<'all' | 'coffee' | 'non-coffee' | 'food' | 'cigar'>("all");
  const [posCheckoutSuccess, setPosCheckoutSuccess] = useState<any>(null);
  const [isPosSuccessAnimating, setIsPosSuccessAnimating] = useState(false);
  const [posSearchQuery, setPosSearchQuery] = useState("");
  const [posHistoryFilter, setPosHistoryFilter] = useState<'today' | 'yesterday' | 'tomorrow' | 'all'>('all');
  const [posHistoryDateSelect, setPosHistoryDateSelect] = useState<string>("");
  const [posHistorySearch, setPosHistorySearch] = useState("");

  // Reply box
  const [activeReplyRoom, setActiveReplyRoom] = useState<string>("chat-user");
  const [adminReplyText, setAdminReplyText] = useState("");
  
  // Add item form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("coffee");
  const [newItemSubCategory, setNewItemSubCategory] = useState("Manual Brew");
  const [newItemPrice, setNewItemPrice] = useState("75000");
  const [newItemStock, setNewItemStock] = useState("10");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemImage, setNewItemImage] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('upload');

  // Custom modals & banner states to bypass iframe confirm/alert blocks
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<any | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [adminNotification, setAdminNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setAdminNotification({ message, type });
    setTimeout(() => {
      setAdminNotification(null);
    }, 4000);
  };

  // Logo Modification States
  const [logoText, setLogoText] = useState(brandLogo?.text || "STUCK COFFEE & CIGAR");
  const [logoSubtext, setLogoSubtext] = useState(brandLogo?.subtext || "#stuckinmedan");
  const [logoType, setLogoType] = useState<"icon" | "image">(brandLogo?.type || "icon");
  const [logoImage, setLogoImage] = useState(brandLogo?.image || "");

  // Special Menu States
  const [specialMenu, setSpecialMenu] = useState<any[]>([]);
  const [editingSpecialItem, setEditingSpecialItem] = useState<any | null>(null);
  const [specialUploadMethod, setSpecialUploadMethod] = useState<'upload' | 'url'>('url');

  const handleEditSpecialItem = (item: any) => {
    setEditingSpecialItem({ ...item });
    setSpecialUploadMethod(item.image?.startsWith("data:") ? "upload" : "url");
  };

  const handleUpdateSpecialItemStore = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSpecialItem) return;

    const updatedMenu = specialMenu.map((item) => 
      item.id === editingSpecialItem.id ? editingSpecialItem : item
    );

    try {
      const res = await fetch("/api/special-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updatedMenu })
      });
      if (res.ok) {
        setSpecialMenu(updatedMenu);
        setEditingSpecialItem(null);
        triggerNotification(
          lang === "id" ? "Menu spesial berhasil diperbarui!" : "Special menu updated successfully!",
          "success"
        );
      } else {
        triggerNotification(lang === "id" ? "Gagal memperbarui menu spesial." : "Failed to update special menu.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error updating special menu", "error");
    }
  };

  const handleSpecialItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingSpecialItem((prev: any) => ({
          ...prev,
          image: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync logo settings if brandLogo loads reactively
  useEffect(() => {
    if (brandLogo) {
      setLogoText(brandLogo.text);
      setLogoSubtext(brandLogo.subtext);
      setLogoType(brandLogo.type);
      setLogoImage(brandLogo.image);
    }
  }, [brandLogo]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: logoText,
          subtext: logoSubtext,
          type: logoType,
          image: logoImage
        })
      });
      if (res.ok) {
        triggerNotification(
          lang === "id" ? "Logo & nama Stuck Coffee berhasil diperbarui!" : "Stuck Coffee brand name & logo updated successfully!",
          "success"
        );
        onRefreshLogo();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setNewItemName(p.name);
    setNewItemCategory(p.category);
    setNewItemSubCategory(p.subcategory);
    setNewItemPrice(String(p.price));
    setNewItemStock(String(p.stock));
    setNewItemDesc(p.description);
    const img = p.images && p.images[0] ? p.images[0] : "";
    setNewItemImage(img);
    
    // Auto detect if current image is a data URI / Base64 upload to focus the upload tab
    if (img && (img.startsWith("data:") || img.length > 500)) {
      setUploadMethod("upload");
    } else {
      setUploadMethod("url");
    }

    // Trigger clear action toast 
    triggerNotification(
      lang === "id" 
        ? `Memuat data: '${p.name}'. Cek formulir di atas!` 
        : `Editing '${p.name}'. Loaded into form!`, 
      "success"
    );

    // Smooth scroll straight to the form container
    setTimeout(() => {
      const container = document.getElementById("product-form-container");
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add temporary border highlight
        container.classList.add("ring-2", "ring-lokale-green", "ring-offset-2");
        setTimeout(() => {
          container.classList.remove("ring-2", "ring-lokale-green", "ring-offset-2");
        }, 1200);
      }
    }, 120);
  };

  const cancelEditProduct = () => {
    setEditingProduct(null);
    setNewItemName("");
    setNewItemCategory("coffee");
    setNewItemSubCategory("Manual Brew");
    setNewItemPrice("75000");
    setNewItemStock("10");
    setNewItemDesc("");
    setNewItemImage("");
  };

  const handleDeleteProduct = (id: string) => {
    const p = products.find(prod => prod.id === id);
    if (p) {
      setProductToDelete(p);
    }
  };

  const confirmDeleteProduct = async (id: string) => {
    try {
       const res = await fetch(`/api/products/${id}`, {
         method: "DELETE"
       });
       if (res.ok) {
         setProducts(prev => prev.filter(p => p.id !== id));
         triggerNotification(
           lang === "id" ? "Produk berhasil dihapus!" : "Product deleted successfully!", 
           "success"
         );
         if (editingProduct?.id === id) {
           cancelEditProduct();
         }
       } else {
         triggerNotification(
           lang === "id" ? "Gagal menghapus produk dari katalog." : "Failed to delete item from catalog.", 
           "error"
         );
       }
    } catch (err) {
       console.error(err);
       triggerNotification("System error during deletion", "error");
    } finally {
       setProductToDelete(null);
    }
  };

  // End of product delete handler flow

  const handleResetAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/reset-analytics", {
        method: "POST"
      });
      if (res.ok) {
        triggerNotification(
          lang === "id" 
            ? "Data analitik & omset berhasil diatur ulang menjadi 0!" 
            : "Analytics & revenue successfully reset to 0!",
          "success"
        );
        fetchAdminSuite();
      }
    } catch (err) {
      console.error("Failed to reset analytics:", err);
      triggerNotification("System error resetting metrics", "error");
    } finally {
      setShowResetConfirm(false);
    }
  };

  const COLORS = ["#3f5e4d", "#df8033", "#a8c0ab", "#f3ddbf"]; // Lokale matching hex tokens

  useEffect(() => {
    fetchAdminSuite();
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (adminUsername.toLowerCase() === "admin" && adminPassword === "stuckkesawan") {
      setIsLoggedIn(true);
      try {
        localStorage.setItem("admin_logged_in", "true");
      } catch (err) {
        console.error(err);
      }
      setLoginError("");
    } else {
      setLoginError(lang === "id" ? "Username atau password salah!" : "Invalid username or password!");
    }
  };

  const handleAddToPosCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(lang === "id" ? "Produk ini kehabisan stok!" : "This product is out of stock!");
      return;
    }
    setPosCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(lang === "id" ? `Maksimum pembelian sesuai stok (${product.stock}) tercapai!` : `Maximum limit reached based on available stock (${product.stock})!`);
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setPosCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    
    const cartItem = posCart.find(item => item.product.id === productId);
    if (cartItem && newQty > cartItem.product.stock) {
      alert(lang === "id" ? `Stok hanya tersedia ${cartItem.product.stock} unit!` : `Stock only has ${cartItem.product.stock} units left!`);
      return;
    }

    setPosCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: newQty } : item));
  };

  const handlePosCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (!posCart.length) return;

    try {
      const orderItems = posCart.map(item => ({
        id: `it-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          paymentMethod: posPaymentMethod,
          phone: posCustomerPhone,
          address: `In-Store POS (Stuck Kesawan)`,
          customerName: posCustomerName
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        
        // POS cashier order is immediately marked Paid & Processing -> Completed
        await fetch(`/api/orders/${orderData.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Completed" })
        });

        setPosCheckoutSuccess({
          ...orderData,
          status: "Completed",
          customerName: posCustomerName
        });
        
        setPosCart([]);
        fetchAdminSuite(); // reload parent charts & state
      } else {
        alert(lang === "id" ? "Gagal memproses transaksi kasir." : "Failed to record POS transaction.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing checkout.");
    }
  };

  const handleTriggerPosSuccessAnimation = () => {
    setIsPosSuccessAnimating(true);
    setTimeout(() => {
      setPosCheckoutSuccess(null);
      setIsPosSuccessAnimating(false);
    }, 3000);
  };

  const fetchAdminSuite = async () => {
    // 1. Fetch Metrics safely
    try {
      const mRes = await fetch("/api/admin/metrics");
      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData && mData.analytics) {
          setMetrics(mData.analytics);
        } else {
          throw new Error("Invalid analytics format");
        }
      } else {
        throw new Error(`HTTP ${mRes.status}`);
      }
    } catch (err) {
      console.warn("Could not load real-time analytics, using local/offline fallback dashboard metrics:", err);
      setMetrics({
        totalRevenue: 0,
        totalOrders: 0,
        pendingReservations: 0,
        approvedReservations: 0,
        activeMembersCount: 0,
        rewardPointsGiven: 0,
        monthlyRevenueData: [
          { name: "Jan", Sales: 0, Orders: 0 },
          { name: "Feb", Sales: 0, Orders: 0 },
          { name: "Mar", Sales: 0, Orders: 0 },
          { name: "Apr", Sales: 0, Orders: 0 },
          { name: "May", Sales: 0, Orders: 0 },
          { name: "Jun", Sales: 0, Orders: 0 }
        ],
        productDistribution: [
          { name: "Signature Coffee", value: 0 },
          { name: "Premium Cigar", value: 0 },
          { name: "Pastry / Food", value: 0 },
          { name: "Non-Coffee Tea", value: 0 }
        ]
      });
    }

    // 2. Fetch Orders safely
    try {
      const oRes = await fetch("/api/orders");
      if (oRes.ok) {
        const oData = await oRes.json();
        if (Array.isArray(oData)) {
          setOrders(oData);
        }
      }
    } catch (err) {
      console.warn("Could not sync orders:", err);
    }

    // 3. Fetch Reservations safely
    try {
      const rRes = await fetch("/api/reservations");
      if (rRes.ok) {
        const rData = await rRes.json();
        if (Array.isArray(rData)) {
          setReservations(rData);
        }
      }
    } catch (err) {
      console.warn("Could not sync reservations:", err);
    }

    // 4. Fetch Products safely
    try {
      const pRes = await fetch("/api/products");
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData)) {
          setProducts(pData);
        }
      }
    } catch (err) {
      console.warn("Could not sync catalog products:", err);
    }

    // 5. Fetch Chats safely
    try {
      const cRes = await fetch("/api/chats");
      if (cRes.ok) {
        const cData = await cRes.json();
        if (Array.isArray(cData)) {
          setChats(cData);
        }
      }
    } catch (err) {
      console.warn("Could not sync chats:", err);
    }

    // 6. Fetch Payment Methods safely
    try {
      const pmRes = await fetch("/api/payment-methods");
      if (pmRes.ok) {
        const pmData = await pmRes.json();
        if (Array.isArray(pmData)) {
          setPaymentMethods(pmData);
        }
      }
    } catch (err) {
      console.warn("Could not sync custom payment methods:", err);
    }

    // 7. Fetch Special Menu safely
    try {
      const smRes = await fetch("/api/special-menu");
      if (smRes.ok) {
        const smData = await smRes.json();
        if (Array.isArray(smData)) {
          setSpecialMenu(smData);
        }
      }
    } catch (err) {
      console.warn("Could not sync special menu:", err);
    }
  };

  const handleCreateOrUpdatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPmName.trim()) {
      triggerNotification("Payment method name is required", "error");
      return;
    }
    try {
      const payload = {
        name: newPmName,
        type: newPmType,
        details: newPmDetails,
        image: newPmImage,
        isActive: newPmIsActive
      };

      const url = editingPaymentMethod 
        ? `/api/payment-methods/${editingPaymentMethod.id}`
        : "/api/payment-methods";
      
      const method = editingPaymentMethod ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewPmName("");
        setNewPmDetails("");
        setNewPmImage("");
        setNewPmIsActive(true);
        setEditingPaymentMethod(null);
        fetchAdminSuite();
        triggerNotification(
          editingPaymentMethod 
            ? (lang === "id" ? "Metode pembayaran berhasil diupdate!" : "Payment method updated!")
            : (lang === "id" ? "Metode pembayaran berhasil ditambahkan!" : "Payment method created!"),
          "success"
        );
      } else {
        triggerNotification("Failed to save payment method", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error saving payment method", "error");
    }
  };

  const handleEditPaymentMethod = (pm: any) => {
    setEditingPaymentMethod(pm);
    setNewPmName(pm.name);
    setNewPmType(pm.type);
    setNewPmDetails(pm.details || "");
    setNewPmImage(pm.image || "");
    setNewPmIsActive(pm.isActive);
    setPmUploadMethod(pm.image && pm.image.startsWith("data:") ? "upload" : "url");

    // Scroll smoothly to form
    const formElement = document.getElementById("pm-setup-form-container");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDeletePaymentMethod = (pm: any) => {
    setPaymentMethodToDelete(pm);
  };

  const confirmDeletePaymentMethod = async (id: string) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdminSuite();
        triggerNotification(
          lang === "id" ? "Metode pembayaran terhapus!" : "Payment method deleted successfully!",
          "success"
        );
        setPaymentMethodToDelete(null);
      } else {
        triggerNotification("Failed to delete payment method", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error deleting payment method", "error");
    }
  };

  const handlePmImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPmImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const cancelEditPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setNewPmName("");
    setNewPmDetails("");
    setNewPmImage("");
    setNewPmIsActive(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // local update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
        fetchAdminSuite(); // refresh charts
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = (ord: any) => {
    setOrderToDelete(ord);
  };

  const confirmDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        triggerNotification(
          lang === "id" ? "Pesanan berhasil dihapus!" : "Order deleted successfully!",
          "success"
        );
        setOrderToDelete(null);
        fetchAdminSuite();
      } else {
        triggerNotification("Failed to delete order", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error deleting order", "error");
    }
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.removeItem("admin_logged_in");
    } catch (err) {
      console.error(err);
    }
    triggerNotification(
      lang === "id" ? "Lolos keluar admin berhasil!" : "Admin logged out successfully!",
      "success"
    );
  };

  const handlePrintReceipt = (ord: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print your receipt!");
      return;
    }
    
    let itemsHtml = "";
    ord.items.forEach((it: any) => {
      itemsHtml += '<tr style="border-bottom: 1px dashed #e2e8f0; font-size: 13px;">';
      itemsHtml += '<td style="padding: 10px 0;">';
      itemsHtml += '<div style="font-weight: bold; color: #1e3a1e;">' + it.name + '</div>';
      itemsHtml += '<div style="font-size: 11px; color: #783e1a; font-family: monospace;">' + it.quantity + ' x IDR ' + it.price.toLocaleString() + '</div>';
      itemsHtml += '</td>';
      itemsHtml += '<td style="text-align: right; padding: 10px 0; font-family: monospace; font-weight: bold; color: #1e3a1e;">';
      itemsHtml += 'IDR ' + (it.price * it.quantity).toLocaleString();
      itemsHtml += '</td>';
      itemsHtml += '</tr>';
    });

    const subtotal = ord.subtotal || ord.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const discount = ord.discount || 0;
    const tax = ord.tax || 0;
    const total = ord.total || (subtotal - discount + tax);
    const customerName = ord.customerName === "Pelanggan Kesawan" ? "Pelanggan Stuck" : (ord.customerName || "LOYAL GUEST");

    let html = '<html><head><title>Stuck Coffee & Cigar - Receipt</title>';
    html += '<style>';
    html += '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:wght@700;900&display=swap");';
    html += 'body { font-family: "Inter", sans-serif; margin: 0; padding: 20px; color: #2d3748; background-color: #ffffff; }';
    html += '.receipt-card { max-width: 380px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: #fff; position: relative; }';
    html += '.header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 20px; }';
    html += '.brand-title { font-family: "Playfair Display", serif; font-weight: 900; font-size: 24px; color: #1e3a1e; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }';
    html += '.brand-subtitle { font-size: 11px; color: #7b7a76; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 3px 0; }';
    html += '.brand-phone { font-size: 10px; color: #a0aec0; margin: 0; }';
    html += '.meta-info { font-size: 11px; line-height: 1.6; margin-bottom: 20px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 15px; }';
    html += '.meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }';
    html += '.meta-label { color: #718096; }';
    html += '.meta-value { font-weight: 600; color: #2d3748; }';
    html += '.order-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }';
    html += '.totals-section { border-top: 2px dashed #cbd5e1; padding-top: 15px; margin-top: 15px; font-size: 12px; }';
    html += '.total-row { display: flex; justify-content: space-between; margin-bottom: 6px; }';
    html += '.grand-total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #1e3a1e; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 10px; }';
    html += '.footer { text-align: center; margin-top: 30px; font-size: 10px; color: #718096; line-height: 1.5; }';
    html += '.footer-star { color: #d97706; font-weight: bold; margin-bottom: 8px; font-size: 12px; }';
    html += '@media print { body { padding: 0; background-color: transparent; } .receipt-card { border: none; box-shadow: none; max-width: 100%; padding: 10px; } .no-print { display: none; } }';
    html += '</style></head><body>';
    html += '<div class="receipt-card">';
    html += '<div class="header">';
    html += '<h1 class="brand-title">Stuck Coffee & Cigar</h1>';
    html += '<p class="brand-subtitle">Kesawan, Medan Kota, Indonesia</p>';
    html += '<p class="brand-phone">Tel: +62 61 451 8821</p>';
    html += '</div>';
    
    html += '<div class="meta-info">';
    html += '<div class="meta-row"><span class="meta-label">Invoice:</span><span class="meta-value" style="color: #1e3a1e;">' + ord.invoiceNumber + '</span></div>';
    html += '<div class="meta-row"><span class="meta-label">Tanggal:</span><span class="meta-value">' + new Date(ord.createdAt || Date.now()).toLocaleString([], {hour12:false}) + '</span></div>';
    html += '<div class="meta-row"><span class="meta-label">Kasir:</span><span class="meta-value">ADMIN REGISTER - STUCK KESAWAN</span></div>';
    html += '<div class="meta-row"><span class="meta-label">Metode Bayar:</span><span class="meta-value">' + (ord.paymentMethod || "QRIS") + '</span></div>';
    html += '<div class="meta-row"><span class="meta-label">Status:</span><span class="meta-value" style="color: #d97706; text-transform: uppercase;">' + ord.status + '</span></div>';
    html += '<div class="meta-row"><span class="meta-label">Pelanggan:</span><span class="meta-value">' + customerName + '</span></div>';
    html += '</div>';
 
     html += '<table class="order-table">';
     html += '<thead><tr style="border-bottom: 2px solid #1e3a1e; font-size: 11px; text-transform: uppercase; color: #718096; text-align: left;"><th style="padding-bottom: 8px;">Menu Item</th><th style="text-align: right; padding-bottom: 8px;">Total</th></tr></thead>';
     html += '<tbody>' + itemsHtml + '</tbody>';
     html += '</table>';
 
     html += '<div class="totals-section">';
     html += '<div class="total-row"><span>Subtotal:</span><span style="font-family: monospace;">IDR ' + subtotal.toLocaleString() + '</span></div>';
     if (discount > 0) {
       html += '<div class="total-row" style="color: #ea580c; font-weight: bold;"><span>Diskon Kupon:</span><span style="font-family: monospace;">- IDR ' + discount.toLocaleString() + '</span></div>';
     }
     if (tax > 0) {
       html += '<div class="total-row"><span>Pajak (PB1 11%):</span><span style="font-family: monospace;">IDR ' + tax.toLocaleString() + '</span></div>';
     }
     html += '<div class="grand-total-row"><span>TOTAL TRANSAKSI:</span><span style="font-family: monospace;">IDR ' + total.toLocaleString() + '</span></div>';
     html += '</div>';

    html += '<div class="footer">';
    html += '<div class="footer-star">★ LUNAS / SETTLED ★</div>';
    html += '<p>Terima kasih banyak atas kunjungan Anda di kedai asri Stuck Kesawan!</p>';
    html += '<p style="font-size: 8px; margin-top: 15px; color: #cbd5e1;">Generated electronically • Verified by Backoffice Console</p>';
    html += '</div></div>';
    
    html += '<script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>';
    html += '</body></html>';

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleUpdateSeatingStatus = async (resvId: string, status: string) => {
    try {
      const res = await fetch(`/api/reservations/${resvId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setReservations(prev => prev.map(r => r.id === resvId ? { ...r, status: status as any } : r));
        fetchAdminSuite();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAdminReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim()) return;
    const currentReplyText = adminReplyText;
    setAdminReplyText("");

    try {
      const res = await fetch("/api/admin/chats/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentReplyText })
      });
      const roomData = await res.json();
      if (res.ok) {
        setChats(prev => prev.map(c => c.id === activeReplyRoom ? roomData : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;

    const payload = {
      name: newItemName,
      category: newItemCategory,
      subcategory: newItemSubCategory,
      price: Number(newItemPrice),
      stock: Number(newItemStock),
      description: newItemDesc,
      images: newItemImage ? [newItemImage] : ["https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop"]
    };

    try {
      if (editingProduct) {
        // PUT EDIT OPERATION
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
          triggerNotification(
            lang === "id" ? `Katalog '${newItemName}' berhasil diperbarui!` : `Catalog item '${newItemName}' updated successfully.`,
            "success"
          );
          cancelEditProduct();
        }
      } else {
        // POST CREATE OPERATION
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const added = await res.json();
          setProducts(prev => [added, ...prev]);
          triggerNotification(
            lang === "id" ? `Sukses! '${newItemName}' ditambahkan ke katalog.` : `Finished! '${newItemName}' added successfully to active catalog.`,
            "success"
          );
          cancelEditProduct();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-lokale-cream">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full bg-white border border-lokale-border rounded-3xl p-8 shadow-md text-lokale-wood"
        >
          
          <div className="text-center space-y-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-lokale-green border border-lokale-green/30 text-lokale-orange flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-5 h-5 text-lokale-orange animate-pulse" />
            </div>
            
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-lokale-green">
              {lang === "id" ? "Akses Kasir & Admin" : "Cashier & Admin Portal"}
            </h2>
            <p className="text-xs text-lokale-wood/65 leading-relaxed">
              {lang === "id" 
                ? "Silakan login menggunakan akun kasir stuck coffee and cigar untuk menginput pesanan menu secara digital."
                : "Please authenticate values to proceed with order inputs, stock updates, and ticket resolutions."}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-[10px] text-lokale-wood/65 uppercase tracking-wider block mb-1.5 font-black">Username</label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-lokale-wood/65 uppercase tracking-wider block mb-1.5 font-black">Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood text-xs focus:outline-none"
              />
            </div>

            {loginError && (
              <p className="text-red-500 font-bold text-xs mt-1 text-center font-mono">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-lokale-green hover:bg-lokale-green-light text-white font-mono text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer font-bold shadow-sm"
            >
              Sign In to Cashier App →
            </button>
          </form>

        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lux-grid min-h-screen bg-lokale-cream"
    >
      
      {/* Admin Title Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between border-b border-lokale-border pb-8 mb-10">
        <div className="text-center lg:text-left animate-fadeIn">
          <div className="flex items-center justify-center lg:justify-start space-x-2 text-lokale-orange font-mono text-xs uppercase tracking-[0.2em] font-bold">
            <Shield className="w-4 h-4 text-lokale-orange" />
            <span>{lang === "id" ? "KASIR DIGITAL & KONSOL ADM STUCK COFFEE" : "SECURE DIGITAL CASHIER & BACKOFFICE CONCIERGE"}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-lokale-green mt-2">
            {lang === "id" ? "Aplikasi Kasir Digital" : "Digital Cashier & POS"}
          </h1>
        </div>

        {/* Action Tabs selectors */}
        <div className="flex flex-wrap gap-2 mt-6 lg:mt-0 justify-center">
          {[
            { id: 'pos', label: lang === "id" ? "Kasir Kelola POS" : "Cashier POS register" },
            { id: 'kpi', label: lang === "id" ? "Analitik Omset" : "Omset Analytics" },
            { id: 'orders', label: lang === "id" ? "Riwayat Pesanan Toko" : "Order Registers" },
            { id: 'chat', label: lang === "id" ? "Live Chat Admin ke Client" : "Admin Live Chat to Client" },
            { id: 'items', label: lang === "id" ? "Kelola Persediaan" : "Manage Inventory" },
            { id: 'payments', label: lang === "id" ? "Metode Pembayaran" : "Payment Methods" },
            { id: 'special_menu', label: lang === "id" ? "Menu Spesial" : "Special Menu" }
          ].map((seg) => (
            <button
              key={seg.id}
              onClick={() => setActiveSegment(seg.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all border cursor-pointer font-bold ${
                activeSegment === seg.id
                  ? "bg-lokale-green text-white border-lokale-green shadow-xs"
                  : "bg-white text-lokale-wood border-lokale-border hover:bg-lokale-cream"
              }`}
            >
              {seg.label}
            </button>
          ))}
          <button 
            onClick={fetchAdminSuite}
            className="p-2.5 bg-white border border-lokale-border text-lokale-wood hover:text-lokale-green rounded-xl cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={handleAdminLogout}
            className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold transition-all hover:scale-102"
            title={lang === "id" ? "Log Out Admin" : "Log Out Admin"}
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === "id" ? "Keluar" : "Logout"}</span>
          </button>
        </div>
      </div>

      {metrics ? (
        <div className="space-y-10 animate-fadeIn">
          
          {/* SEGMENT 0: DIGITAL CASHIER (POS REGISTER INPUTS) */}
          {activeSegment === 'pos' && (
            <div className="space-y-12 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Product Selection Grid */}
              <div className="lg:col-span-7 bg-white border border-lokale-border rounded-3xl p-6 space-y-6 shadow-sm text-lokale-wood">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lokale-green font-serif font-black text-lg">{lang === "id" ? "Eksplorasi Katalog Menu" : "Katalog Menu Explorer"}</h3>
                    <p className="text-lokale-wood/60 text-xs mt-1">{lang === "id" ? "Tap item untuk masukkan pesanan pelanggan." : "Select items to add to current ticket."}</p>
                  </div>
                  
                  {/* Search Input bar */}
                  <input
                    type="text"
                    value={posSearchQuery}
                    onChange={(e) => setPosSearchQuery(e.target.value)}
                    placeholder={lang === "id" ? "Cari menu kopi/cerutu..." : "Search menu..."}
                    className="px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-xs focus:outline-none focus:border-lokale-green w-full sm:w-48 font-mono text-lokale-wood"
                  />
                </div>

                {/* Categories filtering row buttons */}
                <div className="flex flex-wrap gap-1.5 border-b border-lokale-cream pb-4">
                  {(['all', 'coffee', 'non-coffee', 'food', 'cigar'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPosCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all font-bold cursor-pointer ${
                        posCategoryFilter === cat
                          ? "bg-lokale-orange text-white"
                          : "bg-lokale-cream text-lokale-wood hover:bg-lokale-beige shadow-2xs"
                      }`}
                    >
                      {cat === 'all' ? (lang === "id" ? "Semua Varian" : "All Items") : cat}
                    </button>
                  ))}
                </div>

                {/* Item grid cards with stock verification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {products
                    .filter((p) => {
                      const matchesCategory = posCategoryFilter === 'all' || p.category === posCategoryFilter;
                      const matchesSearch = p.name.toLowerCase().includes(posSearchQuery.toLowerCase()) || 
                                           p.subcategory.toLowerCase().includes(posSearchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    })
                    .map((p) => {
                      const isOutOfStock = p.stock <= 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => !isOutOfStock && handleAddToPosCart(p)}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-40 group ${
                            isOutOfStock
                              ? "bg-neutral-50 border-neutral-200 opacity-60 cursor-not-allowed"
                              : "bg-lokale-cream/40 border-lokale-border hover:border-lokale-green hover:bg-white cursor-pointer shadow-2xs"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-mono text-lokale-orange font-bold uppercase tracking-wider">{p.subcategory}</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                                isOutOfStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {isOutOfStock ? (lang === "id" ? "Habis" : "Sold Out") : `${p.stock} pcs`}
                              </span>
                            </div>
                            <h4 className="font-serif font-black text-sm text-lokale-green group-hover:text-lokale-orange transition-colors line-clamp-1">{p.name}</h4>
                            <p className="text-[10px] text-lokale-wood/65 truncate font-sans font-normal leading-normal">{p.description}</p>
                          </div>

                          <div className="flex justify-between items-end pt-2 border-t border-lokale-cream/50 mt-2">
                            <span className="font-mono text-xs font-bold text-lokale-green">IDR {p.price.toLocaleString()}</span>
                            <span className="w-6 h-6 rounded-lg bg-lokale-green text-white flex items-center justify-center text-xs font-bold group-hover:scale-105 transition-transform">+</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column: Dynamic Cashier Cart Invoice & Billing */}
              <form onSubmit={handlePosCheckout} className="lg:col-span-5 bg-white border border-lokale-border rounded-3xl p-6 space-y-6 shadow-sm text-lokale-wood flex flex-col justify-between min-h-[500px]">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b pb-3 border-lokale-cream">
                    <h3 className="font-serif font-black text-lg text-lokale-green flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5 text-lokale-orange" />
                      <span>{lang === "id" ? "Struk Penjualan Aktif" : "Active Invoice Cart"}</span>
                    </h3>
                    <span className="text-xs bg-lokale-orange-light text-lokale-orange border border-lokale-orange/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {posCart.reduce((acc, c) => acc + c.quantity, 0)} Items
                    </span>
                  </div>

                  {/* Customer Info row inputs */}
                  <div className="space-y-3 font-mono text-xs bg-lokale-cream/30 p-4 rounded-2xl border border-lokale-border">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-lokale-wood/65 uppercase block font-black mb-1">{lang === "id" ? "Nama Tamu" : "Guest Name"}</label>
                        <input
                          type="text"
                          required
                          value={posCustomerName}
                          onChange={(e) => setPosCustomerName(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-white border border-lokale-border text-[11px] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-lokale-wood/65 uppercase block font-black mb-1">{lang === "id" ? "Nomor Telepon (Opsional)" : "Phone (Optional)"}</label>
                        <input
                          type="text"
                          value={posCustomerPhone}
                          onChange={(e) => setPosCustomerPhone(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-white border border-lokale-border text-[11px] focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[9px] text-lokale-wood/65 uppercase block font-black mb-1">{lang === "id" ? "Metode Pembayaran Kasir" : "Payment Method"}</label>
                      <select
                        value={posPaymentMethod}
                        onChange={(e: any) => setPosPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-white border border-lokale-border text-[11px] focus:outline-none cursor-pointer"
                      >
                        <option value="QRIS">QRIS Dinamis (Stuck QR)</option>
                        <option value="Transfer Bank">Transfer Bank Tunai</option>
                        <option value="Midtrans">Tunai / Cash Register</option>
                        <option value="Xendit">Debit Card EDC</option>
                      </select>
                    </div>
                  </div>

                  {/* Receipt Lists of items added */}
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {posCart.length === 0 ? (
                      <div className="text-center py-12 text-lokale-wood/40 text-xs italic font-mono flex flex-col items-center justify-center space-y-2">
                        <Calculator className="w-8 h-8 text-lokale-wood/30" />
                        <span>{lang === "id" ? "Keranjang kasir kosong" : "Register empty - select products"}</span>
                      </div>
                    ) : (
                      posCart.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-center bg-lokale-cream/20 p-2.5 rounded-xl border border-lokale-border/60 text-xs">
                          <div className="max-w-xs space-y-0.5">
                            <span className="font-serif font-black text-lokale-green block leading-tight">{item.product.name}</span>
                            <span className="text-[10px] text-lokale-wood/55 font-mono block">IDR {item.product.price.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                              className="p-1 rounded bg-lokale-cream border border-lokale-border text-lokale-wood font-extrabold hover:text-lokale-green w-5 h-5 flex items-center justify-center cursor-pointer shadow-3xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-lokale-green w-4 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                              className="p-1 rounded bg-lokale-cream border border-lokale-border text-lokale-wood font-extrabold hover:text-lokale-green w-5 h-5 flex items-center justify-center cursor-pointer shadow-3xs"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.product.id, 0)}
                              className="p-1 text-red-500 hover:text-red-700 cursor-pointer pl-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Total breakdowns & submit */}
                <div className="pt-4 border-t border-lokale-cream/80 space-y-4">
                  <div className="space-y-1.5 font-mono text-xs text-lokale-wood/80">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>IDR {posCart.reduce((acc, c) => acc + (c.product.price * c.quantity), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pajak (PB1 11%)</span>
                      <span>IDR {Math.round(posCart.reduce((acc, c) => acc + (c.product.price * c.quantity), 0) * 0.11).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lokale-green font-black text-sm border-t border-lokale-cream pt-2 mt-2">
                      <span>Total Invoice</span>
                      <span>IDR {Math.round(posCart.reduce((acc, c) => acc + (c.product.price * c.quantity), 0) * 1.11).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={posCart.length === 0}
                    className={`w-full py-3 text-center uppercase tracking-widest text-xs font-mono font-black rounded-xl transition-all border shadow-sm ${
                      posCart.length === 0
                        ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                        : "bg-lokale-orange hover:bg-lokale-orange-light text-white border-lokale-orange cursor-pointer"
                    }`}
                  >
                    {lang === "id" ? "✓ Cetak Struk & Simpan Pesanan" : "✓ Record Order & Cashier Print"}
                  </button>
                </div>
              </form>

              {/* Receipt Popup Modal on checkout success */}
              {posCheckoutSuccess && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white max-w-sm w-full p-6 sm:p-8 rounded-3xl border border-lokale-border shadow-xl text-lokale-wood relative max-h-[90vh] overflow-y-auto font-mono text-xs animate-scaleIn">
                    
                    {/* Thermal receipt decoration borders */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-lokale-green to-lokale-orange" />
                    
                    {isPosSuccessAnimating ? (
                      /* GLORIOUS SUCCESS CHECKMARK ANIMATION IN RECEIPT */
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
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
                            className="relative w-18 h-18 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                          >
                            <Check className="w-8 h-8 text-white stroke-[4px]" />
                          </motion.div>
                        </div>

                        <div className="space-y-2 max-w-xs">
                          <motion.h4 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="font-serif text-xl font-black text-emerald-700 uppercase tracking-wide"
                          >
                            {lang === "id" ? "Transaksi Berhasil!" : "Settle Success!"}
                          </motion.h4>
                          <motion.span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full inline-block">
                            {lang === "id" ? "TERVERIFIKASI" : "VERIFIED"}
                          </motion.span>
                          <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-stone-600 font-sans text-xs font-medium leading-relaxed"
                          >
                            {lang === "id"
                              ? "Transaksi POS sukses dikonfirmasi! Faktur akan otomatis ditutup sebentar lagi."
                              : "The cashier transaction was verified successfully. Dismissing receipt automatically."}
                          </motion.p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-neutral-300">
                          <h4 className="font-serif text-lg font-black text-lokale-green uppercase">Stuck Coffee & Cigar</h4>
                          <p className="text-[10px] text-lokale-wood/60 uppercase">Kesawan, Medan Kota, Indonesia</p>
                          <p className="text-[9px] text-lokale-wood/50">Tel: +62 61 451 8821</p>
                        </div>

                        <div className="py-4 space-y-1 border-b border-dashed border-neutral-300 font-mono text-[10px] text-lokale-wood/80">
                          <div className="flex justify-between">
                            <span>Invoice:</span>
                            <span className="font-bold text-lokale-green">{posCheckoutSuccess.invoiceNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tanggal:</span>
                            <span>{new Date(posCheckoutSuccess.createdAt).toLocaleString([], {hour12:false})}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kasir:</span>
                            <span className="uppercase">ADMIN REGISTER #01</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pelanggan:</span>
                            <span className="font-bold uppercase text-lokale-orange">{posCheckoutSuccess.customerName || "LOYAL GUEST"}</span>
                          </div>
                        </div>

                        {/* Bought Items list matching classic receipt styles */}
                        <div className="py-4 space-y-2.5 border-b border-dashed border-neutral-300">
                          {posCheckoutSuccess.items.map((it: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between font-bold text-lokale-green text-[11px]">
                                <span>{it.name}</span>
                                <span>IDR {(it.price * it.quantity).toLocaleString()}</span>
                              </div>
                              <div className="text-[10px] text-lokale-wood/50 pl-2">
                                {it.quantity} x IDR {it.price.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="py-4 space-y-1.5 text-right font-mono text-[11px] border-b border-dashed border-neutral-300">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>IDR {posCheckoutSuccess.subtotal.toLocaleString()}</span>
                          </div>
                          {posCheckoutSuccess.tax > 0 && (
                            <div className="flex justify-between">
                              <span>Pajak (PB1 11%):</span>
                              <span>IDR {posCheckoutSuccess.tax.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-black text-lokale-green border-t pt-1.5 border-neutral-200 mt-1.5 text-xs">
                            <span>TOTAL TRANSAKSI:</span>
                            <span>IDR {posCheckoutSuccess.total.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="pt-6 text-center space-y-4">
                          {/* Generates a cute simulated QR tag for receipt verification */}
                          <div className="w-24 h-24 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-center mx-auto text-neutral-400 p-2">
                            <QrCode className="w-20 h-20 text-lokale-green" />
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-[10px] text-lokale-green uppercase tracking-wide font-black">{lang === "id" ? "★ SUDAH LUNAS (PAID) ★" : "★ TRANSACTION SETTLED ★"}</p>
                            <p className="text-[9px] text-lokale-wood/50 leading-relaxed font-normal">{lang === "id" ? "Terima kasih banyak atas kunjungannya di kedai asri Stuck Kesawan!" : "Thank you for supporting small outdoor local craft in Kesawan!"}</p>
                          </div>

                          {/* Close receipt button and checkmark anim button side-by-side */}
                          <div className="flex items-center gap-2 w-full">
                            <button
                              id="btn-tutup-struk"
                              type="button"
                              onClick={() => setPosCheckoutSuccess(null)}
                              className="flex-grow py-2.5 bg-lokale-green hover:bg-lokale-green-light text-white rounded-xl font-bold uppercase text-[10px] transition-all cursor-pointer shadow-sm border border-lokale-green"
                            >
                              {lang === "id" ? "Tutup Struk Kasir" : "Dismiss Receipt"}
                            </button>
                            <button
                              type="button"
                              onClick={handleTriggerPosSuccessAnimation}
                              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all cursor-pointer shadow-sm border border-emerald-600 flex items-center justify-center flex-shrink-0"
                              title={lang === "id" ? "Verifikasi & Animasi Sukses" : "Verify & Success Animation"}
                            >
                              <Check className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                  </div>
                </div>
              )}

              </div>

              {/* REPORT & LIVE SALES TICKETS FILTER */}
              {(() => {
                const getOrderDayCategory = (dateString: string) => {
                  try {
                    const orderDate = new Date(dateString);
                    if (isNaN(orderDate.getTime())) return "other";
                    
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    const tomorrow = new Date();
                    tomorrow.setDate(today.getDate() + 1);

                    const orderYMD = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
                    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    const yesterdayYMD = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
                    const tomorrowYMD = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

                    if (orderYMD === todayYMD) return "today";
                    if (orderYMD === yesterdayYMD) return "yesterday";
                    
                    const orderMidnight = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
                    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    if (orderMidnight > todayMidnight) {
                      return "tomorrow";
                    }
                    
                    return "other";
                  } catch (e) {
                    return "other";
                  }
                };

                const posHistoryOrders = orders || [];

                // Group all order lists
                const todayOrders = posHistoryOrders.filter(o => getOrderDayCategory(o.createdAt) === 'today');
                const yesterdayOrders = posHistoryOrders.filter(o => getOrderDayCategory(o.createdAt) === 'yesterday');
                const tomorrowOrders = posHistoryOrders.filter(o => getOrderDayCategory(o.createdAt) === 'tomorrow');

                // Generate clean calendar date strings for simplified headers
                const todayObj = new Date();
                const yesterdayObj = new Date();
                yesterdayObj.setDate(todayObj.getDate() - 1);
                const tomorrowObj = new Date();
                tomorrowObj.setDate(todayObj.getDate() + 1);

                const formatDateLabel = (d: Date) => {
                  return d.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  });
                };

                const todayDateLabel = formatDateLabel(todayObj);
                const yesterdayDateLabel = formatDateLabel(yesterdayObj);
                const tomorrowDateLabel = formatDateLabel(tomorrowObj);

                // Compute revenues
                const todaySalesSum = todayOrders.reduce((sum, o) => sum + o.total, 0);
                const yesterdaySalesSum = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
                const tomorrowSalesSum = tomorrowOrders.reduce((sum, o) => sum + o.total, 0);

                // Set filter list based on active state tab or selected date
                let filteredList = posHistoryOrders;
                if (posHistoryDateSelect) {
                  filteredList = posHistoryOrders.filter(o => {
                    const orderDate = new Date(o.createdAt);
                    const ymd = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
                    return ymd === posHistoryDateSelect;
                  });
                }

                // Apply text search
                if (posHistorySearch.trim() !== '') {
                  const q = posHistorySearch.toLowerCase();
                  filteredList = filteredList.filter(o => 
                    o.invoiceNumber.toLowerCase().includes(q) || 
                    o.customerName.toLowerCase().includes(q) ||
                    (o.phone && o.phone.toLowerCase().includes(q))
                  );
                }

                const totalRevenueAllTime = posHistoryOrders.reduce((sum, o) => sum + o.total, 0);
                const totalOrdersCount = posHistoryOrders.length;

                return (
                  <div className="bg-white border border-lokale-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm text-lokale-wood animate-fadeIn">
                    
                    {/* Header Details */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-lokale-cream pb-5">
                      <div>
                        <div className="flex items-center space-x-2 text-lokale-orange text-xs font-mono font-bold uppercase tracking-widest">
                          <Receipt className="w-4 h-4 text-lokale-orange animate-pulse" />
                          <span>{lang === "id" ? "Panel Kontrol Penjualan Kasir" : "Cashier Ledger Activity Control"}</span>
                        </div>
                        <h3 className="font-serif font-black text-xl sm:text-2xl text-lokale-green mt-1">
                          {lang === "id" ? "Laporan & Riwayat Penjualan POS" : "POS Order Ledger & Reports"}
                        </h3>
                        <p className="text-xs text-lokale-wood/65 mt-1 leading-normal">
                          {lang === "id" 
                            ? "Pantau seluruh transaksi penjualan masuk secara langsung secara kronologis dari database."
                            : "Monitor live transactions and analyze ticket logs structured chronologically."}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 bg-lokale-cream/50 px-3.5 py-1.5 rounded-full border border-lokale-border w-fit">
                        <div className="w-2 h-2 rounded-full bg-lokale-orange animate-pulse" />
                        <span className="text-[10px] font-mono font-black text-lokale-green">LIVE UPDATER ACTIVE</span>
                      </div>
                    </div>

                    {/* Sales Summary Statistics Cards - Simplification */}
                    <div className="bg-lokale-cream/20 border border-lokale-border p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      
                      {/* Metric overall */}
                      <div className="md:col-span-2 space-y-2">
                        <span className="text-[10px] font-mono font-black text-lokale-orange uppercase tracking-wider block animate-pulse">
                          📈 {lang === "id" ? "Statistik Omset & Penjualan Kumulatif" : "Cumulative Turnover & Sales Stats"}
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                          <strong className="text-3xl font-mono text-lokale-green font-black leading-none">
                            IDR {totalRevenueAllTime.toLocaleString()}
                          </strong>
                          <span className="text-xs text-lokale-wood/65 font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-lokale-border">
                            {totalOrdersCount} {lang === "id" ? "Transaksi Terjual" : "Settled Orders"}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-normal font-sans">
                          {lang === "id" 
                            ? "Menampilkan seluruh omset transaksi terintegrasi Sistem Stuck Group secara keseluruhan." 
                            : "Displaying complete aggregated historical ledger metrics pulled across live databases."}
                        </p>
                      </div>

                      {/* Direct Date picker with example */}
                      <div className="bg-white p-5 border border-lokale-border rounded-2xl space-y-3.5 shadow-2xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono mt-0.5 font-black text-lokale-green uppercase tracking-wide block">
                            📅 {lang === "id" ? "Pilih / Cari Tanggal" : "Select / Navigate Date"}
                          </label>
                          <p className="text-[9px] text-stone-400 font-sans italic leading-none">
                            {lang === "id" ? "Contoh format: Tgl/Bln/Thn" : "Example pattern: DD/MM/YYYY"}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <input 
                            type="date" 
                            value={posHistoryDateSelect}
                            onChange={(e) => setPosHistoryDateSelect(e.target.value)}
                            className="w-full px-3 py-2 border border-lokale-border rounded-xl text-xs font-mono text-lokale-wood focus:outline-none focus:border-lokale-green bg-neutral-50 hover:bg-neutral-100 transition-all cursor-pointer text-center"
                          />
                          
                          {posHistoryDateSelect && (
                            <div className="text-[10px] font-bold font-mono text-lokale-orange flex items-center justify-between bg-lokale-orange-light/20 px-2 py-1.5 rounded-lg border border-lokale-orange/30">
                              <span>
                                Filter: {new Date(posHistoryDateSelect).toLocaleDateString(lang === "id" ? 'id-ID' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                              <button 
                                onClick={() => setPosHistoryDateSelect("")}
                                className="text-red-600 hover:underline hover:text-red-700 cursor-pointer font-bold ml-1.5 text-[10px]"
                              >
                                {lang === "id" ? "Batal" : "Reset"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Integrated Quick Filter Row & Search Panel */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-lokale-cream">
                      
                      <button
                        type="button"
                        onClick={() => {
                          setPosHistoryDateSelect(""); // clear date filter
                        }}
                        className={`w-full md:w-auto px-5 py-2.5 rounded-2xl text-[11px] font-mono font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 border cursor-pointer ${
                          !posHistoryDateSelect 
                            ? "bg-lokale-green hover:bg-lokale-green/95 text-white border-lokale-green shadow-sm" 
                            : "bg-white hover:bg-lokale-cream text-lokale-wood border-lokale-border"
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {lang === "id" ? "LIHAT SEMUA HISTORY PESANAN (KAPAN SAJA)" : "VIEW OVERALL HISTORY (ALL TIME)"}
                        </span>
                      </button>

                      <div className="relative w-full md:w-72 font-mono">
                        <input
                          type="text"
                          value={posHistorySearch}
                          onChange={(e) => setPosHistorySearch(e.target.value)}
                          placeholder={lang === "id" ? "Cari No Invoice / Nama..." : "Search tickets / guests..."}
                          className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-xs focus:outline-none focus:border-lokale-green font-mono text-lokale-wood"
                        />
                      </div>
                    </div>

                    {/* Render matching filtered lists in an ultra elegant log style */}
                    <div className="space-y-4">
                      {filteredList.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-neutral-300 rounded-3xl text-lokale-wood/40 text-xs italic font-mono flex flex-col items-center justify-center space-y-2">
                          <Calendar className="w-10 h-10 text-lokale-wood/25" />
                          <span>
                            {lang === "id" 
                              ? "Tidak ada transaksi tercatat dalam filter tanggal atau kriteria pencarian ini." 
                              : "No transactions recorded for the selected date filter or search queries."}
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {filteredList.map((ord) => {
                            const dayTag = getOrderDayCategory(ord.createdAt);
                            return (
                              <div 
                                key={ord.id}
                                className="bg-lokale-cream/20 border border-lokale-border/80 hover:border-lokale-orange rounded-2xl p-5 shadow-3xs transition-all relative flex flex-col justify-between"
                              >
                                {/* Receipt header badge */}
                                <div className="flex items-start justify-between border-b border-lokale-cream/50 pb-3 mb-3">
                                  <div className="space-y-0.5">
                                    <strong className="text-[13px] text-lokale-green font-mono tracking-tight font-black">{ord.invoiceNumber}</strong>
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-[10px] text-lokale-wood/55 font-mono">
                                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      <span className="text-lokale-wood/30 text-[9px] font-mono">•</span>
                                      <span className="text-[10px] text-lokale-wood/55 font-mono">
                                        {new Date(ord.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end space-y-1">
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold flex items-center space-x-1 uppercase">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1" />
                                      <span>{ord.status === "Completed" ? (lang === "id" ? "Selesai" : "Completed") : ord.status}</span>
                                    </span>
                                    {dayTag === 'today' && (
                                      <span className="text-[8px] bg-lokale-orange-light text-lokale-orange px-1.5 py-0.5 rounded uppercase font-black tracking-wide font-mono">HARI INI</span>
                                    )}
                                    {dayTag === 'yesterday' && (
                                      <span className="text-[8px] bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded uppercase font-black tracking-wide font-mono">SEMALAM</span>
                                    )}
                                    {dayTag === 'tomorrow' && (
                                      <span className="text-[8px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase font-black tracking-wide font-mono">BESOK+</span>
                                    )}
                                  </div>
                                </div>

                                {/* Guest detail snippet */}
                                <div className="space-y-1 text-xs mb-3 font-mono bg-white/50 p-2.5 rounded-xl border border-neutral-200/20 text-[11px]">
                                  <div className="flex justify-between">
                                    <span className="text-lokale-wood/55 uppercase text-[9px] font-black">{lang === "id" ? "Tamu / Pelanggan:" : "Guest Name:"}</span>
                                    <span className="font-extrabold text-lokale-green uppercase">{ord.customerName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-lokale-wood/55 uppercase text-[9px] font-black">{lang === "id" ? "Nomor HP:" : "Contact Phone:"}</span>
                                    <span className="font-mono text-lokale-wood/80">{ord.phone || "---"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-lokale-wood/55 uppercase text-[9px] font-black">{lang === "id" ? "Meja / Lokasi:" : "Table / Location:"}</span>
                                    <span className="italic text-lokale-orange font-bold text-[10px]">{ord.address || "In-Store POS"}</span>
                                  </div>
                                </div>

                                {/* Ordered items breakdown */}
                                <div className="space-y-1.5 border-t border-b border-lokale-cream/40 py-2.5 my-2.5 max-h-24 overflow-y-auto">
                                  {ord.items.map((it: any, itIdx: number) => (
                                    <div key={itIdx} className="flex justify-between text-[11px] font-mono text-lokale-wood/85">
                                      <span className="font-sans font-bold text-lokale-green leading-tight">
                                        {it.name} <span className="text-lokale-orange font-bold font-mono">x{it.quantity}</span>
                                      </span>
                                      <span>IDR {(it.price * it.quantity).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Settlement Totals list */}
                                <div className="space-y-1 font-mono text-[10px] text-lokale-wood/75 pt-1.5">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>IDR {ord.subtotal.toLocaleString()}</span>
                                  </div>
                                  {ord.discount > 0 && (
                                    <div className="flex justify-between text-lokale-orange font-bold">
                                      <span>Potongan Diskon:</span>
                                      <span>-IDR {ord.discount.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {ord.tax > 0 && (
                                    <div className="flex justify-between">
                                      <span>Pajak (PB1 11%):</span>
                                      <span>IDR {ord.tax.toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-[12px] font-black text-lokale-green border-t border-dashed border-neutral-300 pt-2 mt-2">
                                    <span className="uppercase">{lang === "id" ? "TOTAL DIBAYAR:" : "GRAND TOTAL PAID:"}</span>
                                    <span>IDR {ord.total.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] font-bold text-lokale-orange border-t border-lokale-cream/40 pt-1.5 mt-1.5">
                                    <span>{lang === "id" ? "Metode Pembayaran:" : "Paid Via:"}</span>
                                    <span className="uppercase">{ord.paymentMethod}</span>
                                  </div>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}

            </div>
          )}

          {/* SEGMENT 1: EXECUTIVE ANALYTICS GRAPHICS */}
          {activeSegment === 'kpi' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Executive Panel Header with Reset triggers */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-lokale-cream/30 border border-lokale-border p-5 rounded-3xl">
                <div>
                  <h3 className="text-lokale-green font-serif font-black text-lg">
                    {lang === "id" ? "Panel Analitik Eksekutif" : "Executive Analytics Panel"}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                    {lang === "id" ? "Sinkronisasi real-time dengan server transaksi" : "Real-time synchronization with transactions database server"}
                  </p>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 hover:border-red-300 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer shadow-3xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-red-600 animate-spin-slow" />
                  <span>{lang === "id" ? "RESET OMSET (MULAI DARI 0)" : "RESET ANALYTICS (START FROM 0)"}</span>
                </button>
              </div>
              
              {/* Quick statistics card totals */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white border border-lokale-border p-5 rounded-3xl shadow-xs text-lokale-wood">
                  <span className="text-[10px] font-mono text-lokale-wood/65 uppercase block font-bold">AGGREGATED REVENUE SUMMARY</span>
                  <strong className="text-xl sm:text-2xl font-mono text-lokale-green font-black block mt-2">
                    IDR {metrics.totalRevenue.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-emerald-700 font-mono block mt-1 font-semibold">+12.4% vs last week</span>
                </div>

                <div className="bg-white border border-lokale-border p-5 rounded-3xl shadow-xs text-lokale-wood">
                  <span className="text-[10px] font-mono text-lokale-wood/65 uppercase block font-bold">ORDER CONFIRMATIONS</span>
                  <strong className="text-xl sm:text-2xl font-mono text-lokale-green font-black block mt-2">
                    {metrics.totalOrders} Units
                  </strong>
                  <span className="text-[10px] text-lokale-wood/50 block mt-1 font-semibold">SaaS billing logs verified</span>
                </div>

                <div className="bg-white border border-lokale-border p-5 rounded-3xl shadow-xs text-lokale-wood">
                  <span className="text-[10px] font-mono text-lokale-wood/65 uppercase block font-bold">TABLES OCCUPANCY</span>
                  <strong className="text-xl sm:text-2xl font-mono text-lokale-green font-black block mt-2">
                    {metrics.approvedReservations} Slots
                  </strong>
                  <span className="text-[10px] text-lokale-orange font-mono block mt-1 font-bold">{metrics.pendingReservations} Pending approvals</span>
                </div>

                <div className="bg-white border border-lokale-border p-5 rounded-3xl shadow-xs text-lokale-wood">
                  <span className="text-[10px] font-mono text-lokale-wood/65 uppercase block font-bold">STUCK CONNOISSEURS</span>
                  <strong className="text-xl sm:text-2xl font-mono text-lokale-green font-black block mt-2">
                    {metrics.activeMembersCount} Profiles
                  </strong>
                  <span className="text-[10px] text-lokale-orange font-mono block mt-1 font-bold">4.9 Overall rating review index</span>
                </div>

              </div>

              {/* Graphical distribution charts (2 Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Weekly Revenue Trend line */}
                <div className="bg-white border border-lokale-border p-6 rounded-3xl shadow-sm text-lokale-wood">
                  <h3 className="text-lokale-green font-serif font-black text-base">Weekly Revenue Analysis (IDR)</h3>
                  <div className="h-64 mt-4 text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.monthlyRevenueData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3f5e4d" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#3f5e4d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#52524e" />
                        <YAxis stroke="#52524e" />
                        <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f3ddbf", borderRadius: "12px", color: "#3f5e4d" }} />
                        <Area type="monotone" dataKey="Sales" stroke="#3f5e4d" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Product category distributions Pie chart */}
                <div className="bg-white border border-lokale-border p-6 rounded-3xl shadow-sm text-lokale-wood">
                  <h3 className="text-lokale-green font-serif font-black text-base">Category Demand Breakdown (%)</h3>
                  <div className="h-64 mt-4 flex items-center justify-center">
                    <ResponsiveContainer width="60%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.productDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {metrics.productDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f3ddbf", borderRadius: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* legend lists manually designed */}
                    <div className="space-y-2 text-xs font-mono text-lokale-wood/80 pl-4 w-[40%]">
                      {metrics.productDistribution.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                          <span>{entry.name}: <strong className="text-lokale-green font-bold">{entry.value}%</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SEGMENT 2: ORDER OPERATIONS LIST */}
          {activeSegment === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-lokale-green font-serif font-bold text-base uppercase">Lobby Orders Ledger ({orders.length})</h3>
              
              <div className="divide-y divide-lokale-cream bg-white border border-lokale-border rounded-3xl overflow-hidden pr-2 shadow-sm text-lokale-wood">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    
                    <div>
                      <span className="font-mono text-xs text-lokale-green block font-bold">{ord.invoiceNumber}</span>
                      <span className="text-[10px] text-lokale-wood/65 font-mono block mt-1">Connoisseur: <strong className="text-lokale-orange">{ord.customerName}</strong> ({ord.customerEmail})</span>
                      <span className="text-[10px] text-lokale-wood/50 font-mono block mt-0.5">Address: {ord.address}</span>
                      
                      <div className="mt-3.5 bg-lokale-cream p-3 rounded-xl border border-lokale-border text-xs text-lokale-wood space-y-1 max-w-sm">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="font-medium">{it.name} (x{it.quantity})</span>
                            <span className="font-mono text-lokale-green font-bold">IDR {it.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="text-lokale-green font-mono font-bold text-base">IDR {ord.total.toLocaleString()}</span>
                      <span className="text-[10px] text-lokale-wood/60 font-mono block">Status: <strong className="text-lokale-green font-bold">{ord.status}</strong></span>
                      
                      {/* Control buttons to cycle status / delete */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Centang (Checkmark) Button to set Paid immediately */}
                        {ord.status === 'Pending' ? (
                          <button
                            onClick={() => {
                              handleUpdateOrderStatus(ord.id, "Paid");
                              triggerNotification(lang === "id" ? "Pembayaran Dikonfirmasi! Pelanggan akan melihat animasi sukses lunas." : "Payment Verified! Guest will see the golden success checkmark animation.", "success");
                            }}
                            className="px-2.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 text-[10px] font-mono uppercase tracking-wide cursor-pointer font-bold flex items-center space-x-1 shadow-3xs transition-all hover:scale-102"
                            title={lang === "id" ? "Konfirmasi Pembayaran (Centang)" : "Verify Payment (Checkmark)"}
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>{lang === "id" ? "Verifikasi Lunas (Centang)" : "Verify Paid"}</span>
                          </button>
                        ) : (
                          /* Standard checkmark representation for verified payments */
                          <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-200 text-[9px] font-mono font-bold uppercase select-none">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{lang === "id" ? "Terverifikasi" : "Verified"}</span>
                          </div>
                        )}

                        {ord.status === 'Paid' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, "Processing")}
                            className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-400/30 text-[9px] font-mono uppercase tracking-wide cursor-pointer font-bold"
                          >
                            Set Processing
                          </button>
                        )}
                        {ord.status === 'Processing' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, "Completed")}
                            className="px-2.5 py-1 rounded bg-lokale-orange-light hover:bg-lokale-cream text-lokale-orange border border-lokale-orange/30 text-[9px] font-mono uppercase tracking-wide cursor-pointer font-bold"
                          >
                            Complete Order
                          </button>
                        )}
                        
                        <button
                          onClick={() => handlePrintReceipt(ord)}
                          className="px-2.5 py-1 rounded bg-white border border-lokale-border text-lokale-wood/60 hover:text-lokale-green text-[9px] font-mono uppercase tracking-wide cursor-pointer font-bold transition-all hover:scale-102"
                        >
                          Print PDF
                        </button>

                        {/* Hapus jika salah (Delete incorrect order option) */}
                        <button
                          onClick={() => handleDeleteOrder(ord)}
                          className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 hover:scale-105 transition-all cursor-pointer shadow-3xs"
                          title={lang === "id" ? "Hapus Pesanan Salah" : "Delete Incorrect Order"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSegment === "payments" && (
            <div className="space-y-12 animate-fadeIn font-mono" id="payment-methods-segment">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Form to Add/Edit Payment Methods */}
                <div id="pm-setup-form-container" className="lg:col-span-5 bg-white border border-lokale-border rounded-3xl p-6 space-y-6 shadow-sm text-lokale-wood">
                  <div className="border-b border-lokale-cream pb-3">
                    <h3 className="text-lokale-green font-serif font-black text-lg">
                      {editingPaymentMethod ? (lang === "id" ? "✏️ Edit Metode Pembayaran" : "✏️ Edit Payment Method") : (lang === "id" ? "➕ Tambah Metode Pembayaran" : "➕ Add Payment Method")}
                    </h3>
                    <p className="text-lokale-wood/60 text-xs mt-1 font-sans">
                      {lang === "id" ? "Tambahkan rekening bank, dompet digital, atau kode QRIS untuk pelanggan." : "Configure custom payment paths, bank codes, e-wallets, or QR codes."}
                    </p>
                  </div>

                  <form onSubmit={handleCreateOrUpdatePaymentMethod} className="space-y-4 text-xs">
                    <div>
                      <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide block">Nama Metode Pembayaran</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bank BRI, E-Wallet DANA, QRIS Mandiri"
                        value={newPmName}
                        onChange={(e) => setNewPmName(e.target.value)}
                        className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none focus:border-lokale-green"
                      />
                    </div>

                    <div>
                      <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide block">Tipe Gateway / Jalur</label>
                      <select
                        value={newPmType}
                        onChange={(e) => setNewPmType(e.target.value)}
                        className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none"
                      >
                        <option value="bank">Bank Account Transfer</option>
                        <option value="ewallet">E-Wallet (DANA, OVO, LinkAja)</option>
                        <option value="qris">QRIS (Static QR Code scan)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide block">Instruksi Detail Pembayaran</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="e.g. Silakan transfer ke Rekening BRI: 0122-01-xxxxxx-xx-x (a.n. Ivan Siahaan) dan upload struk."
                        value={newPmDetails}
                        onChange={(e) => setNewPmDetails(e.target.value)}
                        className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none focus:border-lokale-green font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide block mb-1">Pilih Metode Upload Gambar</label>
                      <div className="flex gap-2.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setPmUploadMethod("upload")}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            pmUploadMethod === "upload"
                              ? "bg-lokale-green text-white border-lokale-green shadow-xs"
                              : "bg-white text-lokale-wood border-lokale-border hover:bg-lokale-cream"
                          }`}
                        >
                          Upload File QR/Logo
                        </button>
                        <button
                          type="button"
                          onClick={() => setPmUploadMethod("url")}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            pmUploadMethod === "url"
                              ? "bg-lokale-green text-white border-lokale-green shadow-xs"
                              : "bg-white text-lokale-wood border-lokale-border hover:bg-lokale-cream"
                          }`}
                        >
                          External Image URL
                        </button>
                      </div>
                    </div>

                    {pmUploadMethod === "upload" ? (
                      <div className="relative border-2 border-dashed border-lokale-border hover:border-lokale-green/40 bg-lokale-cream/30 hover:bg-lokale-cream/50 rounded-2xl py-6 px-4 text-center group transition-all duration-300">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePmImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-9 h-9 rounded-full bg-lokale-green/10 flex items-center justify-center text-lokale-green group-hover:scale-110 transition-transform duration-300 mx-auto">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] text-lokale-wood font-bold mt-2">
                            {lang === "id" ? "Klik atau seret struk/gambar QRIS" : "Click / Drag QRIS or Logo image"}
                          </p>
                          <p className="text-[9px] text-stone-400 font-mono">
                            JPEG, PNG, WEBP (Max 5MB)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Masukkan tautan link image logo..."
                          value={newPmImage}
                          onChange={(e) => setNewPmImage(e.target.value)}
                          className="w-full px-3.5 py-3 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none focus:border-lokale-green text-[11px] font-mono shadow-3xs"
                        />
                      </div>
                    )}

                    {newPmImage && (
                      <div className="p-3.5 bg-lokale-cream/50 rounded-2xl border-2 border-lokale-border flex items-center justify-between gap-3 animate-fadeIn">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-12 h-12 rounded-xl border border-lokale-border overflow-hidden bg-white flex-shrink-0">
                            <img 
                              src={newPmImage || null} 
                              alt="Payment Preview" 
                              className="w-full h-full object-cover"
                              onError={() => console.log("Failed to load image preview")} 
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-lokale-wood font-serif">
                              {lang === "id" ? "Pratinjau QRIS / Logo OK" : "Logo / QRIS Preview loaded"}
                            </p>
                            <span className="text-[8px] font-mono text-emerald-700 font-semibold uppercase tracking-wider block bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5 w-max">
                              {newPmImage.startsWith("data:") ? "Base64 Image" : "External asset"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPmImage("")}
                          className="text-[10px] text-red-500 hover:underline hover:font-bold"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 pt-1">
                      <input
                        type="checkbox"
                        id="newPmIsActive"
                        checked={newPmIsActive}
                        onChange={(e) => setNewPmIsActive(e.target.checked)}
                        className="w-4 h-4 text-lokale-green focus:ring-0 rounded-md border-lokale-border bg-lokale-cream"
                      />
                      <label htmlFor="newPmIsActive" className="text-[11px] text-lokale-wood font-bold select-none cursor-pointer">
                        {lang === "id" ? "Aktifkan metode pembayaran ini" : "Enable payment option for guests"}
                      </label>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="submit"
                        className="flex-grow py-3 bg-lokale-green hover:bg-lokale-green-light text-white font-bold font-mono tracking-widest text-xs uppercase rounded-xl transition-all cursor-pointer shadow-xs border border-lokale-green"
                      >
                        {editingPaymentMethod ? "Save Changes" : "Create Payment Channel"}
                      </button>
                      {editingPaymentMethod && (
                        <button
                          type="button"
                          onClick={cancelEditPaymentMethod}
                          className="px-4 py-3 bg-white border border-lokale-border hover:bg-lokale-cream text-lokale-wood rounded-xl text-xs font-mono transition-colors font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Right Column: Display list of payment methods */}
                <div className="lg:col-span-7 bg-white border border-lokale-border rounded-3xl p-6 space-y-4 shadow-sm text-lokale-wood animate-fadeIn">
                  <h4 className="text-lokale-green font-serif font-black text-base uppercase border-b border-lokale-cream pb-3">
                    {lang === "id" ? "Daftar Saluran Pembayaran Aktif" : "Configured Payment Channels"} ({paymentMethods.length})
                  </h4>

                  <div className="divide-y divide-lokale-cream max-h-[500px] overflow-y-auto pr-2 mt-4 space-y-3">
                    {paymentMethods.map((pm) => (
                      <div key={pm.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between text-xs group hover:bg-lokale-cream/30 px-3 rounded-2xl transition-all gap-4">
                        <div className="flex items-start space-x-3.5">
                          {pm.image ? (
                            <img 
                              src={pm.image} 
                              alt={pm.name} 
                              className="w-12 h-12 object-cover rounded-xl border border-lokale-border flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-lokale-green/10 flex items-center justify-center text-lokale-green flex-shrink-0 font-serif font-black text-sm uppercase">
                              {pm.name.slice(0, 2)}
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lokale-green font-extrabold font-serif text-base">{pm.name}</span>
                              <span className={`px-2 py-0.5 text-[8px] font-mono rounded-full uppercase font-black ${
                                pm.isActive 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                  : "bg-stone-100 text-stone-500 border border-stone-200"
                              }`}>
                                {pm.isActive ? (lang === "id" ? "Aktif" : "Active") : (lang === "id" ? "Buram" : "Inactive")}
                              </span>
                            </div>
                            <span className="text-lokale-orange block text-[10px] uppercase font-bold tracking-wider">{pm.type} Gateway</span>
                            <p className="text-lokale-wood/75 text-xs font-sans whitespace-pre-wrap leading-relaxed max-w-md bg-lokale-cream/40 p-2.5 border border-lokale-border rounded-xl mt-1.5 shadow-3xs">{pm.details}</p>
                          </div>
                        </div>

                        <div className="flex justify-end items-center space-x-2 self-end md:self-center">
                          <button
                            onClick={() => handleEditPaymentMethod(pm)}
                            title="Edit Payment Method"
                            className="p-2 bg-lokale-cream hover:bg-lokale-green-light/20 text-lokale-green border border-lokale-border hover:border-lokale-green/20 rounded-xl transition-all cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePaymentMethod(pm)}
                            title="Delete Payment Method"
                            className="p-2 bg-lokale-cream hover:bg-red-50 text-red-600 border border-lokale-border hover:border-red-200 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {paymentMethods.length === 0 && (
                      <div className="text-center py-12 text-lokale-wood/50">
                        {lang === "id" ? "Belum ada metode pembayaran kustom dikonfigurasi." : "No custom payment methods configured."}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}



          {/* PANEL 4: MANUAL CHAT MATRIX PORTAL */}
          {activeSegment === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fadeIn">
              
              {/* Rooms list left */}
              <div className="lg:col-span-4 bg-white border border-lokale-border rounded-3xl p-4 space-y-4 shadow-xs">
                <h4 className="text-xs font-mono font-bold text-lokale-green uppercase tracking-widest border-b border-lokale-cream pb-2">Client Sessions</h4>
                
                <div className="space-y-2">
                  {chats.map((rm) => (
                    <div
                      key={rm.id}
                      onClick={() => setActiveReplyRoom(rm.id)}
                      className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                        activeReplyRoom === rm.id
                          ? "bg-lokale-cream border-lokale-green text-lokale-green font-bold"
                          : "bg-white border-lokale-border hover:border-lokale-green/45 text-lokale-wood/80"
                      }`}
                    >
                      <h5 className="font-serif font-black text-sm text-lokale-green">{rm.customerName}</h5>
                      <p className="text-[11px] text-lokale-wood/60 mt-1.5 line-clamp-1 italic">"{rm.lastMessage}"</p>
                      <span className="text-[9px] font-mono text-lokale-orange block mt-2 text-right font-semibold">{new Date(rm.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat replies console window right */}
              <div className="lg:col-span-8 bg-white border border-lokale-border rounded-3xl p-6 flex flex-col justify-between min-h-[400px] shadow-xs text-lokale-wood">
                
                {chats.find(c => c.id === activeReplyRoom) ? (
                  <>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-lokale-green">
                        Session Panel: {chats.find(c => c.id === activeReplyRoom).customerName}
                      </h4>
                      <div className="w-full h-[1px] bg-lokale-cream mt-2 mb-4" />
                    </div>

                    <div className="flex-grow space-y-3 max-h-64 overflow-y-auto bg-lokale-cream border border-lokale-border rounded-2xl p-4 pr-1.5 mb-4">
                      {chats.find(c => c.id === activeReplyRoom).messages.map((msG: any, idx: number) => {
                        const isUserSender = msG.sender === 'user';
                        return (
                          <div key={idx} className={`flex ${isUserSender ? 'justify-start' : 'justify-end'}`}>
                            <div className={`p-3 rounded-2xl max-w-xs text-xs ${
                              isUserSender
                                ? "bg-white text-lokale-wood rounded-tl-none border border-lokale-border shadow-2xs"
                                : "bg-lokale-orange-light text-lokale-wood rounded-tr-none border border-lokale-orange/20 shadow-2xs"
                            }`}>
                              <span className="text-[8px] font-mono text-lokale-wood/55 block uppercase mb-1 font-bold">{msG.sender === 'user' ? 'GUEST' : msG.sender.toUpperCase()}</span>
                              <p className="font-normal">{msG.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSendAdminReply} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder="Type manual staff reply to clear tickets..."
                        className="flex-grow px-3.5 py-2.5 bg-lokale-cream border border-lokale-border rounded-xl text-lokale-wood text-xs focus:outline-none focus:border-lokale-green"
                      />
                      <button
                        type="submit"
                        className="px-5 bg-lokale-green hover:bg-lokale-green-light text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer shadow-sm border border-lokale-green"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-20 text-lokale-wood/50 text-xs italic m-auto">
                    Select a client connection room session on the left to review chat transcripts.
                  </div>
                )}

              </div>

            </div>
          )}

          {/* SEGMENT 5: PRODUCT CRUD CONTROL LIST */}
          {activeSegment === 'items' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Product creator left */}
                <div id="product-form-container" className="lg:col-span-5 bg-white border border-lokale-border rounded-3xl p-6 shadow-xs text-lokale-wood transition-all duration-300 scroll-mt-24">
                  <h3 className="text-lokale-green font-serif font-black text-base border-b border-lokale-cream pb-3 flex items-center space-x-1.5">
                    <ClipboardSignature className="w-4 h-4 text-lokale-orange animate-pulse" />
                    <span>{editingProduct ? `Edit Product: ${editingProduct.name.substring(0, 18)}...` : "Introduce New Product"}</span>
                  </h3>

                  <form onSubmit={handleCreateProduct} className="mt-5 space-y-4 text-xs font-mono">
                    
                    <div>
                      <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Product Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sumatra Gayo Highland Blend"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Category</label>
                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value)}
                          className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none"
                        >
                          <option value="coffee">Coffee Shop</option>
                          <option value="non-coffee">Non Coffee Tea</option>
                          <option value="food">Artisanal Bakery</option>
                          <option value="cigar">Exclusive Cigar</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Subcategory</label>
                        <input
                          type="text"
                          required
                          value={newItemSubCategory}
                          onChange={(e) => setNewItemSubCategory(e.target.value)}
                          className="w-full mt-1.5 px-3 py-2.5 bg-lokale-cream border border-lokale-border rounded-xl text-lokale-wood focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Price (IDR)</label>
                        <input
                          type="number"
                          required
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          className="w-full mt-1.5 px-3 py-2.5 bg-lokale-cream border border-lokale-border rounded-xl text-lokale-wood focus:outline-none font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Initial Stock</label>
                        <input
                          type="number"
                          required
                          value={newItemStock}
                          onChange={(e) => setNewItemStock(e.target.value)}
                          className="w-full mt-1.5 px-3 py-2.5 bg-lokale-cream border border-lokale-border rounded-xl text-lokale-wood focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-lokale-wood font-mono uppercase font-black text-[10px] tracking-wide block mb-1.5">
                        {lang === "id" ? "Foto Produk & Gambar" : "Product Photo / Image"}
                      </label>
                      
                      {/* Tabs */}
                      <div className="flex border-b border-lokale-border mb-3 font-mono">
                        <button
                          type="button"
                          onClick={() => setUploadMethod('upload')}
                          className={`flex-1 py-2 text-center text-[10px] font-bold uppercase transition-all flex items-center justify-center space-x-1 border-b-2 cursor-pointer ${
                            uploadMethod === 'upload'
                              ? "border-lokale-green text-lokale-green bg-lokale-green/5"
                              : "border-transparent text-stone-400 hover:text-stone-600 hover:bg-stone-50 animate-fadeIn"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{lang === "id" ? "Upload File" : "Upload File"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMethod('url')}
                          className={`flex-1 py-2 text-center text-[10px] font-bold uppercase transition-all flex items-center justify-center space-x-1 border-b-2 cursor-pointer ${
                            uploadMethod === 'url'
                              ? "border-lokale-green text-lokale-green bg-lokale-green/5"
                              : "border-transparent text-stone-400 hover:text-stone-600 hover:bg-stone-50 animate-fadeIn"
                          }`}
                        >
                          <Link className="w-3.5 h-3.5" />
                          <span>{lang === "id" ? "Tautan URL" : "Web Link / URL"}</span>
                        </button>
                      </div>

                      {uploadMethod === 'upload' ? (
                        <div className="relative border-2 border-dashed border-lokale-green/45 hover:border-lokale-green bg-lokale-cream/35 hover:bg-lokale-cream/65 rounded-xl p-5 text-center transition-all cursor-pointer group flex flex-col items-center justify-center space-y-1.5 shadow-3xs overflow-hidden">
                          <input
                            type="file"
                            accept="image/*"
                            id="product-photo-upload"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-9 h-9 rounded-full bg-lokale-green/10 flex items-center justify-center text-lokale-green group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[11px] text-lokale-wood font-bold mt-1">
                              {lang === "id" ? "Pilih / Seret file gambar" : "Choose / Browse picture file"}
                            </p>
                            <p className="text-[9px] text-stone-400 font-mono">
                              PNG, JPG, WEBP (Max 5MB)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={lang === "id" ? "Simpan link tautan gambar di sini..." : "Enter external web image URL..."}
                            value={String(newItemImage || "")}
                            onChange={(e) => setNewItemImage(e.target.value)}
                            className="w-full px-3.5 py-3 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none focus:border-lokale-green text-[11px] font-mono shadow-3xs"
                          />
                        </div>
                      )}

                      {/* Unified responsive Image Preview */}
                      {newItemImage && (
                        <div className="mt-3.5 p-3.5 bg-lokale-cream/50 rounded-2xl border-2 border-lokale-border flex items-center justify-between gap-3 animate-fadeIn">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12 rounded-xl border border-lokale-border overflow-hidden bg-white flex-shrink-0">
                              <img 
                                src={newItemImage || null} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                                onError={() => console.log("Failed to load preview")} 
                              />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-lokale-wood font-serif">
                                {lang === "id" ? "Pratinjau Gambar Berhasil" : "Image Preview Loaded"}
                              </p>
                              <span className="text-[8px] font-mono text-emerald-700 font-semibold uppercase tracking-wider block bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5 w-max">
                                {newItemImage.startsWith('data:') ? 'Local Base64 File' : 'External Web URL'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewItemImage("")}
                            className="p-1 px-2.5 rounded-lg border border-red-200 hover:border-red-300 text-red-600 bg-red-50 hover:bg-red-100 text-[10px] font-mono font-bold cursor-pointer"
                          >
                            {lang === "id" ? "Hapus" : "Clear"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Short Description</label>
                      <textarea
                        required
                        placeholder="Enter premium origin coordinates, aroma descriptions..."
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        rows={2}
                        className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none font-sans"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="submit"
                        className="flex-grow py-3 bg-lokale-green hover:bg-lokale-green-light text-white font-bold font-mono tracking-widest text-xs uppercase rounded-xl transition-all cursor-pointer shadow-xs border border-lokale-green"
                      >
                        {editingProduct ? "Save Changes" : "Commit Active Item"}
                      </button>
                      
                      {editingProduct && (
                        <button
                          type="button"
                          onClick={cancelEditProduct}
                          className="px-4 py-3 bg-white border border-lokale-border hover:bg-lokale-cream text-lokale-wood rounded-xl text-xs font-mono transition-colors font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                  </form>
                </div>

                {/* Product lists logs right */}
                <div className="lg:col-span-7 bg-white border border-lokale-border rounded-3xl p-6 space-y-4 shadow-xs text-lokale-wood animate-fadeIn flex flex-col justify-between">
                  <div>
                    <h4 className="text-lokale-green font-serif font-black text-base uppercase border-b border-lokale-cream pb-3">Inventory Catalog ({products.length})</h4>
                    
                    <div className="divide-y divide-lokale-cream max-h-[460px] overflow-y-auto pr-2 mt-4 space-y-1">
                      {products.map((p) => (
                        <div key={p.id} className="py-3.5 flex items-center justify-between text-xs font-mono group hover:bg-lokale-cream/30 px-2 rounded-xl transition-all">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={p.images && p.images[0] ? p.images[0] : "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300&auto=format&fit=crop"} 
                              alt={p.name} 
                              className="w-10 h-10 object-cover rounded-lg border border-lokale-border flex-shrink-0"
                            />
                            <div>
                              <span className="text-lokale-green font-extrabold font-serif text-sm block">{p.name}</span>
                              <span className="text-lokale-wood/50 block text-[10px] mt-0.5">Cat: {p.category} | {p.subcategory}</span>
                            </div>
                          </div>
                          
                          <div className="text-right flex items-center space-x-4">
                            <div>
                              <strong className="text-lokale-green font-bold block">IDR {p.price.toLocaleString()}</strong>
                              <span className={`text-[10px] block ${p.stock > 3 ? 'text-lokale-wood/65 font-medium' : 'text-red-500 font-bold block animate-pulse'}`}>{p.stock} units left</span>
                            </div>
                            
                            <div className="flex space-x-1">
                              <button
                                onClick={() => startEditProduct(p)}
                                title="Edit Product"
                                className="p-2 rounded-lg hover:bg-lokale-green-light/20 text-lokale-green hover:text-lokale-green transition-transform group-hover:scale-105 border border-transparent hover:border-lokale-green/30 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                title="Delete Product"
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-200 transition-transform group-hover:scale-105 border border-transparent cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Trademark logo customisation */}
              <div className="bg-white border border-lokale-border rounded-3xl p-6 shadow-xs text-lokale-wood">
                <div className="border-b border-lokale-cream pb-3 flex items-center justify-between">
                  <h3 className="text-lokale-green font-serif font-black text-base flex items-center space-x-2">
                    <Sparkles className="w-4.5 h-4.5 text-lokale-orange animate-pulse" />
                    <span>Stuck Coffee & Cigar Brand Customizer</span>
                  </h3>
                  <span className="text-[9px] font-mono uppercase bg-lokale-orange-light text-lokale-green font-bold px-2.5 py-1 rounded-full">REALTIME THEME MATRIX</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-6">
                  {/* Left Column: Form to update */}
                  <form onSubmit={handleLogoSubmit} className="space-y-4 text-xs font-mono">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide box-border">Brand Name</label>
                        <input
                          type="text"
                          required
                          value={logoText}
                          onChange={(e) => setLogoText(e.target.value)}
                          className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide box-border">Subtitle / Location</label>
                        <input
                          type="text"
                          required
                          value={logoSubtext}
                          onChange={(e) => setLogoSubtext(e.target.value)}
                          className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide mb-1 block">Logo Type</label>
                        <div className="flex gap-2.5 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setLogoType("icon")}
                            className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                              logoType === "icon"
                                ? "bg-lokale-green text-white border-lokale-green shadow-xs"
                                : "bg-white text-lokale-wood/75 border-lokale-border hover:bg-lokale-cream"
                            }`}
                          >
                            Coffee Icon
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogoType("image")}
                            className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                              logoType === "image"
                                ? "bg-lokale-green text-white border-lokale-green shadow-xs"
                                : "bg-white text-lokale-wood/75 border-lokale-border hover:bg-lokale-cream"
                            }`}
                          >
                            Custom Image Logo
                          </button>
                        </div>
                      </div>

                      {logoType === "image" && (
                        <div>
                          <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide block mb-1">Image Logo File / URL</label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Paste logo URL here..."
                              value={logoImage}
                              onChange={(e) => setLogoImage(e.target.value)}
                              className="w-full px-3 py-2 bg-lokale-cream border border-lokale-border rounded-xl text-lokale-wood text-[10px] focus:outline-none"
                            />
                            <div className="relative border border-dashed border-lokale-border bg-lokale-cream/50 rounded-xl p-2 text-center hover:bg-lokale-cream cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <p className="text-[9px] text-lokale-wood/60 font-bold">Or Upload Image File</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 mt-4 bg-lokale-cream hover:bg-lokale-orange-light text-lokale-green font-bold font-mono tracking-widest text-xs uppercase rounded-xl transition-all border border-lokale-border hover:border-lokale-orange/30 cursor-pointer shadow-sm"
                    >
                      Update Stuck Brand Identity Logo
                    </button>
                  </form>

                  {/* Right Column: Dynamic Preview */}
                  <div className="p-8 bg-lokale-cream/50 rounded-3xl border border-lokale-border select-none space-y-6 flex flex-col justify-center text-center items-center">
                    <div>
                      <span className="text-[10px] font-mono text-lokale-wood/40 uppercase block tracking-wider mb-4 font-extrabold">- Active Identity Logo Preview -</span>
                      
                      <div className="flex items-center space-x-3.5 p-4 bg-white border border-lokale-border rounded-2xl shadow-sm text-left max-w-sm mx-auto">
                        {logoType === "image" && logoImage ? (
                          <img 
                            src={logoImage} 
                            alt="Brand Logo" 
                            className="w-11 h-11 object-cover rounded-xl border border-lokale-border shadow-xs" 
                          />
                        ) : (
                          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-lokale-green shadow-sm border border-lokale-green-light">
                            <Coffee className="w-5 h-5 text-lokale-orange animate-bounce" />
                          </div>
                        )}
                        <div>
                          <span className="font-serif text-base font-bold tracking-wider text-lokale-green block">
                            {logoText || "STUCK COFFEE & CIGAR"}
                          </span>
                          <span className="text-[8px] font-mono tracking-[0.25em] text-lokale-orange block -mt-1 uppercase font-semibold">
                            {logoSubtext || "#stuckinmedan"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-lokale-wood/60 max-w-s mx-auto leading-relaxed">
                      Saving your changes updates the name headers, footer claims, receipt prints, and lounge branding indicators across the entire guest interface instantly.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeSegment === 'special_menu' && (
            <div className="space-y-8 animate-fadeIn animate-slideIn" id="special-menu-segment">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Special Menu Form Editor (Left panel) */}
                <div className="lg:col-span-5 bg-white border border-lokale-border rounded-3xl p-6 shadow-sm text-lokale-wood">
                  <h3 className="text-lokale-green font-serif font-black text-base border-b border-lokale-cream pb-3 flex items-center space-x-1.5">
                    <Edit className="w-4 h-4 text-lokale-orange animate-pulse" />
                    <span>{editingSpecialItem ? `Edit Item: ${editingSpecialItem.name}` : (lang === "id" ? "Pilih Item untuk Diedit" : "Select an Item to Edit")}</span>
                  </h3>

                  {editingSpecialItem ? (
                    <form onSubmit={handleUpdateSpecialItemStore} className="mt-5 space-y-4 text-xs font-mono">
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Nama (ID)</label>
                          <input
                            type="text"
                            value={editingSpecialItem.name || ""}
                            onChange={(e) => setEditingSpecialItem((prev: any) => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-lokale-border mt-1 focus:outline-none focus:border-lokale-green text-xs font-mono text-lokale-wood bg-lokale-cream/50 animate-fadeIn"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Name (EN)</label>
                          <input
                            type="text"
                            value={editingSpecialItem.nameEn || ""}
                            onChange={(e) => setEditingSpecialItem((prev: any) => ({ ...prev, nameEn: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-lokale-border mt-1 focus:outline-none focus:border-lokale-green text-xs font-mono text-lokale-wood bg-lokale-cream/50 animate-fadeIn"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Harga (Price)</label>
                          <input
                            type="number"
                            value={editingSpecialItem.price || 0}
                            onChange={(e) => setEditingSpecialItem((prev: any) => ({ ...prev, price: Number(e.target.value) }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-lokale-border mt-1 focus:outline-none focus:border-lokale-green text-xs font-mono text-lokale-wood bg-lokale-cream/50"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Tag (ID)</label>
                            <input
                              type="text"
                              value={editingSpecialItem.tag || ""}
                              onChange={(e) => setEditingSpecialItem((prev: any) => ({ ...prev, tag: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl border border-lokale-border mt-1 focus:outline-none focus:border-lokale-green text-xs font-mono text-lokale-wood bg-lokale-cream/50 animate-fadeIn"
                            />
                          </div>
                          <div>
                            <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Tag (EN)</label>
                            <input
                              type="text"
                              value={editingSpecialItem.tagEn || ""}
                              onChange={(e) => setEditingSpecialItem((prev: any) => ({ ...prev, tagEn: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl border border-lokale-border mt-1 focus:outline-none focus:border-lokale-green text-xs font-mono text-lokale-wood bg-lokale-cream/50 animate-fadeIn"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide block mb-1">Metode Gambar (Image Method)</label>
                        <div className="flex space-x-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setSpecialUploadMethod('url')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer ${specialUploadMethod === 'url' ? 'bg-lokale-green text-white border-lokale-green' : 'bg-white text-lokale-wood border-lokale-border'}`}
                          >
                            Web Image URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpecialUploadMethod('upload')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer ${specialUploadMethod === 'upload' ? 'bg-lokale-green text-white border-lokale-green' : 'bg-white text-lokale-wood border-lokale-border'}`}
                          >
                            Upload File
                          </button>
                        </div>

                        {specialUploadMethod === 'url' ? (
                          <input
                            type="url"
                            value={editingSpecialItem.image || ""}
                            onChange={(e) => setEditingSpecialItem((prev: any) => ({ ...prev, image: e.target.value }))}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full px-3 py-2.5 rounded-xl border border-lokale-border focus:outline-none focus:border-lokale-green text-xs font-mono text-lokale-wood bg-lokale-cream/50"
                          />
                        ) : (
                          <div className="relative border border-dashed border-lokale-border rounded-xl p-3 bg-lokale-cream/30 flex flex-col items-center justify-center text-center">
                            <Upload className="w-4 h-4 text-lokale-orange mb-1" />
                            <span className="text-[10px] font-bold text-lokale-wood/60 mb-1">{lang === "id" ? "Pilih file gambar" : "Choose picture file"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSpecialItemImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>
                        )}
                        {editingSpecialItem.image && (
                          <div className="mt-3 relative aspect-[4/3] rounded-xl overflow-hidden border border-lokale-border bg-lokale-beige max-w-[150px]">
                            <img src={editingSpecialItem.image || null} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Deskripsi (ID)</label>
                        <textarea
                          rows={3}
                          value={editingSpecialItem.desc || ""}
                          onChange={(e) => setEditingSpecialItem((prev: any) => ({ ...prev, desc: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-lokale-border mt-1 focus:outline-none focus:border-lokale-green text-xs font-mono style-textarea placeholder-stone-400 bg-lokale-cream/50 resize-y"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-lokale-wood/60 uppercase font-black text-[9px] tracking-wide">Description (EN)</label>
                        <textarea
                          rows={3}
                          value={editingSpecialItem.descEn || ""}
                          onChange={(e) => setEditingSpecialItem((prev: any) => ({ ...prev, descEn: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-lokale-border mt-1 focus:outline-none focus:border-lokale-green text-xs font-mono style-textarea placeholder-stone-400 bg-lokale-cream/50 resize-y"
                          required
                        />
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingSpecialItem(null)}
                          className="flex-1 py-3 border border-lokale-border text-lokale-wood bg-white hover:bg-lokale-cream rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer"
                        >
                          {lang === "id" ? "Batal" : "Cancel"}
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-lokale-green text-white hover:bg-lokale-green-light rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border border-lokale-green shadow-sm flex items-center justify-center space-x-1"
                        >
                          <span>{lang === "id" ? "Simpan Perubahan" : "Save Changes"}</span>
                        </button>
                      </div>

                    </form>
                  ) : (
                    <div className="text-center py-16 text-lokale-wood/50 text-xs italic">
                      {lang === "id" ? "Pilih salah satu item spesial di sebelah kanan untuk memperbarui penampilannya di Beranda." : "Choose one of the special spots on the right to edit its homepage display."}
                    </div>
                  )}

                </div>

                {/* Special Menu Items list (Right panel) */}
                <div className="lg:col-span-7 bg-white border border-lokale-border rounded-3xl p-6 shadow-sm text-lokale-wood space-y-6">
                  <div>
                    <h3 className="text-lokale-green font-serif font-black text-lg">{lang === "id" ? "Katalog Menu Spesial Stuck" : "Stuck Special Menu Slots"}</h3>
                    <p className="text-lokale-wood/60 text-xs mt-1">{lang === "id" ? "Klik tombol edit di bawah slot untuk melakukan kustomisasi." : "Click edit on any card slot to customize its content."}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {specialMenu.map((item, index) => (
                      <div key={item.id} className="border border-lokale-border rounded-2xl overflow-hidden hover:border-lokale-orange/50 transition-all bg-lokale-cream/10 p-3.5 flex flex-col h-full justify-between">
                        <div>
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-lokale-beige mb-3 border border-lokale-border">
                            <img src={item.image || null} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <span className="absolute top-2 left-2 bg-lokale-orange text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase">
                              Slot {index + 1}
                            </span>
                          </div>
                          <h4 className="font-serif text-xs font-bold text-lokale-green line-clamp-1">{lang === "id" ? item.name : (item.nameEn || item.name)}</h4>
                          <span className="text-[10px] font-mono text-lokale-orange font-bold block mt-1">Rp {Number(item.price || 0).toLocaleString()}</span>
                          <p className="text-[10px] text-lokale-wood/75 line-clamp-2 mt-1 leading-normal h-8">{lang === "id" ? item.desc : (item.descEn || item.desc)}</p>
                        </div>
                        
                        <button
                          onClick={() => handleEditSpecialItem(item)}
                          className="w-full mt-3 py-2 border border-lokale-border hover:border-lokale-green text-lokale-wood hover:text-lokale-green text-[10px] font-serif font-bold uppercase rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer bg-white"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{lang === "id" ? "Ubah Slot" : "Edit Slot"}</span>
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
              
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-20 text-lokale-wood font-mono font-bold animate-pulse">
          Loading metrics... Use Refresh controls.
        </div>
      )}

      {/* Safe Custom Deletion Confirmation Modal Overlay */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-lokale-green max-w-md w-full rounded-3xl p-6 shadow-2xl text-lokale-wood space-y-5 animate-scaleUp">
            <div className="flex items-center space-x-3.5 pb-2 border-b border-lokale-cream">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-black text-red-600">
                  {lang === "id" ? "Konfirmasi Hapus" : "Confirm Deletion"}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono">
                  ACTION CANNOT BE UNDONE
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {lang === "id" 
                  ? "Apakah Anda yakin ingin menghapus produk ini dari katalog menu aktif?" 
                  : "Are you sure you want to permanently remove this product from the active catalog?"}
              </p>

              <div className="flex items-center space-x-3 p-3 bg-lokale-cream/55 border border-lokale-border rounded-2xl">
                <img 
                  src={(productToDelete.images && productToDelete.images[0]) || null} 
                  alt={productToDelete.name} 
                  className="w-12 h-12 object-cover rounded-xl border border-lokale-border"
                />
                <div>
                  <h4 className="font-serif text-sm font-bold text-lokale-green">{productToDelete.name}</h4>
                  <span className="text-[10px] font-mono text-stone-500">IDR {productToDelete.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-3 text-xs font-mono font-bold uppercase border border-lokale-border hover:bg-lokale-cream bg-white text-lokale-wood rounded-xl transition-all cursor-pointer"
              >
                {lang === "id" ? "Batal" : "Cancel"}
              </button>
              <button
                onClick={() => confirmDeleteProduct(productToDelete.id)}
                className="flex-1 py-3 text-xs font-mono font-bold uppercase bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all cursor-pointer border border-red-600 shadow-md"
              >
                {lang === "id" ? "Hapus" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Custom Order Deletion Confirmation Modal Overlay */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-lokale-green max-w-md w-full rounded-3xl p-6 shadow-2xl text-lokale-wood space-y-5 animate-scaleUp">
            <div className="flex items-center space-x-3.5 pb-2 border-b border-lokale-cream">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-black text-red-600">
                  {lang === "id" ? "Konfirmasi Hapus Pesanan" : "Confirm Order Deletion"}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono">
                  ACTION CANNOT BE UNDONE
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {lang === "id" 
                  ? "Apakah Anda yakin ingin menghapus pesanan salah ini secara permanen dari riwayat transaksi?" 
                  : "Are you sure you want to permanently remove this incorrect order from transaction records?"}
              </p>

              <div className="p-3.5 bg-lokale-cream/55 border border-lokale-border rounded-2xl font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Invoice:</span>
                  <span className="font-bold text-lokale-green">{orderToDelete.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{lang === "id" ? "Pelanggan:" : "Guest:"}</span>
                  <span className="font-bold">{orderToDelete.customerName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-lokale-cream">
                  <span className="text-stone-500">Total:</span>
                  <span className="font-black text-lokale-orange">IDR {orderToDelete.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-3 text-xs font-mono font-bold uppercase border border-lokale-border hover:bg-lokale-cream bg-white text-lokale-wood rounded-xl transition-all cursor-pointer"
              >
                {lang === "id" ? "Batal" : "Cancel"}
              </button>
              <button
                onClick={() => confirmDeleteOrder(orderToDelete.id)}
                className="flex-1 py-3 text-xs font-mono font-bold uppercase bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all cursor-pointer border border-red-600 shadow-md"
              >
                {lang === "id" ? "Hapus" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Custom Payment Method Deletion Confirmation Custom Alert Overlay */}
      {paymentMethodToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-lokale-green max-w-md w-full rounded-3xl p-6 shadow-2xl text-lokale-wood space-y-5 animate-scaleUp">
            <div className="flex items-center space-x-3.5 pb-2 border-b border-lokale-cream">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-black text-red-600">
                  {lang === "id" ? "Konfirmasi Hapus Metode" : "Confirm Payment Deletion"}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono">
                  ACTION CANNOT BE UNDONE
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {lang === "id" 
                  ? "Apakah Anda yakin ingin menghapus saluran metode pembayaran ini?" 
                  : "Are you sure you want to permanently delete this payment method?"}
              </p>

              <div className="flex items-center space-x-3 p-3 bg-lokale-cream/55 border border-lokale-border rounded-2xl">
                {paymentMethodToDelete.image ? (
                  <img 
                    src={paymentMethodToDelete.image} 
                    alt={paymentMethodToDelete.name} 
                    className="w-11 h-11 object-cover rounded-xl border border-lokale-border"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-lokale-green/15 flex items-center justify-center text-lokale-green font-serif font-black text-xs uppercase border border-lokale-border">
                    {paymentMethodToDelete.name.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h4 className="font-serif text-sm font-bold text-lokale-green">{paymentMethodToDelete.name}</h4>
                  <span className="text-[10px] font-mono text-stone-500 uppercase">{paymentMethodToDelete.type}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => setPaymentMethodToDelete(null)}
                className="flex-1 py-3 text-xs font-mono font-bold uppercase border border-lokale-border hover:bg-lokale-cream bg-white text-lokale-wood rounded-xl transition-all cursor-pointer"
              >
                {lang === "id" ? "Batal" : "Cancel"}
              </button>
              <button
                onClick={() => confirmDeletePaymentMethod(paymentMethodToDelete.id)}
                className="flex-1 py-3 text-xs font-mono font-bold uppercase bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all cursor-pointer border border-red-600 shadow-md"
              >
                {lang === "id" ? "Hapus" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Reset Analytics Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-red-600 max-w-md w-full rounded-3xl p-6 shadow-2xl text-lokale-wood space-y-5 animate-scaleUp">
            <div className="flex items-center space-x-3.5 pb-2 border-b border-lokale-cream">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-red-600 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-black text-red-600">
                  {lang === "id" ? "Atur Ulang Analitik" : "Reset Analytical Data"}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono">
                  ACTION WILL DELETE TRANSACTION RECORDS
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {lang === "id" 
                  ? "Apakah Anda yakin ingin menghapus semua catatan transaksi/pesanan dan menyetel ulang seluruh omset menjadi 0?"
                  : "Are you sure you want to flush all transaction history and set total revenue (omset) back to 0 (fresh start)?"}
              </p>
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-[11px] text-red-800 font-medium">
                ⚠️ {lang === "id" 
                  ? "Tindakan ini tidak dapat dibatalkan. Semua statistik KPI akan dikalibrasi ulang ke 0."
                  : "This tool is irreversible. All current reports, sales logs, and KPI counters will be re-calibrated to 0."}
              </div>
            </div>

            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 text-xs font-mono font-bold uppercase border border-lokale-border hover:bg-lokale-cream bg-white text-lokale-wood rounded-xl transition-all cursor-pointer"
              >
                {lang === "id" ? "Batal" : "Cancel"}
              </button>
              <button
                onClick={handleResetAnalytics}
                className="flex-1 py-3 text-xs font-mono font-bold uppercase bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all cursor-pointer border border-red-600 shadow-md flex items-center justify-center space-x-1"
              >
                <span>{lang === "id" ? "Bersihkan" : "Reset to 0"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Toast Notifications overlay */}
      {adminNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-slideIn">
          <div className={`p-4 rounded-2xl border flex items-center space-x-3 shadow-xl ${
            adminNotification.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : adminNotification.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/80 border border-current/30 flex items-center justify-center font-bold text-lg">
              {adminNotification.type === "success" ? "✓" : adminNotification.type === "error" ? "✗" : "i"}
            </span>
            <div className="flex-grow">
              <p className="text-xs font-sans font-semibold leading-normal">{adminNotification.message}</p>
            </div>
            <button 
              onClick={() => setAdminNotification(null)}
              className="text-stone-400 hover:text-stone-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
}
