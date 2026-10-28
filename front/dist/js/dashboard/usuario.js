// Sección: Almacenamiento de reseñas.
(() => {
(() => {
    const storageKey = "fitpowerMemberReviews";

    function normalizeName(name) {
        return String(name || "").trim().toLocaleLowerCase("es");
    }

    function load() {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return {};

        try {
            const reviews = JSON.parse(stored);
            if (!reviews || typeof reviews !== "object" || Array.isArray(reviews)) {
                throw new TypeError("El formato de reseñas no es válido.");
            }
            return reviews;
        } catch {
            return {};
        }
    }

    function get(name) {
        const review = load()[normalizeName(name)];
        if (!review) return null;
        if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5 || typeof review.text !== "string") {
            return null;
        }
        return review;
    }

    function save(name, review) {
        const reviews = load();
        reviews[normalizeName(name)] = review;
        localStorage.setItem(storageKey, JSON.stringify(reviews));
    }

    window.FitPowerReviewData = { normalizeName, get, save };
})();
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

// Sección: Almacenamiento de rutinas asignadas.
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

// Sección: Perfil, vencimiento, clases y rutinas del socio.
(() => {
const photoInput = document.getElementById("profilePhotoInput");
const photoFeedback = document.getElementById("photoFeedback");
const profileImages = document.querySelectorAll("[data-profile-photo]");
const changePhotoButton = document.getElementById("changePhotoButton");

function showPhotoFeedback(message, isError = false) {
    if (!photoFeedback) return;
    photoFeedback.textContent = message;
    photoFeedback.classList.toggle("is-error", isError);
}

if (photoInput) {
    changePhotoButton?.addEventListener("click", () => photoInput.click());

    photoInput.addEventListener("change", () => {
        const [file] = photoInput.files || [];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showPhotoFeedback("El archivo debe ser una imagen.", true);
            photoInput.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showPhotoFeedback("La imagen debe pesar 5 MB o menos.", true);
            photoInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            if (typeof reader.result !== "string") {
                showPhotoFeedback("No se pudo cargar la imagen seleccionada.", true);
                return;
            }

            profileImages.forEach((image) => {
                image.src = reader.result;
            });
            showPhotoFeedback("Foto actualizada en esta vista.");
        });
        reader.addEventListener("error", () => {
            showPhotoFeedback("No se pudo leer la imagen seleccionada.", true);
        });
        reader.readAsDataURL(file);
    });
}

const memberClassesContainer = document.getElementById("memberClasses");
const profileQuery = new URLSearchParams(window.location.search);
const memberName = profileQuery.get("name") || memberClassesContainer?.dataset.memberName || "miau";
const normalizedMemberName = memberName.trim().toLocaleLowerCase("es");
const displayMemberName = memberName.trim().replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase("es"));
if (memberClassesContainer) memberClassesContainer.dataset.memberName = normalizedMemberName;
document.getElementById("memberHeaderName")?.replaceChildren(document.createTextNode(displayMemberName));
document.getElementById("memberGreeting")?.replaceChildren(document.createTextNode(`Hola, ${displayMemberName}`));

const expirationText = document.getElementById("membershipExpiration")?.textContent.trim();
const expiryNotice = document.getElementById("membershipExpiryNotice");
if (expirationText && expiryNotice) {
    const [day, month, year] = expirationText.split("/").map(Number);
    const expirationDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((expirationDate - today) / 86400000);
    if (daysRemaining >= 0 && daysRemaining <= 7) {
        expiryNotice.hidden = false;
        expiryNotice.textContent = daysRemaining === 0
            ? "Tu membresía vence hoy."
            : `Tu membresía vence en ${daysRemaining} ${daysRemaining === 1 ? "día" : "días"}.`;
    } else if (daysRemaining < 0) {
        expiryNotice.hidden = false;
        expiryNotice.textContent = "Tu membresía está vencida.";
        expiryNotice.classList.add("is-expired");
    }
}

if (memberClassesContainer && window.FitPowerClassData) {
    const classState = window.FitPowerClassData.load();
    const assignedClasses = classState.classes.filter(session => session.studentNames.includes(normalizedMemberName));
    memberClassesContainer.replaceChildren();

    const now = new Date();
    const upcoming = assignedClasses.flatMap(session => {
        const [hours, minutes] = session.time.split(":").map(Number);
        const occurrences = [];
        for (let offset = 0; offset <= 35; offset += 1) {
            const date = new Date(now);
            date.setDate(now.getDate() + offset);
            date.setHours(hours, minutes, 0, 0);
            if (session.days.includes(date.getDay()) && date > now) {
                occurrences.push({ session, date });
            }
        }
        return occurrences;
    }).sort((first, second) => first.date - second.date).slice(0, 5);

    upcoming.forEach(({ session, date }) => {
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const key = `${session.id}:${dateKey}`;
        const card = document.createElement("article");
        card.className = "clase";

        const name = document.createElement("span");
        name.className = "nombre-clase";
        name.textContent = session.name;

        const schedule = document.createElement("span");
        schedule.className = "horario-clase";
        schedule.textContent = `${window.FitPowerClassData.formatDate(date)} · ${session.time}`;
        card.append(name, schedule);

        if (classState.cancellations.includes(key)) {
            const status = document.createElement("span");
            status.className = "class-notice class-notice-cancelled";
            status.textContent = "Esta clase fue cancelada.";
            card.append(status);
        } else if (classState.notes[key]) {
            const notice = document.createElement("span");
            notice.className = "class-notice";
            notice.textContent = classState.notes[key];
            card.append(notice);
        }
        memberClassesContainer.append(card);
    });

    if (!upcoming.length) {
        const empty = document.createElement("p");
        empty.textContent = assignedClasses.length ? "No tienes próximas clases programadas." : "No tienes clases asignadas.";
        memberClassesContainer.append(empty);
    }
}

if (window.FitPowerTrainingData) {
    const trainingData = window.FitPowerTrainingData.load();
    const routineId = trainingData.memberRoutines[normalizedMemberName];
    const routine = trainingData.routines.find(item => item.id === routineId);
    const routineContainer = document.getElementById("memberRoutine");
    const noRoutineMessage = document.getElementById("noAssignedRoutine");
    if (routineContainer && routine) {
        const card = document.createElement("article");
        card.className = "routine-preview-card";
        const image = document.createElement("img");
        image.className = "routine-preview-image";
        image.src = `../../../assets/imagenes/${routine.image || "img1.jpg"}`;
        image.alt = `Vista previa de ${routine.name}`;
        image.loading = "lazy";

        const content = document.createElement("div");
        content.className = "routine-preview-content";
        const title = document.createElement("h2");
        title.textContent = routine.name;
        const summary = document.createElement("p");
        const routineItems = routine.items || (routine.exerciseIds || []).map(exerciseId => ({ exerciseId, sets: 3, reps: 12 }));
        summary.textContent = routineItems
            .map(item => trainingData.exercises.find(exercise => exercise.id === item.exerciseId)?.name)
            .filter(Boolean)
            .join(" · ") || "Rutina de entrenamiento";
        const actions = document.createElement("div");
        actions.className = "routine-card-actions";
        const routineButton = document.createElement("button");
        routineButton.type = "button";
        routineButton.className = "interface-button-secondary";
        routineButton.setAttribute("aria-expanded", "false");
        routineButton.textContent = "Ver";
        actions.append(routineButton);
        content.append(title, summary, actions);
        card.append(image, content);
        routineContainer.replaceChildren(card);
        if (noRoutineMessage) noRoutineMessage.hidden = true;

        routineButton.addEventListener("click", () => {
            let exerciseList = document.getElementById("assignedRoutineExercises");
            if (!exerciseList) {
                exerciseList = document.createElement("ul");
                exerciseList.id = "assignedRoutineExercises";
                exerciseList.className = "routine-exercise-preview";
                routineItems.forEach((routineItem) => {
                    const exercise = trainingData.exercises.find(item => item.id === routineItem.exerciseId);
                    if (!exercise) return;
                    const item = document.createElement("li");
                    item.textContent = `${exercise.name} — ${routineItem.sets} series × ${routineItem.reps} repeticiones`;
                    exerciseList.append(item);
                });
                content.append(exerciseList);
            }
            const expanded = routineButton.getAttribute("aria-expanded") === "true";
            exerciseList.hidden = expanded;
            routineButton.setAttribute("aria-expanded", String(!expanded));
        });
    } else if (noRoutineMessage) {
        noRoutineMessage.hidden = false;
    }
}

const reviewSection = document.getElementById("memberReview");
if (reviewSection && window.FitPowerReviewData) {
    const review = window.FitPowerReviewData.get(normalizedMemberName);
    const emptyMessage = document.getElementById("memberReviewEmpty");
    const reviewContent = document.getElementById("memberReviewContent");
    const reviewLink = document.getElementById("memberReviewLink");
    const feedback = document.getElementById("memberReviewFeedback");
    feedback.textContent = "";
    reviewLink.href = `../../resenas.html?name=${encodeURIComponent(normalizedMemberName)}&editar=1`;
    if (review) {
        emptyMessage.hidden = true;
        reviewContent.hidden = false;
        document.getElementById("memberReviewRating").textContent = `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`;
        document.getElementById("memberReviewText").textContent = review.text;
        reviewLink.textContent = "Modificar reseña";
    } else {
        emptyMessage.hidden = false;
        reviewContent.hidden = true;
        reviewLink.textContent = "Escribir reseña";
    }

    if (profileQuery.get("resena") === "guardada") {
        feedback.textContent = "Tu reseña fue guardada.";
        profileQuery.delete("resena");
        const queryString = profileQuery.toString();
        window.history.replaceState({}, "", `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`);
    }
}
})();

// Sección: Creación y modificación de reseñas.
(() => {
if (document.getElementById("memberReviewForm")) {
const reviewForm = document.getElementById("memberReviewForm");
const reviewName = document.getElementById("reviewName");
const reviewRating = document.getElementById("reviewRating");
const reviewText = document.getElementById("reviewText");
const reviewFeedback = document.getElementById("reviewFeedback");
const query = new URLSearchParams(window.location.search);
const memberName = query.get("name") || "miau";
const existingReview = window.FitPowerReviewData.get(memberName);
const reviewHeading = document.getElementById("reviewFormHeading");
const submitButton = document.getElementById("reviewSubmit");

reviewName.value = existingReview?.name || memberName;
if (existingReview) {
    reviewRating.value = String(existingReview.rating);
    reviewText.value = existingReview.text;
    reviewHeading.textContent = "Modificar tu reseña";
    submitButton.textContent = "Guardar cambios";
} else if (query.get("editar") === "1") {
    reviewHeading.textContent = "Escribe tu reseña";
}

reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!reviewForm.reportValidity()) return;

    try {
        window.FitPowerReviewData.save(memberName, {
            name: reviewName.value.trim(),
            rating: Number(reviewRating.value),
            text: reviewText.value.trim(),
            updatedAt: new Date().toISOString()
        });
        window.location.href = `roles/usuario/usuario.html?name=${encodeURIComponent(memberName)}&resena=guardada`;
    } catch {
        reviewFeedback.classList.add("is-error");
        reviewFeedback.textContent = "No se pudo guardar tu reseña.";
    }
});

}
})();

