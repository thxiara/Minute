// Dashboard de reseñas (admin): lista todas las reseñas, permite "eliminarlas"
// (ocultarlas en este navegador, porque la API no tiene un endpoint para borrar)
// y marcar/desmarcar cuáles aparecen en el carrusel de la landing.
// El estado se guarda en localStorage vía ResenasStore (ver js/resenas-store.js).
(() => {
    if (typeof API === "undefined" || !window.ResenasStore) {
        console.error("No se pudo inicializar el panel de reseñas.");
        return;
    }

    const grid = document.getElementById("reviewsAdminList");
    if (!grid) return;

    const statTotal = document.getElementById("reviewsStatTotal");
    const statAverage = document.getElementById("reviewsStatAverage");
    const statCarousel = document.getElementById("reviewsStatCarousel");
    const selectionSummary = document.getElementById("reviewsSelectionSummary");
    const searchInput = document.getElementById("reviewsSearch");
    const emptyMessage = document.getElementById("reviewsEmpty");
    const feedback = document.getElementById("reviewsFeedback");
    const toggleHiddenButton = document.getElementById("reviewsToggleHidden");
    const clearSelectionButton = document.getElementById("reviewsClearSelection");

    const store = window.ResenasStore;
    const FOTO_POR_DEFECTO = "/front/dist/assets/imagenes/img6.jpg";
    let resenas = [];
    let mostrarOcultas = false;

    const normalizar = (texto) => String(texto || "")
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

    const stars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

    function formatDate(updated) {
        const fecha = new Date(String(updated || "").replace(" ", "T"));
        if (Number.isNaN(fecha.getTime())) return String(updated || "");
        return fecha.toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" });
    }

    function showFeedback(texto, esError = false) {
        feedback.classList.toggle("is-error", esError);
        feedback.textContent = texto;
    }

    function createCard(resena) {
        const oculta = store.ocultas().includes(Number(resena.id_review));
        const seleccionadas = store.seleccionadas();
        const elegida = Array.isArray(seleccionadas) && seleccionadas.includes(Number(resena.id_review));

        const card = document.createElement("article");
        card.className = "review-admin-card" + (oculta ? " is-hidden-review" : "");
        card.dataset.reviewCard = String(resena.id_review);

        const photo = document.createElement("img");
        photo.className = "review-admin-photo";
        photo.src = resena.photo || FOTO_POR_DEFECTO;
        photo.alt = "Foto de quien escribió la reseña";
        photo.addEventListener("error", () => {
            if (!photo.src.endsWith(FOTO_POR_DEFECTO)) photo.src = FOTO_POR_DEFECTO;
        }, { once: true });

        const body = document.createElement("div");
        body.className = "review-admin-body";

        const head = document.createElement("div");
        head.className = "review-admin-head";
        const name = document.createElement("span");
        name.className = "review-admin-name";
        name.textContent = resena.name || "Socio";
        const starsSpan = document.createElement("span");
        starsSpan.className = "review-admin-stars";
        starsSpan.textContent = stars(resena.rating);
        const date = document.createElement("span");
        date.className = "review-admin-date";
        date.textContent = formatDate(resena.updated);
        head.append(name, starsSpan, date);

        const text = document.createElement("p");
        text.className = "review-admin-text";
        text.textContent = resena.text || "";
        // Lo que escribió el socio se muestra tal cual, sin traducir.
        text.dataset.i18nSkip = "";
        text.translate = false;

        const actions = document.createElement("div");
        actions.className = "review-admin-actions";

        const toggle = document.createElement("label");
        toggle.className = "review-admin-toggle";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = elegida;
        checkbox.disabled = oculta;
        checkbox.setAttribute("aria-label", `Mostrar la reseña de ${resena.name || "Socio"} en el carrusel`);
        checkbox.addEventListener("change", () => {
            if (!store.toggleSeleccion(resena.id_review)) {
                checkbox.checked = !checkbox.checked;
                showFeedback("No se pudo guardar la selección.", true);
                return;
            }
            updateStats();
            showFeedback("Selección actualizada.");
        });
        const toggleText = document.createElement("span");
        toggleText.textContent = "En el carrusel";
        toggle.append(checkbox, toggleText);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "review-admin-delete" + (oculta ? " is-restore" : "");
        deleteButton.textContent = oculta ? "Restaurar" : "Eliminar";
        deleteButton.addEventListener("click", () => {
            if (oculta) {
                store.mostrar(resena.id_review);
                render();
                showFeedback("Reseña restaurada.");
                return;
            }
            const confirmar = window.confirm(`¿Eliminar la reseña de ${resena.name || "este socio"}? Se ocultará solo en este navegador.`);
            if (!confirmar) return;
            if (!store.ocultar(resena.id_review)) {
                showFeedback("No se pudo eliminar la reseña.", true);
                return;
            }
            render();
            showFeedback("Reseña eliminada.");
        });

        actions.append(toggle, deleteButton);
        body.append(head, text, actions);
        card.append(photo, body);
        return card;
    }

    function matchesQuery(resena, query) {
        if (!query) return true;
        return normalizar(`${resena.name} ${resena.text}`).includes(query);
    }

    function visibleReviews() {
        const ocultas = store.ocultas();
        return resenas.filter((resena) => !ocultas.includes(Number(resena.id_review)));
    }

    function updateStats() {
        const visibles = visibleReviews();
        statTotal.textContent = String(visibles.length);
        statAverage.textContent = visibles.length
            ? `${(visibles.reduce((suma, r) => suma + r.rating, 0) / visibles.length).toFixed(1)} ★`
            : "—";

        const seleccionadas = store.seleccionadas();
        const haySeleccion = Array.isArray(seleccionadas) && seleccionadas.length > 0;
        const elegidasVisibles = haySeleccion
            ? visibles.filter((resena) => seleccionadas.includes(Number(resena.id_review))).length
            : Math.min(10, visibles.length);
        statCarousel.textContent = String(elegidasVisibles);
        clearSelectionButton.hidden = !(Array.isArray(seleccionadas) && seleccionadas.length > 0);

        const ocultas = store.ocultas();
        toggleHiddenButton.hidden = ocultas.length === 0;
        toggleHiddenButton.textContent = mostrarOcultas
            ? `Ocultar eliminadas (${ocultas.length})`
            : `Mostrar eliminadas (${ocultas.length})`;

        selectionSummary.textContent = haySeleccion
            ? "Hay una selección para el carrusel."
            : "Sin selección: el carrusel muestra las más recientes."
    }

    function render() {
        const query = normalizar(searchInput.value);
        const ocultas = store.ocultas();
        const base = mostrarOcultas ? resenas : visibleReviews();
        const filtradas = base.filter((resena) => matchesQuery(resena, query));

        grid.replaceChildren(...filtradas.map(createCard));
        emptyMessage.hidden = filtradas.length > 0;
        emptyMessage.textContent = resenas.length && query
            ? "No se encontraron reseñas."
            : "No hay reseñas.";
        updateStats();
    }

    searchInput.addEventListener("input", render);

    toggleHiddenButton.addEventListener("click", () => {
        mostrarOcultas = !mostrarOcultas;
        render();
    });

    clearSelectionButton.addEventListener("click", () => {
        if (!store.restablecerSeleccion()) {
            showFeedback("No se pudo restablecer la selección.", true);
            return;
        }
        render();
        showFeedback("Selección restablecida.");
    });

    async function load() {
        selectionSummary.textContent = "Cargando reseñas…";
        const data = await API.request("/resenas");
        if (!data?.success) {
            showFeedback(data?.message || "No se pudieron cargar las reseñas.", true);
            selectionSummary.textContent = "";
            emptyMessage.hidden = false;
            emptyMessage.textContent = "No se pudieron cargar las reseñas.";
            return;
        }
        resenas = Array.isArray(data.resenas) ? data.resenas : [];
        render();
    }

    load();
})();
