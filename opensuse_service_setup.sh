echo -e "\e[1;34mPrendiendo servicio de Apache...\e[0m"
sudo systemctl enable --now apache2
echo -e "\e[1;34mPrendiendo servicio de MariaDB...\e[0m"
sudo systemctl enable --now mariadb
echo -e "\e[1;34mConfigurando base de datos de MariaDB...\e[0m"
while :; do
	echo -e "\e[1;34mIngrese nombre de base de datos a crear:\e[0m"
	printf "database: "
	read newdb
	echo -e "\e[1;34mIngrese nombre de usuario para acceder a MariaDB:\e[0m"
	printf "username: "
	read newuser
	echo -e "\e[1;34mIngrese contraseña de usuario para acceder a MariaDB:\e[0m"
	printf "password: "
	read newpass
	echo -e "\e[1;32mEs esto correcto? (S/n)\e[0m \nNombre base de datos: '$newdb' \nNombre de usuario para db: '$newuser' \nContraseña para usuario para db: '$newpass'"
	printf "(S/n):"
	read choice
	case "$choice" in
		S|s|Y|y) break ;;
		*) continue ;;
	esac
done
sudo mariadb -e "CREATE DATABASE `$newdb` CHARACTER SET utf8mb4;"
sudo mariadb -e "CREATE USER '$newuser'@'localhost' IDENTIFIED BY '$newpass';"
sudo mariadb -e "GRANT ALL PRIVILEGES ON `$newdb`.* TO '$newuser'@'localhost';"
sudo mariadb -e "FLUSH PRIVILEGES;"
printf "DB_HOST=localhost\nDB_NAME=$newdb\nDB_USER=$newuser\nDB_PASS=$newpass" | sudo tee /srv/www/htdocs/api/.env
exit 0
