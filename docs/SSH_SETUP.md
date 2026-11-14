En caso de que se queira asegurar el acceso al servidor mediante SSH, se podrá:

### Antes de empezar
* Se deberá contar con un usuario **distinto de root** que pertenezca al grupo `wheel` o tenga permisos de `sudo`, ya que luego se deshabilitará el acceso directo de root.
* Se deberá tener el puerto 3301 permitido en el firewall (ver NFT_SETUP.md) antes de reiniciar sshd, luego se podrá eliminar el puerto 22 del firewall.
* Se deberá mantener abierta una sesión SSH existente mientras se aplican los cambios, para poder revertirlos si algo falla.

### Instalar la llave pública
**Generar el par de llaves en la máquina del cliente**
```bash
# Se genera una llave 
ssh-keygen -t ed25519 -C "usuario@minute"
```

**Copiar la llave pública al servidor**
```bash
# Con AuthorizedKeysFile apuntando a /etc/ssh/authorized_keys/%u
cat ~/.ssh/id_ed25519.pub | ssh usuario@servidor \
	'sudo install -d -m 755 /etc/ssh/authorized_keys && sudo tee /etc/ssh/authorized_keys/usuario'
```

**Ajustar los permisos del archivo de llaves**
```bash
# sshd exige que el archivo no sea escribible por grupo ni por otros.
sudo chown root:root /etc/ssh/authorized_keys/usuario
sudo chmod 644 /etc/ssh/authorized_keys/usuario
```

### Aplicar la configuración
**Crear el archivo de configuración (/etc/ssh/sshd_config.d/50-custom-ssh.conf)**
```bash
## Red
Port 3301

## Autenticación
AuthorizedKeysFile /etc/ssh/authorized_keys/%u

PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubKeyAuthentication yes

## Mejoras Latencia
Compression no
GSSAPIAuthentication no
```

* `Port`: Escucha en el puerto 3301 en vez del 22.
* `AuthorizedKeysFile`: busca las llaves autorizadas de cada usuario en la ruta dad (`%u` se reemplaza por el nombre del usuario).
* `PermitRootLogin no`: impide el acceso directo como root.
* `PasswordAuthentication no`: deshabilita el ingreso con contraseña.
* `KbdInteractiveAuthentication no`: deshabilita la autenticación interactiva por PAM.
* `PubKeyAuthentication yes`: deja la autenticación por llave como único método.
* `Compression no` y `GSSAPIAuthentication no`: reducen la latencia de la conexión.

**Comprobar sintaxis antes de reiniciar**
```bash
# Si no hay input la sintaxís esta bien
sudo sshd -t
```

**Reiniciar el servicio**
```bash
sudo systemctl restart sshd
```
