import { state } from './state.js';
import { showToast } from './toast.js';
import { apiGet, apiPost, apiPut, API_BASE } from './api.js';
import { openChatWith } from './chat.js';
import { triggerTicketPurchase, triggerServiceBooking } from './booking.js';

export async function loadEvents() {
    try {
        const events = await apiGet("events?pageSize=50");
        state.events = events;
        renderApp();
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function renderApp() {
    if (state.activeEventId === null) {
        renderHomepage();
    } else {
        renderEventDetailPage(state.activeEventId);
    }
}

export function goHome() {
    state.activeEventId = null;
    renderApp();
}

export function renderHomepage() {
    const container = document.getElementById("app-view");
    if (!container) return;

    const searchVal = document.getElementById("search-input")?.value || "";
    const locationVal = document.getElementById("filter-location")?.value || "all";
    const ticketVal = document.getElementById("filter-ticket")?.value || "all";

    const filteredEvents = state.events.filter(ev => {
        const matchSearch = ev.title.toLowerCase().includes(searchVal.toLowerCase());
        const matchLocation = locationVal === "all" || ev.location.includes(locationVal);
        const matchTicket = ticketVal === "all" || 
            (ticketVal === "Free" && ev.ticketPrice === 0) || 
            (ticketVal === "Paid" && ev.ticketPrice > 0);
        return matchSearch && matchLocation && matchTicket;
    });

    container.innerHTML = `
        <!-- Hero Banner -->
        <div class="relative rounded-3xl overflow-hidden mb-8 bg-slate-900 border border-slate-800 h-[280px] md:h-[350px] flex items-center">
            <div class="absolute inset-0 bg-cover bg-center opacity-40 filter blur-[1px]" style="background-image: url('https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=1200');"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
            
            <div class="relative z-10 p-6 md:p-12 max-w-xl space-y-3">
                <span class="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Sự Kiện Hot Nhất</span>
                <h1 class="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">Cosplay Summer Festa 2026</h1>
                <p class="text-xs md:text-sm text-slate-300">Dòng chảy văn hoá Anime-Manga bùng nổ, cuộc hội ngộ của các cosplayer xuất sắc, cùng cơ hội đặt lịch thợ ảnh hàng đầu ngay tại sự kiện!</p>
                <div class="pt-4">
                    <button onclick="viewHotEvent()" class="bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 hover:scale-105">
                        Khám Phá & Đặt Vé Ngay
                    </button>
                </div>
            </div>
        </div>

        <!-- Search and Filters Section -->
        <div class="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 mb-8 space-y-4">
            <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                <h3 class="font-bold text-sm text-slate-200">Tìm kiếm & Bộ lọc sự kiện nhanh</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="relative col-span-1 md:col-span-2">
                    <input type="text" id="search-input" value="${searchVal}" oninput="renderHomepage()" placeholder="Nhập tên sự kiện muốn tìm..." class="w-full bg-slate-950 text-slate-100 placeholder-slate-500 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-brand-500">
                    <svg class="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <div>
                    <select id="filter-location" onchange="renderHomepage()" class="w-full bg-slate-950 text-slate-305 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-500">
                        <option value="all" ${locationVal === 'all' ? 'selected' : ''}>📍 Tất cả địa điểm</option>
                        <option value="Hồ Chí Minh" ${locationVal === 'Hồ Chí Minh' ? 'selected' : ''}>Hồ Chí Minh</option>
                        <option value="Hà Nội" ${locationVal === 'Hà Nội' ? 'selected' : ''}>Hà Nội</option>
                        <option value="Đà Nẵng" ${locationVal === 'Đà Nẵng' ? 'selected' : ''}>Đà Nẵng</option>
                    </select>
                </div>
                <div>
                    <select id="filter-ticket" onchange="renderHomepage()" class="w-full bg-slate-950 text-slate-305 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-500">
                        <option value="all" ${ticketVal === 'all' ? 'selected' : ''}>🎟️ Loại Vé (Tất cả)</option>
                        <option value="Free" ${ticketVal === 'Free' ? 'selected' : ''}>Vé Miễn Phí</option>
                        <option value="Paid" ${ticketVal === 'Paid' ? 'selected' : ''}>Vé Có Phí</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Event Grid List -->
        <div>
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <span>📅 Danh sách sự kiện</span>
                    <span class="text-xs bg-brand-500/10 text-brand-400 px-2.5 py-0.5 rounded-full border border-brand-500/20">${filteredEvents.length} sự kiện</span>
                </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${filteredEvents.length > 0 ? filteredEvents.map(ev => `
                    <div class="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-brand-500/50 transition-all duration-300 group flex flex-col justify-between h-[420px]">
                        <div class="relative h-44 overflow-hidden">
                            <img src="${ev.bannerUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=1200'}" alt="${ev.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                            <span class="absolute top-3 right-3 ${ev.ticketPrice === 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-brand-500/20 text-brand-400 border-brand-500/30'} border text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full">
                                ${ev.ticketPrice === 0 ? 'Miễn Phí' : `Có Phí: ${ev.ticketPrice.toLocaleString('vi-VN')}đ`}
                            </span>
                        </div>

                        <div class="p-5 flex-1 flex flex-col justify-between">
                            <div class="space-y-2">
                                <div class="flex items-center gap-1.5 text-xs text-brand-400 font-semibold uppercase tracking-wider">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <span>${new Date(ev.startTime).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <h3 class="font-bold text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-1">${ev.title}</h3>
                                <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">${ev.description}</p>
                            </div>

                            <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                                <span class="flex items-center gap-1 line-clamp-1">
                                    📍 ${ev.location.split(',').pop().trim()}
                                </span>
                                <span class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium shrink-0">
                                    ${ev.hasBooth ? 'Có Booth PTG' : 'Chỉ sự kiện'}
                                </span>
                            </div>
                        </div>

                        <div class="px-5 pb-5">
                            <button onclick="viewEventDetail('${ev.id}')" class="w-full bg-slate-800 hover:bg-brand-500 hover:text-white transition-all text-slate-300 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                                Vào Trang Sự Kiện
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </button>
                        </div>
                    </div>
                `).join('') : `
                    <div class="col-span-1 md:col-span-3 py-12 text-center text-slate-500">
                        Không tìm thấy sự kiện nào khớp bộ lọc.
                    </div>
                `}
            </div>
        </div>
    `;
}

export function viewEventDetail(eventId) {
    state.activeEventId = eventId;
    state.activeTab = (state.user.role === 'EventOrganizer') ? 'manage' : 'timeline';
    renderApp();
}

export function viewHotEvent() {
    const hotEvent = state.events.find(e => e.title.includes("Summer Festa"));
    if (hotEvent) viewEventDetail(hotEvent.id);
    else if (state.events.length > 0) viewEventDetail(state.events[0].id);
}

export async function renderEventDetailPage(eventId) {
    const ev = state.events.find(e => e.id === eventId);
    if (!ev) {
        goHome();
        return;
    }

    const container = document.getElementById("app-view");
    if (!container) return;

    let tabsHtml = `
        <button onclick="switchEventTab('timeline')" class="px-4 py-3 font-semibold text-xs border-b-2 transition-all ${state.activeTab === 'timeline' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'}">
            🎪 Thông báo BTC
        </button>
        <button onclick="switchEventTab('explore')" class="px-4 py-3 font-semibold text-xs border-b-2 transition-all ${state.activeTab === 'explore' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'}">
            ✨ Khám Phá
        </button>
    `;

    if (ev.hasBooth) {
        tabsHtml += `
            <button onclick="switchEventTab('booking')" class="px-4 py-3 font-semibold text-xs border-b-2 transition-all ${state.activeTab === 'booking' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'}">
                📸 Thuê Thợ Ảnh / Makeup
            </button>
        `;
    }

    if (state.user.role === 'ServiceProvider' && ev.hasBooth) {
        tabsHtml += `
            <button onclick="switchEventTab('booth')" class="px-4 py-3 font-semibold text-xs border-b-2 transition-all ${state.activeTab === 'booth' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'}">
                🏪 Đăng Ký Booth & Cấu hình dịch vụ
            </button>
        `;
    }

    if (state.user.role === 'EventOrganizer') {
        tabsHtml += `
            <button onclick="switchEventTab('manage')" class="px-4 py-3 font-semibold text-xs border-b-2 transition-all ${state.activeTab === 'manage' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'}">
                🛠️ Quản Lý Đơn Đăng Ký
            </button>
        `;
    }

    container.innerHTML = `
        <button onclick="goHome()" class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-500 transition-colors mb-4 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Quay lại Trang Chủ
        </button>

        <div class="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mb-6">
            <div class="h-44 md:h-52 bg-cover bg-center opacity-30" style="background-image: url('${ev.bannerUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=1200'}');"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            
            <div class="absolute bottom-5 left-5 right-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div class="space-y-2">
                    <span class="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">Trang Sự Kiện</span>
                    <h2 class="text-xl md:text-3xl font-extrabold text-slate-100">${ev.title}</h2>
                    <p class="text-xs text-slate-300 flex items-center gap-1">
                        📍 ${ev.location} | 📅 ${new Date(ev.startTime).toLocaleDateString('vi-VN')}
                    </p>
                </div>

                <div>
                    ${ev.ticketPrice > 0 ? `
                        <button onclick="triggerTicketPurchase('${ev.id}')" class="bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center gap-1.5">
                            🎫 Mua Vé Tham Dự (${ev.ticketPrice.toLocaleString('vi-VN')}đ)
                        </button>
                    ` : `
                        <button onclick="triggerTicketPurchase('${ev.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-1.5">
                            ✅ Đăng ký tham dự miễn phí
                        </button>
                    `}
                </div>
            </div>
        </div>

        <div class="flex border-b border-slate-800 mb-6 overflow-x-auto">
            ${tabsHtml}
        </div>

        <div id="tab-content" class="min-h-[250px]">
            <!-- Dynamic tab view -->
        </div>
    `;

    renderActiveTabContent(ev);
}

export function switchEventTab(tabName) {
    state.activeTab = tabName;
    const ev = state.events.find(e => e.id === state.activeEventId);
    renderActiveTabContent(ev);
    
    const tabButtons = document.querySelectorAll('button[onclick^="switchEventTab"]');
    tabButtons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabName)) {
            btn.className = "px-4 py-3 font-semibold text-xs border-b-2 transition-all border-brand-500 text-brand-400";
        } else {
            btn.className = "px-4 py-3 font-semibold text-xs border-b-2 transition-all border-transparent text-slate-400 hover:text-white";
        }
    });
}

export async function renderActiveTabContent(ev) {
    const container = document.getElementById("tab-content");
    if (!container) return;

    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center">Đang tải nội dung phân khu...</div>`;

    try {
        if (state.activeTab === 'timeline') {
            const feed = await apiGet(`newsfeed?eventId=${ev.id}&pageSize=50`);
            const btcPosts = feed.data.filter(p => p.author.role === 'EventOrganizer' || p.author.role === 'Admin');

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="md:col-span-2 space-y-4">
                        ${state.user.role === 'EventOrganizer' ? `
                            <div class="bg-slate-900 border border-brand-500/30 rounded-2xl p-5 space-y-3">
                                <h4 class="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                                    📢 Đăng thông báo mới (Chỉ dành cho BTC)
                                </h4>
                                <textarea id="btc-post-content" placeholder="Nội dung thông báo chương trình, quà tặng, khách mời..." rows="3" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"></textarea>
                                <div class="flex justify-end">
                                    <button onclick="createBtcPost('${ev.id}')" class="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all">
                                        Đăng Thông Báo
                                    </button>
                                </div>
                            </div>
                        ` : ''}

                        ${btcPosts.length > 0 ? btcPosts.map(post => `
                            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="h-10 w-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-bold text-brand-500">
                                            🎪
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-sm text-slate-200">Thông báo từ BTC</h4>
                                            <span class="text-[10px] text-slate-500">${new Date(post.createdAt).toLocaleString('vi-VN')} • Bởi ${post.author.fullName}</span>
                                        </div>
                                    </div>
                                </div>
                                <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">${post.content}</p>
                                
                                <div class="pt-3 border-t border-slate-800/60 flex items-center gap-4 text-xs">
                                    <button onclick="likePost('${post.id}')" class="flex items-center gap-1.5 text-slate-400 hover:text-slate-200">
                                        ❤️ <span>${post.likeCount} Thích</span>
                                    </button>
                                </div>
                            </div>
                        `).join('') : `<div class="text-center py-10 text-slate-500 text-xs">Chưa có thông báo nào từ BTC.</div>`}
                    </div>

                    <div class="space-y-4">
                        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                            <h3 class="font-bold text-xs uppercase text-slate-400 tracking-wider">Thông tin hoạt động</h3>
                            <div class="space-y-3 text-xs text-slate-300">
                                <div>
                                    <strong class="block text-slate-400 text-[10px] uppercase">Vị Trí Sân Khấu:</strong>
                                    Sảnh chính sự kiện
                                </div>
                                <div>
                                    <strong class="block text-slate-400 text-[10px] uppercase">Hoạt động nổi bật:</strong>
                                    ${ev.stages || 'Runway Cosplay, Giao lưu khách mời, Dj Anime'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

        } else if (state.activeTab === 'explore') {
            const feed = await apiGet(`newsfeed?eventId=${ev.id}&pageSize=50`);
            const explorePosts = feed.data.filter(p => p.author.role !== 'EventOrganizer' && p.author.role !== 'Admin');

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="md:col-span-2 space-y-4">
                        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                            <div class="flex items-center gap-3">
                                <img src="${state.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}" alt="user avatar" class="w-8 h-8 rounded-full object-cover">
                                <span class="text-xs text-slate-400">Đăng bài tự do lên góc Khám Phá!</span>
                            </div>
                            <textarea id="explore-post-text" placeholder="Hôm nay bạn thế nào? Hỏi han, tìm thợ nháy hay chia sẻ ảnh khoảnh khắc nào..." rows="2" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"></textarea>
                            
                            <div class="flex items-center justify-between pt-1">
                                <div class="flex items-center gap-2">
                                    <input type="file" id="explore-photo-file" onchange="uploadExplorePhoto()" class="hidden">
                                    <button onclick="document.getElementById('explore-photo-file').click()" class="text-xs text-slate-400 hover:text-brand-500 flex items-center gap-1 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                                        🖼️ Tải lên ảnh (Giới hạn 25MB)
                                    </button>
                                    <span id="attached-photo-indicator" class="text-[10px] text-emerald-400 hidden">✓ Đã tải ảnh lên</span>
                                    <input type="hidden" id="explore-photo-url">
                                </div>
                                <button onclick="createExplorePost('${ev.id}')" class="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all">
                                    Đăng bài viết
                                </button>
                            </div>
                        </div>

                        ${explorePosts.length > 0 ? explorePosts.map(post => `
                            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <img src="${post.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}" alt="${post.author.fullName}" class="w-10 h-10 rounded-full object-cover border-2 border-slate-800">
                                        <div>
                                            <h4 class="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                                                <span>${post.author.fullName}</span>
                                                <span class="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                                    ${post.author.role === 'ServiceProvider' ? 'Thợ Ảnh/Makeup' : 'User'}
                                                </span>
                                            </h4>
                                            <span class="text-[9px] text-slate-500 block">${new Date(post.createdAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>
                                    <button onclick="reportPost('${post.id}')" class="text-[11px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1">
                                        🚨 Báo cáo
                                    </button>
                                </div>

                                <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">${post.content}</p>

                                ${post.imageUrl ? `
                                    <div class="rounded-xl overflow-hidden max-h-[300px] border border-slate-800">
                                        <img src="${post.imageUrl.startsWith('/') ? 'http://localhost:5056' + post.imageUrl : post.imageUrl}" alt="Attached post" class="w-full h-full object-cover">
                                    </div>
                                ` : ''}

                                <div class="pt-3 border-t border-slate-800/60 flex items-center gap-4 text-xs">
                                    <button onclick="likePost('${post.id}')" class="flex items-center gap-1.5 text-slate-400 hover:text-slate-200">
                                        ❤️ <span>${post.likeCount} Thích</span>
                                    </button>
                                    <span class="text-slate-600">|</span>
                                    <button onclick="focusCommentInput('${post.id}')" class="text-slate-400 hover:text-slate-250 flex items-center gap-1.5">
                                        💬 <span>${post.commentCount} Bình luận</span>
                                    </button>
                                </div>

                                <div class="bg-slate-950/40 rounded-xl p-3 space-y-3 border border-slate-850 mt-2">
                                    <div id="comments-list-${post.id}" class="space-y-2 max-h-48 overflow-y-auto">
                                        <button onclick="loadCommentsForPost('${post.id}')" class="text-[10px] text-brand-400 hover:underline">Tải bình luận...</button>
                                    </div>
                                    <div class="flex gap-2">
                                        <input type="text" id="comment-input-${post.id}" placeholder="Viết bình luận..." class="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-brand-500">
                                        <button onclick="submitComment('${post.id}')" class="bg-brand-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg">Gửi</button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="text-center py-10 text-slate-500 text-xs">Chưa có bài viết nào ở phân khu Khám Phá. Hãy là người đăng đầu tiên!</div>
                        `}
                    </div>

                    <div class="space-y-4">
                        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                            <h3 class="font-bold text-xs uppercase text-slate-400 tracking-wider">💡 Nội Quy Khám Phá</h3>
                            <p class="text-xs text-slate-400 leading-relaxed font-normal">
                                Nơi mọi người có thể tự do kết bạn, tìm kiếm ekip chụp ảnh, chia sẻ những khoảnh khắc vui tươi tại lễ hội mà không bị giới hạn. Vui lòng không spam hoặc đăng ảnh không lành mạnh.
                            </p>
                        </div>
                    </div>
                </div>
            `;

        } else if (state.activeTab === 'booking') {
            const services = await apiGet(`services?eventId=${ev.id}`);

            container.innerHTML = `
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-sm text-slate-200">Danh sách thợ ảnh (PTG) & chuyên viên trang điểm (MUA) sẵn sàng tại Fes</h3>
                        <span class="text-xs text-slate-500">Tìm kiếm nhân sự cho layout cosplay của bạn</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${services.length > 0 ? services.map(prov => `
                            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-brand-500 transition-all duration-300">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-center gap-3">
                                        <img src="${prov.serviceProvider.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'}" alt="${prov.serviceProvider.fullName}" class="w-12 h-12 rounded-full object-cover border-2 border-brand-500">
                                        <div>
                                            <h4 class="font-bold text-base text-slate-100">${prov.serviceProvider.fullName}</h4>
                                            <span class="text-[10px] bg-slate-800 text-brand-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                ${prov.serviceProvider.role === 'ServiceProvider' ? '📸 THỢ ẢNH (PTG) / MAKEUP' : '💄 MAKEUP ARTIST (MUA)'}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <span class="block text-xs text-slate-500">Bảng giá từ:</span>
                                        <span class="font-bold text-brand-500">${prov.price.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>

                                <div>
                                    <h5 class="text-xs font-semibold text-slate-400 mb-1">Mô tả dịch vụ / Giới thiệu:</h5>
                                    <p class="text-xs text-slate-300 italic mb-3">"${prov.rules}"</p>
                                </div>

                                <div class="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                                    <div class="flex items-center gap-1 text-xs text-amber-400">
                                        ⭐ <span>5.0 (Review Demo)</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="openChatWith('${prov.serviceProvider.fullName}', '${prov.serviceProvider.id}', '${prov.serviceProvider.avatarUrl || ''}')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                            💬 Chat
                                        </button>
                                        <button onclick="triggerServiceBooking('${prov.id}')" class="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">
                                            Đặt Lịch Ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="col-span-2 text-center py-10 text-slate-500 text-xs">Chưa có thợ ảnh hay makeup artist nào cấu hình gói dịch vụ cho sự kiện này.</div>
                        `}
                    </div>
                </div>
            `;

        } else if (state.activeTab === 'booth') {
            const apps = await apiGet(`booths?eventId=${ev.id}`);
            const myApp = apps.find(b => b.serviceProviderId === state.user.id);
            
            let services = [];
            try {
                services = await apiGet(`services?eventId=${ev.id}`);
            } catch (e){}
            const myConfig = services.find(s => s.serviceProviderId === state.user.id);

            container.innerHTML = `
                <div class="max-w-xl mx-auto space-y-6">
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                        <div class="space-y-1">
                            <h3 class="font-bold text-base text-slate-100 flex items-center gap-1.5">
                                🏪 Đăng Ký Booth Gian Hàng Dịch Vụ
                            </h3>
                            <p class="text-xs text-slate-400">Nộp form xét duyệt trực tiếp cho BTC sự kiện để có vị trí booth và mở tính năng nhận lịch đặt.</p>
                        </div>

                        ${myApp ? `
                            <div class="bg-slate-950 p-4 rounded-xl border ${myApp.status === 'Approved' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'} space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-slate-400">Trạng thái hồ sơ:</span>
                                    <span class="text-xs font-bold uppercase ${myApp.status === 'Approved' ? 'text-emerald-400' : 'text-amber-400'}">
                                        ● ${myApp.status === 'Approved' ? 'ĐÃ DUYỆT' : 'ĐANG XÉT DUYỆT'}
                                    </span>
                                </div>
                                <div class="text-xs text-slate-300 space-y-1">
                                    <p>• <strong>Thương hiệu:</strong> ${myApp.name}</p>
                                    <p>• <strong>Phân loại:</strong> ${myApp.type === 'ptg' ? 'Thợ ảnh' : 'Make up'}</p>
                                    <p>• <strong>Yêu cầu booth:</strong> ${myApp.size}</p>
                                    <p>• <strong>Liên hệ:</strong> ${myApp.contact}</p>
                                </div>
                            </div>
                        ` : `
                            <form onsubmit="submitBoothApplication(event, '${ev.id}')" class="space-y-4">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Tên thương hiệu / Nghệ danh</label>
                                    <input type="text" id="booth-name" required placeholder="Ví dụ: Kaito Studio" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Loại dịch vụ</label>
                                        <select id="booth-type" class="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-500">
                                            <option value="ptg">Nhiếp ảnh gia (PTG)</option>
                                            <option value="mua">Trang điểm (MUA)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Chọn kích thước Booth</label>
                                        <select id="booth-size" class="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-500">
                                            <option value="Booth Tiêu Chuẩn 3x3m">Booth Tiêu Chuẩn 3x3m</option>
                                            <option value="Booth Đơn 2x2m">Booth Đơn 2x2m</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Số điện thoại liên hệ</label>
                                    <input type="text" id="booth-contact" required placeholder="Ví dụ: 0908888888" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Mô tả hoặc Link Portfolio ảnh đã chụp</label>
                                    <input type="text" id="booth-portfolio" placeholder="Ví dụ: Link Drive ảnh, Behance..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500">
                                </div>
                                <button type="submit" class="w-full bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20">
                                    Nộp Form Đăng Ký Booth
                                </button>
                            </form>
                        `}
                    </div>

                    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                        <div class="space-y-1">
                            <h3 class="font-bold text-base text-slate-100 flex items-center gap-1.5">
                                ⚙️ Cấu Hình Dịch Vụ Tiếp Nhận Lịch Đặt
                            </h3>
                            <p class="text-xs text-slate-400">Thiết lập đơn giá và quy tắc nhận lịch. Kích hoạt sau khi đơn đăng ký booth được duyệt.</p>
                        </div>

                        ${myApp && myApp.status === 'Approved' ? (
                            myConfig ? `
                                <div class="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-2 text-xs">
                                    <p class="font-bold text-emerald-400">✓ Dịch vụ đã được cấu hình thành công!</p>
                                    <p class="text-slate-350">• Đơn giá: <strong>${myConfig.price.toLocaleString('vi-VN')}đ</strong></p>
                                    <p class="text-slate-350">• Số lượng slot tối đa: <strong>${myConfig.maxSlots} slots</strong></p>
                                    <p class="text-slate-350">• Nội quy / Quy định: <em>"${myConfig.rules}"</em></p>
                                </div>
                            ` : `
                                <form onsubmit="submitServiceConfig(event, '${ev.id}')" class="space-y-4">
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Giá dịch vụ trọn gói (VNĐ)</label>
                                        <input type="number" id="service-price" required min="0" placeholder="Ví dụ: 300000" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Số slot nhận khách tối đa</label>
                                        <input type="number" id="service-slots" required min="1" placeholder="Ví dụ: 5" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Giới thiệu dịch vụ / Thiết bị / Nội quy</label>
                                        <textarea id="service-rules" required placeholder="Sony A7R4 + 85GM. Nhận ảnh sau 3 ngày..." rows="3" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"></textarea>
                                    </div>
                                    <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg">
                                        Kích hoạt & Hiển thị Dịch vụ
                                    </button>
                                </form>
                            `
                        ) : `
                            <div class="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center text-xs text-slate-500">
                                ⚠️ Bạn chỉ được thiết lập nhận lịch sau khi Ban Tổ Chức phê duyệt đơn đăng ký booth.
                            </div>
                        `}
                    </div>
                </div>
            `;

        } else if (state.activeTab === 'manage') {
            const apps = await apiGet(`booths?eventId=${ev.id}`);

            container.innerHTML = `
                <div class="space-y-6">
                    <div class="space-y-1">
                        <h3 class="font-bold text-base text-slate-100">Bảng điều khiển của Ban Tổ Chức</h3>
                        <p class="text-xs text-slate-400">Danh sách các bên dịch vụ đăng ký xin đặt Booth chụp ảnh/makeup tại sự kiện của bạn.</p>
                    </div>

                    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <table class="w-full text-left text-xs text-slate-300">
                            <thead class="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                                <tr>
                                    <th class="px-6 py-4">Tên nghệ danh/Studio</th>
                                    <th class="px-6 py-4">Phân loại</th>
                                    <th class="px-6 py-4">Kích thước</th>
                                    <th class="px-6 py-4">Liên hệ</th>
                                    <th class="px-6 py-4">Trạng thái</th>
                                    <th class="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800">
                                ${apps.length > 0 ? apps.map(app => `
                                    <tr class="hover:bg-slate-800/50">
                                        <td class="px-6 py-4 font-bold text-slate-200">${app.name || 'Studio ẩn danh'}</td>
                                        <td class="px-6 py-4 uppercase">${app.type === 'ptg' ? 'Thợ ảnh' : 'Make up'}</td>
                                        <td class="px-6 py-4">${app.size || 'Mặc định'}</td>
                                        <td class="px-6 py-4">${app.contact || 'N/A'}</td>
                                        <td class="px-6 py-4">
                                            <span class="px-2.5 py-1 rounded text-[10px] font-bold ${app.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">
                                                ${app.status === 'Approved' ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            ${app.status !== 'Approved' ? `
                                                <button onclick="approveBooth('${app.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-all">
                                                    Phê Duyệt
                                                </button>
                                            ` : `
                                                <span class="text-slate-500 text-[10px]">Đã duyệt hoàn thành</span>
                                            `}
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="6" class="px-6 py-8 text-center text-slate-500">Chưa có đơn đăng ký booth nào.</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `<div class="text-xs text-red-400 py-6 text-center">Lỗi tải dữ liệu: ${err.message}</div>`;
    }
}

// CREATE BTC NEWSFEED POST
export async function createBtcPost(eventId) {
    const content = document.getElementById("btc-post-content").value.trim();
    if (!content) {
        showToast("Vui lòng điền nội dung thông báo!", "warning");
        return;
    }

    try {
        await apiPost("posts", {
            authorId: state.user.id,
            eventId,
            content
        });
        showToast("Đã đăng thông báo BTC thành công!", "success");
        const ev = state.events.find(e => e.id === eventId);
        renderActiveTabContent(ev);
    } catch (err) {
        showToast(err.message, "error");
    }
}

// UPLOAD EXPLORE PHOTO
export async function uploadExplorePhoto() {
    const fileInput = document.getElementById("explore-photo-file");
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const headers = {};
    if (state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
    }

    try {
        showToast("Đang tải ảnh lên...", "success");
        const res = await fetch(`${API_BASE}/profile/portfolio/upload`, {
            method: "POST",
            headers,
            body: formData
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.Message || "Không thể tải ảnh lên.");
        }

        document.getElementById("explore-photo-url").value = data.imageUrl;
        document.getElementById("attached-photo-indicator").classList.remove("hidden");
        showToast("Tải ảnh portfolio/mẫu lên thành công!", "success");
    } catch (err) {
        showToast(err.message, "error");
    }
}

// CREATE EXPLORE COMMUNITY POST
export async function createExplorePost(eventId) {
    const content = document.getElementById("explore-post-text").value.trim();
    const imageUrl = document.getElementById("explore-photo-url").value;

    if (!content) {
        showToast("Vui lòng nhập nội dung bài viết!", "warning");
        return;
    }

    try {
        await apiPost("posts", {
            authorId: state.user.id,
            eventId,
            content,
            imageUrl: imageUrl || null
        });

        showToast("Đăng bài viết khám phá thành công!", "success");
        document.getElementById("explore-post-text").value = "";
        document.getElementById("explore-photo-url").value = "";
        document.getElementById("attached-photo-indicator").classList.add("hidden");

        const ev = state.events.find(e => e.id === eventId);
        renderActiveTabContent(ev);
    } catch (err) {
        showToast(err.message, "error");
    }
}

// TOGGLE LIKE
export async function likePost(postId) {
    try {
        const data = await apiPost(`posts/${postId}/like?userId=${state.user.id}`);
        showToast(data.action === 'Liked' ? "Đã thích bài viết!" : "Đã bỏ thích!");
        const ev = state.events.find(e => e.id === state.activeEventId);
        renderActiveTabContent(ev);
    } catch (err) {
        showToast(err.message, "error");
    }
}

// REPORT
export function reportPost(postId) {
    showToast("Báo cáo vi phạm đã được gửi lên hệ thống Admin để xử lý!", "success");
}

// LOAD COMMENTS
export async function loadCommentsForPost(postId) {
    const listDiv = document.getElementById(`comments-list-${postId}`);
    if (!listDiv) return;
    listDiv.innerHTML = `<div class="text-[9px] text-slate-500">Đang tải bình luận...</div>`;

    try {
        if (!window.localComments) window.localComments = {};
        if (!window.localComments[postId]) {
            window.localComments[postId] = [
                { author: "Yumi Chan", content: "Bài viết hay quá!" },
                { author: "Aria Cosplay", content: "Hẹn gặp mọi người tại Fes!" }
            ];
        }

        listDiv.innerHTML = window.localComments[postId].map(c => `
            <div class="text-[11px] text-slate-400 leading-relaxed">
                <strong class="text-slate-350">${c.author}:</strong> ${c.content}
            </div>
        `).join('');
    } catch (err) {
        listDiv.innerHTML = `<div class="text-[9px] text-red-400">Không tải được bình luận.</div>`;
    }
}

// SUBMIT COMMENT
export async function submitComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;

    try {
        await apiPost(`posts/${postId}/comments`, {
            userId: state.user.id,
            content
        });

        showToast("Đã gửi bình luận!", "success");
        input.value = "";
        
        if (!window.localComments) window.localComments = {};
        if (!window.localComments[postId]) window.localComments[postId] = [];
        window.localComments[postId].push({
            author: state.user.fullName,
            content: content
        });

        loadCommentsForPost(postId);
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function focusCommentInput(postId) {
    document.getElementById(`comment-input-${postId}`).focus();
    loadCommentsForPost(postId);
}

// BOOTH APPLICATIONS
export async function submitBoothApplication(e, eventId) {
    e.preventDefault();
    const name = document.getElementById("booth-name").value;
    const type = document.getElementById("booth-type").value;
    const size = document.getElementById("booth-size").value;
    const contact = document.getElementById("booth-contact").value;
    const portfolio = document.getElementById("booth-portfolio").value;

    try {
        await apiPost("booths/apply", {
            eventId,
            serviceProviderId: state.user.id,
            name,
            size,
            contact,
            portfolioLink: portfolio,
            type
        });

        showToast("Đã gửi hồ sơ đăng ký booth lên BTC. Vui lòng chờ phê duyệt!", "success");
        const ev = state.events.find(e => e.id === eventId);
        renderActiveTabContent(ev);
    } catch (err) {
        showToast(err.message, "error");
    }
}

// CONFIG SERVICE DETAILS
export async function submitServiceConfig(e, eventId) {
    e.preventDefault();
    const price = parseFloat(document.getElementById("service-price").value);
    const slots = parseInt(document.getElementById("service-slots").value);
    const rules = document.getElementById("service-rules").value;

    try {
        await apiPost("services/config", {
            serviceProviderId: state.user.id,
            eventId,
            price,
            maxSlots: slots,
            rules
        });

        showToast("Cấu hình dịch vụ thành công! Bạn hiện đã có tên trên danh sách đặt lịch.", "success");
        const ev = state.events.find(e => e.id === eventId);
        renderActiveTabContent(ev);
    } catch (err) {
        showToast(err.message, "error");
    }
}

// BTC APPROVE BOOTH APPS
export async function approveBooth(boothId) {
    try {
        await apiPut(`booths/${boothId}/review`, {
            reviewerId: state.user.id,
            decision: "Approve"
        });
        showToast("Đã phê duyệt booth gian hàng cho bên dịch vụ!", "success");
        const ev = state.events.find(e => e.id === state.activeEventId);
        renderActiveTabContent(ev);
    } catch (err) {
        showToast(err.message, "error");
    }
}
