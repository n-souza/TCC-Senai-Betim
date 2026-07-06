<?php
class Conexao {
<<<<<<< HEAD
    // Dados atualizados para a hospedagem InfinityFree
=======
    // Dados para a hospedagem InfinityFree
>>>>>>> b9be6b6d46b56263ce9a2e2824c1b6435d19eed1
    /*private static $host = 'sql213.infinityfree.com';
    private static $dbname = 'if0_42349837_raden';
    private static $user = 'if0_42349837';
    private static $password = '24338603';*/

<<<<<<< HEAD
=======
    //Dados para a hospedagem local
>>>>>>> b9be6b6d46b56263ce9a2e2824c1b6435d19eed1
    private static $host = '127.0.0.1';
    private static $dbname = 'raden';
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