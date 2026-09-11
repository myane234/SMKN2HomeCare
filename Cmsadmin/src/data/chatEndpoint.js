import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi berakhir. Silakan login kembali.');
  }

  if (!response.ok) {
    const message = body?.message ?? 'Terjadi kesalahan pada server';
    throw new Error(message);
  }

  return body;
}

export const CHAT_ENDPOINTS = {
  GET_CHAT_ROOMS: '/admin/chat-rooms',
  GET_MANAGE_CHAT_ROOMS: '/manage-admin/chat-rooms',
  GET_MANAGE_CHAT_ROOM_DETAIL: (bookingId) => `/manage-admin/chat-rooms/${bookingId}`,
  GET_BOOKING_DETAIL: (idBooking) => `/booking/${idBooking}`,
};

export async function getAllChatRooms() {
  const res = await fetch(`${URL}${CHAT_ENDPOINTS.GET_CHAT_ROOMS}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeaders(),
    },
  });

  const json = await parseJsonResponse(res);
  return json.data || [];
}

export async function getManageChatRooms() {
  const res = await fetch(`${URL}${CHAT_ENDPOINTS.GET_MANAGE_CHAT_ROOMS}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeaders(),
    },
  });

  const json = await parseJsonResponse(res);
  return json.data || [];
}

export async function getManageChatRoomDetail(bookingId) {
  const res = await fetch(`${URL}${CHAT_ENDPOINTS.GET_MANAGE_CHAT_ROOM_DETAIL(bookingId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeaders(),
    },
  });

  const json = await parseJsonResponse(res);
  return json.data || null;
}

export async function getBookingDetail(bookingId) {
  try {
    const res = await fetch(`${URL}${CHAT_ENDPOINTS.GET_BOOKING_DETAIL(bookingId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...getAuthHeaders(),
      },
    });
    
    const json = await res.json();
    if (!res.ok || json.success === false) {
      return null;
    }
    
    return json.data || json;
  } catch (error) {
    return null;
  }
}