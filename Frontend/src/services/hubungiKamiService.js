import axios from "axios";
import api from "./api";

// Gunakan relative request saat di browser agar memanggil API App Router Next.js secara langsung
const getClient = () => {
  if (typeof window !== "undefined") {
    return axios.create({ baseURL: "" });
  }
  return api;
};

export const getHubungiKamiInfo = async () => {
  const client = getClient();
  try {
    const res = await client.get("/api/resource/content/hubungi-kami");
    if (res.data?.data || res.data) {
      return res.data?.data || res.data;
    }
  } catch (error) {
    console.warn("Info hubungi-kami belum tersedia di API lokal, mencoba remote fallback:", error);
    try {
      const resRemote = await api.get("/api/resource/content/hubungi-kami");
      return resRemote.data?.data || resRemote.data;
    } catch {}
  }
  return null;
};

export const createHubungiKami = async (data) => {
  const client = getClient();
  try {
    // Panggil endpoint API resmi
    const res = await client.post("/api/resource/content/hubungi-kami/kirim-pesan", data);
    return res.data;
  } catch (error) {
    try {
      const resRemote = await api.post("/api/resource/content/hubungi-kami/kirim-pesan", data);
      return resRemote.data;
    } catch (fallbackError) {
      console.error("Gagal mengirim pesan hubungi kami:", fallbackError);
      throw fallbackError;
    }
  }
};
