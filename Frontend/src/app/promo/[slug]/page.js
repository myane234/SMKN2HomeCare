import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineHome,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { FiCheckCircle } from "react-icons/fi";
import { getActivePromosSSR, generatePromoSlug, getTextValue } from "@/services/promoService";
import { resolveImageUrl } from "@/services/resolveImage";
import { cookies } from "next/headers";
import LoginRequiredModal from "@/components/LoginRequiredModal";

export default async function PromoDetail({ params, searchParams }) {
  const { slug } = await params;
  const sParams = await searchParams;
  const showLoginModal = sParams?.showLoginModal === "true";
  
  const promos = await getActivePromosSSR();

  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("is_logged_in")?.value === "true";

  
 // Cari promo berdasarkan slug, id_promo, atau id
  const promo = promos.find((item) => {
    // Sesuaikan pencarian nama ke relasi layanan.nama_layanan
    const name = item.layanan?.nama_layanan || getTextValue(item, ["nama", "title", "judul"]);
    const itemSlug = generatePromoSlug(name);
    const id = getTextValue(item, ["id_promo", "id"]);
    return itemSlug === String(slug) || id === String(slug);
  });

  if (!promo) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold text-slate-800">Promo Tidak Ditemukan</h1>
        <p className="mt-2 text-slate-500">Promo yang Anda cari mungkin sudah tidak berlaku atau dihapus.</p>
        <Link href="/promo" className="mt-6 inline-block font-semibold text-sky-600 hover:underline">
          ← Kembali ke Promo
        </Link>
      </main>
    );
  }
  const handlePesanPromoClick = () => {
    if (!isLoggedIn) {
      router.push(`/promo/${slug}?showLoginModal=true`);
      return;
    }

    const checkoutData = [
      {
        service: {
          id_layanan: promo.layanan?.id_layanan || promo.id_layanan,
          nama_layanan: promo.layanan?.nama_layanan || name,
          harga: promo.layanan?.harga || 0,
        },
        qty: 1
      }
    ];

    localStorage.setItem("smarthomecare_checkout", JSON.stringify(checkoutData));
    localStorage.setItem("selected_promo_id", promo.id_promo);
    router.push("/booking");
  };

 // Ambil nama dari relasi layanan.nama_layanan
  const name = promo.layanan?.nama_layanan || getTextValue(promo, ["nama", "title", "judul"]) || "Promo Layanan";
  const rawImage = getTextValue(promo, ["gambar_promo_url", "gambar_promo", "gambar", "image", "foto"]);
  const image = resolveImageUrl(rawImage);
  
  const expiredDate = new Date(
    getTextValue(promo, ["tanggal_berakhir", "expired_at", "end_date"])
  ).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 sm:py-14">
      <Link href="/promo" className="text-sky-600 hover:text-sky-700 font-medium">
        ← Kembali ke Promo
      </Link>

      <div className="mt-8">
        <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700">
          PROMO SMARTHOMECARE
        </span>
        <h1 className="mt-4 sm:mt-5 text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
          {name}
        </h1>
        <p className="mt-4 sm:mt-5 max-w-3xl text-base sm:text-lg leading-7 sm:leading-8 text-slate-500">
          {promo.deskripsi}
        </p>
      </div>

      <section className="mt-8 sm:mt-14 grid gap-6 lg:gap-10 lg:grid-cols-12">
        {/* LEFT */}
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm relative h-64 sm:h-96 lg:h-[500px] w-full">
            <img
              src={image}
              alt={name || "Gambar Promo"}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
        {/* Ganti diskon_persen dengan tipe_diskon & nilai_diskon */}
            {promo.tipe_diskon && (
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                Hemat {promo.tipe_diskon === "persen" ? `${Number(promo.nilai_diskon)}%` : formatCurrency(promo.nilai_diskon)}
              </span>
            )}

            <div className="mt-6 sm:mt-8">
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-sky-700">
                Layanan Termasuk
              </h2>
              {/* Karena API baru mengembalikan objek tunggal 'layanan', kita render langsung */}
              {promo.layanan && (
                <div className="mt-4 flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500" /> 
                  <span className="text-slate-600 font-medium">{promo.layanan.nama_layanan}</span>
                </div>
              )}
            </div>

            <div className="my-8 h-px bg-slate-200" />

            <div className="space-y-7">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">
                  <HiOutlineHome className="text-2xl text-sky-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Home Visit</h3>
                  <p className="text-sm text-slate-500">Layanan dilakukan langsung di rumah pasien.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">
                  <HiOutlineCalendarDays className="text-2xl text-sky-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Berlaku Sampai</h3>
                  <p className="text-sm text-slate-500">{expiredDate || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">
                  <HiOutlineShieldCheck className="text-2xl text-sky-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Terjamin Aman</h3>
                  <p className="text-sm text-slate-500">Ditangani oleh tenaga kesehatan profesional sesuai SOP.</p>
                </div>
              </div>
            </div>

 {isLoggedIn ? (
              <Link href={`/booking?id_promo=${promo.id_promo}&id_layanan=${promo.layanan?.id_layanan || promo.id_layanan}`}>
                <button 
                  type="button"
                  className="mt-10 w-full rounded-2xl bg-sky-600 py-4 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-sky-700 hover:shadow-lg cursor-pointer"
                >
                  Pesan Sekarang
                </button>
              </Link>
            ) : (
              <Link href={`/promo/${slug}?showLoginModal=true`}>
                <button 
                  type="button"
                  className="mt-10 w-full rounded-2xl bg-sky-600 py-4 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-sky-700 hover:shadow-lg cursor-pointer"
                >
                  Pesan Sekarang
                </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Promo Lainnya */}
      <section className="mt-20 mb-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-sky-600">
              Promo Lainnya
            </span>
            <h2 className="mt-2 sm:mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
              Mungkin Anda Juga Tertarik
            </h2>
          </div>
          <Link href="/promo" className="font-semibold text-sky-600 hover:underline">
            Lihat Semua →
          </Link>
        </div>

        <div className="mt-6 sm:mt-10 grid gap-6 md:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {promos
            .filter((item) => getTextValue(item, ["id_promo", "id"]) !== getTextValue(promo, ["id_promo", "id"]))
            .slice(0, 3)
            .map((item, idx) => {
              const itemName = getTextValue(item, ["nama_paket", "nama", "title", "judul"]);
              const itemSlug = generatePromoSlug(itemName);
              const itemImg = resolveImageUrl(getTextValue(item, ["gambar_promo", "gambar", "image", "foto"]));

              return (
                <Link
                  key={getTextValue(item, ["id_promo", "id"]) || idx}
                  href={`/promo/${itemSlug || idx}`}
                  className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="relative h-56 w-full">
                    <img
                      src={itemImg}
                      alt={itemName}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    {item.diskon_persen && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        Hemat {Number(item.diskon_persen)}%
                      </span>
                    )}
                    <h3 className="mt-5 text-2xl font-bold text-slate-800">
                      {itemName}
                    </h3>
                    <p className="mt-3 line-clamp-2 leading-7 text-slate-500">
                      {item.deskripsi}
                    </p>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>

      <LoginRequiredModal 
        isOpen={showLoginModal} 
        message="Anda perlu login untuk melakukan booking layanan HomeCare."
      />
    </main>
  );
}