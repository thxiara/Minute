<?php

$router->get('/estado', 'EstadoController@ver');

$router->post('/login', 'AuthController@login');
$router->post('/register', 'AuthController@register');
