const API_BASE = "http://localhost:3000/api";
const listContainer = document.getElementById("config-list");
const loading = document.getElementById("loading-config");
const form = document.getElementById("config-form");

// Dicionário para deixar os nomes amigáveis
const LABELS = {
    "custo_kwh": "Custo Energia (R$/kWh)",
    "potencia_impressora_watts": "Potência da Impressora (Watts)",
    "markup_padrao": "Markup Padrão (Multiplicador)",
    "imposto_percentual": "Imposto (%)",
    "taxa_cartao_percentual": "Taxa Máquina Cartão (%)",
    "custo_anuncio_percentual": "Custo Anúncio/Marketing (%)",
    "valor_impressora": "Valor da Impressora (R$)",
    "vida_util_horas": "Vida Útil Estimada (Horas)",
    "percentual_falhas": "Margem para Falhas (%)",
    "custo_fixo_mensal": "Custo Fixo Mensal (R$)",
    "impressoes_mes": "Média Impressões/Mês"
};

async function loadConfigs() {
    try {
        const resp = await fetch(`${API_BASE}/configuracoes`);
        const data = await resp.json();
        
        loading.style.display = "none";
        form.style.display = "block";
        listContainer.innerHTML = "";

        // Ordenar chaves para ficar bonito
        const keys = Object.keys(data).sort();

        keys.forEach(key => {
            const label = LABELS[key] || key.replace(/_/g, " ").toUpperCase();
            const value = data[key];

            const div = document.createElement("div");
            div.className = "config-item";
            div.innerHTML = `
                <div class="config-label">
                    ${label}
                    <small>Chave: ${key}</small>
                </div>
                <div class="config-input-group">
                    <input type="number" step="0.01" value="${value}" id="input-${key}">
                    <button type="button" class="btn-save-item" onclick="saveConfig('${key}')">💾</button>
                </div>
            `;
            listContainer.appendChild(div);
        });

    } catch (e) {
        console.error(e);
        loading.textContent = "Erro ao carregar configurações.";
    }
}

async function saveConfig(key) {
    const input = document.getElementById(`input-${key}`);
    const newVal = input.value;

    try {
        const resp = await fetch(`${API_BASE}/configuracoes/${key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ valor: newVal }) // Backend espera string ou number, enviaremos como está
        });

        if (resp.ok) {
            // Feedback visual rápido
            const btn = input.nextElementSibling;
            const originalText = btn.innerHTML;
            btn.innerHTML = "✅";
            setTimeout(() => btn.innerHTML = originalText, 1500);
        } else {
            alert("Erro ao salvar.");
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
}

// Iniciar
loadConfigs();