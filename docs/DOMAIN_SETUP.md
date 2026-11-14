En caso de que se desee publicar la aplicación bajo un dominio utilizando Cloudflare como proxy, será necesario registrar el dominio, configurar los registros DNS, generar un certificado SSL (si se quiere poder utilizar HTTPS) e instalarlo en Apache. Esto se podrá lograr siguiendo los siguientes pasos:

### Registrar el dominio en Cloudflare
**Agregar el sitio en Cloudflare**

Desde el dashboard de Cloudflare se elige "Add a site", se ingresa el que se vaya a utilizar, y se selecciona el plan gratuito.

**Cambiar los nameservers en el registrador**
Cloudflare asigna un par de nameservers propios para ser utilizados, estos tendrán que ser ingresador en el proveedor del dominio para que Cloudfare pueda gestionar el dominio (una vez ingresados los nameservers, se puede tardar hasta 24 horas en actualizarse los registros y poder continuar).

### Configurar los registros DNS
**Apuntar un subdominio al servidor**
Tipo A:    minute.uy        -> (IP del servidor)   Proxy: activado (naranja)
> Se deberá ingresar @ para referirse al dominio raíz

>El proxy (nube naranja) es obligatorio si se desea que Cloudflare entregue su certificado de borde y oculte la IP del servidor; el certificado que se genera a continuación solo es válido en ese modo.

### Generar el certificado SSL
**Crear el certificado desde Cloudflare**
Dashboard de Cloudflare -> SSL/TLS -> Origin Server -> Create Certificate
Tipo de llave: RSA (2048)
Hostnames:     minute.uy y *.minute.uy
Validez:       15 años

Se deberán copiar tanto el certificado como la llave privada, ya que estos solo se muestran una vez.

### Instalar el certificado en Apache
**Guardar el certificado y la llave en las rutas de Apache**
```bash
# Se crean los directorios si no existen
sudo install -d -m 755 /etc/apache2/ssl.crt
sudo install -d -m 700 /etc/apache2/ssl.key

# Se guarda el certificado
sudo tee /etc/apache2/ssl.crt/minute.crt >/dev/null <<'EOF'
-----BEGIN CERTIFICATE-----
# llave
-----END CERTIFICATE-----
EOF

# Se guarda la llave privada
sudo tee /etc/apache2/ssl.key/minute.key >/dev/null <<'EOF'
-----BEGIN PRIVATE KEY-----
# llave
-----END PRIVATE KEY-----
EOF

# Se restringen los permisos para que la llave solo puede ser leída por root
sudo chown root:root /etc/apache2/ssl.crt/minute.crt /etc/apache2/ssl.key/minute.key
sudo chmod 644 /etc/apache2/ssl.crt/minute.crt
sudo chmod 600 /etc/apache2/ssl.key/minute.key
```

**Habilitar el módulo SSL y el puerto 443**
```bash
# Se habilita el módulo de SSL de Apache
sudo a2enmod ssl

# Se agrega el puerto 443 si no está presente
grep -q '^Listen 443' /etc/apache2/listen.conf || echo 'Listen 443' | sudo tee -a /etc/apache2/listen.conf
```

**Crear la configuración del vhost para el dominio (/etc/apache2/vhosts.d/minute-ssl.conf)**
```bash
# Se puede partir de la plantilla incluida por openSUSE
sudo cp /etc/apache2/vhosts.d/vhost-ssl.template /etc/apache2/vhosts.d/minute-ssl.conf

# Luego se reemplaza su contenido por el bloque que sigue
```

```apache
<VirtualHost *:443>
	ServerName minute.uy
	ServerAlias www.minute.uy
	DocumentRoot /srv/www/htdocs

	SSLEngine on
	SSLCertificateFile    /etc/apache2/ssl.crt/minute.crt
	SSLCertificateKeyFile /etc/apache2/ssl.key/minute.key

	<Directory /srv/www/htdocs>
		Options FollowSymLinks
		AllowOverride All
		Require all granted
	</Directory>

	ErrorLog  /var/log/apache2/minute-error_log
	CustomLog /var/log/apache2/minute-access_log combined
</VirtualHost>
```

**Reiniciar Apache para aplicar cambios**
```bash
sudo systemctl restart apache2
```

### Configurar el modo SSL en Cloudflare
**Seleccionar Full (strict)**
```bash
# Dashboard de Cloudflare -> SSL/TLS -> Overview -> Full (strict)
# Edge Certificates -> Always Use HTTPS: activado
# (Opcional) HSTS: activado una vez confirmado que HTTPS funciona
```
>Full (strict) es el modo que valida el certificado del servidor de origen. El modo Flexible deja la conexión Cloudflare-servidor sin cifrar.
