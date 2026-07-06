// VARIÁVEIS DE ESTADO GLOBAL
let modoEdicaoAtivo = false;
let linhaSendoEditada = null;
let ordemCrescenteCriticidade = true;
let ordemCrescenteEtapa = true;
let visualizandoArquivados = false;

let itensAtivos = [];
let itensArquivados = [];
let historicoAlteracoes = [];

// INICIALIZAÇÃO DO SISTEMA
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosDoBanco();
    configurarFiltroPesquisa();
    
    const formEquipamento = document.getElementById('formEquipamento');
    if (formEquipamento) {
        formEquipamento.addEventListener('submit', salvarFormulario);
    }
});

// HISTÓRICO & LOGS (MODIFICADO PARA SALVAR NO BANCO)
async function registrarLog(acao, tag, detalhes) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const tagFormatada = String(tag).toUpperCase();

    // 1. Salva na memória local para exibição imediata na tela
    historicoAlteracoes.unshift({
        data: `${dataFormatada} às ${horaFormatada}`,
        acao: acao,
        tag: tagFormatada,
        detalhes: detalhes
    });

    // 2. Envia para o banco de dados via fetch API
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
    const dados = await API.buscarItens(); // Certifique-se de que sua API também traga o histórico antigo se quiser listá-lo ao iniciar
    if (dados) {
        itensAtivos = dados.ativos || [];
        itensArquivados = dados.arquivados || [];
        historicoAlteracoes = dados.historico || [];
        // Se a sua API buscarItens trouxer os logs antigos do banco, descomente a linha abaixo:
        // historicoAlteracoes = dados.historico || []; 
        renderizarTabela();
    }
}

function renderizarTabela() {
    const tabelaBody = document.querySelector('.custom-table tbody');
    if (!tabelaBody) return;
    
    tabelaBody.innerHTML = "";
    const listaAtual = visualizandoArquivados ? itensArquivados : itensAtivos;

    if (listaAtual.length === 0) {
        tabelaBody.innerHTML = `<tr><td colspan="6" style="color: #a0a5ad; font-style: italic; padding: 30px; text-align: center;">Nenhum item encontrado.</td></tr>`;
        return;
    }

    listaAtual.forEach((item, index) => {
        const novaLinha = document.createElement('tr');
        novaLinha.style.cursor = "pointer";
        novaLinha.dataset.index = index;
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
    
    // REMOVIDO 'inputTag' DESTA LISTA PARA QUE ELE NÃO SEJA HABILITADO
    const campos = ['inputNome', 'inputFabricante', 'txtDescricao', 'selectCriticidade', 'selectEtapa'];
    campos.forEach(id => document.getElementById(id).disabled = false);

    // Garante que o campo de TAG fique limpo e bloqueado no cadastro
    const inputTag = document.getElementById('inputTag');
    inputTag.disabled = true;
    inputTag.placeholder = "Gerado automaticamente"; // Opcional: muda o placeholder para avisar o usuário

    document.getElementById('btnArquivarModal').style.display = 'none';
    document.getElementById('btnDesarquivarModal').style.display = 'none';
    document.querySelector('.btn-salvar').style.display = 'block';

    document.getElementById('modalEquipamento').classList.add('active');
}

function fecharModal() {
    document.getElementById('modalEquipamento').classList.remove('active');
    linhaSendoEditada = null;
}

// PROCESSO DE SALVAR / CADASTRAR (CORRIGIDO PARA ESPERAR LOGS ASSÍNCRONOS)
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
            // Salva log de cadastro no banco
            await registrarLog("CADASTRO", dadosForm.tag, `O equipamento "${dadosForm.nome}" foi cadastrado.`);
        } else {
            itensAtivos[idx] = dadosForm;
            // Salva log de edição no banco
            await registrarLog("EDIÇÃO", itemAntigo.tag, alteracoes.length > 0 ? alteracoes.join(', ') : 'Nenhum valor modificado.');
        }

        console.log(resultado.mensagem);

    } catch (erro) {
        console.error('Erro na requisição:', erro);
        alert('Erro de comunicação com o servidor.');
        return;
    }

    renderizarTabela();
    fecharModal();
}

// ARQUIVAR / DESARQUIVAR (ATUALIZADO PARA SUPORTAR FUNÇÃO DE LOG ASSÍNCRONA)
async function moverEquipamento(origem, destino, acaoLog, textoLog) {
    if (!linhaSendoEditada) return;
    const idx = linhaSendoEditada.dataset.index;
    
    // Pega uma referência do item antes de retirá-lo da lista
    const item = origem[idx]; 
    
    // CORREÇÃO DE SEGURANÇA: Garante que a propriedade exista independente de maiúscula/minúscula no objeto
    const tagItem = item.tag || item.TAG || null;

    if (!tagItem) {
        alert("Erro local: Não foi possível localizar a TAG deste equipamento.");
        return;
    }
    
    // Descobre se a intenção é arquivar ou desarquivar para mandar pro PHP
    const acaoBanco = (acaoLog === "ARQUIVAMENTO") ? "arquivar" : "desarquivar";

    try {
        // 1. Envia a requisição para alterar as tabelas no MySQL
        const resposta = await fetch('../backend/arquivar_itens.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                tag: tagItem,
                acao: acaoBanco 
            })
        });

        // Verifica se o servidor retornou status de sucesso HTTP (200)
        if (!resposta.ok) {
            throw new Error(`Erro no servidor: Status ${resposta.status}`);
        }

        const resultado = await resposta.json();

        // Se o banco de dados falhar, interrompe o processo e avisa o usuário
        if (!resultado.sucesso) {
            alert('Erro ao mover o item no banco de dados: ' + resultado.erro);
            return;
        }

        // 2. Se deu certo no banco, atualiza os arrays na memória local (da tela)
        origem.splice(idx, 1);
        destino.unshift(item);

        // 3. Registra o log no banco e renderiza a tabela atualizada
        await registrarLog(acaoLog, tagItem, `O equipamento "${item.nome || ''}" ${textoLog}`);
        renderizarTabela();
        fecharModal();

    } catch (erro) {
        console.error('Erro na requisição de arquivamento:', erro);
        alert('Erro de comunicação com o servidor ao tentar alterar o status do item. Verifique o console do navegador.');
    }
}

const arquivarEquipamento = () => moverEquipamento(itensAtivos, itensArquivados, "ARQUIVAMENTO", "foi enviado para a lista de arquivados.");
const desarquivarEquipamento = () => moverEquipamento(itensArquivados, itensAtivos, "DESARQUIVAMENTO", "foi restaurado para os ativos.");

function verArquivados() {
    visualizandoArquivados = !visualizandoArquivados;
    
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
        document.querySelectorAll('.custom-table tbody tr').forEach(linha => {
            if (linha.cells.length <= 1) return;
            const tag = linha.cells[0].innerText.toLowerCase();
            const nome = Finder = linha.cells[1].innerText.toLowerCase();
            linha.style.display = (tag.includes(termo) || nome.includes(termo)) ? "" : "none";
        });
    });
}

function ordenarPor(propriedade, pesos, flagCrescente, setaId) {
    const lista = visualizandoArquivados ? itensArquivados : itensAtivos;
    
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

function verHistorico() {
    cancelarModoEdicao();
    const modal = document.getElementById('modalHistorico');
    const listaContainer = document.getElementById('listaHistorico');
    if (!modal || !listaContainer) return;

    listaContainer.innerHTML = historicoAlteracoes.length === 0 
        ? `<p style="color: #a0a5ad; font-style: italic; text-align: center; padding: 20px;">Nenhum registro até o momento.</p>`
        : historicoAlteracoes.map(log => {
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

    modal.classList.add('active');
}

function fecharModalHistorico() {
    document.getElementById('modalHistorico').classList.remove('active');
}

function baixarHistorico() {
    if (historicoAlteracoes.length === 0) return alert("Não há registros para exportar.");

    // 1. Captura as datas selecionadas pelo usuário
    const dataInicioStr = document.getElementById('dataInicio').value; // Formato YYYY-MM-DD
    const dataFimStr = document.getElementById('dataFim').value;     // Formato YYYY-MM-DD

    let logsFiltrados = [...historicoAlteracoes];

    // 2. Aplica o filtro de período se as datas forem preenchidas
    if (dataInicioStr || dataFimStr) {
        logsFiltrados = historicoAlteracoes.filter(log => {
            // O formato vindo do banco é "YYYY-MM-DD HH:MM:SS" ou similar. 
            // Vamos extrair apenas a parte da data inicial para comparar corretamente.
            const dataLogIso = log.data.split(' ')[0]; // Pega "YYYY-MM-DD"
            
            let valido = true;
            if (dataInicioStr && dataLogIso < dataInicioStr) valido = false;
            if (dataFimStr && dataLogIso > dataFimStr) valido = false;
            
            return valido;
        });
    }

    if (logsFiltrados.length === 0) {
        return alert("Nenhum registro encontrado para o período selecionado.");
    }

    // 3. Monta a estrutura HTML do PDF
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
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <h1>HISTÓRICO DE ALTERAÇÕES DO SISTEMA</h1>
            <p class="sub">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    `;

    // Adiciona cada linha de log formatada
    logsFiltrados.forEach((log, index) => {
        // Formata a exibição da data para ficar bonita no PDF (de YYYY-MM-DD para DD/MM/YYYY se necessário)
        let dataExibicao = log.data;
        if(log.data.includes('-')) {
            const partes = log.data.split(' ');
            const dataPura = partes[0].split('-').reverse().join('/');
            dataExibicao = `${dataPura} ${partes[1] || ''}`;
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

    // 4. Abre a janela de impressão do navegador configurada para PDF
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(conteudoHtml);
    janelaImpressao.document.close();
    
    // Aguarda um instante para carregar o HTML na nova janela e dispara o print/pdf
    setTimeout(() => {
        janelaImpressao.print();
        janelaImpressao.close();
    }, 250);
}