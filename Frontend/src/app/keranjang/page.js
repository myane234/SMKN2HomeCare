"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { resolveImageUrl } from "@/services/resolveImage";

const CART_STORAGE_KEY = "smarthomecare_cart";

function getTextValue(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return "";
}

function getServiceId(service) {
  return getTextValue(service, ["id", "id_layanan", "uuid"]) || getTextValue(service, ["nama_layanan", "nama", "title"]);
}

function formatCurrency(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function loadCartFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gagal membaca keranjang", error);
    return [];
  }
}

function saveCartToStorage(cart) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Gagal menyimpan keranjang", error);
  }
}

export default function KeranjangPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loaded = loadCartFromStorage();
    setCart(loaded);
    setSelectedIds(loaded.map((item) => getServiceId(item.service)));
    setLoading(false);
  }, []);

  const allSelected = cart.length > 0 && selectedIds.length === cart.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cart.map((item) => getServiceId(item.service)));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) => {
      const nextCart = prevCart
        .map((item) =>
          getServiceId(item.service) === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0);
      saveCartToStorage(nextCart);
      return nextCart;
    });
  };

  const removeItem = (id) => {
    setCart((prevCart) => {
      const nextCart = prevCart.filter((item) => getServiceId(item.service) !== id);
      saveCartToStorage(nextCart);
      return nextCart;
    });
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const selectedTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const id = getServiceId(item.service);
      if (!selectedIds.includes(id)) return total;
      const price = Number(getTextValue(item.service, ["harga", "price"])) || 0;
      return total + price * item.qty;
    }, 0);
  }, [cart, selectedIds]);

  const selectedCount = selectedIds.length;

  return (
    <div
      className="min-h-screen bg-slate-50 pb-28"
      style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}
    >
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Keranjang</h1>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Memuat keranjang...
          </div>
        ) : cart.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-500">Keranjang Anda masih kosong.</p>
            <button
              type="button"
              onClick={() => router.push("/layanan")}
              className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Lihat Layanan
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {/* Pilih semua */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-5 w-5 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="font-semibold text-slate-800">
                Pilih Semua <span className="font-normal text-slate-400">({cart.length})</span>
              </span>
            </div>

            {/* Section: layanan */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="font-semibold text-slate-800">SmartHomeCare</span>
              </div>

              <div className="divide-y divide-slate-100">
                {cart.map((item) => {
                  const service = item.service;
                  const id = getServiceId(service);
                  const title = getTextValue(service, ["nama_layanan", "nama", "title"]);
                  const category = getTextValue(service, ["kategori_layanan", "kategori", "category", "nama_kategori"]);
                  const imageUrl = resolveImageUrl(getTextValue(service, ["foto_layanan", "gambar", "foto", "image", "foto_layanan_url", "gambar_url", "foto_url", "image_url"]));
                  const price = Number(getTextValue(service, ["harga", "price"])) || 0;
                  const originalPrice = Number(getTextValue(service, ["harga_asli", "original_price"])) || 0;
                  const hasDiscount = originalPrice > price;
                  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
                  const checked = selectedIds.includes(id);

                  return (
                    <div key={id} className="flex items-start gap-3 px-5 py-5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelectItem(id)}
                        className="mt-2 h-5 w-5 shrink-0 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500"
                      />

                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
                        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                        {hasDiscount ? (
                          <span className="absolute left-0 top-2 rounded-r-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
                            {discountPercent}%
                          </span>
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6 text-slate-800 sm:text-base">{title}</p>
                        <p className="mt-1 text-xs text-slate-400 sm:text-sm">{category}</p>
                      </div>

                      <div className="flex flex-col items-end justify-between self-stretch">
                        <div className="text-right">
                          <p className={`font-bold ${hasDiscount ? "text-rose-500" : "text-slate-900"}`}>
                            {formatCurrency(price)}
                          </p>
                          {hasDiscount ? (
                            <p className="text-xs text-slate-400 line-through">{formatCurrency(originalPrice)}</p>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            aria-label="Simpan ke favorit"
                            className="text-slate-400 transition hover:text-rose-500"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            aria-label="Hapus dari keranjang"
                            onClick={() => removeItem(id)}
                            className="text-slate-400 transition hover:text-rose-500"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                            </svg>
                          </button>
                          <div className="flex items-center rounded-full border border-slate-200">
                            <button
                              type="button"
                              onClick={() => updateQty(id, -1)}
                              className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-slate-800"
                              aria-label="Kurangi jumlah"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-medium text-slate-800">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(id, 1)}
                              className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-slate-800"
                              aria-label="Tambah jumlah"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom checkout bar */}
      {cart.length > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:pb-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-5 w-5 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedTotal)}</p>
              </div>
            </div>

            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() => {
                // Simpan selected items ke localStorage untuk diproses di booking
                const selectedCart = cart.filter(item => selectedIds.includes(getServiceId(item.service)));
                localStorage.setItem("smarthomecare_checkout", JSON.stringify(selectedCart));
                router.push("/booking");
              }}
              className="rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Booking ({selectedCount})
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

