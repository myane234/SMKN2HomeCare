"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { FaBell, FaCheck, FaCheckDouble, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { getWebSocketConfig } from "@/services/bookingService";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/services/notificationService";

const normalizeRole = (role) => {
  const value = String(role ?? "").trim().toLowerCase();
  return value === "pasien" || value === "nakes" ? value : null;
};

const resolveRole = (scopeRole, pathname) => {
  const explicitRole = normalizeRole(scopeRole);
  if (explicitRole) return explicitRole;
  return pathname === "/nakes" || pathname?.startsWith("/nakes/")
    ? "nakes"
    : "pasien";
};

const getCookie = (name) => {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));

  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.substring(prefix.length));
  } catch {
    return cookie.substring(prefix.length);
  }
};

const getUserId = () => {
  const profileId = getCookie("profile_id_user");
  if (profileId) return String(profileId).trim();

  const userProfile = getCookie("user_profile");

  if (userProfile) {
    try {
      const profile = JSON.parse(userProfile);
      const id =
        profile?.id_user ??
        profile?.user_id ??
        profile?.id ??
        profile?.user?.id_user ??
        profile?.user?.id;

      if (id != null && id !== "") return String(id).trim();
    } catch (error) {
      console.warn("Gagal membaca user_profile:", error);
    }
  }

  return null;
};

const parseObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
};

const unwrapNotification = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  if (payload.notification && typeof payload.notification === "object") {
    return payload.notification;
  }

  if (
    payload.data?.notification &&
    typeof payload.data.notification === "object"
  ) {
    return payload.data.notification;
  }

  if (
    payload.id != null ||
    payload.notification_id != null ||
    payload.title != null
  ) {
    return payload;
  }

  if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return payload.data;
  }

  return payload;
};

const getTargetRole = (payload) => {
  const raw = unwrapNotification(payload);
  if (!raw) return null;

  const data = parseObject(raw.data);
  const notificationData = parseObject(raw.notification_data);
  const outerData = parseObject(payload?.data);

  return normalizeRole(
    raw.user_role ??
      raw.target_role ??
      raw.recipient_role ??
      data.user_role ??
      data.target_role ??
      data.recipient_role ??
      notificationData.user_role ??
      notificationData.target_role ??
      notificationData.recipient_role ??
      payload?.user_role ??
      payload?.target_role ??
      payload?.recipient_role ??
      outerData.user_role ??
      outerData.target_role ??
      outerData.recipient_role
  );
};

const findVariable = (source, key) => {
  let current = source;

  for (const part of key.split(".")) {
    if (!current || typeof current !== "object") {
      current = undefined;
      break;
    }
    current = current[part];
  }

  if (current != null && typeof current !== "object") {
    return current;
  }

  const visited = new Set();

  const search = (object) => {
    if (!object || typeof object !== "object" || visited.has(object)) {
      return undefined;
    }

    visited.add(object);

    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      object[key] != null &&
      typeof object[key] !== "object"
    ) {
      return object[key];
    }

    for (const value of Object.values(object)) {
      const found = search(value);
      if (found !== undefined) return found;
    }

    return undefined;
  };

  return search(source);
};

export const cleanNotificationText = (text, variables = {}) => {
  if (text == null) return "";

  const source = parseObject(variables);

  return String(text)
    .replace(
      /(#?)\{\{\s*([^{}]+?)\s*\}\}|(#?)\{\s*([^{}]+?)\s*\}/g,
      (_match, doubleHash, doubleKey, singleHash, singleKey) => {
        const prefix = doubleHash ?? singleHash ?? "";
        const key = (doubleKey ?? singleKey ?? "").trim();
        const value = findVariable(source, key);

        return value == null || value === ""
          ? ""
          : `${prefix}${String(value)}`;
      }
    )
    .replace(/[{}]/g, "")
    .replace(/##+/g, "#")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+#(?=\s|$)/g, "")
    .trim();
};

const normalizeReadStatus = (raw) => {
  const value = raw?.is_read ?? raw?.data?.is_read;
  const readAt = raw?.read_at ?? raw?.data?.read_at;

  if (value !== undefined && value !== null) {
    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      (typeof value === "string" && value.toLowerCase() === "true")
    );
  }

  return Boolean(readAt);
};

export const normalizeNotification = (payload, scopeRole = null) => {
  const raw = unwrapNotification(payload);
  if (!raw) return null;

  const id = raw.id ?? raw.notification_id ?? raw.data?.id;
  const rawTitle = raw.title ?? raw.data?.title ?? raw.data?.subject;
  const rawBody =
    raw.body ??
    raw.message ??
    raw.data?.body ??
    raw.data?.message ??
    "";

  if (id == null || rawTitle == null || String(rawTitle).trim() === "") {
    return null;
  }

  const targetRole = getTargetRole(payload);
  const role = normalizeRole(scopeRole);

  // Notifikasi yang role-nya berbeda atau tidak diketahui tidak ditampilkan.
  if (role && targetRole !== role) return null;

  const metadata = parseObject(raw.notification_data ?? raw.data);
  const variables = { ...raw, ...metadata };

  return {
    id,
    title: cleanNotificationText(rawTitle, variables),
    body: cleanNotificationText(rawBody, variables),
    data: metadata,
    target_role: targetRole,
    is_read: normalizeReadStatus(raw),
    read_at: raw.read_at ?? metadata.read_at ?? null,
    created_at: raw.created_at ?? raw.timestamp ?? metadata.created_at ?? null,
  };
};

const extractRawNotificationList = (response) => {
  const candidates = [
    response?.data?.data,
    response?.data,
    response?.notifications,
    response?.data?.notifications,
    response,
  ];

  return candidates.find(Array.isArray) ?? [];
};

const extractNotificationList = (response, role) =>
  extractRawNotificationList(response)
    .map((item) => normalizeNotification(item, role))
    .filter(Boolean);

const hasUnscopedOrForeignRecords = (response, role) =>
  extractRawNotificationList(response).some(
    (item) => getTargetRole(item) !== normalizeRole(role)
  );

const extractUnreadCount = (response) => {
  const candidates = [
    response?.unread_count,
    response?.data?.unread_count,
    response?.data?.data?.unread_count,
    response?.count,
    response?.data?.count,
    typeof response?.data === "number" ? response.data : null,
    typeof response === "number" ? response : null,
  ];

  const count = candidates.find(
    (value) => typeof value === "number" && Number.isFinite(value)
  );

  return count == null ? null : Math.max(0, count);
};

const countUnread = (list) =>
  list.filter((item) => !item.is_read).length;

export const getScopedUnreadCount = (response, normalizedList, role) => {
  const rawList = extractRawNotificationList(response);
  const serverCount = extractUnreadCount(response);
  const contaminated = hasUnscopedOrForeignRecords(response, role);

  if (contaminated || (rawList.length === 0 && serverCount > 0)) {
    return countUnread(normalizedList);
  }

  return serverCount ?? countUnread(normalizedList);
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

export default function NotificationBell({ scopeRole, notificationHref }) {
  const pathname = usePathname();
  const role = resolveRole(scopeRole, pathname);
  const userId = getUserId();

  const targetHref =
    notificationHref ||
    (role === "nakes" ? "/nakes/notifikasi" : "/notifikasi");

  const wrapperRef = useRef(null);
  const socketRef = useRef(null);
  const notificationIdsRef = useRef(new Set());
  const readingIdsRef = useRef(new Set());

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [readingIds, setReadingIds] = useState([]);

  const loadNotifications = useCallback(async () => {
    // Jangan request API jika belum ada pengguna yang login.
    if (!getUserId()) {
      notificationIdsRef.current.clear();
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await getNotifications({
        per_page: 20,
        role,
      });

      const rawList = extractRawNotificationList(response);
      const list = extractNotificationList(response, role);

      notificationIdsRef.current = new Set(
        list.map((item) => String(item.id))
      );

      setNotifications(list.slice(0, 5));
      setUnreadCount(getScopedUnreadCount(response, list, role));

      if (
        rawList.length > 0 &&
        !hasUnscopedOrForeignRecords(response, role) &&
        extractUnreadCount(response) === null
      ) {
        const countResponse = await getUnreadNotificationCount({ role });
        const count = extractUnreadCount(countResponse);
        if (count !== null) setUnreadCount(count);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error("Gagal mengambil notifikasi:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    let cancelled = false;
    let socket = null;

    const resetNotifications = () => {
      notificationIdsRef.current.clear();
      readingIdsRef.current.clear();
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setReadingIds([]);
      setOpen(false);
    };

    const loadInitialData = async () => {
      try {
        const response = await getNotifications({
          per_page: 20,
          role,
        });

        if (cancelled) return;

        const rawList = extractRawNotificationList(response);
        const list = extractNotificationList(response, role);

        notificationIdsRef.current = new Set(
          list.map((item) => String(item.id))
        );

        setNotifications(list.slice(0, 5));

        let count = getScopedUnreadCount(response, list, role);

        if (
          rawList.length > 0 &&
          !hasUnscopedOrForeignRecords(response, role) &&
          extractUnreadCount(response) === null
        ) {
          const countResponse = await getUnreadNotificationCount({ role });
          if (cancelled) return;

          const serverCount = extractUnreadCount(countResponse);
          if (serverCount !== null) count = serverCount;
        }

        if (!cancelled) setUnreadCount(count);
      } catch (error) {
        if (error?.response?.status !== 401) {
          console.error("Gagal mengambil data awal notifikasi:", error);
        }
      }
    };

    const connectRealtime = async () => {
      const currentUserId = getUserId();
      if (!currentUserId) return;

      try {
        const config = await getWebSocketConfig();
        if (cancelled) return;

        const wsUrl = config?.data?.url ?? config?.url;
        if (!wsUrl) return;

        const url = new URL(wsUrl, window.location.href);
        if (url.protocol === "http:") url.protocol = "ws:";
        if (url.protocol === "https:") url.protocol = "wss:";

        url.searchParams.set("user_id", currentUserId);
        url.searchParams.set("user_role", role);

        socket = new WebSocket(url.toString());
        socketRef.current = socket;

        socket.onmessage = (event) => {
          if (cancelled) return;

          try {
            const payload = JSON.parse(event.data);
            const notification = normalizeNotification(payload, role);
            if (!notification) return;

            const id = String(notification.id);
            if (notificationIdsRef.current.has(id)) return;

            notificationIdsRef.current.add(id);

            setNotifications((current) =>
              [notification, ...current].slice(0, 5)
            );

            if (!notification.is_read) {
              setUnreadCount((current) => current + 1);
            }
          } catch (error) {
            console.error("Gagal memproses event notifikasi:", error);
          }
        };

        socket.onerror = (error) => {
          console.error("WebSocket notifikasi error:", error);
        };

        socket.onclose = () => {
          if (socketRef.current === socket) socketRef.current = null;
        };
      } catch (error) {
        if (error?.response?.status !== 401) {
          console.error("Gagal menghubungkan WebSocket notifikasi:", error);
        }
      }
    };

    // Request dan WebSocket hanya dijalankan ketika pengguna login.
    if (userId) {
      loadInitialData();
      connectRealtime();
    } else {
      resetNotifications();
    }

    return () => {
      cancelled = true;
      if (socket) socket.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [role, userId]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && getUserId()) {
      await loadNotifications();
    }
  };

  const handleRead = async (event, notification) => {
    event.stopPropagation();

    if (!getUserId()) {
      setNotifications([]);
      setUnreadCount(0);
      setOpen(false);
      return;
    }

    const id = String(notification.id);

    if (notification.is_read || readingIdsRef.current.has(id)) return;

    readingIdsRef.current.add(id);
    setReadingIds((current) => [...current, id]);

    try {
      await markNotificationAsRead(notification.id, { role });

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
      if (error?.response?.status !== 401) {
        console.error("Gagal menandai notifikasi dibaca:", error);
      }
    } finally {
      readingIdsRef.current.delete(id);
      setReadingIds((current) => current.filter((item) => item !== id));
    }
  };

  const handleReadAll = async () => {
    if (!getUserId()) {
      setNotifications([]);
      setUnreadCount(0);
      setOpen(false);
      return;
    }

    if (unreadCount === 0) return;

    try {
      await markAllNotificationsAsRead({ role });

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error("Gagal menandai semua notifikasi:", error);
      }
    }
  };

  const handleDelete = async (event, id) => {
    event.stopPropagation();

    if (!getUserId()) {
      setNotifications([]);
      setUnreadCount(0);
      setOpen(false);
      return;
    }

    const target = notifications.find(
      (item) => String(item.id) === String(id)
    );

    const result = await showDeleteConfirmation();
    if (!result.isConfirmed) return;

    try {
      await deleteNotification(id, { role });

      notificationIdsRef.current.delete(String(id));

      setNotifications((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );

      if (target && !target.is_read) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      await showDeleteSuccess();
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error("Gagal menghapus notifikasi:", error);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifikasi"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-50"
      >
        <FaBell size={17} />

        {userId && unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex min-h-[17px] min-w-[17px] -translate-y-0.5 translate-x-0.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Notifikasi
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} belum dibaca`
                  : "Semua sudah dibaca"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleReadAll}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <FaCheckDouble size={11} />
                Tandai semua
              </button>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Belum ada notifikasi.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.map((notification) => {
                const id = String(notification.id);
                const isReading = readingIds.includes(id);

                return (
                  <div
                    key={notification.id}
                    className={`group flex gap-3 border-b border-slate-100 px-4 py-3.5 transition hover:bg-slate-50 ${
                      notification.is_read ? "bg-white" : "bg-blue-50/30"
                    }`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <FaBell size={13} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <h4
                          className={`line-clamp-1 flex-1 text-sm ${
                            notification.is_read
                              ? "font-medium text-slate-600"
                              : "font-bold text-slate-900"
                          }`}
                        >
                          {notification.title}
                        </h4>

                        {!notification.is_read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                        {notification.body}
                      </p>

                      <p className="mt-1.5 text-[11px] text-slate-400">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-start gap-1">
                      <button
                        type="button"
                        onClick={(event) =>
                          handleRead(event, notification)
                        }
                        disabled={notification.is_read || isReading}
                        title={
                          notification.is_read
                            ? "Sudah dibaca"
                            : "Tandai dibaca"
                        }
                        aria-label={
                          notification.is_read
                            ? "Sudah dibaca"
                            : "Tandai dibaca"
                        }
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                          notification.is_read
                            ? "cursor-default text-emerald-500"
                            : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        } disabled:opacity-70`}
                      >
                        <FaCheck size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={(event) =>
                          handleDelete(event, notification.id)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Hapus notifikasi"
                        title="Hapus notifikasi"
                      >
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.location.assign(targetHref);
            }}
            className="w-full border-t border-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Lihat semua notifikasi
          </button>
        </div>
      )}
    </div>
  );
}