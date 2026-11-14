En caso de que los scripts de instalación no se encuentren disponibles o funcionales, para permitirse la realización de backups (tanto locales como remotos), será necesario completar la instalación de la aplicación (como especificado en APP_INSTALL.md), e instalar y configurar tanto el centro de computos como rclone. Esto se podrá lograr siguiendo los siguientes pasos:

### Setup rclone:
**Instalar rclone y centro de computos**
```bash
# Se instala rclone para permitir la sincronización de datos con servicios de almacenamiento remoto
sudo zypper install -y rclone
```

*Configurar remote de Backblaze*
```bash
# Si no se hizo antes, de deberá crear una cuenta de backblaze, crear un almacenamiento b2, dentro de este crear un bucket, y finalmente generar una llave de aplicación con acceso a este bucket (cuyas llaves deberán ser copiadas al comando)
sudo rclone config create "(nombre remote)" b2 account="(KEY_ID)" key="(APP_KEY) --non-interactive \
```

### Setup ABML

**Instalar ABML**
```bash
#Se instala el abml que viene empaquetado con la aplicación para poder realizar los backups (se deberá permitir instalarlo aunque no sea un paquete  firmado)
sudo zypper install -y --allow-unsigned-rpm /srv/www/htdocs/abml-0.0.1-1.noarch.rpm 
```

**Configurar ABML**
```bash
ABML_CONFIGURED=1 # 0 mostrará un mensaje de advertencia al abrir el abml
GIT_DIR="/srv/www/htdocs" # Directorio donde se instalo la aplicación
DB_NAME="(nombre db)"
BACKUP_REMOTE="(nombre remote)"
BACKUP_REMOTE_DIR="(nombre de bucket de backblaze)"
BACKUP_DIR="/srv/backups/" # Directorio donde se guardarán los backups
BACKUP_NAME="backup" # Nombre base de los backups (backup2026-10-1-1.sql)
```
