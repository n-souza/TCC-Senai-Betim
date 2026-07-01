<?php
require_once 'Conexao.php';

try {
    $db = Conexao::getConexao();
    
    echo "Sucesso!";
    echo "A conexão com o banco de dados foi estabelecida com êxito.";
    
    $query = $db->query("SHOW TABLES LIKE 'Funcionarios'");
    if ($query->rowCount() > 0) {
        echo "✔ A tabela 'Funcionarios' foi encontrada no banco!";
    } else {
        echo "⚠ Conexão OK, mas a tabela 'Funcionarios' não foi encontrada. Verifique se executou o script SQL.";
    }

    Conexao::fecharConexao();
    echo "✔ Conexão encerrada com sucesso após o teste.";

} catch (Exception $e) {
    echo "Falha na Conexão!";
    echo "Erro: " . $e->getMessage() . "";
}

Conexao::fecharConexao();