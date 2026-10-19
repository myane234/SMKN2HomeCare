
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTrash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/services/notificationService";
import {
  normalizeNotification,
  getScopedUnreadCount,
} from "@/components/NotificationBell";

const SCOPE_ROLE = "pasien";

const extractNotificationList = (response) => {
  let rawList = [];

  if (Array.isArray(response)) {
    rawList = response;
  } else if (Array.isArray(response?.data)) {
    rawList = response.data;
  } else if (Array.isArray(response?.data?.data)) {
    rawList = response.data.data;
  } else if (Array.isArray(response?.notifications)) {
    rawList = response.notifications;
  } else if (Array.isArray(response?.data?.notifications)) {
    rawList = response.data.notifications;
  }

  return rawList
    .map((item) => normalizeNotification(item, SCOPE_ROLE))
    .filter(Boolean);
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const showDeleteConfirmation = () =>
  Swal.fire({
    title: "Hapus notifikasi?",
    text: "Notifikasi yang dihapus tidak dapat dikembalikan.",
    icon: "warning",
    width: 420,
    padding: "1.5rem",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
    reverseButtons: true,
    buttonsStyling: false,
    background: "#ffffff",
    customClass: {
      popup: "rounded-3xl border border-slate-100 shadow-2xl",
      icon: "!mt-1",
      title: "!mt-2 !text-[20px] !font-bold !text-slate-900",
      htmlContainer: "!mt-2 !text-[13px] !leading-6 !text-slate-500",
      actions: "!mt-6 !flex !w-full !items-center !justify-center !gap-3",
      confirmButton:
        "!m-0 !rounded-xl !bg-red-500 !px-5 !py-2.5 !text-sm !font-semibold !text-white !shadow-sm hover:!bg-red-600",
      cancelButton:
        "!m-0 !rounded-xl !bg-slate-100 !px-5 !py-2.5 !text-sm !font-semibold !text-slate-700 !shadow-sm hover:!bg-slate-200",
    },
  });

const showDeleteSuccess = () =>
  Swal.fire({
    title: "Notifikasi dihapus",
    text: "Notifikasi telah berhasil dihapus.",
    icon: "success",
    timer: 1500,
    showConfirmButton: false,
    width: 360,
    buttonsStyling: false,
    customClass: {
      popup: "rounded-3xl border border-slate-100 shadow-2xl",
      title: "!mt-2 !text-[17px] !font-bold !text-slate-900",
    },
  });

export default function NotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [readingIds, setReadingIds] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getNotifications({
        per_page: 20,
        role: SCOPE_ROLE,
      });

      const normalized = extractNotificationList(response);

      setNotifications(normalized);
      setUnreadCount(
        getScopedUnreadCount(response, normalized, SCOPE_ROLE)
      );
    } catch (error) {
      console.error("Gagal mengambil daftar notifikasi pasien:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRead = async (event, notification) => {
    event.stopPropagation();

    const id = String(notification.id);
    if (notification.is_read || readingIds.includes(id)) return;

    setReadingIds((current) => [...current, id]);

    try {
      await markNotificationAsRead(notification.id, {
        role: SCOPE_ROLE,
      });

      setNotifications((current) =>
        current.map((item) =>
          String(item.id) === id
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Gagal menandai notifikasi pasien:", error);
    } finally {
      setReadingIds((current) => current.filter((item) => item !== id));
    }
  };

  const handleReadAll = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllNotificationsAsRead({
        role: SCOPE_ROLE,
      });

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Gagal menandai semua notifikasi pasien:", error);
    }
  };

  const handleDelete = async (event, id) => {
    event.stopPropagation();

    const target = notifications.find(
      (item) => String(item.id) === String(id)
    );

    const result = await showDeleteConfirmation();
    if (!result.isConfirmed) return;

    try {
      await deleteNotification(id, {
        role: SCOPE_ROLE,
      });

      setNotifications((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );

      if (target && !target.is_read) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      await showDeleteSuccess();
    } catch (error) {
      console.error("Gagal menghapus notifikasi pasien:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 pt-6">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            <FaArrowLeft size={14} />
          </button>

          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Notifikasi
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              {unreadCount > 0
                ? `${unreadCount} notifikasi belum dibaca`
                : "Semua notifikasi sudah dibaca"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            Memuat notifikasi...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            Belum ada notifikasi.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <FaBell size={15} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                    Semua Notifikasi
                  </h2>
                  <p className="text-xs text-slate-500">
                    {notifications.length} notifikasi
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleReadAll}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:text-sm"
                >
                  <FaCheckDouble size={12} />
                  <span className="hidden sm:inline">Tandai semua dibaca</span>
                  <span className="sm:hidden">Baca semua</span>
                </button>
              )}
            </div>

            {notifications.map((item) => {
              const id = String(item.id);
              const isReading = readingIds.includes(id);

              return (
                <div
                  key={item.id}
                  className={`group flex items-start gap-3 border-b border-slate-100 px-5 py-5 transition last:border-b-0 hover:bg-slate-50 sm:gap-4 sm:px-7 ${
                    item.is_read ? "bg-white" : "bg-blue-50/30"
                  }`}
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <FaBell size={14} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className={`text-sm leading-5 sm:text-[15px] ${
                          item.is_read
                            ? "font-medium text-slate-700"
                            : "font-bold text-slate-900"
                        }`}
                      >
                        {item.title}
                      </h3>

                      {!item.is_read && (
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                      {item.body}
                    </p>

                    <p className="mt-2 text-[11px] text-slate-400 sm:text-xs">
                      {formatDate(item.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    <button
                      type="button"
                      onClick={(event) => handleRead(event, item)}
                      disabled={item.is_read || isReading}
                      title={item.is_read ? "Sudah dibaca" : "Tandai dibaca"}
                      aria-label={item.is_read ? "Sudah dibaca" : "Tandai dibaca"}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                        item.is_read
                          ? "cursor-default text-emerald-500"
                          : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                      } disabled:opacity-70`}
                    >
                      <FaCheck size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={(event) => handleDelete(event, item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 sm:opacity-70 sm:group-hover:opacity-100"
                      aria-label="Hapus notifikasi"
                      title="Hapus notifikasi"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
