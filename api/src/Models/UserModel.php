<?php

namespace App\Models;

class UserModel
{
    private $db;

    // Columnas que se devuelven al mostrar un usuario (nunca la contraseña ni la foto en sí).
    private const COLUMNAS_PERFIL = "
        cl.id_client, cl.name_client, cl.ci, cl.phone, cl.fr_role AS role_id, cr.email,
        cl.birth_client, cl.created_client, cl.active_client,
        (cl.photo_client IS NOT NULL) AS has_photo,
        (SELECT mm.expiry_date FROM member_membership mm
          WHERE mm.fr_client = cl.id_client ORDER BY mm.expiry_date DESC LIMIT 1) AS expiry_date,
        (SELECT m.name_membership FROM member_membership mm
           INNER JOIN Membership m ON m.id_membership = mm.fr_membership
          WHERE mm.fr_client = cl.id_client ORDER BY mm.expiry_date DESC LIMIT 1) AS membership_name";

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

    // Crea credenciales + cliente. Si es socio y trae plan, también le da la primera membresía.
    public function create(string $name, string $email, string $hashedPassword, string $phone, int $roleId, string $ci,
                           ?string $birth = null, ?int $membershipId = null): bool
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
                "INSERT INTO Client (name_client, phone, fr_credentials, fr_role, ci, birth_client)
                 VALUES (:name, :phone, :fr_credentials, :fr_role, :ci, :birth)"
            );
            $stmtClient->execute([
                'name' => $name,
                'phone' => $phone,
                'fr_credentials' => $credentialsId,
                'fr_role' => $roleId,
                'ci' => $ci,
                'birth' => $birth,
            ]);
            $clientId = (int) $this->db->lastInsertId();

            if ($membershipId !== null) {
                $this->insertarMembresia($clientId, $membershipId, date('Y-m-d'));
            }

            $this->db->commit();

            return true;
        } catch (\PDOException $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }

    // Datos de un usuario (sin la contraseña).
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT " . self::COLUMNAS_PERFIL . "
               FROM Client cl
               INNER JOIN Credentials cr ON cr.id_credentials = cl.fr_credentials
              WHERE cl.id_client = :id"
        );
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$user) {
            return null;
        }

        $user['id_client'] = (int) $user['id_client'];
        $user['role_id'] = (int) $user['role_id'];
        $user['active_client'] = (bool) $user['active_client'];
        $user['has_photo'] = (bool) $user['has_photo'];

        return $user;
    }

    // true si el valor ya lo usa OTRO usuario (para validar al editar).
    // $campo viene siempre del código, nunca del usuario.
    public function datoEnUsoPorOtro(string $campo, string $valor, int $id): bool
    {
        $consultas = [
            'email' => "SELECT 1 FROM Credentials cr INNER JOIN Client cl ON cl.fr_credentials = cr.id_credentials
                         WHERE cr.email = :valor AND cl.id_client <> :id",
            'ci'    => "SELECT 1 FROM Client WHERE ci = :valor AND id_client <> :id",
            'phone' => "SELECT 1 FROM Client WHERE phone = :valor AND id_client <> :id",
        ];
        $stmt = $this->db->prepare($consultas[$campo]);
        $stmt->execute(['valor' => $valor, 'id' => $id]);

        return (bool) $stmt->fetchColumn();
    }

    // Actualiza los datos del usuario. Si $hashedPassword es null, la contraseña no se toca.
    public function update(int $id, string $name, string $email, string $phone, string $ci, ?string $hashedPassword): bool
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare(
                "UPDATE Client SET name_client = :name, phone = :phone, ci = :ci WHERE id_client = :id"
            );
            $stmt->execute(['name' => $name, 'phone' => $phone, 'ci' => $ci, 'id' => $id]);

            $sql = "UPDATE Credentials cr INNER JOIN Client cl ON cl.fr_credentials = cr.id_credentials
                       SET cr.email = :email" . ($hashedPassword !== null ? ", cr.password = :password" : "") . "
                     WHERE cl.id_client = :id";
            $params = ['email' => $email, 'id' => $id];
            if ($hashedPassword !== null) {
                $params['password'] = $hashedPassword;
            }
            $this->db->prepare($sql)->execute($params);

            $this->db->commit();
            return true;
        } catch (\PDOException $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }

    // Dar de baja (o reactivar). No se borra nada: el historial queda.
    public function setActivo(int $id, bool $activo): bool
    {
        $stmt = $this->db->prepare("UPDATE Client SET active_client = :activo WHERE id_client = :id");
        return $stmt->execute(['activo' => $activo ? 1 : 0, 'id' => $id]);
    }

    public function estaActivo(int $id): bool
    {
        $stmt = $this->db->prepare("SELECT active_client FROM Client WHERE id_client = :id");
        $stmt->execute(['id' => $id]);
        return (bool) $stmt->fetchColumn();
    }

    // ---------------------------------------------------------------- Membresías

    public function listarMembresias(): array
    {
        return $this->db->query(
            "SELECT id_membership, name_membership, desc_membership, months_membership
               FROM Membership ORDER BY id_membership"
        )->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function existeMembresia(int $id): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM Membership WHERE id_membership = :id");
        $stmt->execute(['id' => $id]);
        return (bool) $stmt->fetchColumn();
    }

    // Renueva: si la membresía actual sigue vigente, el nuevo período arranca cuando termina.
    public function renovarMembresia(int $clientId, int $membershipId): bool
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT MAX(expiry_date) FROM member_membership WHERE fr_client = :id"
            );
            $stmt->execute(['id' => $clientId]);
            $vence = $stmt->fetchColumn();
            $hoy = date('Y-m-d');
            $desde = ($vence && $vence > $hoy) ? $vence : $hoy;

            $this->insertarMembresia($clientId, $membershipId, $desde);
            return true;
        } catch (\PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    private function insertarMembresia(int $clientId, int $membershipId, string $desde): void
    {
        $stmt = $this->db->prepare(
            "INSERT INTO member_membership (fr_client, fr_membership, last_renewed, expiry_date)
             SELECT :cliente, m.id_membership, :desde, DATE_ADD(:desde2, INTERVAL m.months_membership MONTH)
               FROM Membership m WHERE m.id_membership = :plan"
        );
        $stmt->execute(['cliente' => $clientId, 'desde' => $desde, 'desde2' => $desde, 'plan' => $membershipId]);
    }

    // ---------------------------------------------------------------- Foto de perfil

    public function guardarFoto(int $id, string $bytes, string $tipo): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE Client SET photo_client = :foto, photo_type = :tipo WHERE id_client = :id"
        );
        $stmt->bindValue('foto', $bytes, \PDO::PARAM_LOB);
        $stmt->bindValue('tipo', $tipo);
        $stmt->bindValue('id', $id, \PDO::PARAM_INT);
        return $stmt->execute();
    }

    // [bytes, tipo] o null si no tiene foto.
    public function foto(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT photo_client, photo_type FROM Client WHERE id_client = :id AND photo_client IS NOT NULL"
        );
        $stmt->execute(['id' => $id]);
        $fila = $stmt->fetch(\PDO::FETCH_NUM);
        return $fila ?: null;
    }

    // ---------------------------------------------------------------- Login

    public function findByEmail(string $email): ?array
    {
        $query = "SELECT
                        cl.id_client,
                        cl.name_client,
                        cl.phone,
                        cl.fr_role AS role_id,
                        cl.active_client,
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
