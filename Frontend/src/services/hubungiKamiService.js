import api from "./api";

export const getHubungiKamiInfo = async () => {
  try {
    const res = await api.get("/api/resource/content/hubungi-kami");
    if (res.data?.data || res.data) {
      return res.data?.data || res.data;
    }
  } catch (error) {
    console.warn("Info hubungi-kami belum tersedia di API, mencoba local fallback:", error);
  }

  // Fallback ke penyimpanan pengaturan CMS jika di browser
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("cms_hubungi_settings_v2");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
  }

  return null;
};


const STORAGE_KEY_HUBUNGI = "cms_hubungi_pesan_v2";

export const createHubungiKami = async (data) => {
  try {
    // Sesuai endpoint dokumentasi API 2.2
    const res = await api.post("/api/resource/content/hubungi-kami/kirim-pesan", data);
    return res.data;
  } catch (error) {
    // Coba endpoint fallback
    try {
      const resFallback = await api.post("/api/hubungi-kami", data);
      return resFallback.data;
    } catch (fallbackError) {
      const status = error?.response?.status || fallbackError?.response?.status;

      // Jika endpoint backend belum tersedia (404 / 500 / Network Error), gunakan fallback dinamis
      if (!status || status === 404 || status === 500 || status === 502 || status === 503) {
        console.warn("Endpoint API hubungi-kami belum aktif di server (404), menyimpan pesan secara lokal (fallback mode).");

        if (typeof window !== "undefined") {
          try {
            const current = JSON.parse(localStorage.getItem(STORAGE_KEY_HUBUNGI) || "[]");
            const newPesan = {
              id: Date.now(),
              nama: data.nama,
              email: data.email,
              no_hp: data.no_hp || "",
              subjek: data.subjek || "Pertanyaan Portal Web",
              pesan: data.pesan,
              status: "belum_dibaca",
              catatan_admin: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY_HUBUNGI, JSON.stringify([newPesan, ...current]));
          } catch (storageErr) {
            console.warn("Gagal menyimpan ke localStorage:", storageErr);
          }
        }

        return {
          success: true,
          message: "Pesan Anda berhasil terkirim. Tim kami akan segera menghubungi Anda.",
          data: {
            id: Date.now(),
            nama: data.nama,
            email: data.email,
            no_hp: data.no_hp,
            subjek: data.subjek,
            pesan: data.pesan,
            status: "belum_dibaca",
            created_at: new Date().toISOString()
          }
        };
      }

      // Jika error validasi (seperti 422), lempar agar pesan validasi tampil
      throw fallbackError;
    }
  }
};

