const roleSelect = document.querySelector("#rol");
const membershipField = document.querySelector("#membershipField");
const membershipLabel = document.querySelector("#membershipLabel");
const membershipSelect = document.querySelector("#plan");
const formTitle = document.querySelector("#formTitle");

const membershipOptions = [
    ["basico", "Básico"],
    ["pro", "Pro"],
    ["premium", "Premium"]
];

const classOptions = [
    ["zumba", "zumba — Lun. y mié., 18:00"],
    ["yoga", "Yoga — Mar. y jue., 19:00"]
];

roleSelect.addEventListener("change", () => {
    const role = roleSelect.value;
    const roleName = roleSelect.options[roleSelect.selectedIndex].text;
    const hasMembershipField = role === "socio" || role === "profesor";
    const isProfessor = role === "profesor";
    const options = isProfessor ? classOptions : membershipOptions;

    formTitle.textContent = role ? `Nuevo ${roleName.toLowerCase()}` : "Nuevo usuario";
    membershipField.hidden = !hasMembershipField;
    membershipSelect.disabled = !hasMembershipField;
    membershipSelect.required = hasMembershipField;
    membershipSelect.name = isProfessor ? "clase" : "membresia";
    membershipLabel.textContent = isProfessor ? "Clase a enseñar *" : "Membresía *";

    membershipSelect.replaceChildren(
        new Option(isProfessor ? "Selecciona una clase" : "Selecciona una membresía", ""),
        ...options.map(([value, label]) => new Option(label, value))
    );
});
