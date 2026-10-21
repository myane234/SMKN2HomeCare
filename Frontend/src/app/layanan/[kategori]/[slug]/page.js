import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import LoginRequiredModal from "@/components/LoginRequiredModal";

import { resolveImageUrl } from "@/services/resolveImage";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://citra.faaruq.com";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, "dan")
    .replace(/\s+/g, "-");
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default async function DetailLayanan({ params, searchParams }) {

  const { kategori, slug } = await params;
  const sParams = await searchParams;
  const showLoginModal = sParams?.showLoginModal === "true";

  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("is_logged_in")?.value === "true";

  const res = await fetch(`${API_URL}/api/layanan`, {
    cache: "no-store",
  });

  if (!res.ok) {
    notFound();
  }

  const json = await res.json();

  const layanan = json.data ?? [];

  const service = layanan.find(
    (item) =>
      slugify(item.kategori_layanan) === kategori &&
      slugify(item.nama_layanan) === slug
  );

  if (!service) {
    notFound();
  }

  return (

    <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 sm:py-12">

      <Link
        href={`/layanan/${kategori}`}
        className="mb-6 inline-flex gap-1 text-sm font-semibold text-sky-600"
      >
{'<'} Kembali
      </Link>

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-sky-700">
          {service.nama_layanan}
        </h1>

        <p className="mt-3 text-gray-600">
          {service.deskripsi_layanan}
        </p>

      </div>

      <div className="grid gap-10 lg:grid-cols-12">

        <div className="lg:col-span-4">

          <Image
            src={resolveImageUrl(service.foto_layanan, service.updated_at)}
            alt={service.nama_layanan}
            width={500}
            height={600}
            className="rounded-3xl object-cover"
            unoptimized
          />

        </div>

        <div className="lg:col-span-8">

          <div className="rounded-3xl bg-slate-100 p-8">

            <div className="flex justify-between">

              <h2 className="text-3xl font-bold">
                Tentang Layanan
              </h2>

              <span className="text-3xl font-bold text-sky-600">
                {formatRupiah(service.harga)}
              </span>

            </div>

            <p className="mt-6 leading-8 text-gray-700">

              {service.deskripsi_layanan}

            </p>

            <hr className="my-8" />

            <h3 className="text-2xl font-bold">
              Durasi
            </h3>

            <p className="mt-2">
              {service.durasi_menit} Menit
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href={isLoggedIn ? "/booking" : "?showLoginModal=true"} className="flex-1">
                <button className="w-full rounded-xl bg-sky-600 py-4 text-lg font-semibold text-white hover:bg-sky-700 cursor-pointer transition">
                  Pesan Sekarang
                </button>
              </Link>
              <Link href="/pesan-laynan" className="flex-1">
                <button className="w-full rounded-xl border border-sky-600 py-4 text-lg font-semibold text-sky-600 hover:bg-sky-50 cursor-pointer transition">
                  Katalog Pesan Layanan
                </button>
              </Link>
            </div>

          </div>

        </div>

      </div>

      <LoginRequiredModal 
        isOpen={showLoginModal} 
        message="Anda perlu login untuk melakukan booking layanan HomeCare."
      />
    </main>
  );
}
