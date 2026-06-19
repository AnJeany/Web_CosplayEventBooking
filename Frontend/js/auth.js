import { state, saveAuth, clearAuth } from './state.js';
import { showToast } from './toast.js';
import { API_BASE } from './api.js';

export function toggleAuthTab(tab) {
    const btnLogin = document.getElementById("btn-tab-login");
    const btnRegister = document.getElementById("btn-tab-register");
    const formLogin = document.getElementById("login-form");
    const formRegister = document.getElementById("register-form");

    if (tab === 'login') {
        btnLogin.className = "flex-1 pb-3 text-sm font-semibold border-b-2 border-brand-500 text-brand-400";
        btnRegister.className = "flex-1 pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white";
        formLogin.classList.remove("hidden");
        formRegister.classList.add("hidden");
    } else {
        btnRegister.className = "flex-1 pb-3 text-sm font-semibold border-b-2 border-brand-500 text-brand-400";
        btnLogin.className = "flex-1 pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white";
        formRegister.classList.remove("hidden");
        formLogin.classList.add("hidden");
    }
}

export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || data.Message || "Đăng nhập thất bại.");
        }

        saveAuth(data.token, data.user);
        showToast("Đăng nhập thành công!", "success");
        window.location.reload();
    } catch (err) {
        showToast(err.message, "error");
    }
}

export async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    
    const roleInput = document.querySelector('input[name="register-role"]:checked');
    const role = roleInput ? roleInput.value : "Customer";

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password, role })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || data.Message || "Đăng ký thất bại.");
        }

        showToast("Đăng ký tài khoản thành công!", "success");
        if (role === "Customer" || role === "Admin") {
            showToast("Tài khoản của bạn đã được duyệt tự động. Vui lòng đăng nhập.");
        } else {
            showToast("Tài khoản của bạn đang chờ quản trị viên (Admin) duyệt duyệt.", "warning");
        }
        toggleAuthTab('login');
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function handleLogout() {
    clearAuth();
    window.location.reload();
}
