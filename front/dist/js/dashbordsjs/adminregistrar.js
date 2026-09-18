document.querySelectorAll(".arrow-button").forEach(button => {

    button.addEventListener("click", function() {

        setTimeout(() => {

            const expanded =
                this.getAttribute("aria-expanded");

            this.innerHTML =
                expanded === "true" ? "V" : "&lt;";

        }, 50);

    });

});

