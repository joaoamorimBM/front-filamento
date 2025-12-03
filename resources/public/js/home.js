console.log("home.js carregado");

/* ============================
   PROTEÇÃO DE ROTA
============================ */
if (!localStorage.getItem("auth_ok")) {
    window.location.href = "/login";
}

/* API base */
const API_BASE = "http://localhost:3000/api";

const printsList = document.getElementById("prints-list");
const errorBox = document.getElementById("error-box");
const retryBtn = document.getElementById("btn-retry");
const syncBtn = document.getElementById("btn-sync");

/* ============================
   Carregar Impressões
============================ */
async function carregarImpressoes() {
    errorBox.style.display = "none";
    printsList.innerHTML = "<p>Carregando...</p>";

    try {
        const resp = await fetch(`${API_BASE}/impressoes?limit=20`);
        const prints = await resp.json();

        console.log("IMPRESSÕES:", prints);

        printsList.innerHTML = ""; // limpa

        if (!prints || prints.length === 0) {
            printsList.innerHTML = "<p>Nenhuma impressão encontrada.</p>";
            return;
        }

        prints.forEach(p => {
    const card = document.createElement("div");
    card.className = "print-card";

    const nome = p["impressoes/nome"] || p.title || "Sem nome";
    const peso = p["impressoes/peso_usado_g"] || p.weight || "0";
    const tempo = p["impressoes/tempo_minutos"] || Math.round(p.costTime / 60) || "?";
    const imagem = p.cover || "";
    const preco = p["impressoes/preco_consumidor_sugerido"] || "—";
    const status = p["impressoes/status"] || (p.status == 2 ? "success" : "failed");

    card.innerHTML = `
        ${imagem ? `<img src="${imagem}" class="print-img">` : ""}

        <div class="print-name">${nome}</div>
        <div class="print-info">Peso: ${peso} g</div>
        <div class="print-info">Tempo: ${tempo} min</div>
        <div class="print-price">Preço sugerido: ${preco}</div>

        <span class="${status === "success" ? "tag-success" : "tag-failed"}">
            ${status === "success" ? "Concluída" : "Falhou"}
        </span>
    `;

    printsList.appendChild(card);
});


    } catch (err) {
        console.error("ERRO ao carregar impressões:", err);
        errorBox.style.display = "block";   // mostra botão "Tentar Novamente"
        printsList.innerHTML = "";
    }
}

/* ============================
   Botão "Tentar Novamente"
============================ */
if (retryBtn) {
    retryBtn.addEventListener("click", () => {
        carregarImpressoes();
    });
}

/* ============================
   Botão "Sincronizar Impressões"
============================ */
if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = "🔄 Sincronizando...";

        try {
            const resp = await fetch(`${API_BASE}/impressoes/sincronizar`, {
                method: "POST"
            });
            const data = await resp.json();

            console.log("SYNC RESULT:", data);

            carregarImpressoes();

        } catch (err) {
            alert("Erro ao sincronizar impressões.");
        }

        syncBtn.disabled = false;
        syncBtn.textContent = "🔄 Sincronizar Impressões";
    });
}

/* ============================
   Executa ao carregar a Home
============================ */
carregarImpressoes();
