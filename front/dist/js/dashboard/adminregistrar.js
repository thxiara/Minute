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

    // La membresía (plan) solo aplica a los socios: para entrenadores y profesores
    // el campo se oculta y no se exige.
    const campoPlan = document.getElementById('campoPlan');

    const actualizarCampoPlan = () => {
        const esSocio = registrarSocioForm.tipo.value === 'socio';
        campoPlan.hidden = !esSocio;
        if (!esSocio) {
            registrarSocioForm.plan.value = '';
        }
    };

    registrarSocioForm.tipo.addEventListener('change', actualizarCampoPlan);
    // 'reset' se dispara antes de que el formulario vuelva a sus valores iniciales.
    registrarSocioForm.addEventListener('reset', () => setTimeout(actualizarCampoPlan, 0));

    registrarSocioForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const alertContainer = document.getElementById('alertContainer');

        const tipoSeleccionado = this.tipo.value;
        if (!tipoSeleccionado) {
            alertContainer.innerHTML = `<div class="alert alert-danger">Seleccioná un tipo de usuario.</div>`;
            return;
        }

        if (tipoSeleccionado === 'socio' && !this.plan.value) {
            alertContainer.innerHTML = `<div class="alert alert-danger">Seleccioná el plan de membresía del socio.</div>`;
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
