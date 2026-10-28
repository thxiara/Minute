// Sección: Navegación y perfiles de alumnos.
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

document.querySelectorAll("[data-profesor-profile]").forEach(button => {
    button.addEventListener("click", () => {
        const studentName = button.dataset.studentName || "Pepe";
        window.location.href = `paginas/roles/profesor/perfi.html?name=${encodeURIComponent(studentName)}`;
    });
});
})();

// Sección: Almacenamiento y utilidades de clases.
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

// Sección: Perfil, clases asignadas y evaluación numérica.
(() => {
const studentName = new URLSearchParams(window.location.search).get("name") || "Pepe";
const normalizedName = studentName.toLocaleLowerCase("es");
const nameElement = document.getElementById("studentName");
if (nameElement) nameElement.textContent = studentName;

const sampleProfiles = {
    pepe: { document: "1.123.456-7", phone: "123 456 789", email: "pepe@fitpower.uy" },
    papa: { document: "987.654-3", phone: "987 654 321", email: "papa@fitpower.uy" },
    miau: { document: "1.234.567-8", phone: "789 456 123", email: "miau@fitpower.uy" },
    parapapapa: { document: "1.123.456-7", phone: "012 345 678", email: "parapapapa@fitpower.uy" }
};
const sampleProfile = Object.hasOwn(sampleProfiles, normalizedName) ? sampleProfiles[normalizedName] : null;
if (sampleProfile) {
    Object.entries(sampleProfile).forEach(([field, value]) => {
        const element = document.getElementById(`student${field[0].toUpperCase()}${field.slice(1)}`);
        if (element) element.textContent = value;
    });
}

const classState = window.FitPowerClassData.load();
const assignedClasses = document.getElementById("studentAssignedClasses");
if (assignedClasses) {
    const memberClasses = classState.classes.filter(session => session.studentNames.includes(normalizedName));
    memberClasses.forEach((session) => {
        const item = document.createElement("li");
        const name = document.createElement("strong");
        name.textContent = session.name;
        const time = document.createElement("span");
        time.textContent = `${window.FitPowerClassData.formatDays(session.days)} · ${session.time}`;
        item.append(name, time);
        assignedClasses.append(item);
    });
    if (!memberClasses.length) {
        const empty = document.createElement("li");
        empty.textContent = "No tiene clases asignadas";
        assignedClasses.append(empty);
    }
}

const evaluationInput = document.getElementById("studentEvaluation");
const evaluationForm = document.getElementById("evaluationForm");
if (evaluationInput && evaluationForm) {
    const evaluationKey = normalizedName;
    if (Number.isInteger(classState.evaluations[evaluationKey])) {
        evaluationInput.value = String(classState.evaluations[evaluationKey]);
    }
    evaluationForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!evaluationForm.reportValidity()) return;

        classState.evaluations[evaluationKey] = Number(evaluationInput.value);
        const feedback = document.getElementById("evaluationFeedback");
        try {
            window.FitPowerClassData.save(classState);
            feedback.classList.remove("is-error");
            feedback.textContent = "Evaluación numérica guardada.";
        } catch {
            feedback.classList.add("is-error");
            feedback.textContent = "No se pudo guardar.";
        }
    });
}
})();
// Sección: Selección de clases asignadas.
(() => {
if (document.getElementById("assignedClassChoices")) {
const classState = window.FitPowerClassData.load();
const currentTeacherId = document.body.dataset.teacherId;
const classChoices = document.getElementById("assignedClassChoices");
const emptyClasses = document.getElementById("noAssignedClasses");

classState.classes
    .filter(session => session.teacherId === currentTeacherId)
    .forEach((session) => {
        const link = document.createElement("a");
        link.className = "interface-panel class-choice-card";
        link.href = `paginas/roles/profesor/clase.html?clase=${encodeURIComponent(session.id)}`;

        const kind = document.createElement("span");
        kind.className = "interface-eyebrow";
        kind.textContent = "Clase asignada";

        const name = document.createElement("h2");
        name.textContent = session.name;

        const schedule = document.createElement("span");
        schedule.className = "schedule-meta";
        schedule.textContent = `${window.FitPowerClassData.formatDays(session.days)} · ${session.time}`;
        link.append(kind, name, schedule);
        classChoices.append(link);
    });

emptyClasses.hidden = classChoices.childElementCount > 0;

}
})();

// Sección: Agenda, recordatorios y cancelaciones.
(() => {
if (document.getElementById("teacherSchedule")) {
const classState = window.FitPowerClassData.load();
const currentTeacherId = document.body.dataset.teacherId;
const scheduleList = document.getElementById("teacherSchedule");
const emptySchedule = document.getElementById("noScheduledClasses");

function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateOccurrences(session, today, count = 5) {
    const occurrences = [];
    for (let offset = 0; offset <= 7; offset += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        if (session.days.includes(date.getDay())) {
            occurrences.push(date);
            break;
        }
    }

    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() + 1);
    while (occurrences.length < count + 1) {
        if (session.days.includes(cursor.getDay())) occurrences.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return occurrences;
}

function makeSessionCard(session, date, today) {
    const dateKey = localDateKey(date);
    const key = `${session.id}:${dateKey}`;
    const card = document.createElement("article");
    card.className = "schedule-card session-card";

    const details = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = session.name;
    const dateLabel = document.createElement("p");
    dateLabel.textContent = `${window.FitPowerClassData.formatDate(date)} · ${session.time}`;
    details.append(title, dateLabel);
    card.append(details);

    if (classState.cancellations.includes(key)) {
        const cancelled = document.createElement("span");
        cancelled.className = "session-status session-status-cancelled";
        cancelled.textContent = "Cancelada";
        card.append(cancelled);
        return card;
    }

    if (date <= today) {
        const attendanceLink = document.createElement("a");
        attendanceLink.className = "interface-button";
        attendanceLink.href = `paginas/roles/profesor/clase.html?clase=${encodeURIComponent(session.id)}&fecha=${dateKey}`;
        attendanceLink.textContent = "Tomar asistencia";
        card.append(attendanceLink);
        return card;
    }

    const controls = document.createElement("div");
    controls.className = "future-session-controls";
    const noteForm = document.createElement("form");
    noteForm.className = "future-note-form";
    noteForm.dataset.sessionKey = key;
    const note = document.createElement("input");
    note.className = "form-control";
    note.name = "note";
    note.maxLength = 240;
    note.required = true;
    note.placeholder = "Nota o recordatorio para los alumnos";
    note.setAttribute("aria-label", `Nota para ${session.name}, ${dateKey}`);
    note.value = classState.notes[key] || "";
    const saveNote = document.createElement("button");
    saveNote.className = "interface-button-secondary";
    saveNote.type = "submit";
    saveNote.textContent = "Guardar nota";
    noteForm.append(note, saveNote);

    const cancelButton = document.createElement("button");
    cancelButton.className = "interface-button-danger";
    cancelButton.type = "button";
    cancelButton.dataset.cancelSession = key;
    cancelButton.textContent = "Cancelar clase";

    const status = document.createElement("p");
    status.className = "interface-feedback mb-0";
    status.setAttribute("role", "status");
    status.textContent = classState.notes[key] ? "Nota visible para los alumnos." : "";
    controls.append(noteForm, cancelButton, status);
    card.append(controls);
    return card;
}

function renderSchedule() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduleList.replaceChildren();

    const assigned = classState.classes.filter(session => session.teacherId === currentTeacherId);
    const occurrences = assigned
        .flatMap(session => dateOccurrences(session, today).map(date => ({ session, date })))
        .sort((a, b) => a.date - b.date || a.session.time.localeCompare(b.session.time));
    const lastSession = occurrences
        .filter(occurrence => occurrence.date <= today)
        .slice(-1);
    const upcomingSessions = occurrences
        .filter(occurrence => occurrence.date > today)
        .slice(0, 5);
    const sessions = [...lastSession, ...upcomingSessions];
    sessions.forEach(({ session, date }) => scheduleList.append(makeSessionCard(session, date, today)));
    emptySchedule.hidden = assigned.length > 0;
}

scheduleList.addEventListener("submit", (event) => {
    const form = event.target.closest(".future-note-form");
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;

    const note = String(new FormData(form).get("note")).trim();
    if (!note) return;
    classState.notes[form.dataset.sessionKey] = note;
    try {
        window.FitPowerClassData.save(classState);
        renderSchedule();
    } catch {
        const status = form.parentElement.querySelector('[role="status"]');
        status.classList.add("is-error");
        status.textContent = "No se pudo guardar la nota.";
    }
});

scheduleList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cancel-session]");
    if (!button) return;
    const key = button.dataset.cancelSession;
    if (!classState.cancellations.includes(key)) classState.cancellations.push(key);
    try {
        window.FitPowerClassData.save(classState);
        renderSchedule();
    } catch {
        const status = button.parentElement.querySelector('[role="status"]');
        status.classList.add("is-error");
        status.textContent = "No se pudo cancelar la clase.";
    }
});

renderSchedule();

}
})();

// Sección: Asistencia para una fecha de clase.
(() => {
if (document.getElementById("classTitle")) {
const classState = window.FitPowerClassData.load();
const currentTeacherId = document.body.dataset.teacherId;
const params = new URLSearchParams(window.location.search);
const classId = params.get("clase");
const selectedClass = classState.classes.find(session => session.id === classId && session.teacherId === currentTeacherId);
const classTitle = document.getElementById("classTitle");
const classSchedule = document.getElementById("classSchedule");
const classDates = document.getElementById("classDates");
const attendancePanel = document.getElementById("attendancePanel");
const attendanceStudents = document.getElementById("attendanceStudents");
const errorMessage = document.getElementById("classError");

function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateOccurrences(session, today, count = 5) {
    const dates = [];
    for (let offset = 0; offset <= 7; offset += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        if (session.days.includes(date.getDay())) {
            dates.push(date);
            break;
        }
    }

    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() + 1);
    while (dates.length < count + 1) {
        if (session.days.includes(cursor.getDay())) dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return dates.sort((a, b) => a - b);
}

function addAttendancePanel(date) {
    const dateKey = localDateKey(date);
    const attendanceKey = `${selectedClass.id}:${dateKey}`;
    if (classState.cancellations.includes(attendanceKey)) {
        errorMessage.textContent = "Esta sesión fue cancelada.";
        errorMessage.hidden = false;
        return;
    }

    document.getElementById("attendanceDateLabel").textContent = window.FitPowerClassData.formatDate(date);
    const savedAttendance = classState.attendance[attendanceKey] || {};
    selectedClass.studentNames.forEach((studentName) => {
        const label = document.createElement("label");
        label.className = "attendance-option";

        const name = document.createElement("span");
        name.textContent = studentName;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "attendees";
        checkbox.value = studentName;
        checkbox.checked = Boolean(savedAttendance[studentName]);

        const status = document.createElement("span");
        status.className = "attendance-status";
        status.textContent = checkbox.checked ? "Presente" : "Ausente";
        checkbox.addEventListener("change", () => {
            status.textContent = checkbox.checked ? "Presente" : "Ausente";
        });
        label.append(name, checkbox, status);
        attendanceStudents.append(label);
    });

    if (!selectedClass.studentNames.length) {
        const empty = document.createElement("p");
        empty.className = "interface-empty";
        empty.textContent = "El administrador todavía no asignó alumnos a esta clase.";
        attendanceStudents.append(empty);
    }

    attendancePanel.hidden = false;
    document.getElementById("attendanceForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const attendees = new Set(new FormData(event.currentTarget).getAll("attendees").map(String));
        classState.attendance[attendanceKey] = Object.fromEntries(
            selectedClass.studentNames.map(name => [name, attendees.has(name)])
        );
        const feedback = document.getElementById("attendanceFeedback");
        try {
            window.FitPowerClassData.save(classState);
            feedback.classList.remove("is-error");
            feedback.textContent = "Asistencia guardada.";
        } catch {
            feedback.classList.add("is-error");
            feedback.textContent = "No se pudo guardar la asistencia.";
        }
    }, { once: true });
}

function createDateCard(date, today) {
    const dateKey = localDateKey(date);
    const key = `${selectedClass.id}:${dateKey}`;
    const card = document.createElement("article");
    card.className = "schedule-card session-card";

    const details = document.createElement("div");
    const dateTitle = document.createElement("h2");
    dateTitle.textContent = window.FitPowerClassData.formatDate(date);
    const timeLabel = document.createElement("p");
    timeLabel.textContent = selectedClass.time;
    details.append(dateTitle, timeLabel);
    card.append(details);

    if (classState.cancellations.includes(key)) {
        const status = document.createElement("span");
        status.className = "session-status session-status-cancelled";
        status.textContent = "Cancelada";
        card.append(status);
    } else if (date <= today) {
        const attendanceLink = document.createElement("a");
        attendanceLink.className = "interface-button";
        attendanceLink.href = `paginas/roles/profesor/clase.html?clase=${encodeURIComponent(selectedClass.id)}&fecha=${dateKey}`;
        attendanceLink.textContent = "Tomar asistencia";
        card.append(attendanceLink);
    } else {
        const note = classState.notes[key];
        const noteText = document.createElement("p");
        noteText.className = "session-note";
        noteText.textContent = note ? `Nota para alumnos: ${note}` : "Sin notas para esta fecha.";
        card.append(noteText);
    }
    return card;
}

if (!selectedClass) {
    classTitle.textContent = "Clase no disponible";
    classSchedule.textContent = "Solo puedes gestionar tus clases asignadas :v.";
    errorMessage.hidden = false;
    const selectLink = document.createElement("a");
    selectLink.className = "interface-button";
    selectLink.href = "paginas/roles/profesor/seleccionar-clase.html";
    selectLink.textContent = "Ver mis clases";
    classDates.append(selectLink);
} else {
    document.title = `${selectedClass.name} | FitPower`;
    classTitle.textContent = selectedClass.name;
    classSchedule.textContent = `${window.FitPowerClassData.formatDays(selectedClass.days)} · ${selectedClass.time}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateOccurrences(selectedClass, today).forEach(date => classDates.append(createDateCard(date, today)));

    const selectedDateText = params.get("fecha");
    if (selectedDateText) {
        const selectedDate = new Date(`${selectedDateText}T00:00:00`);
        if (!Number.isNaN(selectedDate.getTime())
            && selectedClass.days.includes(selectedDate.getDay())
            && selectedDate <= today) {
            addAttendancePanel(selectedDate);
        } else {
            errorMessage.textContent = "La asistencia solo se puede gestionar para una fecha de clase actual o pasada.";
            errorMessage.hidden = false;
        }
    }
}

}
})();
