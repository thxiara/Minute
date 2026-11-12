// Sección: Navegación.
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

// Sección: Utilidades de clases y fechas (todo viene de /api/profesor/...).
const ProfesorUtil = (() => {
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    let classesPromise = null;

    function formatDays(days) {
        return days.map(day => dayNames[day]).join(", ");
    }

    function formatDate(date) {
        return new Intl.DateTimeFormat(window.I18n?.locale || "es-UY", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }

    // "AAAA-MM-DD" en hora local (no UTC).
    function dateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    function today() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }

    // Último encuentro (hoy o antes) y los `count` siguientes, según los días de la clase.
    function occurrences(session, from, count = 5) {
        const dates = [];
        if (!session.days.length) return dates;
        for (let offset = 0; offset <= 7; offset += 1) {
            const date = new Date(from);
            date.setDate(from.getDate() - offset);
            if (session.days.includes(date.getDay())) {
                dates.push(date);
                break;
            }
        }
        const cursor = new Date(from);
        cursor.setDate(cursor.getDate() + 1);
        while (dates.length < count + 1) {
            if (session.days.includes(cursor.getDay())) dates.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
        return dates.sort((a, b) => a - b);
    }

    // Encuentro guardado en la base para esa clase y fecha (o undefined).
    function lessonFor(session, key) {
        return session.lessons.find(lesson => lesson.date_lesson === key);
    }

    // Las clases del profesor se piden una sola vez por página.
    function loadClasses(force = false) {
        if (!classesPromise || force) {
            classesPromise = API.request("/profesor/clases").then((data) => {
                if (!data?.success) throw new Error(data?.message || "No se pudieron cargar tus clases.");
                return data.clases;
            });
        }
        return classesPromise;
    }

    function setFeedback(element, text, isError = false) {
        if (!element) return;
        element.textContent = text;
        element.classList.toggle("is-error", isError);
    }

    return { formatDays, formatDate, dateKey, today, occurrences, lessonFor, loadClasses, setFeedback };
})();

// Sección: Listado de alumnos (/dash/profesor).
(() => {
const tbody = document.getElementById("teacherStudentsBody");
if (!tbody) return;

const searchInput = document.getElementById("teacherStudentsSearch");
const pageSize = document.getElementById("teacherStudentsPageSize");

function message(text) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "text-center";
    cell.textContent = text;
    row.append(cell);
    tbody.replaceChildren(row);
}

function menuButton(text, icon, student, hash = "") {
    const button = document.createElement("button");
    button.type = "button";
    const span = document.createElement("span");
    span.className = icon === "◆" ? "icono-evaluacion" : "icono-ver";
    span.textContent = icon;
    button.append(span, ` ${text}`);
    button.addEventListener("click", () => {
        window.location.href = `/dash/profesor/perfil?id=${student.id_client}${hash}`;
    });
    return button;
}

function createRow(student) {
    const row = document.createElement("tr");
    row.dataset.studentRow = "";

    const attendance = student.lessons_month
        ? `Asistencia ${student.attended_month}/${student.lessons_month}`
        : "Sin clases este mes";
    [
        student.name_client,
        student.phone || "—",
        student.score === null ? "—" : `${student.score}/10`
    ].forEach((value, index) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        if (index === 2) cell.title = attendance;
        row.append(cell);
    });

    const noteCell = document.createElement("td");
    noteCell.className = "nota";
    const noteText = document.createElement("span");
    noteText.className = "nota-texto";
    noteText.textContent = student.note || "Sin nota";
    noteCell.append(noteText);
    if (student.note && student.note.length > 40) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "leer-mas";
        more.textContent = "leer más";
        more.addEventListener("click", () => window.alert(student.note));
        noteCell.append(more);
    }

    const actions = document.createElement("td");
    actions.className = "acciones";
    const actionButton = document.createElement("button");
    actionButton.type = "button";
    actionButton.className = "action-button";
    actionButton.setAttribute("aria-label", `Acciones para ${student.name_client}`);
    actionButton.textContent = "⋮";
    const menu = document.createElement("div");
    menu.className = "action-menu";
    actionButton.addEventListener("click", (event) => {
        event.stopPropagation();
        document.querySelectorAll(".action-menu").forEach((element) => {
            if (element !== menu) element.classList.remove("mostrar");
        });
        menu.classList.toggle("mostrar");
    });
    menu.append(
        menuButton("Ver perfil", "●", student),
        menuButton("Dar evaluación", "◆", student, "#evaluacion")
    );
    actions.append(actionButton, menu);

    row.append(noteCell, actions);
    return row;
}

function filterRows() {
    const query = (searchInput?.value || "").trim().toLocaleLowerCase("es");
    const limit = Number(pageSize?.value || 25);
    let visible = 0;
    tbody.querySelectorAll("[data-student-row]").forEach((row) => {
        const show = row.textContent.toLocaleLowerCase("es").includes(query) && visible < limit;
        row.hidden = !show;
        if (show) visible += 1;
    });
}

searchInput?.addEventListener("input", filterRows);
pageSize?.addEventListener("change", filterRows);

API.request("/profesor/alumnos").then((data) => {
    if (!data?.success) {
        message(data?.message || "No se pudieron cargar tus alumnos.");
        return;
    }
    if (!data.alumnos.length) {
        message("Todavía no tenés alumnos en tus clases.");
        return;
    }
    tbody.replaceChildren(...data.alumnos.map(createRow));
    filterRows();
});
})();

// Sección: Perfil y evaluación de un alumno (/dash/profesor/perfil?id=...).
(() => {
const nameElement = document.getElementById("studentName");
if (!nameElement) return;

const studentId = new URLSearchParams(window.location.search).get("id");
const evaluationForm = document.getElementById("evaluationForm");
const evaluationInput = document.getElementById("studentEvaluation");
const noteInput = document.getElementById("studentNote");
const feedback = document.getElementById("evaluationFeedback");

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value || "—";
}

function formatIsoDate(value) {
    if (!value) return "";
    const [year, month, day] = String(value).slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
}

if (!studentId) {
    nameElement.textContent = "Alumno no indicado";
    return;
}

API.request(`/profesor/alumnos/${encodeURIComponent(studentId)}`).then((data) => {
    if (!data?.success) {
        nameElement.textContent = data?.message || "No se pudo cargar el alumno.";
        if (evaluationForm) evaluationForm.hidden = true;
        return;
    }

    const student = data.alumno;
    nameElement.textContent = student.name_client;
    setText("studentSince", student.created_client ? `Socio desde el ${formatIsoDate(student.created_client)}` : "");
    setText("studentDocument", student.ci);
    setText("studentPhone", student.phone);
    setText("studentEmail", student.email);
    setText("studentMembership", student.membership_name
        ? `${student.membership_name} (vence ${formatIsoDate(student.expiry_date)})`
        : "");
    setText("studentAttendance", student.lessons_month
        ? `${student.attended_month} de ${student.lessons_month} encuentros este mes`
        : "Sin encuentros este mes");

    const photo = document.querySelector(".student-profile img");
    if (photo && student.has_photo) photo.src = `/api/usuarios/${student.id_client}/foto`;

    if (evaluationInput && student.score !== null) evaluationInput.value = String(student.score);
    if (noteInput) noteInput.value = student.note || "";

    // Clases del profesor en las que está el alumno, y su próximo encuentro.
    const list = document.getElementById("studentAssignedClasses");
    const today = ProfesorUtil.today();
    let next = null;
    list?.replaceChildren();
    data.clases.forEach((session) => {
        const item = document.createElement("li");
        const name = document.createElement("strong");
        name.textContent = session.name_course;
        const time = document.createElement("span");
        time.textContent = `${ProfesorUtil.formatDays(session.days)} · ${session.time}`;
        item.append(name, time);
        list?.append(item);

        ProfesorUtil.occurrences(session, today, 1)
            .filter(date => date > today)
            .forEach((date) => {
                if (!next || date < next.date) next = { date, session };
            });
    });
    if (list && !data.clases.length) {
        const empty = document.createElement("li");
        empty.textContent = "No tiene clases asignadas";
        list.append(empty);
    }
    setText("studentNextEvaluation", next
        ? `${ProfesorUtil.formatDate(next.date)} · ${next.session.name_course}`
        : "");

    if (window.location.hash === "#evaluacion") evaluationInput?.focus();
});

evaluationForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!evaluationForm.reportValidity()) return;

    const data = await API.request(`/profesor/alumnos/${encodeURIComponent(studentId)}/evaluacion`, "PUT", {
        score: evaluationInput.value === "" ? null : Number(evaluationInput.value),
        note: noteInput ? noteInput.value.trim() : ""
    });
    ProfesorUtil.setFeedback(feedback, data?.success ? "Evaluación guardada." : (data?.message || "No se pudo guardar."), !data?.success);
});
})();

// Sección: Selección de clases asignadas (/dash/profesor/seleccionar-clase).
(() => {
const classChoices = document.getElementById("assignedClassChoices");
if (!classChoices) return;
const emptyClasses = document.getElementById("noAssignedClasses");

ProfesorUtil.loadClasses().then((classes) => {
    classes.forEach((session) => {
        const link = document.createElement("a");
        link.className = "interface-panel class-choice-card";
        link.href = `/dash/profesor/clase?clase=${session.id_course}`;

        const kind = document.createElement("span");
        kind.className = "interface-eyebrow";
        kind.textContent = "Clase asignada";

        const name = document.createElement("h2");
        name.textContent = session.name_course;

        const schedule = document.createElement("span");
        schedule.className = "schedule-meta";
        const students = session.students.length === 1 ? "1 alumno" : `${session.students.length} alumnos`;
        schedule.textContent = `${ProfesorUtil.formatDays(session.days)} · ${session.time} · ${students}`;
        link.append(kind, name, schedule);
        classChoices.append(link);
    });
    emptyClasses.hidden = classes.length > 0;
}).catch((error) => {
    emptyClasses.textContent = error.message;
    emptyClasses.hidden = false;
});
})();

// Sección: Agenda, recordatorios y cancelaciones (/dash/profesor/clases).
(() => {
const scheduleList = document.getElementById("teacherSchedule");
if (!scheduleList) return;
const emptySchedule = document.getElementById("noScheduledClasses");

function makeSessionCard(session, date, today) {
    const key = ProfesorUtil.dateKey(date);
    const lesson = ProfesorUtil.lessonFor(session, key);
    const card = document.createElement("article");
    card.className = "schedule-card session-card";

    const details = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = session.name_course;
    const dateLabel = document.createElement("p");
    dateLabel.textContent = `${ProfesorUtil.formatDate(date)} · ${session.time}`;
    details.append(title, dateLabel);
    card.append(details);

    if (lesson?.state_lesson === "cancelled") {
        const cancelled = document.createElement("span");
        cancelled.className = "session-status session-status-cancelled";
        cancelled.textContent = "Cancelada";
        card.append(cancelled);
        return card;
    }

    if (date <= today) {
        const attendanceLink = document.createElement("a");
        attendanceLink.className = "interface-button";
        attendanceLink.href = `/dash/profesor/clase?clase=${session.id_course}&fecha=${key}`;
        attendanceLink.textContent = lesson?.state_lesson === "given" ? "Ver asistencia" : "Tomar asistencia";
        card.append(attendanceLink);
        return card;
    }

    const controls = document.createElement("div");
    controls.className = "future-session-controls";
    const noteForm = document.createElement("form");
    noteForm.className = "future-note-form";
    noteForm.dataset.classId = String(session.id_course);
    noteForm.dataset.date = key;
    const note = document.createElement("input");
    note.className = "form-control";
    note.name = "note";
    note.maxLength = 240;
    note.required = true;
    note.placeholder = "Nota o recordatorio para los alumnos";
    note.setAttribute("aria-label", `Nota para ${session.name_course}, ${key}`);
    note.value = lesson?.desc_lesson || "";
    const saveNote = document.createElement("button");
    saveNote.className = "interface-button-secondary";
    saveNote.type = "submit";
    saveNote.textContent = "Guardar nota";
    noteForm.append(note, saveNote);

    const cancelButton = document.createElement("button");
    cancelButton.className = "interface-button-danger";
    cancelButton.type = "button";
    cancelButton.dataset.cancelClass = String(session.id_course);
    cancelButton.dataset.cancelDate = key;
    cancelButton.textContent = "Cancelar clase";

    const status = document.createElement("p");
    status.className = "interface-feedback mb-0";
    status.setAttribute("role", "status");
    status.textContent = lesson?.desc_lesson ? "Nota visible para los alumnos." : "";
    controls.append(noteForm, cancelButton, status);
    card.append(controls);
    return card;
}

async function renderSchedule(force = false) {
    let classes;
    try {
        classes = await ProfesorUtil.loadClasses(force);
    } catch (error) {
        emptySchedule.textContent = error.message;
        emptySchedule.hidden = false;
        return;
    }

    const today = ProfesorUtil.today();
    const occurrences = classes
        .flatMap(session => ProfesorUtil.occurrences(session, today).map(date => ({ session, date })))
        .sort((a, b) => a.date - b.date || a.session.time.localeCompare(b.session.time));
    const lastSession = occurrences.filter(occurrence => occurrence.date <= today).slice(-1);
    const upcomingSessions = occurrences.filter(occurrence => occurrence.date > today).slice(0, 5);

    scheduleList.replaceChildren(
        ...[...lastSession, ...upcomingSessions].map(({ session, date }) => makeSessionCard(session, date, today))
    );
    emptySchedule.hidden = classes.length > 0;
}

scheduleList.addEventListener("submit", async (event) => {
    const form = event.target.closest(".future-note-form");
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;

    const note = String(new FormData(form).get("note")).trim();
    const status = form.parentElement.querySelector('[role="status"]');
    const data = await API.request(`/profesor/clases/${form.dataset.classId}/encuentros/${form.dataset.date}`, "PUT", { note });
    if (!data?.success) {
        ProfesorUtil.setFeedback(status, data?.message || "No se pudo guardar la nota.", true);
        return;
    }
    renderSchedule(true);
});

scheduleList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-cancel-class]");
    if (!button) return;
    if (!window.confirm("¿Cancelar esta clase? Los alumnos lo van a ver en su panel.")) return;

    const data = await API.request(`/profesor/clases/${button.dataset.cancelClass}/encuentros/${button.dataset.cancelDate}/cancelar`, "POST");
    if (!data?.success) {
        const status = button.parentElement.querySelector('[role="status"]');
        ProfesorUtil.setFeedback(status, data?.message || "No se pudo cancelar la clase.", true);
        return;
    }
    renderSchedule(true);
});

renderSchedule();
})();

// Sección: Fechas de una clase y asistencia (/dash/profesor/clase?clase=...&fecha=...).
(() => {
const classTitle = document.getElementById("classTitle");
if (!classTitle) return;

const params = new URLSearchParams(window.location.search);
const classId = Number(params.get("clase"));
const classSchedule = document.getElementById("classSchedule");
const classDates = document.getElementById("classDates");
const attendancePanel = document.getElementById("attendancePanel");
const attendanceStudents = document.getElementById("attendanceStudents");
const attendanceForm = document.getElementById("attendanceForm");
const attendanceFeedback = document.getElementById("attendanceFeedback");
const errorMessage = document.getElementById("classError");

function showError(text) {
    errorMessage.textContent = text;
    errorMessage.hidden = false;
}

function createDateCard(session, date, today) {
    const key = ProfesorUtil.dateKey(date);
    const lesson = ProfesorUtil.lessonFor(session, key);
    const card = document.createElement("article");
    card.className = "schedule-card session-card";

    const details = document.createElement("div");
    const dateTitle = document.createElement("h2");
    dateTitle.textContent = ProfesorUtil.formatDate(date);
    const timeLabel = document.createElement("p");
    timeLabel.textContent = session.time;
    details.append(dateTitle, timeLabel);
    card.append(details);

    if (lesson?.state_lesson === "cancelled") {
        const status = document.createElement("span");
        status.className = "session-status session-status-cancelled";
        status.textContent = "Cancelada";
        card.append(status);
    } else if (date <= today) {
        const attendanceLink = document.createElement("a");
        attendanceLink.className = "interface-button";
        attendanceLink.href = `/dash/profesor/clase?clase=${session.id_course}&fecha=${key}`;
        attendanceLink.textContent = lesson?.state_lesson === "given" ? "Ver asistencia" : "Tomar asistencia";
        card.append(attendanceLink);
    } else {
        const noteText = document.createElement("p");
        noteText.className = "session-note";
        noteText.textContent = lesson?.desc_lesson ? `Nota para alumnos: ${lesson.desc_lesson}` : "Sin notas para esta fecha.";
        card.append(noteText);
    }
    return card;
}

async function showAttendance(session, key, date) {
    const data = await API.request(`/profesor/clases/${session.id_course}/encuentros/${key}/asistencia`);
    if (!data?.success) {
        showError(data?.message || "No se pudo cargar la asistencia.");
        return;
    }

    document.getElementById("attendanceDateLabel").textContent = ProfesorUtil.formatDate(date);
    attendanceStudents.replaceChildren();
    data.alumnos.forEach((student) => {
        const label = document.createElement("label");
        label.className = "attendance-option";

        const name = document.createElement("span");
        name.textContent = student.name_client;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "attendees";
        checkbox.value = String(student.id_client);
        checkbox.checked = student.assistance;

        const status = document.createElement("span");
        status.className = "attendance-status";
        status.textContent = checkbox.checked ? "Presente" : "Ausente";
        checkbox.addEventListener("change", () => {
            status.textContent = checkbox.checked ? "Presente" : "Ausente";
        });
        label.append(name, checkbox, status);
        attendanceStudents.append(label);
    });

    if (!data.alumnos.length) {
        const empty = document.createElement("p");
        empty.className = "interface-empty";
        empty.textContent = "El administrador todavía no asignó alumnos a esta clase.";
        attendanceStudents.append(empty);
    }
    attendancePanel.hidden = false;

    attendanceForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const presentes = new FormData(attendanceForm).getAll("attendees").map(Number);
        const submit = attendanceForm.querySelector('[type="submit"]');
        submit.disabled = true;
        const result = await API.request(`/profesor/clases/${session.id_course}/encuentros/${key}/asistencia`, "PUT", { presentes });
        submit.disabled = false;
        ProfesorUtil.setFeedback(attendanceFeedback, result?.success ? "Asistencia guardada." : (result?.message || "No se pudo guardar la asistencia."), !result?.success);
    });
}

ProfesorUtil.loadClasses().then((classes) => {
    const session = classes.find(item => item.id_course === classId);
    if (!session) {
        classTitle.textContent = "Clase no disponible";
        classSchedule.textContent = "Solo puedes gestionar tus clases asignadas.";
        errorMessage.hidden = false;
        const selectLink = document.createElement("a");
        selectLink.className = "interface-button";
        selectLink.href = "/dash/profesor/seleccionar-clase";
        selectLink.textContent = "Ver mis clases";
        classDates.append(selectLink);
        return;
    }

    document.title = `${session.name_course} | FitPower`;
    classTitle.textContent = session.name_course;
    const students = session.students.length === 1 ? "1 alumno" : `${session.students.length} alumnos`;
    classSchedule.textContent = `${ProfesorUtil.formatDays(session.days)} · ${session.time} · ${students}`;

    const today = ProfesorUtil.today();
    ProfesorUtil.occurrences(session, today).forEach(date => classDates.append(createDateCard(session, date, today)));

    const selectedKey = params.get("fecha");
    if (!selectedKey) return;
    const selectedDate = new Date(`${selectedKey}T00:00:00`);
    const lesson = ProfesorUtil.lessonFor(session, selectedKey);
    if (Number.isNaN(selectedDate.getTime())
        || !session.days.includes(selectedDate.getDay())
        || selectedDate > today) {
        showError("La asistencia solo se puede gestionar para una fecha de clase actual o pasada.");
    } else if (lesson?.state_lesson === "cancelled") {
        showError("Esta sesión fue cancelada.");
    } else {
        showAttendance(session, selectedKey, selectedDate);
    }
}).catch((error) => {
    classTitle.textContent = "Clase no disponible";
    showError(error.message);
});
})();
