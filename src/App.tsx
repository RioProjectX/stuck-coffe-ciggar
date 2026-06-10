import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Menu from "./components/Menu";
import Cart from "./components/Cart";
import Admin from "./components/Admin";
import AISommelier from "./components/AISommelier";
import Footer from "./components/Footer";
import { CartItem, Product, UserProfile, BrandLogo } from "./types";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [brandLogo, setBrandLogo] = useState<BrandLogo>({
    type: "icon",
    image: "",
    text: "STUCK COFFEE & CIGAR",
    subtext: "#stuckinmedan"
  });

  // Fetch registered core customer profile
  useEffect(() => {
    fetchProfile();
    fetchLogo();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      setUserProfile(data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchLogo = async () => {
    try {
      const res = await fetch("/api/logo");
      const data = await res.json();
      if (data && data.text) {
        setBrandLogo(data);
      }
    } catch (err) {
      console.error("Error fetching logo:", err);
    }
  };

  const handleRefreshLogo = () => {
    fetchLogo();
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { id: `cart-${Date.now()}-${product.id}`, product, quantity }];
    });
    alert(`Polished! Included ${quantity} unit(s) of '${product.name}' into your room order.`);
  };

  const handleBuyNow = (product: Product) => {
    // Clear cart and insert exactly this item
    setCartItems([{ id: `cart-${Date.now()}`, product, quantity: 1 }]);
    setCurrentTab("cart"); // Immediately switch to checkout
  };

  const handleUpdateQuantity = (id: string, q: number) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: q } : item));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleBookEventRedirect = (eventId: string) => {
    // Event successfully booked, keep on home page or let it stay
  };

  return (
    <div className="min-h-screen bg-lokale-cream text-lokale-wood flex flex-col font-sans transition-colors duration-300">
      
      {/* Navbar Container */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        cartCount={cartItems.reduce((acc, current) => acc + current.quantity, 0)}
        userPoints={userProfile ? userProfile.points : 0}
        userLevel={userProfile ? userProfile.membershipLevel : "Member"}
        brandLogo={brandLogo}
      />

      {/* Main viewport area */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full"
          >
            {currentTab === "home" && (
              <Home 
                setCurrentTab={setCurrentTab} 
                onBookEvent={handleBookEventRedirect}
              />
            )}
            
            {currentTab === "menu" && (
              <Menu 
                onAddToCart={handleAddToCart} 
                onBuyNow={handleBuyNow} 
              />
            )}
            
            {currentTab === "sommelier" && (
              <AISommelier 
                userLevel={userProfile ? userProfile.membershipLevel : "Member"} 
              />
            )}
            
            {currentTab === "cart" && userProfile && (
              <Cart 
                cartItems={cartItems} 
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                userPoints={userProfile.points}
                userLevel={userProfile.membershipLevel}
                onRefreshProfile={fetchProfile}
                setCurrentTab={setCurrentTab}
              />
            )}
            
            {currentTab === "admin" && (
              <Admin brandLogo={brandLogo} onRefreshLogo={handleRefreshLogo} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Elegant Footer */}
      <Footer setCurrentTab={setCurrentTab} brandLogo={brandLogo} />

    </div>
  );
}
