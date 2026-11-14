En caso de que se desee automatizar la realización de los backups (tanto locales como remotos) generados por el centro de computos, será necesario crear una tarea programada de cron que ejecute los scripts de ABML en el orden correcto.
Para esto se necesitará haber configurado los backups anteriormente y cumplir con los siguientes pasos:

### Formato de crontab
Un crontab se compone de cinco campos de tiempo seguidos del comando que se va a ejecutar:

```bash
# ┌──────────── minuto (0-59)
# │ ┌────────── hora (0-23)
# │ │ ┌──────── día del mes (1-31)
# │ │ │ ┌────── mes (1-12)
# │ │ │ │ ┌──── día de la semana (0-6, donde 0 es domingo)
# │ │ │ │ │
# * * * * * comando
```

Cada * significa todos los valores posibles de ese campo (por ejemplo, en el campo de los minutos, * significa ejecutar cada minuto). 

### Crear la tarea
**Editar el crontab de root (para que los scripts corran con los permisos necesarios)**
```bash
# Se abre el crontab del usuario root, que es el que puede leer la base y el remoto de rclone
sudo crontab -e
```

**Agregar las tareas al archivo**
```bash

# Respaldo local de la base de datos y actualización de backups remotos todos los viernes a las 22:00
0 22 * * 5 /usr/lib/abml/localbackups_abml.sh >> /dev/null && /usr/lib/abml/remotebackups_abml.sh >> /dev/null 2>&1
