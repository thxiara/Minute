document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const alertContainer = document.getElementById('alertContainer');

    const datos = {
        name: this.name.value,
        email: this.email.value,
        password: this.password.value,
        confirm_password: this.confirm_password.value
    };

    API.request('/register', 'POST', datos).then((data) => {
        if (data.success) {
            alertContainer.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            alertContainer.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
        }
    });
});
