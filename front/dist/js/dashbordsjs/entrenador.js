
document.querySelectorAll(".action-button").forEach(button => {

    button.addEventListener("click", function(event) {

        event.stopPropagation();

        const menu = this.nextElementSibling;

        document.querySelectorAll(".action-menu").forEach(element => {

            if (element !== menu) {

                element.classList.remove("mostrar");

            }

        });

        menu.classList.toggle("mostrar");

    });

});


document.addEventListener("click", function() {

    document.querySelectorAll(".action-menu").forEach(menu => {

        menu.classList.remove("mostrar");

    });

});


document.querySelectorAll(".arrow-button").forEach(button => {

    button.addEventListener("click", function() {

        setTimeout(() => {

            const expanded =
                this.getAttribute("aria-expanded");

            this.innerHTML =
                expanded === "true"
                    ? "V"
                    : "&lt;";

        }, 50);

    });

});



document.querySelectorAll(".action-button").forEach(button => {

    button.addEventListener("click", function(event) {

        event.stopPropagation();

        const menu = this.nextElementSibling;

        document.querySelectorAll(".action-menu").forEach(element => {

            if (element !== menu) {

                element.classList.remove("mostrar");

            }

        });

        menu.classList.toggle("mostrar");

    });

});


document.addEventListener("click", function() {

    document.querySelectorAll(".action-menu").forEach(menu => {

        menu.classList.remove("mostrar");

    });

});


document.querySelectorAll(".arrow-button").forEach(button => {

    button.addEventListener("click", function() {

        setTimeout(() => {

            const expanded =
                this.getAttribute("aria-expanded");

            this.innerHTML =
                expanded === "true"
                    ? "V"
                    : "&lt;";

        }, 50);

    });

});

