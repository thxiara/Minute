Para utilizar nftables como firewall, será necesario instalar el paquete, deshabilitar firewalld y cargar el ruleset que se muestra a continuación como servicio. Esto se puede hacer siguiendo los siguientes pasos:

### Instalar nftables
```bash
# Se instala el paquete que provee el comando nft y la unidad nftables.service
sudo zypper install -y nftables
```

### Deshabilitar firewalld
```bash
# Ambos firewalls no pueden convivir: nftables.service declara Conflicts=firewalld.service
sudo systemctl disable --now firewalld
```

### Escribir el ruleset
```bash
# Se crea el directorio donde va la configuración de servicio
sudo mkdir -p /etc/nftables/rules

# Se edita el ruleset
sudo nano /etc/nftables/rules/main.nft
```

**Contenido de /etc/nftables/rules/main.nft**
```nft
#!/usr/sbin/nft -f

define port_ssh  = {22, 3301}          # sshd 
define ports_web = {80, 443}     # Apache: aplicación y phpMyAdmin

## Salidas necesarias para que el servidor funcione
define ports_mirror = {80, 443, 21, 873}   # repos zypper: http, https, ftp y rsync
define port_dns     = 53                   # resolución de nombres (zypper, git, rclone)
define port_ntp     = 123                  # sincronización de hora (necesaria para TLS)

# Vuelve a cargar el ruleset desde cero en cada aplicación para que reiniciar
# nftables no vaya duplicando reglas.
# OJO: también borra las tablas de docker/podman/libvirt si este archivo se
# recarga mientras esos servicios están en ejecución.
flush ruleset

table inet filter {
        chain input {
                type filter hook input priority filter; policy drop;
                iif "lo" accept
                ct state { established, related } accept
                ct state invalid drop

                meta l4proto { icmp, ipv6-icmp } accept

                tcp dport $port_ssh accept
                tcp dport $ports_web accept

                # Respuesta del servidor DHCP al cliente de este host
                udp sport 67 udp dport 68 accept         # DHCPv4
                udp sport 547 udp dport 546 accept       # DHCPv6
        }

        chain forward {
                type filter hook forward priority filter; policy drop;
        }

        chain output {
                type filter hook output priority filter; policy drop;
                oif "lo" accept
                ct state { established, related } accept
                ct state invalid drop

                meta l4proto { icmp, ipv6-icmp } accept

                # Petición del cliente DHCP de este host
                udp sport 68 udp dport 67 accept         # DHCPv4
                udp sport 546 udp dport 547 accept       # DHCPv6

                # Resolución de nombres
                tcp dport $port_dns accept
                udp dport $port_dns accept

                # Descarga de paquetes y actualizaciones
                tcp dport $ports_mirror accept

                # Sincronización de hora
                udp dport $port_ntp accept
        }
}
```

### Validar y activar
**Se carga el archivo de configuración**
```bash
sudo nft -f /etc/nftables/rules/main.nft
```

**Se habilita el servicio para que cargue en inicio**
```bash
sudo systemctl enable --now nftables
```

### Verificación
**Revisar las reglas activas y los puertos escuchando**
```bash
# Debe mostrar la tabla antes escrita
sudo nft list ruleset

# Tiene que mostrar solo los puertos permitidos
sudo ss -plunt
```
