// Carrusel de reseñas de la landing. Si la base tiene reseñas, se muestran las que el
// admin dejó elegidas en el panel de reseñas (o las más recientes si no eligió ninguna);
// si no alcanza, quedan las de ejemplo que trae el HTML.
(async () => {
const slider = document.querySelector(".slider");
if (!slider) return;

const arriba = document.querySelector(".izquierda");
const abajo = document.querySelector(".derecha");
const visibles = 2;
// Foto genérica para quien no subió foto de perfil (la misma que usa el resto del sitio).
const FOTO_POR_DEFECTO = "/front/dist/assets/imagenes/img6.jpg";

function crearComentario(resena) {
    const comentario = document.createElement("div");
    comentario.className = "comentario";

    const imagen = document.createElement("img");
    // Foto de perfil de quien escribió la reseña.
    imagen.src = resena.photo || FOTO_POR_DEFECTO;
    imagen.alt = "Socio";
    imagen.addEventListener("error", () => {
        if (!imagen.src.endsWith(FOTO_POR_DEFECTO)) imagen.src = FOTO_POR_DEFECTO;
    }, { once: true });

    const contenido = document.createElement("div");
    contenido.className = "contenido";
    const nombre = document.createElement("h3");
    nombre.textContent = resena.name;
    const estrellas = document.createElement("span");
    estrellas.textContent = `${"★".repeat(resena.rating)}${"☆".repeat(5 - resena.rating)}`;
    const texto = document.createElement("p");
    texto.textContent = resena.text;
    // Lo que escribió el socio se muestra tal cual: ni i18n.js ni el traductor del navegador lo tocan.
    texto.dataset.i18nSkip = "";
    texto.translate = false;
    contenido.append(nombre, estrellas, texto);

    comentario.append(imagen, contenido);
    return comentario;
}

// El toggle de idioma (botón único ES/EN) lo inyecta i18n.js en el header de todas las páginas.

// Ocultar avatar si no hay sesión (el servidor lo renderiza siempre con la img por defecto,
// así que la señal es {{acceso_url}}: "/login" = sin sesión, "/dash" = con sesión).
const usuarioHeader = document.querySelector(".usuario-header");
if (usuarioHeader) {
    const accesoHref = document.getElementById("accesoBtn")?.getAttribute("href") || "";
    // En el preview estático los {{...}} llegan sin procesar: también cuenta como "sin sesión".
    const sinSesion = accesoHref.trim() === ""
        || accesoHref.includes("{{")
        || accesoHref.endsWith("/login");
    if (sinSesion) {
        usuarioHeader.style.display = "none";
    }
}

    if (typeof API === "undefined") return; // api.js no está disponible en esta página
    const data = await API.request("/resenas");
    if (data?.success && Array.isArray(data.resenas)) {
        // Respeta el panel de reseñas del admin: oculta las eliminadas y acota a las elegidas.
        const resenas = window.ResenasStore ? window.ResenasStore.paraElCarrusel(data.resenas) : data.resenas;
        const minimo = window.ResenasStore?.haySeleccionCarrusel() ? 1 : visibles;
        if (resenas.length >= minimo) {
            slider.replaceChildren(...resenas.slice(0, 10).map((resena) => crearComentario(resena)));
        }
    }

const comentarios = slider.querySelectorAll(".comentario");
let actual = 0;

function mover() {
    if (!comentarios.length) return;
    const estilo = window.getComputedStyle(comentarios[0]);
    const margen = parseInt(estilo.marginBottom, 10) || 0;
    const altura = comentarios[0].offsetHeight + margen + 20;
    slider.style.transform = `translateY(-${actual * altura}px)`;
}

function siguiente() {
    actual = actual < comentarios.length - visibles ? actual + 1 : 0;
    mover();
}

function anterior() {
    actual = actual > 0 ? actual - 1 : Math.max(0, comentarios.length - visibles);
    mover();
}

abajo?.addEventListener("click", siguiente);
arriba?.addEventListener("click", anterior);
setInterval(siguiente, 5000);

if (document.readyState === "complete") mover();
else window.addEventListener("load", mover);
window.addEventListener("resize", mover);
})();
