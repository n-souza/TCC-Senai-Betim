<?php
// 1. Importa o seu arquivo de conexão. 
require_once 'Conexao/Conexao.php'; 

header('Content-Type: application/json');

try {
    // 2. Captura a instância do PDO diretamente da sua classe estática
    $pdo = Conexao::getConexao();
    
    // Recebe o JSON enviado pelo JavaScript
    $jsonRecebido = file_get_contents('php://input');
    $requisicao   = json_decode($jsonRecebido, true);

    if (!$requisicao) {
        echo json_encode(['sucesso' => false, 'erro' => 'Dados inválidos ou vazios.']);
        exit;
    }

    $acao  = $requisicao['acao'];
    $dados = $requisicao['dados'];

    if ($acao === 'cadastrar') {
        // CORREÇÃO: Alinhado estritamente com as colunas da tabela 'itens' da imagem
        $sql = "INSERT INTO itens (nome, setor, observacao, criticidade, etapa) 
                VALUES (:nome, :setor, :observacao, :criticidade, :etapa)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nome'        => $dados['nome'],
            ':setor'       => $dados['fabricante'], // Mapeando o input 'fabricante' para a coluna 'setor'
            ':observacao'  => $dados['descricao'],  // Mapeando o input 'descricao' para a coluna 'observacao'
            ':criticidade' => $dados['criticidade'],
            ':etapa'       => $dados['etapa']
        ]);

        // Pega o ID gerado automaticamente pelo MySQL (coluna tag)
        $tagGerada = $pdo->lastInsertId();

        echo json_encode([
            'sucesso' => true, 
            'mensagem' => 'Item cadastrado com sucesso!',
            'tag' => $tagGerada 
        ]);

    } else if ($acao === 'editar') {
        // CORREÇÃO: Tabela alterada de 'equipamentos' para 'itens'. Colunas corrigidas.
        $sql = "UPDATE itens 
                SET nome = :nome, setor = :setor, observacao = :observacao, 
                    criticidade = :criticidade, etapa = :etapa 
                WHERE tag = :tag";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nome'        => $dados['nome'],
            ':setor'       => $dados['fabricante'], // Mantendo o padrão do seu JS
            ':observacao'  => $dados['descricao'],
            ':criticidade' => $dados['criticidade'],
            ':etapa'       => $dados['etapa'],
            ':tag'         => $dados['tag'] 
        ]);

        echo json_encode(['sucesso' => true, 'mensagem' => 'Item atualizado com sucesso!']);
    } else {
        echo json_encode(['sucesso' => false, 'erro' => 'Ação não permitida.']);
    }

} catch (PDOException $e) {
    echo json_encode(['sucesso' => false, 'erro' => 'Erro no Banco: ' . $e->getMessage()]);
}
?>