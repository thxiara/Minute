// Carrusel
// Carrusel de reseñas de la landing. Si en la base hay al menos dos reseñas, se muestran
// esas; si no, quedan las de ejemplo que trae el HTML.
(async () => {
const slider = document.querySelector(".slider");
if (!slider) return;

const arriba = document.querySelector(".izquierda");
const abajo = document.querySelector(".derecha");
const visibles = 2;
const fotos = ["img7.jpg", "img3.jpg", "img8.jpg"];

function crearComentario(resena, indice) {
    const comentario = document.createElement("div");
    comentario.className = "comentario";

    const imagen = document.createElement("img");
    imagen.src = resena.photo || `/front/dist/assets/imagenes/${fotos[indice % fotos.length]}`;
    imagen.alt = "Socio";

    const contenido = document.createElement("div");
    contenido.className = "contenido";
    const nombre = document.createElement("h3");
    nombre.textContent = resena.name;
    const estrellas = document.createElement("span");
    estrellas.textContent = `${"★".repeat(resena.rating)}${"☆".repeat(5 - resena.rating)}`;
    const texto = document.createElement("p");
    texto.textContent = resena.text;
    contenido.append(nombre, estrellas, texto);

    comentario.append(imagen, contenido);
    return comentario;
}

if (window.API) {
    const data = await API.request("/resenas");
    if (data?.success && data.resenas.length >= visibles) {
        slider.replaceChildren(...data.resenas.slice(0, 10).map(crearComentario));
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
