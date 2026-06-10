import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "id";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    "nav.home": "Home",
    "nav.menu": "Coffee & Humidor",
    "nav.reservation": "Reserve Seating",
    "nav.sommelier": "Live Chat Barista",
    "nav.dashboard": "Connoisseur Club",
    "nav.admin": "Login Admin",
    "nav.cart": "Cart",
    "nav.pts": "pts",
    "nav.staffOnly": "Staff only",
    "nav.ptsBal": "Connoisseur Points Balance",

    // Home
    "home.est": "ESTABLISHED IN SOUTH JAKARTA",
    "home.heroTitle1": "Where Great Coffee",
    "home.heroTitle2": "Meets Fine Cigars",
    "home.heroSub": "An ultra-exclusive private member enclave designed for the sensory integration of high-altitude premium coffee roasting and hand-rolled vintage wrapper leaves.",
    "home.btnReserve": "Reserve Private Table",
    "home.btnCatalog": "Explore Our Offerings",
    "home.signatureSeals": "Our Signature Seals",
    "home.signatureSealsSub": "Crafted details defining our meticulous sensory lounge environment",
    "home.bestSellers": "Connoisseur Curated Bestsellers",
    "home.bestSellersSub": "Unrivaled craft pairings frequently ordered by premium members",
    "home.buyNow": "Buy Now",
    "home.cartOrder": "Room Service",
    "home.events": "Active Lounge Masterclasses",
    "home.eventsSub": "Secure private seating for upcoming multi-sensory tasting workshops",
    "home.seatsRemaining": "Seats Remaining",
    "home.seatsLeft": "seats left",
    "home.btnBookMasterclass": "Book Masterclass Seat",
    "home.dispatchTitle": "The Connoisseur Dispatch",
    "home.dispatchSub": "Receive rare harvest invitations, vintage cigar auctions, and Kesawan exclusive events.",
    "home.dispatchPlaceholder": "Enter your corporate email address...",
    "home.dispatchBtn": "Secure Invitation",
    "home.dispatchSuccess": "Invitation Secured! Welcome to our confidential dispatch system. Review your mailbox.",

    // Menu
    "menu.title": "Coffee & Humidor",
    "menu.sub": "Indulge in our rare single-origin harvests and meticulously regulated private humidor reserves.",
    "menu.search": "Search coffee origin, wrapper seed, flavor notes...",
    "menu.sortBy": "Sort by Order",
    "menu.sortDefault": "Default Sequence",
    "menu.sortLowHigh": "Price: Low to High",
    "menu.sortHighLow": "Price: High to Low",
    "menu.sortRating": "Highest Rated",
    "menu.all": "All Reserves",
    "menu.pourOver": "Pour-Over Coffee",
    "menu.espresso": "Espresso Crafts",
    "menu.cigars": "Premium Cigars",
    "menu.pairings": "Luxury Pairings",
    "menu.addToCart": "Include in Room Order",
    "menu.buyDirect": "Express Buy",
    "menu.details": "Examine Cohiba/Crop Specs",
    "menu.origin": "Origin Region",
    "menu.strength": "Sensory Strength",
    "menu.subcategory": "Classification",
    "menu.reviewsHeader": "Member Sensory Reviews",
    "menu.noReviews": "No sensory reviews logged. Be the first classic connoisseur.",
    "menu.writeReview": "Log Guest Sensory Review",
    "menu.commentLabel": "Sensory Tasting Comment",
    "menu.commentPlaceholder": "Explain individual fruit acids, walnut undertones, body density, oils...",
    "menu.ratingLabel": "Score Index",
    "menu.submitReview": "Record Review",
    "menu.reviewSuccess": "Your sensory review has been securely logged on our database in Kesawan, Medan!",
    "menu.close": "Close specifications",

    // Reserve & Dashboard
    "reserve.title": "Reserve Private Seating",
    "reserve.sub": "Submit reservation details to our Concierge Desk.",

    // Sommelier
    "sommelier.title": "Virtual Sommelier",
    "sommelier.sub": "Explore taste parameters with Richard, our accredited pairing assistant. Experience high-end AI recommendations proxy-guided by Gemini tech.",
    "sommelier.chatWelcome": "### Welcome to the Stuck Coffee & Cigar Virtual Humidor Lounge 🛎️\nI am **Richard**, your accredited Coffee and fine Cigar Sommelier. Settle down inside our virtual walnut panels. My job is to pair active sensory details of specific coffee crops with the essential wrapper oils of hand-rolled cigar legends.\n\nHow may I assist you this afternoon? You may type custom queries or select from our curated questions below:",
    "sommelier.curatedQ": "Curated Questions",
    "sommelier.tapSensory": "Tap any sensory coordinate below to send immediate consultation prompts to Richard:",
    "sommelier.inputPlaceholder": "Inquire about body intensity, acid matchings, humidor humidity...",
    "sommelier.send": "Transmit",
    "sommelier.fallback": "### Sensory Intermission ☕🍃\nForgive me. The humidor climate controller needs minor tuning. Let me offer a standard classic match: Savor our **72% Madagascar Dark Chocolate** along with the mild chocolate earthiness of a **Montecristo No. 2 Torpedo**. Let's review details when our database lights reset!",
    "sommelier.preset1.lbl": "Suggest a pairing for Cohiba Behike 52 Grand Reserve",
    "sommelier.preset1.qry": "Can you recommend a premium coffee pour-over pairing for our Cohiba Behike 52 Grand Reserve?",
    "sommelier.preset2.lbl": "Pairings for Panama Geisha single origin",
    "sommelier.preset2.qry": "What imported cigar profile paired against our floral light-roast Panama Geisha manual brew?",
    "sommelier.preset3.lbl": "How to properly warm the humidor wrapper?",
    "sommelier.preset3.qry": "How do I toast the foot of a full-body cigar robusto and what temperature maintains wrappers?",
    "sommelier.preset4.lbl": "Gold Smoked Obsidian Latte matchings",
    "sommelier.preset4.qry": "What cigar wood cuts intersect beautifully with Stuck Coffee & Cigar Obsidian Signature Smoked Latte?",

    // Club
    "club.title": "Connoisseur Club",
    "club.sub": "Manage VIP credentials, private table bookings, and secure elite room ordering.",
    "club.tier": "Membership Tier",
    "club.points": "Club points accumulated",
    "club.benefits": "Your Private Concessions",
    "club.parking": "Complimentary Kesawan elite valet parking",
    "club.priority": "Priority VIP reservation desk with active humidor storage",
    "club.access": "24/7 Unlimited access to private walnut cigar suites",
    "club.consult": "Exclusive monthly physical private consultation with Sommelier",
    "club.bookTitle": "Reserve Private Suite & Table",
    "club.bookSub": "Private rooms, high-volume humidor tables, or leather couch corners in Kesawan, Medan.",
    "club.fDate": "Date",
    "club.fTime": "Time",
    "club.fGuests": "Number of Corporate Guests",
    "club.fGuestsLabel": "Guests",
    "club.fArea": "Preferred Lounge Sanctuary",
    "club.fAreaSelect": "High-Volume Humidor Room (Leather Sofas)",
    "club.fAreaGlass": "Glass Atrium (Acoustic & Garden View)",
    "club.fAreaWhiskey": "Whiskey & Espresso Bar Cellar",
    "club.fAreaPrivate": "VIP Private Boardroom (Silent Space)",
    "club.fPairing": "Sommelier Pairing Session Requested?",
    "club.fPairingYes": "Yes, request physical table service from Richard",
    "club.fPairingNo": "No, standard privacy required",
    "club.fPrefs": "Meticulous Preferences (Allergens, cigar cuts, water brands...)",
    "club.fPrefsPlaceholder": "Ex: Prefers Cohiba pre-cut, double espresso on arrival, room temp water...",
    "club.fSubmit": "Authorize Suite Booking",
    "club.conciergeLine": "Active Concierge Chat",
    "club.conciergeSub": "Secure live feed communication with the executive desk.",
    "club.conciergePlaceholder": "Type message to the Concierge Desk...",
    "club.activeBookings": "Active Reservations Status",
    "club.noBookings": "No active bookings registered under your membership token.",
    "club.bookingRef": "Booking Reference",
    "club.statusPending": "Pending Club Authentication",
    "club.statusApproved": "Approved & Secured",
    "club.ordersHeader": "Historic Room Service Orders",
    "club.noOrders": "No room service orders captured yet. Visit our Coffee & Humidor menu.",
    "club.orderCode": "Order Token",
    "club.totalPrice": "Total Value",
    "club.orderStatus": "Status",
    "club.statusProcessing": "Handcrafting / Regulating",

    // Cart
    "cart.title": "Your Cart",
    "cart.sub": "Review room service selections before dispatching your private server.",
    "cart.empty": "Your order queue is empty. Explore our coffee and cigar reserves.",
    "cart.backToMenu": "Back to Coffee & Humidor Catalog",
    "cart.summary": "Order Summary",
    "cart.subtotal": "Subtotal",
    "cart.voucher": "Voucher Discount",
    "cart.pointsRedeemed": "Points Redeemed",
    "cart.vat": "VAT (11%)",
    "cart.total": "Grand Total",
    "cart.applyVoucher": "Apply Connoisseur Voucher",
    "cart.voucherLabel": "Voucher Code",
    "cart.voucherPlaceholder": "Enter private voucher code...",
    "cart.apply": "Apply",
    "cart.availableCodes": "Available Member Vouchers:",
    "cart.ptsRedeemTitle": "Redeem Club Points",
    "cart.ptsRedeemDesc": "Redeem 300 points for an immediate IDR 50.000 deduction on this order.",
    "cart.ptsInsufficient": "Insufficient Club Points (Needs 300 pts, you have {pts} pts)",
    "cart.ptsRedeemBtn": "Redeem 300 Points",
    "cart.dispatchBtn": "Secure Concierge Room Delivery",

    // Admin
    "admin.title": "Concierge Suite",
    "admin.sub": "Elite admin controls for monitoring Kesawan operations, room bookings, and database products.",
    "admin.overview": "Lounge Financial Overview",
    "admin.grossSales": "Gross Sales Index",
    "admin.reservationsVol": "Reservations Volume",
    "admin.clubGrowth": "Club Growth Index",
    "admin.activeMembers": "Active Members",
    "admin.createProduct": "Enlist New Catalog Item",
    "admin.pName": "Product Name",
    "admin.pCategory": "Category",
    "admin.pPrice": "Price (IDR)",
    "admin.pDesc": "Detailed Sensory Description",
    "admin.pOrigin": "Origin Region (e.g. Cuba, Panama)",
    "admin.pStrength": "Sensory Strength Profile",
    "admin.pSub": "Sub-classification (e.g. Maduro, Geisha)",
    "admin.pImg": "Specification Image URL",
    "admin.pSubmit": "Publish to Catalog Database",
    "admin.guestBookings": "Guest Reservation Control Ledger",
    "admin.noReservations": "No reservations filed in the Kesawan ledger.",
    "admin.approve": "Secured & Approve",
    "admin.terminate": "Terminate Booking",
    "admin.inbox": "Concierge Support Inbox",
    "admin.noChats": "Concierge support channels are currently silent.",
    "admin.replyBtn": "Transmit Reply",

    // Footer
    "footer.intro": "Medan's premium acoustic coffee bar and exclusive humidor cigar lounge. Redefining sensory pairings in Kesawan's historic sanctuary.",
    "footer.directory": "Domain Directory",
    "footer.loungeHome": "Lounge Home",
    "footer.coffeeHumidor": "Coffee & Humidor Catalog",
    "footer.tableRes": "Table Reservations",
    "footer.aiSommelier": "Live Chat Barista",
    "footer.connoisseurClub": "Connoisseur Club Hub",
    "footer.hoursTitle": "Operational Hours",
    "footer.hoursCoffee": "Coffee Bar Brewing:",
    "footer.hoursCigar": "Humidor Cigar Room:",
    "footer.hoursLounge": "Kesawan Lounge Access:",
    "footer.hoursLoungeVal": "24/7 (With VIP Gold Token)",
    "footer.hoursCoffeeVal": "07:00 AM - 11:00 PM",
    "footer.hoursCigarVal": "12:00 PM - Midnight",
    "footer.scbdSanctuary": "Kesawan Sanctuary",
    "footer.sitemap": "Sitemap",
    "footer.terms": "Terms of Concessions",
    "footer.maps": "Google Maps Grounding"
  },
  id: {
    // Navbar
    "nav.home": "Beranda",
    "nav.menu": "Kopi & Humidor",
    "nav.reservation": "Reservasi Tempat",
    "nav.sommelier": "Live Chat Barista",
    "nav.dashboard": "Klub Penikmat",
    "nav.admin": "Login Admin",
    "nav.cart": "Keranjang",
    "nav.pts": "poin",
    "nav.staffOnly": "Hanya Staf",
    "nav.ptsBal": "Saldo Poin Klub Penikmat",

    // Home
    "home.est": "DIDIRIKAN DI JAKARTA SELATAN",
    "home.heroTitle1": "Ketika Kopi Terbaik",
    "home.heroTitle2": "Bertemu Cerutu Pilihan",
    "home.heroSub": "Sebuah tempat pribadi ultra-eksklusif bagi para penikmat, dirancang untuk integrasi sensorik dari pemanggangan kopi premium dataran tinggi dan cerutu legendaris lintingan tangan.",
    "home.btnReserve": "Reservasi Meja Pribadi",
    "home.btnCatalog": "Jelajahi Menu Kami",
    "home.signatureSeals": "Segel Khas Kami",
    "home.signatureSealsSub": "Detail keahlian yang menentukan lingkungan ruang sensorik kami yang teliti",
    "home.bestSellers": "Menu Terlaris Kurator",
    "home.bestSellersSub": "Paduan rasa luar biasa yang paling sering dipesan oleh anggota premium",
    "home.buyNow": "Beli Sekarang",
    "home.cartOrder": "Layanan Kamar",
    "home.events": "Kelas Utama Ruang Lounge",
    "home.eventsSub": "Amankan tempat duduk pribadi untuk lokakarya pencicipan multi-sensori mendatang",
    "home.seatsRemaining": "Tempat Tersisa",
    "home.seatsLeft": "kursi tersisa",
    "home.btnBookMasterclass": "Pesan Kelas Utama",
    "home.dispatchTitle": "Warta Penikmat",
    "home.dispatchSub": "Dapatkan undangan panen langka, lelang cerutu antik, dan acara eksklusif Kesawan.",
    "home.dispatchPlaceholder": "Masukkan email korporat Anda...",
    "home.dispatchBtn": "Amankan Undangan",
    "home.dispatchSuccess": "Undangan Berhasil Diamankan! Selamat datang di sistem pengiriman rahasia kami. Silakan periksa kotak surat Anda.",

    // Menu
    "menu.title": "Kopi & Humidor",
    "menu.sub": "Manjakan diri Anda dengan hasil panen single-origin langka dan koleksi humidor pribadi kami yang diatur secara teliti.",
    "menu.search": "Cari asal kopi, bibit cerutu, catatan rasa...",
    "menu.sortBy": "Urutkan Berdasarkan",
    "menu.sortDefault": "Urutan Standar",
    "menu.sortLowHigh": "Harga: Rendah ke Tinggi",
    "menu.sortHighLow": "Harga: Tinggi ke Rendah",
    "menu.sortRating": "Penilaian Tertinggi",
    "menu.all": "Semua Koleksi",
    "menu.pourOver": "Kopi Manual (Pour-Over)",
    "menu.espresso": "Seni Espresso",
    "menu.cigars": "Cerutu Premium",
    "menu.pairings": "Paduan Kemewahan",
    "menu.addToCart": "Masukkan ke Layanan Kamar",
    "menu.buyDirect": "Beli Cepat",
    "menu.details": "Periksa Spek Cohiba/Kopi",
    "menu.origin": "Kawasan Asal",
    "menu.strength": "Kekuatan Sensorik",
    "menu.subcategory": "Klasifikasi",
    "menu.reviewsHeader": "Ulasan Sensorik Anggota",
    "menu.noReviews": "Belum ada ulasan yang dicatat. Jadilah penikmat pertama yang mengulas.",
    "menu.writeReview": "Tulis Ulasan Sensorik Tamu",
    "menu.commentLabel": "Komentar Pencicipan Sensorik",
    "menu.commentPlaceholder": "Jelaskan keasaman buah, sentuhan rasa walnut, kepadatan rasa, minyak...",
    "menu.ratingLabel": "Skor Indeks",
    "menu.submitReview": "Simpan Ulasan",
    "menu.reviewSuccess": "Ulasan sensorik Anda telah berhasil disimpan di database Kesawan eksekutif kami!",
    "menu.close": "Tutup spesifikasi",

    // Reserve & Dashboard
    "reserve.title": "Reservasi Tempat Duduk Pribadi",
    "reserve.sub": "Kirimkan detail reservasi Anda ke Meja Konserge kami.",

    // Sommelier
    "sommelier.title": "Sommelier Virtual",
    "sommelier.sub": "Jelajahi parameter rasa bersama Richard, asisten pencocokan terakreditasi kami. Alami rekomendasi AI kelas atas yang dipandu oleh teknologi Gemini.",
    "sommelier.chatWelcome": "### Selamat Datang di Virtual Humidor Lounge Stuck Coffee & Cigar 🛎️\nSaya **Richard**, asisten Sommelier Kopi dan Cerutu bersertifikasi Anda. Silakan duduk dengan santai di dalam ruang berlapis kayu Walnut virtual kami. Tugas saya adalah memadukan detail sensorik aktif dari tanaman kopi tertentu dengan minyak pembungkus penting dari cerutu legendaris lintingan tangan.\n\nBagaimana saya bisa membantu Anda siang ini? Anda dapat mengetik pertanyaan khusus atau memilih dari pertanyaan kurasi kami di bawah ini:",
    "sommelier.curatedQ": "Pertanyaan Pilihan",
    "sommelier.tapSensory": "Letakkan koordinat sensorik di bawah ini untuk mengirim perintah konsultasi langsung ke Richard:",
    "sommelier.inputPlaceholder": "Tanyakan tentang intensitas rasa, kecocokan keasaman, kelembapan humidor...",
    "sommelier.send": "Kirim",
    "sommelier.fallback": "### Jeda Sensorik ☕🍃\nMohon dimaafkan. Pengontrol iklim humidor memerlukan sedikit penyesuaian. Izinkan saya menawarkan paduan klasik standar: Nikmati **Cokelat Hitam Madagaskar 72%** kami bersama dengan keharuman cokelat tanah yang lembut dari **Montecristo No. 2 Torpedo**. Mari kita tinjau kembali detailnya saat lampu database kami menyala kembali!",
    "sommelier.preset1.lbl": "Sarankan paduan untuk Cohiba Behike 52 Grand Reserve",
    "sommelier.preset1.qry": "Bisakah Anda merekomendasikan paduan kopi pour-over premium untuk Cohiba Behike 52 Grand Reserve kami?",
    "sommelier.preset2.lbl": "Paduan untuk single origin Panama Geisha",
    "sommelier.preset2.qry": "Profil cerutu impor apa yang cocok dipadukan dengan kopi manual Panama Geisha rasa floral dan ringan kami?",
    "sommelier.preset3.lbl": "Cara menghangatkan lapisan pembungkus cerutu?",
    "sommelier.preset3.qry": "Bagaimana cara memanggang bagian kaki cerutu robusto bercita rasa pekat dan suhu berapa yang menjaga pembungkus?",
    "sommelier.preset4.lbl": "Kombinasi latte asap Obsidian Emas",
    "sommelier.preset4.qry": "Potongan kayu cerutu apa yang berpadu indah dengan Stuck Coffee & Cigar Obsidian Signature Smoked Latte?",

    // Club
    "club.title": "Klub Penikmat",
    "club.sub": "Kelola kredensial VIP, pemesanan meja pribadi, dan pemesanan kamar premium yang aman.",
    "club.tier": "Tingkat Keanggotaan",
    "club.points": "Akumulasi poin klub",
    "club.benefits": "Hak Istimewa Pribadi Anda",
    "club.parking": "Layanan parkir valet eksekutif Kesawan gratis",
    "club.priority": "Meja reservasi VIP prioritas dengan penyimpanan humidor aktif",
    "club.access": "Akses tanpa batas 24/7 ke ruang cerutu kayu walnut pribadi",
    "club.consult": "Konsultasi pribadi fisik bulanan eksklusif dengan Sommelier",
    "club.bookTitle": "Reservasi Suite Pribadi & Meja",
    "club.bookSub": "Kamar pribadi, meja humidor berkapasitas tinggi, atau sudut sofa kulit di Kesawan, Medan.",
    "club.fDate": "Tanggal",
    "club.fTime": "Waktu",
    "club.fGuests": "Jumlah Tamu Perusahaan",
    "club.fGuestsLabel": "Tamu",
    "club.fArea": "Saka Ruang Lounge Utama Pilihan",
    "club.fAreaSelect": "Ruang Humidor Berkapasitas Tinggi (Sofa Kulit)",
    "club.fAreaGlass": "Atrium Kaca (Akustik & Pemandangan Taman)",
    "club.fAreaWhiskey": "Gudang Bar Wiski & Espresso",
    "club.fAreaPrivate": "Ruang Rapat Pribadi VIP (Ruang Sunyi)",
    "club.fPairing": "Sesi Pendampingan Sommelier Diminta?",
    "club.fPairingYes": "Ya, minta layanan meja fisik dari Richard",
    "club.fPairingNo": "Tidak, butuh privasi standar",
    "club.fPrefs": "Preferensi Khusus (Alergi, potongan cerutu, merek air...)",
    "club.fPrefsPlaceholder": "Contoh: Memilih cerutu yang sudah dipotong, double espresso saat tiba, air bersuhu ruangan...",
    "club.fSubmit": "Otorisasi Pemesanan Suite",
    "club.conciergeLine": "Obrolan Konserge Aktif",
    "club.conciergeSub": "Komunikasi langsung yang aman dengan meja eksekutif.",
    "club.conciergePlaceholder": "Ketik pesan ke Meja Konserge...",
    "club.activeBookings": "Status Reservasi Aktif",
    "club.noBookings": "Tidak ada reservasi aktif yang terdaftar di bawah token keanggotaan Anda.",
    "club.bookingRef": "Referensi Reservasi",
    "club.statusPending": "Menunggu Autentikasi Klub",
    "club.statusApproved": "Disetujui & Diaktifkan",
    "club.ordersHeader": "Riwayat Pesanan Layanan Kamar",
    "club.noOrders": "Belum ada pesanan layanan kamar yang tercatat. Kunjungi menu Kopi & Humidor kami.",
    "club.orderCode": "Token Pesanan",
    "club.totalPrice": "Total Nilai",
    "club.orderStatus": "Status",
    "club.statusProcessing": "Dibuat secara Manual / Diatur",

    // Cart
    "cart.title": "Keranjang Anda",
    "cart.sub": "Tinjau pilihan layanan kamar Anda sebelum mengirimkan pelayan pribadi Anda.",
    "cart.empty": "Antrean pesanan Anda kosong. Jelajahi koleksi kopi dan cerutu kami.",
    "cart.backToMenu": "Kembali ke Katalog Kopi & Humidor",
    "cart.summary": "Ringkasan Pesanan",
    "cart.subtotal": "Subtotal",
    "cart.voucher": "Diskon Voucher",
    "cart.pointsRedeemed": "Poin Ditukarkan",
    "cart.vat": "PPN (11%)",
    "cart.total": "Total Akhir",
    "cart.applyVoucher": "Gunakan Voucher Penikmat",
    "cart.voucherLabel": "Kode Voucher",
    "cart.voucherPlaceholder": "Masukkan kode voucher pribadi...",
    "cart.apply": "Gunakan",
    "cart.availableCodes": "Voucher Anggota yang Tersedia:",
    "cart.ptsRedeemTitle": "Tukarkan Poin Klub",
    "cart.ptsRedeemDesc": "Tukarkan 300 poin untuk potongan langsung Rp 50.000 pada pesanan ini.",
    "cart.ptsInsufficient": "Poin Klub Tidak Cukup (Butuh 300 poin, Anda memiliki {pts} poin)",
    "cart.ptsRedeemBtn": "Tukarkan 300 Poin",
    "cart.dispatchBtn": "Amankan Pengiriman Kamar oleh Konserge",

    // Admin
    "admin.title": "Suite Konserge",
    "admin.sub": "Kontrol admin elit untuk memantau operasional Kesawan, pemesanan kamar, dan katalog produk database.",
    "admin.overview": "Ikhtisar Keuangan Lounge",
    "admin.grossSales": "Indeks Penjualan Kotor",
    "admin.reservationsVol": "Volume Reservasi",
    "admin.clubGrowth": "Indeks Pertumbuhan Klub",
    "admin.activeMembers": "Anggota Aktif",
    "admin.createProduct": "Daftarkan Item Katalog Baru",
    "admin.pName": "Nama Produk",
    "admin.pCategory": "Kategori",
    "admin.pPrice": "Harga (IDR)",
    "admin.pDesc": "Deskripsi Sensorik Detail",
    "admin.pOrigin": "Kawasan Asal (misal: Kuba, Panama)",
    "admin.pStrength": "Profil Kekuatan Sensorik",
    "admin.pSub": "Sub-klasifikasi (misal: Maduro, Geisha)",
    "admin.pImg": "URL Gambar Spesifikasi",
    "admin.pSubmit": "Publikasikan ke Database Katalog",
    "admin.guestBookings": "Ledger Kontrol Reservasi Tamu",
    "admin.noReservations": "Tidak ada reservasi yang tercatat di ledger Kesawan.",
    "admin.approve": "Setujui & Amankan",
    "admin.terminate": "Batalkan Reservasi",
    "admin.inbox": "Kotak Masuk Dukungan Konserge",
    "admin.noChats": "Saluran dukungan konserge saat ini sedang sunyi.",
    "admin.replyBtn": "Kirim Balasan",

    // Footer
    "footer.intro": "Bar kopi akustik premium dan lounge cerutu humidor eksklusif di Kesawan, Medan. Mendefinisikan kembali perpaduan sensorik di suaka eksekutif Kesawan.",
    "footer.directory": "Direktori Domain",
    "footer.loungeHome": "Beranda Lounge",
    "footer.coffeeHumidor": "Katalog Kopi & Cerutu",
    "footer.tableRes": "Reservasi Meja",
    "footer.aiSommelier": "Live Chat Barista",
    "footer.connoisseurClub": "Pusat Klub Penikmat",
    "footer.hoursTitle": "Jam Operasional",
    "footer.hoursCoffee": "Penyeduhan Bar Kopi:",
    "footer.hoursCigar": "Ruang Cerutu Humidor:",
    "footer.hoursLounge": "Akses Lounge Kesawan:",
    "footer.hoursLoungeVal": "24/7 (Dengan Token Emas VIP)",
    "footer.hoursCoffeeVal": "07:00 AM - 11:00 PM",
    "footer.hoursCigarVal": "12:00 PM - Tengah Malam",
    "footer.scbdSanctuary": "Suaka Kesawan",
    "footer.sitemap": "Peta Situs",
    "footer.terms": "Ketentuan Konsesi",
    "footer.maps": "Sistem Peta Google"
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("stuck_lang") as Language;
    if (saved === "en" || saved === "id") return saved;
    return "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("stuck_lang", newLang);
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    let text = translations[lang]?.[key] || translations["en"]?.[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
