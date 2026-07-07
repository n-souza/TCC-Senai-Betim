<?php
require_once __DIR__ . '/../Conexao/Conexao.php';

header('Content-Type: application/json');

try {
    $pdo = Conexao::getConexao();
    
    $jsonRecebido = file_get_contents('php://input');
    $requisicao   = json_decode($jsonRecebido, true);

    if (!$requisicao || !isset($requisicao['acao']) || !isset($requisicao['tag']) || !isset($requisicao['detalhes'])) {
        echo json_encode(['sucesso' => false, 'erro' => 'Dados do histórico inválidos.']);
        exit;
    }

    $sql = "INSERT INTO historico_alteracoes (acao, tag, detalhes) VALUES (:acao, :tag, :detalhes)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':acao'     => $requisicao['acao'],
        ':tag'      => $requisicao['tag'],
        ':detalhes' => $requisicao['detalhes']
    ]);

    echo json_encode(['sucesso' => true, 'mensagem' => 'Histórico salvo com sucesso no banco!']);

} catch (PDOException $e) {
    echo json_encode(['sucesso' => false, 'erro' => 'Erro ao salvar histórico: ' . $e->getMessage()]);
}
?>