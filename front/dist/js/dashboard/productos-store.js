(() => {
    const storageKey = "fitpowerProducts";
    const initialProducts = [
        { id: "whey", name: "Whey protein 1kg", category: "Suplementos", price: 1800, stock: 20 },
        { id: "shaker", name: "Shaker FitPower", category: "Accesorio", price: 490, stock: 4 },
        { id: "bands", name: "Bandas elásticas", category: "Accesorio", price: 690, stock: 18 },
        { id: "gloves", name: "Guantes de entrenamiento", category: "Accesorio", price: 890, stock: 0 }
    ];

    function readProducts() {
        const stored = localStorage.getItem(storageKey);

        if (stored === null) {
            writeProducts(initialProducts);
            return initialProducts.map(product => ({ ...product }));
        }

        const products = JSON.parse(stored);
        if (!Array.isArray(products) || products.some(product =>
            !product || typeof product.id !== "string" ||
            typeof product.name !== "string" ||
            typeof product.category !== "string" ||
            !Number.isFinite(product.price) ||
            !Number.isInteger(product.stock) || product.stock < 0
        )) {
            throw new TypeError("Los datos del catálogo de productos tienen un formato inválido.");
        }

        let placeholdersRemoved = false;
        products.forEach(product => {
            if (typeof product.description === "string" && /^n\/a\.?$/i.test(product.description.trim())) {
                product.description = "";
                placeholdersRemoved = true;
            }
        });
        if (placeholdersRemoved) writeProducts(products);

        return products;
    }

    function writeProducts(products) {
        localStorage.setItem(storageKey, JSON.stringify(products));
    }

    function createId() {
        if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
        return `product-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function validateProduct(product) {
        const name = String(product.name || "").trim();
        const category = String(product.category || "").trim();
        const price = Number(product.price);
        const stock = Number(product.stock);

        if (!name) throw new TypeError("Ingresa el nombre del producto.");
        if (!category) throw new TypeError("Selecciona una categoría.");
        if (!Number.isFinite(price) || price < 0) throw new TypeError("El precio debe ser un número mayor o igual a cero.");
        if (!Number.isInteger(stock) || stock < 0) throw new TypeError("El stock debe ser un entero mayor o igual a cero.");

        return {
            name,
            category,
            price,
            stock,
            description: String(product.description || "").trim()
        };
    }

    window.ProductosStore = {
        list() {
            return readProducts();
        },

        get(id) {
            return readProducts().find(product => product.id === id) || null;
        },

        create(product) {
            const products = readProducts();
            const created = { id: createId(), ...validateProduct(product) };
            products.unshift(created);
            writeProducts(products);
            return created;
        },

        update(id, product) {
            const products = readProducts();
            const index = products.findIndex(item => item.id === id);
            if (index === -1) throw new Error("No se encontró el producto que intentas editar.");

            products[index] = { id, ...validateProduct(product) };
            writeProducts(products);
            return products[index];
        },

        remove(id) {
            const products = readProducts();
            const remaining = products.filter(product => product.id !== id);
            if (remaining.length === products.length) throw new Error("No se encontró el producto que intentas eliminar.");
            writeProducts(remaining);
        }
    };
})();
