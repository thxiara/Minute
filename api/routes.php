<?php
## Redirecciones API
$router->get('/api/estado', 'EstadoController@ver');

$router->post('/api/login', 'AuthController@login');
$router->post('/api/register', 'AuthController@register');

$router->get('/api/me', 'AuthController@me');
$router->post('/api/logout', 'AuthController@logout');

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
#Entrenador
$router->get('/dash/entrenador', 'AuthController@panelEntrenador');
#Profesor
$router->get('/dash/profesor', 'AuthController@panelProfesor');
#Socio
$router->get('/dash/socio', 'AuthController@panelSocio');