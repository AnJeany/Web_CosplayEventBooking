import { state } from './state.js';
import { showToast } from './toast.js';
import { apiGet, apiPost, getImageUrl } from './api.js';

export function openChatWith(name, id, avatar) {
    state.activeChatWithUser = { name, id, avatar };
    
    // Cập nhật tiêu đề Chat Header có nút quay lại
    const header = document.getElementById("chat-modal-header");
    if (header) {
        header.innerHTML = `
            <div class="flex items-center gap-3">
                <button onclick="openChatHistory()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors mr-1">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <img id="chat-recipient-avatar" src="${getImageUrl(avatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}" alt="avatar" class="w-10 h-10 rounded-full object-cover border-2 border-brand-500">
                <div>
                    <h4 id="chat-recipient-name" class="font-bold text-sm text-slate-100">${name}</h4>
                    <span id="chat-recipient-role" class="text-[10px] text-brand-400 uppercase font-medium">ĐỐI TÁC TRỰC TUYẾN</span>
                </div>
            </div>
            <button onclick="closeChat()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
    }

    // Hiển thị khung nhập tin nhắn
    const footer = document.getElementById("chat-modal-footer");
    if (footer) footer.classList.remove("hidden");

    state.chats = [];
    state.lastMessageId = null;

    renderChatMessages();
    document.getElementById("chat-modal").classList.remove('hidden');

    if (state.chatPollInterval) clearInterval(state.chatPollInterval);
    pollNewMessages();
    state.chatPollInterval = setInterval(pollNewMessages, 4000);
}

export function getConversationId(id1, id2) {
    const arr = [id1, id2];
    arr.sort();
    return `${arr[0]}_${arr[1]}`;
}

export async function pollNewMessages() {
    if (!state.activeChatWithUser || !state.token) return;

    const convId = getConversationId(state.user.id, state.activeChatWithUser.id);
    let url = `messages/poll/${convId}`;
    if (state.lastMessageId) {
        url += `?lastMessageId=${state.lastMessageId}`;
    }

    try {
        const data = await apiGet(url);
        if (data.newMessageCount > 0) {
            state.chats = [...state.chats, ...data.messages];
            state.lastMessageId = data.messages[data.messages.length - 1].id;
            renderChatMessages();
        }
    } catch (err) {
        console.error("Poller error:", err);
    }
}

export function renderChatMessages() {
    const chatBox = document.getElementById("chat-messages");
    if (!chatBox) return;

    if (state.chats.length === 0) {
        chatBox.innerHTML = `<div class="text-[10px] text-slate-500 text-center py-4">Bắt đầu cuộc hội thoại bằng tin nhắn đầu tiên.</div>`;
        return;
    }

    chatBox.innerHTML = state.chats.map(msg => `
        <div class="flex ${msg.senderId === state.user.id ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[80%] rounded-2xl p-3 text-xs ${msg.senderId === state.user.id ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-200'}">
                <p class="leading-relaxed whitespace-pre-wrap">${msg.content}</p>
                <span class="block text-[8px] text-right mt-1 opacity-70">${new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    `).join('');
    chatBox.scrollTop = chatBox.scrollHeight;
}

export function handleChatKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

export async function sendMessage() {
    const input = document.getElementById("chat-input");
    const content = input.value.trim();
    if (!content || !state.activeChatWithUser) return;

    try {
        const res = await apiPost("messages", {
            senderId: state.user.id,
            receiverId: state.activeChatWithUser.id,
            content
        });

        state.chats.push({
            id: res.id,
            senderId: state.user.id,
            receiverId: state.activeChatWithUser.id,
            content,
            createdAt: res.createdAt
        });
        state.lastMessageId = res.id;

        input.value = "";
        renderChatMessages();
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function closeChat() {
    document.getElementById("chat-modal").classList.add('hidden');
    state.activeChatWithUser = null;
    if (state.chatPollInterval) {
        clearInterval(state.chatPollInterval);
        state.chatPollInterval = null;
    }
}

export async function openChatHistory() {
    if (!state.user) return;
    
    state.activeChatWithUser = null;
    if (state.chatPollInterval) {
        clearInterval(state.chatPollInterval);
        state.chatPollInterval = null;
    }

    // Cập nhật tiêu đề là Hộp Thư Tin Nhắn
    const header = document.getElementById("chat-modal-header");
    if (header) {
        header.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white text-xs">💬</div>
                <h4 class="font-bold text-sm text-slate-100">Hộp Thư Tin Nhắn</h4>
            </div>
            <button onclick="closeChat()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
    }

    // Ẩn thanh input chat
    const footer = document.getElementById("chat-modal-footer");
    if (footer) footer.classList.add("hidden");

    document.getElementById("chat-modal").classList.remove('hidden');
    
    // Tải danh sách cuộc trò chuyện
    await renderConversationList();
}

export async function renderConversationList() {
    const chatBox = document.getElementById("chat-messages");
    if (!chatBox) return;

    chatBox.innerHTML = `<div class="text-[10px] text-slate-500 text-center py-4">Đang tải danh sách cuộc trò chuyện...</div>`;

    try {
        const conversations = await apiGet("messages/conversations");
        if (conversations.length === 0) {
            chatBox.innerHTML = `<div class="text-[10px] text-slate-500 text-center py-4">Chưa có cuộc trò chuyện nào. Hãy kết nối hoặc chat với PTG/MUA/BTC để bắt đầu!</div>`;
            return;
        }

        chatBox.innerHTML = `
            <div class="space-y-2">
                ${conversations.map(conv => {
                    const avatar = getImageUrl(conv.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
                    const timeStr = new Date(conv.lastMessageTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const nameEscaped = conv.fullName.replace(/'/g, "\\'");
                    
                    let roleBadge = "User";
                    if (conv.role === 'ServiceProvider') roleBadge = "Dịch Vụ";
                    if (conv.role === 'EventOrganizer') roleBadge = "BTC";
                    if (conv.role === 'Admin') roleBadge = "Admin";

                    return `
                        <div onclick="openChatWith('${nameEscaped}', '${conv.userId}', '${conv.avatarUrl || ''}')" class="flex items-center gap-3 p-3 bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800 rounded-xl cursor-pointer transition-all duration-200">
                            <img src="${avatar}" alt="${conv.fullName}" class="w-9 h-9 rounded-full object-cover border border-slate-700">
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-baseline mb-0.5">
                                    <h4 class="font-bold text-xs text-slate-200 truncate flex items-center gap-1.5">
                                        <span>${conv.fullName}</span>
                                        <span class="text-[7px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-bold uppercase tracking-wider">${roleBadge}</span>
                                    </h4>
                                    <span class="text-[8px] text-slate-500 shrink-0">${timeStr}</span>
                                </div>
                                <p class="text-[10px] text-slate-400 truncate mt-0.5">${conv.lastMessage}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (err) {
        chatBox.innerHTML = `<div class="text-[10px] text-red-400 text-center py-4">Lỗi tải danh sách: ${err.message}</div>`;
    }
}
