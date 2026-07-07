<?php
// backend/buscar_itens.php
ob_start();

require_once __DIR__ . '/../Conexao/Conexao.php';

header('Content-Type: application/json');

try {
    $pdo = Conexao::getConexao(); 

    // 1. Busca os ativos
    $stmtAtivos = $pdo->prepare("SELECT tag, nome, setor, observacao AS descricao, criticidade, etapa FROM itens");
    $stmtAtivos->execute();
    $ativos = $stmtAtivos->fetchAll(PDO::FETCH_ASSOC);

    // 2. Busca os arquivados
    $stmtArquivados = $pdo->prepare("SELECT ID_Itens_arquivados AS id, tag, nome, setor, observacao AS descricao, criticidade AS criticidade, etapa FROM itens_arquivados");
    $stmtArquivados->execute();
    $arquivados = $stmtArquivados->fetchAll(PDO::FETCH_ASSOC);

    // 3. NOVA PARTE: Busca o histórico de alterações gravado no banco
    // Ajuste o nome da tabela 'historico_alteracoes' e das colunas de acordo com o seu banco se for diferente
    // 3. Busca o histórico de alterações gravado no banco
    $stmtHistorico = $pdo->prepare("SELECT data_registro AS data, acao, tag, detalhes FROM historico_alteracoes ORDER BY id DESC");
    $stmtHistorico->execute();
    $historico = $stmtHistorico->fetchAll(PDO::FETCH_ASSOC);

    // Garante arrays limpos caso o banco retorne vazio
    $ativos = $ativos ? $ativos : [];
    $arquivados = $arquivados ? $arquivados : [];
    $historico = $historico ? $historico : [];

    ob_end_clean();
    echo json_encode([
        'sucesso' => true,
        'ativos' => $ativos,
        'arquivados' => $arquivados,
        'historico' => $historico // Enviando o histórico para o JavaScript
    ]);

} catch (PDOException $e) {
    ob_end_clean();
    echo json_encode([
        'sucesso' => false,
        'erro' => $e->getMessage()
    ]);
}
?>