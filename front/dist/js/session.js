const Session = {
    // Debe coincidir con los id_role de la tabla Role (api/config/init.sql).
    ROLES: {
        ADMIN: 1,
        ENTRENADOR: 2,
        PROFESOR: 3,
        SOCIO: 4
    },

    // Consulta el estado de sesión actual contra la API.
    // Devuelve { success, logged_in, name, email, role_id } (logged_in en false si no hay sesión).
    async get() {
        const data = await API.request('/me', 'GET');
        return data;
    },

    // Protege una página: si no hay sesión o el rol no está permitido, redirige.
    // rolesPermitidos: array de Session.ROLES.*, ej. [Session.ROLES.ADMIN]
    async requireRole(rolesPermitidos, redirectTo = '../../login.html') {
        const data = await this.get();

        if (!data.success || !data.logged_in || !rolesPermitidos.includes(data.role_id)) {
            window.location.href = redirectTo;
            return null;
        }

        return data;
    },

    async logout(redirectTo = '/front/index.html') {
        await API.request('/logout', 'POST');
        window.location.href = redirectTo;
    }
};
