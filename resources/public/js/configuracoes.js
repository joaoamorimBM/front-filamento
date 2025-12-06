console.log("configuracoes.js v3.0 CARREGADO - COM RECÁLCULO");

const API_BASE = "http://localhost:3000/api";
const listContainer = document.getElementById("config-list");
const loading = document.getElementById("loading-config");
const form = document.getElementById("config-form");

// 1. CONFIGURAÇÕES PRINCIPAIS (Sempre visíveis)
const PRINCIPAIS = [
    { key: "custo-kwh", label: "Tarifa de Energia (R$/kWh)", icon: "⚡" },
    { key: "potencia-impressora-watts", label: "Potência da Máquina (Watts)", icon: "🔌" },
    { key: "valor-impressora", label: "Valor da Impressora (R$)", icon: "🖨️" },
    { key: "vida-util-horas", label: "Vida Útil Estimada (Horas)", icon: "⏳" },
    { key: "markup-padrao", label: "Markup Consumidor (Multiplicador)", icon: "👤" },
    { key: "markup-lojista", label: "Markup Lojista (Multiplicador)", icon: "🏪" }
];

// 2. CONFIGURAÇÕES AVANÇADAS (Escondidas no botão)
const AVANCADAS = [
    { key: "imposto-percentual", label: "Impostos (%)", icon: "🏛️" },
    { key: "taxa-cartao-percentual", label: "Taxa Máquina Cartão (%)", icon: "💳" },
    { key: "custo-anuncio-percentual", label: "Custo Marketing/Ads (%)", icon: "📢" },
    { key: "percentual-falhas", label: "Margem de Segurança/Falhas (%)", icon: "⚠️" },
    { key: "custo-fixo-mensal", label: "Custo Fixo Mensal (Aluguel/Net) (R$)", icon: "🏢" },
    { key: "impressoes-mes", label: "Estimativa Impressões/Mês", icon: "📅" }
];

async function loadConfigs() {
    try {
        const resp = await fetch(`${API_BASE}/configuracoes`);
        const data = await resp.json();
        
        console.log("Config carregada:", data);

        loading.style.display = "none";
        form.style.display = "block";
        listContainer.innerHTML = "";

        // Se o banco estiver vazio
        if (Object.keys(data).length === 0) {
            listContainer.innerHTML = `<p style="color:red; text-align:center;">Banco de dados vazio. Execute o script SQL.</p>`;
            return;
        }

        // Título Principal
        const h3Main = document.createElement("h3");
        h3Main.innerText = "Geral";
        h3Main.style.cssText = "color:#2c3e50; border-bottom:1px solid #eee; padding-bottom:10px; margin-top:0;";
        listContainer.appendChild(h3Main);

        // Renderizar PRINCIPAIS
        renderList(PRINCIPAIS, data);

        // Divisória e Botão Avançado
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.innerHTML = "🔽 Mostrar Configurações Avançadas (Impostos, Taxas)";
        toggleBtn.style.cssText = "width:100%; padding:12px; margin:20px 0; background:#f1f2f6; border:1px dashed #ccc; border-radius:8px; cursor:pointer; color:#555; font-weight:600;";
        
        const advancedDiv = document.createElement("div");
        advancedDiv.style.display = "none"; // Começa escondido
        advancedDiv.style.gridTemplateColumns = "1fr";
        advancedDiv.style.gap = "20px";
        
        // Título Avançado
        advancedDiv.innerHTML = `<h3 style="color:#7f8c8d; border-bottom:1px solid #eee; padding-bottom:10px;">Avançado (Opcional)</h3>`;

        listContainer.appendChild(toggleBtn);
        listContainer.appendChild(advancedDiv);

        // Renderizar AVANCADAS
        renderList(AVANCADAS, data, advancedDiv);

        // Lógica do Botão Toggle
        toggleBtn.addEventListener("click", () => {
            const isHidden = advancedDiv.style.display === "none";
            advancedDiv.style.display = isHidden ? "grid" : "none";
            toggleBtn.innerHTML = isHidden ? "🔼 Ocultar Avançadas" : "🔽 Mostrar Configurações Avançadas";
        });

    } catch (e) {
        console.error(e);
        loading.textContent = "Erro ao carregar dados.";
    }
}

function renderList(list, data, targetElement = listContainer) {
    list.forEach(item => {
        // Backend manda com hífen (ex: custo-kwh). Se não achar, tenta com 0.
        const value = data[item.key] !== undefined ? data[item.key] : 0;

        const div = document.createElement("div");
        div.className = "config-item";
        div.innerHTML = `
            <div class="config-label">
                <span style="font-size: 1.2rem; margin-right: 10px;">${item.icon}</span>
                <strong>${item.label}</strong>
            </div>
            <div class="config-input-group">
                <input type="number" step="0.01" value="${value}" id="input-${item.key}">
                <button type="button" class="btn-save-item" onclick="saveConfig('${item.key}')">Salvar</button>
            </div>
        `;
        targetElement.appendChild(div);
    });
}

async function saveConfig(key) {
    const input = document.getElementById(`input-${key}`);
    const btn = input.nextElementSibling;
    const originalText = btn.innerText;
    
    btn.innerText = "⏳";
    btn.disabled = true;

    try {
        await fetch(`${API_BASE}/configuracoes/${key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ valor: input.value })
        });
        btn.innerText = "✅";
        setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 1000);
    } catch (e) {
        alert("Erro ao salvar.");
        btn.innerText = "❌";
        btn.disabled = false;
    }
}

/* ==========================================
   LÓGICA DO BOTÃO DE RECÁLCULO (ESSENCIAL)
========================================== */
const btnRecalc = document.getElementById("btn-recalc");

if (btnRecalc) {
    btnRecalc.addEventListener("click", async () => {
        if (!confirm("Isso vai recalcular os preços de TODAS as impressões salvas usando as configurações atuais.\n\nDeseja continuar?")) {
            return;
        }

        const originalText = btnRecalc.textContent;
        btnRecalc.textContent = "⏳ Processando...";
        btnRecalc.disabled = true;

        try {
            const resp = await fetch(`${API_BASE}/impressoes/recalcular-tudo`, {
                method: "POST"
            });

            if (resp.ok) {
                const data = await resp.json();
                alert(`Sucesso! ${data.recalculadas} impressões foram atualizadas.`);
            } else {
                alert("Erro ao recalcular.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão.");
        } finally {
            btnRecalc.textContent = originalText;
            btnRecalc.disabled = false;
        }
    });
}

// Injetar estilos do botão de recálculo (caso não tenha no CSS)
const style = document.createElement('style');
style.textContent = `
    .btn-recalc {
        width: 100%;
        padding: 15px;
        background: #34495e;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }
    .btn-recalc:hover { background: #2c3e50; }
    .hint-text { text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-top: 10px; }
`;
document.head.appendChild(style);

// Iniciar
loadConfigs();