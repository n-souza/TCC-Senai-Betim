// VARIÁVEIS DE ESTADO GLOBAL
let modoEdicaoAtivo = false;
let linhaSendoEditada = null;
let ordemCrescenteCriticidade = true;
let ordemCrescenteEtapa = true;
let visualizandoArquivados = false;

let itensAtivos = [];
let itensArquivados = [];
let historicoAlteracoes = [];

// CONTROLE DE PAGINAÇÃO
let paginaAtual = 1;
const itensPorPagina = 15;
let paginaAtualHistorico = 1;
const itensPorPaginaHistorico = 10;

// INICIALIZAÇÃO DO SISTEMA
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosDoBanco();
    configurarFiltroPesquisa();
    
    // Configura o formulário de cadastro/edição
    const formEquipamento = document.getElementById('formEquipamento');
    if (formEquipamento) {
        formEquipamento.addEventListener('submit', salvarFormulario);
    }

    // --- CORREÇÃO AQUI: Vincula as funções de paginação aos botões do Histórico ---
    const btnHistAnterior = document.getElementById('btnHistAnterior');
    const btnHistProxima = document.getElementById('btnHistProxima');
    
    if (btnHistAnterior) {
        btnHistAnterior.addEventListener('click', paginaAnteriorHistorico);
    }
    if (btnHistProxima) {
        btnHistProxima.addEventListener('click', proximaPaginaHistorico);
    }
    // ----------------------------------------------------------------------------
});

// HISTÓRICO & LOGS
async function registrarLog(acao, tag, detalhes) {
    const agora = new Date();
    
<<<<<<< HEAD
=======
    // Forçando o fuso horário de Brasília na criação do Log local
>>>>>>> b9be6b6d46b56263ce9a2e2824c1b6435d19eed1
    const dataFormatada = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
        timeZone: 'America/Sao_Paulo', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const tagFormatada = String(tag).toUpperCase();

    historicoAlteracoes.unshift({
        data: `${dataFormatada} às ${horaFormatada}`,
        acao: acao,
        tag: tagFormatada,
        detalhes: detalhes
    });

    paginaAtualHistorico = 1;

    try {
        await fetch('../backend/salvar_historico.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                acao: acao,
                tag: tagFormatada,
                detalhes: detalhes
            })
        });
    } catch (erro) {
        console.error('Falha ao sincronizar o log com o banco de dados:', erro);
    }
}

// RENDERIZAÇÃO DA TABELA
async function carregarDadosDoBanco() {
    const dados = await API.buscarItens(); 
    if (dados) {
        itensAtivos = dados.ativos || [];
        itensArquivados = dados.arquivados || [];
        historicoAlteracoes = dados.historico || []; 
        renderizarTabela();
    }
}

function renderizarTabela() {
    const tabelaBody = document.querySelector('.custom-table tbody');
    if (!tabelaBody) return;
    
    tabelaBody.innerHTML = "";
    const listaCompleta = visualizandoArquivados ? itensArquivados : itensAtivos;

    if (listaCompleta.length === 0) {
        tabelaBody.innerHTML = `<tr><td colspan="6" style="color: #a0a5ad; font-style: italic; padding: 30px; text-align: center;">Nenhum item encontrado.</td></tr>`;
        atualizarControlesPagina(0);
        return;
    }

    const totalPaginas = Math.ceil(listaCompleta.length / itensPorPagina);
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas || 1;

    const indiceInicio = (paginaAtual - 1) * itensPorPagina;
    const indiceFim = indiceInicio + itensPorPagina;
    const itensPaginados = listaCompleta.slice(indiceInicio, indiceFim);

    itensPaginados.forEach((item, index) => {
        const indexReal = indiceInicio + index; 

        const novaLinha = document.createElement('tr');
        novaLinha.style.cursor = "pointer";
        novaLinha.dataset.index = indexReal; 
        novaLinha.dataset.id = item.id;

        const tagGarantida = item.tag ? String(item.tag) : "";

        novaLinha.addEventListener('click', function() {
            abrirRF3(tagGarantida, this);
        });

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

    atualizarControlesPagina(totalPaginas);
}

function atualizarControlesPagina(totalPaginas) {
    const btnAnterior = document.getElementById('btnPagAnterior');
    const btnProxima = document.getElementById('btnPagProxima');
    const infoPagina = document.getElementById('infoPagina');

    if (!btnAnterior || !btnProxima || !infoPagina) return;

    if (totalPaginas <= 1) {
        infoPagina.innerText = `Página 1 de 1`;
        btnAnterior.disabled = true;
        btnProxima.disabled = true;
        return;
    }

    infoPagina.innerText = `Página ${paginaAtual} de ${totalPaginas}`;
    btnAnterior.disabled = paginaAtual === 1;
    btnProxima.disabled = paginaAtual === totalPaginas;
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        renderizarTabela();
    }
}

function proximaPagina() {
    const listaCompleta = visualizandoArquivados ? itensArquivados : itensAtivos;
    const totalPaginas = Math.ceil(listaCompleta.length / itensPorPagina);
    
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        renderizarTabela();
    }
}

// CONTROLE DE MODOS (EDIÇÃO / VISUALIZAÇÃO)
function alternarModoEdicao(ativo) {
    if (visualizandoArquivados) return;
    modoEdicaoAtivo = ativo;
    document.getElementById('botoesPadrao').style.display = ativo ? 'none' : 'flex';
    document.getElementById('avisoSelecao').style.display = ativo ? 'flex' : 'none';
}
const ativarModoEdicao = () => alternarModoEdicao(true);
const cancelarModoEdicao = () => alternarModoEdicao(false);

// GERENCIAMENTO DO MODAL
function abrirRF3(tagEquipamento, elementoLinha) {
    if (!modoEdicaoAtivo && !visualizandoArquivados) return; 

    linhaSendoEditada = elementoLinha;
    cancelarModoEdicao();

    const idx = elementoLinha.dataset.index;
    const item = visualizandoArquivados ? itensArquivados[idx] : itensAtivos[idx];

    const campos = ['inputNome', 'inputFabricante', 'txtDescricao', 'selectCriticidade', 'selectEtapa'];
    campos.forEach(id => document.getElementById(id).disabled = visualizandoArquivados);
    document.getElementById('inputTag').disabled = true;

    document.getElementById('modalTitle').innerText = visualizandoArquivados ? "Visualizar Item Arquivado" : "Editar Equipamento";
    document.getElementById('btnArquivarModal').style.display = visualizandoArquivados ? 'none' : 'block';
    document.getElementById('btnDesarquivarModal').style.display = visualizandoArquivados ? 'block' : 'none';
    document.querySelector('.btn-salvar').style.display = visualizandoArquivados ? 'none' : 'block';

    document.getElementById('inputTag').value = item.tag || "";
    document.getElementById('inputNome').value = item.nome || "";
    document.getElementById('inputFabricante').value = item.fabricante || ""; 
    document.getElementById('txtDescricao').value = item.descricao || "";
    document.getElementById('selectCriticidade').value = item.criticidade || "BAIXA";
    document.getElementById('selectEtapa').value = item.etapa || "ENVIO";

    document.getElementById('modalEquipamento').classList.add('active');
}

function abrirParaCadastrar() {
    cancelarModoEdicao(); 
    linhaSendoEditada = null; 
    
    document.getElementById('modalTitle').innerText = "Cadastrar Novo Item";
    document.getElementById('formEquipamento').reset();
    
    const campos = ['inputNome', 'inputFabricante', 'txtDescricao', 'selectCriticidade', 'selectEtapa'];
    campos.forEach(id => document.getElementById(id).disabled = false);

    const inputTag = document.getElementById('inputTag');
    inputTag.disabled = true;
    inputTag.placeholder = "Gerado automaticamente"; 

    document.getElementById('btnArquivarModal').style.display = 'none';
    document.getElementById('btnDesarquivarModal').style.display = 'none';
    document.querySelector('.btn-salvar').style.display = 'block';

    document.getElementById('modalEquipamento').classList.add('active');
}

function fecharModal() {
    document.getElementById('modalEquipamento').classList.remove('active');
    linhaSendoEditada = null;
}

// PROCESSO DE SALVAR / CADASTRAR 
async function salvarFormulario(event) {
    event.preventDefault(); 

    const dadosForm = {
        tag: document.getElementById('inputTag').value || null, 
        nome: document.getElementById('inputNome').value,
        fabricante: document.getElementById('inputFabricante').value,
        descricao: document.getElementById('txtDescricao').value,
        criticidade: document.getElementById('selectCriticidade').value,
        etapa: document.getElementById('selectEtapa').value,
        setor: 'Planta de Beneficiamento'
    };

    const isCadastro = document.getElementById('modalTitle').innerText === "Cadastrar Novo Item";
    let acao = isCadastro ? "cadastrar" : "editar"; 
    let idx = null;
    let itemAntigo = null;
    let alteracoes = [];

    if (!isCadastro && linhaSendoEditada) {
        idx = linhaSendoEditada.dataset.index;
        itemAntigo = itensAtivos[idx];
        
        if (itemAntigo.nome !== dadosForm.nome) alteracoes.push(`Nome ("${itemAntigo.nome}" ➔ "${dadosForm.nome}")`);
        if (itemAntigo.criticidade !== dadosForm.criticidade) alteracoes.push(`Criticidade (${itemAntigo.criticidade} ➔ ${dadosForm.criticidade})`);
        if (itemAntigo.etapa !== dadosForm.etapa) alteracoes.push(`Etapa (${itemAntigo.etapa} ➔ ${dadosForm.etapa})`);
    }

    try {
        const resposta = await fetch('../backend/salvar_itens.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acao: acao, dados: dadosForm })
        });

        const resultado = await resposta.json();

        if (!resultado.sucesso) {
            alert('Erro ao salvar no banco: ' + resultado.erro);
            return;
        }
        
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
        alert('Erro de comunicação com o servidor.');
        return;
    }

    renderizarTabela();
    fecharModal();
}

// ARQUIVAR / DESARQUIVAR
async function moverEquipamento(origem, destino, acaoLog, textoLog) {
    if (!linhaSendoEditada) return;
    const idx = linhaSendoEditada.dataset.index;
    const item = origem[idx]; 
    const tagItem = item.tag || item.TAG || null;

    if (!tagItem) {
        alert("Erro local: Não foi possível localizar a TAG deste equipamento.");
        return;
    }
    
    const acaoBanco = (acaoLog === "ARQUIVAMENTO") ? "arquivar" : "desarquivar";

    try {
        const resposta = await fetch('../backend/arquivar_itens.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                tag: tagItem,
                acao: acaoBanco 
            })
        });

        if (!resposta.ok) {
            throw new Error(`Erro no servidor: Status ${resposta.status}`);
        }

        const resultado = await resposta.json();

        if (!resultado.sucesso) {
            alert('Erro ao mover o item no banco de dados: ' + resultado.erro);
            return;
        }

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
    paginaAtual = 1; 
    
    const btnIcone = document.getElementById('btnVerArquivados');
    const botoesAcao = document.querySelectorAll('.btn-editar, .btn-adicionar');

    if (btnIcone) {
        btnIcone.style.cssText = visualizandoArquivados ? "background-color: #ffb300; border-color: #ffb300; color: #22252a;" : "";
        btnIcone.title = visualizandoArquivados ? "Visualizar Itens Ativos" : "Visualizar Itens Arquivados";
    }

    botoesAcao.forEach(btn => {
        btn.disabled = visualizandoArquivados;
        btn.style.opacity = visualizandoArquivados ? "0.4" : "1";
        btn.style.cursor = visualizandoArquivados ? "not-allowed" : "pointer";
    });

    renderizarTabela();
}

// EXPORTAÇÃO E FILTROS
function configurarFiltroPesquisa() {
    const inputPesquisa = document.querySelector('.search-input');
    if (!inputPesquisa) return;

    inputPesquisa.addEventListener('input', function() {
        const termo = this.value.toLowerCase();
        paginaAtual = 1; 
        
        document.querySelectorAll('.custom-table tbody tr').forEach(linha => {
            if (linha.cells.length <= 1) return;
<<<<<<< HEAD
            const tag = linha.cells[0].innerText.toLowerCase();
=======
            const tag = linea = linha.cells[0].innerText.toLowerCase();
>>>>>>> b9be6b6d46b56263ce9a2e2824c1b6435d19eed1
            const nome = linha.cells[1].innerText.toLowerCase();
            linha.style.display = (tag.includes(termo) || nome.includes(termo)) ? "" : "none";
        });
    });
}

function ordenarPor(propriedade, pesos, flagCrescente, setaId) {
    const lista = visualizandoArquivados ? itensArquivados : itensAtivos;
    paginaAtual = 1; 
    
    lista.sort((a, b) => {
        const pesoA = pesos[a[propriedade].toUpperCase()] || 0;
        const pesoB = pesos[b[propriedade].toUpperCase()] || 0;
        return flagCrescente ? pesoA - pesoB : pesoB - pesoA;
    });

    const seta = document.getElementById(setaId);
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

// GERENCIAMENTO E PAGINAÇÃO DO HISTÓRICO
function verHistorico() {
    cancelarModoEdicao();
    const modal = document.getElementById('modalHistorico');
    const listaContainer = document.getElementById('listaHistorico');
    if (!modal || !listaContainer) return;

    if (historicoAlteracoes.length === 0) {
        listaContainer.innerHTML = `<p style="color: #a0a5ad; font-style: italic; text-align: center; padding: 20px;">Nenhum registro até o momento.</p>`;
        atualizarControlesHistorico(0);
        modal.classList.add('active');
        return;
    }

    const totalPaginas = Math.ceil(historicoAlteracoes.length / itensPorPaginaHistorico);
    if (paginaAtualHistorico > totalPaginas) paginaAtualHistorico = totalPaginas || 1;

    const indiceInicio = (paginaAtualHistorico - 1) * itensPorPaginaHistorico;
    const indiceFim = indiceInicio + itensPorPaginaHistorico;
    const logsPaginados = historicoAlteracoes.slice(indiceInicio, indiceFim);

    listaContainer.innerHTML = logsPaginados.map(log => {
        let cor = log.acao === "CADASTRO" ? "#2196f3" : log.acao === "EDIÇÃO" ? "#ffb300" : log.acao === "ARQUIVAMENTO" ? "#d32f2f" : "#4fa135";
        return `
            <div style="background-color: #1a1c1e; border-left: 4px solid ${cor}; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #a0a5ad; margin-bottom: 4px;">
                    <span><strong>${log.data}</strong></span>
                    <span style="color: ${cor}; font-weight: bold;">${log.acao}</span>
                </div>
                <p style="font-size: 14px; color: #ffffff; margin: 0;"><strong style="color: #5c913b;">[${log.tag}]</strong> ${log.detalhes}</p>
            </div>`;
    }).join('');

    atualizarControlesHistorico(totalPaginas);
    modal.classList.add('active');
}

function atualizarControlesHistorico(totalPaginas) {
    const btnAnterior = document.getElementById('btnHistAnterior');
    const btnProxima = document.getElementById('btnHistProxima');
    const infoPagina = document.getElementById('infoPaginaHistorico');

    if (!btnAnterior || !btnProxima || !infoPagina) return;

    if (totalPaginas <= 1) {
        infoPagina.innerText = `Página 1 de 1`;
        btnAnterior.disabled = true;
        btnProxima.disabled = true;
        return;
    }

    infoPagina.innerText = `Página ${paginaAtualHistorico} de ${totalPaginas}`;
    btnAnterior.disabled = paginaAtualHistorico === 1;
    btnProxima.disabled = paginaAtualHistorico === totalPaginas;
}

function paginaAnteriorHistorico() {
    if (paginaAtualHistorico > 1) {
        paginaAtualHistorico--;
        verHistorico();
    }
}

function proximaPaginaHistorico() {
    const totalPaginas = Math.ceil(historicoAlteracoes.length / itensPorPaginaHistorico);
    if (paginaAtualHistorico < totalPaginas) {
        paginaAtualHistorico++;
        verHistorico();
    }
}

function fecharModalHistorico() {
    document.getElementById('modalHistorico').classList.remove('active');
    paginaAtualHistorico = 1; 
}

// DOWNLOAD DO HISTÓRICO
function baixarHistorico() {
    if (historicoAlteracoes.length === 0) return alert("Não há registros para exportar.");

    const dataInicioStr = document.getElementById('dataInicio').value;
    const dataFimStr = document.getElementById('dataFim').value;

    let logsFiltrados = [...historicoAlteracoes];

<<<<<<< HEAD
=======
    // Tratamento dinâmico para o filtro de datas
>>>>>>> b9be6b6d46b56263ce9a2e2824c1b6435d19eed1
    if (dataInicioStr || dataFimStr) {
        logsFiltrados = historicoAlteracoes.filter(log => {
            let dataLogIso = "";

<<<<<<< HEAD
            if (log.data.includes('-')) {
                dataLogIso = log.data.split(' ')[0];
            } 
            else if (log.data.includes('/')) {
                const dataPura = log.data.split(' ')[0]; 
                dataLogIso = dataPura.split('/').reverse().join('-'); 
=======
            // Se a data vier do banco ("YYYY-MM-DD HH:MM:SS")
            if (log.data.includes('-')) {
                dataLogIso = log.data.split(' ')[0];
            } 
            // Se a data foi gerada recentemente pelo front ("DD/MM/YYYY às HH:MM")
            else if (log.data.includes('/')) {
                const dataPura = log.data.split(' ')[0]; // Pega "DD/MM/YYYY"
                dataLogIso = dataPura.split('/').reverse().join('-'); // Transforma em "YYYY-MM-DD"
>>>>>>> b9be6b6d46b56263ce9a2e2824c1b6435d19eed1
            }

            let valido = true;
            if (dataInicioStr && dataLogIso < dataInicioStr) valido = false;
            if (dataFimStr && dataLogIso > dataFimStr) valido = false;
            
            return valido;
        });
    }

    if (logsFiltrados.length === 0) {
        return alert("Nenhum registro encontrado para o período selecionado.");
    }

<<<<<<< HEAD
=======
    // Gerando o cabeçalho do PDF explicitando fuso horário de Brasília
>>>>>>> b9be6b6d46b56263ce9a2e2824c1b6435d19eed1
    const agoraRelatorio = new Date();
    const dataRelatorio = agoraRelatorio.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const horaRelatorio = agoraRelatorio.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    let conteudoHtml = `
            <html>
            <head>
                <title>Relatório de Histórico de Alterações</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
                    h1 { text-align: center; color: #2c3e50; margin-bottom: 5px; }
                    p.sub { text-align: center; color: #7f8c8d; font-size: 14px; margin-top: 0; margin-bottom: 30px; }
                    .item-log { border-bottom: 1px solid #eee; padding: 15px 0; page-break-inside: avoid; }
                    .topo-log { display: flex; justify-content: space-between; font-size: 12px; color: #7f8c8d; margin-bottom: 5px; }
                    .acao { font-weight: bold; }
                    .tag { color: #27ae60; font-weight: bold; }
                    .detalhes { font-size: 14px; margin: 0; color: #2c3e50; }
<<<<<<< HEAD
                    @media print { body { margin: 0; } }
=======
                    @media print {
                        body { margin: 0; }
                    }
>>>>>>> b9be6b6d46b56263ce9a2e2824c1b6435d19eed1
                </style>
            </head>
            <body>
                <h1>HISTÓRICO DE ALTERAÇÕES DO SISTEMA</h1>
                <p class="sub">Gerado em: ${dataRelatorio} às ${horaRelatorio}</p>
        `;

    logsFiltrados.forEach((log) => {
        let dataExibicao = log.data;
        
<<<<<<< HEAD
=======
        // Padroniza a exibição visual estritamente para o formato brasileiro DD/MM/YYYY
>>>>>>> b9be6b6d46b56263ce9a2e2824c1b6435d19eed1
        if (log.data.includes('-')) {
            const partes = log.data.split(' ');
            const dataPura = partes[0].split('-').reverse().join('/');
            dataExibicao = `${dataPura} às ${partes[1] ? partes[1].substring(0, 5) : ''}`;
        }

        let corAcao = log.acao === "CADASTRO" ? "#2196f3" : log.acao === "EDIÇÃO" ? "#ffb300" : log.acao === "ARQUIVAMENTO" ? "#d32f2f" : "#4fa135";

        conteudoHtml += `
            <div class="item-log">
                <div class="topo-log">
                    <span><strong>Data:</strong> ${dataExibicao}</span>
                    <span class="acao" style="color: ${corAcao};">${log.acao}</span>
                </div>
                <p class="detalhes"><span class="tag">[${log.tag}]</span> ${log.detalhes}</p>
            </div>
        `;
    });

    conteudoHtml += `</body></html>`;

    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(conteudoHtml);
    janelaImpressao.document.close();
    
    setTimeout(() => {
        janelaImpressao.print();
        janelaImpressao.close();
    }, 250);
}