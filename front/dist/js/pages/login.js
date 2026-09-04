document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const alertContainer = document.getElementById('alertContainer');

    fetch('../api/login.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alertContainer.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
                setTimeout(() => window.location.href = 'dashboard.html', 1500);
            } else {
                alertContainer.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
            }
        })
        .catch(() => {
            alertContainer.innerHTML = `<div class="alert alert-danger">Ocurrió un error inesperado.</div>`;
        });
});
