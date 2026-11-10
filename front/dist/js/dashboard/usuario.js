// Panel del socio (/dash/socio). Todo sale de la API.

const SocioUtil = {
    // "2026-11-10" o "2026-11-10 03:00:00" → Date local de ese día
    parseDate(value) {
        const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
        return new Date(year, month - 1, day);
    },

    formatShort(value) {
        if (!value) return "—";
        const [year, month, day] = String(value).slice(0, 10).split("-");
        return `${day}/${month}/${year}`;
    },

    formatLong(date) {
        return new Intl.DateTimeFormat("es-UY", { weekday: "long", day: "numeric", month: "long" }).format(date);
    },

    dateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    },

    capitalize(text) {
        return String(text || "").trim().replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase("es"));
    }
};

// Sección: Perfil y membresía.
(() => {
const greeting = document.getElementById("memberGreeting");
if (!greeting) return;

const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value || "—";
};

API.request("/mi-perfil").then((data) => {
    if (!data?.success) return;
    const user = data.usuario;
    const name = SocioUtil.capitalize(user.name_client);
    greeting.textContent = name ? `Hola, ${name}` : "Hola";
    setText("memberHeaderName", name);
    setText("membershipName", user.membership_name);
    setText("membershipExpiration", SocioUtil.formatShort(user.expiry_date));
    setText("memberSince", SocioUtil.formatShort(user.created_client));

    if (user.has_photo) {
        document.querySelectorAll("[data-profile-photo]").forEach((image) => {
            image.src = `/api/usuarios/${user.id_client}/foto?v=${Date.now()}`;
        });
    }

    // Aviso de vencimiento.
    const expiryNotice = document.getElementById("membershipExpiryNotice");
    if (!expiryNotice) return;
    if (!user.expiry_date) {
        expiryNotice.hidden = false;
        expiryNotice.textContent = "No tenés una membresía activa. Consultá en recepción.";
        expiryNotice.classList.add("is-expired");
        return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = Math.round((SocioUtil.parseDate(user.expiry_date) - today) / 86400000);
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
});
})();

// Sección: Foto de perfil (se achica en el navegador y se guarda en la base).
(() => {
const photoInput = document.getElementById("profilePhotoInput");
if (!photoInput) return;

const photoFeedback = document.getElementById("photoFeedback");
const changePhotoButton = document.getElementById("changePhotoButton");

function showPhotoFeedback(message, isError = false) {
    if (!photoFeedback) return;
    photoFeedback.textContent = message;
    photoFeedback.classList.toggle("is-error", isError);
}

// Recorta al centro en un cuadrado de hasta 400 px y la pasa a JPEG: queda en ~50 KB.
function toSquareJpeg(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            const size = Math.min(image.width, image.height);
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = Math.min(400, size);
            canvas.getContext("2d").drawImage(
                image,
                (image.width - size) / 2, (image.height - size) / 2, size, size,
                0, 0, canvas.width, canvas.height
            );
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("No se pudo leer la imagen seleccionada."));
        };
        image.src = url;
    });
}

changePhotoButton?.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", async () => {
    const [file] = photoInput.files || [];
    photoInput.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showPhotoFeedback("El archivo debe ser una imagen.", true);
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showPhotoFeedback("La imagen debe pesar 10 MB o menos.", true);
        return;
    }

    try {
        showPhotoFeedback("Subiendo foto…");
        const image = await toSquareJpeg(file);
        const data = await API.request("/mi-foto", "PUT", { image });
        if (!data?.success) {
            showPhotoFeedback(data?.message || "No se pudo guardar la foto.", true);
            return;
        }
        document.querySelectorAll("[data-profile-photo]").forEach((element) => {
            element.src = image;
        });
        showPhotoFeedback("Foto actualizada.");
    } catch (error) {
        showPhotoFeedback(error.message, true);
    }
});
})();

// Sección: Próximas clases grupales.
(() => {
const container = document.getElementById("memberClasses");
if (!container) return;

const addLine = (parent, className, text) => {
    const line = document.createElement("span");
    line.className = className;
    line.textContent = text;
    parent.append(line);
};

const showMessage = (text) => {
    const message = document.createElement("p");
    message.textContent = text;
    container.replaceChildren(message);
};

// Próximas fechas de una clase según sus días y horario (desde ahora, hasta 5 semanas).
function upcomingDates(session, now) {
    const [hours, minutes] = session.time.split(":").map(Number);
    const dates = [];
    for (let offset = 0; offset <= 35; offset += 1) {
        const date = new Date(now);
        date.setDate(now.getDate() + offset);
        date.setHours(hours, minutes, 0, 0);
        if (session.days.includes(date.getDay()) && date > now) dates.push(date);
    }
    return dates;
}

// Una tarjeta por clase: datos, asistencia y sus próximas fechas (con avisos).
function createCard(session, dates) {
    const card = document.createElement("article");
    card.className = "clase";

    addLine(card, "nombre-clase", `${session.name_course} · Prof. ${session.teacher_name}`);
    if (session.desc_course) addLine(card, "class-description", session.desc_course);

    const given = session.lessons.filter(lesson => lesson.state_lesson === "given");
    const attended = given.filter(lesson => lesson.assistance).length;
    addLine(card, "class-description", given.length
        ? `Asistencia: ${attended} de ${given.length} encuentros`
        : "Todavía no hubo encuentros.");

    if (!dates.length) {
        addLine(card, "horario-clase", "Sin próximas fechas programadas.");
        return card;
    }

    dates.slice(0, 3).forEach((date) => {
        const lesson = session.lessons.find(item => item.date_lesson === SocioUtil.dateKey(date));
        addLine(card, "horario-clase", `${SocioUtil.formatLong(date)} · ${session.time}`);
        if (lesson?.state_lesson === "cancelled") {
            addLine(card, "class-notice class-notice-cancelled", "Esta clase fue cancelada.");
        } else if (lesson?.desc_lesson) {
            addLine(card, "class-notice", lesson.desc_lesson);
        }
    });
    return card;
}

API.request("/mis-clases").then((data) => {
    if (!data?.success) {
        showMessage(data?.message || "No se pudieron cargar tus clases.");
        return;
    }
    if (!data.clases.length) {
        showMessage("No tienes clases asignadas.");
        return;
    }

    const now = new Date();
    // Ordenadas por la fecha más próxima; las que no tienen fechas van al final.
    const items = data.clases
        .map(session => ({ session, dates: upcomingDates(session, now) }))
        .sort((a, b) => (a.dates[0] ?? Infinity) - (b.dates[0] ?? Infinity));

    container.replaceChildren(...items.map(({ session, dates }) => createCard(session, dates)));
});
})();

// Sección: Mi reseña.
(() => {
const reviewSection = document.getElementById("memberReview");
if (!reviewSection) return;

const emptyMessage = document.getElementById("memberReviewEmpty");
const reviewContent = document.getElementById("memberReviewContent");
const reviewLink = document.getElementById("memberReviewLink");

API.request("/mi-resena").then((data) => {
    const review = data?.success ? data.resena : null;
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
});
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
    image.src = `/front/dist/assets/imagenes/img${(routine.id_routine % 2) + 1}.jpg`;
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
