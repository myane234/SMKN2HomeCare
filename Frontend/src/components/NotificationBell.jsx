"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaBell, FaCheckDouble, FaTrash } from "react-icons/fa";
import { getWebSocketConfig } from "@/services/bookingService";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/services/notificationService";

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.substring(prefix.length)) : null;
};

const getUserId = () => {
  const profileId = getCookie("profile_id_user");
  if (profileId) return String(profileId).trim();

  const userProfile = getCookie("user_profile");
  if (userProfile) {
    try {
      const parsed = JSON.parse(userProfile);
      const id =
        parsed?.id_user ??
        parsed?.user_id ??
        parsed?.id ??
        parsed?.user?.id_user ??
        parsed?.user?.id;
      if (id) return String(id).trim();
    } catch (error) {
      console.warn("Gagal membaca user_profile:", error);
    }
  }
  return null;
};

const getUserRole = () => {
  const activeRole = getCookie("active_role");
  if (activeRole) return activeRole.toLowerCase();

  const rolesString = getCookie("user_roles");
  if (rolesString) {
    try {
      const roles = JSON.parse(rolesString);
      if (Array.isArray(roles) && roles.length > 0) {
        const pasienRole = roles.find(
          (role) => String(role).toLowerCase() === "pasien"
        );
        if (pasienRole) return "pasien";
        return String(roles[0]).toLowerCase();
      }
    } catch (error) {
      console.warn("Gagal membaca user_roles:", error);
    }
  }
  return null;
};

export const normalizeNotification = (payload) => {
  if (!payload) return null;
  const raw =
    payload?.notification ||
    payload?.data?.notification ||
    payload?.data ||
    payload;

  if (!raw || typeof raw !== "object") return null;

  const notification = {
    id: raw.id ?? raw.notification_id,
    title: raw.title ?? raw.data?.title,
    body: raw.body ?? raw.message ?? raw.data?.body,
    action_url: raw.action_url ?? raw.url ?? raw.data?.action_url ?? null,
    data: raw.data ?? null,
    is_read: Boolean(raw.is_read),
    read_at: raw.read_at ?? null,
    created_at: raw.created_at ?? raw.timestamp ?? new Date().toISOString(),
  };

  if (!notification.id || !notification.title) return null;
  return notification;
};

const extractNotificationList = (response) => {
  let list = [];
  if (Array.isArray(response)) list = response;
  else if (Array.isArray(response?.data)) list = response.data;
  else if (Array.isArray(response?.data?.data)) list = response.data.data;
  else if (Array.isArray(response?.notifications)) list = response.notifications;

  return list.map(normalizeNotification).filter(Boolean);
};

const extractUnreadCount = (response) => {
  if (typeof response === "number") return response;
  if (typeof response?.unread_count === "number") return response.unread_count;
  if (typeof response?.count === "number") return response.count;
  if (typeof response?.data === "number") return response.data;
  if (typeof response?.data?.unread_count === "number") return response.data.unread_count;
  if (typeof response?.data?.count === "number") return response.data.count;
  return 0;
};

const formatRelativeTime = (date) => {
  if (!date) return "";
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return "";
  const diff = Date.now() - time;

  if (diff < 60000) return "Baru saja";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;

  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function NotificationBell() {
  const router = useRouter();
  const wrapperRef = useRef(null);
  const socketRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNotifications({ per_page: 5 });
      setNotifications(extractNotificationList(response));
    } catch (error) {
      console.error("Gagal mengambil notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    // Fetch unread count terisolasi di dalam useEffect
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadNotificationCount();
        if (!isCancelled) {
          setUnreadCount(extractUnreadCount(response));
        }
      } catch (error) {
        console.error("Gagal mengambil unread notification count:", error);
      }
    };

    fetchUnreadCount();

    const connectRealtime = async () => {
      if (typeof window === "undefined") return;

      const userId = getUserId();
      const userRole = getUserRole();

      if (!userId || !userRole) return;

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      try {
        const wsConfig = await getWebSocketConfig();
        if (isCancelled) return;

        let wsUrl = wsConfig?.data?.url || wsConfig?.url || "";
        if (!wsUrl) return;

        const separator = wsUrl.includes("?") ? "&" : "?";
        if (!wsUrl.includes("user_id=")) {
          wsUrl += `${separator}user_id=${encodeURIComponent(userId)}`;
        }
        if (!wsUrl.includes("user_role=")) {
          wsUrl += `&user_role=${encodeURIComponent(userRole)}`;
        }

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onmessage = (event) => {
          if (isCancelled) return;
          try {
            const payload = JSON.parse(event.data);
            const notification = normalizeNotification(payload);
            if (!notification) return;

            setNotifications((current) => {
              const exists = current.some(
                (item) => String(item.id) === String(notification.id)
              );
              if (exists) return current;
              return [notification, ...current].slice(0, 5);
            });

            if (!notification.is_read) {
              setUnreadCount((current) => current + 1);
            }
          } catch (error) {
            console.error("Gagal membaca WS notification:", error);
          }
        };

        socket.onclose = () => {
          if (socketRef.current === socket) {
            socketRef.current = null;
          }
        };
      } catch (error) {
        console.error("Gagal menghubungkan WebSocket notification:", error);
      }
    };

    connectRealtime();

    return () => {
      isCancelled = true;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
    }
  };

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
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      if (notification.action_url) {
        if (notification.action_url.startsWith("/")) {
          router.push(notification.action_url);
        } else {
          window.location.assign(notification.action_url);
        }
      } else {
        router.push("/notifikasi");
      }
      setOpen(false);
    } catch (error) {
      console.error("Gagal menandai notification:", error);
    }
  };

  const handleReadAll = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Gagal menandai semua notification:", error);
    }
  };

  const handleDelete = async (event, id) => {
    event.stopPropagation();
    try {
      const target = notifications.find(
        (item) => String(item.id) === String(id)
      );
      await deleteNotification(id);

      setNotifications((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );

      if (target && !target.is_read) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch (error) {
      console.error("Gagal menghapus notification:", error);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifikasi"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-white/70"
      >
        <FaBell size={17} />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[350px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleReadAll}
                className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                <FaCheckDouble size={11} />
                Tandai semua
              </button>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              Belum ada notifikasi.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleRead(notification)}
                  className={`group flex cursor-pointer gap-3 border-b border-gray-100 px-4 py-3 transition ${
                    notification.is_read ? "bg-gray-50" : "bg-white"
                  } hover:bg-gray-100`}
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <FaBell size={13} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <h4
                        className={`line-clamp-1 flex-1 text-sm ${
                          notification.is_read ? "font-medium text-gray-600" : "font-semibold text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-700" />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">
                      {notification.body}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => handleDelete(event, notification.id)}
                    className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-red-500 group-hover:flex"
                    aria-label="Hapus"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/notifikasi");
            }}
            className="w-full border-t border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Lihat semua notifikasi
          </button>
        </div>
      )}
    </div>
  );
}