RADEN

Solução para visualização de indicadores de Controle de Estoque de manutenção.

Criação de uma solução interativa para visualizar o controle de materiais estocáveis no almoxarifado e dos itens que estão no reparo externo.  

(https://plataforma.gpinovacao.senai.br/plataforma/demandas-da-industria/interna/12333) 

1- Tecnologias utilizadas: ● Banco de dados (MySQL); ● Interface Web com HTML, CSS, PHP e JavaScipt;

2- Integrantes do Grupo: ● Líder: David Fernandes; ○ Natália de Souza; ○ Rian Calvin; ○ Augusto Henrique; ○ Enzo Duarte;

INSTRUÇÕES: Acessando o link do site, [raden.site.je] entre no login com o email e a senha disponibilizados para Gestor ou Colaborador.

GESTOR: 
Email: NataliaGestor@raden.com.br
Senha: 123456

COLABORADOR:
Email: DavidColaborador@raden.com.br
Senha: 123456




TCC-SENAI-Betim-David/
│
├── README.md
│
├── docs/
│   ├── Documentacao.pdf
│   ├── Pitch.mp4
│   └── Slides.pdf
│
├── backend/
│   ├── api/
│   │   ├── arquivarItens.php
│   │   ├── buscarItens.php
│   │   ├── ProcessarLogin.php
│   │   ├── salvarHistorico.php
│   │   └── salvarItens.php
│   │
│   ├── Classes/
│   │   └── Funcionario.php
│   │
│   └── Conexao/
│       ├── Conexao.php
│       └── TesteConexao.php
│
├── frontend/
│   ├── css/
│   │   ├── dashboard.css
│   │   ├── login.css
│   │   └── theme.css
│   │
│   ├── images/
│   │   ├── favicon.svg
│   │   └── Logo.svg
│   │
│   ├── js/
│   │   ├── api.js
│   │   ├── dashboard.js
│   │   └── login.js
│   │
│   ├── dashboard.html
│   ├── dashboardColaborador.html
│   └── index.html
│
└── database/
    ├── Dump20260706.sql
    ├── modelo-relacional.pdf
    └── dicionario-de-dados.pdf
