document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const alertContainer = document.getElementById('alertContainer');

    const datos = {
        email: this.email.value,
        password: this.password.value
    };

    API.request('/login', 'POST', datos).then((data) => {
        if (data.success) {
            alertContainer.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
            setTimeout(() => window.location.href = '/front/index.html', 1500);
        } else {
            alertContainer.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
        }
    });
});
