// Efectos de interfaz
// Respeta la preferencia del sistema para reducir el movimiento.
(() => {
    "use strict";

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = motionQuery.matches;
    let toastStack = null;
    let revealObserver = null;
    let revealTimer = null;

    function ensureToastStack() {
        if (toastStack?.isConnected) return toastStack;
        toastStack = document.createElement("div");
        toastStack.className = "aviso-stack";
        toastStack.setAttribute("aria-live", "polite");
        toastStack.setAttribute("aria-atomic", "false");
        document.body.append(toastStack);
        return toastStack;
    }

    function showToast(message, type = "info", timeout = 4200) {
        if (!message) return;
        const stack = ensureToastStack();
        const toast = document.createElement("div");
        const icon = document.createElement("span");
        const text = document.createElement("p");
        const close = document.createElement("button");

        toast.className = `aviso aviso--${type}`;
        toast.setAttribute("role", type === "error" ? "alert" : "status");

        icon.className = "aviso__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = type === "success" ? "✓" : type === "error" ? "!" : type === "warning" ? "!" : "i";

        text.className = "aviso__text";
        text.textContent = message;

        close.type = "button";
        close.className = "aviso__close";
        close.setAttribute("aria-label", "Cerrar aviso");
        close.textContent = "×";

        const remove = () => {
            if (!toast.isConnected) return;
            toast.classList.add("is-hiding");
            window.setTimeout(() => toast.remove(), 240);
        };

        close.addEventListener("click", remove);
        toast.append(icon, text, close);
        stack.append(toast);

        if (timeout > 0) window.setTimeout(remove, timeout);
    }

    window.showToast = showToast;
    window.Toast = {
        show: showToast,
        success: (message, timeout) => showToast(message, "success", timeout),
        error: (message, timeout) => showToast(message, "error", timeout),
        warning: (message, timeout) => showToast(message, "warning", timeout),
        info: (message, timeout) => showToast(message, "info", timeout)
    };

    function skeletonRows(tableBody, rows = 5, columns = 5) {
        if (!tableBody) return;
        const fragment = document.createDocumentFragment();
        for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
            const row = document.createElement("tr");
            row.className = "skeleton-row";
            for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
                const cell = document.createElement("td");
                const line = document.createElement("span");
                line.className = "skeleton skeleton-line";
                cell.append(line);
                row.append(cell);
            }
            fragment.append(row);
        }
        tableBody.replaceChildren(fragment);
    }

    function skeletonBlocks(container, count = 4) {
        if (!container) return;
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < count; index += 1) {
            const block = document.createElement("div");
            block.className = "skeleton skeleton-block";
            fragment.append(block);
        }
        container.replaceChildren(fragment);
    }

    function skeletonCards(container, count = 3) {
        if (!container) return;
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < count; index += 1) {
            const card = document.createElement("div");
            card.className = "skeleton skeleton-card";
            fragment.append(card);
        }
        container.replaceChildren(fragment);
    }

    window.Skeleton = {
        rows: skeletonRows,
        blocks: skeletonBlocks,
        cards: skeletonCards
    };

    function initReveals() {
        if (reduceMotion || !("IntersectionObserver" in window)) {
            document.querySelectorAll("[data-reveal]").forEach(element => element.classList.add("is-visible"));
            return;
        }

        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -7% 0px", threshold: 0.04 });

        prepareReveals();

        const observer = new MutationObserver(() => {
            window.clearTimeout(revealTimer);
            revealTimer = window.setTimeout(prepareReveals, 90);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function prepareReveals() {
        if (!revealObserver || reduceMotion) return;
        const selector = [
            "main > section",
            ".nosotros",
            ".reviews",
            ".instalaciones",
            ".planes",
            ".review-card",
            ".comentario",
            ".interface-heading",
            ".interface-panel",
            ".profile-summary",
            ".member-review-card",
            ".routine-preview-card",
            ".class-choice-card",
            ".schedule-card",
            ".contacto-card",
            ".info-card"
        ].join(",");

        document.querySelectorAll(selector).forEach((element, index) => {
            if (element.dataset.reveal) return;
            element.dataset.reveal = "";

            const rect = element.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.9) {
                element.classList.add("is-visible");
                return;
            }

            const siblings = element.parentElement
                ? [...element.parentElement.children].filter(child => child.matches?.(selector))
                : [];
            const siblingIndex = Math.max(0, siblings.indexOf(element));
            element.style.setProperty("--reveal-delay", `${Math.min(siblingIndex * 45, 220)}ms`);
            revealObserver.observe(element);

            if (index > 120) return;
        });
    }

    function initParallax() {
        const hero = document.querySelector(".hero");
        const image = hero?.querySelector("img");
        if (!hero || !image || reduceMotion) return;

        let ticking = false;

        const update = () => {
            if (reduceMotion) {
                image.style.removeProperty("--parallax-y");
                return;
            }
            const rect = hero.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;
            const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
            image.style.setProperty("--parallax-y", `${(progress - 0.5) * 18}px`);
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                update();
                ticking = false;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        update();
    }

    function initRipple() {
        const buttonSelector = [
            "button",
            ".btn",
            ".interface-button",
            ".interface-button-secondary",
            ".interface-button-danger",
            ".btn-guardar",
            ".btn-hero",
            ".btn-instalaciones",
            ".plan-button",
            ".review-button",
            ".action-button",
            ".pagination button"
        ].join(",");

        document.addEventListener("pointerdown", (event) => {
            if (reduceMotion) return;
            const target = event.target.closest(buttonSelector);
            if (!target || target.disabled || target.getAttribute("aria-disabled") === "true") return;

            const rect = target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.2;
            const ripple = document.createElement("span");
            ripple.className = "ripple";
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
            target.append(ripple);
            ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
        });
    }

    function initPageTransitions() {
        document.body.classList.add("page-ready");

        document.addEventListener("click", (event) => {
            if (reduceMotion || event.defaultPrevented || event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const link = event.target.closest("a[href]");
            if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

            const href = link.getAttribute("href");
            if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return;

            const url = new URL(link.href, window.location.href);
            if (url.origin !== window.location.origin) return;
            if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;

            event.preventDefault();
            document.body.classList.add("page-leaving");
            window.setTimeout(() => {
                window.location.href = link.href;
            }, 160);
        });
    }

    function watchMotionPreference() {
        const onChange = (event) => {
            reduceMotion = event.matches;
            if (!reduceMotion) return;
            document.querySelectorAll("[data-reveal]").forEach((element) => {
                element.classList.add("is-visible");
            });
            document.querySelector(".hero img")?.style.removeProperty("--parallax-y");
            document.body.classList.remove("page-leaving");
        };

        if (typeof motionQuery.addEventListener === "function") {
            motionQuery.addEventListener("change", onChange);
        } else {
            motionQuery.addListener(onChange);
        }
    }

    function start() {
        initPageTransitions();
        initReveals();
        initParallax();
        initRipple();
        watchMotionPreference();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
