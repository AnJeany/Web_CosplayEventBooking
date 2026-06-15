import { state } from './state.js';
import { showToast } from './toast.js';
import { apiGet, apiPost } from './api.js';

export function openChatWith(name, id, avatar) {
    state.activeChatWithUser = { name, id, avatar };
    document.getElementById("chat-recipient-name").innerText = name;
    document.getElementById("chat-recipient-role").innerText = "ĐỐI TÁC TRỰC TUYẾN";
    document.getElementById("chat-recipient-avatar").src = avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150";

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
            state.chats = [...state.chats, ...data.Messages];
            state.lastMessageId = data.Messages[data.Messages.length - 1].id;
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

export function openChatHistory() {
    if (!state.user) return;
    const targetId = state.user.role === 'Customer' 
        ? "22222222-2222-2222-2222-222222222222" 
        : "11111111-1111-1111-1111-111111111111"; 
    const targetName = state.user.role === 'Customer' ? "Kaito Photography" : "Aria Cosplay";
    openChatWith(targetName, targetId, "");
}
