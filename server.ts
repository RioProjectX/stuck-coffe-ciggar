import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Custom High-Performance Firestore REST Client to completely bypass
 * container IAM/gRPC permissions limit using the Firebase API Key.
 */
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    return { doubleValue: val };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === "object") {
    const fields: any = {};
    for (const k of Object.keys(val)) {
      fields[k] = toFirestoreValue(val[k]);
    }
    return {
      mapValue: { fields }
    };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(fval: any): any {
  if (!fval) return null;
  if ("nullValue" in fval) return null;
  if ("booleanValue" in fval) return fval.booleanValue;
  if ("integerValue" in fval) return parseInt(fval.integerValue, 10);
  if ("doubleValue" in fval) return parseFloat(fval.doubleValue);
  if ("stringValue" in fval) return fval.stringValue;
  if ("arrayValue" in fval) {
    const vals = fval.arrayValue.values || [];
    return vals.map(fromFirestoreValue);
  }
  if ("mapValue" in fval) {
    const fields = fval.mapValue.fields || {};
    const obj: any = {};
    for (const k of Object.keys(fields)) {
      obj[k] = fromFirestoreValue(fields[k]);
    }
    return obj;
  }
  return null;
}

class FirestoreRESTDoc {
  constructor(private collection: string, private docId: string, private client: FirestoreRESTClient) {}

  async set(data: any): Promise<void> {
    const url = `${this.client.baseUrl}/${this.collection}/${this.docId}?key=${this.client.apiKey}`;
    const payload = {
      fields: {} as any
    };
    for (const key of Object.keys(data)) {
      if (data[key] !== undefined) {
        payload.fields[key] = toFirestoreValue(data[key]);
      }
    }
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore REST write error: ${res.status} - ${errText}`);
    }
  }

  async delete(): Promise<void> {
    const url = `${this.client.baseUrl}/${this.collection}/${this.docId}?key=${this.client.apiKey}`;
    const res = await fetch(url, {
      method: "DELETE"
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore REST delete error: ${res.status} - ${errText}`);
    }
  }
}

class FirestoreRESTQuery {
  constructor(private collection: string, private client: FirestoreRESTClient) {}

  doc(id: string) {
    return new FirestoreRESTDoc(this.collection, id, this.client);
  }

  async get(): Promise<{ empty: boolean; forEach: (cb: (doc: { data: () => any }) => void) => void }> {
    const url = `${this.client.baseUrl}:runQuery?key=${this.client.apiKey}`;
    const payload = {
      structuredQuery: {
        from: [{ collectionId: this.collection }]
      }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore REST list error: ${res.status} - ${errText}`);
    }
    const results = await res.json();
    
    const docs: any[] = [];
    if (Array.isArray(results)) {
      for (const item of results) {
        if (item.document && item.document.fields) {
          const docData: any = {};
          for (const key of Object.keys(item.document.fields)) {
            docData[key] = fromFirestoreValue(item.document.fields[key]);
          }
          docs.push(docData);
        }
      }
    }

    return {
      empty: docs.length === 0,
      forEach(cb: (doc: { data: () => any }) => void) {
        docs.forEach(d => cb({ data: () => d }));
      }
    };
  }
}

class FirestoreRESTClient {
  public baseUrl: string;
  public apiKey: string;

  constructor(projectId: string, databaseId: string, apiKey: string) {
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
    this.apiKey = apiKey;
  }

  collection(name: string) {
    return new FirestoreRESTQuery(name, this);
  }
}

/**
 * Initialize Google Gen AI
 */
const apiKey = process.env.GEMINI_API_KEY;
let ai: any = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("GoogleGenAI initialized successfully on backend server");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.log("No GEMINI_API_KEY detected. Running inconcierge-fallback mode.");
}

/**
 * Initialize Firestore Cloud Connection
 */
let firestore: FirestoreRESTClient | null = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    firestore = new FirestoreRESTClient(
      config.projectId,
      config.firestoreDatabaseId || config.databaseId || "(default)",
      config.apiKey
    );
    console.log("Firestore successfully initialized over REST of project:", config.projectId);
  } else {
    console.warn("firebase-applet-config.json not found. Operating in local-only fallback mode.");
  }
} catch (err) {
  console.warn("Firestore not available yet. Operating in local JSON fallback mode:", err);
}

export const app = express();
const PORT = 3000;

app.use(express.json());

// Seeds & Storage Fallbacks
const PRODUCTS_FILE = path.join(process.cwd(), "products_persistent.json");

const INITIAL_DEFAULT_PRODUCTS = [
  // COFFEE - ESPRESO & SIGNATURES
  {
    id: "prod-1",
    name: "Stuck Obsidian Signature Latte",
    category: "coffee",
    subcategory: "Signature Coffee",
    price: 68000,
    description: "Our signature blend espresso double-shot infused with home-made salted maple syrup, smoked oak wood smoke dome, and edible 24K gold foil.",
    rating: 4.9,
    stock: 25,
    status: "available",
    images: ["https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Stuck Obsidian Blend (Ethiopia & Sumatra Honey)", roastLevel: "Medium-Dark", notes: "Rich dark cacao, oak wood smoke, buttery maple sweetness", strength: "High" }
  },
  {
    id: "prod-2",
    name: "Truffle Caramel Cappuccino",
    category: "coffee",
    subcategory: "Cappuccino",
    price: 62000,
    description: "Classic velvety cappuccino sweetened with a hint of gourmet black truffle oil syrup, toasted pecan extract, and premium fleur de sel salt.",
    rating: 4.8,
    stock: 30,
    status: "available",
    images: ["https://images.unsplash.com/photo-1510972527409-cef190317417?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Guatemala Antigua Single Origin", roastLevel: "Medium", notes: "Rich cedar wood, light truffle elegance, buttery caramel", strength: "Medium-High" }
  },
  {
    id: "prod-3",
    name: "Geisha Esmeralda Pour-Over",
    category: "coffee",
    subcategory: "Manual Brew",
    price: 125000,
    description: "A highly prestigious, rare manual brew of Panama Geisha. Crafted gently using ceramic V60. Showcases phenomenal clean floral aromatics.",
    rating: 5.0,
    stock: 8,
    status: "available",
    images: ["https://images.unsplash.com/photo-1497515114629-f71d768fd07c?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Hacienda La Esmeralda, Panama", roastLevel: "Light-Medium", notes: "Bergamot, jasmine blossoms, ripe peach, honeysuckle", strength: "Medium" }
  },
  {
    id: "prod-4",
    name: "Bourbon Cold Brew Reserve",
    category: "coffee",
    subcategory: "Manual Brew",
    price: 58000,
    description: "Our triple-filtered Kyoto cold brew aged for 30 days in genuine charred toasted bourbon oak barrels for notes of natural vanilla wood and smoke.",
    rating: 4.7,
    stock: 20,
    status: "available",
    images: ["https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Sumatra Gayo Honey G1", roastLevel: "Medium", notes: "Bourbon barrel whiskey wood, maple charcoal, vanilla bean", strength: "High" }
  },

  // NON-COFFEE
  {
    id: "prod-5",
    name: "Ceremonial Uji Matcha Latte",
    category: "non-coffee",
    subcategory: "Matcha",
    price: 55000,
    description: "Pure stone-ground stone-mill Japanese ceremonial grade matcha from Uji, whisked slowly with warm single-origin oatmilk and organic raw blossom nectar.",
    rating: 4.9,
    stock: 45,
    status: "available",
    images: ["https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Uji, Kyoto (Japan)", notes: "Deep umami, roasted nutty tea fragrance, velvety creamy oat finish" }
  },
  {
    id: "prod-6",
    name: "72% Madagascar Dark Chocolate",
    category: "non-coffee",
    subcategory: "Chocolate",
    price: 52000,
    description: "Warm single-origin organic dark chocolate containing 72% Madagascar cacao. Spiced with a delicate pinch of ground cinnamon wood and vanilla pod.",
    rating: 4.8,
    stock: 15,
    status: "available",
    images: ["https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Madagascar Cacao Cooperatives", notes: "Fruity raspberry hints, deep chocolate earthiness, warm wood spice" }
  },

  // FOOD
  {
    id: "prod-7",
    name: "Gold Leaf Butter Croissant",
    category: "food",
    subcategory: "Pastry",
    price: 45000,
    description: "A flaky, crispy artisan french butter croissant containing 81 meticulously rolled laminated layers, garnished with shimmering elegant gold leaf decoration.",
    rating: 4.8,
    stock: 12,
    status: "available",
    images: ["https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Imported French Normandy Butter", notes: "Melt-in-mouth golden texture, deep rich buttery dairy aroma" }
  },
  {
    id: "prod-8",
    name: "Salted Caramel Crème Brûlée",
    category: "food",
    subcategory: "Dessert",
    price: 50000,
    description: "Silky premium egg yolk custard infused with hand-scraped vanilla beans from Tahiti, topped with a brittle shattered glass hard caramel crust.",
    rating: 4.9,
    stock: 14,
    status: "available",
    images: ["https://images.unsplash.com/photo-1516685018646-549198525c1b?q=80&w=600&auto=format&fit=crop"],
    details: { notes: "Speckled with authentic black vanilla seeds, smoky caramel crunch" }
  },

  // PREMIUM CIGARS
  {
    id: "prod-9",
    name: "Cohiba Behike 52 Grand Reserve",
    category: "cigar",
    subcategory: "Premium Cigars",
    price: 1850000,
    description: "The ultimate peak of cigar crafting. Made using state-of-the-art Cuban wrapper and filler leaves containing the prestigious 'medio tiempo' top crop.",
    rating: 5.0,
    stock: 4,
    status: "available",
    images: ["https://images.unsplash.com/photo-1606149479366-07f917dfa4fa?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Havana, Cuba", ringGauge: 52, length: "4.7 inches", strength: "Full Body", notes: "Rich leather, creamy dark coffee beans, charred cedar, earth" }
  },
  {
    id: "prod-10",
    name: "Montecristo No. 2 Torpedo",
    category: "cigar",
    subcategory: "Premium Cigars",
    price: 850000,
    description: "The gold standard torpedo of the entire world. Rich Cuban tobaccos blended carefully to evoke complex woodsy tones, transitions flawlessly from start to finish.",
    rating: 4.9,
    stock: 10,
    status: "available",
    images: ["https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Havana, Cuba", ringGauge: 52, length: "6.1 inches", strength: "Medium to Full", notes: "Roasted almonds, cedar timber, light honey glaze, sweet leather" }
  },
  {
    id: "prod-11",
    name: "Davidoff Winston Churchill Late Hour",
    category: "cigar",
    subcategory: "Imported Cigars",
    price: 980000,
    description: "A legendary robusto cigar containing Nicaraguan leaves fermented for 6 months in select charred single-malt Scotch Whisky barrels for an unmatched depth.",
    rating: 4.8,
    stock: 12,
    status: "available",
    images: ["https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Dominican Republic & Nicaragua", ringGauge: 54, length: "5.0 inches", strength: "Full Body", notes: "Islay scotch smoke, bitter cacao, freshly plowed earth, wood spices" }
  },
  {
    id: "prod-12",
    name: "Gilded Solid Brass Dual-Cutter",
    category: "cigar",
    subcategory: "Accessories",
    price: 1200000,
    description: "A heavy, solid brass premium dual guillotine cutter plated with stunning 18K brushed gold. Houses precision engineered razor sharp steel blades.",
    rating: 4.9,
    stock: 5,
    status: "available",
    images: ["https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop"],
    details: { notes: "Lifetime steel blades, flawless double cut, velvet carrying pouch" }
  }
];

let db_products: any[] = [];

function loadProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      db_products = parsed.length ? parsed : [...INITIAL_DEFAULT_PRODUCTS];
    } else {
      db_products = [...INITIAL_DEFAULT_PRODUCTS];
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(db_products, null, 2), "utf-8");
    }
  } catch (err) {
    db_products = [...INITIAL_DEFAULT_PRODUCTS];
  }
}

function saveProducts() {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(db_products, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save products locally:", err);
  }
}

async function loadProductsFromCloud() {
  if (firestore) {
    try {
      const snapshot = await firestore.collection("products").get();
      if (!snapshot.empty) {
        const cloudProducts: any[] = [];
        snapshot.forEach(doc => {
          cloudProducts.push(doc.data());
        });
        db_products = cloudProducts;
        console.log(`Synced ${db_products.length} products from Firestore cloud.`);
        return;
      } else {
        console.log("Firestore 'products' collection is empty. Auto-seeding default products...");
        for (const item of INITIAL_DEFAULT_PRODUCTS) {
          await firestore.collection("products").doc(item.id).set(item);
        }
        db_products = [...INITIAL_DEFAULT_PRODUCTS];
        saveProducts();
        return;
      }
    } catch (err) {
      console.warn("Could not read products from Firestore, falling back to disk:", err);
    }
  }
  loadProducts();
}

async function writeProductToCloud(product: any) {
  if (firestore) {
    try {
      await firestore.collection("products").doc(product.id).set(product);
    } catch (err) {
      console.error("Failed to write product to Firestore:", err);
    }
  }
  saveProducts();
}

async function deleteProductFromCloud(id: string) {
  if (firestore) {
    try {
      await firestore.collection("products").doc(id).delete();
    } catch (err) {
      console.error("Failed to delete product from Firestore:", err);
    }
  }
  saveProducts();
}

// No duplicate local definition of db_reservations and db_ordersers

let db_chat_rooms = [
  {
    id: "chat-user",
    customerName: "Sandrio Nainggolan",
    customerEmail: "sandrionainggolan43@gmail.com",
    lastMessage: "I would love to learn more about the Cohiba Behike 52 wrapper aging.",
    lastUpdated: "2026-06-03T11:20:00Z",
    messages: [
      { id: "msg-1", sender: "user", text: "Hello! What coffee do you recommend pairing with a full-bodied cigar like Cohiba?", timestamp: "2026-06-03T11:05:00Z" },
      { id: "msg-2", sender: "sommelier", text: "Welcome to Stuck Coffee & Cigar. For a powerhouse like the Cohiba Behike featuring dense leather and earthy bean tones, I highly recommend our double-shot Bourbon Cold Brew Reserve. Its vanilla char and toasted oak flavor elements cut beautifully through the thick creaminess of the wrapper.", timestamp: "2026-06-03T11:08:00Z" },
      { id: "msg-3", sender: "user", text: "I would love to learn more about the Cohiba Behike 52 wrapper aging.", timestamp: "2026-06-03T11:20:00Z" }
    ]
  }
];

let db_events = [
  {
    id: "evt-1",
    title: "V60 Artisan Pour-Over Masterclass",
    category: "Workshop",
    description: "Learn precise master variables of coffee extraction: temperature curves, water-to-bean ratios, blooming stages, and grind distributions with our head barista using ceramic V60s and premium Panama Esmeralda beans.",
    date: "2026-06-20",
    time: "10:00 - 12:30",
    price: 320000,
    seatsLimit: 12,
    seatsLeft: 5,
    image: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?q=80&w=600&auto=format&fit=crop",
    location: "Main Coffee Bar, Stuck Lounge"
  },
  {
    id: "evt-2",
    title: "Cuban Cigar Tasting & Whiskey Infusion",
    category: "Tasting Session",
    description: "A highly exclusive masterclass featuring three distinct wrapper profiles from Havana paired against limited-run Single-Malt Scotch barrels, guided by our accredited Cigar Sommelier in the private walnut cellar room.",
    date: "2026-06-27",
    time: "19:30 - 22:00",
    price: 850000,
    seatsLimit: 8,
    seatsLeft: 2,
    image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop",
    location: "Private Walnut Cellar, Stuck Cigar Lounge"
  }
];

let db_blogs = [
  {
    id: "b-1",
    title: "Understanding the Mystique of Panama Geisha Coffee",
    category: "Coffee Craft",
    summary: "Why is Hacienda La Esmeralda Geisha crowned the king of pour-overs? We dive into structural genetics, high-altitude microclimates, and complex jasmine aromatics.",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop",
    content: "For coffee aficionados around the globe, Panama Geisha isn't simply a morning beverage; it is a profound sensory experience. Discovered originally in Ethiopia, the Geisha variety was brought to Boquete, Panama, where its volcanic high soil altitude unlocked unprecedented compounds. This article maps our precise brewing guidelines: water at 92.5°C poured over 15 grams of light-roast Geisha finely ground to mimic floral jasmine blossoms, juicy white nectarines, and a finishing note of fresh organic orange zest.",
    slug: "panama-geisha-mystique",
    date: "2026-05-28",
    author: "Hendry Tan, Quality Controller",
    readTime: "5 min read"
  },
  {
    id: "b-2",
    title: "The Ultimate Guide to Cigar Etiquette & Tasting",
    category: "Cigar Tasting",
    summary: "Whether cut with double blades or a V-cut, warming the foot, and drawing notes of cedar wood. Avoid common mistakes at Stuck Lounge.",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop",
    content: "Enjoying a hand-rolled Cubano is a deliberate ritual that demands patience. First, never let the flame touch the tobacco leaves directly when lighting. Toast the foot gently at a 45-degree angle. Rotating to verify uniform glowing circles prevents uneven combustion (tunneling). Take dynamic draws every 45-60 seconds, allowing notes of leather, chocolate, spice, and fine wood to coolly expand over your taste buds, preserving long flavor trails.",
    slug: "cigar-etiquette-ultimate-guide",
    date: "2026-06-02",
    author: "Richard Pierre, Cigar Sommelier",
    readTime: "8 min read"
  }
];

let db_vouchers = [
  { code: "STUCKCLUB", discountPercent: 15, minPurchase: 100000, description: "15% off for our brand introduction" },
  { code: "GEISHAGUEST", discountPercent: 10, minPurchase: 500000, description: "Premium discount for high-tier connoisseurs" },
  { code: "STUCKNEW", discountPercent: 20, minPurchase: 0, description: "Exclusive 20% discount on initial coffee launch" }
];

// Seed Premium Datasets & Double Storage Fallbacks
const REVIEWS_FILE = path.join(process.cwd(), "reviews_persistent.json");
const RESERVATIONS_FILE = path.join(process.cwd(), "reservations_persistent.json");
const ORDERS_FILE = path.join(process.cwd(), "orders_persistent.json");

const INITIAL_DEFAULT_REVIEWS = [];

const INITIAL_DEFAULT_RESERVATIONS = [
  {
    id: "res-1",
    customerName: "Sandra Wibowo",
    email: "sandraw@gmail.com",
    phone: "+628123456781",
    date: "2026-06-15",
    time: "19:00",
    guests: 4,
    tableArea: "Private Cigar Room",
    notes: "Business meeting discussing funding. Please prepare a humidor on arrival.",
    status: "Approved",
    reservationCode: "LOK-RE3982",
    createdAt: "2026-06-01T10:20:00Z"
  },
  {
    id: "res-2",
    customerName: "Ahmad Rayhan",
    email: "rayhan@gmail.com",
    phone: "+628198765432",
    date: "2026-06-16",
    time: "16:30",
    guests: 2,
    tableArea: "VIP Patio",
    notes: "Anniversary celebration. Would prefer a corner table overlooking the skyline.",
    status: "Pending",
    reservationCode: "LOK-RE9821",
    createdAt: "2026-06-02T14:15:00Z"
  }
];

let db_reviews: any[] = [];
let db_reservations: any[] = [];
let db_orders: any[] = [];

// 1. REVIEWS STORAGE SYNC LOGIC
function loadReviews() {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      db_reviews = (parsed.length ? parsed : [...INITIAL_DEFAULT_REVIEWS]).filter((r: any) => r && !r.id?.startsWith("rev-default-") && !r.id?.includes("test") && r.status !== "deleted");
    } else {
      db_reviews = [...INITIAL_DEFAULT_REVIEWS];
      fs.writeFileSync(REVIEWS_FILE, JSON.stringify(db_reviews, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to load reviews from disk:", err);
    db_reviews = [...INITIAL_DEFAULT_REVIEWS];
  }
}

function saveReviews() {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(db_reviews, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write reviews to file:", err);
  }
}

async function loadReviewsFromCloud() {
  if (firestore) {
    try {
      const snapshot = await firestore.collection("reviews").get();
      if (!snapshot.empty) {
        const cloudReviews: any[] = [];
        snapshot.forEach(doc => {
          const r = doc.data();
          if (r && !r.id?.startsWith("rev-default-") && !r.id?.includes("test") && r.status !== "deleted") {
            cloudReviews.push(r);
          }
        });
        db_reviews = cloudReviews;
        console.log(`Synced ${db_reviews.length} reviews from Firestore cloud.`);
        return;
      }
    } catch (err) {
      console.warn("Could not read reviews from Firestore, falling back to disk:", err);
    }
  }
  loadReviews();
}

async function writeReviewToCloud(review: any) {
  if (firestore) {
    try {
      await firestore.collection("reviews").doc(review.id).set(review);
    } catch (err) {
      console.error("Failed to write review to Firestore cloud:", err);
    }
  }
  saveReviews();
}

// 2. RESERVATIONS STORAGE SYNC LOGIC
function loadReservations() {
  try {
    if (fs.existsSync(RESERVATIONS_FILE)) {
      const data = fs.readFileSync(RESERVATIONS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      db_reservations = parsed.length ? parsed : [...INITIAL_DEFAULT_RESERVATIONS];
    } else {
      db_reservations = [...INITIAL_DEFAULT_RESERVATIONS];
      fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(db_reservations, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to load reservations from disk:", err);
    db_reservations = [...INITIAL_DEFAULT_RESERVATIONS];
  }
}

function saveReservations() {
  try {
    fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(db_reservations, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save reservations locally:", err);
  }
}

async function loadReservationsFromCloud() {
  if (firestore) {
    try {
      const snapshot = await firestore.collection("reservations").get();
      if (!snapshot.empty) {
        const cloudReservations: any[] = [];
        snapshot.forEach(doc => {
          cloudReservations.push(doc.data());
        });
        db_reservations = cloudReservations;
        console.log(`Synced ${db_reservations.length} reservations from Firestore cloud.`);
        return;
      } else {
        console.log("Firestore 'reservations' collection is empty. Auto-seeding default reservations...");
        for (const item of INITIAL_DEFAULT_RESERVATIONS) {
          await firestore.collection("reservations").doc(item.id).set(item);
        }
        db_reservations = [...INITIAL_DEFAULT_RESERVATIONS];
        saveReservations();
        return;
      }
    } catch (err) {
      console.warn("Could not read reservations from Firestore:", err);
    }
  }
  loadReservations();
}

async function writeReservationToCloud(reservation: any) {
  if (firestore) {
    try {
      await firestore.collection("reservations").doc(reservation.id).set(reservation);
    } catch (err) {
      console.error("Failed to write reservation to Firestore:", err);
    }
  }
  saveReservations();
}

// 3. ORDERS STORAGE SYNC LOGIC
function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      db_orders = JSON.parse(data);
    } else {
      db_orders = [];
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(db_orders, null, 2), "utf-8");
    }
  } catch (err) {
    db_orders = [];
  }
}

function saveOrders() {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(db_orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save orders locally:", err);
  }
}

async function loadOrdersFromCloud() {
  if (firestore) {
    try {
      const snapshot = await firestore.collection("orders").get();
      if (!snapshot.empty) {
        const cloudOrders: any[] = [];
        snapshot.forEach(doc => {
          cloudOrders.push(doc.data());
        });
        db_orders = cloudOrders;
        console.log(`Synced ${db_orders.length} orders from Firestore cloud.`);
        return;
      }
    } catch (err) {
      console.warn("Could not read orders from Firestore:", err);
    }
  }
  loadOrders();
}

async function writeOrderToCloud(order: any) {
  if (firestore) {
    try {
      await firestore.collection("orders").doc(order.id).set(order);
    } catch (err) {
      console.error("Failed to write order to Firestore:", err);
    }
  }
  saveOrders();
}

async function deleteOrderFromCloud(id: string) {
  if (firestore) {
    try {
      await firestore.collection("orders").doc(id).delete();
    } catch (err) {
      console.error("Failed to delete order from Firestore:", err);
    }
  }
  saveOrders();
}

// 4. PAYMENT METHODS STORAGE SYNC LOGIC
const PAYMENT_METHODS_FILE = path.join(process.cwd(), "payment_methods_persistent.json");

const INITIAL_DEFAULT_PAYMENT_METHODS = [
  {
    id: "pay-1",
    name: "QRIS",
    type: "qris",
    image: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=300&auto=format&fit=crop",
    details: "Pindai kode QRIS untuk melakukan pembayaran instan melalui aplikasi m-banking atau e-wallet (DANA, OVO, GoPay) Anda.",
    isActive: true
  },
  {
    id: "pay-2",
    name: "Bank Account BRI",
    type: "bank",
    image: "",
    details: "Transfer Bank ke BRI Stuck Lounge Rekening: 0122-01-001234-56-7 (a.n. Ivan Siahaan STUCK).",
    isActive: true
  },
  {
    id: "pay-3",
    name: "E-Wallet DANA",
    type: "ewallet",
    image: "",
    details: "Kirim DANA ke nomor e-wallet: 0812-3456-7890 (a.n. Ivan Siahaan STUCK).",
    isActive: true
  }
];

let db_payment_methods: any[] = [];

function loadPaymentMethods() {
  try {
    if (fs.existsSync(PAYMENT_METHODS_FILE)) {
      const data = fs.readFileSync(PAYMENT_METHODS_FILE, "utf-8");
      db_payment_methods = JSON.parse(data);
      if (!db_payment_methods || !db_payment_methods.length) {
        db_payment_methods = [...INITIAL_DEFAULT_PAYMENT_METHODS];
      }
    } else {
      db_payment_methods = [...INITIAL_DEFAULT_PAYMENT_METHODS];
      fs.writeFileSync(PAYMENT_METHODS_FILE, JSON.stringify(db_payment_methods, null, 2), "utf-8");
    }
  } catch (err) {
    db_payment_methods = [...INITIAL_DEFAULT_PAYMENT_METHODS];
  }
}

function savePaymentMethods() {
  try {
    fs.writeFileSync(PAYMENT_METHODS_FILE, JSON.stringify(db_payment_methods, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save payment methods locally:", err);
  }
}

async function loadPaymentMethodsFromCloud() {
  if (firestore) {
    try {
      const snapshot = await firestore.collection("payment_methods").get();
      if (!snapshot.empty) {
        const cloudPM: any[] = [];
        snapshot.forEach(doc => {
          cloudPM.push(doc.data());
        });
        db_payment_methods = cloudPM;
        console.log(`Synced ${db_payment_methods.length} payment methods from Firestore cloud.`);
        return;
      } else {
        console.log("Firestore 'payment_methods' collection is empty. Auto-seeding default payment methods...");
        for (const item of INITIAL_DEFAULT_PAYMENT_METHODS) {
          await firestore.collection("payment_methods").doc(item.id).set(item);
        }
        db_payment_methods = [...INITIAL_DEFAULT_PAYMENT_METHODS];
        savePaymentMethods();
        return;
      }
    } catch (err) {
      console.warn("Could not read payment methods from Firestore, falling back to disk:", err);
    }
  }
  loadPaymentMethods();
}

async function writePaymentMethodToCloud(pm: any) {
  if (firestore) {
    try {
      await firestore.collection("payment_methods").doc(pm.id).set(pm);
    } catch (err) {
      console.error("Failed to write payment method to Firestore:", err);
    }
  }
  savePaymentMethods();
}

async function deletePaymentMethodFromCloud(id: string) {
  if (firestore) {
    try {
      await firestore.collection("payment_methods").doc(id).delete();
    } catch (err) {
      console.error("Failed to delete payment method from Firestore:", err);
    }
  }
  savePaymentMethods();
}

// DYNAMIC BRAND CONFIG (LOGO & TEXT)
const SPECIAL_MENU_FILE = path.join(process.cwd(), "special_menu_persistent.json");

const INITIAL_DEFAULT_SPECIAL_MENU = [
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

let db_special_menu: any[] = [];

function loadSpecialMenu() {
  try {
    if (fs.existsSync(SPECIAL_MENU_FILE)) {
      const data = fs.readFileSync(SPECIAL_MENU_FILE, "utf-8");
      db_special_menu = JSON.parse(data);
      if (!db_special_menu || !db_special_menu.length) {
        db_special_menu = [...INITIAL_DEFAULT_SPECIAL_MENU];
      }
    } else {
      db_special_menu = [...INITIAL_DEFAULT_SPECIAL_MENU];
      fs.writeFileSync(SPECIAL_MENU_FILE, JSON.stringify(db_special_menu, null, 2), "utf-8");
    }
  } catch (err) {
    db_special_menu = [...INITIAL_DEFAULT_SPECIAL_MENU];
  }
}

function saveSpecialMenu() {
  try {
    fs.writeFileSync(SPECIAL_MENU_FILE, JSON.stringify(db_special_menu, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save special menu locally:", err);
  }
}

async function loadSpecialMenuFromCloud() {
  if (firestore) {
    try {
      const snapshot = await firestore.collection("special_menu").get();
      if (!snapshot.empty) {
        const cloudSM: any[] = [];
        snapshot.forEach(doc => {
          cloudSM.push(doc.data());
        });
        db_special_menu = cloudSM;
        console.log(`Synced ${db_special_menu.length} special menu items from Firestore cloud.`);
        return;
      } else {
        console.log("Firestore 'special_menu' collection is empty. Auto-seeding default items...");
        for (const item of INITIAL_DEFAULT_SPECIAL_MENU) {
          await firestore.collection("special_menu").doc(item.id).set(item);
        }
        db_special_menu = [...INITIAL_DEFAULT_SPECIAL_MENU];
        saveSpecialMenu();
        return;
      }
    } catch (err) {
      console.warn("Could not read special menu from Firestore, falling back to disk:", err);
    }
  }
  loadSpecialMenu();
}

async function writeSpecialMenuToCloud(items: any[]) {
  if (firestore) {
    try {
      for (const item of items) {
        await firestore.collection("special_menu").doc(item.id).set(item);
      }
    } catch (err) {
      console.error("Failed to write special menu to Firestore:", err);
    }
  }
  db_special_menu = items;
  saveSpecialMenu();
}

let db_logo = {
  type: "icon" as "icon" | "image",
  image: "", // Base64 or URL
  text: "STUCK COFFEE & CIGAR",
  subtext: "#stuckinmedan"
};

// USER STATUS (MOCK GLOBAL ACTIVE SESSION)
const currentUser = {
  id: "user-current",
  name: "Sandrio Nainggolan",
  email: "sandrionainggolan43@gmail.com",
  phone: "+628123456789",
  role: "buyer",
  membershipLevel: "Member" as any,
  points: 1250,
  totalPurchase: 7850000,
  totalOrdersCount: 16,
  address: "Sudirman Luxury Suites Apt 14B, South Jakarta"
};

let isDataLoaded = false;
async function ensureDataLoaded() {
  if (isDataLoaded) return;
  console.log("Ensuring all data is loaded from Firestore...");
  try {
    await Promise.all([
      loadProductsFromCloud(),
      loadReviewsFromCloud(),
      loadReservationsFromCloud(),
      loadOrdersFromCloud(),
      loadPaymentMethodsFromCloud(),
      loadSpecialMenuFromCloud()
    ]);
    isDataLoaded = true;
    console.log("All data successfully loaded from Firestore.");
  } catch (err) {
    console.error("Critical error loading initial collections from cloud:", err);
  }
}

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    await ensureDataLoaded();
  }
  next();
});

// API ENDPOINTS

// 1. Get products (with filter support)
app.get("/api/products", (req, res) => {
  const { category, type } = req.query;
  let filtered = [...db_products];
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  if (type) {
    filtered = filtered.filter(p => p.subcategory.toLowerCase().includes(String(type).toLowerCase()));
  }
  res.json(filtered);
});

// Admin ADD product
app.post("/api/products", (req, res) => {
  const { name, category, subcategory, price, description, rating, stock, images, details } = req.body;
  const newProduct = {
    id: `prod-${Date.now()}`,
    name,
    category: category || "coffee",
    subcategory: subcategory || "Signature",
    price: Number(price) || 50000,
    description: description || "",
    rating: rating || 5.0,
    stock: Number(stock) || 10,
    status: (Number(stock) > 0) ? ("available" as const) : ("out_of_stock" as const),
    images: images && images.length ? images : ["https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop"],
    details: details || {}
  };
  db_products.push(newProduct);
  writeProductToCloud(newProduct);
  res.status(201).json(newProduct);
});

// Admin EDIT product
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const index = db_products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  const updated = {
    ...db_products[index],
    ...req.body,
    price: Number(req.body.price) || db_products[index].price,
    stock: Number(req.body.stock) !== undefined ? Number(req.body.stock) : db_products[index].stock,
    status: (Number(req.body.stock) > 0) ? "available" as const : "out_of_stock" as const
  };
  db_products[index] = updated;
  writeProductToCloud(updated);
  res.json(updated);
});

// Admin DELETE product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  db_products = db_products.filter(p => p.id !== id);
  deleteProductFromCloud(id);
  res.json({ message: "Product deleted", id });
});

// 2. Reservations (Get & Post)
app.get("/api/reservations", (req, res) => {
  res.json(db_reservations);
});

app.post("/api/reservations", (req, res) => {
  const { customerName, email, phone, date, time, guests, tableArea, notes } = req.body;
  
  const reservationCode = "LOK-RE" + Math.floor(1000 + Math.random() * 9000);
  const newRes = {
    id: `res-${Date.now()}`,
    customerName: customerName || currentUser.name,
    email: email || currentUser.email,
    phone: phone || currentUser.phone,
    date: date || new Date().toISOString().split('T')[0],
    time: time || "18:00",
    guests: Number(guests) || 2,
    tableArea: tableArea || "Lounge Seat",
    notes: notes || "",
    status: "Pending" as const,
    reservationCode,
    createdAt: new Date().toISOString()
  };

  db_reservations.unshift(newRes);
  writeReservationToCloud(newRes);
  res.status(201).json(newRes);
});

app.put("/api/reservations/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Pending, Approved, Cancelled
  const resv = db_reservations.find(r => r.id === id);
  if (!resv) {
    return res.status(404).json({ error: "Reservation not found" });
  }
  resv.status = status;
  writeReservationToCloud(resv);
  res.json(resv);
});

// 3. User Credentials Proxy Profile
app.get("/api/user/profile", (req, res) => {
  res.json(currentUser);
});

app.put("/api/user/profile", (req, res) => {
  const { name, phone, address } = req.body;
  if (name) currentUser.name = name;
  if (phone) currentUser.phone = phone;
  if (address) currentUser.address = address;
  res.json(currentUser);
});

// Dynamic Logo Endpoints
app.get("/api/logo", (req, res) => {
  res.json(db_logo);
});

app.post("/api/logo", (req, res) => {
  const { type, image, text, subtext } = req.body;
  if (type) db_logo.type = type;
  if (image !== undefined) db_logo.image = image;
  if (text !== undefined) db_logo.text = text;
  if (subtext !== undefined) db_logo.subtext = subtext;
  res.json(db_logo);
});

// Dynamic Special Menu Endpoints
app.get("/api/special-menu", (req, res) => {
  res.json(db_special_menu);
});

app.post("/api/special-menu", async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid special menu items format" });
  }
  await writeSpecialMenuToCloud(items);
  res.json({ success: true, items: db_special_menu });
});

// 4. Create Order & Checkout
app.get("/api/orders", (req, res) => {
  res.json(db_orders);
});

app.post("/api/orders", (req, res) => {
  const { items, paymentMethod, voucherCode, address, phone, customerName } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  // Double check calculations
  let subtotal = 0;
  items.forEach((item: any) => {
    subtotal += Number(item.price) * Number(item.quantity);
  });

  // Calculate discount if voucher exists
  let discount = 0;
  if (voucherCode) {
    const voucher = db_vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase());
    if (voucher && subtotal >= voucher.minPurchase) {
      discount = Math.round((subtotal * voucher.discountPercent) / 100);
    }
  }

  const tax = 0; // Stuck does not have tax
  const total = subtotal - discount;
  const pointsEarned = Math.round(subtotal / 1000); // 1 point per 1000 IDR

  // Auto increment user points and total purchase history
  currentUser.points += pointsEarned;
  currentUser.totalPurchase += total;
  currentUser.totalOrdersCount += 1;

  const invoiceNumber = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`;

  const newOrder = {
    id: `ord-${Date.now()}`,
    customerEmail: currentUser.email,
    customerName: customerName || currentUser.name,
    phone: phone || "",
    address: address || currentUser.address,
    items,
    subtotal,
    tax,
    discount,
    total,
    pointsEarned,
    status: "Pending" as const, // initially Pending, paid after simulation gets confirmed
    paymentMethod: paymentMethod || "QRIS",
    voucherCode: voucherCode || "",
    createdAt: new Date().toISOString(),
    invoiceNumber
  };

  db_orders.unshift(newOrder);
  writeOrderToCloud(newOrder);
  res.status(201).json(newOrder);
});

app.put("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = db_orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  order.status = status;
  writeOrderToCloud(order);
  res.json(order);
});

// GET single order details (for real-time status check/success animation polling)
app.get("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const order = db_orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

// DELETE single order (Admin action)
app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const index = db_orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }
  db_orders.splice(index, 1);
  saveOrders();
  deleteOrderFromCloud(id);
  res.json({ message: "Order deleted successfully", id });
});

// GET active custom payment methods
app.get("/api/payment-methods", (req, res) => {
  res.json(db_payment_methods);
});

// POST key to custom payment methods (Admin action)
app.post("/api/payment-methods", (req, res) => {
  const { name, type, image, details, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Payment method name is required" });
  }
  const newPM = {
    id: `pay-${Date.now()}`,
    name,
    type: type || "bank",
    image: image || "",
    details: details || "",
    isActive: isActive !== undefined ? isActive : true
  };
  db_payment_methods.push(newPM);
  writePaymentMethodToCloud(newPM);
  res.status(201).json(newPM);
});

// PUT updates to payment methods (Admin action)
app.put("/api/payment-methods/:id", (req, res) => {
  const { id } = req.params;
  const index = db_payment_methods.findIndex(pm => pm.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Payment method not found" });
  }
  const updated = {
    ...db_payment_methods[index],
    ...req.body
  };
  db_payment_methods[index] = updated;
  writePaymentMethodToCloud(updated);
  res.json(updated);
});

// DELETE obsolete payment methods (Admin action)
app.delete("/api/payment-methods/:id", (req, res) => {
  const { id } = req.params;
  db_payment_methods = db_payment_methods.filter(pm => pm.id !== id);
  deletePaymentMethodFromCloud(id);
  res.json({ message: "Payment method deleted successfully", id });
});

// 5. Apply Voucher
app.post("/api/vouchers/apply", (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: "Voucher code required" });

  const voucher = db_vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
  if (!voucher) {
    return res.status(404).json({ error: "Invalid voucher code" });
  }

  if (Number(subtotal) < voucher.minPurchase) {
    return res.status(400).json({ error: `Minimum purchase of IDR ${voucher.minPurchase.toLocaleString()} required` });
  }

  res.json({
    code: voucher.code,
    discountPercent: voucher.discountPercent,
    description: voucher.description
  });
});

// 6. Get events
app.get("/api/events", (req, res) => {
  res.json(db_events);
});

app.post("/api/events/:id/book", (req, res) => {
  const { id } = req.params;
  const evt = db_events.find(e => e.id === id);
  if (!evt) return res.status(404).json({ error: "Event not found" });

  if (evt.seatsLeft <= 0) {
    return res.status(400).json({ error: "This masterclass is fully booked!" });
  }

  evt.seatsLeft -= 1;
  res.json({ success: true, seatsLeft: evt.seatsLeft });
});

// 7. Get blogs
app.get("/api/blogs", (req, res) => {
  res.json(db_blogs);
});

// 8. Reviews
app.get("/api/reviews", (req, res) => {
  res.json(db_reviews);
});

app.post("/api/reviews", (req, res) => {
  const { productId, productName, rating, comment, customerName, email } = req.body;
  const newRev = {
    id: `rev-${Date.now()}`,
    productId: productId || "general",
    productName: productName || "General Experience",
    customerName: customerName || currentUser.name,
    email: email || currentUser.email,
    rating: Number(rating) || 5,
    comment: comment || "Exquisite",
    status: "approved" as const, // Auto approved for beautiful preview
    date: new Date().toISOString().split('T')[0]
  };
  db_reviews.unshift(newRev);
  writeReviewToCloud(newRev);

  // Update product's average rating slightly
  if (productId) {
    const prod = db_products.find(p => p.id === productId);
    if (prod) {
      prod.rating = Number(((prod.rating + newRev.rating) / 2).toFixed(1));
    }
  }

  res.status(201).json(newRev);
});

// 9. Interactive Live chats & Virtual Sommelier proxying
app.get("/api/chats", (req, res) => {
  res.json(db_chat_rooms);
});

app.post("/api/chats/message", async (req, res) => {
  const { text, type } = req.body;
  if (!text) return res.status(400).json({ error: "Message text is required" });

  const roomId = "chat-user";
  let room = db_chat_rooms.find(r => r.id === roomId);
  if (!room) {
    room = {
      id: roomId,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      lastMessage: text,
      lastUpdated: new Date().toISOString(),
      messages: []
    };
    db_chat_rooms.push(room);
  }

  // 1. Save main user message
  const userMsgId = `msg-${Date.now()}`;
  const userMsg = {
    id: userMsgId,
    sender: "user" as const,
    text,
    timestamp: new Date().toISOString()
  };
  room.messages.push(userMsg);
  room.lastMessage = text;
  room.lastUpdated = new Date().toISOString();

  // If chat is targeting our AI Sommelier or Virtual Assistant
  if (type === "sommelier" || type === "ai") {
    // Call Gemini API
    let aiResponseText = "";
    if (ai) {
      try {
        const systemPrompt = `You are Ivan Siahaan BOT, a highly advanced AI general-purpose companion and expert concierge representing the luxury "Stuck Coffee & Cigar" lounge in Kesawan, Medan Kota, Indonesia.
You function exactly like Gemini: you have absolutely no boundaries on topics. You can write code, explain science, translate text, solve complex math, write stories, tell jokes, and discuss ANY matter of general interest that the user brings up.
You speak and understand ALL languages of the world natively (including Indonesian, English, Javanese, Batak, Mandarin, Spanish, French, Japanese, and any others).
While maintaining your classy, warm, friendly identity as Ivan Siahaan BOT representing Stuck, you must NEVER refuse to answer general-interest questions. Support anything the user wants, in any language they speak. Format your answers elegantly using markdown, bold headers, list items, and clear, structured spacing.`;

        // Gather all user and bot messages for ChatGPT-style multi-turn conversation memory
        const historyMessages = room.messages.filter(m => m.sender === "user" || m.sender === "sommelier");
        const contents: any[] = [];
        for (const m of historyMessages) {
          const role = m.sender === "user" ? "user" : "model";
          if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts[0].text += "\n\n" + m.text;
          } else {
            contents.push({
              role,
              parts: [{ text: m.text }]
            });
          }
        }

        if (contents.length === 0) {
          contents.push({
            role: "user",
            parts: [{ text }]
          });
        }

        const candidateModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
        let genAiResponse = null;
        let lastError = null;

        for (const modelName of candidateModels) {
          try {
            console.log(`Attempting chat generation using model: ${modelName}`);
            const resp = await ai.models.generateContent({
              model: modelName,
              contents: contents,
              config: {
                systemInstruction: systemPrompt,
              },
            });
            if (resp && resp.text) {
              genAiResponse = resp;
              break;
            }
          } catch (err: any) {
            console.warn(`Model ${modelName} encountered an error:`, err.message || err);
            lastError = err;
          }
        }

        if (genAiResponse && genAiResponse.text) {
          aiResponseText = genAiResponse.text;
        } else {
          console.error("All attempted candidate models failed. Final error context:", lastError);
          aiResponseText = "Forgive me, the digital espresso machines are heating up. Let me offer our house advice: For a rich body, pair our *Stuck Obsidian Latte* with the *Davidoff Winston Churchill Late Hour* - the charred single-malt notes blend exquisitely with the woody maple smoke of the latte.";
        }
      } catch (outerError) {
        console.error("Outer Gemini generate try-catch failed:", outerError);
        aiResponseText = "Forgive me, the digital espresso machines are heating up. Let me offer our house advice: For a rich body, pair our *Stuck Obsidian Latte* with the *Davidoff Winston Churchill Late Hour* - the charred single-malt notes blend exquisitely with the woody maple smoke of the latte.";
      }
    } else {
      // Fallback response database (Rule-Based Interactive Concierge)
      const keyword = text.toLowerCase();
      if (keyword.includes("cohiba") || keyword.includes("behike")) {
        aiResponseText = `### The Cohiba Behike 52 Masterclass Pairing
Excellent choice. The **Cohiba Behike 52** is the pinnacle of wrapper leaf selection, introducing deep cedar, warm earth, leather, and complex coffee bean oils. 
        
**Sommelier Pairings:**
- **Our Recommendation:** Pair this with our **Bourbon Cold Brew Reserve** (IDR 58,000). The vanilla wood oak char acquired during the 30-day barrel fermentation intersects flawlessly with the creamy Cuban medio-tiempo layers.
- **Hot Alternative:** A **Stuck Obsidian Latte** (IDR 68,000) highlights caramelized maple notes which soften the leather spice of the wrapper for a velvety smoke.`;
      } else if (keyword.includes("menu") || keyword.includes("recommend") || keyword.includes("pilih") || keyword.includes("rekomendasi")) {
        aiResponseText = `### Chef & Sommelier Recommendations ☕🍂
Greetings, visitor. Here are our absolute finest pairings for today:

1. **The Royal Ascent (The Sweet Connoisseur):**
   - **Coffee:** Stuck Obsidian Latte (IDR 68,000) topped with 24K pure gold leaf.
   - **Pastry:** Flaky French Normandy Butter Croissant (IDR 45,000).
   
2. **The Walnut Room Club (The Peak Cigar Experience):**
   - **Cigar:** Cohiba Behike 52 Grand Reserve (IDR 1,850,000).
   - **Brew:** Cold-brewed Sumatra Gayo Honey aged in toasted Kentucky Bourbon barrels (IDR 58,000).
   
3. **The Morning Bloom (Soft & Delicate):**
   - **Manual Brew:** Ceramic filter pour-over of Panama Geisha Hacienda (IDR 125,000).
   - **Dessert:** Tahitian vanilla Salted Caramel Crème Brûlée (IDR 50,000).`;
      } else if (keyword.includes("reservasi") || keyword.includes("reserve") || keyword.includes("meja") || keyword.includes("booking")) {
        aiResponseText = `### Elite Reservation Assistance 🛎️
We would be delighted to host you. Currently, we offer three main reservation domains:

- **The Main Coffee Bar Lounge (Active, social, aromatic)**
- **The Private Cigar Cellar Room (Silent walnut panels, state-of-the-art ventilation system)**
- **The VIP Terrace Patio (Breathtaking view of Kesawan skyline)**

To lock in your seating, please navigate to our **Reservation Tab** on the bar, pick your date, guests, and table zone. We will instantly issue a digital security code!`;
      } else {
        aiResponseText = `### Welcome to Stuck Coffee & Cigar, ${currentUser.name}! 
I am Ivan Siahaan BOT, your virtual Barista & Cigar specialist. I am here to help you navigate our premium roasted beans, manual artisan extractions, rare imported cigars, and event workshops. 

How may I elevate your senses today?
- Ask me for **pairing recommendations**
- Inquire about our **Cuban cigar humidor selections**
- Learn about **Panama Geisha manual brews**`;
      }
    }

    // 2. Add Sommelier Response inside messages array
    const sommelierMsg = {
      id: `msg-${Date.now()}-sommelier`,
      sender: "sommelier" as const,
      text: aiResponseText,
      timestamp: new Date().toISOString(),
      isAI: true
    };
    room.messages.push(sommelierMsg);
    room.lastMessage = aiResponseText;
  }

  res.status(201).json(room);
});

// Admin response to customer chat
app.post("/api/admin/chats/reply", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Message text required" });

  const room = db_chat_rooms.find(r => r.id === "chat-user");
  if (!room) return res.status(404).json({ error: "No chat room found" });

  const adminMsg = {
    id: `msg-admin-${Date.now()}`,
    sender: "admin" as const,
    text,
    timestamp: new Date().toISOString()
  };
  room.messages.push(adminMsg);
  room.lastMessage = text;
  room.lastUpdated = new Date().toISOString();

  res.json(room);
});

// 10. Admin Metrics (Dashboard chart variables)
app.post("/api/admin/reset-analytics", (req, res) => {
  db_orders = [];
  res.json({ message: "Analytics reset to fresh clean state", success: true });
});

app.get("/api/admin/metrics", (req, res) => {
  // Compute metrics dynamically
  const totalRevenue = db_orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  
  const totalOrders = db_orders.length;
  const pendingReservations = db_reservations.filter(r => r.status === "Pending").length;
  const approvedReservations = db_reservations.filter(r => r.status === "Approved").length;

  res.json({
    analytics: {
      totalRevenue,
      totalOrders,
      pendingReservations,
      approvedReservations,
      activeMembersCount: 0,
      rewardPointsGiven: 0,
      monthlyRevenueData: [
        { name: "Jan", Sales: 0, Orders: 0 },
        { name: "Feb", Sales: 0, Orders: 0 },
        { name: "Mar", Sales: 0, Orders: 0 },
        { name: "Apr", Sales: 0, Orders: 0 },
        { name: "May", Sales: 0, Orders: 0 },
        { name: "Jun", Sales: totalRevenue, Orders: totalOrders }
      ],
      productDistribution: [
        { name: "Signature Coffee", value: 0 },
        { name: "Premium Cigar", value: 0 },
        { name: "Pastry / Food", value: 0 },
        { name: "Non-Coffee Tea", value: 0 }
      ]
    }
  });
});


// FRONTEND EMBED INTEGRATION

async function startServer() {
  // Sync datasets from Firestore if available, otherwise read local storage
  await loadProductsFromCloud();
  await loadReviewsFromCloud();
  await loadReservationsFromCloud();
  await loadOrdersFromCloud();
  await loadPaymentMethodsFromCloud();
  await loadSpecialMenuFromCloud();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite middleware so static/hot resources compile in development
    app.use(vite.middlewares);
  } else {
    // Dist asset serving for production compiled bundle
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Stuck Coffee & Cigar Kesawan Server running beautifully at http://localhost:${PORT}`);
    });
  }
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
