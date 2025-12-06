console.log("relatorio.js v3.0 - Automático & Corrigido");

const API_BASE = "http://localhost:3000/api";

/* ================== NAVEGAÇÃO DE ABAS ================== */
function openTab(tabName, event) {
    // 1. Esconder todo o conteúdo
    document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
    
    // 2. Remover classe 'active' de todos os botões
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

    // 3. Ativar o botão correto
    if (event) {
        event.currentTarget.classList.add("active");
    } else {
        // Se foi chamado via código, acha o botão pelo atributo onclick
        const btn = document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`);
        if (btn) btn.classList.add("active");
    }

    // 4. Mostrar o painel correspondente
    // (Como agora é tudo automático, usamos um painel único dinâmico)
    const output = document.getElementById("report-output");
    output.style.display = "block";
    
    // 5. Gerar o relatório automaticamente
    gerarRelatorio(tabName);
}

/* ================== CÁLCULO DE DATAS AUTOMÁTICO ================== */
function getDates(tipo) {
    const now = new Date();
    let start, end, title;

    if (tipo === 'semanal') {
        // Segunda a Domingo da semana atual
        const day = now.getDay(); // 0=Dom, 1=Seg
        const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
        
        const monday = new Date(now);
        monday.setDate(diffToMonday);
        monday.setHours(0,0,0,0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);

        start = monday.toISOString().split('T')[0];
        end = sunday.toISOString().split('T')[0];
        title = `Semana Atual (${formatDateBr(start)} a ${formatDateBr(end)})`;

    } else if (tipo === 'mensal') {
        // Dia 1 até o último dia do mês atual
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0); // Último dia

        start = firstDay.toISOString().split('T')[0];
        end = lastDay.toISOString().split('T')[0];
        
        const nomeMes = firstDay.toLocaleString('pt-BR', { month: 'long' });
        title = `Mês Atual: ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}/${year}`;

    } else if (tipo === 'anual') {
        // 1 de Jan a 31 de Dez do ano atual
        const year = now.getFullYear();
        start = `${year}-01-01`;
        end = `${year}-12-31`;
        title = `Ano de ${year}`;
    }

    return { start, end, title };
}

/* ================== API CALL ================== */
async function gerarRelatorio(tipo) {
    const dates = getDates(tipo);
    if (!dates) return;

    // UI Updates
    document.getElementById("period-title").textContent = dates.title;
    document.getElementById("stats-grid").style.opacity = "0.5";
    document.getElementById("top10-body").innerHTML = "<tr><td colspan='4' class='loading-cell'>Carregando dados...</td></tr>";

    try {
        console.log(`Buscando relatório: ${dates.start} até ${dates.end}`);
        
        const url = `${API_BASE}/relatorios/custom?inicio=${dates.start}&fim=${dates.end}`;
        const resp = await fetch(url);
        
        if(!resp.ok) {
            const err = await resp.json();
            throw new Error(err.erro || "Erro no servidor");
        }
        
        const data = await resp.json();
        renderizarDados(data);

    } catch (e) {
        console.error(e);
        alert(`Erro ao carregar relatório: ${e.message}`);
    } finally {
        document.getElementById("stats-grid").style.opacity = "1";
    }
}

function renderizarDados(data) {
    const stats = data.estatisticas || {};
    const top10 = data.top_lucrativas || [];

    // 1. Cards de Resumo
    // Se o backend mandar null, usa 0
    updateCard("val-faturamento", stats.total_receitas, false);
    updateCard("val-custos", stats.total_custos, false);
    updateCard("val-lucro", stats.total_lucro, true); // true = pinta de verde/vermelho
    document.getElementById("val-qtd").textContent = stats.total_impressoes || 0;

    // 2. Tabela Top 10
    const tbody = document.getElementById("top10-body");
    tbody.innerHTML = "";

    if (top10.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px; color:#888;'>Nenhuma venda neste período.</td></tr>";
        return;
    }

    top10.forEach(item => {
        // Fallbacks de segurança para chaves
        const nome = item["impressoes/nome"] || item.nome || "Sem nome";
        const dataRaw = item["impressoes/data_inicio"] || item.data_inicio;
        const venda = item["impressoes/preco_venda_real"] || item.preco_venda_real || 0;
        const lucro = item["impressoes/margem_lucro"] || item.margem_lucro || 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${nome}</strong></td>
            <td>${formatDateBr(dataRaw)}</td>
            <td>${formatMoney(venda)}</td>
            <td style="color: #27ae60; font-weight:bold;">${formatMoney(lucro)}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* ================== HELPERS ================== */
function updateCard(id, valor, colorize) {
    const el = document.getElementById(id);
    const val = parseFloat(valor || 0);
    el.textContent = formatMoney(val);
    
    if (colorize) {
        el.style.color = val >= 0 ? "#27ae60" : "#c0392b";
    }
}

function formatMoney(val) {
    return `R$ ${parseFloat(val || 0).toFixed(2).replace('.', ',')}`;
}

function formatDateBr(dateStr) {
    if(!dateStr) return "-";
    // Adiciona hora para evitar problema de fuso horário voltando o dia
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T12:00:00");
    return d.toLocaleDateString('pt-BR');
}

// Inicialização Automática
document.addEventListener("DOMContentLoaded", () => {
    openTab('semanal'); // Carrega a semana atual ao abrir
});