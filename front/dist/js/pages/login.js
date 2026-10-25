document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const alertContainer = document.getElementById('alertContainer');

    const datos = {
        email: this.email.value,
        password: this.password.value
    };

    const mostrarError = (mensaje) => {
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-danger';
        alerta.textContent = mensaje;
        alertContainer.replaceChildren(alerta);
    };

    API.request('/login', 'POST', datos).then((data) => {
        if (!data.success) {
            mostrarError(data.message);
            return;
        }

        const destino = Session.dashboardFor(data.role_id);

        if (!destino) {
            API.request('/logout', 'POST');
            mostrarError('Tu usuario no tiene un panel asignado.');
            return;
        }

        window.location.replace(destino);
    });
});