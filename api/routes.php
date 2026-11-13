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
#Animación (gif) de un ejercicio: la carga el entrenador, la ve cualquier usuario logueado
$router->put('/api/ejercicios/:id/gif', 'RutinaController@subirGif');
$router->get('/api/ejercicios/:id/gif', 'RutinaController@gif');
$router->get('/api/rutinas', 'RutinaController@listar');
$router->post('/api/rutinas', 'RutinaController@crear');
$router->put('/api/rutinas/:id', 'RutinaController@actualizar');
$router->delete('/api/rutinas/:id', 'RutinaController@eliminar');
#Asignar rutinas a un socio (entrenador)
$router->get('/api/socios/:id/rutinas', 'RutinaController@asignadasASocio');
$router->put('/api/socios/:id/rutinas', 'RutinaController@asignarASocio');
#Rutinas del socio logueado
$router->get('/api/mis-rutinas', 'RutinaController@misRutinas');
#Nota privada del entrenador sobre un socio
$router->put('/api/socios/:id/nota', 'SocioController@guardarNota');

#Clases grupales (admin)
$router->get('/api/clases', 'ClaseController@listar');
$router->post('/api/clases', 'ClaseController@crear');
$router->put('/api/clases/:id', 'ClaseController@actualizar');
$router->delete('/api/clases/:id', 'ClaseController@eliminar');
$router->get('/api/profesores', 'SocioController@profesores');
$router->get('/api/socios/:id/clases', 'ClaseController@deSocio');
$router->put('/api/socios/:id/clases', 'ClaseController@asignarASocio');
#Clases del socio logueado
$router->get('/api/mis-clases', 'ClaseController@misClases');
#Clases del profesor logueado
$router->get('/api/profesor/clases', 'ClaseController@deProfesor');
$router->put('/api/profesor/clases/:id/encuentros/:fecha', 'ClaseController@guardarNotaEncuentro');
$router->post('/api/profesor/clases/:id/encuentros/:fecha/cancelar', 'ClaseController@cancelarEncuentro');
$router->get('/api/profesor/clases/:id/encuentros/:fecha/asistencia', 'ClaseController@verAsistencia');
$router->put('/api/profesor/clases/:id/encuentros/:fecha/asistencia', 'ClaseController@guardarAsistencia');
$router->get('/api/profesor/alumnos', 'ClaseController@alumnosDeProfesor');
$router->get('/api/profesor/alumnos/:id', 'ClaseController@alumnoDeProfesor');
$router->put('/api/profesor/alumnos/:id/evaluacion', 'ClaseController@evaluarAlumno');

#Usuarios (admin): listado completo y gestión de cuentas
$router->get('/api/admin/usuarios', 'UsuarioController@listar');
$router->get('/api/usuarios/:id', 'UsuarioController@ver');
$router->put('/api/usuarios/:id', 'UsuarioController@actualizar');
$router->delete('/api/usuarios/:id', 'UsuarioController@baja');
$router->post('/api/usuarios/:id/reactivar', 'UsuarioController@reactivar');
$router->post('/api/usuarios/:id/membresia', 'UsuarioController@renovarMembresia');
$router->get('/api/membresias', 'UsuarioController@membresias');
#Perfil y foto (cualquier usuario logueado)
$router->get('/api/mi-perfil', 'UsuarioController@miPerfil');
$router->put('/api/mi-foto', 'UsuarioController@cambiarMiFoto');
$router->get('/api/usuarios/:id/foto', 'UsuarioController@foto');

#Productos (admin)
$router->get('/api/productos', 'ProductoController@listar');
$router->post('/api/productos', 'ProductoController@crear');
$router->get('/api/productos/:id', 'ProductoController@ver');
$router->put('/api/productos/:id', 'ProductoController@actualizar');
$router->delete('/api/productos/:id', 'ProductoController@eliminar');
#Imagen de un producto: la carga el admin, la ve cualquier usuario logueado
$router->put('/api/productos/:id/imagen', 'ProductoController@subirImagen');
$router->get('/api/productos/:id/imagen', 'ProductoController@imagen');

#Reseñas: las ve cualquiera, las escribe el socio
$router->get('/api/resenas', 'ResenaController@listar');
$router->get('/api/resenas/:id/foto', 'ResenaController@foto');
$router->get('/api/mi-resena', 'ResenaController@mia');
$router->put('/api/mi-resena', 'ResenaController@guardar');

##Redirecciones front
#Landing
$router->get('/', 'AuthController@landing');
#Logueo
$router->get('/login',  'AuthController@paginaLogin');
#Reseñas (pública)
$router->get('/resenas', 'AuthController@paginaResenas');
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
$router->get('/dash/admin/resenas', 'AuthController@panelAdminResenas');
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