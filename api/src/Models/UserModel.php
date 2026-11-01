<?php

namespace App\Models;

class UserModel
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function existsByEmail(string $email): bool
    {
        $query = "SELECT id_credentials FROM Credentials WHERE email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['email' => $email]);

        return (bool) $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function existsByCi(string $ci): bool
    {
        $query = "SELECT id_client FROM Client WHERE ci = :ci";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['ci' => $ci]);

        return (bool) $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function existsByPhone(string $phone): bool
    {
        $query = "SELECT id_client FROM Client WHERE phone = :phone";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['phone' => $phone]);

        return (bool) $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function create(string $name, string $email, string $hashedPassword, string $phone, int $roleId, string $ci): bool
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
