console.log("auth.js carregado");

const API_BASE = "http://localhost:3000/api";

/* ================================
    FUNÇÃO GENÉRICA POST JSON
================================ */
async function postJSON(path, data) {
    const resp = await fetch(API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const text = await resp.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("ERRO ao converter resposta:", text);
        throw e;
    }
}

/* ================================
      LOGIN
================================ */
const loginBtn = document.getElementById("btn-login");

if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const errorBox = document.getElementById("login-error");

        errorBox.textContent = "";

        if (!email || !password) {
            errorBox.textContent = "Preencha email e senha.";
            return;
        }

        const result = await postJSON("/auth/bambu", { email, password });
        console.log("LOGIN RESULT:", result);

        // LOGIN DIRETO (quase nunca acontece na Bambu)
        if (result.success === true && result.requires_code !== true) {
            localStorage.setItem("auth_ok", "true");
            window.location.href = "/home";   // <--- ALTERADO AQUI
            return;
        }

        // LOGIN COM ENVIO DE CÓDIGO
        if (result.requires_code === true || result["requires-code"] === true) {
            localStorage.setItem("pending_email", email);
            window.location.href = "/verify";
            return;
        }

        // ERRO
        errorBox.textContent = result.message || "Erro ao autenticar.";
    });
}

/* ================================
      VERIFICAÇÃO DE CÓDIGO
================================ */
const verifyBtn = document.getElementById("btn-verify");

if (verifyBtn) {
    verifyBtn.addEventListener("click", async () => {
        const code = document.getElementById("code").value.trim();
        const email = localStorage.getItem("pending_email");
        const errorBox = document.getElementById("verify-error");

        errorBox.textContent = "";

        if (!email) {
            errorBox.textContent = "Erro interno: email não encontrado.";
            return;
        }

        if (!code) {
            errorBox.textContent = "Digite o código.";
            return;
        }

        const result = await postJSON("/auth/bambu", { email, code });
        console.log("VERIFY RESULT:", result);

        if (result.success === true) {
            localStorage.setItem("auth_ok", "true");
            localStorage.removeItem("pending_email");

            window.location.href = "/home";   // <--- ALTERADO AQUI
            return;
        }

        errorBox.textContent = result.message || "Código inválido.";
    });
}
