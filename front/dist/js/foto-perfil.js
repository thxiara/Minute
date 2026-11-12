// Foto de perfil del usuario logueado, para todos los paneles. Va después de api.js.
// El archivo se manda tal cual a PUT /api/mi-foto: el recorte, la conversión a JPG y el
// reemplazo de la foto anterior los hace la API.
(() => {
const SELECTOR_FOTOS = ".usuario-header, .imagen-usuario, [data-profile-photo]";
const fotos = () => document.querySelectorAll(SELECTOR_FOTOS);
let idUsuario = null;

const selector = document.createElement("input");
selector.type = "file";
selector.accept = "image/jpeg,image/png,image/webp,image/gif";
selector.hidden = true;
document.body.append(selector);

let aviso = document.getElementById("photoFeedback");
let ocultarAviso = null;
function mostrarMensaje(texto, esError = false) {
    if (!aviso) {
        aviso = document.createElement("p");
        aviso.className = "foto-perfil-aviso";
        aviso.setAttribute("role", "status");
        document.body.append(aviso);
    }
    aviso.textContent = texto;
    aviso.classList.toggle("is-error", esError);
    aviso.hidden = !texto;
    clearTimeout(ocultarAviso);
    if (aviso.classList.contains("foto-perfil-aviso") && texto) {
        ocultarAviso = setTimeout(() => { aviso.hidden = true; }, 4000);
    }
}

function mostrarFoto() {
    const url = `/api/usuarios/${idUsuario}/foto?v=${Date.now()}`;
    fotos().forEach((imagen) => { imagen.src = url; });
}

function leerArchivo(archivo) {
    return new Promise((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onload = () => resolver(String(lector.result));
        lector.onerror = () => rechazar(new Error("No se pudo leer la imagen seleccionada."));
        lector.readAsDataURL(archivo);
    });
}

document.querySelectorAll(".usuario-header, .imagen-usuario").forEach((imagen) => {
    imagen.classList.add("foto-perfil-editable");
    imagen.tabIndex = 0;
    imagen.setAttribute("role", "button");
    imagen.title = "Cambiar foto de perfil";
    imagen.setAttribute("aria-label", "Cambiar foto de perfil");
    imagen.addEventListener("click", () => selector.click());
    imagen.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            selector.click();
        }
    });
});
document.getElementById("changePhotoButton")?.addEventListener("click", () => selector.click());

selector.addEventListener("change", async () => {
    const [archivo] = selector.files || [];
    selector.value = "";
    if (!archivo) return;

    try {
        mostrarMensaje("Subiendo foto…");
        const datos = await API.request("/mi-foto", "PUT", { image: await leerArchivo(archivo) });
        if (!datos?.success) {
            mostrarMensaje(datos?.message || "No se pudo guardar la foto.", true);
            return;
        }
        idUsuario = datos.id_client ?? idUsuario;
        mostrarFoto();
        mostrarMensaje(datos.message || "Foto actualizada.");
    } catch (error) {
        mostrarMensaje(error.message, true);
    }
});

API.request("/mi-perfil").then((datos) => {
    if (!datos?.success) return;
    idUsuario = datos.usuario.id_client;
    if (datos.usuario.has_photo) mostrarFoto();
});
})();
