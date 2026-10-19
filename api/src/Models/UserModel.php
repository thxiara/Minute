<?php

namespace App\Models;

class UserModel
{
    private $db;
    # Se define la variable db a traves del constructor (el valor se ingresa como parametro al instanciar la clase UserModel).
    public function __construct($db)
    {
        $this->db = $db;
    }

    public function existsByEmail(string $email): bool
    {
        
        # Es basicamente la misma logica utilizada en la function 'contarClientes' de la clase ClienteModel, 
        # pero en este caso, al tener un dato variable proveniente del usuario ('email'),
        # existe la posibilidad de que se haga una inyección de SQL.
        $query = "SELECT id_credentials FROM Credentials WHERE email = :email";
        $stmt = $this->db->prepare($query);

        # Gracias al execute, el placeholder ':email',
        # es reemplazado por el valor de la variable $email, evitando asi la inyección de SQL.
        $stmt->execute(['email' => $email]);

        return (bool) $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function create(string $name, string $email, string $hashedPassword, ?string $phone, int $roleId, string $ci): bool
    {
        try {
            $this->db->beginTransaction();

            $stmtCredentials = $this->db->prepare(
                "INSERT INTO Credentials (email, password) VALUES (:email, :password)"
            );
            $stmtCredentials->execute([
                'email' => $email,
                'password' => $hashedPassword,
            ]);
            $credentialsId = $this->db->lastInsertId();

            $stmtClient = $this->db->prepare(
                "INSERT INTO Client (name_client, phone, fr_credentials, fr_role, `ci`) VALUES (:name, :phone, :fr_credentials, :fr_role, :ci)"
            );
            $stmtClient->execute([
                'name' => $name,
                'phone' => $phone,
                'fr_credentials' => $credentialsId,
                'fr_role' => $roleId, // Assuming a default role
                'ci' => $ci, // Assuming a default value for ci
            ]);

            $this->db->commit();

            return true;
        } catch (\PDOException $e) {
        $this->db->rollBack();
        error_log($e->getMessage());
    file_put_contents('/tmp/debug.log', get_class($e) . ': ' . $e->getMessage() . "\n", FILE_APPEND);
        return false;
        }
    }

    public function findByEmail(string $email): ?array
    {
        $query = "SELECT
                        cl.id_client,
                        cl.name_client,
                        cl.phone,
                        cl.fr_role AS role_id,
                        cr.id_credentials,
                        cr.email,
                        cr.password
                   FROM Credentials cr
                   INNER JOIN Client cl ON cl.fr_credentials = cr.id_credentials
                   WHERE cr.email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $user ?: null;
    }
}
