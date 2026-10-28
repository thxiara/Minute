// Mantiene la interfaz sincronizada con la sesión del servidor.
// Con sesión iniciada: el botón del header lleva al dashboard.
// Sin sesión: el botón lleva al login.
(function () {
    if (typeof API === 'undefined') return;

    API.request('/me').then((data) => {
        const haySesion = Boolean(data && data.success && data.logged_in);
        const destino = (data && data.dashboard) || '/dash';

        // Página de login: si ya está logueado, no tiene sentido mostrar el formulario.
        if (document.getElementById('loginForm')) {
            if (haySesion) window.location.replace(destino);
            return;
        }

        const boton = document.getElementById('accesoBtn');
        if (!boton) return;

        if (haySesion) {
            boton.href = destino;
            boton.textContent = 'IR AL DASHBOARD';
            boton.title = data.name ? `Panel de ${data.name}` : 'Ir al dashboard';
        } else {
            boton.href = '/login';
            boton.textContent = 'INICIAR SESIÓN';
        }
    });
})();
