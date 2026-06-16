import { state, saveAuth, clearAuth } from './state.js';
import { showToast } from './toast.js';
import { API_BASE, apiGet, apiPost, apiPut } from './api.js';
import { toggleAuthTab, handleLogin, handleRegister, handleLogout, quickLogin } from './auth.js';
import { openChatWith, pollNewMessages, renderChatMessages, handleChatKeyPress, sendMessage, closeChat, openChatHistory } from './chat.js';
import { openAdminModal, approveUserByAdmin, lockUserByAdmin, closeAdminModal } from './admin.js';
import { loadMyCounts, triggerTicketPurchase, triggerServiceBooking, closeBookingConfigModal, submitBookingConfig, closePaymentModal, executeDemoPayment, openMyTickets, reviewBookingStatus, closeMyTickets } from './booking.js';
import { loadEvents, renderApp, goHome, renderHomepage, viewEventDetail, viewHotEvent, renderEventDetailPage, switchEventTab, renderActiveTabContent, createBtcPost, uploadExplorePhoto, createExplorePost, likePost, reportPost, loadCommentsForPost, submitComment, focusCommentInput, submitBoothApplication, submitServiceConfig, approveBooth, openCreateEventModal, closeCreateEventModal, submitCreateEvent } from './events.js';

// Gắn toàn bộ hàm nghiệp vụ lên đối tượng window để HTML có thể gọi inline
window.state = state;
window.saveAuth = saveAuth;
window.clearAuth = clearAuth;
window.showToast = showToast;
window.API_BASE = API_BASE;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.toggleAuthTab = toggleAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.quickLogin = quickLogin;
window.openChatWith = openChatWith;
window.pollNewMessages = pollNewMessages;
window.renderChatMessages = renderChatMessages;
window.handleChatKeyPress = handleChatKeyPress;
window.sendMessage = sendMessage;
window.closeChat = closeChat;
window.openChatHistory = openChatHistory;
window.openAdminModal = openAdminModal;
window.approveUserByAdmin = approveUserByAdmin;
window.lockUserByAdmin = lockUserByAdmin;
window.closeAdminModal = closeAdminModal;
window.loadMyCounts = loadMyCounts;
window.triggerTicketPurchase = triggerTicketPurchase;
window.triggerServiceBooking = triggerServiceBooking;
window.closeBookingConfigModal = closeBookingConfigModal;
window.submitBookingConfig = submitBookingConfig;
window.closePaymentModal = closePaymentModal;
window.executeDemoPayment = executeDemoPayment;
window.openMyTickets = openMyTickets;
window.reviewBookingStatus = reviewBookingStatus;
window.closeMyTickets = closeMyTickets;
window.loadEvents = loadEvents;
window.renderApp = renderApp;
window.goHome = goHome;
window.renderHomepage = renderHomepage;
window.viewEventDetail = viewEventDetail;
window.viewHotEvent = viewHotEvent;
window.renderEventDetailPage = renderEventDetailPage;
window.switchEventTab = switchEventTab;
window.renderActiveTabContent = renderActiveTabContent;
window.createBtcPost = createBtcPost;
window.uploadExplorePhoto = uploadExplorePhoto;
window.createExplorePost = createExplorePost;
window.likePost = likePost;
window.reportPost = reportPost;
window.loadCommentsForPost = loadCommentsForPost;
window.submitComment = submitComment;
window.focusCommentInput = focusCommentInput;
window.submitBoothApplication = submitBoothApplication;
window.submitServiceConfig = submitServiceConfig;
window.approveBooth = approveBooth;
window.openCreateEventModal = openCreateEventModal;
window.closeCreateEventModal = closeCreateEventModal;
window.submitCreateEvent = submitCreateEvent;

// Dispatcher phục vụ refresh tab khi có giao dịch thành công từ modal booking/thanh toán
window.dispatcher = {
    refreshActiveTab: () => {
        const ev = state.events.find(e => e.id === state.activeEventId);
        if (ev) renderActiveTabContent(ev);
    }
};

// Khai báo các hàm điều phối ứng dụng chính
export function initApp() {
    // Khôi phục trạng thái từ localStorage (được lưu trong quickLogin)
    const savedEventId = localStorage.getItem("activeEventId");
    const savedTab = localStorage.getItem("activeTab");
    if (savedEventId) {
        state.activeEventId = savedEventId;
        state.activeTab = savedTab || 'timeline';
        localStorage.removeItem("activeEventId");
        localStorage.removeItem("activeTab");
    }

    if (state.token && state.user) {
        document.getElementById("auth-view").classList.add("hidden");
        document.getElementById("main-view").classList.remove("hidden");
        syncNavbarProfile();
        loadEvents();
        startRoleBadgeSync();
    } else {
        document.getElementById("auth-view").classList.remove("hidden");
        document.getElementById("main-view").classList.add("hidden");
    }
}

export function syncNavbarProfile() {
    const navAvatar = document.getElementById("nav-avatar");
    const navUsername = document.getElementById("nav-username");
    const navRoleBadge = document.getElementById("nav-role-badge");

    if (navAvatar) navAvatar.src = state.user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150";
    if (navUsername) navUsername.innerText = state.user.fullName;
    
    let roleText = "Khách tham dự";
    if (state.user.role === "ServiceProvider") roleText = "Dịch Vụ (PTG/MUA)";
    if (state.user.role === "EventOrganizer") roleText = "Ban Tổ Chức (BTC)";
    if (state.user.role === "Admin") roleText = "Admin Tổng";
    if (navRoleBadge) navRoleBadge.innerText = roleText;

    // Cập nhật trạng thái active của thanh chọn vai trò Demo floating panel
    ['customer', 'service', 'organizer', 'admin'].forEach(r => {
        const btn = document.getElementById(`btn-role-${r}`);
        if (!btn) return;
        
        let isMatch = false;
        if (r === 'customer' && state.user.role === 'Customer') isMatch = true;
        if (r === 'service' && state.user.role === 'ServiceProvider') isMatch = true;
        if (r === 'organizer' && state.user.role === 'EventOrganizer') isMatch = true;
        if (r === 'admin' && state.user.role === 'Admin') isMatch = true;

        const badge = btn.querySelector('span:last-child');
        if (isMatch) {
            btn.className = "w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between font-medium transition-all bg-brand-500 text-white";
            if (badge) badge.classList.remove('hidden');
        } else {
            btn.className = "w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700";
            if (badge) badge.classList.add('hidden');
        }
    });

    // Tải thông số vé/lịch đặt góc Navbar
    loadMyCounts();
}

let badgeSyncInterval = null;
export function startRoleBadgeSync() {
    if (badgeSyncInterval) clearInterval(badgeSyncInterval);
    badgeSyncInterval = setInterval(loadMyCounts, 10000);
}

export function toggleProfileDropdown() {
    const dropdown = document.getElementById("profile-dropdown");
    if (dropdown) dropdown.classList.toggle("hidden");
}

export function toggleRoleSwitcher() {
    const content = document.getElementById("role-switcher-content");
    const icon = document.getElementById("role-switcher-toggle-icon");
    if (content) {
        content.classList.toggle("hidden");
        if (content.classList.contains("hidden")) {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>';
        } else {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
        }
    }
}

window.initApp = initApp;
window.syncNavbarProfile = syncNavbarProfile;
window.startRoleBadgeSync = startRoleBadgeSync;
window.toggleProfileDropdown = toggleProfileDropdown;
window.toggleRoleSwitcher = toggleRoleSwitcher;

// Khởi chạy ứng dụng
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
