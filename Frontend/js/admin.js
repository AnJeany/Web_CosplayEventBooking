import { state } from './state.js';
import { showToast } from './toast.js';
import { apiGet, apiPost } from './api.js';

export async function openAdminModal() {
    if (!state.user || state.user.role !== 'Admin') {
        showToast("Bạn không có quyền hạn Admin tổng.", "error");
        return;
    }

    document.getElementById("admin-modal").classList.remove("hidden");
    const userList = document.getElementById("admin-users-list");
    const logsList = document.getElementById("admin-logs-list");

    userList.innerHTML = `<div class="text-[11px] text-slate-500">Đang tải danh sách...</div>`;
    logsList.innerHTML = `<div class="text-[11px] text-slate-500">Đang tải logs...</div>`;

    try {
        const users = await apiGet("admin/users");
        const logs = await apiGet("admin/logs");

        userList.innerHTML = users.map(u => `
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                <div>
                    <p class="font-bold text-slate-200">${u.fullName} <code class="text-[9px] text-brand-400 bg-slate-900 px-1 rounded">${u.realRole || u.role}</code></p>
                    <p class="text-[10px] text-slate-500">${u.email}</p>
                    <p class="text-[9px] text-slate-400">Trạng thái: 
                        <span class="${u.isApproved ? 'text-emerald-400' : 'text-amber-400'} font-semibold">${u.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}</span> | 
                        <span class="${u.isLocked ? 'text-red-400' : 'text-slate-400'} font-semibold">${u.isLocked ? 'Bị khoá' : 'Hoạt động'}</span>
                    </p>
                </div>
                <div class="flex flex-col gap-1 shrink-0 ml-2">
                    ${(!u.isApproved && (u.realRole === 'ServiceProvider' || u.realRole === 'EventOrganizer')) ? `<button onclick="approveUserByAdmin('${u.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-0.5 rounded">Duyệt</button>` : ''}
                    ${!u.isLocked ? `<button onclick="lockUserByAdmin('${u.id}', true)" class="bg-red-650 hover:bg-red-700 text-white font-bold text-[9px] px-2 py-0.5 rounded">Khoá</button>` : `<button onclick="lockUserByAdmin('${u.id}', false)" class="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[9px] px-2 py-0.5 rounded">Mở Khoá</button>`}
                </div>
            </div>
        `).join('');

        logsList.innerHTML = logs.length > 0 ? logs.map(l => `
            <div class="text-[11px] border-b border-slate-850/60 pb-1.5 space-y-0.5">
                <div class="flex justify-between text-[10px] text-slate-500">
                    <span>Admin: <strong>${l.adminEmail}</strong></span>
                    <span>${new Date(l.timestamp).toLocaleTimeString('vi-VN')}</span>
                </div>
                <p class="text-slate-350"><span class="text-brand-400 font-semibold">[${l.action}]</span> Target: ${l.target}</p>
                <p class="text-[10px] text-slate-500 italic">${l.details}</p>
            </div>
        `).join('') : '<div class="text-[10px] text-slate-500">Chưa ghi nhận nhật ký nào.</div>';

    } catch (err) {
        showToast(err.message, "error");
    }
}

export async function approveUserByAdmin(userId) {
    try {
        await apiPost(`admin/users/${userId}/approve`);
        showToast("Đã phê duyệt tài khoản thành công!", "success");
        openAdminModal();
    } catch (err) {
        showToast(err.message, "error");
    }
}

export async function lockUserByAdmin(userId, lockAction) {
    try {
        if (lockAction) {
            await apiPost(`admin/users/${userId}/lock`, { reason: "Vi phạm quy tắc hệ thống." });
            showToast("Đã khóa tài khoản người dùng thành công!");
        } else {
            await apiPost(`admin/users/${userId}/unlock`);
            showToast("Đã mở khóa hoạt động cho tài khoản!");
        }
        openAdminModal();
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function closeAdminModal() {
    document.getElementById("admin-modal").classList.add("hidden");
}
