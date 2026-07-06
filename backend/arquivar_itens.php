<?php
// backend/arquivar_item.php
require_once __DIR__ . '/Conexao/Conexao.php';

header('Content-Type: application/json');

// Recebe o ID enviado via JSON pelo JavaScript
$dadosRecebidos = json_decode(file_get_contents("php://input"), true);
$idItem = $dadosRecebidos['id'] ?? null;

if (!$idItem) {
    echo json_encode(['sucesso' => false, 'erro' => 'ID do item não fornecido.']);
    exit;
}

try {
    // Captura a conexão PDO através do método estático da sua classe Conexao
    $pdo = Conexao::getConexao(); 

    // Inicia a transação - se um comando falhar, o banco desfaz tudo automaticamente
    $pdo->beginTransaction();

    // 1. Busca os dados atuais usando o nome correto da chave primária (ID_Itens)
    $stmtBusca = $pdo->prepare("SELECT * FROM itens WHERE tag = :id");
    $stmtBusca->execute([':id' => $idItem]);
    $item = $stmtBusca->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        throw new Exception("Item não encontrado na tabela de ativos.");
    }

    // 2. Insere na tabela 'itens_arquivados' respeitando as colunas exatas do seu banco (incluindo 'crticidade')
    $sqlInserir = "INSERT INTO itens_arquivados (tag, nome, setor, observacao, criticidade, etapa) 
                   VALUES (:tag, :nome, :setor, :observacao, :criticidade, :etapa)";
    
    $stmtInserir = $pdo->prepare($sqlInserir);
    $stmtInserir->execute([
        ':tag'   => $item['ID_Itens'],
        ':nome'       => $item['nome'],
        ':setor'      => $item['setor'],
        ':observacao' => $item['observacao'],
        ':criticidade' => $item['criticidade'], // mapeia a criticidade ativa na coluna 'crticidade' dos arquivados
        ':etapa'      => $item['etapa']
    ]);

    // 3. Deleta o registro original da tabela de ativos
    $stmtDeletar = $pdo->prepare("DELETE FROM itens WHERE tag = :id");
    $stmtDeletar->execute([':id' => $idItem]);

    // Confirma todas as operações na transação
    $pdo->commit();
    echo json_encode(['sucesso' => true]);

} catch (Exception $e) {
    // Desfaz as alterações caso ocorra algum erro
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
}
?>