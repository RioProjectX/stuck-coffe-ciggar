import { Product, Review } from "./types";

export const FALLBACK_PRODUCTS: Product[] = [
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
  {
    id: "prod-5",
    name: "Ceremonial Uji Matcha Latte",
    category: "non-coffee",
    subcategory: "Matcha",
    price: 55000,
    description: "Pure stone-ground Japanese ceremonial grade matcha from Uji, whisked slowly with warm single-origin oatmilk and organic raw blossom nectar.",
    rating: 4.9,
    stock: 15,
    status: "available",
    images: ["https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop"],
    details: { origin: "Uji, Kyoto Prefecture", notes: "Uji ceremonial grass, sweet umami, smooth oak milk finish", strength: "Medium" }
  }
];

export const FALLBACK_REVIEWS: Review[] = [];

export interface SpecialMenuItem {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  image: string;
  tag: string;
  tagEn: string;
  desc: string;
  descEn: string;
}

export const FALLBACK_SPECIAL_MENU: SpecialMenuItem[] = [
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
