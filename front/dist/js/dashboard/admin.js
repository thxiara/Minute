// Navegación
(() => {

document.querySelectorAll(".action-button").forEach(button => {

    button.addEventListener("click", function(event) {

        event.stopPropagation();

        const menu = this.nextElementSibling;

        document.querySelectorAll(".action-menu").forEach(element => {

            if (element !== menu) {

                element.classList.remove("mostrar");

            }

        });

        menu.classList.toggle("mostrar");

    });

});


document.addEventListener("click", function() {

    document.querySelectorAll(".action-menu").forEach(menu => {

        menu.classList.remove("mostrar");

    });

});


document.querySelectorAll(".boton-flecha").forEach(button => {

    button.addEventListener("click", function() {

        setTimeout(() => {

            const expanded =
                this.getAttribute("aria-expanded");

            this.innerHTML =
                expanded === "true" ? "V" : "&lt;";

        }, 50);

    });

});
})();

// Almacenamiento clases.
(() => {
(() => {
    const storageKey = "fitpowerClassData";
    const seed = {
        classes: [
            { id: "zumba", name: "Zumba", days: [1], time: "18:00", teacherId: "profesor-demo", studentNames: ["pepe", "papa", "miau"] },
            { id: "yoga", name: "Yoga", days: [2], time: "19:00", teacherId: "profesor-demo", studentNames: ["papa", "parapapapa"] },
            { id: "pilates", name: "Pilates", days: [4], time: "17:30", teacherId: "profesor-demo", studentNames: ["pepe", "miau"] }
        ],
        attendance: {},
        notes: {},
        cancellations: [],
        evaluations: {}
    };

    function load() {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return structuredClone(seed);

        try {
            const data = JSON.parse(stored);
            if (!data || !Array.isArray(data.classes)) throw new TypeError("Error.");
            return {
                classes: data.classes,
                attendance: data.attendance || {},
                notes: data.notes || {},
                cancellations: Array.isArray(data.cancellations) ? data.cancellations : [],
                evaluations: data.evaluations || {}
            };
        } catch {
            return structuredClone(seed);
        }
    }

    function save(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    function formatDays(days) {
        const names = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        return days.map(day => names[day]).join(", ");
    }

    function formatDate(date) {
        return new Intl.DateTimeFormat("es-UY", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }

    window.FitPowerClassData = { load, save, formatDays, formatDate };
})();
})();

//  listado  clases.
(() => {
if (document.getElementById("createClassForm")) {
const classState = window.FitPowerClassData.load();
const classForm = document.getElementById("createClassForm");
const classList = document.getElementById("managedClasses");
const emptyMessage = document.getElementById("managedClassesEmpty");

function renderManagedClasses() {
    classList.replaceChildren();
    classState.classes.forEach((session) => {
        const card = document.createElement("article");
        card.className = "schedule-card";

        const details = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = session.name;
        const schedule = document.createElement("p");
        schedule.textContent = `${window.FitPowerClassData.formatDays(session.days)} · ${session.time}`;
        details.append(title, schedule);

        const teacher = document.createElement("span");
        teacher.className = "schedule-meta";
        teacher.textContent = session.teacherId === "profesor-2" ? "pepito" : "Profesor";
        card.append(details, teacher);
        classList.append(card);
    });
    emptyMessage.hidden = classState.classes.length > 0;
}

classForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!classForm.reportValidity()) return;

    const formData = new FormData(classForm);
    const days = formData.getAll("days").map(Number);
    const feedback = document.getElementById("createClassFeedback");
    if (!days.length) {
        feedback.textContent = "Selecciona al menos un día.";
        feedback.classList.add("is-error");
        return;
    }

    const id = `clase-${Date.now().toString(36)}`;
    classState.classes.push({
        id,
        name: String(formData.get("name")).trim(),
        days,
        time: String(formData.get("time")),
        teacherId: String(formData.get("teacherId")),
        studentNames: []
    });

    try {
        window.FitPowerClassData.save(classState);
        renderManagedClasses();
        feedback.classList.remove("is-error");
        feedback.textContent = "Clase creada.";
        classForm.reset();
    } catch {
        feedback.classList.add("is-error");
        feedback.textContent = "No se pudo crear la clase.";
    }
});

renderManagedClasses();

}
})();

// Perfil socio
(() => {
const classState = window.FitPowerClassData.load();
let activeMemberName = "el socio";

function normalizedName(name) {
    return name.trim().toLocaleLowerCase("es");
}

function renderMemberClasses(memberName) {
    const list = document.getElementById("memberAssignedClasses");
    if (!list) return;

    list.replaceChildren();
    const classes = classState.classes.filter(session => session.studentNames.includes(normalizedName(memberName)));
    if (!classes.length) {
        const empty = document.createElement("li");
        empty.textContent = "No tiene clases asignadas";
        list.append(empty);
        return;
    }

    classes.forEach((session) => {
        const item = document.createElement("li");
        const name = document.createElement("strong");
        name.textContent = session.name;
        const schedule = document.createElement("span");
        schedule.textContent = `${window.FitPowerClassData.formatDays(session.days)} · ${session.time}`;
        item.append(name, schedule);
        list.append(item);
    });
}

function openClassAssignment(memberName) {
    const modal = document.getElementById("assignMemberClassesModal");
    const options = document.getElementById("memberClassOptions");
    const memberLabel = document.getElementById("assignClassesMember");
    const form = document.getElementById("assignMemberClassesForm");
    const feedback = document.getElementById("memberClassFeedback");
    if (!modal || !options || !window.bootstrap?.Modal) {
        return;
    }

    activeMemberName = memberName;
    memberLabel.textContent = memberName;
    options.replaceChildren();
    form.reset();
    feedback.hidden = true;
    feedback.textContent = "";

    classState.classes.forEach((session) => {
        const label = document.createElement("label");
        label.className = "class-assignment-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "classIds";
        checkbox.value = session.id;
        checkbox.checked = session.studentNames.includes(normalizedName(memberName));
        const description = document.createElement("span");
        description.textContent = `${session.name} · ${window.FitPowerClassData.formatDays(session.days)} · ${session.time}`;
        label.append(checkbox, description);
        options.append(label);
    });

    if (!classState.classes.length) {
        options.textContent = "Primero crea una clase para poder asignarla.";
    }
    bootstrap.Modal.getOrCreateInstance(modal).show();
}

document.addEventListener("click", (event) => {
    const profileTrigger = event.target.closest("[data-admin-profile]");
    if (profileTrigger) {
        const memberName = profileTrigger.dataset.memberName || "";
        window.location.href = `paginas/roles/admin/adminperfil.html?name=${encodeURIComponent(memberName)}`;
        return;
    }

    const classTrigger = event.target.closest("[data-open-class-assign]");
    if (classTrigger) {
        openClassAssignment(classTrigger.dataset.memberName || "el socio");
        return;
    }

});

const profileName = new URLSearchParams(window.location.search).get("name");
if (profileName) {
    const profileNameElement = document.getElementById("profileName");
    document.querySelectorAll("[data-open-class-assign]").forEach((trigger) => {
        trigger.dataset.memberName = profileName;
    });
    if (profileNameElement) profileNameElement.textContent = profileName;

    API.request("/socios").then((data) => {
        if (!data?.success || !Array.isArray(data.socios)) return;

        const profile = data.socios.find((socio) =>
            normalizedName(String(socio.name_client || "")) === normalizedName(profileName)
        );
        if (!profile) return;

        const values = {
            Document: profile.ci,
            Phone: profile.phone,
            Email: profile.email,
            Expiration: profile.expiry_date
        };
        Object.entries(values).forEach(([field, value]) => {
            const element = document.getElementById(`profile${field}`);
            if (!element || !value) return;

            const text = field === "Expiration"
                ? String(value).split("-").reverse().join("/")
                : String(value);
            element.textContent = text;
        });
    });
}

const memberForProfile = profileName || document.querySelector("[data-open-class-assign]")?.dataset.memberName || "el socio";
renderMemberClasses(memberForProfile);

const assignClassesForm = document.getElementById("assignMemberClassesForm");
if (assignClassesForm) {
    assignClassesForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const selectedIds = new Set(new FormData(assignClassesForm).getAll("classIds").map(String));
        const memberId = normalizedName(activeMemberName);
        classState.classes.forEach((session) => {
            session.studentNames = session.studentNames.filter(name => name !== memberId);
            if (selectedIds.has(session.id)) session.studentNames.push(memberId);
        });

        const feedback = document.getElementById("memberClassFeedback");
        try {
            window.FitPowerClassData.save(classState);
            renderMemberClasses(activeMemberName);
            feedback.classList.remove("is-error");
            feedback.textContent = "Clases asignadas al socio.";
            feedback.hidden = false;
        } catch {
            feedback.classList.add("is-error");
            feedback.textContent = "No se pudieron guardar las clases asignadas.";
            feedback.hidden = false;
        }
    });
}
})();

// Listado de socios
(() => {
const tbody = document.getElementById("sociosTableBody");
if (!tbody) return;

const countEl = document.getElementById("sociosCount");

const formatearVencimiento = (fecha) => {
    if (!fecha) return "—";
    const partes = String(fecha).split("-");
    if (partes.length !== 3) return String(fecha);
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const mostrarMensaje = (texto) => {
    tbody.replaceChildren();
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 5;
    celda.className = "socios-empty";
    celda.textContent = texto;
    fila.append(celda);
    tbody.append(fila);
};

const crearBotonMenu = (texto, icono, atributo, nombreSocio) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.setAttribute(atributo, "");
    boton.dataset.memberName = nombreSocio;

    const span = document.createElement("span");
    span.className = "icono-ver";
    span.textContent = icono;

    boton.append(span, ` ${texto}`);
    return boton;
};

const crearFila = (socio) => {
    const fila = document.createElement("tr");
    const valores = [
        socio.name_client || "—",
        socio.ci || "—",
        socio.phone || "—",
        formatearVencimiento(socio.expiry_date)
    ];

    valores.forEach((valor) => {
        const celda = document.createElement("td");
        celda.textContent = valor;
        fila.append(celda);
    });

    const acciones = document.createElement("td");
    acciones.className = "acciones";

    const botonAcciones = document.createElement("button");
    botonAcciones.type = "button";
    botonAcciones.className = "action-button";
    botonAcciones.textContent = "⋮";

    const menu = document.createElement("div");
    menu.className = "action-menu";

    // Las filas se crean después de cargar la página, así que el botón necesita
    // su propio listener (el de la navegación solo se engancha al inicio).
    botonAcciones.addEventListener("click", (event) => {
        event.stopPropagation();
        document.querySelectorAll(".action-menu").forEach((element) => {
            if (element !== menu) element.classList.remove("mostrar");
        });
        menu.classList.toggle("mostrar");
    });

    const nombreSocio = socio.name_client || "";
    menu.append(
        crearBotonMenu("Ver/editar perfil", "●", "data-admin-profile", nombreSocio),
        crearBotonMenu("Asignar clases", "▣", "data-open-class-assign", nombreSocio)
    );

    const darDeBaja = document.createElement("button");
    darDeBaja.type = "button";
    darDeBaja.className = "delete";
    darDeBaja.innerHTML = "<span>⊗</span> Dar de baja";
    menu.append(darDeBaja);

    acciones.append(botonAcciones, menu);
    fila.append(acciones);

    return fila;
};

const cargarSocios = async () => {
    const data = await API.request("/socios");

    if (!data || !data.success) {
        mostrarMensaje((data && data.message) || "No se pudieron cargar los socios.");
        if (countEl) countEl.textContent = "—";
        return;
    }

    const socios = Array.isArray(data.socios) ? data.socios : [];
    if (countEl) countEl.textContent = String(data.total ?? socios.length);

    if (!socios.length) {
        mostrarMensaje("No hay socios registrados.");
        return;
    }

    tbody.replaceChildren();
    socios.forEach((socio) => tbody.append(crearFila(socio)));
};

cargarSocios();
})();

// Registro
(() => {
if (document.getElementById("registrarSocioForm")) {
const registrarSocioForm = document.getElementById('registrarSocioForm');

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
})();
