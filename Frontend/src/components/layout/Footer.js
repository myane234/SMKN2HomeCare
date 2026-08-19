import Image from "next/image";
import Link from "next/link";
import {
  FiPhone,
  FiMail,
  FiMapPin,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebookF,
  FaTiktok,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#CEE2FF] pt-16">

      <div className="mx-auto grid max-w-7xl gap-8 md:gap-12 px-6 pb-12 sm:grid-cols-2 lg:grid-cols-4">

        {/* Logo */}
        <div>

          <Image
            src="/images/logo/logo.png"
            alt="SmartHomeCare"
            width={170}
            height={60}
          />

          <p className="mt-5 text-gray-600 leading-7">
            SmartHomeCare merupakan platform layanan kesehatan
            yang menghadirkan tenaga kesehatan profesional
            langsung ke rumah Anda.
          </p>

          <div className="mt-6 space-y-3 text-gray-700">

            <div className="flex items-center gap-3">
              <FiPhone />
              <span>(021) 1234 5678</span>
            </div>

            <div className="flex items-center gap-3">
              <FiMail />
              <span>info@smarthomecare.id</span>
            </div>

            <div className="flex items-center gap-3">
              <FiMapPin />
              <span>Jakarta, Indonesia</span>
            </div>

          </div>

        </div>

        {/* Menu */}
        <div>

          <h3 className="mb-5 text-lg font-bold text-gray-800">
            Menu
          </h3>

          <ul className="space-y-3 text-gray-600">

            <li>
              <Link href="/">Beranda</Link>
            </li>

            <li>
              <Link href="/tentang-kami">
                Tentang Kami
              </Link>
            </li>

            <li>
              <Link href="/promo">
                Promo
              </Link>
            </li>

            <li>
              <Link href="/pesan-laynan">
                Pesan Layanan
              </Link>
            </li>

            <li>
              <Link href="/artikel">
                Artikel
              </Link>
            </li>

          </ul>

        </div>

        {/* Layanan */}
        <div>

          <h3 className="mb-5 text-lg font-bold text-gray-800">
            Layanan
          </h3>

          <ul className="space-y-3 text-gray-600">

            <li>
              <Link href="/pesan-laynan?kategori=Home%20Care">Ibu & Anak</Link>
            </li>

            <li>
              <Link href="/pesan-laynan?kategori=Perawatan%20Luka">Perawatan Luka</Link>
            </li>

            <li>
              <Link href="/pesan-laynan?kategori=Kesehatan">Medical Checkup</Link>
            </li>

            <li>
              <Link href="/pesan-laynan?kategori=Fisioterapi">Fisioterapi</Link>
            </li>

            <li>
              <Link href="/pesan-laynan">Semua Layanan</Link>
            </li>

          </ul>

        </div>

        {/* Informasi */}
        <div>

          <h3 className="mb-5 text-lg font-bold text-gray-800">
            Informasi
          </h3>

          <ul className="space-y-3 text-gray-600">

            <li>
              <Link href="/kebijakan-privasi">
                Kebijakan Privasi
              </Link>
            </li>

            <li>
              <Link href="/syarat-ketentuan">
                Syarat & Ketentuan
              </Link>
            </li>

            <li>
              <Link href="/gabung-mitra">
                Gabung Mitra
              </Link>
            </li>

          </ul>

          <div className="mt-8 flex gap-4">

            <a href="#">
              <FaInstagram className="text-2xl text-pink-600 transition hover:scale-110" />
            </a>

            <a href="#">
              <FaFacebookF className="text-2xl text-blue-600 transition hover:scale-110" />
            </a>

            <a href="#">
              <FaTiktok className="text-2xl transition hover:scale-110" />
            </a>

          </div>

        </div>

      </div>

      {/* Copyright */}

      <div className="border-t border-sky-200 py-6 text-center text-gray-600">

        © PT. Citra Solusi Komputama 2026. All Rights Reserved.

      </div>

    </footer>
  );
}