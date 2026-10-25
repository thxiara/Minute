const Session = {
    // Debe coincidir con los id_role de la tabla Role (api/config/init.sql).
    ROLES: {
        ADMIN: 1,
        ENTRENADOR: 2,
        PROFESOR: 3,
        SOCIO: 4
    },

    // Todas las URLs viven acá (absolutas desde la raíz del sitio) para que mover una
    // página de carpeta no obligue a tocar rutas relativas en cada archivo.
    LOGIN_URL: '/front/dist/paginas/login.html',

    // Clase que ponen los dashboards en <html> mientras se verifica la sesión
    // (ver el <style> de cada dashboard: oculta el <body> hasta que termina el chequeo).
    CLASE_VERIFICANDO: 'verificando-sesion',

    // Consulta el estado de sesión actual contra la API.
    // Devuelve { success, logged_in, name, email, role_id } (logged_in en false si no hay sesión).
    async get() {
        const data = await API.request('/me', 'GET');
        return data;
    },

    // URL del dashboard que le corresponde a un rol (o null si el rol no existe).
    dashboardFor(roleId) {
        return this.DASHBOARDS[roleId] || null;
    },

    // Protege una página: si no hay sesión o el rol no está permitido, redirige.
    // La página permanece oculta hasta que el chequeo termina bien, así nunca se
    // alcanza a ver el contenido de un panel ajeno.
    // rolesPermitidos: array de Session.ROLES.*, ej. [Session.ROLES.ADMIN]
    async requireRole(rolesPermitidos, redirectTo = this.LOGIN_URL) {
        const data = await this.get();

        if (!data.success || !data.logged_in) {
            window.location.replace(redirectTo);
            return null;
        }

        if (!rolesPermitidos.includes(data.role_id)) {
            // Hay sesión pero este no es su panel: lo mandamos al que sí le corresponde.
            window.location.replace(this.dashboardFor(data.role_id) || redirectTo);
            return null;
        }

        document.documentElement.classList.remove(this.CLASE_VERIFICANDO);
        return data;
    },

    async logout(redirectTo = '/front/index.html') {
        await API.request('/logout', 'POST');
        window.location.href = redirectTo;
    }
};

// Dashboard de cada rol. Si se agrega un rol nuevo, sumarlo acá y en Session.ROLES.
Session.DASHBOARDS = {
    [Session.ROLES.ADMIN]:      '/front/dist/paginas/roles/admin/admin.html',
    [Session.ROLES.ENTRENADOR]: '/front/dist/paginas/roles/entrenador/entrenador.html',
    [Session.ROLES.PROFESOR]:   '/front/dist/paginas/roles/profesor/profesor.html',
    [Session.ROLES.SOCIO]:      '/front/dist/paginas/roles/usuario/usuario.html'
};
