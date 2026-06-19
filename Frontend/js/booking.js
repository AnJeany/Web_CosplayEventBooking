import { state } from './state.js';
import { showToast } from './toast.js';
import { apiGet, apiPost, apiPut } from './api.js';

let pendingTransaction = null;
let selectedServicePost = null;

export async function loadMyCounts() {
    if (!state.token || !state.user) return;
    try {
        const tickets = await apiGet(`tickets?customerId=${state.user.id}`);
        const bookingsAsCustomer = await apiGet(`bookings?customerId=${state.user.id}`);
        let bookingsAsProvider = [];
        if (state.user.role === 'ServiceProvider') {
            bookingsAsProvider = await apiGet(`bookings?serviceProviderId=${state.user.id}`);
        }
        const badge = document.getElementById("nav-ticket-count");
        if (badge) badge.innerText = tickets.length + bookingsAsCustomer.length + bookingsAsProvider.length;
    } catch (err) {
        console.error(err);
    }
}

export function triggerTicketPurchase(eventId) {
    const ev = state.events.find(e => e.id === eventId);
    if (!ev) return;
    
    pendingTransaction = {
        type: 'ticket',
        eventId: ev.id,
        name: `Vé tham dự: ${ev.title}`,
        recipient: "Ban Tổ Chức Sự Kiện",
        price: ev.ticketPrice,
        code: `BKCOS_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };

    document.getElementById("pay-item-name").innerText = pendingTransaction.name;
    document.getElementById("pay-recipient").innerText = pendingTransaction.recipient;
    document.getElementById("pay-amount").innerText = ev.ticketPrice > 0 ? `${ev.ticketPrice.toLocaleString('vi-VN')}đ` : 'Miễn Phí (Đăng ký)';
    document.getElementById("pay-code").innerText = pendingTransaction.code;

    document.getElementById("payment-modal").classList.remove('hidden');
}

export async function triggerServiceBooking(servicePostId) {
    try {
        const services = await apiGet(`services?eventId=${state.activeEventId}`);
        const sp = services.find(s => s.id === servicePostId);
        if (!sp) return;

        selectedServicePost = sp;
        document.getElementById("booking-config-modal").classList.remove("hidden");
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function closeBookingConfigModal() {
    document.getElementById("booking-config-modal").classList.add("hidden");
    selectedServicePost = null;
}

export async function submitBookingConfig() {
    const date = document.getElementById("booking-date").value;
    const startTime = document.getElementById("booking-start-time").value;
    const endTime = document.getElementById("booking-end-time").value;
    const style = document.getElementById("booking-style").value || "Cosplay tự do";

    if (!date || !startTime || !endTime) {
        showToast("Vui lòng điền đầy đủ ngày giờ đặt!", "warning");
        return;
    }

    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;
    const timeSlot = `${startISO}/${endISO}`;

    try {
        showToast("Đang tạo booking...", "success");
        const res = await apiPost("bookings", {
            customerId: state.user.id,
            servicePostId: selectedServicePost.id,
            timeSlot
        });

        closeBookingConfigModal();

        pendingTransaction = {
            type: 'booking',
            bookingId: res.id,
            eventId: selectedServicePost.eventId,
            name: `Dịch vụ chụp/makeup: ${selectedServicePost.serviceProvider.fullName}`,
            recipient: selectedServicePost.serviceProvider.fullName,
            price: selectedServicePost.price,
            code: `BKCOS_${res.id.substring(0, 6).toUpperCase()}`
        };

        document.getElementById("pay-item-name").innerText = pendingTransaction.name;
        document.getElementById("pay-recipient").innerText = pendingTransaction.recipient;
        document.getElementById("pay-amount").innerText = `${selectedServicePost.price.toLocaleString('vi-VN')}đ`;
        document.getElementById("pay-code").innerText = pendingTransaction.code;

        document.getElementById("payment-modal").classList.remove('hidden');
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function closePaymentModal() {
    document.getElementById("payment-modal").classList.add('hidden');
    pendingTransaction = null;
}

export async function executeDemoPayment() {
    if (!pendingTransaction) return;

    try {
        if (pendingTransaction.type === 'ticket') {
            await apiPost("tickets/purchase", {
                eventId: pendingTransaction.eventId,
                customerId: state.user.id,
                quantity: 1
            });
            showToast("Mua vé sự kiện thành công! Bạn có thể xem vé trong góc cá nhân.", "success");
        } else {
            await apiPost(`payments/mock/${pendingTransaction.bookingId}`);
            showToast("Thanh toán booking thành công! Ekip đã được thông báo lịch hẹn.", "success");
        }

        closePaymentModal();
        loadMyCounts();
        
        if (state.activeEventId) {
            if (window.dispatcher && window.dispatcher.refreshActiveTab) {
                window.dispatcher.refreshActiveTab();
            }
        }
    } catch (err) {
        showToast(err.message, "error");
    }
}

export async function openMyTickets() {
    const listTickets = document.getElementById("user-tickets-list");
    const listBookings = document.getElementById("user-bookings-list");
    if (!listTickets || !listBookings) return;

    listTickets.innerHTML = `<div class="text-xs text-slate-500 py-2">Đang tải danh sách vé...</div>`;
    listBookings.innerHTML = `<div class="text-xs text-slate-500 py-2">Đang tải danh sách lịch đặt...</div>`;

    document.getElementById("tickets-modal").classList.remove('hidden');

    try {
        let tickets = [];
        let bookings = [];

        if (state.user.role === 'Customer') {
            tickets = await apiGet(`tickets?customerId=${state.user.id}`);
            bookings = await apiGet(`bookings?customerId=${state.user.id}`);
        } else {
            bookings = await apiGet(`bookings?serviceProviderId=${state.user.id}`);
        }

        listTickets.innerHTML = tickets.length > 0 ? tickets.map(t => `
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                    <h5 class="font-bold text-xs text-slate-100">${t.event.title}</h5>
                    <p class="text-[10px] text-slate-500">Mã vé: ${t.qrCode} | Giá: ${t.event.ticketPrice > 0 ? `${t.event.ticketPrice.toLocaleString('vi-VN')}đ` : 'Miễn Phí'}</p>
                    <p class="text-[9px] text-slate-400">🕒 Sự kiện diễn ra: ${new Date(t.event.startTime).toLocaleDateString('vi-VN')}</p>
                </div>
                <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    ${t.status === 'Valid' ? 'Có hiệu lực' : 'Đã checkin'}
                </span>
            </div>
        `).join('') : '<div class="text-xs text-slate-500 py-2">Chưa đăng ký vé nào.</div>';

        listBookings.innerHTML = bookings.length > 0 ? bookings.map(b => {
            const times = b.timeSlot.split('/');
            const dateStr = times[0] ? new Date(times[0]).toLocaleDateString('vi-VN') : '';
            const startHour = times[0] ? new Date(times[0]).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
            const endHour = times[1] ? new Date(times[1]).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
            
            let statusColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
            if (b.status === 'Paid') statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
            if (b.status === 'Accepted') statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            if (b.status === 'Rejected' || b.status === 'Cancelled') statusColor = "bg-red-500/10 text-red-400 border-red-500/20";
            
            let actionButtons = '';
            if (state.user.role === 'ServiceProvider' && b.status === 'Paid') {
                actionButtons = `
                    <div class="flex gap-2 mt-2">
                        <button onclick="reviewBookingStatus('${b.id}', 'Accepted')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1 rounded">Duyệt Nhận Lịch</button>
                        <button onclick="reviewBookingStatus('${b.id}', 'Rejected')" class="bg-red-650 hover:bg-red-750 text-white font-bold text-[9px] px-2.5 py-1 rounded">Từ Chối</button>
                    </div>
                `;
            }

            return `
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <div>
                            <h5 class="font-bold text-xs text-slate-100">${state.user.role === 'Customer' ? b.servicePost.serviceProvider.fullName : b.customer.fullName}</h5>
                            <p class="text-[9px] text-slate-500">${b.servicePost.event.title}</p>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[9px] font-bold ${statusColor} uppercase">
                            ${b.status}
                        </span>
                    </div>
                    <div class="text-[10px] text-slate-400 border-t border-slate-855 pt-2 space-y-1">
                        <p>🕒 <strong>Thời gian:</strong> ${startHour} - ${endHour} ngày ${dateStr}</p>
                        <p>💵 <strong>Giá dịch vụ:</strong> ${b.servicePost.price.toLocaleString('vi-VN')}đ</p>
                        ${b.qrCode ? `<p>📱 <strong>Mã QR Lịch Book:</strong> <code class="bg-slate-900 px-1 text-[9px] text-brand-400">${b.qrCode}</code></p>` : ''}
                    </div>
                    ${actionButtons}
                </div>
            `;
        }).join('') : '<div class="text-xs text-slate-500 py-2">Chưa đặt lịch dịch vụ nào.</div>';

    } catch (err) {
        showToast(err.message, "error");
    }
}

export async function reviewBookingStatus(bookingId, decision) {
    try {
        await apiPut(`bookings/${bookingId}/status`, {
            newStatus: decision
        });
        showToast(decision === 'Accepted' ? "Đã chấp nhận lịch book của khách!" : "Đã từ chối lịch book.");
        openMyTickets();
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function closeMyTickets() {
    document.getElementById("tickets-modal").classList.add('hidden');
}

export function payPendingBooking(bookingId, providerName, price) {
    document.getElementById("tickets-modal").classList.add('hidden');

    pendingTransaction = {
        type: 'booking',
        bookingId: bookingId,
        name: `Dịch vụ chụp/makeup: ${providerName}`,
        recipient: providerName,
        price: price,
        code: `BKCOS_${bookingId.substring(0, 6).toUpperCase()}`
    };

    document.getElementById("pay-item-name").innerText = pendingTransaction.name;
    document.getElementById("pay-recipient").innerText = pendingTransaction.recipient;
    document.getElementById("pay-amount").innerText = `${price.toLocaleString('vi-VN')}đ`;
    document.getElementById("pay-code").innerText = pendingTransaction.code;

    document.getElementById("payment-modal").classList.remove('hidden');
}
