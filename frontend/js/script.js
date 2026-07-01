// VARIÁVEIS DE CONTROLE DE ESTADO
let modoEdicaoAtivo = false;
let linhaSendoEditada = null;
let ordemCrescenteCriticidade = true;
let ordemCrescenteEtapa = true;
let visualizandoArquivados = false;

// Gerenciamento de dados em memória (evita que sumam ao alternar telas)
let itensAtivos = [];
let itensArquivados = [];
let historicoAlteracoes = [];

// FUNÇÃO AUXILIAR: REGISTRO DE LOGS DO HISTÓRICO
function registrarLog(acao, tag, detalhes) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const novoLog = {
        data: `${dataFormatada} às ${horaFormatada}`,
        acao: acao,
        tag: tag.toUpperCase(),
        detalhes: detalhes
    };
    
    // Adiciona sempre no topo do array para exibir o mais recente primeiro
    historicoAlteracoes.unshift(novoLog);
}

/* // LÓGICA DA TELA DE LOGIN (RF1)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        console.log("Formulário de login interceptado com sucesso.");
        window.location.href = "frontend/home.html";
    });
} */

// FUNÇÃO DE RENDERIZAÇÃO DA TABELA
function renderizarTabela() {
    const tabelaBody = document.querySelector('.custom-table tbody');
    if (!tabelaBody) return;
    tabelaBody.innerHTML = "";
    const listaAtual = visualizandoArquivados ? itensArquivados : itensAtivos;

    //Mensagem de Nenhum Item Encontrado
    if (listaAtual.length === 0) {
        tabelaBody.innerHTML = `<tr><td colspan="6" style="color: #a0a5ad; font-style: italic; padding: 30px;">Nenhum item encontrado.</td></tr>`;
        return;
    }

    //Criação de Linhas
    listaAtual.forEach((item, index) => {
        const novaLinha = document.createElement('tr');
        novaLinha.style.cursor = "pointer";
        novaLinha.dataset.index = index;

        // Adiciona o evento de clique para abrir o modal de edição/visualização
        novaLinha.addEventListener('click', function() {
            abrirRF3(item.tag, this);
        });

        novaLinha.innerHTML = `
            <td>${item.tag.toUpperCase()}</td>
            <td>${item.nome}</td>
            <td>${item.setor}</td>
            <td>
                <div class="conteudo-scroll">
                    ${item.descricao ? item.descricao : 'Sem observações.'}
                </div>
            </td>
            <td><span class="badge ${item.criticidade}">${item.criticidade.toUpperCase()}</span></td>
            <td><span class="badge ${item.etapa}">${item.etapa.toUpperCase()}</span></td>
        `;
        tabelaBody.appendChild(novaLinha);
    });
}

// LÓGICA DA TELA HOME & MODAL
function ativarModoEdicao() {
    if (visualizandoArquivados) return;

    modoEdicaoAtivo = true;
    // Oculta os botões padrão e exibe o aviso de seleção
    document.getElementById('botoesPadrao').style.display = 'none';
    document.getElementById('avisoSelecao').style.display = 'flex';
}

function cancelarModoEdicao() {
    modoEdicaoAtivo = false;
    // Oculta o aviso de seleção e exibe os botões padrão
    document.getElementById('avisoSelecao').style.display = 'none';
    document.getElementById('botoesPadrao').style.display = 'flex';
}

function abrirRF3(tagEquipamento, elementoLinha) {
    if (!modoEdicaoAtivo && !visualizandoArquivados) {
        console.log("Clique bloqueado: Sistema não está no modo de edição.");
        return; 
    }

    linhaSendoEditada = elementoLinha;
    cancelarModoEdicao();

    const idx = elementoLinha.dataset.index;
    // Puxa o item da lista correta dependendo da tela atual
    const item = visualizandoArquivados ? itensArquivados[idx] : itensAtivos[idx];

    const modal = document.getElementById('modalEquipamento');
    const btnArquivar = document.getElementById('btnArquivarModal');
    const btnDesarquivar = document.getElementById('btnDesarquivarModal');
    const btnSalvar = document.querySelector('.btn-salvar');

    // Desabilita os campos caso esteja apenas visualizando/desarquivando um item arquivado
    document.getElementById('inputTag').disabled = true;
    document.getElementById('inputNome').disabled = visualizandoArquivados;
    document.getElementById('inputFabricante').disabled = visualizandoArquivados;
    document.getElementById('txtDescricao').disabled = visualizandoArquivados;
    document.getElementById('selectCriticidade').disabled = visualizandoArquivados;
    document.getElementById('selectEtapa').disabled = visualizandoArquivados;

    if (visualizandoArquivados) {
        document.getElementById('modalTitle').innerText = "Visualizar Item Arquivado";
        btnArquivar.style.display = 'none';
        btnDesarquivar.style.display = 'block'; // Mostra o botão Desarquivar
        btnSalvar.style.display = 'none';       // Oculta o botão Salvar já que está arquivado
    } else {
        document.getElementById('modalTitle').innerText = "Editar Equipamento";
        btnArquivar.style.display = 'block';    // Mostra o botão Arquivar
        btnDesarquivar.style.display = 'none';
        btnSalvar.style.display = 'block';
    }

    // Preenche o modal com os dados do item
    document.getElementById('inputTag').value = item.tag;
    document.getElementById('inputNome').value = item.nome;
    document.getElementById('inputFabricante').value = item.fabricante || ""; 
    document.getElementById('txtDescricao').value = item.descricao || "";
    document.getElementById('selectCriticidade').value = item.criticidade;
    document.getElementById('selectEtapa').value = item.etapa;

    modal.classList.add('active');
}

function abrirParaCadastrar() {
    cancelarModoEdicao(); 
    linhaSendoEditada = null; 
    
    const modal = document.getElementById('modalEquipamento');
    document.getElementById('modalTitle').innerText = "Cadastrar Novo Item";
    document.getElementById('formEquipamento').reset();
    
    // Força a liberação dos inputs para o cadastro
    document.getElementById('inputTag').disabled = false;
    document.getElementById('inputNome').disabled = false;
    document.getElementById('inputFabricante').disabled = false;
    document.getElementById('txtDescricao').disabled = false;
    document.getElementById('selectCriticidade').disabled = false;
    document.getElementById('selectEtapa').disabled = false;

    document.getElementById('btnArquivarModal').style.display = 'none';
    document.getElementById('btnDesarquivarModal').style.display = 'none';
    document.querySelector('.btn-salvar').style.display = 'block';

    modal.classList.add('active');
}

function fecharModal() {
    document.getElementById('modalEquipamento').classList.remove('active');
    linhaSendoEditada = null;
}

// ESCUTADOR DO FORMULÁRIO (SALVAR / CADASTRAR)
const formEquipamento = document.getElementById('formEquipamento');

if (formEquipamento) {
    formEquipamento.addEventListener('submit', function(event) {
        event.preventDefault(); 

        const tag = document.getElementById('inputTag').value;
        const nome = document.getElementById('inputNome').value;
        const fabricante = document.getElementById('inputFabricante').value;
        const descricao = document.getElementById('txtDescricao').value;
        const criticidade = document.getElementById('selectCriticidade').value;
        const etapa = document.getElementById('selectEtapa').value;

        const tituloModal = document.getElementById('modalTitle').innerText;

        if (tituloModal === "Cadastrar Novo Item") {
            const novoItem = {
                tag, nome, fabricante, descricao, criticidade, etapa,
                setor: 'Planta de Beneficiamento'
            };
            itensAtivos.unshift(novoItem);

            // Registra o log de novo cadastro no histórico
            registrarLog("CADASTRO", tag, `O equipamento "${nome}" foi cadastrado com sucesso.`);
        } else {
            if (linhaSendoEditada) {
                const idx = linhaSendoEditada.dataset.index;
                const itemAntigo = itensAtivos[idx];
                
                // Mapeia de forma detalhada o que mudou no formulário
                let alteracoes = [];
                if (itemAntigo.nome !== nome) alteracoes.push(`Nome ("${itemAntigo.nome}" ➔ "${nome}")`);
                if (itemAntigo.criticidade !== criticidade) alteracoes.push(`Criticidade (${itemAntigo.criticidade.toUpperCase()} ➔ ${criticidade.toUpperCase()})`);
                if (itemAntigo.etapa !== etapa) alteracoes.push(`Etapa (${itemAntigo.etapa.toUpperCase()} ➔ ${etapa.toUpperCase()})`);
                if (itemAntigo.fabricante !== fabricante) alteracoes.push(`Fabricante ("${itemAntigo.fabricante}" ➔ "${fabricante}")`);
                if (itemAntigo.descricao !== descricao) alteracoes.push(`Descrição Atualizada`);

                const textoDetalhes = alteracoes.length > 0 ? alteracoes.join(', ') : 'Nenhum valor modificado.';

                // Registra o log no histórico antes de atualizar os dados em memória
                registrarLog("EDIÇÃO", itemAntigo.tag, textoDetalhes);

                itensAtivos[idx] = {
                    tag: itensAtivos[idx].tag, 
                    nome, fabricante, descricao, criticidade, etapa,
                    setor: itensAtivos[idx].setor
                };
            }
        }

        renderizarTabela();
        fecharModal();
    });
}

// LÓGICA DE ARQUIVAMENTO & DESARQUIVAMENTO
function arquivarEquipamento() {
    if (!linhaSendoEditada) return;
    const idx = linhaSendoEditada.dataset.index;
    
    const itemRemovido = itensAtivos.splice(idx, 1)[0];
    itensArquivados.push(itemRemovido);

    // Registra o arquivamento no histórico
    registrarLog("ARQUIVAMENTO", itemRemovido.tag, `O equipamento "${itemRemovido.nome}" foi enviado para a lista de arquivados.`);

    renderizarTabela();
    fecharModal();
}

function desarquivarEquipamento() {
    if (!linhaSendoEditada) return;
    const idx = linhaSendoEditada.dataset.index;

    const itemDesarquivado = itensArquivados.splice(idx, 1)[0];
    itensAtivos.unshift(itemDesarquivado);

    // Registra o desarquivamento no histórico
    registrarLog("DESARQUIVAMENTO", itemDesarquivado.tag, `O equipamento "${itemDesarquivado.nome}" foi restaurado para os ativos.`);

    renderizarTabela();
    fecharModal();
}

function verArquivados() {
    visualizandoArquivados = !visualizandoArquivados;
    
    const btnIconeArquivados = document.getElementById('btnVerArquivados');
    const btnEditar = document.querySelector('.btn-editar');
    const btnAdicionar = document.querySelector('.btn-adicionar');

    if (visualizandoArquivados) {
        if (btnIconeArquivados) {
            btnIconeArquivados.style.backgroundColor = "#ffb300";
            btnIconeArquivados.style.borderColor = "#ffb300";
            btnIconeArquivados.style.color = "#22252a";
            btnIconeArquivados.title = "Visualizar Itens Ativos";
        }

        if (btnEditar) {
            btnEditar.disabled = true;
            btnEditar.style.opacity = "0.4";
            btnEditar.style.cursor = "not-allowed";
        }
        if (btnAdicionar) {
            btnAdicionar.disabled = true;
            btnAdicionar.style.opacity = "0.4";
            btnAdicionar.style.cursor = "not-allowed";
        }
    } else {
        if (btnIconeArquivados) {
            btnIconeArquivados.style.backgroundColor = "";
            btnIconeArquivados.style.borderColor = "";
            btnIconeArquivados.style.color = "";
            btnIconeArquivados.title = "Visualizar Itens Arquivados";
        }

        if (btnEditar) {
            btnEditar.disabled = false;
            btnEditar.style.opacity = "1";
            btnEditar.style.cursor = "pointer";
        }
        if (btnAdicionar) {
            btnAdicionar.disabled = false;
            btnAdicionar.style.opacity = "1";
            btnAdicionar.style.cursor = "pointer";
        }
    }

    renderizarTabela();
}

// EXIBIÇÃO DO MODAL DE HISTÓRICO DE ALTERAÇÕES
function verHistorico() {
    cancelarModoEdicao();
    const modal = document.getElementById('modalHistorico');
    const listaContainer = document.getElementById('listaHistorico');
    
    if (!modal || !listaContainer) return;

    // Reseta o container para remontar a listagem
    listaContainer.innerHTML = "";

    if (historicoAlteracoes.length === 0) {
        listaContainer.innerHTML = `<p style="color: #a0a5ad; font-style: italic; text-align: center; padding: 20px;">Nenhum registro de alteração até o momento.</p>`;
    } else {
        historicoAlteracoes.forEach(log => {
            // Estilização das cores das tags por tipo de operação
            let corAcao = "#4fa135"; // Verde padrão / Desarquivar
            if (log.acao === "CADASTRO") corAcao = "#2196f3"; // Azul para cadastros novos
            if (log.acao === "EDIÇÃO") corAcao = "#ffb300"; // Amarelo
            if (log.acao === "ARQUIVAMENTO") corAcao = "#d32f2f"; // Vermelho

            const itemLog = document.createElement('div');
            itemLog.style.backgroundColor = "#1a1c1e";
            itemLog.style.borderLeft = `4px solid ${corAcao}`;
            itemLog.style.padding = "12px";
            itemLog.style.marginBottom = "10px";
            itemLog.style.borderRadius = "4px";

            itemLog.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #a0a5ad; margin-bottom: 4px;">
                    <span><strong>${log.data}</strong></span>
                    <span style="color: ${corAcao}; font-weight: bold; letter-spacing: 0.5px;">${log.acao}</span>
                </div>
                <p style="font-size: 14px; color: #ffffff; margin: 0; line-height: 1.4;">
                    <strong style="color: #5c913b;">[${log.tag}]</strong> ${log.detalhes}
                </p>
            `;
            listaContainer.appendChild(itemLog);
        });
    }

    modal.classList.add('active');
}

function fecharModalHistorico() {
    const modal = document.getElementById('modalHistorico');
    if (modal) modal.classList.remove('active');
}

// FUNÇÃO EXCLUSIVA: DOWNLOAD EM ARQUIVO TEXTO DO HISTÓRICO
function baixarHistorico() {
    if (historicoAlteracoes.length === 0) {
        alert("Não há registros no histórico para fazer o download.");
        return;
    }

    // Monta o cabeçalho do documento de texto estruturado
    let conteudoTexto = "==================================================\n";
    conteudoTexto += "       HISTÓRICO DE ALTERAÇÕES DO SISTEMA         \n";
    conteudoTexto += "==================================================\n\n";

    // Percorre o array gerando linhas formatadas para o arquivo
    historicoAlteracoes.forEach((log, index) => {
        conteudoTexto += `Registro #${historicoAlteracoes.length - index}\n`;
        conteudoTexto += `Data/Hora: ${log.data}\n`;
        conteudoTexto += `Operação : ${log.acao}\n`;
        conteudoTexto += `Tag Item : [${log.tag}]\n`;
        conteudoTexto += `Detalhes : ${log.detalhes}\n`;
        conteudoTexto += "--------------------------------------------------\n\n";
    });

    // Cria o gatilho de download nativo através de um Blob temporário no navegador
    const blob = new Blob([conteudoTexto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const linkTemporario = document.createElement("a");
    linkTemporario.href = url;
    
    // Define o nome do arquivo com a data atual para facilitar o controle
    const dataArquivo = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    linkTemporario.download = `historico_alteracoes_${dataArquivo}.txt`;
    
    // Força o clique invisível para iniciar o download e limpa a memória temporária
    document.body.appendChild(linkTemporario);
    linkTemporario.click();
    document.body.removeChild(linkTemporario);
    URL.revokeObjectURL(url);
}

// LÓGICA DA BARRA DE PESQUISA (FILTRO DINÂMICO)
const inputPesquisa = document.querySelector('.search-input');

if (inputPesquisa) {
    inputPesquisa.addEventListener('input', function() {
        const termoPesquisa = this.value.toLowerCase();
        const linhasTabela = document.querySelectorAll('.custom-table tbody tr');

        linhasTabela.forEach((linha) => {
            if (linha.cells.length > 1) { 
                const tag = linha.cells[0].innerText.toLowerCase();
                const nome = linha.cells[1].innerText.toLowerCase();

                if (tag.includes(termoPesquisa) || nome.includes(termoPesquisa)) {
                    linha.style.display = ""; 
                } else {
                    linha.style.display = "none"; 
                }
            }
        });
    });
}

// LÓGICA DE ORDENAÇÃO POR CRITICIDADE
function ordenarPorCriticidade() {
    const listaParaOrdenar = visualizandoArquivados ? itensArquivados : itensAtivos;
    const pesos = { 'ALTA': 3, 'MÉDIA': 2, 'MEDIA': 2, 'BAIXA': 1 };

    listaParaOrdenar.sort(function(a, b) {
        const pesoA = pesos[a.criticidade.toUpperCase()] || 0;
        const pesoB = pesos[b.criticidade.toUpperCase()] || 0;
        return ordemCrescenteCriticidade ? pesoB - pesoA : pesoA - pesoB;
    });

    const seta = document.getElementById('setaCriticidade');
    if (seta) seta.innerText = ordemCrescenteCriticidade ? "⬇" : "⬆";
    
    ordemCrescenteCriticidade = !ordemCrescenteCriticidade;
    renderizarTabela();
}

// LÓGICA DE ORDENAÇÃO POR ETAPA DE REPARO
function ordenarPorEtapa() {
    const listaParaOrdenar = visualizandoArquivados ? itensArquivados : itensAtivos;
    const fluxoEtapas = { 'ENVIO': 1, 'PERITAGEM': 2, 'APROVAÇÃO': 3, 'APROVACAO': 3, 'EXECUÇÃO': 4, 'EXECUCAO': 4, 'RETORNO': 5 };

    listaParaOrdenar.sort(function(a, b) {
        const pesoA = fluxoEtapas[a.etapa.toUpperCase()] || 0;
        const pesoB = fluxoEtapas[b.etapa.toUpperCase()] || 0;
        return ordemCrescenteEtapa ? pesoA - pesoB : pesoB - pesoA;
    });

    const seta = document.getElementById('setaEtapa');
    if (seta) seta.innerText = ordemCrescenteEtapa ? "⬇" : "⬆";

    ordemCrescenteEtapa = !ordemCrescenteEtapa;
    renderizarTabela();
}