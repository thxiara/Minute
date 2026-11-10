document.getElementById('loginForm').addEventListener('submit', function (e) {
    // Se cancela la acción default ante submits permitiendo al javascript operar con los datos
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

    // Se hace un request POST al endpoint login con los datos,
    // cuando se recibe la respuesta del request, esta rellenará el parametro data.
    API.request('/login', 'POST', datos).then((data) => {
        // Si success en data no es verdadera o no esta asignada
        if (!data.success) {
            // Se mostrará un error
            // (asignado ya sea por el catch o por el helper que haya dado la respuesta json)
            mostrarError(data.message);
            return;
        }
        // si success es verdadera entonces se hace una redirección a donde data indique
        window.location.replace(data.redirect);
    });
});
