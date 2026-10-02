"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaBell, FaCheckDouble, FaTrash } from "react-icons/fa";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/services/notificationService";
import { normalizeNotification } from "@/components/NotificationBell";

const extractNotificationList = (response) => {
  let list = [];
  if (Array.isArray(response)) list = response;
  else if (Array.isArray(response?.data)) list = response.data;
  else if (Array.isArray(response?.data?.data)) list = response.data.data;
  else if (Array.isArray(response?.notifications)) list = response.notifications;

  return list.map(normalizeNotification).filter(Boolean);
};

const formatDate = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotifikasiPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getNotifications({ per_page: 100 });
      setNotifications(extractNotificationList(response));
    } catch (err) {
      console.error("Gagal mengambil notifications:", err);
      setError("Gagal mengambil notifikasi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setError("");
        const response = await getNotifications({ per_page: 100 });
        if (isMounted) {
          setNotifications(extractNotificationList(response));
        }
      } catch (err) {
        console.error("Gagal mengambil notifications:", err);
        if (isMounted) {
          setError("Gagal mengambil notifikasi.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRead = async (notification) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            String(item.id) === String(notification.id)
              ? { ...item, is_read: true, read_at: new Date().toISOString() }
              : item
          )
        );
      }

      if (notification.action_url) {
        if (notification.action_url.startsWith("/")) {
          router.push(notification.action_url);
        } else {
          window.location.assign(notification.action_url);
        }
      }
    } catch (error) {
      console.error("Gagal membaca notification:", error);
    }
  };

  const handleReadAll = async () => {
    const unread = notifications.some((item) => !item.is_read);
    if (!unread) return;

    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error("Gagal membaca semua notification:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah kamu yakin ingin menghapus notifikasi ini?")) return;

    try {
      await deleteNotification(id);
      setNotifications((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );
    } catch (error) {
      console.error("Gagal menghapus notification:", error);
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Kembali"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
            >
              <FaArrowLeft size={15} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Notifikasi</h1>
              <p className="mt-1 text-sm text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} notifikasi belum dibaca`
                  : "Semua notifikasi sudah dibaca"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-6 md:px-8">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <FaBell size={14} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Semua Notifikasi
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {notifications.length} notifikasi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReadAll}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <FaCheckDouble size={11} />
              <span className="hidden sm:inline">Tandai semua dibaca</span>
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Memuat notifikasi...
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                type="button"
                onClick={fetchNotifications}
                className="mt-4 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                Coba Lagi
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <FaBell />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-800">
                Belum ada notifikasi
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Notifikasi aktivitas kamu akan muncul di sini.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 md:px-6 ${
                    notification.is_read ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleRead(notification)}
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                  >
                    <FaBell size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRead(notification)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-start gap-2">
                      <h3
                        className={`flex-1 text-sm ${
                          notification.is_read ? "font-medium text-gray-600" : "font-semibold text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-700" />
                      )}
                    </div>

                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-600">
                      {notification.body}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(notification.created_at)}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(notification.id)}
                    aria-label="Hapus notifikasi"
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-500"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}