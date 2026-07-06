<?php
// backend/arquivar_item.php
require_once __DIR__ . '/Conexao/Conexao.php';

header('Content-Type: application/json');

// Recebe os dados enviados via JSON pelo JavaScript
$dadosRecebidos = json_decode(file_get_contents("php://input"), true);

// CORREÇÃO: Lê a propriedade 'tag' enviada pelo JS, e verifica também a 'acao' (arquivar ou desarquivar)
$tagItem = $dadosRecebidos['tag'] ?? null;
$acao    = $dadosRecebidos['acao'] ?? 'arquivar'; 

if (!$tagItem) {
    echo json_encode(['sucesso' => false, 'erro' => 'Tag do item não fornecida.']);
    exit;
}

try {
    $pdo = Conexao::getConexao(); 

    // Inicia a transação
    $pdo->beginTransaction();

    if ($acao === 'arquivar') {
        // 1. Busca os dados atuais na tabela 'itens' usando a coluna 'tag'
        $stmtBusca = $pdo->prepare("SELECT * FROM itens WHERE tag = :tag");
        $stmtBusca->execute([':tag' => $tagItem]);
        $item = $stmtBusca->fetch(PDO::FETCH_ASSOC);

        if (!$item) {
            throw new Exception("Item não encontrado na tabela de ativos.");
        }

        // 2. Insere na tabela 'itens_arquivados' (omitindo o ID_Itens_Arquivados que é auto-incremento)
        $sqlInserir = "INSERT INTO itens_arquivados (tag, nome, setor, observacao, criticidade, etapa) 
                       VALUES (:tag, :nome, :setor, :observacao, :criticidade, :etapa)";
        
        $stmtInserir = $pdo->prepare($sqlInserir);
        $stmtInserir->execute([
            ':tag'         => $item['tag'], // CORREÇÃO: O índice correto da tabela 'itens' é 'tag'
            ':nome'        => $item['nome'],
            ':setor'       => $item['setor'],
            ':observacao'  => $item['observacao'],
            ':criticidade' => $item['criticidade'], 
            ':etapa'       => $item['etapa']
        ]);

        // 3. Deleta o registro original da tabela de ativos
        $stmtDeletar = $pdo->prepare("DELETE FROM itens WHERE tag = :tag");
        $stmtDeletar->execute([':tag' => $tagItem]);

    } else if ($acao === 'desarquivar') {
        // 1. Busca os dados atuais na tabela 'itens_arquivados'
        $stmtBusca = $pdo->prepare("SELECT * FROM itens_arquivados WHERE tag = :tag");
        $stmtBusca->execute([':tag' => $tagItem]);
        $item = $stmtBusca->fetch(PDO::FETCH_ASSOC);

        if (!$item) {
            throw new Exception("Item não encontrado na tabela de arquivados.");
        }

        // 2. Insere de volta na tabela 'itens' mantendo a mesma tag original
        $sqlInserir = "INSERT INTO itens (tag, nome, setor, observacao, criticidade, etapa) 
                       VALUES (:tag, :nome, :setor, :observacao, :criticidade, :etapa)";
        
        $stmtInserir = $pdo->prepare($sqlInserir);
        $stmtInserir->execute([
            ':tag'         => $item['tag'],
            ':nome'        => $item['nome'],
            ':setor'       => $item['setor'],
            ':observacao'  => $item['observacao'],
            ':criticidade' => $item['criticidade'], 
            ':etapa'       => $item['etapa']
        ]);

        // 3. Deleta o registro da tabela de arquivados
        $stmtDeletar = $pdo->prepare("DELETE FROM itens_arquivados WHERE tag = :tag");
        $stmtDeletar->execute([':tag' => $tagItem]);
    }

    // Confirma todas as operações na transação
    $pdo->commit();
    echo json_encode(['sucesso' => true, 'mensagem' => 'Operação realizada com sucesso!']);

} catch (Exception $e) {
    // Desfaz as alterações caso ocorra algum erro
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
}
?>