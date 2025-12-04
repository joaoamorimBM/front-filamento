console.log("filamentos.js carregado - Versão Final");

const API_BASE = "http://localhost:3000/api";
const tbody = document.getElementById("lista-filamentos");
const loading = document.getElementById("loading");
const emptyMsg = document.getElementById("empty-msg");

// Modal Elements
const modal = document.getElementById("modal-form");
const btnNovo = document.getElementById("btn-novo");
const closeBtns = document.querySelectorAll(".close-modal, .close-modal-btn");
const form = document.getElementById("form-filamento");

// Elementos de Cor
const colorTrigger = document.getElementById("color-trigger");
const colorPopover = document.getElementById("color-palette-popover");
const colorInputHidden = document.getElementById("selected-color-hex");
const colorLabel = document.getElementById("color-label-text");
const nativePicker = document.getElementById("native-color-picker");
const swatches = document.querySelectorAll(".swatch:not(.custom-swatch)");
const btnCustom = document.getElementById("btn-custom-color");

/* ============================
   LÓGICA DE CORES
============================ */
// 1. Abrir/Fechar Popover
colorTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = colorPopover.style.display === "block";
    colorPopover.style.display = isVisible ? "none" : "block";
});

// Fechar ao clicar fora
window.addEventListener("click", (e) => {
    // Se clicou fora do popover e fora do gatilho, fecha
    if (colorPopover && colorPopover.style.display === "block") {
        if (!colorPopover.contains(e.target) && !colorTrigger.contains(e.target)) {
            colorPopover.style.display = "none";
        }
    }
    // Fechar modal ao clicar no fundo
    if (e.target === modal) modal.style.display = "none";
});

// 2. Selecionar Preset
swatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
        const color = swatch.getAttribute("data-color");
        applyColor(color);
    });
});

// 3. Selecionar Custom
btnCustom.addEventListener("click", (e) => {
    e.stopPropagation();
    nativePicker.click();
});

nativePicker.addEventListener("input", (e) => {
    applyColor(e.target.value);
});

// Função que aplica a cor
function applyColor(hex) {
    colorInputHidden.value = hex;
    colorTrigger.style.backgroundColor = hex;
    colorLabel.textContent = hex.toUpperCase();
    colorPopover.style.display = "none";
}

/* ============================
   CARREGAR FILAMENTOS
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
            
            // Garantir que a cor é válida
            let corHex = get("cor");
            if (!corHex || !corHex.startsWith("#")) {
                corHex = "#cccccc"; // Fallback se não tiver cor
            }

            const pesoInicial = parseFloat(get("peso_inicial_g"));
            const pesoAtual = parseFloat(get("peso_atual_g"));
            const preco = parseFloat(get("preco_compra"));

            const pct = Math.max(0, (pesoAtual / pesoInicial) * 100);
            let colorClass = "stock-high";
            if (pct < 50) colorClass = "stock-mid";
            if (pct < 20) colorClass = "stock-low";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="text-align: center; vertical-align: middle;">
                    <span class="color-dot-cell" style="background-color: ${corHex};" title="${corHex}"></span>
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
                <td>R$ ${preco.toFixed(2)}</td>
                <td style="text-align: right;">
                    <button class="btn-delete" title="Excluir" onclick="deletarFilamento('${id}')">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        loading.textContent = "Erro ao conectar.";
    }
}

/* ============================
   SALVAR
============================ */
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const payload = {
        nome: document.getElementById("f-nome").value,
        marca: document.getElementById("f-marca").value,
        tipo: document.getElementById("f-tipo").value,
        cor: colorInputHidden.value, 
        "peso-inicial-g": parseFloat(document.getElementById("f-peso").value),
        "preco-compra": parseFloat(document.getElementById("f-preco").value)
    };

    try {
        const resp = await fetch(`${API_BASE}/filamentos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            alert("Filamento salvo!");
            modal.style.display = "none";
            form.reset();
            applyColor("#000000"); 
            carregarFilamentos();
        } else {
            alert("Erro ao salvar.");
        }
    } catch (error) {
        alert("Erro de conexão.");
    }
});

/* ============================
   DELETAR & MODAL
============================ */
window.deletarFilamento = async (id) => {
    if(!confirm("Remover este filamento?")) return;
    try {
        await fetch(`${API_BASE}/filamentos/${id}`, { method: "DELETE" });
        carregarFilamentos();
    } catch (e) { alert("Erro"); }
};

btnNovo.addEventListener("click", () => modal.style.display = "flex");
closeBtns.forEach(btn => btn.addEventListener("click", () => modal.style.display = "none"));

// Start
carregarFilamentos();