<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    #Se cargan los datos del env que fue cargado en el index
    public function __construct() {
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME');
        $this->username = getenv('DB_USER');
        $this->password = getenv('DB_PASS');
    }

    public function getConnection() {
        $this->conn = null;
        #Se trata de generar una conexión con la base de datos
        try {
        #Se trata de crear un PDO (Objeto que simboliza la conexión con la db)
        #Para esto se ingresa la información de la db con la que se hará la conexión
        #junto a las credenciales del usuario con el que se accederá a esta
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            #Se fija ATTR_ERRMODE al modo exepción
            #(Donde tirará una exepción de PDO ante cualquier error)
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            #Si se lanza una exepción de PDO, se la tira también como una exepción normal.
            #(frente a la cuál responderá el catch de $db en index)
            throw new Exception($e->getMessage());
        }
        #Si no se tira una exepción, se devuelve el PDO con la conexión hecha
        return $this->conn;
    }
}
