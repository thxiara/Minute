(() => {
    const tableBody = document.getElementById("productsTableBody");
    const productForm = document.getElementById("productForm");

    if (!window.ProductosStore) {
        console.error("No se pudo inicializar el catálogo de productos.");
        return;
    }

    function showError(element, error, fallbackMessage) {
        console.error(fallbackMessage, error);
        element.textContent = error instanceof Error ? error.message : fallbackMessage;
        element.classList.add("is-error");
    }

    function getStockStatus(stock) {
        if (stock <= 0) return { text: "Sin stock", className: "product-status--empty" };
        if (stock <= 5) return { text: "Bajo stock", className: "product-status--low" };
        return { text: "Activo", className: "product-status--available" };
    }

    function formatPrice(price) {
        return `$${new Intl.NumberFormat("es-AR").format(price)}`;
    }

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
            image.src = "/front/dist/assets/imagenes/img6.jpg";
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
                feedback.classList.remove("is-error");
                feedback.textContent = "Producto eliminado correctamente.";
                await renderProducts();
            } catch (error) {
                showError(feedback, error, "No se pudo eliminar el producto.");
            }
        });

        renderProducts().catch((error) => {
            showError(feedback, error, "No se pudo cargar la lista de productos.");
            emptyMessage.hidden = false;
        });
    }

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
    const productId = new URLSearchParams(window.location.search).get("id");
    let editingProductFound = !productId;

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
            updateSummary();
        }).catch((error) => {
            showError(formFeedback, error, "No se pudo cargar el producto.");
        });
    } else {
        formTitle.textContent = "Agregar producto";
    }

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
                await window.ProductosStore.create(product);
            }

            formFeedback.classList.remove("is-error");
            formFeedback.textContent = "Producto guardado correctamente.";
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
