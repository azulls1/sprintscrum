-- ════════════════════════════════════════════════════════════════════════════
-- SprintScrum · contenido. GENERADO por scripts/generar_semilla.py desde fuente/contenido.py: no editar a mano.
-- Idempotente: reemplaza el contenido académico; no toca simulaciones, entregables ni paquetes.
-- ════════════════════════════════════════════════════════════════════════════
begin;

delete from public."SprintScrum_reflexiones";
delete from public."SprintScrum_eventos";
delete from public."SprintScrum_tareas";
delete from public."SprintScrum_historias";
delete from public."SprintScrum_integrantes";
delete from public."SprintScrum_proyecto";

insert into public."SprintScrum_proyecto"
    (id, empresa, cliente, producto, objetivo_producto, objetivo_sprint, descripcion, portada, duracion_dias,
     nota_backlog, nota_sprint, conclusion)
values
    ('agendafacil', 'Nexo Digital Solutions', 'Clínica Dental Sonrisa Plena', 'AgendaFácil', 'bajar las inasistencias del 25 % a menos del 10 % en seis meses y liberar dos horas diarias de trabajo de recepción.', 'entregar un primer incremento funcional en el que un paciente pueda registrarse, ver la disponibilidad y reservar una cita con confirmación por correo.', '["Empresa: Nexo Digital Solutions, consultora mexicana de desarrollo de software (empresa ficticia). Cliente: Clínica Dental Sonrisa Plena, con tres consultorios en Querétaro, que hoy agenda sus citas por teléfono y WhatsApp de forma manual y registra un 25 % de inasistencias.", "Producto: AgendaFácil, una aplicación web responsive con la que los pacientes se registran, consultan horarios libres y reservan, confirman o cancelan sus citas, y con la que recepción ve la agenda del día.", "Objetivo del producto: bajar las inasistencias del 25 % a menos del 10 % en seis meses y liberar dos horas diarias de trabajo de recepción.", "Objetivo del sprint (una semana): entregar un primer incremento funcional en el que un paciente pueda registrarse, ver la disponibilidad y reservar una cita con confirmación por correo."]'::jsonb, '{"universidad": "Universidad Internacional de La Rioja (UNIR) México", "programa": "Maestría en Inteligencia Artificial (Plan 2024)", "asignatura": "Metodología de Diseño y Gestión de Proyectos", "actividad": "Actividad 1 grupal: Planeación de un sprint en el marco de trabajo Scrum", "equipo": "Equipo 2073 F", "integrantes": ["Mauricio Alberto Alvarez Aspeitia", "Adonai Samael Hernández Mata", "Cesar Ivan Martinez Perez", "Diego Alfonso Nájera Ortiz"], "profesora": "Adriana Cervantes Castillo", "fecha": "Octubre de 2026"}'::jsonb, 5, 'Estimación en puntos de historia (serie de Fibonacci: 1, 2, 3, 5, 8, 13). El orden refleja la prioridad: primero lo que permite reservar una cita.', 'Sprint de cinco días hábiles. Eventos: sprint planning el lunes (2 h), daily de 15 minutos de martes a viernes, sprint review y retrospectiva el viernes (1 h cada una), facilitados por el Scrum master.', 'Planear este sprint nos mostró que Scrum no consiste en hacer más rápido, sino en comprometerse con menos y terminarlo. Al principio queríamos incluir los recordatorios por WhatsApp y el panel de recepción; al estimar y comparar con nuestra capacidad de una semana, entendimos por qué el sprint backlog debe ser realista y por qué el product owner prioriza por valor: sin reservar una cita, nada de lo demás sirve. También aprendimos que desglosar cada historia en tareas pequeñas, con responsable y horas, deja ver los riesgos antes de empezar: la carga del backend era la más alta, y eso nos llevó a acordar los contratos de la API desde el primer día para que el frontend no se detuviera. Como equipo, la conversación sobre los roles fue tan valiosa como el resultado: tener claro qué decide el product owner, qué protege el Scrum master y qué se autoorganiza entre los desarrolladores evita fricciones. Nos llevamos la idea de que la transparencia (un tablero visible, dailies cortas y una retrospectiva honesta) es lo que hace que un equipo pequeño mejore sprint a sprint.');

insert into public."SprintScrum_integrantes" (id, nombre, nombre_corto, rol, rol_scrum, responsabilidad, orden)
values
    (1, 'Adonai Samael Hernández Mata', 'Adonai Hernández', 'Product owner', 'product_owner', 'Define y prioriza el product backlog, fija los criterios de aceptación y acepta o rechaza el incremento.', 1),
    (2, 'Cesar Ivan Martinez Perez', 'Cesar Martinez', 'Scrum master y desarrollador (pruebas)', 'scrum_master', 'Facilita los eventos, elimina impedimentos y, como desarrollador, se encarga de las pruebas.', 2),
    (3, 'Mauricio Alberto Alvarez Aspeitia', 'Mauricio Alvarez', 'Desarrollador (backend)', 'developer', 'Base de datos, API y envío de correos.', 3),
    (4, 'Diego Alfonso Nájera Ortiz', 'Diego Nájera', 'Desarrollador (frontend)', 'developer', 'Pantallas y experiencia de uso en móvil y escritorio.', 4);

insert into public."SprintScrum_historias" (id, orden, texto, prioridad, puntos, en_sprint, criterios)
values
    ('HU-01', 1, 'Como paciente quiero registrarme con mi nombre, teléfono y correo para poder agendar citas.', 'Alta', 3, true, '["Nombre, teléfono a 10 dígitos y correo son obligatorios y se validan antes de guardar.", "Un correo ya registrado no puede volver a registrarse; se muestra un mensaje claro.", "Al registrarse, el paciente queda con sesión iniciada y llega a la pantalla de disponibilidad."]'::jsonb),
    ('HU-02', 2, 'Como paciente quiero ver los horarios disponibles por dentista y día para elegir el que me convenga.', 'Alta', 5, true, '["Se elige consultorio, dentista y día, y se ven solo los horarios libres de 30 minutos.", "Los días festivos, el horario de comida y los horarios ya reservados no aparecen como libres.", "La consulta responde en menos de un segundo con los horarios de prueba de la clínica."]'::jsonb),
    ('HU-03', 3, 'Como paciente quiero reservar una cita en un horario libre y recibir confirmación por correo para tener constancia.', 'Alta', 8, true, '["Al reservar un horario libre, la cita queda registrada y el horario deja de estar disponible.", "Dos reservas simultáneas del mismo horario nunca se confirman ambas (restricción en la base de datos).", "El paciente recibe en menos de un minuto un correo con fecha, hora, dentista y consultorio."]'::jsonb),
    ('HU-04', 4, 'Como recepcionista quiero ver en un panel la agenda del día de los tres consultorios para organizar la atención.', 'Media', 5, false, '[]'::jsonb),
    ('HU-05', 5, 'Como paciente quiero recibir un recordatorio por WhatsApp 24 horas antes para no olvidar mi cita.', 'Media', 8, false, '[]'::jsonb),
    ('HU-06', 6, 'Como paciente quiero cancelar o reprogramar mi cita desde un enlace para liberar el horario.', 'Media', 5, false, '[]'::jsonb),
    ('HU-07', 7, 'Como administrador quiero un reporte mensual de inasistencias para medir el avance del objetivo.', 'Baja', 3, false, '[]'::jsonb),
    ('HU-08', 8, 'Como paciente quiero un asistente conversacional que responda dudas frecuentes sobre tratamientos y horarios para resolverlas a cualquier hora sin llamar a la clínica.', 'Baja', 13, false, '[]'::jsonb);

insert into public."SprintScrum_tareas" (id, historia_id, nombre, responsable_id, horas, dia_inicio, dia_fin, tipo, depende_de)
values
    (1, 'HU-01', 'Definir los criterios de aceptación y los datos obligatorios del registro', 1, 1, 1, 1, 'analisis', '{}'::smallint[]),
    (2, 'HU-01', 'Diseñar la tabla de pacientes en la base de datos', 3, 2, 1, 1, 'backend', '{1}'::smallint[]),
    (3, 'HU-01', 'Programar la API de registro con validación de teléfono y correo', 3, 4, 1, 2, 'backend', '{1,2}'::smallint[]),
    (4, 'HU-01', 'Construir la pantalla de registro responsive', 4, 4, 1, 1, 'frontend', '{1}'::smallint[]),
    (5, 'HU-01', 'Probar el registro (casos válidos e inválidos)', 2, 2, 2, 2, 'pruebas', '{3,4}'::smallint[]),
    (6, 'HU-02', 'Modelar los horarios por dentista y consultorio', 3, 3, 2, 2, 'backend', '{}'::smallint[]),
    (7, 'HU-02', 'Programar la API de consulta de disponibilidad', 3, 5, 3, 3, 'backend', '{6}'::smallint[]),
    (8, 'HU-02', 'Construir el calendario de disponibilidad en la interfaz', 4, 6, 2, 3, 'frontend', '{}'::smallint[]),
    (9, 'HU-02', 'Cargar los horarios de prueba de la clínica', 1, 2, 2, 2, 'analisis', '{6}'::smallint[]),
    (10, 'HU-02', 'Probar la disponibilidad (días llenos, festivos, horario de comida)', 2, 2, 4, 4, 'pruebas', '{7,8,9}'::smallint[]),
    (11, 'HU-03', 'Programar la API de reserva que impida la doble reserva', 3, 6, 4, 4, 'backend', '{3,7}'::smallint[]),
    (12, 'HU-03', 'Configurar el correo de confirmación de la cita', 3, 3, 5, 5, 'backend', '{11}'::smallint[]),
    (13, 'HU-03', 'Construir el flujo de reserva y la pantalla de confirmación', 4, 6, 3, 4, 'frontend', '{8}'::smallint[]),
    (14, 'HU-03', 'Probar de punta a punta el registro, la consulta y la reserva', 2, 4, 5, 5, 'pruebas', '{5,10,11,13}'::smallint[]),
    (15, 'HU-03', 'Validar el incremento con la clínica en la sprint review', 1, 1, 5, 5, 'validacion', '{12,14}'::smallint[]);

insert into public."SprintScrum_eventos" (id, nombre, dia, hora, duracion_min, facilitador_id, descripcion)
values
    (1, 'Sprint planning', 1, '09:00', 120, 2, 'El equipo elige HU-01 a HU-03 (16 puntos), las desglosa en 15 tareas y fija el objetivo del sprint.'),
    (2, 'Daily scrum', 2, '09:00', 15, 2, '¿Qué hice ayer, qué haré hoy y qué me bloquea?'),
    (3, 'Daily scrum', 3, '09:00', 15, 2, '¿Qué hice ayer, qué haré hoy y qué me bloquea?'),
    (4, 'Daily scrum', 4, '09:00', 15, 2, '¿Qué hice ayer, qué haré hoy y qué me bloquea?'),
    (5, 'Daily scrum', 5, '09:00', 15, 2, '¿Qué hice ayer, qué haré hoy y qué me bloquea?'),
    (6, 'Sprint review', 5, '15:00', 60, 1, 'El product owner presenta el incremento a la clínica y lo acepta o lo rechaza.'),
    (7, 'Retrospectiva', 5, '16:30', 60, 2, 'Qué funcionó, qué no y una mejora concreta para el siguiente sprint.');

insert into public."SprintScrum_reflexiones" (integrante_id, titulo, texto)
values
    (1, 'Adonai Samael Hernández Mata — Product owner', 'Como product owner, mi trabajo durante el sprint empieza antes del sprint planning: dejar el product backlog ordenado y con criterios de aceptación claros para las tres historias seleccionadas, de modo que el equipo sepa qué significa «terminado». Durante la semana estaré disponible para resolver dudas de negocio el mismo día, cargaré los horarios de prueba de la clínica y, el viernes, presentaré el incremento a la clínica en la sprint review para aceptarlo o rechazarlo. El reto que anticipo es resistir la tentación de agregar trabajo a mitad del sprint: la clínica seguramente pedirá los recordatorios por WhatsApp en cuanto vea la reserva funcionando, y mi responsabilidad es llevar esa petición al backlog, no al sprint en curso. Otro reto es priorizar con datos y no por intuición, apoyándome en el objetivo de reducir inasistencias. Mi contribución al equipo será proteger su foco, decir que no cuando haga falta y traducir las necesidades de la clínica en historias pequeñas, claras y estimables, para que el equipo pueda comprometerse con algo realista.'),
    (2, 'Cesar Ivan Martinez Perez — Scrum master y desarrollador (pruebas)', 'Como Scrum master facilitaré el sprint planning del lunes, las dailies de quince minutos y, el viernes, la sprint review y la retrospectiva. Mi tarea principal será detectar y quitar impedimentos: por ejemplo, conseguir a tiempo las credenciales del servicio de correo o resolver un bloqueo entre backend y frontend. Como el equipo es pequeño, también asumo las pruebas: diseñaré los casos para el registro, la disponibilidad y la reserva, y ejecutaré la prueba de punta a punta antes de la review. El reto que anticipo es el tiempo: en una semana no hay margen para descubrir los errores el viernes, así que probaré cada historia en cuanto esté lista y no al final. También tendré que separar bien mis dos sombreros, porque el Scrum master no reparte tareas ni decide por el equipo. Contribuiré cuidando el proceso y el ritmo, manteniendo visible el avance en el tablero y asegurando que la retrospectiva termine con al menos una mejora concreta para el siguiente sprint.'),
    (3, 'Mauricio Alberto Alvarez Aspeitia — Desarrollador (backend)', 'Como desarrollador backend me encargaré del modelo de datos de pacientes y horarios, de las API de registro, disponibilidad y reserva, y del correo de confirmación. Es la mayor carga del sprint, unas veintitrés horas, así que en la daily avisaré en cuanto vea que alguna tarea se alarga. El reto técnico más delicado es impedir que dos pacientes reserven el mismo horario al mismo tiempo; lo resolveré con una restricción de unicidad en la base de datos y una transacción en la reserva, no solo con una validación en pantalla. Otro reto es acordar pronto con Diego el formato de las respuestas de la API para que el frontend no se quede esperando: el primer día publicaré los contratos de los servicios con datos de ejemplo. Contribuiré al equipo entregando servicios pequeños y probados que Cesar pueda verificar en cuanto estén listos, documentando cada endpoint y pidiendo ayuda a tiempo si la configuración del correo se complica, para no poner en riesgo el objetivo del sprint.'),
    (4, 'Diego Alfonso Nájera Ortiz — Desarrollador (frontend)', 'Como desarrollador frontend construiré las pantallas de registro, el calendario de disponibilidad y el flujo de reserva con su confirmación. Muchos pacientes de la clínica entrarán desde el celular, así que diseñaré primero para móvil y después adaptaré a escritorio. Para no depender de que el backend esté terminado, trabajaré los primeros días con los datos de ejemplo que publique Mauricio y conectaré las API reales en cuanto estén disponibles. El reto que anticipo es el calendario: mostrar con claridad días llenos, horarios libres y el horario de comida sin que la pantalla se sature. Otro reto es estimar bien, porque las tareas de interfaz suelen crecer con los detalles; por eso me ceñiré a los criterios de aceptación del product owner y anotaré en el backlog cualquier mejora que no sea imprescindible. Contribuiré al equipo mostrando avances visibles desde el martes, para que el product owner pueda corregir el rumbo pronto, y apoyando a Cesar con las pruebas de usabilidad antes de la sprint review.');

commit;
