#!/usr/bin/env bash

# Error handling
set -euo pipefail
trap 'echo -e "\e[1;31mFallo en la línea $LINENO: $BASH_COMMAND\e[0m" >&2' ERR

## Rellenado envs
#api
printf 'DB_HOST=localhost\nDB_NAME=%s\nDB_USER=%s\nDB_PASS=%s' "$newdb" "$newuser" "$newpass" | sudo tee /srv/www/htdocs/api/.env
sudo chown root:www /srv/www/htdocs/api/.env
sudo chmod 640 /srv/www/htdocs/api/.env

#abml
printf 'ABML_CONFIGURED=1\nGIT_DIR="/srv/www/htdocs"\nDB_NAME="%s"\nBACKUP_REMOTE="%s"\nBACKUP_REMOTE_DIR="%s"\nBACKUP_DIR="%s"\nBACKUP_NAME="%s"\n' "$newdb" "$REMOTE" "$BUCKET" "$BACKUP_ROUTE" "$BACKUP_NAME" | sudo tee /usr/lib/abml/.env
sudo chown root:root /usr/lib/abml/.env
sudo chmod 600 /usr/lib/abml/.env
