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

// Sección: Perfil, vencimiento, clases y rutinas del socio.
(async () => {
const sessionData = await (window.FitPowerSessionReady || Promise.resolve(null));
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
const memberName = (sessionData?.success && sessionData.logged_in ? sessionData.name : "")
    || profileQuery.get("name")
    || "";
const normalizedMemberName = memberName.trim().toLocaleLowerCase("es");
const displayMemberName = memberName.trim().replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase("es"));
if (memberClassesContainer) memberClassesContainer.dataset.memberName = normalizedMemberName;
document.getElementById("memberHeaderName")?.replaceChildren(document.createTextNode(displayMemberName));
document.getElementById("memberGreeting")?.replaceChildren(
    document.createTextNode(displayMemberName ? `Hola, ${displayMemberName}` : "Hola")
);

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

const reviewSection = document.getElementById("memberReview");
if (reviewSection && window.FitPowerReviewData) {
    const review = window.FitPowerReviewData.get(normalizedMemberName);
    const emptyMessage = document.getElementById("memberReviewEmpty");
    const reviewContent = document.getElementById("memberReviewContent");
    const reviewLink = document.getElementById("memberReviewLink");
    const feedback = document.getElementById("memberReviewFeedback");
    feedback.textContent = "";
    reviewLink.href = normalizedMemberName
        ? `paginas/resenas.html?name=${encodeURIComponent(normalizedMemberName)}&editar=1`
        : "paginas/resenas.html?editar=1";
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
(async () => {
if (document.getElementById("memberReviewForm")) {
const reviewForm = document.getElementById("memberReviewForm");
const reviewName = document.getElementById("reviewName");
const reviewRating = document.getElementById("reviewRating");
const reviewText = document.getElementById("reviewText");
const reviewFeedback = document.getElementById("reviewFeedback");
const query = new URLSearchParams(window.location.search);
const sessionData = await (window.FitPowerSessionReady || Promise.resolve(null));
const memberName = query.get("name") || (sessionData?.success && sessionData.logged_in ? sessionData.name : "") || "";
const existingReview = memberName ? window.FitPowerReviewData.get(memberName) : null;
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
        const reviewerName = reviewName.value.trim();
        window.FitPowerReviewData.save(reviewerName, {
            name: reviewerName,
            rating: Number(reviewRating.value),
            text: reviewText.value.trim(),
            updatedAt: new Date().toISOString()
        });
        window.location.href = `/dash/socio?name=${encodeURIComponent(reviewerName)}&resena=guardada`;
    } catch {
        reviewFeedback.classList.add("is-error");
        reviewFeedback.textContent = "No se pudo guardar tu reseña.";
    }
});

}
})();

// Sección: Rutinas asignadas (vienen de la base, las asigna el entrenador).
(() => {
const routineContainer = document.getElementById("memberRoutine");
if (!routineContainer) return;

const noRoutineMessage = document.getElementById("noAssignedRoutine");
const routineCount = document.getElementById("routineCount");

function createRoutineCard(routine) {
    const card = document.createElement("article");
    card.className = "routine-preview-card";

    const image = document.createElement("img");
    image.className = "routine-preview-image";
    image.src = `assets/imagenes/img${(routine.id_routine % 2) + 1}.jpg`;
    image.alt = `Vista previa de ${routine.name_routine}`;
    image.loading = "lazy";

    const content = document.createElement("div");
    content.className = "routine-preview-content";
    const title = document.createElement("h2");
    title.textContent = routine.name_routine;
    const trainer = document.createElement("p");
    trainer.textContent = `Entrenador: ${routine.trainer_name}`;
    const summary = document.createElement("p");
    summary.textContent = routine.items.map(item => item.exercise_name).join(" · ") || "Rutina de entrenamiento";

    const exerciseList = document.createElement("ul");
    exerciseList.className = "routine-exercise-preview";
    exerciseList.hidden = true;
    routine.items.forEach((item) => {
        const line = document.createElement("li");
        line.textContent = `${item.exercise_name} — ${item.sets} series × ${item.reps} repeticiones`;
        exerciseList.append(line);
    });

    const actions = document.createElement("div");
    actions.className = "routine-card-actions";
    const routineButton = document.createElement("button");
    routineButton.type = "button";
    routineButton.className = "interface-button-secondary";
    routineButton.setAttribute("aria-expanded", "false");
    routineButton.textContent = "Ver";
    routineButton.addEventListener("click", () => {
        const expanded = routineButton.getAttribute("aria-expanded") === "true";
        exerciseList.hidden = expanded;
        routineButton.setAttribute("aria-expanded", String(!expanded));
        routineButton.textContent = expanded ? "Ver" : "Ocultar";
    });
    actions.append(routineButton);

    content.append(title, trainer, summary, actions, exerciseList);
    card.append(image, content);
    return card;
}

(async () => {
    const data = await API.request("/mis-rutinas");
    if (!data.success) {
        if (routineCount) routineCount.textContent = "—";
        if (noRoutineMessage) {
            noRoutineMessage.textContent = data.message || "No se pudieron cargar tus rutinas.";
            noRoutineMessage.hidden = false;
        }
        return;
    }

    if (routineCount) routineCount.textContent = String(data.total);
    routineContainer.replaceChildren(...data.rutinas.map(createRoutineCard));
    if (noRoutineMessage) noRoutineMessage.hidden = data.total > 0;
})();
})();
