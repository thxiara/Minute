// Reseñas
// Página pública de reseñas (/resenas): lista las reseñas de la base y,
// si quien entra es un socio, le deja escribir o modificar la suya.
(() => {
const list = document.getElementById("reviewsList");
const form = document.getElementById("memberReviewForm");
const loginHint = document.getElementById("reviewLoginHint");
const isMember = document.body.dataset.esSocio === "1";

const stars = rating => `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;

function createCard(review) {
    const column = document.createElement("div");
    column.className = "col-md-6 col-lg-4";
    const card = document.createElement("div");
    card.className = "review-card h-100";

    const image = document.createElement("img");
    image.src = review.photo || "/front/dist/assets/imagenes/img6.jpg";
    image.className = "review-photo";
    image.alt = "Socio";

    const content = document.createElement("div");
    content.className = "contenido";
    const name = document.createElement("h3");
    name.textContent = review.name;
    const rating = document.createElement("span");
    rating.textContent = stars(review.rating);
    const text = document.createElement("p");
    text.textContent = review.text;
    content.append(name, rating, text);

    card.append(image, content);
    column.append(card);
    return column;
}

function showMessage(text) {
    const message = document.createElement("p");
    message.className = "text-center";
    message.textContent = text;
    list.replaceChildren(message);
}

async function loadReviews() {
    window.Skeleton?.cards(list, 6);
    let data;
    try {
        data = await API.request("/resenas");
    } catch (error) {
        showMessage(error.message || "No se pudieron cargar las reseñas.");
        return;
    }
    if (!data?.success) {
        showMessage(data?.message || "No se pudieron cargar las reseñas.");
        return;
    }
    if (!data.resenas.length) {
        showMessage("Todavía no hay reseñas. ¡Sé el primero en escribir una!");
        return;
    }
    list.replaceChildren(...data.resenas.map(createCard));
}

loadReviews();

if (!isMember) {
    loginHint.hidden = false;
    return;
}

// Formulario del socio.
form.hidden = false;
const ratingInput = document.getElementById("reviewRating");
const textInput = document.getElementById("reviewText");
const feedback = document.getElementById("reviewFeedback");
const heading = document.getElementById("reviewFormHeading");
const submit = document.getElementById("reviewSubmit");

API.request("/mi-resena").then((data) => {
    if (!data?.success || !data.resena) return;
    ratingInput.value = String(data.resena.rating);
    textInput.value = data.resena.text;
    heading.textContent = "Modificar tu reseña";
    submit.textContent = "Guardar cambios";
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    submit.disabled = true;
    const data = await API.request("/mi-resena", "PUT", {
        rating: Number(ratingInput.value),
        text: textInput.value.trim()
    });
    submit.disabled = false;

    feedback.classList.toggle("is-error", !data?.success);
    feedback.textContent = data?.message || "No se pudo guardar tu reseña.";
    if (window.Toast) {
        window.Toast.show(data?.message || "No se pudo guardar tu reseña.", data?.success ? "success" : "error");
    }
    if (data?.success) {
        heading.textContent = "Modificar tu reseña";
        submit.textContent = "Guardar cambios";
        loadReviews();
    }
});
})();
