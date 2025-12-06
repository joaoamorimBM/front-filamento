Aqui está uma proposta de README.md profissional e detalhada para o seu repositório front-filamento.

Este documento destaca as tecnologias utilizadas, como rodar o projeto e descreve as funcionalidades que implementamos (como o controle de estoque com cores e os relatórios), ideal para apresentar na faculdade.

🐿️ Front Filamento - Print Manager Client
Interface web moderna para o sistema Print Manager, desenvolvida para gerenciar custos, estoque de filamentos e histórico de impressões 3D. Este projeto consome a API do backend Print Manager e oferece uma experiência visual rica para o usuário.

🎯 Objetivo
Prover um painel de controle intuitivo onde o usuário pode visualizar o status de suas impressoras Bambu Lab, gerenciar seu inventário de materiais com precisão visual (cores e níveis de estoque) e analisar a lucratividade através de relatórios financeiros detalhados.

✨ Funcionalidades Principais
🏠 Dashboard (Home)
Monitoramento: Visualização de impressões recentes com status codificado por cores (🔵 Imprimindo, 🟢 Concluído, 🔴 Falha).

Sincronização: Botão para buscar dados atualizados da nuvem Bambu Lab.

Detalhes Rápidos: Cards com foto da peça, tempo, peso e preços sugeridos.

📦 Gestão de Filamentos
Inventário Visual: Tabela com bolinhas coloridas (HEX) representando a cor real do material.

Barra de Estoque: Indicador visual de consumo (verde, amarelo, vermelho) baseado no peso restante.

Cadastro Completo: Modal para adição de filamentos com seletor de cores (presets e roda de cores), marca, tipo e custos.

📊 Relatórios Avançados
Períodos Flexíveis: Análise Semanal, Mensal e Anual.

KPIs: Exibição de Faturamento, Custos Totais, Lucro Líquido e Quantidade de Impressões.

Top 10: Lista das impressões mais lucrativas do período selecionado.

⚙️ Configurações
Parametrização: Ajuste de custos de energia (kWh), markup, impostos e taxas de cartão para refinar o cálculo automático de preços.

🛠️ Tecnologias Utilizadas
Este projeto segue a arquitetura de Server-Side Rendering (SSR) parcial, onde o Clojure serve as páginas HTML e o JavaScript manipula a dinamicidade no cliente.

Linguagem (Servidor): Clojure

Web Framework: Ring + Reitit (Roteamento)

Templating: Selmer (Renderização de HTML baseada em Django templates)

Frontend:

HTML5 & CSS3: Estilização modular e responsiva.

JavaScript (Vanilla): Lógica de consumo da API (fetch), manipulação de DOM e modais.

Build Tool: Leiningen

🚀 Como Rodar o Projeto
Pré-requisitos
Java JDK 11+

Leiningen instalado.

O Backend API deve estar rodando na porta 3000 (ou conforme configurado no js/app.js).

Passo a Passo
Clone o repositório:

Bash

git clone https://github.com/seu-usuario/front-filamento.git
cd front-filamento
Instale as dependências:

Bash

lein deps
Inicie o servidor de desenvolvimento:

Bash

lein ring server
# O servidor geralmente iniciará na porta 3000 ou 4000.
# Verifique o terminal.
Acesse no navegador: Abra http://localhost:3000 (ou a porta indicada).

📂 Estrutura do Projeto
front-filamento/
├── resources/
│   ├── html/              # Templates Selmer (Páginas)
│   │   ├── base.html      # Layout mestre
│   │   ├── home.html      # Dashboard
│   │   ├── filamentos.html
│   │   └── ...
│   └── public/            # Arquivos Estáticos
│       ├── css/           # Estilos (base.css, home.css, etc.)
│       ├── js/            # Lógica cliente (api calls, dom manipulation)
│       └── img/           # Assets gráficos
├── src/clj/front_filamentos/
│   ├── routes/            # Definição das rotas (URL -> Página)
│   └── core.clj           # Ponto de entrada da aplicação
└── project.clj            # Configurações do Leiningen
🔗 Integração com Backend
O frontend se comunica com a API REST através de chamadas fetch assíncronas localizadas nos arquivos .js.

Base URL: Configurada em resources/public/js/*.js (Padrão: http://localhost:3000/api).

Endpoints Principais:

GET /impressoes: Lista histórico.

GET /filamentos: Lista estoque.

POST /filamentos: Cria novo material.

GET /relatorios/custom: Gera dados estatísticos.

📝 Licença
Este projeto foi desenvolvido para fins acadêmicos como parte da disciplina de Programação Funcional.
