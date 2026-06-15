import { state, clearAuth } from './state.js';

export const API_BASE = "http://localhost:5056/api";

export async function apiGet(endpoint) {
    const headers = {};
    if (state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
    }
    const res = await fetch(`${API_BASE}/${endpoint}`, { headers });
    if (!res.ok) {
        if (res.status === 401) {
            clearAuth();
            window.location.reload();
            throw new Error("Phiên làm việc hết hạn.");
        }
        const data = await res.json();
        throw new Error(data.message || "Lỗi tải dữ liệu.");
    }
    return await res.json();
}

export async function apiPost(endpoint, body = {}) {
    const headers = { "Content-Type": "application/json" };
    if (state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
    }
    const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || data.Message || "Lỗi thao tác.");
    }
    return data;
}

export async function apiPut(endpoint, body = {}) {
    const headers = { "Content-Type": "application/json" };
    if (state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
    }
    const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.Message || "Lỗi thao tác.");
    }
    if (res.status === 204) return null;
    return await res.json();
}
