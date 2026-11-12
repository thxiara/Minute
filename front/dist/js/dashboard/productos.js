// Productos
(() => {
    const tableBody = document.getElementById("productsTableBody");
    const productForm = document.getElementById("productForm");

    if (!window.ProductosStore) {
        console.error("No se pudo inicializar el catálogo de productos.");
        return;
    }

    // Fotos de producto: la API todavía no guarda imágenes de productos, así que la foto
    // elegida se guarda en el navegador (localStorage) y se muestra tanto en el editor
    // como en la lista. Si más adelante la API acepta fotos, esto se reemplaza por la URL del servidor.
    const PHOTO_KEY = "fitpower:product-photo:";
    const PLACEHOLDER_IMAGE = "/front/dist/assets/imagenes/product-placeholder.jpg";

    function getProductPhoto(id) {
        try {
            return window.localStorage.getItem(PHOTO_KEY + id) || PLACEHOLDER_IMAGE;
        } catch {
            return PLACEHOLDER_IMAGE;
        }
    }

    function setProductPhoto(id, dataUrl) {
        try {
            window.localStorage.setItem(PHOTO_KEY + id, dataUrl);
            return true;
        } catch (error) {
            console.error("No se pudo guardar la foto del producto.", error);
            return false;
        }
    }

    function removeProductPhoto(id) {
        try {
            window.localStorage.removeItem(PHOTO_KEY + id);
        } catch {
            // Sin acceso a localStorage no hay nada que borrar.
        }
    }

    // Lee el archivo y lo devuelve como data URL. Las imágenes grandes se achican a un
    // máximo de 512 px (en JPEG) para no llenar el almacenamiento del navegador;
    // los GIF se guardan tal cual para conservar la animación.
    function readPhotoAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
            reader.onload = () => {
                if (file.type === "image/gif" && file.size <= 900 * 1024) {
                    resolve(String(reader.result));
                    return;
                }
                const image = new Image();
                image.onerror = () => resolve(String(reader.result));
                image.onload = () => {
                    const maxSize = 512;
                    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(image.width * scale));
                    canvas.height = Math.max(1, Math.round(image.height * scale));
                    const context = canvas.getContext("2d");
                    if (!context) {
                        resolve(String(reader.result));
                        return;
                    }
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    try {
                        resolve(canvas.toDataURL("image/jpeg", 0.85));
                    } catch {
                        resolve(String(reader.result));
                    }
                };
                image.src = String(reader.result);
            };
            reader.readAsDataURL(file);
        });
    }

    function showError(element, error, fallbackMessage) {
        console.error(fallbackMessage, error);
        const message = error instanceof Error ? error.message : fallbackMessage;
        element.textContent = message;
        element.classList.add("is-error");
        window.Toast?.error(message);
    }

    function getStockStatus(stock) {
        if (stock <= 0) return { text: "Sin stock", className: "product-status--empty" };
        if (stock <= 5) return { text: "Bajo stock", className: "product-status--low" };
        return { text: "Activo", className: "product-status--available" };
    }

    function formatPrice(price) {
        return `$${new Intl.NumberFormat("es-AR").format(price)}`;
    }

    // Listado
    if (tableBody) {
        const searchInput = document.getElementById("productsSearch");
        const pageSize = document.getElementById("productsPageSize");
        const emptyMessage = document.getElementById("productsEmpty");
        const feedback = document.getElementById("productsFeedback");

        function createCell(label, value) {
            const cell = document.createElement("td");
            cell.dataset.label = label;
            cell.textContent = value;
            return cell;
        }

        function createProductRow(product) {
            const row = document.createElement("tr");
            row.dataset.productRow = "";

            const productCell = document.createElement("td");
            productCell.dataset.label = "Producto";
            const productName = document.createElement("div");
            productName.className = "product-name";
            const image = document.createElement("img");
            image.src = getProductPhoto(product.id);
            image.alt = "";
            image.className = "product-thumbnail";
            const name = document.createElement("span");
            name.textContent = product.name;
            productName.append(image, name);
            productCell.append(productName);
            row.append(productCell);

            row.append(
                createCell("Categoría", product.category),
                createCell("Precio", formatPrice(product.price)),
                createCell("Stock", String(product.stock))
            );

            const statusCell = document.createElement("td");
            statusCell.dataset.label = "Estado";
            const status = getStockStatus(product.stock);
            const statusBadge = document.createElement("span");
            statusBadge.className = `product-status ${status.className}`;
            statusBadge.textContent = status.text;
            statusCell.append(statusBadge);
            row.append(statusCell);

            const actionsCell = document.createElement("td");
            actionsCell.dataset.label = "Acciones";
            actionsCell.className = "product-actions-cell";
            const actions = document.createElement("details");
            actions.className = "product-actions";
            const summary = document.createElement("summary");
            summary.setAttribute("aria-label", `Acciones para ${product.name}`);
            summary.textContent = "⋮";
            const menu = document.createElement("div");
            menu.className = "product-actions-menu";
            const editLink = document.createElement("a");
            editLink.href = `/dash/admin/producto?id=${encodeURIComponent(product.id)}`;
            editLink.textContent = "Ver / editar";
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.dataset.productDelete = product.id;
            deleteButton.textContent = "Eliminar";
            menu.append(editLink, deleteButton);
            actions.append(summary, menu);
            actionsCell.append(actions);
            row.append(actionsCell);

            return row;
        }

        function filterProducts() {
            const query = searchInput.value.trim().toLocaleLowerCase();
            const limit = Number(pageSize.value);
            let visible = 0;

            [...tableBody.querySelectorAll("[data-product-row]")].forEach(row => {
                const matches = row.textContent.toLocaleLowerCase().includes(query);
                const show = matches && visible < limit;
                row.hidden = !show;
                if (show) visible += 1;
            });

            emptyMessage.hidden = visible > 0;
        }

        async function renderProducts() {
            window.Skeleton?.rows(tableBody, 5, 6);
            emptyMessage.hidden = true;
            const products = await window.ProductosStore.list();
            tableBody.replaceChildren(...products.map(createProductRow));
            filterProducts();
        }

        searchInput.addEventListener("input", filterProducts);
        pageSize.addEventListener("change", filterProducts);

        tableBody.addEventListener("click", async event => {
            const deleteButton = event.target.closest("[data-product-delete]");
            if (!deleteButton) return;

            if (!window.confirm("¿Eliminar este producto?")) return;

            try {
                await window.ProductosStore.remove(deleteButton.dataset.productDelete);
                removeProductPhoto(deleteButton.dataset.productDelete);
                feedback.classList.remove("is-error");
                feedback.textContent = "Producto eliminado correctamente.";
                window.Toast?.success("Producto eliminado correctamente.");
                await renderProducts();
            } catch (error) {
                showError(feedback, error, "No se pudo eliminar el producto.");
            }
        });

        renderProducts().catch((error) => {
            tableBody.replaceChildren();
            showError(feedback, error, "No se pudo cargar la lista de productos.");
            emptyMessage.hidden = false;
        });
    }

    // Editor
    if (!productForm) return;

    const formTitle = document.getElementById("productFormTitle");
    const formFeedback = document.getElementById("productFormFeedback");
    const saveButton = document.getElementById("productSaveButton");
    const nameInput = document.getElementById("productName");
    const categoryInput = document.getElementById("productCategory");
    const priceInput = document.getElementById("productPrice");
    const descriptionInput = document.getElementById("productDescription");
    const stockInput = document.getElementById("productStock");
    const summaryName = document.getElementById("productSummaryName");
    const summaryCategory = document.getElementById("productSummaryCategory");
    const summaryPrice = document.getElementById("productSummaryPrice");
    const summaryStock = document.getElementById("productSummaryStock");
    const summaryStatus = document.getElementById("productSummaryStatus");
    const inventoryStatus = document.getElementById("inventoryStatus");
    const previewImage = document.getElementById("productPreviewImage");
    const photoButton = document.getElementById("productPhotoButton");
    const photoInput = document.getElementById("productPhotoInput");
    const productId = new URLSearchParams(window.location.search).get("id");
    let editingProductFound = !productId;
    let pendingPhoto = null; // Foto elegida en modo creación; se guarda al crear el producto.

    function updateSummary() {
        const stock = Math.max(0, Number(stockInput.value) || 0);
        const status = getStockStatus(stock);

        summaryName.textContent = nameInput.value.trim() || "Nuevo producto";
        summaryCategory.textContent = categoryInput.value || "—";
        summaryPrice.textContent = priceInput.value ? formatPrice(Number(priceInput.value)) : "—";
        summaryStock.textContent = String(stock);

        [summaryStatus, inventoryStatus].forEach(element => {
            element.textContent = status.text;
            element.className = `product-status ${status.className}`;
        });
    }

    // Carga
    if (productId) {
        formTitle.textContent = "Editar producto";
        saveButton.textContent = "Guardar cambios";

        saveButton.disabled = true;
        window.ProductosStore.get(productId).then((product) => {
            editingProductFound = true;
            saveButton.disabled = false;
            nameInput.value = product.name;
            categoryInput.value = product.category;
            priceInput.value = String(product.price);
            descriptionInput.value = product.description || "";
            stockInput.value = String(product.stock);
            if (previewImage) previewImage.src = getProductPhoto(productId);
            updateSummary();
        }).catch((error) => {
            showError(formFeedback, error, "No se pudo cargar el producto.");
        });
    } else {
        formTitle.textContent = "Nuevo producto";
    }

    if (photoButton && photoInput && previewImage) {
        photoButton.addEventListener("click", () => photoInput.click());

        photoInput.addEventListener("change", async () => {
            const [file] = photoInput.files || [];
            photoInput.value = "";
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                showError(formFeedback, new Error("El archivo tiene que ser una imagen."), "El archivo tiene que ser una imagen.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showError(formFeedback, new Error("La imagen puede pesar hasta 5 MB."), "La imagen puede pesar hasta 5 MB.");
                return;
            }

            try {
                photoButton.disabled = true;
                const dataUrl = await readPhotoAsDataUrl(file);
                previewImage.src = dataUrl;

                if (productId) {
                    // En edición la foto se guarda enseguida, con el id del producto.
                    if (!setProductPhoto(productId, dataUrl)) {
                        showError(formFeedback, new Error("No se pudo guardar la foto."), "No se pudo guardar la foto.");
                        return;
                    }
                } else {
                    // En creación queda pendiente y se guarda con el id que devuelva la API.
                    pendingPhoto = dataUrl;
                }
                formFeedback.classList.remove("is-error");
                formFeedback.textContent = "Foto actualizada.";
            } catch (error) {
                showError(formFeedback, error, "No se pudo guardar la foto.");
            } finally {
                photoButton.disabled = false;
            }
        });
    }

    // Eventos
    [nameInput, categoryInput, priceInput, stockInput].forEach(input => {
        input.addEventListener("input", updateSummary);
        input.addEventListener("change", updateSummary);
    });

    productForm.addEventListener("click", event => {
        const stepButton = event.target.closest("[data-stock-step]");
        if (stepButton) {
            const nextStock = Math.max(0, (Number(stockInput.value) || 0) + Number(stepButton.dataset.stockStep));
            stockInput.value = String(nextStock);
            updateSummary();
        }

    });

    productForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!productForm.reportValidity() || !editingProductFound) return;

        const product = {
            name: nameInput.value,
            category: categoryInput.value,
            price: priceInput.value,
            description: descriptionInput.value,
            stock: stockInput.value
        };

        try {
            saveButton.disabled = true;
            if (productId) {
                await window.ProductosStore.update(productId, product);
            } else {
                const created = await window.ProductosStore.create(product);
                if (pendingPhoto && created?.id) {
                    setProductPhoto(created.id, pendingPhoto);
                    pendingPhoto = null;
                }
            }

            formFeedback.classList.remove("is-error");
            formFeedback.textContent = "Producto guardado correctamente.";
            window.Toast?.success("Producto guardado correctamente.");
            saveButton.disabled = true;
            window.setTimeout(() => {
                window.location.href = "/dash/admin/productos";
            }, 700);
        } catch (error) {
            saveButton.disabled = false;
            showError(formFeedback, error, "No se pudo guardar el producto.");
        }
    });

    updateSummary();
})();
