<?php
require_once __DIR__ . '/../Conexao/Conexao.php';

abstract class Funcionario {
    private $id;
    private $nome;
    private $cargo;
    private $telefone;
    private $email;

    public static function login($email, $senha) {
        try {
            $db = Conexao::getConexao();
            
            $sql = "SELECT * FROM funcionarios WHERE email = :email LIMIT 1";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verifica se o usuário existe e se a senha bate
            if ($usuario && $usuario['senha'] === $senha) {
                // Inicia a sessão e guarda os dados do usuário
                if (session_status() === PHP_SESSION_NONE) {
                    session_start();
                }
                
                $_SESSION['usuario_id'] = $usuario['ID_Funcionario'];
                $_SESSION['usuario_nome'] = $usuario['nome'];
                $_SESSION['usuario_cargo'] = $usuario['cargo'];
                
                return $usuario['cargo']; // Retorna o cargo para sabermos para onde redirecionar
            }
            
            return false; // Credenciais inválidas
            
        } catch (PDOException $e) {
            die("Erro no sistema: " . $e->getMessage());
        }
    }
}