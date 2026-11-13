// Catálogo
// Catálogo de productos: habla con la API (/api/productos). Cada función devuelve una
// promesa y, si la API responde con error, la rechaza con el mensaje que mandó el servidor.
(() => {
    async function call(endpoint, method = "GET", body = null) {
        const data = await API.request(endpoint, method, body);
        if (!data?.success) {
            throw new Error(data?.message || "No se pudo conectar con el servidor.");
        }
        return data;
    }

    window.ProductosStore = {
        async list() {
            return (await call("/productos")).productos;
        },

        async get(id) {
            return (await call(`/productos/${encodeURIComponent(id)}`)).producto;
        },

        async create(product) {
            return (await call("/productos", "POST", product)).producto;
        },

        async update(id, product) {
            return (await call(`/productos/${encodeURIComponent(id)}`, "PUT", product)).producto;
        },

        async remove(id) {
            await call(`/productos/${encodeURIComponent(id)}`, "DELETE");
        },

        // image: data URL ("data:image/...;base64,..."). Devuelve el producto actualizado.
        async uploadImage(id, image) {
            return (await call(`/productos/${encodeURIComponent(id)}/imagen`, "PUT", { image })).producto;
        }
    };
})();
