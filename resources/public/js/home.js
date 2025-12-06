console.log("home.js carregado - Versão Financeira");

if (!localStorage.getItem("auth_ok")) {
    window.location.href = "/login";
}

const API_BASE = "http://localhost:3000/api";
const printsList = document.getElementById("prints-list");
const errorBox = document.getElementById("error-box");
const retryBtn = document.getElementById("btn-retry");
const syncBtn = document.getElementById("btn-sync");

// Modal Elements
const modal = document.getElementById("details-modal");
const closeModal = document.querySelector(".close-modal");
const priceInput = document.getElementById("modal-price-input");
const savePriceBtn = document.getElementById("btn-save-price");

// Saldo Elements
const balanceDisplay = document.getElementById("balance-display");
const btnSetBalance = document.getElementById("btn-set-balance");

let currentPrintId = null;

/* ============================
   HELPERS
============================ */
function formatHours(minutesStr) {
    const minutes = parseInt(minutesStr);
    if (!minutes || isNaN(minutes)) return "0 min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m} min`;
}

function formatMoney(val) {
    if (val === null || val === undefined) return "R$ 0,00";
    return `R$ ${parseFloat(val).toFixed(2).replace('.', ',')}`;
}

function getStatusInfo(rawStatus) {
    const s = String(rawStatus).toLowerCase();
    if (s === "running" || s === "imprimindo") return { label: "Imprimindo...", class: "tag-running" };
    if (["2", "success", "finish", "concluido"].includes(s) || rawStatus === 2) return { label: "Concluída", class: "tag-success" };
    return { label: "Falhou/Cancelada", class: "tag-failed" };
}

/* ============================
   FINANCEIRO (NOVO)
============================ */
async function carregarSaldo() {
    try {
        const resp = await fetch(`${API_BASE}/financeiro/saldo`);
        const data = await resp.json();
        const val = data.saldo;
        if(balanceDisplay) {
            balanceDisplay.textContent = formatMoney(val);
            balanceDisplay.style.color = val >= 0 ? "#27ae60" : "#c0392b";
        }
    } catch (e) { console.error("Erro saldo:", e); }
}

window.venderImpressao = async (e, id, nome, valor) => {
    e.stopPropagation(); // Impede abrir o modal ao clicar no botão
    
    if(!confirm(`Confirmar venda de "${nome}" por ${formatMoney(valor)}?\nIsso será creditado no seu saldo.`)) return;

    try {
        const resp = await fetch(`${API_BASE}/financeiro/venda`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, nome, valor: parseFloat(valor) })
        });
        
        if(resp.ok) {
            alert("Venda registrada com sucesso!");
            carregarSaldo(); // Atualiza saldo na hora
        } else {
            alert("Erro ao registrar venda.");
        }
    } catch (e) { alert("Erro de conexão."); }
};

if (btnSetBalance) {
    btnSetBalance.addEventListener("click", async () => {
        const novo = prompt("Digite o saldo inicial da carteira (ex: 100.00):");
        if (!novo) return;
        
        await fetch(`${API_BASE}/financeiro/saldo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ valor: parseFloat(novo) })
        });
        carregarSaldo();
    });
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
        
        printsList.innerHTML = "";

        if (!prints || prints.length === 0) {
            printsList.innerHTML = `<div class="empty-state"><p>Nenhuma impressão.</p></div>`;
            return;
        }

        prints.forEach(p => {
            const card = document.createElement("div");
            card.className = "print-card";
            
            const get = (k) => p[`impressoes/${k}`] || p[k];
            
            const id = get("id");
            const nome = get("nome") || "Sem nome";
            const peso = get("peso_usado_g") ? parseFloat(get("peso_usado_g")).toFixed(1) : "0";
            const tempoRaw = get("tempo_minutos");
            const imagem = get("imagem") || p.cover || "/img/logoEsquilo.png";
            const pReal = get("preco_venda_real");
            const pSugerido = get("preco_consumidor_sugerido");
            
            const precoExibir = pReal || pSugerido;
            const stInfo = getStatusInfo(get("status"));

            // Botão de Venda condicional (só aparece se for sucesso)
            const btnVender = stInfo.class === "tag-success" 
                ? `<button class="btn-sell" onclick="venderImpressao(event, '${id}', '${nome}', ${precoExibir})">💰 Vender</button>`
                : "";

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
                        <div class="stat-item"><span class="stat-label">Peso</span><span class="stat-value">${peso} g</span></div>
                        <div class="stat-item"><span class="stat-label">Tempo</span><span class="stat-value">${formatHours(tempoRaw)}</span></div>
                    </div>
                    <div class="prices-row">
                        <div class="price-item">
                            <span class="price-label">Venda</span>
                            <span class="price-val highlight">${formatMoney(precoExibir)}</span>
                        </div>
                        ${btnVender}
                    </div>
                </div>
            `;
            
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
   MODAL & EDIÇÃO
============================ */
function openDetailsModal(p) {
    const get = (k) => p[`impressoes/${k}`] || p[k];
    const stInfo = getStatusInfo(get("status"));

    currentPrintId = get("id");

    document.getElementById("modal-title").textContent = get("nome");
    document.getElementById("modal-status").textContent = stInfo.label;
    document.getElementById("modal-status").className = stInfo.class;
    document.getElementById("modal-time").textContent = formatHours(get("tempo_minutos"));
    document.getElementById("modal-weight").textContent = `${parseFloat(get("peso_usado_g")||0).toFixed(2)} g`;
    
    const dataInicio = get("data_inicio");
    document.getElementById("modal-date").textContent = dataInicio ? new Date(dataInicio).toLocaleString('pt-BR') : "-";

    document.getElementById("modal-cost-filament").textContent = formatMoney(get("custo_filamento"));
    document.getElementById("modal-cost-energy").textContent = formatMoney(get("custo_energia"));
    document.getElementById("modal-cost-amort").textContent = formatMoney(get("custo_amortizacao"));
    document.getElementById("modal-cost-total").textContent = formatMoney(get("custo_total"));

    const precoReal = parseFloat(get("preco_venda_real") || 0);
    const precoSugerido = parseFloat(get("preco_consumidor_sugerido") || 0);
    
    priceInput.value = (precoReal > 0 ? precoReal : precoSugerido).toFixed(2);
    
    document.getElementById("modal-suggested").textContent = formatMoney(precoSugerido);
    document.getElementById("modal-margin").textContent = formatMoney(get("margem_lucro"));

    modal.style.display = "flex";
}

savePriceBtn.addEventListener("click", async () => {
    if (!currentPrintId) return;
    
    const novoPreco = parseFloat(priceInput.value);
    if (isNaN(novoPreco)) { alert("Digite um valor válido"); return; }

    savePriceBtn.textContent = "⏳...";
    savePriceBtn.disabled = true;

    try {
        const resp = await fetch(`${API_BASE}/impressoes/detalhe/${currentPrintId}/preco`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "preco-venda": novoPreco })
        });

        if (resp.ok) {
            const dadosNovos = await resp.json();
            document.getElementById("modal-margin").textContent = formatMoney(dadosNovos["margem-percentual"] || dadosNovos["lucro-liquido"]);
            alert("Preço atualizado!");
            modal.style.display = "none";
            carregarImpressoes();
        } else {
            alert("Erro ao salvar preço.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    } finally {
        savePriceBtn.textContent = "💾 Salvar";
        savePriceBtn.disabled = false;
    }
});

if (closeModal) closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

if (retryBtn) retryBtn.addEventListener("click", carregarImpressoes);
if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = "🔄 ...";
        try {
            await fetch(`${API_BASE}/impressoes/sincronizar`, { method: "POST" });
            alert(`Sincronização completa!`);
            carregarImpressoes();
        } catch (err) { alert("Erro ao sincronizar."); }
        syncBtn.disabled = false;
        syncBtn.textContent = "🔄 Sincronizar Impressões";
    });
}

// Start
carregarImpressoes();
carregarSaldo(); // Carrega o saldo