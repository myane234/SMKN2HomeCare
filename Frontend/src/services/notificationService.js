import api from "./api";

/**
 * Mengambil daftar notifikasi.
 */
export const getNotifications = async (params = {}) => {
  try {
    const response = await api.get("/api/notifications", {
      params,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

/**
 * Mengambil jumlah notifikasi yang belum dibaca.
 */
export const getUnreadNotificationCount = async (params = {}) => {
  try {
    const response = await api.get(
      "/api/notifications/unread-count",
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching unread notification count:",
      error
    );
    throw error;
  }
};

/**
 * Tandai satu notifikasi sebagai sudah dibaca.
 */
export const markNotificationAsRead = async (
  id,
  params = {}
) => {
  try {
    const response = await api.patch(
      `/api/notifications/${encodeURIComponent(String(id))}/read`,
      null,
      { params }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error marking notification as read:",
      error
    );
    throw error;
  }
};

/**
 * Tandai semua notifikasi pada scope aktif sebagai sudah dibaca.
 */
export const markAllNotificationsAsRead = async (
  params = {}
) => {
  try {
    const response = await api.patch(
      "/api/notifications/read-all",
      null,
      { params }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error marking all notifications as read:",
      error
    );
    throw error;
  }
};

/**
 * Hapus satu notifikasi.
 */
export const deleteNotification = async (
  id,
  params = {}
) => {
  try {
    const response = await api.delete(
      `/api/notifications/${encodeURIComponent(String(id))}`,
      { params }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error deleting notification:",
      error
    );
    throw error;
  }
};