import api from "./api";

export const getLegalitasList = async () => {
  try {
    const res = await api.get("/api/legalitas/list");
    return res.data?.data || res.data || [];
  } catch (error) {
    console.warn("Gagal memuat daftar legalitas:", error);
    return [];
  }
};

export const getLegalitasDetail = async (key) => {
  try {
    const res = await api.get(`/api/legalitas/detail/${key}`);
    return res.data?.data || res.data || null;
  } catch (error) {
    console.warn(`Gagal memuat detail legalitas (${key}):`, error);
    return null;
  }
};
