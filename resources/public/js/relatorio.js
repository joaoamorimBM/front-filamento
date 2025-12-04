const API_BASE = "http://localhost:3000/api";

// Configuração inicial de datas
const hoje = new Date();
document.getElementById("mes-input").value = hoje.getMonth() + 1;
document.getElementById("ano-input").value = hoje.getFullYear();

/* ================== TAB NAVIGATION ================== */
function switchTab(tabId) {
    // Esconder todos
    document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));

    // Mostrar alvo
    document.getElementById(`view-${tabId}`).style.display = "block";
    event.target.classList.add("active");

    // Carregar dados específicos se necessário
    if(tabId === 'estatisticas') carregarGeral();
    if(tabId === 'top10') carregarTop10();
    if(tabId === 'mensal') carregarMensal();
}

/* ================== ESTATÍSTICAS GERAIS ================== */
async function carregarGeral() {
    const container = document.getElementById("stats-cards");
    try {
        const resp = await fetch(`${API_BASE}/relatorios/estatisticas`);
        const data = await resp.json();
        
        // Formatar valores
        const estoqueValor = formatMoney(data.filamentos["valor-estoque"]);
        const totalFilamento = data.filamentos["estoque-total-g"];
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Valor em Estoque</div>
                <div class="stat-val" style="color: #27ae60;">${estoqueValor}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Peso Total (Estoque)</div>
                <div class="stat-val">${(totalFilamento/1000).toFixed(1)} kg</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tipos de Filamento</div>
                <div class="stat-val">${data.filamentos.total}</div>
            </div>
        `;
    } catch(e) {
        container.innerHTML = "Erro ao carregar.";
    }
}

/* ================== TOP 10 ================== */
async function carregarTop10() {
    const tbody = document.getElementById("top10-body");
    tbody.innerHTML = "<tr><td colspan='4'>Carregando...</td></tr>";
    
    try {
        const resp = await fetch(`${API_BASE}/impressoes/top-lucrativas?n=10`);
        const data = await resp.json();
        
        tbody.innerHTML = "";
        data.forEach(item => {
            // O backend retorna chaves como :nome ou "nome"
            // Use o helper para garantir
            const nome = item.nome || item["impressoes/nome"];
            const dataRaw = item.data_inicio || item["impressoes/data_inicio"];
            const pv = item.preco_venda || item["impressoes/preco_venda"];
            const lucro = item.margem_lucro || item["impressoes/margem_lucro"];

            tbody.innerHTML += `
                <tr>
                    <td>${nome}</td>
                    <td>${new Date(dataRaw).toLocaleDateString()}</td>
                    <td>${formatMoney(pv)}</td>
                    <td style="color: green; font-weight: bold;">${formatMoney(lucro)}</td>
                </tr>
            `;
        });
    } catch(e) {
        console.error(e);
        tbody.innerHTML = "<tr><td colspan='4'>Erro.</td></tr>";
    }
}

/* ================== MENSAL ================== */
async function carregarMensal() {
    const mes = document.getElementById("mes-input").value;
    const ano = document.getElementById("ano-input").value;
    const div = document.getElementById("mensal-result");
    
    div.innerHTML = "Calculando...";

    try {
        const resp = await fetch(`${API_BASE}/relatorios/mensal?ano=${ano}&mes=${mes}`);
        const data = await resp.json();

        // Se retornar vazio
        if(!data || !data.total_impressoes) {
            div.innerHTML = "<p>Sem dados para este período.</p>";
            return;
        }

        div.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Faturamento</div>
                    <div class="stat-val">${formatMoney(data.total_receitas)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Lucro Líquido</div>
                    <div class="stat-val" style="color: green;">${formatMoney(data.total_lucro)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Custos Totais</div>
                    <div class="stat-val" style="color: #c0392b;">${formatMoney(data.total_custos)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Impressões</div>
                    <div class="stat-val">${data.total_impressoes}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Filamento Gasto</div>
                    <div class="stat-val">${parseFloat(data.total_filamento_g).toFixed(0)} g</div>
                </div>
            </div>
        `;

    } catch(e) {
        div.innerHTML = "Erro ao buscar relatório.";
    }
}

function formatMoney(val) {
    if(val === undefined || val === null) return "R$ 0,00";
    return `R$ ${parseFloat(val).toFixed(2).replace('.', ',')}`;
}

// Iniciar na primeira aba
carregarGeral();