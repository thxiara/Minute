// Estado local de las reseñas (sin backend).
//
// La API solo expone el listado público (GET /api/resenas); no hay endpoints para
// eliminar reseñas ni para elegir cuáles van al carrusel de la landing. Por eso esas
// dos cosas se guardan en el navegador (localStorage):
//
//   fitpower:resenas-ocultas   → ids de reseñas que el admin "eliminó" (se ocultan
//                                en este navegador: admin, página pública y landing).
//   fitpower:resenas-carrusel  → ids de reseñas marcadas para el carrusel de la landing
//                                (si no está guardada o está vacía, la landing muestra
//                                las más recientes, como siempre).
//
// Si más adelante la API acepta borrar reseñas y/o un flag "destacada", esto se
// reemplaza por esos endpoints.
(() => {
    const OCULTAS_KEY = "fitpower:resenas-ocultas";
    const CARRUSEL_KEY = "fitpower:resenas-carrusel";

    function leerIds(clave) {
        try {
            const valor = JSON.parse(window.localStorage.getItem(clave) || "[]");
            return Array.isArray(valor) ? valor.map(Number).filter(Number.isFinite) : [];
        } catch {
            return [];
        }
    }

    function guardarIds(clave, ids) {
        try {
            window.localStorage.setItem(clave, JSON.stringify([...new Set(ids.map(Number))]));
            return true;
        } catch {
            return false;
        }
    }

    const store = {
        // Ids de reseñas ocultas/eliminadas desde el admin.
        ocultas() {
            return leerIds(OCULTAS_KEY);
        },

        ocultar(id) {
            const ids = leerIds(OCULTAS_KEY);
            ids.push(Number(id));
            return guardarIds(OCULTAS_KEY, ids);
        },

        mostrar(id) {
            return guardarIds(OCULTAS_KEY, leerIds(OCULTAS_KEY).filter((oculta) => oculta !== Number(id)));
        },

        restablecerOcultas() {
            try {
                window.localStorage.removeItem(OCULTAS_KEY);
                return true;
            } catch {
                return false;
            }
        },

        // Ids elegidos para el carrusel, o null si nunca se configuró (la landing usa las últimas).
        seleccionadas() {
            try {
                return window.localStorage.getItem(CARRUSEL_KEY) === null ? null : leerIds(CARRUSEL_KEY);
            } catch {
                return null;
            }
        },

        toggleSeleccion(id) {
            const actuales = store.seleccionadas() || [];
            const idNum = Number(id);
            const siguientes = actuales.includes(idNum)
                ? actuales.filter((elegida) => elegida !== idNum)
                : [...actuales, idNum];
            return guardarIds(CARRUSEL_KEY, siguientes);
        },

        restablecerSeleccion() {
            try {
                window.localStorage.removeItem(CARRUSEL_KEY);
                return true;
            } catch {
                return false;
            }
        },

        // Filtra las reseñas que deben verse: saca las ocultas y, si hay una selección
        // para el carrusel (no vacía), deja solo las elegidas.
        paraElCarrusel(resenas) {
            const ocultas = store.ocultas();
            let visibles = resenas.filter((resena) => !ocultas.includes(Number(resena.id_review)));
            const seleccion = store.seleccionadas();
            if (Array.isArray(seleccion) && seleccion.length > 0) {
                visibles = visibles.filter((resena) => seleccion.includes(Number(resena.id_review)));
            }
            return visibles;
        },

        // True si hay una selección explícita para el carrusel (la landing baja su mínimo a 1).
        haySeleccionCarrusel() {
            const seleccion = store.seleccionadas();
            return Array.isArray(seleccion) && seleccion.length > 0;
        }
    };

    window.ResenasStore = store;
})();
