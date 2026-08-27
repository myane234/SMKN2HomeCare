"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiGlobe,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebookF,
  FaTiktok,
  FaYoutube,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";
import api from "@/services/api";
import { getGlobalConfig } from "@/services/configService";
import { resolveImageUrl } from "@/services/resolveImage";

export default function Footer() {
  const [footerData, setFooterData] = useState({
    footer_description: null,
    footer_phone: null,
    footer_email: null,
    footer_address: null,
    footer_logo: null,
    footer_socials: [],
  });

  useEffect(() => {
    async function loadFooterInfo() {
      try {
        const globalCfg = await getGlobalConfig();
        
        let resFooter = null;
        try {
          const res = await api.get("/api/resource/content/footer");
          resFooter = res.data?.data || res.data;
        } catch {
          // Ignore
        }

        setFooterData({
          footer_description: resFooter?.footer_description || null,
          footer_phone: globalCfg?.phone_number || resFooter?.footer_phone || null,
          footer_email: globalCfg?.email || resFooter?.footer_email || null,
          footer_address: globalCfg?.address || resFooter?.footer_address || null,
          footer_logo: globalCfg?.app_logo ? resolveImageUrl(globalCfg.app_logo) : null,
          footer_socials: Array.isArray(globalCfg?.socials) && globalCfg.socials.length > 0
            ? globalCfg.socials
            : (Array.isArray(resFooter?.footer_socials) ? resFooter.footer_socials : []),
        });
      } catch (err) {
        console.error("Gagal memuat konten footer:", err);
      }
    }
    loadFooterInfo();
  }, []);

  const defaultDescription =
    "SmartHomeCare merupakan platform layanan kesehatan yang menghadirkan tenaga kesehatan profesional langsung ke rumah Anda.";
  const defaultPhone = "(021) 1234 5678";
  const defaultEmail = "info@smarthomecare.id";
  const defaultAddress = "Jakarta, Indonesia";

  const description = footerData.footer_description || defaultDescription;
  const phone = footerData.footer_phone || defaultPhone;
  const email = footerData.footer_email || defaultEmail;
  const address = footerData.footer_address || defaultAddress;

  const renderSocialIcon = (item, idx) => {
    const keyStr = `${item.name || ""}_${item.icon || ""}`.toLowerCase();
    let iconEl = <FiGlobe className="text-2xl text-slate-700 transition hover:scale-110" />;

    if (keyStr.includes("facebook")) {
      iconEl = <FaFacebookF className="text-2xl text-blue-600 transition hover:scale-110" />;
    } else if (keyStr.includes("instagram")) {
      iconEl = <FaInstagram className="text-2xl text-pink-600 transition hover:scale-110" />;
    } else if (keyStr.includes("tiktok")) {
      iconEl = <FaTiktok className="text-2xl text-slate-900 transition hover:scale-110" />;
    } else if (keyStr.includes("youtube")) {
      iconEl = <FaYoutube className="text-2xl text-red-600 transition hover:scale-110" />;
    } else if (keyStr.includes("twitter")) {
      iconEl = <FaTwitter className="text-2xl text-sky-500 transition hover:scale-110" />;
    } else if (keyStr.includes("linkedin")) {
      iconEl = <FaLinkedin className="text-2xl text-blue-700 transition hover:scale-110" />;
    }

    return (
      <a
        key={idx}
        href={item.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        title={item.name || "Social Media"}
      >
        {iconEl}
      </a>
    );
  };

  return (
    <footer className="bg-[#CEE2FF] pt-16">
      <div className="mx-auto grid max-w-7xl gap-8 md:gap-12 px-6 pb-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Logo */}
        <div>
          <Image
            src={footerData.footer_logo || "/images/logo/logo.png"}
            alt="SmartHomeCare"
            width={170}
            height={60}
            className="h-14 w-auto object-contain"
          />

          <p className="mt-5 text-gray-600 leading-7">
            {description}
          </p>

          <div className="mt-6 space-y-3 text-gray-700">
            <div className="flex items-center gap-3">
              <FiPhone className="shrink-0" />
              <span>{phone}</span>
            </div>

            <div className="flex items-center gap-3">
              <FiMail className="shrink-0" />
              <span>{email}</span>
            </div>

            <div className="flex items-center gap-3">
              <FiMapPin className="shrink-0" />
              <span>{address}</span>
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
              <Link href="/tentang-kami">Tentang Kami</Link>
            </li>
            <li>
              <Link href="/promo">Promo</Link>
            </li>
            <li>
              <Link href="/artikel">Artikel</Link>
            </li>
          </ul>
        </div>

        {/* Layanan */}
        <div>
          <h3 className="mb-5 text-lg font-bold text-gray-800">
            Layanan
          </h3>

          <ul className="space-y-3 text-gray-600">
            <li>Ibu & Anak</li>
            <li>Perawatan Luka</li>
            <li>Medical Checkup</li>
            <li>Fisioterapi</li>
            <li>Pemasangan Alat Medis</li>
          </ul>
        </div>

        {/* Informasi */}
        <div>
          <h3 className="mb-5 text-lg font-bold text-gray-800">
            Informasi
          </h3>

          <ul className="space-y-3 text-gray-600">
            <li>
              <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
            </li>
            <li>
              <Link href="/syarat-ketentuan">Syarat & Ketentuan</Link>
            </li>
            <li>
              <Link href="/gabung-mitra">Gabung Mitra</Link>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            {footerData.footer_socials.length > 0 ? (
              footerData.footer_socials.map((soc, idx) => renderSocialIcon(soc, idx))
            ) : (
              <>
                <a href="#" title="Instagram">
                  <FaInstagram className="text-2xl text-pink-600 transition hover:scale-110" />
                </a>
                <a href="#" title="Facebook">
                  <FaFacebookF className="text-2xl text-blue-600 transition hover:scale-110" />
                </a>
                <a href="#" title="TikTok">
                  <FaTiktok className="text-2xl transition hover:scale-110" />
                </a>
              </>
            )}
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
