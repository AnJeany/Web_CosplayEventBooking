export const state = {
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user")) || null,
    activeEventId: null,
    activeTab: 'timeline',
    events: [],
    newsfeed: [],
    serviceProviders: [],
    boothApplications: [],
    tickets: [],
    bookings: [],
    chats: [],
    activeChatWithUser: null,
    chatPollInterval: null,
    lastMessageId: null
};

export function saveAuth(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
    state.token = null;
    state.user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (state.chatPollInterval) {
        clearInterval(state.chatPollInterval);
        state.chatPollInterval = null;
    }
}
