"use server";

import { cookies } from "next/headers";
export async function createSession(responseData) {
  // Cek berbagai kemungkinan struktur response backend
  const data = responseData?.data || responseData;
  const token = data?.token || responseData?.token || data?.access_token || responseData?.access_token;
  const roles = data?.roles || responseData?.roles || data?.user?.roles;
  const nama = data?.nama || data?.user?.nama || responseData?.nama;

  console.log("Token yang ditangkap:", token); // <-- Cek di terminal server apakah tokennya ada

  if (token) {
    (await cookies()).set("auth_token", token, {
      httpOnly: false, // Supaya bisa dibaca document.cookie
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  if (roles) {
    (await cookies()).set("user_roles", JSON.stringify(roles), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, 
    });
  }
  
  if (nama) {
    (await cookies()).set("user_nama", nama, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  
  (await cookies()).set("is_logged_in", "true", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, 
  });
}

export async function removeSession() {
  const cookieStore = await cookies();
  const allCookies = [
    "auth_token", "smarthomecare-session", "is_logged_in", "user_roles", "user_nama", "active_role",
    "user_profile", "profile_avatar", "profile_email", "profile_id_user", "profile_roles",
    "is_profile_complete", "profile_nama", "profile_nik", "profile_golongan_darah",
    "profile_jenis_kelamin", "profile_alamat", "tenaga_medis"
  ];
  allCookies.forEach((name) => {
    try {
      cookieStore.delete(name);
    } catch (e) {}
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  
  const rolesString = cookieStore.get("user_roles")?.value;
  const activeRole = cookieStore.get("active_role")?.value; // 👈 Baca active_role
  const isLoggedIn = cookieStore.get("is_logged_in")?.value === "true";
  const nama = cookieStore.get("user_nama")?.value;
  
  let roles = [];
  if (rolesString) {
    try {
      roles = JSON.parse(rolesString);
    } catch (e) {
      console.error("Failed to parse roles cookie", e);
    }
  }

  // Cek Nakes dari array roles ATAU cookie active_role
  const isNakes = 
    roles.some((r) => r.toLowerCase() === "nakes") || 
    activeRole?.toLowerCase() === "nakes";

  // Cek Pasien dari array roles ATAU cookie active_role
  const isPasien = 
    roles.some((r) => r.toLowerCase() === "pasien") || 
    activeRole?.toLowerCase() === "pasien";

  return {
    isLoggedIn,
    roles,
    activeRole,
    nama,
    isPasien,
    isNakes
  };
}