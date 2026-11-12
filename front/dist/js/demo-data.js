// ============================================================================
// DATOS DE PRUEBA (TEMPORALES) para revisar el diseño sin la base de datos.
// Se activa SOLO abriendo la página con ?demo=1 (ej. /dash/admin?demo=1).
// Sin el parámetro, no hace nada. Borrar este archivo cuando ya no se necesite.
// ============================================================================
(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('demo')) return;

    const pad = (n) => String(n).padStart(2, '0');
    const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
    const monthsAgo = (offset, day) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - offset);
        date.setDate(Math.min(day, 28));
        return iso(date.getFullYear(), date.getMonth() + 1, date.getDate());
    };
    const inDays = (offset, day = 12) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() + offset);
        date.setDate(day);
        return iso(date.getFullYear(), date.getMonth() + 1, date.getDate());
    };

    const membresias = [
        { id_membership: 1, name_membership: 'Plan Mensual', desc_membership: 'Acceso completo por un mes', months_membership: 1 },
        { id_membership: 2, name_membership: 'Plan Trimestral', desc_membership: 'Acceso completo por tres meses', months_membership: 3 },
        { id_membership: 3, name_membership: 'Plan Anual', desc_membership: 'Acceso completo por un año', months_membership: 12 }
    ];

    const profesores = [
        { id_client: 201, name_client: 'Profe Marcela Fernández' },
        { id_client: 202, name_client: 'Profe Rodrigo Battle' },
        { id_client: 203, name_client: 'Profe Camila Techera' }
    ];

    const clases = [
        { id_course: 1, name_course: 'Funcional Full', desc_course: 'Entrenamiento funcional de cuerpo completo', days: [1, 4], time: '07:30', teacher_name: 'Profe Marcela Fernández', student_count: 18 },
        { id_course: 2, name_course: 'Spinning', desc_course: 'Ciclismo indoor de alta intensidad', days: [2, 5], time: '08:15', teacher_name: 'Profe Rodrigo Battle', student_count: 25 },
        { id_course: 3, name_course: 'Yoga', desc_course: 'Movilidad, flexibilidad y respiración', days: [3], time: '09:00', teacher_name: 'Profe Camila Techera', student_count: 12 },
        { id_course: 4, name_course: 'Zumba', desc_course: 'Baile aeróbico grupal', days: [1, 3, 5], time: '19:30', teacher_name: 'Profe Marcela Fernández', student_count: 30 },
        { id_course: 5, name_course: 'Powerlifting', desc_course: 'Fuerza: sentadilla, banca y peso muerto', days: [2, 4], time: '20:00', teacher_name: 'Profe Rodrigo Battle', student_count: 9 },
        { id_course: 6, name_course: 'Pilates', desc_course: 'Core y postura', days: [6], time: '11:00', teacher_name: 'Profe Camila Techera', student_count: 8 }
    ];

    // Lecciones del mes reciente: ocurrencias ya dadas con asistencia (para /profesor/clases y /mis-clases).
    function buildLessons(days, attendedSeed = 3) {
        const lessons = [];
        const today = new Date();
        for (let offset = 70; offset >= 1; offset -= 1) {
            const date = new Date(today);
            date.setDate(today.getDate() - offset);
            if (!days.includes(date.getDay())) continue;
            lessons.push({
                date_lesson: iso(date.getFullYear(), date.getMonth() + 1, date.getDate()),
                state_lesson: 'given',
                assistance: (offset % 5) !== 0, // la mayoría asistió
                desc_lesson: ''
            });
        }
        return lessons;
    }

    const usuarios = [
        { id_client: 1, name_client: 'Bartolito Giménez', role_id: 1, role_name: 'Admin', ci: '12345678', phone: '099111222', expiry_date: null, active_client: 1, created_client: monthsAgo(9, 3) },
        { id_client: 2, name_client: 'Penecito Pérez', role_id: 4, role_name: 'Socio', ci: '12345678-9', phone: '123456789', expiry_date: inDays(0, 12), active_client: 1, created_client: monthsAgo(6, 15), membership_name: 'Plan Trimestral', email: 'penecito@example.com', birth_client: '1990-05-21' },
        { id_client: 3, name_client: 'Ana María Fernández', role_id: 3, role_name: 'Profesor', ci: '45123987', phone: '098765432', expiry_date: null, active_client: 1, created_client: monthsAgo(11, 20) },
        { id_client: 4, name_client: 'Joaquín Silvera', role_id: 4, role_name: 'Socio', ci: '40999887', phone: '097222333', expiry_date: inDays(0, 28), active_client: 1, created_client: monthsAgo(4, 10), membership_name: 'Plan Mensual', email: 'jsilvera@example.com', birth_client: '1985-11-02' },
        { id_client: 5, name_client: 'CamilaTechera', role_id: 3, role_name: 'Profesor', ci: '39877112', phone: '095444555', expiry_date: null, active_client: 1, created_client: monthsAgo(8, 25) },
        { id_client: 6, name_client: 'Valentina Rodríguez Nuñez', role_id: 4, role_name: 'Socio', ci: '51239876', phone: '094666777', expiry_date: inDays(1, 12), active_client: 1, created_client: monthsAgo(2, 18), membership_name: 'Plan Anual', email: 'vale.rdz@example.com', birth_client: '2001-02-14' },
        { id_client: 7, name_client: 'Rodrigo Battle', role_id: 2, role_name: 'Entrenador', ci: '41002334', phone: '093888999', expiry_date: null, active_client: 1, created_client: monthsAgo(10, 5) },
        { id_client: 8, name_client: 'Martina Luz', role_id: 4, role_name: 'Socio', ci: '44567812', phone: '091000111', expiry_date: inDays(0, 3), active_client: 1, created_client: monthsAgo(1, 8), membership_name: 'Plan Mensual', email: 'martina.luz@example.com', birth_client: '1995-07-30' },
        { id_client: 9, name_client: 'Diego Echeverría', role_id: 4, role_name: 'Socio', ci: '33112244', phone: '098333444', expiry_date: inDays(2, 12), active_client: 1, created_client: monthsAgo(7, 28), membership_name: 'Plan Trimestral', email: 'dm.echeverria@example.com', birth_client: '1978-09-09' },
        { id_client: 10, name_client: 'Sofía Rivero Palacios', role_id: 4, role_name: 'Socio', ci: '47819023', phone: '096555666', expiry_date: inDays(0, 25), active_client: 0, created_client: monthsAgo(13, 19), membership_name: 'Plan Mensual', email: 'sofirivero@example.com', birth_client: '1999-03-17' },
        { id_client: 11, name_client: 'Profe Marcela', role_id: 3, role_name: 'Profesor', ci: '28993445', phone: '099777888', expiry_date: null, active_client: 1, created_client: monthsAgo(12, 11) },
        { id_client: 12, name_client: 'Ignacio Cabrera', role_id: 2, role_name: 'Entrenador', ci: '42109876', phone: '092111333', expiry_date: null, active_client: 1, created_client: monthsAgo(5, 22) },
        { id_client: 13, name_client: 'Lucía Sosa', role_id: 4, role_name: 'Socio', ci: '50112233', phone: '097444000', expiry_date: inDays(1, 5), active_client: 1, created_client: monthsAgo(3, 14), membership_name: 'Plan Anual', email: 'lucia.sosa@example.com', birth_client: '2010-12-01' },
        { id_client: 14, name_client: 'Facundo Lemos', role_id: 4, role_name: 'Socio', ci: '49887766', phone: '095222111', expiry_date: inDays(0, 12), active_client: 0, created_client: monthsAgo(16, 1), membership_name: 'Plan Trimestral', email: 'f.lemos@example.com', birth_client: '1982-06-06' }
    ];

    const socios = usuarios.filter(u => u.role_id === 4).map(u => ({
        ...u,
        expiry_date: u.active_client ? u.expiry_date : u.expiry_date,
        my_note: u.id_client === 2 ? 'Tiene una lesión en la rodilla derecha. Evitar saltos y impacto.' : (u.id_client === 6 ? 'Quiere bajar de peso y mejorar postura.' : '')
    }));

    const clasesProfesor = [
        { ...clases[0], students: socios.slice(0, 8), lessons: buildLessons(clases[0].days) },
        { ...clases[3], students: socios.slice(2, 14), lessons: buildLessons(clases[3].days) }
    ];


    // Además de las ya dadas, una clase cancelada este mes para ver el aviso.
    clasesProfesor[0].lessons.push({
        date_lesson: monthsAgo(0, 8),
        state_lesson: 'cancelled',
        assistance: false,
        desc_lesson: 'Se suspendió por lluvia.'
    });

    const alumnos = socios.map((socio, index) => ({
        ...socio,
        lessons_month: 8,
        attended_month: Math.max(0, 8 - (index % 5)),
        score: index % 4 === 0 ? null : 7 + (index % 4),
        note: index === 1 ? 'Excelente técnica en sentadilla. Le cuesta con los pesos muertos.' : (index === 4 ? 'Llega tarde seguido pero se compromete y mejora.' : '')
    }));

    const ejercicios = [
        { id_exercise: 1, name_exercise: 'Sentadilla con barra', muscle_exercise: 'Piernas', has_gif: false },
        { id_exercise: 2, name_exercise: 'Press de banca', muscle_exercise: 'Pecho', has_gif: false },
        { id_exercise: 3, name_exercise: 'Peso muerto rumano', muscle_exercise: 'Piernas', has_gif: false },
        { id_exercise: 4, name_exercise: 'Dominadas', muscle_exercise: 'Espalda', has_gif: false },
        { id_exercise: 5, name_exercise: 'Press militar', muscle_exercise: 'Hombros', has_gif: false },
        { id_exercise: 6, name_exercise: 'Plancha abdominal', muscle_exercise: 'Core', has_gif: false },
        { id_exercise: 7, name_exercise: 'Remo con barra', muscle_exercise: 'Espalda', has_gif: false },
        { id_exercise: 8, name_exercise: 'Estocadas caminando', muscle_exercise: 'Piernas', has_gif: false },
        { id_exercise: 9, name_exercise: 'Curl de bíceps', muscle_exercise: 'Brazos', has_gif: false },
        { id_exercise: 10, name_exercise: 'Fondos en paralelas', muscle_exercise: 'Pecho', has_gif: false }
    ];

    const ejercicio = (id) => ejercicios.find(e => e.id_exercise === id);
    const rutinas = [
        { id_routine: 1, name_routine: 'Hipertrofia básica', trainer_name: 'Rodrigo Battle', items: [ { exercise_id: 1, exercise_name: ejercicio(1).name_exercise, sets: 4, reps: 8 }, { exercise_id: 2, exercise_name: ejercicio(2).name_exercise, sets: 4, reps: 10 }, { exercise_id: 3, exercise_name: ejercicio(3).name_exercise, sets: 3, reps: 12 } ] },
        { id_routine: 2, name_routine: 'Fuerza 5x5', trainer_name: 'Rodrigo Battle', items: [ { exercise_id: 1, exercise_name: ejercicio(1).name_exercise, sets: 5, reps: 5 }, { exercise_id: 2, exercise_name: ejercicio(2).name_exercise, sets: 5, reps: 5 }, { exercise_id: 7, exercise_name: ejercicio(7).name_exercise, sets: 5, reps: 5 } ] },
        { id_routine: 3, name_routine: 'Rutina de vuelta al gym', trainer_name: 'Ignacio Cabrera', items: [ { exercise_id: 6, exercise_name: ejercicio(6).name_exercise, sets: 3, reps: 30 }, { exercise_id: 8, exercise_name: ejercicio(8).name_exercise, sets: 3, reps: 15 }, { exercise_id: 9, exercise_name: ejercicio(9).name_exercise, sets: 3, reps: 12 } ] },
        { id_routine: 4, name_routine: 'Core y postura', trainer_name: 'Ignacio Cabrera', items: [ { exercise_id: 6, exercise_name: ejercicio(6).name_exercise, sets: 4, reps: 45 }, { exercise_id: 3, exercise_name: ejercicio(3).name_exercise, sets: 3, reps: 10 } ] }
    ];

    const productos = [
        { id: 1, name: 'Proteína whey chocolate 1kg', category: 'Suplementos', price: 2490, stock: 34 },
        { id: 2, name: 'Creatina monohidratada 300g', category: 'Suplementos', price: 1290, stock: 52 },
        { id: 3, name: 'Botella shaker 700ml', category: 'Accesorios', price: 590, stock: 5 },
        { id: 4, name: 'Toalla deportiva microfibra', category: 'Accesorios', price: 790, stock: 0 },
        { id: 5, name: 'Barra de proteína x12', category: 'Suplementos', price: 1890, stock: 28 },
        { id: 6, name: 'Banda elástica de resistencia', category: 'Accesorios', price: 690, stock: 41 },
        { id: 7, name: 'Guantes de entrenamiento', category: 'Accesorios', price: 890, stock: 17 },
        { id: 8, name: 'Multivitamínico x90', category: 'Suplementos', price: 1490, stock: 3 },
        { id: 9, name: 'Botella térmica 1L', category: 'Accesorios', price: 1190, stock: 23 },
        { id: 10, name: 'Semillas de chía 500g', category: 'Nutrición', price: 390, stock: 60 }
    ];

    const resenas = [
        { id_review: 1, name: 'Martina Luz', rating: 5, text: 'Hermoso lugar para entrenar, los profes son un lujo. La máquina de funcional es de lo mejor.', photo: null, updated: monthsAgo(0, 20) },
        { id_review: 2, name: 'Penecito Pérez', rating: 5, text: 'Excelente atención y los horarios son flexibles. Recomendada 100%.', photo: null, updated: monthsAgo(0, 15) },
        { id_review: 3, name: 'Diego Echeverría', rating: 4, text: 'Muy buen ambiente y equipamiento completo. A veces hay mucha gente a última hora.', photo: null, updated: monthsAgo(1, 12) },
        { id_review: 4, name: 'Valentina Rodríguez', rating: 5, text: 'Las clases de funcional cambiaron mi cuerpo en 3 meses. Gracias profe!', photo: null, updated: monthsAgo(1, 27) },
        { id_review: 5, name: 'Ignacio Vidal', rating: 3, text: 'Bien, pero los vestuarios deberían limpiarse más seguido.', photo: null, updated: monthsAgo(2, 9) },
        { id_review: 6, name: 'Lucía Sosa', rating: 5, text: 'La mejor decisión del año fue anotarme acá. Super recomendado para principiantes.', photo: null, updated: monthsAgo(2, 24) },
        { id_review: 7, name: 'Martina Luz', rating: 4, text: 'Muy conforme con el plan trimestral, rinde más que el mensual.', photo: null, updated: monthsAgo(3, 5) },
        { id_review: 8, name: 'Facundo Lemos', rating: 5, text: 'Excelente seguimiento del entrenador, personalizada de verdad.', photo: null, updated: monthsAgo(3, 19) }
    ];

    const miPerfil = {
        id_client: 2, name_client: 'Penecito Pérez', role_id: 4, ci: '12345678-9', phone: '123456789',
        email: 'penecito@example.com', birth_client: '1990-05-21', created_client: monthsAgo(6, 15),
        expiry_date: inDays(0, 12), membership_name: 'Plan Trimestral', active_client: 1
    };

    const ok = (extra) => ({ success: true, ...extra });
    const findId = (segment) => Number(segment);

    const routes = [
        { match: /^\/admin\/usuarios/, get: () => {
            const list = API._quiereBajas ? usuarios.filter(u => !u.active_client) : usuarios.filter(u => u.active_client);
            return ok({ usuarios: list, total: list.length });
        } },
        { match: /^\/profesores$/, get: () => ok({ profesores }) },
        { match: /^\/membresias$/, get: () => ok({ membresias }) },
        { match: /^\/clases$/, get: () => ok({ clases }) },
        { match: /^\/socios\/(\d+)\/clases$/, get: (ids) => ok({ clases: clases.filter(c => Number(ids[1]) !== -1).slice(0, 3) }) },
        { match: /^\/socios\/(\d+)\/rutinas$/, get: () => ok({ rutinas: [1, 2] }) },
        { match: /^\/socios$/, get: () => ok({ socios }) },
        { match: /^\/ejercicios$/, get: () => ok({ ejercicios, grupos: [...new Set(ejercicios.map(e => e.muscle_exercise))] }) },
        { match: /^\/rutinas$/, get: () => ok({ rutinas }) },
        { match: /^\/profesor\/clases$/, get: () => ok({ clases: clasesProfesor }) },
        { match: /^\/profesor\/alumnos$/, get: () => ok({ alumnos }) },
        { match: /^\/profesor\/clases\/(\d+)\/encuentros\/([^/]+)\/asistencia$/, get: () => ok({ alumnos: socios.slice(0, 8).map((s, i) => ({ id_client: s.id_client, name_client: s.name_client, assistance: i % 3 !== 0 })) }) },
        { match: /^\/profesor\/alumnos\/(\d+)$/, get: (ids) => { const a = alumnos.find(x => x.id_client === findId(ids[1])) || alumnos[0]; return ok({ alumno: a }); } },
        { match: /^\/usuarios\/(\d+)$/, get: (ids) => { const u = usuarios.find(x => x.id_client === findId(ids[1])) || usuarios[0]; return ok({ usuario: { ...u, has_photo: false } }); } },
        { match: /^\/productos\/?(\d+)?$/, get: () => ok({ productos }) },
        { match: /^\/resenas$/, get: () => ok({ resenas }) },
        { match: /^\/mi-perfil$/, get: () => ok({ usuario: miPerfil }) },
        { match: /^\/mi-resena$/, get: () => ok({ resena: { rating: 5, text: 'Hermoso lugar para entrenar. Recomendadísimo.' } }) },
        { match: /^\/mis-clases$/, get: () => ok({ clases: clasesProfesor.map(c => ({ ...c, teacher_name: c.teacher_name })) }) },
        { match: /^\/mis-rutinas$/, get: () => ok({ rutinas: [rutinas[0]], total: 1 }) }
    ];

    API.request = async (endpoint, method = 'GET', data = null) => {
        const [path, query = ''] = String(endpoint).split('?');
        API._quiereBajas = query.includes('bajas=1');
        if (method !== 'GET') {
            // Mutaciones: fingir éxito con una respuesta razonable.
            if (/^\/socios\/\d+\/rutinas$/.test(path)) return ok({ message: 'Rutinas guardadas (demo).' });
            if (/^\/socios\/\d+\/clases$/.test(path)) return ok({ message: 'Clases asignadas (demo).' });
            if (/^\/socios\/\d+\/nota$/.test(path)) return ok({ message: 'Nota guardada (demo).' });
            if (/^\/profesor\/alumnos\/\d+\/evaluacion$/.test(path)) return ok({ message: 'Evaluación guardada (demo).' });
            if (/^\/profesor\/clases\/[^/]+\/encuentros\/[^/]+/.test(path)) return ok({ message: 'Encuentro actualizado (demo).' });
            if (/^\/usuarios\/\d+\/membresia$/.test(path)) return ok({ usuario: miPerfil });
            if (/^\/ejercicios(\/\d+\/gif)?$/.test(path)) return ok({ message: 'Ejercicio guardado (demo).' });
            if (/^\/rutinas(\/\d+)?$/.test(path)) return ok({ message: 'Rutina guardada (demo).' });
            if (/^\/productos(\/\d+)?$/.test(path)) return ok({ producto: productos[0] });
            return ok({ message: 'Guardado (demo).' });
        }
        for (const route of routes) {
            const match = path.match(route.match);
            if (match) return route.get(match);
        }
        return { success: false, message: `Sin datos demo para ${path}` };
    };

    // El servidor reemplaza {{marcas}}; en local quedan visibles.
    document.querySelectorAll('.header-text').forEach((element) => {
        if (element.textContent.includes('{{')) element.textContent = 'Bartolito Giménez';
    });
    document.querySelectorAll('[href="{{acceso_url}}"]').forEach((element) => { element.href = '/login'; });
    document.querySelectorAll('#accesoBtn').forEach((element) => { element.textContent = 'Iniciar sesión'; element.title = 'Iniciar sesión'; });
    document.querySelectorAll('[src="{{foto_url}}"]').forEach((element) => { element.src = '/front/dist/assets/imagenes/img6.jpg?v=20261113'; });
})();
