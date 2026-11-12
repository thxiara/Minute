// Visor
// Visor de imágenes en grande. Cualquier <img data-zoom> se abre a pantalla completa al tocarla
// (sirve también para las que el JavaScript agrega después, como los gifs de los ejercicios).
// Se cierra con Escape, con el botón × o tocando afuera de la imagen.
(() => {
const fondo = document.createElement("div");
fondo.className = "visor-imagen";
fondo.hidden = true;
fondo.setAttribute("role", "dialog");
fondo.setAttribute("aria-modal", "true");
fondo.setAttribute("aria-label", "Imagen ampliada");

const cerrar = document.createElement("button");
cerrar.type = "button";
cerrar.className = "visor-imagen-cerrar";
cerrar.setAttribute("aria-label", "Cerrar");
cerrar.textContent = "×";

const imagen = document.createElement("img");
const leyenda = document.createElement("p");
leyenda.className = "visor-imagen-leyenda";
fondo.append(cerrar, imagen, leyenda);
document.body.append(fondo);

let anterior = null;

function abrir(origen) {
    anterior = document.activeElement;
    imagen.src = origen.currentSrc || origen.src;
    imagen.alt = origen.alt;
    leyenda.textContent = origen.alt;
    fondo.hidden = false;
    document.body.style.overflow = "hidden";
    cerrar.focus();
}

function ocultar() {
    fondo.hidden = true;
    imagen.removeAttribute("src");
    document.body.style.overflow = "";
    anterior?.focus?.();
}

document.addEventListener("click", (evento) => {
    const origen = evento.target.closest("img[data-zoom]");
    if (origen) {
        evento.preventDefault();
        evento.stopPropagation();
        abrir(origen);
    }
}, true);
document.addEventListener("keydown", (evento) => {
    const origen = evento.target.closest?.("img[data-zoom]");
    if (origen && (evento.key === "Enter" || evento.key === " ")) {
        evento.preventDefault();
        abrir(origen);
    } else if (evento.key === "Escape" && !fondo.hidden) {
        ocultar();
    }
});
fondo.addEventListener("click", (evento) => {
    if (evento.target !== imagen) ocultar();
});

const preparar = (raiz) => raiz.querySelectorAll?.("img[data-zoom]:not([tabindex])").forEach((img) => {
    img.tabIndex = 0;
    img.title = img.title || "Ver en grande";
});
preparar(document);
new MutationObserver(cambios => cambios.forEach(c => c.addedNodes.forEach(n => {
    if (n.nodeType !== 1) return;
    if (n.matches("img[data-zoom]")) preparar(n.parentElement); else preparar(n);
}))).observe(document.body, { childList: true, subtree: true });
})();
