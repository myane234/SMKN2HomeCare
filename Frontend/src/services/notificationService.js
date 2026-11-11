import api from "./api";

const isUnauthorized = (error) => error?.response?.status === 401;

const handleError = (error, message, fallback) => {
  if (isUnauthorized(error)) {
    return fallback;
  }

  console.error(message, error);
  throw error;
};

/**
 * Mengambil daftar notifikasi.
 */
export const getNotifications = async (params = {}) => {
  try {
    const response = await api.get("/api/notifications", { params });
    return response.data;
  } catch (error) {
    return handleError(error, "Error fetching notifications:", {
      success: true,
      message: "",
      data: [],
      unread_count: 0,
    });
  }
};

/**
 * Mengambil jumlah notifikasi yang belum dibaca.
 */
export const getUnreadNotificationCount = async (params = {}) => {
  try {
    const response = await api.get("/api/notifications/unread-count", {
      params,
    });
    return response.data;
  } catch (error) {
    return handleError(error, "Error fetching unread notification count:", {
      success: true,
      unread_count: 0,
      count: 0,
    });
  }
};

/**
 * Tandai satu notifikasi sebagai sudah dibaca.
 */
export const markNotificationAsRead = async (id, params = {}) => {
  try {
    const response = await api.patch(
      `/api/notifications/${encodeURIComponent(String(id))}/read`,
      null,
      { params }
    );
    return response.data;
  } catch (error) {
    return handleError(error, "Error marking notification as read:", {
      success: false,
      message: "Sesi belum login.",
    });
  }
};

/**
 * Tandai semua notifikasi pada scope aktif sebagai sudah dibaca.
 */
export const markAllNotificationsAsRead = async (params = {}) => {
  try {
    const response = await api.patch(
      "/api/notifications/read-all",
      null,
      { params }
    );
    return response.data;
  } catch (error) {
    return handleError(error, "Error marking all notifications as read:", {
      success: false,
      message: "Sesi belum login.",
    });
  }
};

/**
 * Hapus satu notifikasi.
 */
export const deleteNotification = async (id, params = {}) => {
  try {
    const response = await api.delete(
      `/api/notifications/${encodeURIComponent(String(id))}`,
      { params }
    );
    return response.data;
  } catch (error) {
    return handleError(error, "Error deleting notification:", {
      success: false,
      message: "Sesi belum login.",
    });
  }
};