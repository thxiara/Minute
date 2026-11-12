// Internacionalización (i18n) del front.
//
// * El sitio está escrito en español: el texto en español ES la clave de traducción.
// * Cada idioma extra tiene un diccionario en /front/dist/i18n/<idioma>.json:
//       { "Texto en español": "Texto traducido", ... }
// * Este script recorre la página y reemplaza los textos (y los atributos placeholder, title,
//   alt, aria-label y data-label) que figuren en el diccionario. También vigila lo que el resto
//   del JavaScript agrega después (filas de tablas, mensajes, modales...), así que los demás
//   scripts siguen escribiendo en español y no necesitan saber nada de idiomas.
// * Los textos con partes variables se cargan en el diccionario con marcas entre llaves:
//       "Hola, {nombre}": "Hello, {nombre}"
//   y coinciden con cualquier texto que tenga esa forma ("Hola, Ana" → "Hello, Ana").
//   Una marca que empieza con # solo coincide con números: "{#n} alumnos" coincide con
//   "3 alumnos" pero no con "Buscar alumnos".
// * Si un texto no está en el diccionario, queda en español.
// * El idioma elegido se guarda en la cookie "lang", que también lee la API para traducir
//   sus mensajes (api/src/Utils/I18n.php).
//
// Para agregar un idioma: sumarlo a IDIOMAS (acá y en api/src/Utils/I18n.php) y crear
// front/dist/i18n/<idioma>.json y api/lang/<idioma>.php.
//
// Para que una parte de la página NO se traduzca: ponerle el atributo data-i18n-skip.
//
// Este script va en el <head> de cada página, antes que los demás.
const I18n = (() => {
    const IDIOMAS = { es: "Español", en: "English" };
    const LOCALES = { es: "es-UY", en: "en-GB" };
    const POR_DEFECTO = "es";
    const COOKIE = "lang";
    const ATRIBUTOS = ["placeholder", "title", "alt", "aria-label", "data-label"];
    const NO_RECORRER = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT", "CODE", "PRE"]);
    const CLASE_CARGANDO = "i18n-cargando";

    const origenScript = document.currentScript?.src || "";

    function leerCookie() {
        const coincidencia = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`));
        return coincidencia ? decodeURIComponent(coincidencia[1]) : "";
    }

    function guardarCookie(idioma) {
        document.cookie = `${COOKIE}=${encodeURIComponent(idioma)}; path=/; max-age=31536000; samesite=lax`;
    }

    function detectar() {
        const guardado = leerCookie();
        if (IDIOMAS[guardado]) return guardado;

        for (const preferido of navigator.languages || [navigator.language || ""]) {
            const codigo = String(preferido).slice(0, 2).toLowerCase();
            if (IDIOMAS[codigo]) return codigo;
        }
        return POR_DEFECTO;
    }

    const idioma = detectar();
    // Se guarda para que el servidor use el mismo idioma que el navegador desde el primer pedido.
    if (leerCookie() !== idioma) guardarCookie(idioma);
    document.documentElement.lang = idioma;

    let exactos = new Map();   // "Texto en español" → "traducción"
    let patrones = [];         // textos con {marcas}: [{ regex, nombres, traduccion }]
    let listo = idioma === POR_DEFECTO;

    const normalizar = texto => texto.replace(/\s+/g, " ").trim();
    const escaparRegex = texto => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const MARCA = /\{(#?[A-Za-z0-9_]+)\}/g;

    function cargarDiccionario(entradas) {
        exactos = new Map();
        patrones = [];
        Object.entries(entradas).forEach(([original, traduccion]) => {
            const clave = normalizar(original);
            if (!clave || typeof traduccion !== "string") return;

            const nombres = [...clave.matchAll(MARCA)].map(marca => marca[1]);
            if (!nombres.length) {
                exactos.set(clave, traduccion);
                return;
            }
            // "Hola, {nombre}" → /^Hola, (.+?)$/      "{#n} alumnos" → /^(\d+) alumnos$/
            const regex = new RegExp(`^${clave.split(MARCA).map((parte, indice) => {
                if (indice % 2 === 0) return escaparRegex(parte);
                return parte.startsWith("#") ? "(\\d+)" : "(.+?)";
            }).join("")}$`, "s");
            patrones.push({ regex, nombres, traduccion, fijo: clave.replace(MARCA, "").length });
        });
        // Primero los patrones con más texto fijo: son los más específicos.
        patrones.sort((a, b) => b.fijo - a.fijo);
    }

    const reemplazarMarcas = (texto, valores) => texto.replace(MARCA, (marca, nombre) => (
        Object.prototype.hasOwnProperty.call(valores, nombre) ? String(valores[nombre]) : marca
    ));

    function buscar(clave) {
        const exacto = exactos.get(clave);
        if (exacto !== undefined) return exacto;

        for (const patron of patrones) {
            const partes = patron.regex.exec(clave);
            if (!partes) continue;
            const valores = {};
            patron.nombres.forEach((nombre, indice) => {
                // El valor variable también puede ser traducible ("Entrenador: {nombre}" no, pero
                // "{dias} · {hora}" sí): se intenta traducir y, si no se puede, queda como vino.
                valores[nombre] = traducirTexto(partes[indice + 1]) ?? partes[indice + 1];
            });
            return reemplazarMarcas(patron.traduccion, valores);
        }
        return null;
    }

    function traducirTexto(clave) {
        if (!clave || !/\p{L}/u.test(clave)) return null;

        const directo = buscar(clave);
        if (directo !== null) return directo;

        // "Lunes, Miércoles · 18:00 · 3 alumnos": cada parte separada por " · " se traduce sola.
        if (clave.includes(" · ")) {
            let cambio = false;
            const partes = clave.split(" · ").map((parte) => {
                const traducida = traducirTexto(parte);
                if (traducida !== null) cambio = true;
                return traducida ?? parte;
            });
            return cambio ? partes.join(" · ") : null;
        }

        // "Lunes, Miércoles, Viernes": una lista se traduce solo si se pueden traducir TODOS
        // sus elementos (así no se toca a medias un texto escrito por un usuario).
        if (clave.includes(", ")) {
            const partes = clave.split(", ").map(parte => buscar(parte));
            if (partes.every(parte => parte !== null)) return partes.join(", ");
        }
        return null;
    }

    // Conserva los espacios de los costados del texto original (importan entre elementos).
    function traducirConEspacios(valor) {
        const traduccion = traducirTexto(normalizar(valor));
        if (traduccion === null) return null;
        return valor.match(/^\s*/)[0] + traduccion + valor.match(/\s*$/)[0];
    }

    // Lo último que este script escribió en cada nodo/atributo: evita volver a procesar
    // sus propios cambios cuando el observador avisa de ellos.
    const escritos = new WeakMap();

    const omitido = elemento => Boolean(elemento?.closest?.("[data-i18n-skip], [translate='no']"));

    function traducirNodoDeTexto(nodo) {
        const valor = nodo.nodeValue;
        if (!valor || escritos.get(nodo) === valor) return;
        const padre = nodo.parentElement;
        if (!padre || NO_RECORRER.has(padre.tagName) || omitido(padre)) return;

        const traduccion = traducirConEspacios(valor);
        if (traduccion === null || traduccion === valor) return;
        escritos.set(nodo, traduccion);
        nodo.nodeValue = traduccion;
    }

    function traducirAtributos(elemento) {
        if (omitido(elemento)) return;
        ATRIBUTOS.forEach((atributo) => {
            const valor = elemento.getAttribute(atributo);
            if (!valor) return;
            const anteriores = escritos.get(elemento);
            if (anteriores?.[atributo] === valor) return;

            const traduccion = traducirConEspacios(valor);
            if (traduccion === null || traduccion === valor) return;
            escritos.set(elemento, { ...anteriores, [atributo]: traduccion });
            elemento.setAttribute(atributo, traduccion);
        });
        // Botones hechos con <input>: su texto está en value.
        if (elemento.tagName === "INPUT" && ["button", "submit", "reset"].includes(elemento.type)) {
            const traduccion = traducirConEspacios(elemento.value);
            if (traduccion !== null) elemento.value = traduccion;
        }
    }

    function traducirArbol(raiz) {
        if (raiz.nodeType === Node.TEXT_NODE) {
            traducirNodoDeTexto(raiz);
            return;
        }
        if (raiz.nodeType !== Node.ELEMENT_NODE) return;

        traducirAtributos(raiz);
        if (NO_RECORRER.has(raiz.tagName)) return;
        const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
            acceptNode: (nodo) => {
                if (nodo.nodeType !== Node.ELEMENT_NODE || !NO_RECORRER.has(nodo.tagName)) return NodeFilter.FILTER_ACCEPT;
                // De estos elementos no se toca el contenido, pero sí sus atributos
                // (ej. el placeholder de un <textarea>).
                traducirAtributos(nodo);
                return NodeFilter.FILTER_REJECT;
            }
        });
        while (recorrido.nextNode()) {
            const nodo = recorrido.currentNode;
            if (nodo.nodeType === Node.TEXT_NODE) traducirNodoDeTexto(nodo);
            else traducirAtributos(nodo);
        }
    }

    function observar() {
        new MutationObserver((cambios) => {
            cambios.forEach((cambio) => {
                if (cambio.type === "childList") cambio.addedNodes.forEach(traducirArbol);
                else if (cambio.type === "characterData") traducirNodoDeTexto(cambio.target);
                else traducirAtributos(cambio.target);
            });
        }).observe(document.documentElement, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATRIBUTOS
        });
    }

    // window.confirm / alert / prompt muestran texto fuera de la página: se traducen acá.
    function traducirDialogos() {
        ["alert", "confirm", "prompt"].forEach((nombre) => {
            const original = window[nombre].bind(window);
            window[nombre] = (mensaje, ...resto) => original(t(String(mensaje ?? "")), ...resto);
        });
    }

    const ESTILOS = `
        html.${CLASE_CARGANDO} body { visibility: hidden; }
        .i18n-selector {
            position: fixed; left: 12px; bottom: 12px; z-index: 2000;
            display: flex; gap: 2px; padding: 3px;
            background: rgba(20, 20, 20, .88); border: 1px solid rgba(255, 255, 255, .25);
            border-radius: 999px; box-shadow: 0 2px 8px rgba(0, 0, 0, .35);
            font: 600 12px/1 system-ui, sans-serif;
        }
        .i18n-selector button {
            all: unset; box-sizing: border-box; cursor: pointer;
            min-width: 34px; padding: 7px 9px; border-radius: 999px;
            color: #ddd; text-align: center; letter-spacing: .04em;
        }
        .i18n-selector button:hover { color: #fff; background: rgba(255, 255, 255, .14); }
        .i18n-selector button:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
        .i18n-selector button[aria-pressed="true"] { background: #fff; color: #111; }
        @media print { .i18n-selector { display: none; } }
    `;

    function agregarEstilos() {
        const estilos = document.createElement("style");
        estilos.textContent = ESTILOS;
        document.head.append(estilos);
    }

    // Botones "ES | EN". Van dentro de un elemento con data-i18n-selector si la página tiene
    // uno; si no, en una pastilla flotante abajo a la izquierda.
    function agregarSelector() {
        if (document.querySelector(".i18n-selector")) return;
        const selector = document.createElement("div");
        selector.className = "i18n-selector";
        selector.setAttribute("role", "group");
        selector.setAttribute("aria-label", "Idioma / Language");
        selector.setAttribute("data-i18n-skip", "");

        Object.entries(IDIOMAS).forEach(([codigo, nombre]) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.textContent = codigo.toUpperCase();
            boton.title = nombre;
            boton.lang = codigo;
            boton.setAttribute("aria-label", nombre);
            boton.setAttribute("aria-pressed", String(codigo === idioma));
            boton.addEventListener("click", () => cambiar(codigo));
            selector.append(boton);
        });

        const lugar = document.querySelector("[data-i18n-selector]");
        if (lugar) {
            selector.style.position = "static";
            lugar.append(selector);
        } else {
            document.body.append(selector);
        }
    }

    // Traduce un texto desde JavaScript. Los valores variables van como {marcas}:
    //     I18n.t("Hola, {nombre}", { nombre: "Ana" })
    // Casi nunca hace falta llamarla: lo que se escribe en la página se traduce solo.
    function t(texto, valores = {}) {
        const original = String(texto);
        const plantilla = exactos.get(normalizar(original));
        if (plantilla !== undefined) return reemplazarMarcas(plantilla, valores);
        const completo = reemplazarMarcas(original, valores);
        return traducirTexto(normalizar(completo)) ?? completo;
    }

    // Cambia el idioma y recarga, así también el servidor responde en el idioma nuevo.
    function cambiar(nuevo) {
        if (!IDIOMAS[nuevo] || nuevo === idioma) return;
        guardarCookie(nuevo);
        window.location.reload();
    }

    const alCargarLaPagina = accion => (document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", accion, { once: true })
        : accion());

    agregarEstilos();
    alCargarLaPagina(agregarSelector);

    // Se resuelve cuando la página ya quedó traducida (enseguida si el idioma es español).
    const lista = new Promise((resolver) => {
        if (idioma === POR_DEFECTO) {
            resolver();
            return;
        }

        // La página queda oculta hasta traducirla, para que no se vea primero en español...
        const raiz = document.documentElement;
        raiz.classList.add(CLASE_CARGANDO);
        const mostrar = () => {
            raiz.classList.remove(CLASE_CARGANDO);
            resolver();
        };
        // ...pero nunca más de un rato: si el diccionario no llega, se muestra en español.
        const limite = setTimeout(mostrar, 2500);

        const url = origenScript
            ? new URL(`../i18n/${idioma}.json`, origenScript)
            : `/front/dist/i18n/${idioma}.json`;

        fetch(url)
            .then((respuesta) => {
                if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
                return respuesta.json();
            })
            .then((entradas) => {
                cargarDiccionario(entradas);
                listo = true;
                traducirDialogos();
                alCargarLaPagina(() => {
                    traducirArbol(document.documentElement);
                    observar();
                    clearTimeout(limite);
                    mostrar();
                });
            })
            .catch((error) => {
                console.error(`i18n: no se pudo cargar el diccionario "${idioma}".`, error);
                clearTimeout(limite);
                mostrar();
            });
    });

    return {
        idioma,                              // "es" | "en"
        idiomas: { ...IDIOMAS },
        locale: LOCALES[idioma] || LOCALES[POR_DEFECTO],   // para Intl.DateTimeFormat y similares
        lista,
        get listo() { return listo; },
        t,
        cambiar
    };
})();
window.I18n = I18n;
