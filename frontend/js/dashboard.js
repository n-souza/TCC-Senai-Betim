// ESTADO GLOBAL DO SISTEMA
let modoEdicaoAtivo = false;
let linhaSendoEditada = null;
let ordemCrescenteCriticidade = true;
let ordemCrescenteEtapa = true;
let visualizandoArquivados = false;
let termoPesquisa = "";
let termoPesquisaHistorico = '';

let paginaAtualTabela = 1;
const itensPorPaginaTabela = 15;
let paginaAtualHist = 1;
const itensPorPaginaHist = 10;

let itensAtivos = [];
let itensArquivados = [];
let historicoAlteracoes = [];

const CAMPOS_FORM = ['inputNome', 'inputSetor', 'txtDescricao', 'selectCriticidade', 'selectEtapa'];
const OBTEM_ELEMENTO = id => document.getElementById(id);

// INICIALIZAÇÃO DO SISTEMA
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosDoBanco();
    configurarFiltroPesquisa();
    OBTEM_ELEMENTO('formEquipamento')?.addEventListener('submit', salvarFormulario);
});

// HISTÓRICO & LOGS
async function registrarLog(acao, tag, detalhes) {
    const agora = new Date();
    const fuso = { timeZone: 'America/Sao_Paulo' };
    const dataFormatada = agora.toLocaleDateString('pt-BR', fuso);
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { ...fuso, hour: '2-digit', minute: '2-digit' });
    const tagFormatada = String(tag).toUpperCase();

    historicoAlteracoes.unshift({
        data: `${dataFormatada} às ${horaFormatada}`,
        acao,
        tag: tagFormatada,
        detalhes
    });

    try {
        await fetch('../backend/api/salvarHistorico.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acao, tag: tagFormatada, detalhes })
        });
    } catch (erro) {
        console.error('Falha ao sincronizar o log com o banco de dados:', erro);
    }
}

// RENDERIZAÇÃO DA TABELA
async function carregarDadosDoBanco() {
    try {
        const dados = await API.buscarItens(); 
        if (dados) {
            itensAtivos = dados.ativos || [];
            itensArquivados = dados.arquivados || [];
            historicoAlteracoes = dados.historico || []; 
            renderizarTabela();
            atualizarDatalistsRecomendacoes();
        }
    } catch (erro) {
        console.error('Erro ao processar os dados da API:', erro);
        alert('O servidor respondeu com um formato inválido. Verifique o arquivo PHP no backend.');
    }
}

function renderizarTabela() {
    const tabelaBody = document.querySelector('.custom-table tbody');
    if (!tabelaBody) return;
    
    tabelaBody.innerHTML = "";
    const listaBase = visualizandoArquivados ? itensArquivados : itensAtivos;

    const listaFiltrada = listaBase.filter(item => {
        const tagTexto = item.tag ? String(item.tag).toLowerCase() : '';
        const nomeTexto = item.nome ? String(item.nome).toLowerCase() : '';
        return tagTexto.includes(termoPesquisa) || nomeTexto.includes(termoPesquisa);
    });

    if (listaFiltrada.length === 0) {
        tabelaBody.innerHTML = `<tr><td colspan="6" style="color: #a0a5ad; font-style: italic; padding: 30px; text-align: center;">Nenhum item encontrado.</td></tr>`;
        atualizarControlesPaginacao('Tabela', 1, 1);
        return;
    }

    const totalPaginas = Math.ceil(listaFiltrada.length / itensPorPaginaTabela);
    paginaAtualTabela = Math.max(1, Math.min(paginaAtualTabela, totalPaginas));

    const indiceInicio = (paginaAtualTabela - 1) * itensPorPaginaTabela;
    const itensPaginados = listaFiltrada.slice(indiceInicio, indiceInicio + itensPorPaginaTabela);

    itensPaginados.forEach(item => {
        const indexReal = listaBase.findIndex(i => i.tag === item.tag); 
        const novaLinha = document.createElement('tr');
        novaLinha.style.cursor = "pointer";
        novaLinha.dataset.index = indexReal; 
        novaLinha.dataset.id = item.id;

        const tagGarantida = item.tag ? String(item.tag) : "";
        novaLinha.addEventListener('click', () => abrirRF3(tagGarantida, novaLinha));

        const criticidade = (item.criticidade || 'baixa').toLowerCase();
        const etapa = (item.etapa || 'analise').toLowerCase();

        novaLinha.innerHTML = `
            <td>${tagGarantida.toUpperCase()}</td>
            <td>${item.nome || ''}</td>
            <td>${item.setor || ''}</td>
            <td><div class="conteudo-scroll">${item.descricao || 'Sem observações.'}</div></td>
            <td><span class="badge ${criticidade}">${criticidade.toUpperCase()}</span></td>
            <td><span class="badge ${etapa}">${etapa.toUpperCase()}</span></td>
        `;
        tabelaBody.appendChild(novaLinha);
    });

    atualizarControlesPaginacao('Tabela', paginaAtualTabela, totalPaginas);
}

// CONTROLE DE MODOS (EDIÇÃO / VISUALIZAÇÃO)
function alternarModoEdicao(ativo) {
    if (visualizandoArquivados) return;
    modoEdicaoAtivo = ativo;
    OBTEM_ELEMENTO('botoesPadrao').style.display = ativo ? 'none' : 'flex';
    OBTEM_ELEMENTO('avisoSelecao').style.display = ativo ? 'flex' : 'none';
}

const ativarModoEdicao = () => alternarModoEdicao(true);
const cancelarModoEdicao = () => alternarModoEdicao(false);

// GERENCIAMENTO DO MODAL
function abrirRF3(tagEquipamento, elementoLinha) {
    if (!modoEdicaoAtivo && !visualizandoArquivados) return; 

    linhaSendoEditada = elementoLinha;
    alternarModoEdicao(false);

    const item = (visualizandoArquivados ? itensArquivados : itensAtivos)[elementoLinha.dataset.index];

    CAMPOS_FORM.forEach(id => OBTEM_ELEMENTO(id).disabled = visualizandoArquivados);
    OBTEM_ELEMENTO('inputTag').disabled = true;

    OBTEM_ELEMENTO('modalTitle').innerText = visualizandoArquivados ? "Visualizar Item Arquivado" : "Editar Equipamento";
    OBTEM_ELEMENTO('btnArquivarModal').style.display = visualizandoArquivados ? 'none' : 'block';
    OBTEM_ELEMENTO('btnDesarquivarModal').style.display = visualizandoArquivados ? 'block' : 'none';
    document.querySelector('.btn-salvar').style.display = visualizandoArquivados ? 'none' : 'block';

    OBTEM_ELEMENTO('inputTag').value = item.tag || "";
    OBTEM_ELEMENTO('inputNome').value = item.nome || "";
    OBTEM_ELEMENTO('inputSetor').value = item.setor || ""; 
    OBTEM_ELEMENTO('txtDescricao').value = item.descricao || "";
    OBTEM_ELEMENTO('selectCriticidade').value = item.criticidade || "BAIXA";
    OBTEM_ELEMENTO('selectEtapa').value = item.etapa || "ENVIO";

    OBTEM_ELEMENTO('modalEquipamento').classList.add('active');
}

function abrirParaCadastrar() {
    alternarModoEdicao(false); 
    linhaSendoEditada = null; 
    
    OBTEM_ELEMENTO('modalTitle').innerText = "Cadastrar Novo Item";
    OBTEM_ELEMENTO('formEquipamento').reset();
    
    CAMPOS_FORM.forEach(id => OBTEM_ELEMENTO(id).disabled = false);

    const inputTag = OBTEM_ELEMENTO('inputTag');
    inputTag.disabled = true;
    inputTag.placeholder = "Gerado automaticamente"; 

    OBTEM_ELEMENTO('btnArquivarModal').style.display = 'none';
    OBTEM_ELEMENTO('btnDesarquivarModal').style.display = 'none';
    document.querySelector('.btn-salvar').style.display = 'block';

    OBTEM_ELEMENTO('modalEquipamento').classList.add('active');
}

function fecharModal() {
    OBTEM_ELEMENTO('modalEquipamento').classList.remove('active');
    linhaSendoEditada = null;
}

// PROCESSO DE SALVAR / CADASTRAR 
async function salvarFormulario(event) {
    event.preventDefault(); 

    const dadosForm = {
        tag: OBTEM_ELEMENTO('inputTag').value || null, 
        nome: OBTEM_ELEMENTO('inputNome').value,
        setor: OBTEM_ELEMENTO('inputSetor').value,
        descricao: OBTEM_ELEMENTO('txtDescricao').value,
        criticidade: OBTEM_ELEMENTO('selectCriticidade').value,
        etapa: OBTEM_ELEMENTO('selectEtapa').value,
        setor: 'Planta de Beneficiamento'
    };

    const isCadastro = OBTEM_ELEMENTO('modalTitle').innerText === "Cadastrar Novo Item";
    let idx = null, itemAntigo = null, alteracoes = [];

    if (!isCadastro && linhaSendoEditada) {
        idx = linhaSendoEditada.dataset.index;
        itemAntigo = itensAtivos[idx];
        
        if (itemAntigo.nome !== dadosForm.nome) alteracoes.push(`Nome ("${itemAntigo.nome}" ➔ "${dadosForm.nome}")`);
        if (itemAntigo.criticidade !== dadosForm.criticidade) alteracoes.push(`Criticidade (${itemAntigo.criticidade} ➔ ${dadosForm.criticidade})`);
        if (itemAntigo.etapa !== dadosForm.etapa) alteracoes.push(`Etapa (${itemAntigo.etapa} ➔ ${dadosForm.etapa})`);
    }

    try {
        const resposta = await fetch('../backend/api/salvarItens.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acao: isCadastro ? "cadastrar" : "editar", dados: dadosForm })
        });

        const resultado = await resposta.json();
        if (!resultado.sucesso) return alert('Erro ao salvar no banco: ' + resultado.erro);
        
        if (isCadastro) {
            dadosForm.tag = resultado.tag; 
            itensAtivos.unshift(dadosForm);
            await registrarLog("CADASTRO", dadosForm.tag, `O equipamento "${dadosForm.nome}" foi cadastrado.`);
        } else {
            itensAtivos[idx] = dadosForm;
            await registrarLog("EDIÇÃO", itemAntigo.tag, alteracoes.length > 0 ? alteracoes.join(', ') : 'Nenhum valor modificado.');
        }
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        return alert('Erro de comunicação com o servidor.');
    }

    renderizarTabela();
    atualizarDatalistsRecomendacoes();
    fecharModal();
}

// ATUALIZA AS SUGESTÕES DOS INPUTS (AUTOCOMPLETE)
// ATUALIZA AS SUGESTÕES DOS INPUTS (AUTOCOMPLETE)
function atualizarDatalistsRecomendacoes() {
    const datalistNome = OBTEM_ELEMENTO('listaNomesRecomendados');
    const datalistSetor = OBTEM_ELEMENTO('listaSetoresRecomendados');
    
    if (!datalistNome || !datalistSetor) {
        console.warn("Aviso: Elementos datalist não foram encontrados no DOM. Verifique os IDs no HTML.");
        return;
    }

    // Une ativos e arquivados para buscar todo o histórico do banco
    const todosOsItens = [...itensAtivos, ...itensArquivados];

    const nomes = [];
    const setores = [];

    todosOsItens.forEach(item => {
        // Aceita as chaves tanto em maiúsculo quanto em minúsculo vindas do PHP
        const nomeValido = item.nome || item.NOME || item.Nome;
        const setorValido = item.setor || item.SETOR || item.Setor;

        if (nomeValido && String(nomeValido).trim() !== "") {
            nomes.push(String(nomeValido).trim());
        }
        if (setorValido && String(setorValido).trim() !== "") {
            setores.push(String(setorValido).trim());
        }
    });

    // Remove os nomes e setores duplicados e ordena de A-Z
    const nomesUnicos = [...new Set(nomes)].sort((a, b) => a.localeCompare(b));
    const setoresUnicos = [...new Set(setores)].sort((a, b) => a.localeCompare(b));

    // Injeta as opções dentro das tags <datalist>
    datalistNome.innerHTML = nomesUnicos.map(nome => `<option value="${nome}"></option>`).join('');
    datalistSetor.innerHTML = setoresUnicos.map(setor => `<option value="${setor}"></option>`).join('');
    
    console.log("Datalists atualizados com sucesso!", { TotalNomes: nomesUnicos.length, TotalSetores: setoresUnicos.length });
}

// ARQUIVAR / DESARQUIVAR
async function moverEquipamento(origem, destino, acaoLog, textoLog) {
    if (!linhaSendoEditada) return;
    const idx = linhaSendoEditada.dataset.index;
    const item = origem[idx]; 
    const tagItem = item.tag || item.TAG || null;

    if (!tagItem) return alert("Erro local: Não foi possível localizar a TAG deste equipamento.");

    try {
        const resposta = await fetch('../backend/api/arquivarItens.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag: tagItem, acao: acaoLog === "ARQUIVAMENTO" ? "arquivar" : "desarquivar" })
        });

        if (!resposta.ok) throw new Error(`Erro no servidor: Status ${resposta.status}`);
        const resultado = await resposta.json();
        if (!resultado.sucesso) return alert('Erro ao mover o item no banco de dados: ' + resultado.erro);

        origem.splice(idx, 1);
        destino.unshift(item);

        await registrarLog(acaoLog, tagItem, `O equipamento "${item.nome || ''}" ${textoLog}`);
        renderizarTabela();
        fecharModal();
    } catch (erro) {
        console.error('Erro na requisição de arquivamento:', erro);
        alert('Erro de comunicação com o servidor ao tentar alterar o status do item.');
    }
}

const arquivarEquipamento = () => moverEquipamento(itensAtivos, itensArquivados, "ARQUIVAMENTO", "foi enviado para a lista de arquivados.");
const desarquivarEquipamento = () => moverEquipamento(itensArquivados, itensAtivos, "DESARQUIVAMENTO", "foi restaurado para os ativos.");

function verArquivados() {
    visualizandoArquivados = !visualizandoArquivados;
    paginaAtualTabela = 1;
    
    const btnIcone = OBTEM_ELEMENTO('btnVerArquivados');
    if (btnIcone) {
        btnIcone.style.cssText = visualizandoArquivados ? "background-color: #ffb300; border-color: #ffb300; color: #22252a;" : "";
        btnIcone.title = visualizandoArquivados ? "Visualizar Itens Ativos" : "Visualizar Itens Arquivados";
    }

    document.querySelectorAll('.btn-editar, .btn-adicionar').forEach(btn => {
        btn.disabled = visualizandoArquivados;
        btn.style.opacity = visualizandoArquivados ? "0.4" : "1";
        btn.style.cursor = visualizandoArquivados ? "not-allowed" : "pointer";
    });

    renderizarTabela();
}

// EXPORTAÇÃO E FILTROS
function configurarFiltroPesquisa() {
    // Escuta a pesquisa da tabela principal
    document.querySelector('#toolbarContainer .search-input')?.addEventListener('input', function() {
        paginaAtualTabela = 1; 
        termoPesquisa = this.value.toLowerCase(); 
        renderizarTabela(); 
    });

    // Escuta a pesquisa do modal de histórico
    document.getElementById('searchHistorico')?.addEventListener('input', function() {
        paginaAtualHist = 1; // Volta para a página 1 ao filtrar
        termoPesquisaHistorico = this.value.toLowerCase(); // Atualiza o termo global do histórico
        renderizarListaHistorico(); // Re-renderiza a lista com o filtro aplicado
    });
}

function ordenarPor(propriedade, pesos, flagCrescente, setaId) {
    const lista = visualizandoArquivados ? itensArquivados : itensAtivos;
    lista.sort((a, b) => {
        const pesoA = pesos[a[propriedade].toUpperCase()] || 0;
        const pesoB = pesos[b[propriedade].toUpperCase()] || 0;
        return flagCrescente ? pesoA - pesoB : pesoB - pesoA;
    });

    const seta = OBTEM_ELEMENTO(setaId);
    if (seta) seta.innerText = flagCrescente ? "⬇" : "⬆";
    renderizarTabela();
}

const ordenarPorCriticidade = () => {
    ordenarPor('criticidade', { 'ALTA': 3, 'MÉDIA': 2, 'MEDIA': 2, 'BAIXA': 1 }, ordemCrescenteCriticidade, 'setaCriticidade');
    ordemCrescenteCriticidade = !ordemCrescenteCriticidade;
};

const ordenarPorEtapa = () => {
    ordenarPor('etapa', { 'ENVIO': 1, 'PERITAGEM': 2, 'APROVAÇÃO': 3, 'APROVACAO': 3, 'EXECUÇÃO': 4, 'EXECUCAO': 4, 'RETORNO': 5 }, ordemCrescenteEtapa, 'setaEtapa');
    ordemCrescenteEtapa = !ordemCrescenteEtapa;
};

function verHistorico() {
    alternarModoEdicao(false);
    if (!OBTEM_ELEMENTO('modalHistorico')) return;
    
    // Limpa a barra de pesquisa ao abrir o modal
    const inputBuscaHist = OBTEM_ELEMENTO('searchHistorico');
    if (inputBuscaHist) inputBuscaHist.value = '';
    termoPesquisaHistorico = ''; 

    paginaAtualHist = 1; 
    renderizarListaHistorico();
    OBTEM_ELEMENTO('modalHistorico').classList.add('active');
}

function renderizarListaHistorico() {
    const listaContainer = OBTEM_ELEMENTO('listaHistorico');
    if (!listaContainer) return;

    // FILTRO DINÂMICO: Filtra o histórico com base no que foi digitado
    const historicoFiltrado = historicoAlteracoes.filter(log => {
        if (!termoPesquisaHistorico) return true; // Se não houver pesquisa, traz tudo
        
        return (
            log.tag?.toLowerCase().includes(termoPesquisaHistorico) ||
            log.acao?.toLowerCase().includes(termoPesquisaHistorico) ||
            log.detalhes?.toLowerCase().includes(termoPesquisaHistorico)
        );
    });

    // Se o resultado do filtro for vazio
    if (historicoFiltrado.length === 0) {
        listaContainer.innerHTML = `<p style="color: #a0a5ad; font-style: italic; text-align: center; padding: 20px;">Nenhum registro encontrado para essa pesquisa.</p>`;
        atualizarControlesPaginacao('Hist', 1, 1);
        return;
    }

    // Cálculos de paginação baseados agora na lista filtrada
    const totalPaginas = Math.ceil(historicoFiltrado.length / itensPorPaginaHist);
    paginaAtualHist = Math.max(1, Math.min(paginaAtualHist, totalPaginas));

    // Corta os itens baseando-se no histórico filtrado
    const logsPaginados = historicoFiltrado.slice((paginaAtualHist - 1) * itensPorPaginaHist, paginaAtualHist * itensPorPaginaHist);

    listaContainer.innerHTML = logsPaginados.map(log => {
        const cores = { CADASTRO: "#2196f3", EDIÇÃO: "#ffb300", ARQUIVAMENTO: "#d32f2f" };
        const cor = cores[log.acao] || "#4fa135";
        return `
            <div style="background-color: #1a1c1e; border-left: 4px solid ${cor}; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #a0a5ad; margin-bottom: 4px;">
                    <span><strong>${log.data}</strong></span>
                    <span style="color: ${cor}; font-weight: bold;">${log.acao}</span>
                </div>
                <p style="font-size: 14px; color: #ffffff; margin: 0;"><strong style="color: #5c913b;">[${log.tag}]</strong> ${log.detalhes}</p>
            </div>`;
    }).join('');

    atualizarControlesPaginacao('Hist', paginaAtualHist, totalPaginas);
}

const fecharModalHistorico = () => OBTEM_ELEMENTO('modalHistorico').classList.remove('active');

// DOWNLOAD DO HISTÓRICO
function baixarHistorico() {
    if (historicoAlteracoes.length === 0) return alert("Não há registros para exportar.");

    const dataInicioStr = OBTEM_ELEMENTO('dataInicio').value;
    const dataFimStr = OBTEM_ELEMENTO('dataFim').value;

    const logsFiltrados = historicoAlteracoes.filter(log => {
        const dataLogIso = log.data.includes('-') ? log.data.split(' ')[0] : log.data.split(' ')[0].split('/').reverse().join('-');
        return (!dataInicioStr || dataLogIso >= dataInicioStr) && (!dataFimStr || dataLogIso <= dataFimStr);
    });

    if (logsFiltrados.length === 0) return alert("Nenhum registro encontrado para o período selecionado.");

    const fuso = { timeZone: 'America/Sao_Paulo' };
    const coresHtml = { CADASTRO: "#2196f3", EDIÇÃO: "#ffb300", ARQUIVAMENTO: "#d32f2f" };

    let conteudoHtml = `
        <html><head><title>Relatório de Histórico</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
            h1 { text-align: center; color: #2c3e50; }
            p.sub { text-align: center; color: #7f8c8d; font-size: 14px; }
            .item-log { border-bottom: 1px solid #eee; padding: 15px 0; page-break-inside: avoid; }
            .topo-log { display: flex; justify-content: space-between; font-size: 12px; color: #7f8c8d; }
            .tag { color: #27ae60; font-weight: bold; }
            .detalhes { font-size: 14px; margin: 5px 0 0 0; color: #2c3e50; }
        </style></head>
        <body><h1>HISTÓRICO DE ALTERAÇÕES DO SISTEMA</h1><p class="sub">Gerado em: ${new Date().toLocaleDateString('pt-BR', fuso)} às ${new Date().toLocaleTimeString('pt-BR', fuso)}</p>`;

    logsFiltrados.forEach(log => {
        let dataExibicao = log.data;
        if (log.data.includes('-')) {
            const partes = log.data.split(' ');
            dataExibicao = `${partes[0].split('-').reverse().join('/')} às ${partes[1] ? partes[1].substring(0, 5) : ''}`;
        }

        conteudoHtml += `
            <div class="item-log">
                <div class="topo-log"><span><strong>Data:</strong> ${dataExibicao}</span><span style="color: ${coresHtml[log.acao] || "#4fa135"}; font-weight:bold;">${log.acao}</span></div>
                <p class="detalhes"><span class="tag">[${log.tag}]</span> ${log.detalhes}</p>
            </div>`;
    });

    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(conteudoHtml + '</body></html>');
    janelaImpressao.document.close();
    setTimeout(() => { janelaImpressao.print(); janelaImpressao.close(); }, 250);
}

// NAVEGAÇÃO & PAGINAÇÃO
function mudarPagina(tipo, direcao) {
    if (tipo === 'Tabela') {
        paginaAtualTabela += direcao;
        renderizarTabela();
    } else if (tipo === 'Hist') {
        paginaAtualHist += direcao;
        renderizarListaHistorico();
    }
}
const mudarPaginaTabela = direcao => mudarPagina('Tabela', direcao);
const mudarPaginaHist = direcao => mudarPagina('Hist', direcao);

function atualizarControlesPaginacao(tipo, paginaAtual, totalPaginas) {
    const infoPagina = OBTEM_ELEMENTO(`infoPagina${tipo}`);
    if (infoPagina) infoPagina.innerText = `${paginaAtual} / ${totalPaginas}`;
    
    const btnAnterior = OBTEM_ELEMENTO(`btn${tipo}Anterior`);
    if (btnAnterior) btnAnterior.disabled = (paginaAtual === 1);
    
    const btnProximo = OBTEM_ELEMENTO(`btn${tipo}Proxima`);
    if (btnProximo) btnProximo.disabled = (paginaAtual === totalPaginas || totalPaginas === 0);
}