'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  description: string;
  badge?: string;
  color: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Aura Studio Wireless Headphones',
    category: 'Audio',
    price: 249,
    rating: 4.8,
    description: 'Active noise cancellation with custom 40mm beryllium drivers and 30-hour battery life.',
    badge: 'Best Seller',
    color: 'from-blue-500/20 to-indigo-500/10',
  },
  {
    id: 2,
    name: 'Precision Mechanical Keyboard',
    category: 'Workstation',
    price: 189,
    rating: 4.9,
    description: 'Hot-swappable tactile switches with CNC anodized aluminum case and PBT dye-sub keycaps.',
    badge: 'Popular',
    color: 'from-amber-500/20 to-orange-500/10',
  },
  {
    id: 3,
    name: 'Lumio 4K Ergonomic Display',
    category: 'Displays',
    price: 599,
    rating: 4.7,
    description: 'Ultra-thin bezel IPS panel with 99% DCI-P3 color accuracy and 90W USB-C power delivery.',
    color: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    id: 4,
    name: 'Veloce Ultra-light Gaming Mouse',
    category: 'Accessories',
    price: 89,
    rating: 4.6,
    description: 'Sub-55g honeycomb chassis with 26K DPI optical sensor and PTFE glide skates.',
    badge: 'New',
    color: 'from-purple-500/20 to-pink-500/10',
  },
  {
    id: 5,
    name: 'Titanium Smartwatch Pro',
    category: 'Wearables',
    price: 349,
    rating: 4.8,
    description: 'Sapphire crystal display with dual-band GPS, advanced ECG sensor, and 7-day battery.',
    color: 'from-rose-500/20 to-red-500/10',
  },
  {
    id: 6,
    name: 'DeskMat Leather Minimalist',
    category: 'Workstation',
    price: 49,
    rating: 4.5,
    description: 'Full-grain vegetable-tanned leather desk protector with water-resistant coating.',
    color: 'from-stone-500/20 to-zinc-500/10',
  },
];

export default function DemoPage() {
  const [cartCount, setCartCount] = useState<number>(0);
  const [lastClickedItem, setLastClickedItem] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>('Detecting...');
  const [notification, setNotification] = useState<string | null>(null);

  const backendApiUrl = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/events` 
    : 'http://localhost:5001/api/events';
  const trackerScriptUrl = process.env.NEXT_PUBLIC_TRACKER_URL || 'http://localhost:5001/tracker.js';

  // Read session ID from localStorage populated by tracker.js
  useEffect(() => {
    const checkSession = () => {
      try {
        const sid = localStorage.getItem('cf_session_id');
        if (sid) {
          setCurrentSessionId(sid);
        }
      } catch {
        setCurrentSessionId('Unavailable (Storage restricted)');
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (productName: string) => {
    setCartCount((prev) => prev + 1);
    setLastClickedItem(productName);
    setNotification(`Added "${productName}" to shopping bag!`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-stone-50/50 text-gray-900">
      {/* 
        Standalone Tracking SDK Script tag.
        This runs completely independently of React's render lifecycle.
      */}
      <Script
        id="cf-analytics-tracker"
        src={trackerScriptUrl}
        data-api-url={backendApiUrl}
        strategy="afterInteractive"
      />

      {/* Floating Demo Testing Inspector Bar */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2.5 text-xs shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">SDK Testing Surface</span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <div className="text-slate-300">
              Session ID:{' '}
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-medium">
                {currentSessionId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400 hidden md:inline">
              Every click & view is tracked to MongoDB
            </span>
            <Link
              href="/dashboard"
              className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1 rounded font-medium transition-colors"
            >
              Open Dashboard →
            </Link>
          </div>
        </div>
      </div>

      {/* Top Banner Alert when adding to cart */}
      {notification && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-medium animate-bounce">
          {notification}
        </div>
      )}

      {/* Store Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/demo" className="text-xl font-bold tracking-tight text-gray-950 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-black text-sm">
                CF
              </span>
              <span>LUMEN STORE</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#products" className="hover:text-gray-950 transition-colors">
                Featured
              </a>
              <a href="#categories" className="hover:text-gray-950 transition-colors">
                Categories
              </a>
              <a href="#about" className="hover:text-gray-950 transition-colors">
                Our Story
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="cart-button"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => handleAddToCart('Shopping Cart View')}
              aria-label="View Shopping Cart"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-700 text-xs font-semibold uppercase tracking-wider">
              Winter Collection 2026
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-950 leading-tight">
              Hardware designed for deep focus & craftsmanship.
            </h1>
            <p className="text-base text-gray-600 max-w-lg leading-relaxed">
              Explore meticulously curated workplace accessories, high-fidelity acoustics, and displays calibrated for high-output developers.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                id="hero-shop-now"
                href="#products"
                className="bg-gray-950 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-sm"
              >
                Shop Collection
              </a>
              <button
                id="hero-watch-keynote"
                onClick={() => handleAddToCart('Watch Keynote Action')}
                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium text-sm transition-all"
              >
                Watch 2026 Keynote
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-brand-600/10 via-brand-500/5 to-slate-200 border border-gray-200 flex flex-col items-center justify-center p-8 text-center shadow-inner">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-4 text-brand-600">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Audiophile Studio Reference</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Zero distortion, continuous spatial audio calibration.
              </p>
              <button
                id="hero-featured-product-cta"
                onClick={() => handleAddToCart('Featured Studio Reference')}
                className="mt-6 text-xs font-semibold text-brand-600 bg-white border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors shadow-sm"
              >
                View Specifications ($399)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <section id="products" className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-950">Curated Workstation Hardware</h2>
            <p className="text-sm text-gray-500 mt-1">
              Click buttons and cards to trigger tracking events with live coordinate logging.
            </p>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            {lastClickedItem ? `Last click target: ${lastClickedItem}` : 'Ready for interactions'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all hover:shadow-sm flex flex-col"
            >
              <div className={`h-48 bg-gradient-to-br ${product.color} p-6 flex flex-col justify-between relative`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-gray-600 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    {product.category}
                  </span>
                  {product.badge && (
                    <span className="text-[11px] font-semibold text-brand-800 bg-brand-100 px-2 py-0.5 rounded-full">
                      {product.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <span className="text-sm font-semibold tracking-wide text-gray-700 bg-white/90 backdrop-blur px-4 py-1.5 rounded-lg shadow-sm">
                    {product.name}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                    <span className="font-bold text-gray-950 text-base">${product.price}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                  <button
                    id={`add-to-cart-${product.id}`}
                    onClick={() => handleAddToCart(product.name)}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium py-2.5 px-4 rounded-xl transition-colors text-center"
                  >
                    Add to Cart
                  </button>
                  <button
                    id={`details-${product.id}`}
                    onClick={() => handleAddToCart(`${product.name} Details`)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-2.5 px-3 rounded-xl transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-gray-500 space-y-3">
          <p className="font-semibold text-gray-800">CausalFunnel Analytics Demo Storefront</p>
          <p>
            This demo page loads the standalone <code className="bg-gray-100 px-1 py-0.5 rounded">tracker.js</code> SDK.
            All client interactions, mouse clicks, and session movements are dispatched asynchronously to MongoDB.
          </p>
          <div className="pt-2">
            <Link href="/dashboard" className="text-brand-600 hover:underline font-medium">
              View Analytics Dashboard →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
