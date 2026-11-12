#!/usr/bin/env bash

# Error handling
set -euo pipefail
trap 'echo -e "\e[1;31mFallo en la línea $LINENO: $BASH_COMMAND\e[0m" >&2' ERR

## Habilitado de servicios
echo -e "\e[1;34mPrendiendo servicio de Apache...\e[0m"
sudo systemctl enable --now apache2
echo -e "\e[1;34mPrendiendo servicio de MariaDB...\e[0m"
sudo systemctl enable --now mariadb
echo -e "\e[1;34mConfigurando base de datos de MariaDB...\e[0m"

##Habilitado de modulo rewrite, AllowOverride y FollowSymLinks para Apache
sudo a2enmod rewrite

sudo mkdir -p /etc/apache2/conf.d/
[[ -f /etc/apache2/conf.d/zz-htdocs.conf ]] \
|| sudo tee /etc/apache2/conf.d/zz-htdocs.conf >/dev/null <<'EOF'
# Allow .htaccess in the application docroot (added by opensuse_service_setup.sh)
<Directory "/srv/www/htdocs">
	Options FollowSymLinks
	AllowOverride All
	Require all granted
</Directory>
EOF

## Habilitado de la redirección para phpMyAdmin
sudo mkdir -p /usr/share/phpMyAdmin
[[ -f /etc/apache2/conf.d/phpMyAdmin.conf ]] \
|| sudo tee /etc/apache2/conf.d/phpMyAdmin.conf >/dev/null <<'EOF'
Alias /phpMyAdmin /usr/share/phpMyAdmin

<Directory /usr/share/phpMyAdmin>
	Options FollowSymLinks
	DirectoryIndex index.php
	AllowOverride None
	Require local
</Directory>
EOF

sudo systemctl restart apache2
