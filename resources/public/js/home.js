console.log("home.js carregado - Versão Integrada");

/* ============================
   CONFIGURAÇÃO
============================ */
if (!localStorage.getItem("auth_ok")) {
    window.location.href = "/login";
}

const API_BASE = "http://localhost:3000/api";
const printsList = document.getElementById("prints-list");
const errorBox = document.getElementById("error-box");
const retryBtn = document.getElementById("btn-retry");
const syncBtn = document.getElementById("btn-sync");

// Elementos do Modal
const modal = document.getElementById("details-modal");
const closeModal = document.querySelector(".close-modal");

/* ============================
   HELPERS DE FORMATAÇÃO
============================ */

// Formata minutos em "Xh Ym"
function formatHours(minutesStr) {
    const minutes = parseInt(minutesStr);
    if (!minutes || isNaN(minutes)) return "0 min";
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    if (h > 0) return `${h}h ${m}min`;
    return `${m} min`;
}

// Formata Dinheiro (R$)
function formatMoney(val) {
    if (val === null || val === undefined) return "R$ 0,00";
    return `R$ ${parseFloat(val).toFixed(2).replace('.', ',')}`;
}

// Detecta status e retorna info visual
function getStatusInfo(rawStatus) {
    // Normaliza para string minúscula
    const s = String(rawStatus).toLowerCase();

    // 1. Em andamento
    if (s === "running" || s === "imprimindo") {
        return {
            label: "Imprimindo...",
            class: "tag-running" // Classe nova Azul
        };
    }

    // 2. Sucesso
    const successCodes = ["2", "success", "finish", "concluido"];
    if (successCodes.includes(s) || rawStatus === 2) {
        return {
            label: "Concluída",
            class: "tag-success"
        };
    }

    // 3. Falha/Cancelada (Padrão para o resto)
    return {
        label: "Falhou/Cancelada",
        class: "tag-failed"
    };
}

/* ============================
   CARREGAR IMPRESSÕES
============================ */
async function carregarImpressoes() {
    errorBox.style.display = "none";
    printsList.innerHTML = '<div class="loading">Carregando histórico...</div>';

    try {
        const resp = await fetch(`${API_BASE}/impressoes?limit=50`);
        
        if (!resp.ok) throw new Error("Erro na API");

        const prints = await resp.json();
        console.log("DADOS:", prints);

        printsList.innerHTML = "";

        if (!prints || prints.length === 0) {
            printsList.innerHTML = `<div class="empty-state"><p>Nenhuma impressão.</p></div>`;
            return;
        }

        prints.forEach(p => {
            const card = document.createElement("div");
            card.className = "print-card";
            
            // Extrair dados (suporta com ou sem namespace)
            const get = (k) => p[`impressoes/${k}`] || p[k];
            
            const nome = get("nome") || "Sem nome";
            const peso = get("peso_usado_g") ? parseFloat(get("peso_usado_g")).toFixed(1) : "0";
            const tempoRaw = get("tempo_minutos");
            const imagem = get("imagem") || p.cover || "/img/logoEsquilo.png";
            
            // Preços
            const pConsumidor = get("preco_consumidor_sugerido");
            const pLojista = get("preco_lojista_sugerido");
            
            // Status
            const stInfo = getStatusInfo(get("status"));

            card.innerHTML = `
                <div class="print-img-container">
                    <img src="${imagem}" class="print-img" onerror="this.src='/img/logoEsquilo.png'">
                </div>

                <div class="print-content">
                    <div class="print-header">
                        <span class="print-name" title="${nome}">${nome}</span>
                        <span class="${stInfo.class}">${stInfo.label}</span>
                    </div>
                    
                    <div class="print-stats">
                        <div class="stat-item">
                            <span class="stat-label">Peso</span>
                            <span class="stat-value">${peso} g</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Tempo</span>
                            <span class="stat-value">${formatHours(tempoRaw)}</span>
                        </div>
                    </div>

                    <div class="prices-row">
                        <div class="price-item">
                            <span class="price-label">Consumidor</span>
                            <span class="price-val highlight">${formatMoney(pConsumidor)}</span>
                        </div>
                        <div class="price-item">
                            <span class="price-label">Lojista</span>
                            <span class="price-val">${formatMoney(pLojista)}</span>
                        </div>
                    </div>
                </div>
            `;

            // Evento de clique para abrir o modal
            card.addEventListener("click", () => openDetailsModal(p));

            printsList.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        errorBox.style.display = "block";
        printsList.innerHTML = "";
    }
}

/* ============================
   LÓGICA DO MODAL
============================ */
function openDetailsModal(p) {
    const get = (k) => p[`impressoes/${k}`] || p[k];
    const stInfo = getStatusInfo(get("status"));

    // Preencher Textos
    document.getElementById("modal-title").textContent = get("nome");
    document.getElementById("modal-status").textContent = stInfo.label;
    document.getElementById("modal-status").className = stInfo.class; // Reaproveita estilo tag
    
    document.getElementById("modal-time").textContent = formatHours(get("tempo_minutos"));
    document.getElementById("modal-weight").textContent = `${parseFloat(get("peso_usado_g")||0).toFixed(2)} g`;
    
    // Datas
    const dataInicio = get("data_inicio");
    document.getElementById("modal-date").textContent = dataInicio ? new Date(dataInicio).toLocaleString('pt-BR') : "-";

    // Custos
    document.getElementById("modal-cost-filament").textContent = formatMoney(get("custo_filamento"));
    document.getElementById("modal-cost-energy").textContent = formatMoney(get("custo_energia"));
    document.getElementById("modal-cost-amort").textContent = formatMoney(get("custo_amortizacao"));
    document.getElementById("modal-cost-total").textContent = formatMoney(get("custo_total"));

    // Preços
    document.getElementById("modal-price-consumer").textContent = formatMoney(get("preco_consumidor_sugerido"));
    document.getElementById("modal-price-reseller").textContent = formatMoney(get("preco_lojista_sugerido"));
    document.getElementById("modal-margin").textContent = formatMoney(get("margem_lucro"));

    // Exibir
    modal.style.display = "flex";
}

// Fechar Modal
if (closeModal) {
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

// Fechar clicando fora
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

/* ============================
   BOTÕES DE AÇÃO
============================ */
if (retryBtn) retryBtn.addEventListener("click", carregarImpressoes);

if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = "🔄 Sincronizando...";
        try {
            const resp = await fetch(`${API_BASE}/impressoes/sincronizar`, { method: "POST" });
            const data = await resp.json();
            alert(`Sincronização completa! ${data.novas || 0} novas.`);
            carregarImpressoes();
        } catch (err) {
            alert("Erro ao sincronizar.");
        }
        syncBtn.disabled = false;
        syncBtn.textContent = "🔄 Sincronizar Impressões";
    });
}

// Iniciar
carregarImpressoes();