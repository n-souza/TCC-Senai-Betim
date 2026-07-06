<?php
class Conexao {
    private static $host = '127.0.0.1';
    private static $dbname = 'Raden';
    private static $user = 'root';
    private static $password = 'root';
    
    private static $instancia = null;

    public static function getConexao() {
        if (self::$instancia === null) {
            try {
                $opcoes = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
                ];
                self::$instancia = new PDO(
                    "mysql:host=" . self::$host . ";dbname=" . self::$dbname,
                    self::$user,
                    self::$password,
                    $opcoes
                );
                
            } catch (PDOException $e) {
                die("Erro ao conectar ao banco de dados: " . $e->getMessage());
            }
        }

        return self::$instancia;
    }

    public static function fecharConexao() {
        self::$instancia = null;
    }
}
?>