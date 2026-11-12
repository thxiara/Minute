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

##Habilitado de modulo rewrite y AllowOverride para Apache
sudo a2enmod rewrite
sudo tee /etc/apache2/conf.d/zz-htdocs-allowoverride.conf >/dev/null <<'EOF'
# Allow .htaccess in the application docroot (added by opensuse_service_setup.sh)
<Directory "/srv/www/htdocs">
    AllowOverride All
</Directory>
EOF
sudo apache2ctl configtest && sudo systemctl restart apache2
