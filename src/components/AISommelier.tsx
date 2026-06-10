import { MessageSquare, Sparkles, Send, Coffee, Loader2, ChevronLeft, Bot, UserCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../context/LanguageContext";

interface AISommelierProps {
  userLevel: string;
}

type ChatMode = "ai" | "staff" | null;

export default function AISommelier({ userLevel }: AISommelierProps) {
  const { lang, t } = useLanguage();
  const [activeMode, setActiveMode] = useState<ChatMode>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(0);

  // Auto-scroll to bottom of message container only to prevent page jumping
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const lengthChanged = messages.length > prevMessagesLength.current;
      
      if (lengthChanged || loading) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, loading]);

  // Active sync function to query live backend messages
  const fetchLiveChatMessages = async (mode: ChatMode) => {
    if (!mode) return;
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const rooms = await response.json();
        const userRoom = rooms.find((r: any) => r.id === "chat-user");
        if (userRoom && userRoom.messages) {
          // Filter messages depending on selected mode to keep context clean
          // AI Mode: we show user inputs and sommelier (AI bot) replies
          // Staff Mode: we show user inputs and admin (live staff) replies
          const filtered = userRoom.messages.filter((m: any) => {
            if (mode === "ai") {
              return m.sender === "user" || m.sender === "sommelier";
            } else {
              return m.sender === "user" || m.sender === "admin";
            }
          });
          
          setMessages(prev => {
            const isIdentical = prev.length === filtered.length &&
              prev.every((m, idx) => m.text === filtered[idx].text && m.sender === filtered[idx].sender);
            return isIdentical ? prev : filtered;
          });
        }
      }
    } catch (err) {
      console.error("Failed to sync chat ledger:", err);
    }
  };

  // Start/Stop polling based on whether a mode is active
  useEffect(() => {
    if (activeMode) {
      // Fetch immediately
      fetchLiveChatMessages(activeMode);
      
      // Poll every 3 seconds
      intervalRef.current = setInterval(() => {
        fetchLiveChatMessages(activeMode);
      }, 3000);
    } else {
      setMessages([]);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeMode]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading || !activeMode) return;
    
    // Add User Message to local state immediately for snappy responsive feel
    const userMsg = {
      sender: "user",
      text: promptText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chats/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: promptText,
          type: activeMode === "ai" ? "ai" : "staff"
        })
      });
      
      if (response.ok) {
        const updatedRoom = await response.json();
        // Immediately refresh the feed to capture any instant AI response
        if (updatedRoom && updatedRoom.messages) {
          const filtered = updatedRoom.messages.filter((m: any) => {
            if (activeMode === "ai") {
              return m.sender === "user" || m.sender === "sommelier";
            } else {
              return m.sender === "user" || m.sender === "admin";
            }
          });
          setMessages(filtered);
        }
      } else {
        throw new Error("Lounge transmitter issue");
      }
    } catch (err) {
      console.error(err);
      // Append fallback if unable to connect
      setMessages(prev => [
        ...prev,
        {
          sender: activeMode === "ai" ? "sommelier" : "admin",
          text: lang === "id" 
            ? "### Jeda Jaringan\nSistem chat kami sedang disesuaikan. Silakan kirim ulang pesan Anda beberapa saat lagi."
            : "### Network Intermission\nOur chat system is undergoing quick maintenance. Please re-send your message shortly.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startAiChat = () => {
    setActiveMode("ai");
  };

  const startStaffChat = () => {
    setActiveMode("staff");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[85vh] bg-lokale-cream flex flex-col justify-center">
      
      {/* Dynamic Title Headers */}
      <div className="mb-8 text-center animate-fadeIn">
        <span className="text-lokale-orange font-mono text-xs uppercase tracking-[0.25em] font-bold block mb-2">
          Stuck Coffee & Cigar Live Hub
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-lokale-green">
          Live Chat Barista
        </h1>
        <p className="text-lokale-wood/85 text-xs sm:text-sm mt-3 font-normal max-w-xl mx-auto leading-relaxed">
          {lang === "id" 
            ? "Pilih gerbang konsultasi interaktif Anda. Dapatkan rekomendasi langsung atau terhubung langsung dengan kru lounge kami di Jalan Sutoyo Sismowiharjo."
            : "Choose your interactive consultation channel. Settle in for premium expert recommendations or a direct connection to our live lounge floor."}
        </p>
      </div>

      {activeMode === null ? (
        /* SELECTION COMPONENT: EXACTLY 2 CHOICES */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full mt-2 animate-fadeIn">
          
          {/* OPTION 1: CHAT WITH AI [ IVAN SIAHAAN BOT ] */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-white border-2 border-lokale-border hover:border-lokale-green rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm cursor-pointer transition-all space-y-6"
            onClick={startAiChat}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-lokale-orange-light flex items-center justify-center text-lokale-orange border border-lokale-orange/20">
                <Bot className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif font-black text-lg sm:text-xl text-lokale-green">
                  {lang === "id" ? "Chat dengan AI [ Ivan Siahaan BOT ]" : "Chat with AI [ Ivan Siahaan BOT ]"}
                </h3>
                <p className="text-xs sm:text-[13px] text-lokale-wood/75 leading-relaxed font-light">
                  {lang === "id" 
                    ? "Dapatkan saran racikan kopi, profil cerutu impor, dan paduan cita rasa sensorik secara instan 24/7 bersama bot asisten ahli kami."
                    : "Obtain instant 24/7 recommendations for single-origins, imported cigars, and custom culinary sensory pairings with our expert AI specialist."}
                </p>
              </div>
            </div>
            
            <div className="text-xs font-mono font-bold text-lokale-orange uppercase tracking-wider flex items-center space-x-1 pt-4 border-t border-neutral-100">
              <span>{lang === "id" ? "Mulai Obrolan AI" : "Initiate AI Dialogue"}</span>
              <span>&rarr;</span>
            </div>
          </motion.div>

          {/* OPTION 2: CHAT WITH STAFF/ADMIN */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-white border-2 border-lokale-border hover:border-lokale-green rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm cursor-pointer transition-all space-y-6"
            onClick={startStaffChat}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-lokale-green/10 flex items-center justify-center text-lokale-green border border-lokale-green/20">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif font-black text-lg sm:text-xl text-lokale-green">
                  {lang === "id" ? "Chat dengan Admin / Staff Stuck" : "Chat with Stuck Admin / Lounge Staff"}
                </h3>
                <p className="text-xs sm:text-[13px] text-lokale-wood/75 leading-relaxed font-light">
                  {lang === "id" 
                    ? "Hubungi langsung barista aktif atau kru administrasi pelayan lounge kami untuk reservasi manual, pemesanan kustom, atau bantuan di tempat."
                    : "Establish live contact with our floor baristas or concierge administrators for reservation adjustments, custom table services, or tailored lounge aid."}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono font-bold text-lokale-green uppercase tracking-wider flex items-center space-x-1 pt-4 border-t border-neutral-100">
              <span>{lang === "id" ? "Mulai Live Chat Staff" : "Establish Staff Hook"}</span>
              <span>&rarr;</span>
            </div>
          </motion.div>

        </div>
      ) : (
        /* CHAT INTERACTIVE WINDOW */
        <div className="bg-white rounded-3xl border border-lokale-border max-w-4xl mx-auto w-full p-4 sm:p-6 shadow-sm flex flex-col h-[540px] animate-fadeIn">
          
          {/* Active Chat Header Details */}
          <div className="flex items-center justify-between border-b border-lokale-cream pb-4 mb-4">
            <button
              onClick={() => setActiveMode(null)}
              className="flex items-center space-x-1.5 text-xs text-lokale-wood/65 hover:text-lokale-green font-mono font-bold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === "id" ? "Ganti Pilihan Chat" : "Change Channel"}</span>
            </button>

            <div className="flex items-center space-x-2 bg-lokale-cream/50 px-3 py-1.5 rounded-full border border-lokale-border">
              <span className="w-2 h-2 rounded-full bg-lokale-orange animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-lokale-green uppercase tracking-wide">
                {activeMode === "ai" ? "Ivan Siahaan BOT Mode" : "Lounge Staff Support"}
              </span>
            </div>
          </div>

          {/* Messages Feed Viewport */}
          <div ref={chatContainerRef} className="flex-grow overflow-y-auto bg-lokale-cream/50 rounded-2xl p-4 space-y-4 mb-4 border border-lokale-border pr-2">
            
            {/* Custom Welcome message appended at the top based on mode */}
            <div className="flex justify-start">
              <div className="p-3.5 bg-white border border-lokale-border text-lokale-wood rounded-2xl rounded-tl-none max-w-xl text-xs sm:text-sm leading-relaxed shadow-3xs">
                <div className="flex items-center space-x-1.5 text-[9px] font-mono text-lokale-green font-extrabold uppercase mb-1.5">
                  {activeMode === "ai" ? (
                    <>
                      <Bot className="w-3.5 h-3.5 text-lokale-orange" />
                      <span>IVAN SIAHAAN BOT (AI AGENT)</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-lokale-orange" />
                      <span>STUCK BARISTA & STAFF</span>
                    </>
                  )}
                </div>
                
                <p>
                  {activeMode === "ai" ? (
                    lang === "id" 
                      ? "Halo! Saya **Ivan Siahaan BOT**, asisten AI multi-bahasa yang didukung penuh oleh teknologi **Gemini**. Saya siap menjawab pertanyaan atau mengobrol apa saja tentang topik apapun di dunia, dalam bahasa pilihan Anda (Indonesia, Inggris, daerah, global)!"
                      : "Hello! I am **Ivan Siahaan BOT**, your multi-language AI companion powered fully by **Gemini**. I am here to assist you and converse about any topic in the world, in any language you prefer to speak!"
                  ) : (
                    lang === "id"
                      ? "Halo! Anda sekarang terhubung ke antrean bantuan staf lounge Stuck Coffee & Cigar. Barista atau pelayan meja kami akan segera membalas pesan Anda di sini. Silakan ketik bantuan khusus yang Anda butuhkan."
                      : "Hello! You are now connected to Stuck Coffee & Cigar's live staff queue. Our baristas or desk captains will address your queries directly. Please specify any special table or order requests."
                  )}
                </p>
              </div>
            </div>

            {/* Custom Chat Feed */}
            {messages.map((m, index) => {
              const isUser = m.sender === "user";
              const label = isUser 
                ? (lang === "id" ? "KONSUMEN" : "CONNOISSEUR") 
                : (activeMode === "ai" ? "IVAN SIAHAAN BOT" : (lang === "id" ? "BARISTA / STAF" : "ADMIN STAFF"));
              
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm max-w-xl leading-relaxed ${
                    isUser 
                      ? "bg-lokale-orange-light border border-lokale-orange/20 text-lokale-wood rounded-tr-none shadow-3xs"
                      : "bg-white border border-lokale-border text-lokale-wood rounded-tl-none shadow-3xs"
                  }`}>
                    
                    <div className="flex items-center space-x-1.5 text-[9px] font-mono text-lokale-wood/50 mb-1.5 uppercase font-bold">
                      <span>{label}</span>
                      <span>•</span>
                      <span>
                        {m.timestamp 
                          ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Live"}
                      </span>
                    </div>

                    <div className="markdown-body text-xs sm:text-sm text-lokale-wood">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* thinking loader spinner */}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="p-3 bg-white border border-lokale-border text-lokale-wood/75 rounded-2xl rounded-tl-none text-xs font-mono flex items-center space-x-1.5 shadow-3xs">
                  <Loader2 className="w-3.5 h-3.5 text-lokale-orange animate-spin" />
                  <span>{lang === "id" ? "Ivan Siahaan BOT sedang merumuskan jawaban..." : "Ivan BOT is drafting analysis..."}</span>
                </div>
              </div>
            )}

          </div>

          {/* Form input messaging */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                handleSendPrompt(chatInput);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              required
              disabled={loading}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                activeMode === "ai" 
                  ? (lang === "id" ? "Tanya Ivan BOT tentang kopi, cerutu..." : "Ask Ivan BOT about coffee or cigars...") 
                  : (lang === "id" ? "Ketik pesan untuk staf atau barista lounge..." : "Message Stuck live assistant floor...")
              }
              className="flex-grow px-4 py-3 rounded-xl bg-lokale-cream border border-lokale-border text-lokale-wood text-xs sm:text-sm focus:outline-none focus:border-lokale-green font-sans"
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="px-5 rounded-xl bg-lokale-green hover:bg-lokale-green-light text-white font-mono font-bold uppercase text-xs flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-3xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
