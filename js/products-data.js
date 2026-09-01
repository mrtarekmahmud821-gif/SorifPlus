/**
 * Demo Products for SorifPlus
 * Production-এ Firebase থেকে আসবে।
 */

const DEMO_PRODUCTS = [
  {
    id: "p001",
    name: "TP-Link Archer AX55 AX3000 WiFi 6 Router",
    brand: "TP-Link",
    sku: "TL-AX55",
    category: "networking",
    price: 9500,
    salePrice: 8499,
    stock: 25,
    rating: 4.8,
    reviews: 25,
    image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=400&fit=crop",
    description: "AX3000 Dual-Band Wi-Fi 6 Router with 4 Gigabit Ports"
  },
  {
    id: "p002",
    name: "Hikvision 2MP Indoor Dome CCTV Camera",
    brand: "Hikvision",
    sku: "DS-2CE56D0T",
    category: "cctv",
    price: 2200,
    salePrice: 1899,
    stock: 40,
    rating: 4.6,
    reviews: 48,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=400&fit=crop",
    description: "2MP HD Dome Camera with Night Vision"
  },
  {
    id: "p003",
    name: "Kingston 8GB DDR4 2666MHz Desktop RAM",
    brand: "Kingston",
    sku: "KVR26N19S8/8",
    category: "computer",
    price: 2800,
    salePrice: 2450,
    stock: 60,
    rating: 4.9,
    reviews: 112,
    image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&h=400&fit=crop",
    description: "8GB DDR4 Desktop Memory Module"
  },
  {
    id: "p004",
    name: "Samsung 500GB 870 EVO SATA SSD",
    brand: "Samsung",
    sku: "MZ-77E500",
    category: "computer",
    price: 5200,
    salePrice: 4750,
    stock: 35,
    rating: 4.9,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop",
    description: "500GB 2.5\" SATA III SSD"
  },
  {
    id: "p005",
    name: "Logitech M185 Wireless Mouse",
    brand: "Logitech",
    sku: "910-002235",
    category: "computer",
    price: 950,
    salePrice: 799,
    stock: 80,
    rating: 4.5,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    description: "Compact Wireless Mouse with USB Receiver"
  },
  {
    id: "p006",
    name: "HP LaserJet Pro M15w Printer",
    brand: "HP",
    sku: "W2G51A",
    category: "office",
    price: 12500,
    salePrice: 11200,
    stock: 12,
    rating: 4.4,
    reviews: 34,
    image: "https://images.unsplash.com/photo-1612815154858-60aa4d400e87?w=400&h=400&fit=crop",
    description: "Compact Monochrome Laser Printer with WiFi"
  },
  {
    id: "p007",
    name: "TP-Link TL-SG108 8-Port Gigabit Switch",
    brand: "TP-Link",
    sku: "TL-SG108",
    category: "networking",
    price: 2200,
    salePrice: 1950,
    stock: 45,
    rating: 4.7,
    reviews: 67,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop",
    description: "8-Port Gigabit Unmanaged Network Switch"
  },
  {
    id: "p008",
    name: "SanDisk Ultra 128GB USB 3.0 Pendrive",
    brand: "SanDisk",
    sku: "SDCZ48-128G",
    category: "computer",
    price: 1450,
    salePrice: 1199,
    stock: 100,
    rating: 4.6,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1618477388954-63b5e1e5a3d0?w=400&h=400&fit=crop",
    description: "128GB USB 3.0 Flash Drive up to 100MB/s"
  },
  {
    id: "p009",
    name: "Xiaomi 20000mAh Power Bank 18W",
    brand: "Xiaomi",
    sku: "PLM18ZM",
    category: "mobile",
    price: 2800,
    salePrice: 2399,
    stock: 55,
    rating: 4.7,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1609091839311-b9bdbfb63e1d?w=400&h=400&fit=crop",
    description: "20000mAh Dual USB Fast Charging Power Bank"
  },
  {
    id: "p010",
    name: "Tenda AC10 AC1200 Dual Band Router",
    brand: "Tenda",
    sku: "AC10",
    category: "networking",
    price: 3200,
    salePrice: 2799,
    stock: 30,
    rating: 4.3,
    reviews: 41,
    image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=400&fit=crop",
    description: "AC1200 Dual-Band Gigabit WiFi Router"
  },
  {
    id: "p011",
    name: "Dahua 8CH NVR Network Video Recorder",
    brand: "Dahua",
    sku: "NVR4108HS",
    category: "cctv",
    price: 8500,
    salePrice: 7800,
    stock: 15,
    rating: 4.5,
    reviews: 22,
    image: "https://images.unsplash.com/photo-1558002038-6097a7bcdcac?w=400&h=400&fit=crop",
    description: "8 Channel Compact NVR with 4K Support"
  },
  {
    id: "p012",
    name: "JBL Go 3 Portable Bluetooth Speaker",
    brand: "JBL",
    sku: "JBLGO3",
    category: "gadgets",
    price: 4500,
    salePrice: 3999,
    stock: 28,
    rating: 4.8,
    reviews: 95,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    description: "Waterproof Portable Bluetooth Speaker"
  }
];

// Flash sale product IDs
const FLASH_SALE_IDS = ["p001", "p002", "p005", "p009"];

/**
 * Format price in BDT
 */
function formatPrice(amount) {
  return "৳" + amount.toLocaleString("en-BD");
}

/**
 * Calculate discount percentage
 */
function getDiscount(price, salePrice) {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}
