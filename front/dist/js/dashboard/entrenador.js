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

//Almacenamiento ejercicios y rutinas
(() => {
(() => {
    const storageKey = "fitpowerTrainingData";
    const seed = {
        muscleGroups: ["Piernas", "Pecho", "Espalda", "Hombros", "Core"],
        exercises: [
            { id: "sentadilla", name: "Sentadilla", muscle: "Piernas", equipment: "Barra" },
            { id: "peso-muerto", name: "Peso muerto", muscle: "Piernas", equipment: "Barra" },
            { id: "press-banca", name: "Press de banca", muscle: "Pecho", equipment: "Barra" },
            { id: "flexiones", name: "Flexiones", muscle: "Pecho", equipment: "Peso corporal" },
            { id: "remo", name: "Remo", muscle: "Espalda", equipment: "Mancuernas" },
            { id: "jalon", name: "Jalón al pecho", muscle: "Espalda", equipment: "Polea" },
            { id: "press-militar", name: "Press militar", muscle: "Hombros", equipment: "Mancuernas" },
            { id: "plancha", name: "Plancha", muscle: "Core", equipment: "Peso corporal" }
        ],
        routines: [
            { id: "rutina-piernas", name: "Fuerza de piernas", image: "img1.jpg", items: [{ exerciseId: "sentadilla", sets: 4, reps: 10 }, { exerciseId: "peso-muerto", sets: 3, reps: 8 }] },
            { id: "rutina-superior", name: "Tren superior", image: "img2.jpg", items: [{ exerciseId: "press-banca", sets: 3, reps: 10 }, { exerciseId: "remo", sets: 3, reps: 12 }, { exerciseId: "press-militar", sets: 3, reps: 10 }] },
            { id: "rutina-core", name: "Core y estabilidad", image: "img1.jpg", items: [{ exerciseId: "flexiones", sets: 3, reps: 12 }, { exerciseId: "jalon", sets: 3, reps: 12 }, { exerciseId: "plancha", sets: 3, reps: 30 }] }
        ],
        memberRoutines: {},
        memberNotes: {}
    };

    function load() {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return structuredClone(seed);

        try {
            const data = JSON.parse(stored);
            if (!data || !Array.isArray(data.exercises) || !Array.isArray(data.routines)) {
                throw new TypeError("El formato no es válido.");
            }
            const exercises = data.exercises.map(exercise => ({
                ...exercise,
                muscle: seed.muscleGroups.includes(exercise.muscle) ? exercise.muscle : "Cuerpo completo"
            }));
            return {
                muscleGroups: seed.muscleGroups,
                exercises,
                routines: data.routines.map((routine, index) => {
                    const items = Array.isArray(routine.items)
                        ? routine.items
                        : (routine.exerciseIds || []).map(exerciseId => ({ exerciseId, sets: 3, reps: 12 }));
                    return {
                        ...routine,
                        image: routine.image || `img${(index % 2) + 1}.jpg`,
                        items: items.map(item => ({
                            exerciseId: item.exerciseId,
                            sets: Number(item.sets) || 3,
                            reps: Number(item.reps) || 12
                        }))
                    };
                }),
                memberRoutines: data.memberRoutines || {},
                memberNotes: data.memberNotes || {}
            };
        } catch {
            return structuredClone(seed);
        }
    }

    function save(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    window.FitPowerTrainingData = { load, save };
})();
})();

// asignar  rutinas y notas 
(() => {
if (document.getElementById("trainerMemberForm")) {
const trainingState = window.FitPowerTrainingData.load();
const trainerMemberModal = document.getElementById("trainerMemberModal");
const trainerMemberForm = document.getElementById("trainerMemberForm");
const trainerRoutineSelect = document.getElementById("trainerRoutineSelect");
const trainerMemberNote = document.getElementById("trainerMemberNote");
const trainerMemberFeedback = document.getElementById("trainerMemberFeedback");
let activeMemberId = "";
let previousRoutineId = "";
let previousMemberNote = "";

trainingState.routines.forEach((routine) => {
    trainerRoutineSelect.add(new Option(routine.name, routine.id));
});
document.querySelectorAll("[data-trainer-note]").forEach((noteDisplay) => {
    const memberId = noteDisplay.dataset.trainerNote;
    noteDisplay.textContent = trainingState.memberNotes[memberId] || "Sin nota";
});

function openTrainerMemberModal(memberId) {
    activeMemberId = memberId.trim().toLocaleLowerCase("es");
    previousRoutineId = trainingState.memberRoutines[activeMemberId] || "";
    previousMemberNote = trainingState.memberNotes[activeMemberId] || "";
    document.getElementById("trainerMemberName").textContent = memberId;
    trainerRoutineSelect.value = previousRoutineId;
    trainerMemberNote.value = previousMemberNote;
    trainerMemberFeedback.textContent = "";
    trainerMemberFeedback.classList.remove("is-error");

    const noteDisplay = document.querySelector(`[data-trainer-note="${CSS.escape(activeMemberId)}"]`);
    if (noteDisplay) noteDisplay.textContent = previousMemberNote || "Sin nota";
    bootstrap.Modal.getOrCreateInstance(trainerMemberModal).show();
}

document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-trainer-member]");
    if (!trigger) return;
    event.stopPropagation();
    openTrainerMemberModal(trigger.dataset.trainerMember);
});

trainerMemberForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedRoutineId = trainerRoutineSelect.value;
    const selectedRoutine = trainingState.routines.find(routine => routine.id === selectedRoutineId);
    if (selectedRoutineId && !selectedRoutine) {
        trainerMemberFeedback.classList.add("is-error");
        trainerMemberFeedback.textContent = "Selecciona una rutina válida.";
        return;
    }

    const note = trainerMemberNote.value.trim();
    if (selectedRoutineId) trainingState.memberRoutines[activeMemberId] = selectedRoutineId;
    else delete trainingState.memberRoutines[activeMemberId];
    if (note) trainingState.memberNotes[activeMemberId] = note;
    else delete trainingState.memberNotes[activeMemberId];

    try {
        window.FitPowerTrainingData.save(trainingState);
        const noteDisplay = document.querySelector(`[data-trainer-note="${CSS.escape(activeMemberId)}"]`);
        if (noteDisplay) noteDisplay.textContent = note || "Sin nota";
        trainerMemberFeedback.classList.remove("is-error");
        trainerMemberFeedback.textContent = "Se guardaron la rutina y la nota.";
    } catch {
        if (previousRoutineId) trainingState.memberRoutines[activeMemberId] = previousRoutineId;
        else delete trainingState.memberRoutines[activeMemberId];
        if (previousMemberNote) trainingState.memberNotes[activeMemberId] = previousMemberNote;
        else delete trainingState.memberNotes[activeMemberId];
        trainerMemberFeedback.classList.add("is-error");
        trainerMemberFeedback.textContent = "No se pudieron guardar los cambios.";
    }
});

}
})();

// Biblioteca y filtrado de ejercicios
(() => {
if (document.getElementById("exerciseForm")) {
const trainingData = window.FitPowerTrainingData.load();
const exerciseForm = document.getElementById("exerciseForm");
const exerciseList = document.getElementById("exerciseList");
const exerciseSearch = document.getElementById("exerciseSearch");
const muscleSelect = document.getElementById("exerciseMuscle");
const muscleFilter = document.getElementById("exerciseMuscleFilter");
const emptyExerciseList = document.getElementById("emptyExerciseList");

function populateMuscleGroups() {
    trainingData.muscleGroups.forEach((group) => {
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

    trainingData.exercises
        .filter(exercise => selectedMuscle === "all" || exercise.muscle === selectedMuscle)
        .filter(exercise => `${exercise.name} ${exercise.muscle} ${exercise.equipment}`.toLocaleLowerCase("es").includes(query))
        .forEach((exercise) => {
            const row = document.createElement("article");
            row.className = "exercise-library-row";
            const name = document.createElement("h3");
            name.textContent = exercise.name;
            const muscle = document.createElement("span");
            muscle.textContent = exercise.muscle;
            const equipment = document.createElement("span");
            equipment.textContent = exercise.equipment;
            row.append(name, muscle, equipment);
            exerciseList.append(row);
        });

    emptyExerciseList.hidden = exerciseList.childElementCount > 0;
}

exerciseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!exerciseForm.reportValidity()) return;

    const data = new FormData(exerciseForm);
    const name = String(data.get("name")).trim();
    const feedback = document.getElementById("exerciseFeedback");
    if (trainingData.exercises.some(exercise => exercise.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"))) {
        feedback.classList.add("is-error");
        feedback.textContent = "ejercicio ya existe.";
        return;
    }

    const id = `ejercicio-${Date.now().toString(36)}`;
    const previousExercises = [...trainingData.exercises];
    trainingData.exercises.push({
        id,
        name,
        muscle: String(data.get("muscle")).trim(),
        equipment: String(data.get("equipment")).trim()
    });

    try {
        window.FitPowerTrainingData.save(trainingData);
        muscleFilter.value = String(data.get("muscle"));
        exerciseSearch.value = "";
        renderExercises();
        feedback.classList.remove("is-error");
        feedback.textContent = "Ejercicio agregado.";
        exerciseForm.reset();
    } catch {
        trainingData.exercises = previousExercises;
        feedback.classList.add("is-error");
        feedback.textContent = "No se pudo guardar el ejercicio.";
    }
});

exerciseSearch.addEventListener("input", renderExercises);
muscleFilter.addEventListener("change", renderExercises);
populateMuscleGroups();
renderExercises();

}
})();

// rutinas
(() => {
if (document.getElementById("routineForm")) {
const trainingData = window.FitPowerTrainingData.load();
const routineForm = document.getElementById("routineForm");
const exerciseRows = document.getElementById("routineExerciseRows");
const routineList = document.getElementById("routineList");
const noExercisesMessage = document.getElementById("noExercisesMessage");
const emptyRoutineList = document.getElementById("emptyRoutineList");
const routineModalElement = document.getElementById("routineModal");
const routineModal = bootstrap.Modal.getOrCreateInstance(routineModalElement);
const routineDetailModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("routineDetailModal"));
const previewImages = ["img1.jpg", "img2.jpg"];
const pageFeedback = document.getElementById("routinePageFeedback");
let editingRoutineId = null;

function getExerciseName(id) {
    return trainingData.exercises.find(exercise => exercise.id === id)?.name || "Ejercicio";
}

function normalizedItems(routine) {
    if (Array.isArray(routine.items)) return routine.items;
    return (routine.exerciseIds || []).map(exerciseId => ({ exerciseId, sets: 3, reps: 12 }));
}

function renderRoutines() {
    routineList.replaceChildren();
    trainingData.routines.forEach((routine) => {
        const card = document.createElement("article");
        card.className = "routine-preview-card";

        const image = document.createElement("img");
        image.className = "routine-preview-image";
        image.src = `../../../assets/imagenes/${routine.image || previewImages[0]}`;
        image.alt = `Vista previa de ${routine.name}`;
        image.loading = "lazy";

        const content = document.createElement("div");
        content.className = "routine-preview-content";
        const title = document.createElement("h2");
        title.textContent = routine.name;
        const summary = document.createElement("p");
        const items = normalizedItems(routine);
        summary.textContent = items.map(item => getExerciseName(item.exerciseId)).join(" · ") || "Rutina de entrenamiento";

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
            button.dataset.routineId = routine.id;
            button.textContent = label;
            actions.append(button);
        });

        content.append(title, summary, actions);
        card.append(image, content);
        routineList.append(card);
    });
    emptyRoutineList.hidden = trainingData.routines.length > 0;
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
    select.add(new Option("Selecciona ejercicio", "", true, !item.exerciseId));
    trainingData.exercises.forEach((exercise) => {
        select.add(new Option(`${exercise.name} · ${exercise.muscle}`, exercise.id, false, exercise.id === item.exerciseId));
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
    document.getElementById("routineFeedback").textContent = "";
    document.getElementById("routineFeedback").classList.remove("is-error");
    noExercisesMessage.hidden = trainingData.exercises.length > 0;
    if (trainingData.exercises.length) addExerciseRow();
}

function editRoutine(routine) {
    editingRoutineId = routine.id;
    routineForm.reset();
    document.getElementById("routineModalTitle").textContent = "Modificar rutina";
    document.getElementById("routineName").value = routine.name;
    exerciseRows.replaceChildren();
    normalizedItems(routine).forEach(item => addExerciseRow(item));
    noExercisesMessage.hidden = trainingData.exercises.length > 0;
    document.getElementById("routineFeedback").textContent = "";
    document.getElementById("routineFeedback").classList.remove("is-error");
    routineModal.show();
}

function showRoutine(routine) {
    document.getElementById("routineDetailTitle").textContent = routine.name;
    const image = document.getElementById("routineDetailImage");
    image.src = `../../../assets/imagenes/${routine.image || previewImages[0]}`;
    image.alt = `Vista previa de ${routine.name}`;

    const list = document.getElementById("routineDetailExercises");
    list.replaceChildren();
    normalizedItems(routine).forEach((item) => {
        const exercise = trainingData.exercises.find(entry => entry.id === item.exerciseId);
        const line = document.createElement("li");
        line.textContent = `${exercise?.name || "Ejercicio"} — ${item.sets} ${item.sets === 1 ? "serie" : "series"} × ${item.reps} ${item.reps === 1 ? "repetición" : "repeticiones"}`;
        list.append(line);
    });
    routineDetailModal.show();
}

function removeRoutine(id) {
    const routine = trainingData.routines.find(entry => entry.id === id);
    if (!routine || !window.confirm(`¿Eliminar la rutina “${routine.name}”?`)) return;

    const previousRoutines = [...trainingData.routines];
    const previousAssignments = { ...trainingData.memberRoutines };
    trainingData.routines = previousRoutines.filter(entry => entry.id !== id);
    Object.keys(trainingData.memberRoutines).forEach((memberId) => {
        if (trainingData.memberRoutines[memberId] === id) delete trainingData.memberRoutines[memberId];
    });
    try {
        window.FitPowerTrainingData.save(trainingData);
        pageFeedback.classList.remove("is-error");
        pageFeedback.textContent = "";
        renderRoutines();
    } catch {
        trainingData.routines = previousRoutines;
        trainingData.memberRoutines = previousAssignments;
        renderRoutines();
        pageFeedback.classList.add("is-error");
        pageFeedback.textContent = "No se pudo eliminar la rutina.";
    }
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

routineForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!routineForm.reportValidity()) return;

    const name = String(new FormData(routineForm).get("name")).trim();
    const feedback = document.getElementById("routineFeedback");
    const items = [...exerciseRows.querySelectorAll(".routine-exercise-row")].map(row => ({
        exerciseId: row.querySelector('[name="exerciseId"]').value,
        sets: Number(row.querySelector('[name="sets"]').value),
        reps: Number(row.querySelector('[name="reps"]').value)
    }));

    if (!items.length || items.some(item => !item.exerciseId)) {
        feedback.classList.add("is-error");
        feedback.textContent = "Agrega al menos un ejercicio.";
        return;
    }
    const duplicateName = trainingData.routines.some(routine =>
        routine.id !== editingRoutineId && routine.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es")
    );
    if (duplicateName) {
        feedback.classList.add("is-error");
        feedback.textContent = "Ya existe una rutina con ese título.";
        return;
    }

    const currentRoutine = trainingData.routines.find(routine => routine.id === editingRoutineId);
    const routine = {
        id: editingRoutineId || `rutina-${Date.now().toString(36)}`,
        name,
        image: currentRoutine?.image || previewImages[trainingData.routines.length % previewImages.length],
        items,
        exerciseIds: items.map(item => item.exerciseId)
    };

    const previousRoutines = [...trainingData.routines];
    if (editingRoutineId) {
        trainingData.routines = trainingData.routines.map(entry => entry.id === editingRoutineId ? routine : entry);
    } else {
        trainingData.routines.push(routine);
    }

    try {
        window.FitPowerTrainingData.save(trainingData);
        pageFeedback.classList.remove("is-error");
        pageFeedback.textContent = "";
        renderRoutines();
        routineModal.hide();
    } catch {
        trainingData.routines = previousRoutines;
        feedback.classList.add("is-error");
        feedback.textContent = "No se pudo guardar la rutina.";
    }
});

routineList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-routine-action]");
    if (!button) return;
    const routine = trainingData.routines.find(entry => entry.id === button.dataset.routineId);
    if (!routine) return;
    if (button.dataset.routineAction === "delete") removeRoutine(routine.id);
    if (button.dataset.routineAction === "view") showRoutine(routine);
    if (button.dataset.routineAction === "edit") editRoutine(routine);
});

renderRoutines();

}
})();

