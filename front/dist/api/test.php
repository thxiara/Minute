<?php
if (extension_loaded('mysqli')) {
    echo "¡La extensión MySQLi está ACTIVA y funcionando!";
} else {
    echo "ERROR: La extensión MySQLi sigue sin estar disponible para Apache.";
}
?>