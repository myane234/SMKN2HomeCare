import api from "./api";

export const createHubungiKami = async (data) => {
  try {
    const res = await api.post("/api/hubungi-kami", data);
    return res.data;
  } catch (error) {
    console.error("Gagal mengirim pesan hubungi kami:", error);
    throw error;
  }
};
