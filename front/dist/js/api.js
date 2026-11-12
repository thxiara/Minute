// Cliente API
const API = {
    urlBase: '/api',

    async request(endpoint, method = 'GET', data = null) {
        const url = this.urlBase + endpoint;

        const opciones = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        //si data no es nulo, se fijan sus valores a una llave "body" dentro del objeto opciones
        //( ej. body: '{"email":"a@a.com","password":"123"}' )
        if (data) {
            opciones.body = JSON.stringify(data);
        }

        try {
            // Se manda opciones (quien incluye el método, los headers y los datos)
            // al endpoint. El fetch promete una respuesta, y el await
            // hace que la ejecución de la función no siga hasta que se cumpla la promesa
            // (de otro modo se procesaría la promesa en sí y no la respuesta)
            // la promesa se cumplirá una vez haya cargado el header de la respuesta
            const respuesta = await fetch(url, opciones);
            // Se tiene que esperar otra promesa para el json, debido a que este 
            // tiene que leer el cuerpo de la respuesta para responder
            // (aunque la promesa anterior se haya cumplido porque se recibió el header
            // el cuerpo de la respuesta podría no haberse terminado de recibir aún)
            return await respuesta.json();
        } catch (error) {
            console.error('Error de conexión con la API:', error);
            // se asigna una key de message para indicar cuál fue el error
            // (esto lo hace automaticamente el helper que dio la respuesta,
            // pero al haber fallado la función antes de recibir una respuesta
            // se asigna un mensaje manualmente)
            return { status: 'error', message: 'No se pudo conectar con la API' };
        }
    }
};
