# RADEN

Solução para visualização de indicadores de Controle de Estoque de manutenção.

Criação de uma solução interativa para visualizar o controle de materiais estocáveis no almoxarifado e dos itens que estão no reparo externo.

Plataforma desenvolvida no âmbito da Demanda da Indústria do SENAI Betim.
Link da demanda: https://plataforma.gpinovacao.senai.br/plataforma/demandas-da-industria/interna/12333

## Instruções de Acesso

Acesse o sistema através do link: [raden.site.je](http://raden.site.je) e entre no login com as credenciais abaixo:

### GESTOR
* **Email:** nataliagestor@raden.com.br
* **Senha:** 123456

### COLABORADOR
* **Email:** davidcolaborador@raden.com.br
* **Senha:** 123456

## Tecnologias Utilizadas

* Banco de dados: MySQL
* Interface Web: HTML, CSS, PHP e JavaScript

## Integrantes do Grupo

* Líder: David Fernandes
* Natália de Souza
* Rian Calvin
* Augusto Henrique
* Enzo Duarte

## Estrutura de Diretórios

```text
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
