import { state } from './state.js';
import { showToast } from './toast.js';
import { apiGet, apiPost, apiPut, getImageUrl } from './api.js';
import { openChatWith } from './chat.js';

let pendingTransaction = null;
let selectedServicePost = null;

export async function loadMyCounts() {
    if (!state.token || !state.user) return;
    try {
        let ticketCount = 0;
        try {
            const tickets = await apiGet(`tickets?customerId=${state.user.id}`);
            ticketCount = tickets.length;
        } catch (e) {
            console.error(e);
        }

        let bookingCount = 0;
        try {
            if (state.user.role === 'ServiceProvider') {
                const bookingsAsProvider = await apiGet(`bookings?serviceProviderId=${state.user.id}`);
                bookingCount = bookingsAsProvider.length;
            } else {
                const bookingsAsCustomer = await apiGet(`bookings?customerId=${state.user.id}`);
                bookingCount = bookingsAsCustomer.length;
            }
        } catch (e) {
            console.error(e);
        }

        const badge = document.getElementById("nav-ticket-count");
        if (badge) badge.innerText = ticketCount + bookingCount;
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
        ticketTypeId: null,
        code: `BKCOS_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };

    const typeContainer = document.getElementById("payment-ticket-type-select-container");
    const select = document.getElementById("payment-ticket-type-select");

    if (ev.ticketTypes && ev.ticketTypes.length > 0) {
        typeContainer.classList.remove("hidden");
        select.innerHTML = ev.ticketTypes.map(tt => `
            <option value="${tt.id}" data-price="${tt.price}">${tt.name} (${tt.price.toLocaleString('vi-VN')}đ) - SL còn: ${tt.totalTickets - (tt.ticketsSold || 0)}</option>
        `).join('');
        
        // select first option
        const firstType = ev.ticketTypes[0];
        pendingTransaction.price = firstType.price;
        pendingTransaction.ticketTypeId = firstType.id;
        pendingTransaction.name = `Vé tham dự: ${ev.title} [${firstType.name}]`;
    } else {
        typeContainer.classList.add("hidden");
        select.innerHTML = "";
    }

    document.getElementById("pay-item-name").innerText = pendingTransaction.name;
    document.getElementById("pay-recipient").innerText = pendingTransaction.recipient;
    document.getElementById("pay-amount").innerText = pendingTransaction.price > 0 ? `${pendingTransaction.price.toLocaleString('vi-VN')}đ` : 'Miễn Phí (Đăng ký)';
    document.getElementById("pay-code").innerText = pendingTransaction.code;

    document.getElementById("payment-modal").classList.remove('hidden');
}

export function handlePaymentTicketTypeChange() {
    if (!pendingTransaction || pendingTransaction.type !== 'ticket') return;
    const select = document.getElementById("payment-ticket-type-select");
    const option = select.selectedOptions[0];
    if (!option) return;

    const price = parseFloat(option.getAttribute("data-price") || 0);
    const typeName = option.text.split('(')[0].trim();
    const ev = state.events.find(e => e.id === pendingTransaction.eventId);

    pendingTransaction.price = price;
    pendingTransaction.ticketTypeId = select.value;
    pendingTransaction.name = `Vé tham dự: ${ev.title} [${typeName}]`;
    
    document.getElementById("pay-item-name").innerText = pendingTransaction.name;
    document.getElementById("pay-amount").innerText = price > 0 ? `${price.toLocaleString('vi-VN')}đ` : 'Miễn Phí (Đăng ký)';
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
        closeBookingConfigModal();
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
                ticketTypeId: pendingTransaction.ticketTypeId || null,
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

        try {
            tickets = await apiGet(`tickets?customerId=${state.user.id}`);
        } catch (e) {
            console.error("Failed to load tickets:", e);
        }

        if (state.user.role === 'ServiceProvider') {
            bookings = await apiGet(`bookings?serviceProviderId=${state.user.id}`);
        } else {
            bookings = await apiGet(`bookings?customerId=${state.user.id}`);
        }

        listTickets.innerHTML = tickets.length > 0 ? tickets.map(t => `
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                    <h5 class="font-bold text-xs text-slate-100">
                        ${t.event.title}
                        ${t.ticketType ? `<span class="ml-1.5 text-[9px] bg-brand-500/20 text-brand-400 border border-brand-500/30 px-1.5 py-0.5 rounded font-bold uppercase">${t.ticketType.name}</span>` : ''}
                    </h5>
                    <p class="text-[10px] text-slate-500">Mã vé: ${t.qrCode} | Giá: ${t.ticketType ? `${t.ticketType.price.toLocaleString('vi-VN')}đ` : (t.event.ticketPrice > 0 ? `${t.event.ticketPrice.toLocaleString('vi-VN')}đ` : 'Miễn Phí')}</p>
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

            let contractButton = '';
            if (b.status === 'Paid' || b.status === 'Accepted') {
                contractButton = `
                    <button onclick="window.viewContract('${b.id}')" class="bg-slate-850 hover:bg-slate-800 text-amber-400 hover:text-amber-300 text-[10px] font-semibold px-2.5 py-1 rounded transition-colors flex items-center gap-1 mt-2">
                        📜 Xem Hợp Đồng
                    </button>
                `;
            }

            const otherUser = state.user.role === 'Customer' ? b.servicePost.serviceProvider : b.customer;
            return `
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <div>
                            <h5 class="font-bold text-xs text-slate-100">${otherUser.fullName}</h5>
                            <p class="text-[9px] text-slate-500">${b.servicePost.event.title}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="openChatWith('${otherUser.fullName.replace(/'/g, "\\'")}', '${otherUser.id}', '${getImageUrl(otherUser.avatarUrl) || ''}')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold px-2.5 py-1 rounded transition-colors flex items-center gap-1">
                                💬 Chat
                            </button>
                            <span class="px-2 py-0.5 rounded text-[9px] font-bold ${statusColor} uppercase">
                                ${b.status}
                            </span>
                        </div>
                    </div>
                    <div class="text-[10px] text-slate-400 border-t border-slate-855 pt-2 space-y-1">
                        <p>🕒 <strong>Thời gian:</strong> ${startHour} - ${endHour} ngày ${dateStr}</p>
                        <p>💵 <strong>Giá dịch vụ:</strong> ${b.servicePost.price.toLocaleString('vi-VN')}đ</p>
                        ${b.qrCode ? `<p>📱 <strong>Mã QR Lịch Book:</strong> <code class="bg-slate-900 px-1 text-[9px] text-brand-400">${b.qrCode}</code></p>` : ''}
                    </div>
                    <div class="flex gap-2">
                        ${actionButtons}
                        ${contractButton}
                    </div>
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

function amountToVietnameseWords(amount) {
    if (amount === 0) return "Không";
    const n = Math.floor(amount);
    if (n === 50000) return "Năm mươi nghìn";
    if (n === 100000) return "Một trăm nghìn";
    if (n === 200000) return "Hai trăm nghìn";
    if (n === 300000) return "Ba trăm nghìn";
    if (n === 400000) return "Bốn trăm nghìn";
    if (n === 500000) return "Năm trăm nghìn";
    if (n === 600000) return "Sáu trăm nghìn";
    if (n === 700000) return "Bảy trăm nghìn";
    if (n === 800000) return "Tám trăm nghìn";
    if (n === 900000) return "Chín trăm nghìn";
    if (n === 1000000) return "Một triệu";
    if (n === 1500000) return "Một triệu năm trăm nghìn";
    if (n === 2000000) return "Hai triệu";
    if (n === 3000000) return "Ba triệu";
    if (n === 5000000) return "Năm triệu";
    return amount.toLocaleString('vi-VN');
}

export async function viewContract(bookingId) {
    try {
        let bookings = [];
        if (state.user.role === 'ServiceProvider') {
            bookings = await apiGet(`bookings?serviceProviderId=${state.user.id}`);
        } else {
            bookings = await apiGet(`bookings?customerId=${state.user.id}`);
        }
        const b = bookings.find(item => item.id === bookingId);
        if (!b) {
            showToast("Không tìm thấy thông tin lịch đặt.", "error");
            return;
        }

        const times = b.timeSlot.split('/');
        const dateStr = times[0] ? new Date(times[0]).toLocaleDateString('vi-VN') : '';
        const startHour = times[0] ? new Date(times[0]).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
        const endHour = times[1] ? new Date(times[1]).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

        const customerName = b.customer.fullName;
        const customerEmail = b.customer.email || 'N/A';
        const providerName = b.servicePost.serviceProvider.fullName;
        const providerEmail = b.servicePost.serviceProvider.email || 'N/A';
        const eventTitle = b.servicePost.event.title;
        const eventLocation = b.servicePost.event.location;
        const price = b.servicePost.price;
        const rules = b.servicePost.rules || 'Thực hiện theo thỏa thuận trực tiếp.';

        const contractArea = document.getElementById("contract-print-area");
        contractArea.innerHTML = `
            <div style="font-family: 'Times New Roman', Times, serif; color: #111; line-height: 1.6; max-width: 100%;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h3 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0; tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                    <h4 style="font-size: 12px; font-weight: bold; margin: 4px 0 0 0;">Độc lập - Tự do - Hạnh phúc</h4>
                    <div style="width: 120px; height: 1.5px; background: #111; margin: 8px auto 0 auto;"></div>
                </div>

                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0;">HỢP ĐỒNG CUNG CẤP DỊCH VỤ DỰ ÁN</h2>
                    <span style="font-size: 11px; font-style: italic; color: #444;">Số: HĐDV-${b.id.substring(0, 8).toUpperCase()}-COS</span>
                </div>

                <p style="text-indent: 20px; margin: 0 0 16px 0;">Căn cứ Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam số 91/2015/QH13 ngày 24/11/2015 và các văn bản hướng dẫn thi hành hiện hành.</p>
                <p style="text-indent: 20px; margin: 0 0 20px 0;">Hôm nay, ngày ${new Date().toLocaleDateString('vi-VN')}, tại hệ thống Web Cosplay Booking, chúng tôi gồm các bên dưới đây ký kết Hợp đồng cung cấp dịch vụ:</p>

                <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">BÊN A: BÊN KHÁCH HÀNG (SỬ DỤNG DỊCH VỤ)</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="width: 150px; padding: 4px 0;">Họ và tên:</td>
                            <td style="font-weight: bold;">${customerName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;">Địa chỉ email:</td>
                            <td>${customerEmail}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;">Vai trò hệ thống:</td>
                            <td>Khách tham quan sự kiện / Cosplayer</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 24px;">
                    <h4 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">BÊN B: BÊN NHÀ CUNG CẤP (THỰC HIỆN DỊCH VỤ)</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="width: 150px; padding: 4px 0;">Họ và tên nghệ danh:</td>
                            <td style="font-weight: bold;">${providerName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;">Địa chỉ email:</td>
                            <td>${providerEmail}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;">Vai trò hệ thống:</td>
                            <td>Nhà cung cấp dịch vụ (PTG / Makeup Artist)</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 24px;">
                    <h4 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">ĐIỀU 1: PHẠM VI CÔNG VIỆC VÀ NỘI DUNG DỊCH VỤ</h4>
                    <p style="margin: 0 0 8px 0; text-indent: 15px;">Bên B đồng ý cung cấp dịch vụ chuyên môn nhiếp ảnh/makeup cho Bên A tại lễ hội/sự kiện sau:</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0 12px 15px;">
                        <tr>
                            <td style="width: 135px; padding: 4px 0; color: #444;">Tên sự kiện:</td>
                            <td style="font-weight: bold;">${eventTitle}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #444;">Địa điểm tổ chức:</td>
                            <td>${eventLocation}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #444;">Khung giờ làm việc:</td>
                            <td style="font-weight: bold; color: #0284c7;">${startHour} - ${endHour} ngày ${dateStr}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #444;">Nội quy và cam kết:</td>
                            <td style="font-style: italic;">"${rules}"</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 24px;">
                    <h4 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</h4>
                    <p style="margin: 0 0 6px 0; text-indent: 15px;">2.1. Đơn giá trọn gói của lịch đặt dịch vụ này là: <strong style="color: #b91c1c; font-size: 14px;">${price.toLocaleString('vi-VN')} VNĐ</strong> (Bằng chữ: ${amountToVietnameseWords(price)} đồng chẵn).</p>
                    <p style="margin: 0 0 6px 0; text-indent: 15px;">2.2. Phương thức thanh toán: Thanh toán trực tuyến qua cổng ký quỹ Demo của Web Cosplay Booking.</p>
                    <p style="margin: 0 0 6px 0; text-indent: 15px;">2.3. Tình trạng thanh toán: <strong style="color: #16a34a; text-transform: uppercase;">ĐÃ THANH TOÁN ĐỦ 100% KÝ QUỸ</strong> (Giao dịch tự động xác thực bởi hệ thống).</p>
                </div>

                <div style="margin-bottom: 30px;">
                    <h4 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">ĐIỀU 3: ĐIỀU KHOẢN CHUNG VÀ CAM KẾT CHẤT LƯỢNG</h4>
                    <p style="margin: 0 0 6px 0; text-indent: 15px;">3.1. Bên B cam kết có mặt đúng giờ hẹn, mang đầy đủ thiết bị chuyên dụng và thực hiện dịch vụ tận tâm, lịch sự.</p>
                    <p style="margin: 0 0 6px 0; text-indent: 15px;">3.2. Bên A có trách nhiệm phối hợp, thông báo trước layout cosplay để Bên B chuẩn bị tốt nhất.</p>
                    <p style="margin: 0 0 6px 0; text-indent: 15px;">3.3. Hợp đồng điện tử này có giá trị pháp lý tương đương hợp đồng văn bản và có hiệu lực ngay sau khi giao dịch ký quỹ được xác nhận.</p>
                </div>

                <div style="position: relative; margin-top: 50px; display: flex; justify-content: space-between; font-size: 13px;">
                    <div style="position: absolute; left: 50%; top: -20px; transform: translate(-50%, 0) rotate(-15deg); border: 3px double #16a34a; border-radius: 8px; color: #16a34a; font-weight: 950; font-size: 16px; padding: 6px 14px; text-transform: uppercase; letter-spacing: 2px; background: rgba(255,255,255,0.9); pointer-events: none; opacity: 0.85;">
                        ✔ ĐÃ THANH TOÁN
                    </div>

                    <div style="text-align: center; width: 45%;">
                        <span style="font-weight: bold;">ĐẠI DIỆN BÊN A</span><br>
                        <span style="font-style: italic; font-size: 11px;">(Ký ghi rõ họ tên)</span>
                        <div style="height: 60px;"></div>
                        <span style="font-weight: bold; color: #555;">${customerName}</span>
                    </div>

                    <div style="text-align: center; width: 45%;">
                        <span style="font-weight: bold;">ĐẠI DIỆN BÊN B</span><br>
                        <span style="font-style: italic; font-size: 11px;">(Ký ghi rõ họ tên)</span>
                        <div style="height: 60px;"></div>
                        <span style="font-weight: bold; color: #555;">${providerName}</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("contract-modal").classList.remove("hidden");
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function printContract() {
    window.print();
}
