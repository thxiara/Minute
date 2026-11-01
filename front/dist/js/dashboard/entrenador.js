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
                expanded === "true"
                    ? "V"
                    : "&lt;";

        }, 50);

    });

});
})();

// Notas privadas del entrenador.
// Siguen guardándose en este navegador: la base de datos todavía no tiene dónde guardarlas.
(() => {
    const storageKey = "fitpowerTrainerNotes";

    function load() {
        try {
            const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
            return data && typeof data === "object" ? data : {};
        } catch {
            return {};
        }
    }

    function get(memberId) {
        return load()[memberId] || "";
    }

    function set(memberId, note) {
        const notes = load();
        if (note) notes[memberId] = note;
        else delete notes[memberId];
        localStorage.setItem(storageKey, JSON.stringify(notes));
    }

    window.FitPowerTrainerNotes = { get, set };
})();

// Socios: listado real y asignación de rutinas y notas.
(() => {
if (document.getElementById("trainerMemberForm")) {
const membersBody = document.getElementById("trainerMembersBody");
const trainerMemberModal = document.getElementById("trainerMemberModal");
const trainerMemberForm = document.getElementById("trainerMemberForm");
const routineOptions = document.getElementById("trainerRoutineOptions");
const noRoutinesMessage = document.getElementById("trainerNoRoutines");
const trainerMemberNote = document.getElementById("trainerMemberNote");
const trainerMemberFeedback = document.getElementById("trainerMemberFeedback");
const saveButton = trainerMemberForm.querySelector('[type="submit"]');
let routines = [];
let activeMemberId = null;

function showFeedback(message, isError = false) {
    trainerMemberFeedback.textContent = message;
    trainerMemberFeedback.classList.toggle("is-error", isError);
}

function formatDate(value) {
    if (!value) return "—";
    const [year, month, day] = String(value).split("-");
    return day ? `${day}/${month}/${year}` : String(value);
}

function tableMessage(text) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "text-center";
    cell.textContent = text;
    row.append(cell);
    membersBody.replaceChildren(row);
}

function createMemberRow(member) {
    const row = document.createElement("tr");
    [member.name_client, member.ci, member.phone, formatDate(member.expiry_date)].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value || "—";
        row.append(cell);
    });

    const noteCell = document.createElement("td");
    noteCell.className = "nota";
    const noteTitle = document.createElement("span");
    noteTitle.className = "nota-titulo";
    noteTitle.textContent = "Nota para el entrenador";
    const noteText = document.createElement("span");
    noteText.className = "nota-texto";
    noteText.dataset.trainerNote = String(member.id_client);
    noteText.textContent = window.FitPowerTrainerNotes.get(member.id_client) || "Sin nota";
    noteCell.append(noteTitle, noteText);

    const actionsCell = document.createElement("td");
    actionsCell.className = "acciones";
    const actionButton = document.createElement("button");
    actionButton.type = "button";
    actionButton.className = "action-button";
    actionButton.setAttribute("aria-label", `Acciones para ${member.name_client}`);
    actionButton.textContent = "\u22EE"; // tres puntitos verticales
    const menu = document.createElement("div");
    menu.className = "action-menu";
    // Las filas se crean después de cargar la página: el botón necesita su propio listener.
    actionButton.addEventListener("click", (event) => {
        event.stopPropagation();
        document.querySelectorAll(".action-menu").forEach((element) => {
            if (element !== menu) element.classList.remove("mostrar");
        });
        menu.classList.toggle("mostrar");
    });
    const assignButton = document.createElement("button");
    assignButton.type = "button";
    assignButton.dataset.trainerMember = String(member.id_client);
    assignButton.dataset.memberName = member.name_client;
    const icon = document.createElement("span");
    icon.className = "icono-ver";
    icon.textContent = "◆";
    assignButton.append(icon, "Asignar rutinas y nota");
    menu.append(assignButton);
    actionsCell.append(actionButton, menu);

    row.append(noteCell, actionsCell);
    return row;
}

function renderRoutineOptions(assignedIds) {
    routineOptions.replaceChildren();
    routines.forEach((routine) => {
        const label = document.createElement("label");
        label.className = "class-assignment-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "routineIds";
        checkbox.value = String(routine.id_routine);
        checkbox.checked = assignedIds.includes(routine.id_routine);
        const text = document.createElement("span");
        text.textContent = routine.name_routine;
        label.append(checkbox, text);
        routineOptions.append(label);
    });
    noRoutinesMessage.hidden = routines.length > 0;
}

async function openTrainerMemberModal(memberId, memberName) {
    activeMemberId = memberId;
    document.getElementById("trainerMemberName").textContent = memberName;
    trainerMemberNote.value = window.FitPowerTrainerNotes.get(memberId);
    showFeedback("Cargando rutinas…");
    routineOptions.replaceChildren();
    saveButton.disabled = true;
    bootstrap.Modal.getOrCreateInstance(trainerMemberModal).show();

    const data = await API.request(`/socios/${memberId}/rutinas`);
    if (!data.success) {
        showFeedback(data.message || "No se pudieron cargar las rutinas del socio.", true);
        return;
    }
    renderRoutineOptions(data.rutinas || []);
    showFeedback("");
    saveButton.disabled = false;
}

document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-trainer-member]");
    if (!trigger) return;
    event.stopPropagation();
    trigger.closest(".action-menu")?.classList.remove("mostrar");
    openTrainerMemberModal(trigger.dataset.trainerMember, trigger.dataset.memberName);
});

trainerMemberForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selectedIds = new FormData(trainerMemberForm).getAll("routineIds").map(Number);
    const note = trainerMemberNote.value.trim();

    saveButton.disabled = true;
    const data = await API.request(`/socios/${activeMemberId}/rutinas`, "PUT", { rutinas: selectedIds });
    saveButton.disabled = false;
    if (!data.success) {
        showFeedback(data.message || "No se pudieron guardar las rutinas.", true);
        return;
    }

    try {
        window.FitPowerTrainerNotes.set(activeMemberId, note);
        const noteDisplay = document.querySelector(`[data-trainer-note="${CSS.escape(String(activeMemberId))}"]`);
        if (noteDisplay) noteDisplay.textContent = note || "Sin nota";
        showFeedback(`Se guardaron las rutinas (${selectedIds.length}) y la nota.`);
    } catch {
        showFeedback("Las rutinas se guardaron, pero la nota no.", true);
    }
});

(async () => {
    const [membersData, routinesData] = await Promise.all([API.request("/socios"), API.request("/rutinas")]);
    routines = routinesData.success ? routinesData.rutinas : [];

    if (!membersData.success) {
        tableMessage(membersData.message || "No se pudieron cargar los socios.");
        return;
    }
    if (!membersData.socios.length) {
        tableMessage("No hay socios registrados.");
        return;
    }
    membersBody.replaceChildren(...membersData.socios.map(createMemberRow));
})();

}
})();

// Biblioteca y filtrado de ejercicios
(() => {
if (document.getElementById("exerciseForm")) {
const exerciseForm = document.getElementById("exerciseForm");
const exerciseList = document.getElementById("exerciseList");
const exerciseSearch = document.getElementById("exerciseSearch");
const muscleSelect = document.getElementById("exerciseMuscle");
const muscleFilter = document.getElementById("exerciseMuscleFilter");
const emptyExerciseList = document.getElementById("emptyExerciseList");
const feedback = document.getElementById("exerciseFeedback");
let exercises = [];

function populateMuscleGroups(groups) {
    groups.forEach((group) => {
        muscleSelect.add(new Option(group, group));
        muscleFilter.add(new Option(group, group));
    });
    muscleFilter.add(new Option("Todos los grupos", "all"), 0);
    muscleFilter.value = "all";
}

function renderExercises() {
    const query = exerciseSearch.value.trim().toLocaleLowerCase("es");
    const selectedMuscle = muscleFilter.value;
    exerciseList.replaceChildren();

    exercises
        .filter(exercise => selectedMuscle === "all" || exercise.muscle_exercise === selectedMuscle)
        .filter((exercise) => {
            const text = `${exercise.name_exercise} ${exercise.muscle_exercise} ${exercise.equipment_exercise}`;
            return text.toLocaleLowerCase("es").includes(query);
        })
        .forEach((exercise) => {
            const row = document.createElement("article");
            row.className = "exercise-library-row";
            const name = document.createElement("h3");
            name.textContent = exercise.name_exercise;
            const muscle = document.createElement("span");
            muscle.textContent = exercise.muscle_exercise;
            const equipment = document.createElement("span");
            equipment.textContent = exercise.equipment_exercise;
            row.append(name, muscle, equipment);
            exerciseList.append(row);
        });

    emptyExerciseList.hidden = exerciseList.childElementCount > 0;
}

async function loadExercises() {
    const data = await API.request("/ejercicios");
    if (!data.success) {
        feedback.classList.add("is-error");
        feedback.textContent = data.message || "No se pudieron cargar los ejercicios.";
        return null;
    }
    exercises = data.ejercicios;
    return data;
}

exerciseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!exerciseForm.reportValidity()) return;

    const formData = new FormData(exerciseForm);
    const muscle = String(formData.get("muscle"));
    const data = await API.request("/ejercicios", "POST", {
        name: String(formData.get("name")).trim(),
        muscle,
        equipment: String(formData.get("equipment")).trim()
    });

    feedback.classList.toggle("is-error", !data.success);
    feedback.textContent = data.message || "No se pudo guardar el ejercicio.";
    if (!data.success) return;

    exerciseForm.reset();
    await loadExercises();
    muscleFilter.value = muscle;
    exerciseSearch.value = "";
    renderExercises();
});

exerciseSearch.addEventListener("input", renderExercises);
muscleFilter.addEventListener("change", renderExercises);

(async () => {
    const data = await loadExercises();
    if (!data) return;
    populateMuscleGroups(data.grupos);
    renderExercises();
})();

}
})();

// rutinas
(() => {
if (document.getElementById("routineForm")) {
const routineForm = document.getElementById("routineForm");
const exerciseRows = document.getElementById("routineExerciseRows");
const routineList = document.getElementById("routineList");
const noExercisesMessage = document.getElementById("noExercisesMessage");
const emptyRoutineList = document.getElementById("emptyRoutineList");
const routineModalElement = document.getElementById("routineModal");
const routineModal = bootstrap.Modal.getOrCreateInstance(routineModalElement);
const routineDetailModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("routineDetailModal"));
const pageFeedback = document.getElementById("routinePageFeedback");
const routineFeedback = document.getElementById("routineFeedback");
let exercises = [];
let routines = [];
let editingRoutineId = null;

// La tabla Routine no guarda imagen: se alterna entre dos según el id.
function routineImage(routine) {
    return `assets/imagenes/img${(routine.id_routine % 2) + 1}.jpg`;
}

function showPageFeedback(message, isError = false) {
    pageFeedback.textContent = message;
    pageFeedback.classList.toggle("is-error", isError);
}

function showRoutineFeedback(message, isError = false) {
    routineFeedback.textContent = message;
    routineFeedback.classList.toggle("is-error", isError);
}

function renderRoutines() {
    routineList.replaceChildren();
    routines.forEach((routine) => {
        const card = document.createElement("article");
        card.className = "routine-preview-card";

        const image = document.createElement("img");
        image.className = "routine-preview-image";
        image.src = routineImage(routine);
        image.alt = `Vista previa de ${routine.name_routine}`;
        image.loading = "lazy";

        const content = document.createElement("div");
        content.className = "routine-preview-content";
        const title = document.createElement("h2");
        title.textContent = routine.name_routine;
        const summary = document.createElement("p");
        summary.textContent = routine.items.map(item => item.exercise_name).join(" · ") || "Rutina de entrenamiento";

        const actions = document.createElement("div");
        actions.className = "routine-card-actions";
        [
            { action: "delete", label: "Eliminar", className: "interface-button-danger" },
            { action: "view", label: "Ver", className: "interface-button-secondary" },
            { action: "edit", label: "Modificar", className: "interface-button-secondary" }
        ].forEach(({ action, label, className }) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = className;
            button.dataset.routineAction = action;
            button.dataset.routineId = String(routine.id_routine);
            button.textContent = label;
            actions.append(button);
        });

        content.append(title, summary, actions);
        card.append(image, content);
        routineList.append(card);
    });
    emptyRoutineList.hidden = routines.length > 0;
}

async function loadRoutines() {
    const data = await API.request("/rutinas");
    if (!data.success) {
        showPageFeedback(data.message || "No se pudieron cargar las rutinas.", true);
        return;
    }
    routines = data.rutinas;
    renderRoutines();
}

function updateExerciseOrder() {
    exerciseRows.querySelectorAll(".routine-exercise-row").forEach((row, index, rows) => {
        row.querySelector(".routine-exercise-position").textContent = String(index + 1);
        row.querySelector('[data-row-action="up"]').disabled = index === 0;
        row.querySelector('[data-row-action="down"]').disabled = index === rows.length - 1;
    });
}

function createExerciseRow(item = {}) {
    const row = document.createElement("div");
    row.className = "routine-exercise-row";

    const position = document.createElement("span");
    position.className = "routine-exercise-position";
    position.setAttribute("aria-label", "Orden del ejercicio");

    const select = document.createElement("select");
    select.className = "form-select routine-exercise-select";
    select.name = "exerciseId";
    select.setAttribute("aria-label", "Ejercicio");
    select.required = true;
    select.add(new Option("Selecciona ejercicio", "", true, !item.exercise_id));
    exercises.forEach((exercise) => {
        select.add(new Option(
            `${exercise.name_exercise} · ${exercise.muscle_exercise}`,
            String(exercise.id_exercise),
            false,
            exercise.id_exercise === item.exercise_id
        ));
    });

    const setsLabel = document.createElement("label");
    setsLabel.className = "routine-number-field";
    setsLabel.append(document.createTextNode("Series"));
    const sets = document.createElement("input");
    sets.className = "form-control";
    sets.type = "number";
    sets.name = "sets";
    sets.min = "1";
    sets.max = "30";
    sets.required = true;
    sets.value = String(item.sets || 3);
    setsLabel.append(sets);

    const repsLabel = document.createElement("label");
    repsLabel.className = "routine-number-field";
    repsLabel.append(document.createTextNode("Reps"));
    const reps = document.createElement("input");
    reps.className = "form-control";
    reps.type = "number";
    reps.name = "reps";
    reps.min = "1";
    reps.max = "100";
    reps.required = true;
    reps.value = String(item.reps || 12);
    repsLabel.append(reps);

    const rowActions = document.createElement("div");
    rowActions.className = "routine-row-actions";
    [
        { action: "up", label: "Subir", glyph: "↑" },
        { action: "down", label: "Bajar", glyph: "↓" },
        { action: "remove", label: "Quitar", glyph: "×" }
    ].forEach(({ action, label, glyph }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "routine-row-action";
        button.dataset.rowAction = action;
        button.setAttribute("aria-label", label);
        button.textContent = glyph;
        rowActions.append(button);
    });

    row.append(position, select, setsLabel, repsLabel, rowActions);
    return row;
}

function addExerciseRow(item) {
    exerciseRows.append(createExerciseRow(item));
    updateExerciseOrder();
}

function resetRoutineForm() {
    editingRoutineId = null;
    routineForm.reset();
    document.getElementById("routineModalTitle").textContent = "Crear rutina";
    exerciseRows.replaceChildren();
    showRoutineFeedback("");
    noExercisesMessage.hidden = exercises.length > 0;
    if (exercises.length) addExerciseRow();
}

function editRoutine(routine) {
    editingRoutineId = routine.id_routine;
    routineForm.reset();
    document.getElementById("routineModalTitle").textContent = "Modificar rutina";
    document.getElementById("routineName").value = routine.name_routine;
    exerciseRows.replaceChildren();
    routine.items.forEach(item => addExerciseRow(item));
    noExercisesMessage.hidden = exercises.length > 0;
    showRoutineFeedback("");
    routineModal.show();
}

function showRoutine(routine) {
    document.getElementById("routineDetailTitle").textContent = routine.name_routine;
    const image = document.getElementById("routineDetailImage");
    image.src = routineImage(routine);
    image.alt = `Vista previa de ${routine.name_routine}`;

    const list = document.getElementById("routineDetailExercises");
    list.replaceChildren();
    routine.items.forEach((item) => {
        const line = document.createElement("li");
        const series = item.sets === 1 ? "serie" : "series";
        const repeticiones = item.reps === 1 ? "repetición" : "repeticiones";
        line.textContent = `${item.exercise_name} — ${item.sets} ${series} × ${item.reps} ${repeticiones}`;
        list.append(line);
    });
    routineDetailModal.show();
}

async function removeRoutine(routine) {
    const aviso = `¿Eliminar la rutina “${routine.name_routine}”?`
        + " Los socios que la tengan asignada la van a perder.";
    if (!window.confirm(aviso)) return;

    const data = await API.request(`/rutinas/${routine.id_routine}`, "DELETE");
    if (!data.success) {
        showPageFeedback(data.message || "No se pudo eliminar la rutina.", true);
        return;
    }
    showPageFeedback("");
    await loadRoutines();
}

routineModalElement.addEventListener("show.bs.modal", () => {
    if (!editingRoutineId) resetRoutineForm();
});
routineModalElement.addEventListener("hidden.bs.modal", () => {
    editingRoutineId = null;
});

document.getElementById("addRoutineExercise").addEventListener("click", () => addExerciseRow());

exerciseRows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-row-action]");
    if (!button) return;
    const row = button.closest(".routine-exercise-row");
    const action = button.dataset.rowAction;
    if (action === "remove") {
        row.remove();
    } else if (action === "up" && row.previousElementSibling) {
        exerciseRows.insertBefore(row, row.previousElementSibling);
    } else if (action === "down" && row.nextElementSibling) {
        exerciseRows.insertBefore(row.nextElementSibling, row);
    }
    updateExerciseOrder();
});

routineForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!routineForm.reportValidity()) return;

    const items = [...exerciseRows.querySelectorAll(".routine-exercise-row")].map(row => ({
        exercise_id: Number(row.querySelector('[name="exerciseId"]').value),
        sets: Number(row.querySelector('[name="sets"]').value),
        reps: Number(row.querySelector('[name="reps"]').value)
    }));
    if (!items.length || items.some(item => !item.exercise_id)) {
        showRoutineFeedback("Agrega al menos un ejercicio.", true);
        return;
    }

    const body = { name: String(new FormData(routineForm).get("name")).trim(), items };
    const data = editingRoutineId
        ? await API.request(`/rutinas/${editingRoutineId}`, "PUT", body)
        : await API.request("/rutinas", "POST", body);

    if (!data.success) {
        showRoutineFeedback(data.message || "No se pudo guardar la rutina.", true);
        return;
    }
    showPageFeedback("");
    routineModal.hide();
    await loadRoutines();
});

routineList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-routine-action]");
    if (!button) return;
    const routine = routines.find(entry => entry.id_routine === Number(button.dataset.routineId));
    if (!routine) return;
    if (button.dataset.routineAction === "delete") removeRoutine(routine);
    if (button.dataset.routineAction === "view") showRoutine(routine);
    if (button.dataset.routineAction === "edit") editRoutine(routine);
});

(async () => {
    const data = await API.request("/ejercicios");
    exercises = data.success ? data.ejercicios : [];
    await loadRoutines();
})();

}
})();
