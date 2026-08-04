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
  (await cookies()).delete("auth_token");
  (await cookies()).delete("user_roles");
  (await cookies()).delete("user_nama");
  (await cookies()).delete("is_logged_in");
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