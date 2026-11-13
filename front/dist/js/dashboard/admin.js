// Navegación
(() => {

document.querySelectorAll(".action-button").forEach(button => {
    button.addEventListener("click", function(event) {
        event.stopPropagation();
        const menu = this.nextElementSibling;
        document.querySelectorAll(".action-menu").forEach(element => {
            if (element !== menu) element.classList.remove("mostrar");
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
            const expanded = this.getAttribute("aria-expanded");
            this.innerHTML = expanded === "true" ? "V" : "&lt;";
        }, 50);
    });
});
})();

// Utilidades compartidas por las secciones de abajo.
const AdminUtil = {
    dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],

    formatDays(days) {
        return days.map(day => this.dayNames[day]).join(", ");
    },

    // "2026-11-10" o "2026-11-10 03:00:00" → "10/11/2026"
    formatDate(value) {
        if (!value) return "—";
        const [year, month, day] = String(value).slice(0, 10).split("-");
        return day ? `${day}/${month}/${year}` : String(value);
    },

    setFeedback(element, text, isError = false) {
        if (!element) return;
        element.textContent = text;
        element.classList.toggle("is-error", isError);
        element.hidden = !text;
        if (window.Toast && text && !/cargando/i.test(text)) {
            window.Toast.show(text, isError ? "error" : "success");
        }
    },

    // Corrige textos que llegan con UTF-8 leído como Latin-1 ("BÃ¡sico" → "Básico").
    texto(valor) {
        if (typeof valor !== "string" || !/[ÃÂ]/.test(valor) || typeof TextDecoder !== "function") return valor;
        for (const caracter of valor) {
            if (caracter.charCodeAt(0) > 255) return valor;
        }
        try {
            const bytes = Uint8Array.from(valor, caracter => caracter.charCodeAt(0));
            return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
            return valor;
        }
    }
};

// Clases
// Administrar clases (crear, listar, eliminar).
(() => {
const classForm = document.getElementById("createClassForm");
if (!classForm) return;

const classList = document.getElementById("managedClasses");
const emptyMessage = document.getElementById("managedClassesEmpty");
const feedback = document.getElementById("createClassFeedback");
const teacherSelect = document.getElementById("newClassTeacher");

function renderManagedClasses(classes) {
    classList.replaceChildren();
    classes.forEach((session) => {
        const card = document.createElement("article");
        card.className = "schedule-card";

        const details = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = session.name_course;
        const schedule = document.createElement("p");
        schedule.textContent = `${AdminUtil.formatDays(session.days)} · ${session.time}`;
        details.append(title, schedule);
        if (session.desc_course) {
            const description = document.createElement("p");
            description.textContent = session.desc_course;
            details.append(description);
        }

        const meta = document.createElement("span");
        meta.className = "schedule-meta";
        const alumnos = session.student_count === 1 ? "1 alumno" : `${session.student_count} alumnos`;
        meta.textContent = `${session.teacher_name} · ${alumnos}`;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "interface-button-danger";
        deleteButton.dataset.deleteClass = String(session.id_course);
        deleteButton.dataset.className = session.name_course;
        deleteButton.textContent = "Eliminar";

        // La tarjeta es una grilla de dos columnas: datos a la izquierda, meta + botón a la derecha.
        const side = document.createElement("div");
        side.className = "d-flex flex-column align-items-end gap-2";
        side.append(meta, deleteButton);
        card.append(details, side);
        classList.append(card);
    });
    emptyMessage.hidden = classes.length > 0;
}

async function loadClasses() {
    window.Skeleton?.blocks(classList, 4);
    let data;
    try {
        data = await API.request("/clases");
    } catch (error) {
        classList.replaceChildren();
        AdminUtil.setFeedback(feedback, error.message || "No se pudieron cargar las clases.", true);
        return;
    }
    if (!data?.success) {
        classList.replaceChildren();
        AdminUtil.setFeedback(feedback, data?.message || "No se pudieron cargar las clases.", true);
        return;
    }
    renderManagedClasses(data.clases);
}

async function loadTeachers() {
    const data = await API.request("/profesores");
    teacherSelect.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = data?.success && data.profesores.length ? "Selecciona un profesor" : "No hay profesores registrados";
    teacherSelect.append(placeholder);

    (data?.profesores || []).forEach((teacher) => {
        const option = document.createElement("option");
        option.value = String(teacher.id_client);
        option.textContent = teacher.name_client;
        teacherSelect.append(option);
    });
}

classForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!classForm.reportValidity()) return;

    const formData = new FormData(classForm);
    const days = formData.getAll("days").map(Number);
    if (!days.length) {
        AdminUtil.setFeedback(feedback, "Selecciona al menos un día.", true);
        return;
    }

    const data = await API.request("/clases", "POST", {
        name: String(formData.get("name")).trim(),
        desc: String(formData.get("desc") || "").trim(),
        days,
        time: String(formData.get("time")),
        teacher_id: Number(formData.get("teacherId"))
    });
    if (!data?.success) {
        AdminUtil.setFeedback(feedback, data?.message || "No se pudo crear la clase.", true);
        return;
    }
    AdminUtil.setFeedback(feedback, "Clase creada.");
    classForm.reset();
    loadClasses();
});

classList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-class]");
    if (!button) return;
    if (!window.confirm(`¿Eliminar la clase "${button.dataset.className}"? También se borran sus alumnos y su asistencia.`)) return;

    const data = await API.request(`/clases/${button.dataset.deleteClass}`, "DELETE");
    AdminUtil.setFeedback(feedback, data?.message || "No se pudo eliminar la clase.", !data?.success);
    if (data?.success) loadClasses();
});

loadTeachers();
loadClasses();
})();

// Asignar clases a un socio (modal que está en el listado de socios y en su perfil).
const AdminClassAssignment = (() => {
const modal = document.getElementById("assignMemberClassesModal");
const form = document.getElementById("assignMemberClassesForm");
if (!modal || !form) return null;

const options = document.getElementById("memberClassOptions");
const memberLabel = document.getElementById("assignClassesMember");
const feedback = document.getElementById("memberClassFeedback");
const submit = form.querySelector('[type="submit"]');
let activeMemberId = null;
let onSaved = () => {};

async function open(memberId, memberName) {
    activeMemberId = memberId;
    memberLabel.textContent = memberName || "el usuario";
    options.replaceChildren();
    AdminUtil.setFeedback(feedback, "Cargando clases…");
    submit.disabled = true;
    bootstrap.Modal.getOrCreateInstance(modal).show();

    const [allData, memberData] = await Promise.all([
        API.request("/clases"),
        API.request(`/socios/${encodeURIComponent(memberId)}/clases`)
    ]);
    if (!allData?.success || !memberData?.success) {
        AdminUtil.setFeedback(feedback, (allData?.success ? memberData : allData)?.message || "No se pudieron cargar las clases.", true);
        return;
    }

    const assigned = new Set(memberData.clases.map(session => session.id_course));
    allData.clases.forEach((session) => {
        const label = document.createElement("label");
        label.className = "class-assignment-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "classIds";
        checkbox.value = String(session.id_course);
        checkbox.checked = assigned.has(session.id_course);
        const description = document.createElement("span");
        description.textContent = `${session.name_course} · ${AdminUtil.formatDays(session.days)} · ${session.time}`;
        label.append(checkbox, description);
        options.append(label);
    });

    if (!allData.clases.length) {
        options.textContent = "Primero crea una clase para poder asignarla.";
    }
    AdminUtil.setFeedback(feedback, "");
    submit.disabled = allData.clases.length === 0;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const clases = new FormData(form).getAll("classIds").map(Number);
    submit.disabled = true;
    const data = await API.request(`/socios/${encodeURIComponent(activeMemberId)}/clases`, "PUT", { clases });
    submit.disabled = false;
    if (!data?.success) {
        AdminUtil.setFeedback(feedback, data?.message || "No se pudieron guardar las clases asignadas.", true);
        return;
    }
    AdminUtil.setFeedback(feedback, "Clases asignadas al socio.");
    onSaved(activeMemberId);
});

return {
    open,
    onSaved(callback) { onSaved = callback; }
};
})();

// Perfil de usuario (/dash/admin/perfil?id=...)
(() => {
const profileId = new URLSearchParams(window.location.search).get("id");
if (!profileId || !document.getElementById("profileName")) return;

const assignedList = document.getElementById("memberAssignedClasses");
const statusButton = document.getElementById("toggleActiveButton");
const profileFeedback = document.getElementById("profileFeedback");
let profileData = null;

function showProfile(usuario) {
    profileData = usuario;
    const values = {
        Name: usuario.name_client,
        Since: usuario.created_client ? `Registrado el ${AdminUtil.formatDate(usuario.created_client)}` : "—",
        Document: usuario.ci,
        Phone: usuario.phone,
        Email: usuario.email,
        Birth: usuario.birth_client ? AdminUtil.formatDate(usuario.birth_client) : "—",
        Status: usuario.active_client ? "Activo" : "Dado de baja",
        Plan: AdminUtil.texto(usuario.membership_name),
        Expiration: usuario.expiry_date ? AdminUtil.formatDate(usuario.expiry_date) : null
    };
    Object.entries(values).forEach(([field, value]) => {
        const element = document.getElementById(`profile${field}`);
        if (element) element.textContent = value ? String(value) : "—";
    });

    const photo = document.getElementById("profilePhoto");
    if (photo && usuario.has_photo) photo.src = `/api/usuarios/${usuario.id_client}/foto?v=${Date.now()}`;

    if (statusButton) {
        statusButton.textContent = usuario.active_client ? "Dar de baja" : "Reactivar";
        statusButton.className = usuario.active_client ? "interface-button-danger" : "interface-button";
    }
    document.querySelectorAll("[data-open-class-assign]").forEach((trigger) => {
        trigger.dataset.memberName = usuario.name_client;
        trigger.dataset.memberId = String(usuario.id_client);
    });
}

async function loadMemberClasses() {
    if (!assignedList) return;
    const data = await API.request(`/socios/${encodeURIComponent(profileId)}/clases`);
    assignedList.replaceChildren();
    const classes = data?.success ? data.clases : [];
    if (!classes.length) {
        const empty = document.createElement("li");
        empty.textContent = data?.success ? "No tiene clases asignadas" : (data?.message || "No se pudieron cargar las clases.");
        assignedList.append(empty);
        return;
    }
    classes.forEach((session) => {
        const item = document.createElement("li");
        const name = document.createElement("strong");
        name.textContent = session.name_course;
        const schedule = document.createElement("span");
        schedule.textContent = `${AdminUtil.formatDays(session.days)} · ${session.time} · ${session.teacher_name}`;
        item.append(name, schedule);
        assignedList.append(item);
    });
}

API.request(`/usuarios/${encodeURIComponent(profileId)}`).then((data) => {
    if (!data?.success || !data.usuario) {
        document.getElementById("profileName").textContent = data?.message || "No se pudo cargar el usuario.";
        return;
    }
    showProfile(data.usuario);
    loadMemberClasses();
});

AdminClassAssignment?.onSaved(loadMemberClasses);

// Dar de baja / reactivar.
statusButton?.addEventListener("click", async () => {
    if (!profileData) return;
    const activo = profileData.active_client;
    if (activo && !window.confirm(`¿Dar de baja a ${profileData.name_client}? No va a poder iniciar sesión.`)) return;

    const data = activo
        ? await API.request(`/usuarios/${profileData.id_client}`, "DELETE")
        : await API.request(`/usuarios/${profileData.id_client}/reactivar`, "POST");
    AdminUtil.setFeedback(profileFeedback, data?.message || "No se pudo completar la acción.", !data?.success);
    if (data?.success) showProfile({ ...profileData, active_client: !activo });
});

// Renovar membresía.
const renewForm = document.getElementById("renewMembershipForm");
if (renewForm) {
    const renewSelect = document.getElementById("renewMembershipPlan");
    const renewFeedback = document.getElementById("renewMembershipFeedback");

    API.request("/membresias").then((data) => {
        (data?.membresias || []).forEach((plan) => {
            const option = document.createElement("option");
            option.value = String(plan.id_membership);
            option.textContent = AdminUtil.texto(plan.name_membership);
            renewSelect.append(option);
        });
    });

    renewForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!renewForm.reportValidity()) return;
        const data = await API.request(`/usuarios/${encodeURIComponent(profileId)}/membresia`, "POST", {
            membership: Number(renewSelect.value)
        });
        AdminUtil.setFeedback(renewFeedback, data?.message || "No se pudo renovar.", !data?.success);
        if (data?.success) showProfile(data.usuario);
    });
}

// Editar los datos del usuario (PUT /api/usuarios/:id).
const editUserForm = document.getElementById("editUserForm");
const editUserButton = document.getElementById("editUserButton");
if (editUserForm && editUserButton) {
    const editModal = document.getElementById("editUserModal");
    const feedback = document.getElementById("editUserFeedback");

    editUserButton.addEventListener("click", () => {
        if (!profileData) return;
        editUserForm.nombre.value = profileData.name_client || "";
        editUserForm.ci.value = profileData.ci || "";
        editUserForm.telefono.value = profileData.phone || "";
        editUserForm.email.value = profileData.email || "";
        editUserForm.contrasena.value = "";
        AdminUtil.setFeedback(feedback, "");
        bootstrap.Modal.getOrCreateInstance(editModal).show();
    });

    editUserForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!editUserForm.reportValidity()) return;

        const submit = editUserForm.querySelector("[type=submit]");
        submit.disabled = true;
        const data = await API.request(`/usuarios/${encodeURIComponent(profileId)}`, "PUT", {
            name: editUserForm.nombre.value,
            ci: editUserForm.ci.value,
            phone: editUserForm.telefono.value,
            email: editUserForm.email.value,
            password: editUserForm.contrasena.value
        });
        submit.disabled = false;

        if (!data?.success) {
            AdminUtil.setFeedback(feedback, data?.message || "No se pudo guardar.", true);
            return;
        }
        showProfile(data.usuario);
        bootstrap.Modal.getOrCreateInstance(editModal).hide();
    });
}
})();

// Botones del menú de cada socio y del perfil.
document.addEventListener("click", (event) => {
    const profileTrigger = event.target.closest("[data-admin-profile]");
    if (profileTrigger) {
        window.location.href = `/dash/admin/perfil?id=${encodeURIComponent(profileTrigger.dataset.memberId || "")}`;
        return;
    }

    const classTrigger = event.target.closest("[data-open-class-assign]");
    if (classTrigger && classTrigger.dataset.memberId) {
        AdminClassAssignment?.open(classTrigger.dataset.memberId, classTrigger.dataset.memberName);
    }
});

// Listado de usuarios (todos los roles)
(() => {
const tbody = document.getElementById("usuariosTableBody");
if (!tbody) return;

const countEl = document.getElementById("usuariosCount");
const verBajasBtn = document.getElementById("verBajas");
const titleEl = document.getElementById("usuariosTitle");
const searchInput = document.getElementById("usersSearch");
const pageSizeSelect = document.getElementById("usersPageSize");
const filterButtons = [...document.querySelectorAll(".users-filter")];

let verBajas = false;
let currentRole = "all";
let allUsers = [];

const ROLE_LABELS = { 1: "Admin", 2: "Entrenador", 3: "Profesor", 4: "Socio" };
const ROLE_PLURAL = { socio: "Socios", profesor: "Profesores", entrenador: "Entrenadores", admin: "Admins" };

const mostrarMensaje = (texto) => {
    tbody.replaceChildren();
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 6;
    celda.className = "usuarios-empty";
    celda.textContent = texto;
    fila.append(celda);
    tbody.append(fila);
};

const crearBotonMenu = (texto, icono, atributo, usuario) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.setAttribute(atributo, "");
    boton.dataset.memberName = usuario.name_client || "";
    boton.dataset.memberId = String(usuario.id_client);

    const span = document.createElement("span");
    span.className = "icono-ver";
    span.textContent = icono;

    boton.append(span, ` ${texto}`);
    return boton;
};

const crearFila = (usuario) => {
    const fila = document.createElement("tr");
    fila.dataset.userRow = "";
    const esSocio = Number(usuario.role_id) === 4;
    const nombre = usuario.name_client || "—";

    const nombreCelda = document.createElement("td");
    nombreCelda.textContent = nombre;
    fila.append(nombreCelda);

    const rolCelda = document.createElement("td");
    const rolBadge = document.createElement("span");
    rolBadge.className = "rol-badge";
    rolBadge.textContent = ROLE_LABELS[Number(usuario.role_id)] || usuario.role_name || "—";
    rolCelda.append(rolBadge);
    fila.append(rolCelda);

    [usuario.ci, usuario.phone].forEach((valor) => {
        const celda = document.createElement("td");
        celda.textContent = valor || "—";
        fila.append(celda);
    });

    const vencimiento = document.createElement("td");
    vencimiento.textContent = esSocio ? AdminUtil.formatDate(usuario.expiry_date) : "—";
    fila.append(vencimiento);

    const acciones = document.createElement("td");
    acciones.className = "acciones";

    const botonAcciones = document.createElement("button");
    botonAcciones.type = "button";
    botonAcciones.className = "action-button";
    botonAcciones.textContent = "⋮";
    botonAcciones.setAttribute("aria-label", `Acciones para ${nombre}`);

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

    menu.append(crearBotonMenu("Ver/editar perfil", "●", "data-admin-profile", usuario));
    if (esSocio && !verBajas) menu.append(crearBotonMenu("Asignar clases", "▣", "data-open-class-assign", usuario));

    const darDeBaja = document.createElement("button");
    darDeBaja.type = "button";
    darDeBaja.className = "delete";
    const icono = document.createElement("span");
    icono.textContent = "⊗";
    darDeBaja.append(icono, " Dar de baja");
    darDeBaja.addEventListener("click", async () => {
        if (!window.confirm(`¿Dar de baja a ${nombre}? No va a poder iniciar sesión.`)) return;
        const data = await API.request(`/usuarios/${usuario.id_client}`, "DELETE");
        if (!data?.success) {
            window.alert(data?.message || "No se pudo dar de baja al usuario.");
            return;
        }
        cargarUsuarios();
    });
    if (!verBajas) menu.append(darDeBaja);

    acciones.append(botonAcciones, menu);
    fila.append(acciones);

    return fila;
};

// Barra de búsqueda y cantidad de registros: se filtra en el cliente sobre
// las filas ya cargadas, como hace el listado de productos.
const aplicarFiltros = () => {
    const query = (searchInput?.value || "").trim().toLocaleLowerCase();
    const limit = Number(pageSizeSelect?.value || 25);
    let visibles = 0;

    tbody.querySelectorAll("[data-user-row]").forEach((row) => {
        const coincide = row.textContent.toLocaleLowerCase().includes(query);
        const mostrar = coincide && visibles < limit;
        row.hidden = !mostrar;
        if (mostrar) visibles += 1;
    });
};

const actualizarConteo = (total) => {
    if (countEl) countEl.textContent = String(total);
};

const cargarUsuarios = async () => {
    const bajas = verBajas;
    if (verBajasBtn) verBajasBtn.textContent = bajas ? "Volver a usuarios activos" : "Ver usuarios dados de baja";
    if (titleEl) {
        const sufijo = bajas ? "dados de baja" : "activos";
        titleEl.textContent = currentRole === "all"
            ? (bajas ? "Usuarios dados de baja" : "Usuarios activos")
            : `${ROLE_PLURAL[currentRole] || currentRole} ${sufijo}`;
    }

    const params = new URLSearchParams({ role: currentRole });
    if (bajas) params.set("bajas", "1");
    const data = await API.request(`/admin/usuarios?${params.toString()}`);

    if (!data || !data.success) {
        mostrarMensaje((data && data.message) || "No se pudieron cargar los usuarios.");
        actualizarConteo("—");
        return;
    }

    allUsers = Array.isArray(data.usuarios) ? data.usuarios : [];
    actualizarConteo(data.total ?? allUsers.length);

    if (!allUsers.length) {
        mostrarMensaje(bajas ? "No hay usuarios dados de baja." : "No hay usuarios registrados.");
        return;
    }

    tbody.replaceChildren();
    allUsers.forEach((usuario) => tbody.append(crearFila(usuario)));
    aplicarFiltros();
};

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentRole = button.dataset.roleFilter || "all";
        filterButtons.forEach((element) => element.classList.toggle("is-active", element === button));
        cargarUsuarios();
    });
});

searchInput?.addEventListener("input", aplicarFiltros);
pageSizeSelect?.addEventListener("change", aplicarFiltros);

verBajasBtn?.addEventListener("click", () => {
    verBajas = !verBajas;
    cargarUsuarios();
});
cargarUsuarios();
})();

// Registro
(() => {
const registrarSocioForm = document.getElementById("registrarSocioForm");
if (!registrarSocioForm) return;

// Debe coincidir con los id_role insertados en Role (api/config/init.sql).
const ROLE_IDS = {
    admin: 1,
    entrenador: 2,
    profesor: 3,
    socio: 4
};

// La membresía (plan) solo aplica a los socios: para entrenadores y profesores
// el campo se oculta y no se exige.
const campoPlan = document.getElementById("campoPlan");
const planSelect = registrarSocioForm.plan;

// Los planes salen de la base (tabla Membership).
API.request("/membresias").then((data) => {
    if (!data?.success) return;
    planSelect.querySelectorAll("option:not([value=''])").forEach(option => option.remove());
    data.membresias.forEach((plan) => {
        const option = document.createElement("option");
        option.value = String(plan.id_membership);
        option.textContent = AdminUtil.texto(plan.name_membership);
        planSelect.append(option);
    });
});

const actualizarCampoPlan = () => {
    const esSocio = registrarSocioForm.tipo.value === "socio";
    campoPlan.hidden = !esSocio;
    if (!esSocio) {
        planSelect.value = "";
    }
};

registrarSocioForm.tipo.addEventListener("change", actualizarCampoPlan);
// 'reset' se dispara antes de que el formulario vuelva a sus valores iniciales.
registrarSocioForm.addEventListener("reset", () => setTimeout(actualizarCampoPlan, 0));

const mostrarAlerta = (texto, tipo) => {
    const alertContainer = document.getElementById("alertContainer");
    const alerta = document.createElement("div");
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = texto;
    alertContainer.replaceChildren(alerta);
};

registrarSocioForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const tipoSeleccionado = this.tipo.value;
    if (!tipoSeleccionado) {
        mostrarAlerta("Seleccioná un tipo de usuario.", "danger");
        return;
    }

    if (tipoSeleccionado === "socio" && !planSelect.value) {
        mostrarAlerta("Seleccioná el plan de membresía del socio.", "danger");
        return;
    }

    const datos = {
        name: this.nombre.value,
        ci: this.ci.value,
        phone: this.telefono.value,
        email: this.email.value,
        birth: this.fecha.value,
        password: this.contrasena.value,
        // El formulario pide una sola contraseña; se reutiliza
        // el mismo valor para cumplir la confirmación que exige la API.
        confirm_password: this.contrasena.value,
        role: ROLE_IDS[tipoSeleccionado],
        membership: tipoSeleccionado === "socio" ? Number(planSelect.value) : null
    };

    API.request("/register", "POST", datos).then((data) => {
        if (data.success) {
            mostrarAlerta(data.message, "success");
            registrarSocioForm.reset();
        } else {
            mostrarAlerta(data.message || "No se pudo registrar.", "danger");
        }
    });
});

const btnCancelar = registrarSocioForm.querySelector(".btn-cancelar");
if (btnCancelar) {
    btnCancelar.addEventListener("click", () => registrarSocioForm.reset());
}
})();
