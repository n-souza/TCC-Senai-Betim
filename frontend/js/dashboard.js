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
    
    // Configura o envio do formulário uma única vez
    const formEquipamento = document.getElementById('formEquipamento');
    if (formEquipamento) {
        formEquipamento.addEventListener('submit', salvarFormulario);
    }
});

// HISTÓRICO & LOGS
function registrarLog(acao, tag, detalhes) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    historicoAlteracoes.unshift({
        data: `${dataFormatada} às ${horaFormatada}`,
        acao: acao,
        tag: String(tag).toUpperCase(),
        detalhes: detalhes
    });
}

// RENDERIZAÇÃO DA TABELA
async function carregarDadosDoBanco() {
    const dados = await API.buscarItens();
    if (dados) {
        itensAtivos = dados.ativos || [];
        itensArquivados = dados.arquivados || [];
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

    // Controla desabilitação em bloco de inputs
    const campos = ['inputNome', 'inputFabricante', 'txtDescricao', 'selectCriticidade', 'selectEtapa'];
    campos.forEach(id => document.getElementById(id).disabled = visualizandoArquivados);
    document.getElementById('inputTag').disabled = true;

    // Configura botões dinâmicos do modal
    document.getElementById('modalTitle').innerText = visualizandoArquivados ? "Visualizar Item Arquivado" : "Editar Equipamento";
    document.getElementById('btnArquivarModal').style.display = visualizandoArquivados ? 'none' : 'block';
    document.getElementById('btnDesarquivarModal').style.display = visualizandoArquivados ? 'block' : 'none';
    document.querySelector('.btn-salvar').style.display = visualizandoArquivados ? 'none' : 'block';

    // Popular campos
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
    
    const campos = ['inputTag', 'inputNome', 'inputFabricante', 'txtDescricao', 'selectCriticidade', 'selectEtapa'];
    campos.forEach(id => document.getElementById(id).disabled = false);

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
        // Se for edição, precisamos da tag atual para mandar pro PHP saber quem atualizar
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

    // Lógica local de logs antes de enviar (para o caso de edição)
    if (!isCadastro && linhaSendoEditada) {
        idx = linhaSendoEditada.dataset.index;
        itemAntigo = itensAtivos[idx];
        
        let alteracoes = [];
        if (itemAntigo.nome !== dadosForm.nome) alteracoes.push(`Nome ("${itemAntigo.nome}" ➔ "${dadosForm.nome}")`);
        if (itemAntigo.criticidade !== dadosForm.criticidade) alteracoes.push(`Criticidade (${itemAntigo.criticidade} ➔ ${dadosForm.criticidade})`);
        if (itemAntigo.etapa !== dadosForm.etapa) alteracoes.push(`Etapa (${itemAntigo.etapa} ➔ ${dadosForm.etapa})`);

        registrarLog("EDIÇÃO", itemAntigo.tag, alteracoes.length > 0 ? alteracoes.join(', ') : 'Nenhum valor modificado.');
    }

    // --- ENVIO PARA O PHP ---
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
        
        // --- SE DEU CERTO NO BANCO, ATUALIZAMOS A TELA (MEMÓRIA LOCAL) ---
        if (isCadastro) {
            // Pegamos a tag real que o PHP/MySQL gerou e colocamos no objeto
            dadosForm.tag = resultado.tag; 
            
            itensAtivos.unshift(dadosForm);
            registrarLog("CADASTRO", dadosForm.tag, `O equipamento "${dadosForm.nome}" foi cadastrado.`);
        } else {
            itensAtivos[idx] = dadosForm;
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

// ARQUIVAR / DESARQUIVAR LOCAL (MEMÓRIA)
function moverEquipamento(origem, destino, acaoLog, textoLog) {
    if (!linhaSendoEditada) return;
    const idx = linhaSendoEditada.dataset.index;
    
    const item = origem.splice(idx, 1)[0];
    destino.unshift(item);

    registrarLog(acaoLog, item.tag, `O equipamento "${item.nome}" ${textoLog}`);
    renderizarTabela();
    fecharModal();
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
            const nome = linha.cells[1].innerText.toLowerCase();
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
    if (historicoAlteracoes.length === 0) return alert("Não há registros para download.");

    let txt = "==================================================\n   HISTÓRICO DE ALTERAÇÕES DO SISTEMA\n==================================================\n\n";
    historicoAlteracoes.forEach((log, index) => {
        txt += `Registro #${historicoAlteracoes.length - index}\nData: ${log.data}\nOperação: ${log.acao}\nTag: [${log.tag}]\nDetalhes: ${log.detalhes}\n--------------------------------------------------\n\n`;
    });

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico_alteracoes_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}