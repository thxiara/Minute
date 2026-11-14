En caso de que los scripts de instalación no se encuentren disponibles o funcionales, el proceso de instalación manual se verá compuesto por los siguientes pasos:
### Instalacion
**Instalar Apache, MariaDB, PHP, Git, Rclone, phpMyAdmin y dependencias**
``` bash
# Se deberá utiliza apt en caso de encontrarse en un sistema basado en Debian, en cuyo caso también podrán variar los nombre de los paquetes
sudo zypper install -y git
sudo zypper install -y mariadb 
sudo zypper install -y phpMyAdmin 
sudo zypper install -y apache2 apache2-mod_php8 
sudo zypper install -y php8 php8-mysql php8-mbstring php8-gd

```

**Instalar la aplicación**
```bash
# Se crea la carpeta donde se alojará la aplicación web
sudo mkdir -p /srv/www
# Y se clona dentro la carpeta el repositorio de la misma (nombrandola htdocs para que sea reconocida por Apache)
sudo git -C /srv/www clone https://github.com/thxiara/Minute.git htdocs

```

### Configuración Apache
**Habilitar los servicios de Apache y MariaDB (para que inicien automáticamente)**
```bash
sudo systemctl enable --now apache2
sudo systemctl enable --now mariadb
```

**Habilitar del modulo rewrite para Apache**
```bash
# Se habilita el modulo de rewrite para permitir redirecciones en el htaccess
sudo a2enmod rewrite
```

 **Configurar AllowOverride y FollowSymlinks para Apache (/etc/apache2/conf.d/zz-htdocs.conf)**
 ```bash
 # Se debe escribir dentro de un archivo de configuración dentro de /etc/apache2/conf.d/
 
 # Se permite el uso de SymLinks y AllowOverride dentro de htdocs
 <Directory "/srv/www/htdocs">
	Options FollowSymLinks
	AllowOverride All
	Require all granted
</Directory>
 ```

**Configurar redirección para phpMyAdmin (si no fue creada automáticamente)**
```bash
# Se deberá escribir lo siguiente dentro de un archivo de configuración llamado "phpMyAdmin.conf" bajo /usr/share/phpMyAdmin

# Se crea el alias para poder acceder al dashboard desde la ruta /phpMyAdmin
Alias /phpMyAdmin /usr/share/phpMyAdmin

<Directory "/usr/share/phpMyAdmin">
	Options FollowSymLinks
	AllowOverride None
	#Se manda el tráfico que no se procesa a index.php
	DirectoryIndex index.php
	#Se requiere que la conexión sea hecha desde la red local
	Require local
</Directory>

```

**Reiniciar Apache para aplicar la configuración**
```bash
sudo systemctl restart apache2
```

### Configuración MariaDB
**Crear la base de datos (utilizando como modelo el init.sql bajo /srv/www/htdocs/api/config/)**
```bash
sudo mariadb -e "CREATE DATABASE IF NOT EXISTS \`(nombre bd)\` CHARACTER SET utf8mb4;" %% sudo mariadb -u root "(nombre db)" < /srv/www/htdocs/api/config/init.sql;
```

**Crea el usuario con el que la aplicación accederá a la base de datos (ingresando credenciales que vayan a ser usadas)**
```bash
sudo mariadb -e "CREATE USER IF NOT EXISTS '(nombre usuario)'@'localhost' IDENTIFIED BY '(contraseña)';"
```

**Dar permisos absolutos al usuario sobre la base de datos**
``` bash
sudo mariadb -e "GRANT ALL PRIVILEGES ON \`(nombre bd)\`.* TO '(nombre usuario)'@'localhost';"
```

**Actualizar los permisos**
```bash
sudo mariadb -e "FLUSH PRIVILEGES;"
```

### Configuración aplicación
**Rellenar variables de entorno (/srv/www/htdocs/api/.env)**
```bash
# Se tendrá que crear el archivo .env bajo la ruta /srv/www/htdocs/api/ con el siguiente contenido:

# Datos que utilizara la apliación para comunicarse con la bd
DB_HOST=(host) # debe ser localhost
DB_NAME=(nombre bd)
DB_USER=(nombre usuario)
DB_PASS=(contraseña usuario)
# Carpetas donde la aplicación guardará imágenes ingresadas
#(Notese que Apache tendrá que contar con acceso de lectura y escritura a la carpeta y sus contenidos)
EXERCISE_DIR=(directorio imagenes ejercicios)
PFP_DIR=(directorio imagenes fotos de perfil)
PRODUCT_dir=(directorio imagenes productos)
```

**Configurar permisos variables de entorno**
```bash
# Por temás de seguridad, se tendrá que restringir el acceso al env

# Se fija a root como dueño y a www (grupo Apache) como grupo
sudo chown root:www /srv/www/htdocs/api/.env
# Se fijan permisos de forma que solo el dueño (root) pueda leer y escribir el archivo, y que aquellos en el grupo www tengan permiso de leerlo (los demás usuarios no pudiendo realizar ninguna de estas dos acciones)
sudo chmod 640 /srv/www/htdocs/api/.env
```
