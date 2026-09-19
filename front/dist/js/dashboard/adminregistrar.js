document.querySelectorAll(".arrow-button").forEach(button => {

    button.addEventListener("click", function() {

        setTimeout(() => {

            const expanded =
                this.getAttribute("aria-expanded");

            this.innerHTML =
                expanded === "true" ? "V" : "&lt;";

        }, 50);

    });

});

const registrarSocioForm = document.getElementById('registrarSocioForm');

if (registrarSocioForm) {

    // Debe coincidir con los id_role insertados en Role (api/config/init.sql).
    const ROLE_IDS = {
        admin: 1,
        entrenador: 2,
        profesor: 3,
        socio: 4
    };

    registrarSocioForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const alertContainer = document.getElementById('alertContainer');

        const tipoSeleccionado = this.tipo.value;
        if (!tipoSeleccionado) {
            alertContainer.innerHTML = `<div class="alert alert-danger">Seleccioná un tipo de usuario.</div>`;
            return;
        }

        const datos = {
            name: this.nombre.value,
            ci: this.ci.value,
            phone: this.telefono.value,
            email: this.email.value,
            password: this.contrasena.value,
            // El formulario de socios pide una sola contraseña; se reutiliza
            // el mismo valor para cumplir la confirmación que exige la API.
            confirm_password: this.contrasena.value,
            role: ROLE_IDS[tipoSeleccionado]
        };

        API.request('/register', 'POST', datos).then((data) => {
            if (data.success) {
                alertContainer.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
                registrarSocioForm.reset();
            } else {
                alertContainer.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
            }
        });
    });

    const btnCancelar = registrarSocioForm.querySelector('.btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => registrarSocioForm.reset());
    }
}
