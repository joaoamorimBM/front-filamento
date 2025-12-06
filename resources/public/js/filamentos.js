console.log("filamentos.js v6.0 - Correção de Validação");

const API_BASE = "http://localhost:3000/api";
const tbody = document.getElementById("lista-filamentos");
const loading = document.getElementById("loading");
const emptyMsg = document.getElementById("empty-msg");
const balanceDisplay = document.getElementById("balance-display");

// Modal & Form
const modal = document.getElementById("modal-form");
const btnNovo = document.getElementById("btn-novo");
const closeBtns = document.querySelectorAll(".close-modal, .close-modal-btn");
const form = document.getElementById("form-filamento");

// Cores
const colorTrigger = document.getElementById("color-trigger");
const colorPopover = document.getElementById("color-palette-popover");
const colorInputHidden = document.getElementById("selected-color-hex");
const colorLabel = document.getElementById("color-label-text");
const nativePicker = document.getElementById("native-color-picker");
const swatches = document.querySelectorAll(".swatch:not(.custom-swatch)");
const btnCustom = document.getElementById("btn-custom-color");

/* ============================
   FORMATADORES & SALDO
============================ */
function formatMoney(val) {
    if (val === undefined || val === null) return "R$ 0,00";
    return `R$ ${parseFloat(val).toFixed(2).replace('.', ',')}`;
}

async function carregarSaldo() {
    try {
        const resp = await fetch(`${API_BASE}/financeiro/saldo`);
        const data = await resp.json();
        const val = data.saldo;
        
        if(balanceDisplay) {
            balanceDisplay.textContent = formatMoney(val);
            balanceDisplay.style.color = val >= 0 ? "#2c3e50" : "#c0392b";
        }
    } catch (e) { console.error("Erro saldo:", e); }
}

/* ============================
   LÓGICA DE CORES
============================ */
colorTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = colorPopover.style.display === "block";
    colorPopover.style.display = isVisible ? "none" : "block";
});

window.addEventListener("click", (e) => {
    // Fecha popover se clicar fora
    if(colorPopover && colorPopover.style.display === "block") {
        if(!colorPopover.contains(e.target) && !colorTrigger.contains(e.target)) {
            colorPopover.style.display = "none";
        }
    }
    // Fecha modal se clicar no fundo
    if (e.target === modal) modal.style.display = "none";
});

swatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
        const color = swatch.getAttribute("data-color");
        applyColor(color);
    });
});

btnCustom.addEventListener("click", (e) => {
    e.stopPropagation();
    nativePicker.click();
});

nativePicker.addEventListener("input", (e) => {
    applyColor(e.target.value);
});

function applyColor(hex) {
    colorInputHidden.value = hex;
    colorTrigger.style.backgroundColor = hex;
    colorLabel.textContent = hex.toUpperCase();
    colorPopover.style.display = "none";
}

/* ============================
   CARREGAR TABELA
============================ */
async function carregarFilamentos() {
    tbody.innerHTML = "";
    loading.style.display = "block";
    emptyMsg.style.display = "none";

    try {
        const resp = await fetch(`${API_BASE}/filamentos`);
        const dados = await resp.json();
        loading.style.display = "none";

        if (!dados || dados.length === 0) {
            emptyMsg.style.display = "block";
            return;
        }

        dados.forEach(f => {
            const get = (k) => f[`filamentos/${k}`] || f[k];
            
            const id = get("id");
            const nome = get("nome");
            const marca = get("marca");
            const tipo = get("tipo");
            let corHex = get("cor");
            
            if (!corHex || !corHex.startsWith("#")) corHex = "#cccccc"; 

            const pesoInicial = parseFloat(get("peso_inicial_g") || 0);
            const pesoAtual = parseFloat(get("peso_atual_g") || 0);
            const preco = parseFloat(get("preco_compra") || 0);

            const pct = pesoInicial > 0 ? Math.max(0, (pesoAtual / pesoInicial) * 100) : 0;
            let colorClass = pct < 20 ? "stock-low" : (pct < 50 ? "stock-mid" : "stock-high");

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="text-align: center; vertical-align: middle;">
                    <span class="color-dot-cell" style="background-color: ${corHex};"></span>
                </td>
                <td><strong>${nome}</strong></td>
                <td>${marca}</td>
                <td><span class="badge-type">${tipo}</span></td>
                <td>
                    <div style="min-width: 120px;">
                        <small>${pesoAtual.toFixed(0)}g / ${pesoInicial}g</small>
                        <div class="stock-bar-bg">
                            <div class="stock-bar-fill ${colorClass}" style="width: ${pct}%"></div>
                        </div>
                    </div>
                </td>
                <td>${formatMoney(preco)}</td>
                <td style="text-align: right;">
                    <button class="btn-delete" onclick="deletarFilamento('${id}')">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        loading.textContent = "Erro de conexão.";
    }
}

/* ============================
   SALVAR (COMPRA) - CORRIGIDO
============================ */
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // VALIDAÇÃO E TRATAMENTO DE ERROS
    const nomeInput = document.getElementById("f-nome").value.trim();
    const marcaInput = document.getElementById("f-marca").value.trim();
    const pesoInput = parseFloat(document.getElementById("f-peso").value);
    const precoInput = parseFloat(document.getElementById("f-preco").value);
    const tipoInput = document.getElementById("f-tipo").value;
    const corInput = colorInputHidden.value;

    if (!nomeInput || !marcaInput) {
        alert("Preencha o nome e a marca.");
        return;
    }

    if (isNaN(pesoInput) || pesoInput <= 0) {
        alert("Peso deve ser maior que zero.");
        return;
    }

    if (isNaN(precoInput) || precoInput < 0) {
        alert("Preço inválido.");
        return;
    }

    // Confirmação
    if(!confirm(`Confirmar compra de "${nomeInput}"?\nSerá debitado ${formatMoney(precoInput)} do seu saldo.`)) return;

    const payload = {
        "nome": nomeInput,
        "marca": marcaInput,
        "tipo": tipoInput,
        "cor": corInput,
        "peso-inicial-g": pesoInput,
        "preco-compra": precoInput
    };

    console.log("Enviando:", payload); // Debug

    try {
        const resp = await fetch(`${API_BASE}/filamentos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            alert("Compra realizada e estoque atualizado!");
            modal.style.display = "none";
            form.reset();
            applyColor("#000000");
            
            carregarFilamentos();
            carregarSaldo(); 
        } else {
            const errData = await resp.json();
            console.error("Erro API:", errData);
            alert("Erro ao salvar: " + (errData.erro || "Verifique os dados"));
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    }
});

/* ============================
   AÇÕES EXTRAS
============================ */
window.deletarFilamento = async (id) => {
    if(!confirm("Remover este filamento do estoque?")) return;
    try {
        await fetch(`${API_BASE}/filamentos/${id}`, { method: "DELETE" });
        carregarFilamentos();
    } catch (e) { alert("Erro ao deletar"); }
};

btnNovo.addEventListener("click", () => modal.style.display = "flex");
closeBtns.forEach(btn => btn.addEventListener("click", () => modal.style.display = "none"));

// Inicializar
carregarFilamentos();
carregarSaldo();