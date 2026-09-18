sudo zypper refresh #Se actualiza la información de los repositorios de descarga
echo -e "\e[1;32mInstalando rclone\e[0m"
sudo zypper -n install -y rclone #Instalar rclone para hacer backups a BackBlaze
echo -e "\e[1;32mInstalando mariadb\e[0m"
sudo zypper -n install -y mariadb #Instalar MariaDB como base de datos a ser usada
echo -e "\e[1;32mInstalando vsftpd (ftp)\e[0m"
sudo zypper -n install -y vsftpd #Instalar servicio de ftp para OpenSUSE
echo -e "\e[1;32mInstalando phpMyAdmin\e[0m"
sudo zypper -n install -y phpMyAdmin #Instalar phpMyAdmin para facilitar la gestión de la base de datos
echo -e "\e[1;32mInstalando apache2\e[0m"
sudo zypper -n install -y apache2 apache2-mod_php8 #Instalar apache y sus dependencias (para interpretar php) como servidor para hostear el sitio
echo -e "\e[1;32mInstalando php8\e[0m"
sudo zypper -n install -y php8 php8-mysql php8-mbstring php8-zip php8-gd php8-curl #Instalar php8 y dependencias para poder utilizar todas las funcionalidades que requerimos del lenguaje
exit 0
