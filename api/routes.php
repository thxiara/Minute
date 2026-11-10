<?php
## Redirecciones API
$router->get('/api/estado', 'EstadoController@ver');

$router->post('/api/login', 'AuthController@login');
$router->post('/api/register', 'AuthController@register');

$router->get('/api/me', 'AuthController@me');
$router->post('/api/logout', 'AuthController@logout');

$router->get('/api/socios', 'SocioController@listar');

#Ejercicios y rutinas (entrenador)
$router->get('/api/ejercicios', 'RutinaController@listarEjercicios');
$router->post('/api/ejercicios', 'RutinaController@crearEjercicio');
$router->get('/api/rutinas', 'RutinaController@listar');
$router->post('/api/rutinas', 'RutinaController@crear');
$router->put('/api/rutinas/:id', 'RutinaController@actualizar');
$router->delete('/api/rutinas/:id', 'RutinaController@eliminar');
#Asignar rutinas a un socio (entrenador)
$router->get('/api/socios/:id/rutinas', 'RutinaController@asignadasASocio');
$router->put('/api/socios/:id/rutinas', 'RutinaController@asignarASocio');
#Rutinas del socio logueado
$router->get('/api/mis-rutinas', 'RutinaController@misRutinas');

##Redirecciones front
#Landing
$router->get('/', 'AuthController@landing');
#Logueo
$router->get('/login',  'AuthController@paginaLogin');
#Cerrar sesión
$router->get('/logout', 'AuthController@salir');
#Dashboard
$router->get('/dash',   'AuthController@miPanel');
#Admin
$router->get('/dash/admin', 'AuthController@panelAdmin');
$router->get('/dash/admin/registrar', 'AuthController@panelAdminRegistrar');
$router->get('/dash/admin/clases', 'AuthController@panelAdminClases');
$router->get('/dash/admin/productos', 'AuthController@panelAdminProductos');
$router->get('/dash/admin/producto', 'AuthController@panelAdminProducto');
$router->get('/dash/admin/perfil', 'AuthController@panelAdminPerfil');
#Entrenador
$router->get('/dash/entrenador', 'AuthController@panelEntrenador');
$router->get('/dash/entrenador/ejercicios', 'AuthController@panelEntrenadorEjercicios');
$router->get('/dash/entrenador/rutinas', 'AuthController@panelEntrenadorRutinas');
#Profesor
$router->get('/dash/profesor', 'AuthController@panelProfesor');
$router->get('/dash/profesor/seleccionar-clase', 'AuthController@panelProfesorSeleccionarClase');
$router->get('/dash/profesor/clases', 'AuthController@panelProfesorClases');
$router->get('/dash/profesor/clase', 'AuthController@panelProfesorClase');
$router->get('/dash/profesor/perfil', 'AuthController@panelProfesorPerfil');
#Socio
$router->get('/dash/socio', 'AuthController@panelSocio');