#!/usr/bin/env bash

# Error handling
set -euo pipefail
trap 'echo -e "\e[1;31mFallo en la línea $LINENO: $BASH_COMMAND\e[0m" >&2' ERR

## Dependencias
sudo zypper refresh 

echo -e "\e[1;32mInstalando Git\e[0m"
sudo zypper install -y git 
echo -e "\e[1;32mInstalando Rclone\e[0m"
sudo zypper install -y rclone 
echo -e "\e[1;32mInstalando mariadb\e[0m"
sudo zypper install -y mariadb 
echo -e "\e[1;32mInstalando phpMyAdmin\e[0m"
sudo zypper install -y phpMyAdmin 
echo -e "\e[1;32mInstalando apache2\e[0m"
sudo zypper install -y apache2 apache2-mod_php8 
echo -e "\e[1;32mInstalando php8\e[0m"
sudo zypper install -y php8 php8-mysql php8-mbstring php8-zip php8-gd php8-curl php8-gd

## Aplicación
sudo mkdir -p /srv/www
if [[ -d /srv/www/htdocs/.git ]]; then
    sudo git -C /srv/www/htdocs pull --ff-only
else
    sudo git -C /srv/www clone https://github.com/thxiara/Minute.git htdocs
fi

## ABML
echo -e "\e[1;32mInstalando centro de computos\e[0m"
sudo zypper install -y --allow-unsigned-rpm /srv/www/htdocs/abml-0.0.1-1.noarch.rpm #Instalar abml desde el paquete empaquetado con el sitio

