# -*- coding: utf-8 -*-
"""Contenido único de la Actividad 1 grupal (MDGP). De aquí salen el .docx y el .pdf.
Editar SOLO este archivo y volver a correr construir.py."""

PORTADA = {
    "universidad": "Universidad Internacional de La Rioja (UNIR) México",
    "programa": "Maestría en Inteligencia Artificial (Plan 2024)",
    "asignatura": "Metodología de Diseño y Gestión de Proyectos",
    "actividad": "Actividad 1 grupal: Planeación de un sprint en el marco de trabajo Scrum",
    "equipo": "Equipo 2073 F",
    "integrantes": [
        "Mauricio Alberto Alvarez Aspeitia",
        "Adonai Samael Hernández Mata",
        "Cesar Ivan Martinez Perez",
        "Diego Alfonso Nájera Ortiz",
    ],
    "profesora": "Adriana Cervantes Castillo",
    "fecha": "Octubre de 2026",
}

# 1. Descripción del proyecto (máximo 150 palabras)
DESCRIPCION = [
    "Empresa: Nexo Digital Solutions, consultora mexicana de desarrollo de software (empresa ficticia). "
    "Cliente: Clínica Dental Sonrisa Plena, con tres consultorios en Querétaro, que hoy agenda sus citas por "
    "teléfono y WhatsApp de forma manual y registra un 25 % de inasistencias.",
    "Producto: AgendaFácil, una aplicación web responsive con la que los pacientes se registran, consultan "
    "horarios libres y reservan, confirman o cancelan sus citas, y con la que recepción ve la agenda del día.",
    "Objetivo del producto: bajar las inasistencias del 25 % a menos del 10 % en seis meses y liberar dos horas "
    "diarias de trabajo de recepción.",
    "Objetivo del sprint (una semana): entregar un primer incremento funcional en el que un paciente pueda "
    "registrarse, ver la disponibilidad y reservar una cita con confirmación por correo.",
]

# 2. Roles Scrum
ROLES = [
    ("Product owner", "Adonai Samael Hernández Mata",
     "Define y prioriza el product backlog, fija los criterios de aceptación y acepta o rechaza el incremento."),
    ("Scrum master y desarrollador (pruebas)", "Cesar Ivan Martinez Perez",
     "Facilita los eventos, elimina impedimentos y, como desarrollador, se encarga de las pruebas."),
    ("Desarrollador (backend)", "Mauricio Alberto Alvarez Aspeitia",
     "Base de datos, API y envío de correos."),
    ("Desarrollador (frontend)", "Diego Alfonso Nájera Ortiz",
     "Pantallas y experiencia de uso en móvil y escritorio."),
]

# 3. Product backlog (id, historia, prioridad, puntos de historia)
PRODUCT_BACKLOG = [
    ("HU-01", "Como paciente quiero registrarme con mi nombre, teléfono y correo para poder agendar citas.", "Alta", 3),
    ("HU-02", "Como paciente quiero ver los horarios disponibles por dentista y día para elegir el que me convenga.", "Alta", 5),
    ("HU-03", "Como paciente quiero reservar una cita en un horario libre y recibir confirmación por correo para tener constancia.", "Alta", 8),
    ("HU-04", "Como recepcionista quiero ver en un panel la agenda del día de los tres consultorios para organizar la atención.", "Media", 5),
    ("HU-05", "Como paciente quiero recibir un recordatorio por WhatsApp 24 horas antes para no olvidar mi cita.", "Media", 8),
    ("HU-06", "Como paciente quiero cancelar o reprogramar mi cita desde un enlace para liberar el horario.", "Media", 5),
    ("HU-07", "Como administrador quiero un reporte mensual de inasistencias para medir el avance del objetivo.", "Baja", 3),
    ("HU-08", "Como paciente quiero un asistente conversacional que responda dudas frecuentes sobre tratamientos y horarios para resolverlas a cualquier hora sin llamar a la clínica.", "Baja", 13),
]
NOTA_BACKLOG = ("Estimación en puntos de historia (serie de Fibonacci: 1, 2, 3, 5, 8, 13). "
                "El orden refleja la prioridad: primero lo que permite reservar una cita.")

# 4. Sprint backlog (historia, tarea, responsable, horas)
SPRINT_BACKLOG = [
    ("HU-01", "Definir los criterios de aceptación y los datos obligatorios del registro", "Adonai Hernández", 1),
    ("HU-01", "Diseñar la tabla de pacientes en la base de datos", "Mauricio Alvarez", 2),
    ("HU-01", "Programar la API de registro con validación de teléfono y correo", "Mauricio Alvarez", 4),
    ("HU-01", "Construir la pantalla de registro responsive", "Diego Nájera", 4),
    ("HU-01", "Probar el registro (casos válidos e inválidos)", "Cesar Martinez", 2),
    ("HU-02", "Modelar los horarios por dentista y consultorio", "Mauricio Alvarez", 3),
    ("HU-02", "Programar la API de consulta de disponibilidad", "Mauricio Alvarez", 5),
    ("HU-02", "Construir el calendario de disponibilidad en la interfaz", "Diego Nájera", 6),
    ("HU-02", "Cargar los horarios de prueba de la clínica", "Adonai Hernández", 2),
    ("HU-02", "Probar la disponibilidad (días llenos, festivos, horario de comida)", "Cesar Martinez", 2),
    ("HU-03", "Programar la API de reserva que impida la doble reserva", "Mauricio Alvarez", 6),
    ("HU-03", "Configurar el correo de confirmación de la cita", "Mauricio Alvarez", 3),
    ("HU-03", "Construir el flujo de reserva y la pantalla de confirmación", "Diego Nájera", 6),
    ("HU-03", "Probar de punta a punta el registro, la consulta y la reserva", "Cesar Martinez", 4),
    ("HU-03", "Validar el incremento con la clínica en la sprint review", "Adonai Hernández", 1),
]
NOTA_SPRINT = ("Sprint de cinco días hábiles. Eventos: sprint planning el lunes (2 h), daily de 15 minutos de martes a viernes, "
               "sprint review y retrospectiva el viernes (1 h cada una), facilitados por el Scrum master.")

# 5. Reflexiones individuales (150-200 palabras cada una) — BORRADORES: cada integrante debe revisar y ajustar la suya
REFLEXIONES = [
    ("Adonai Samael Hernández Mata — Product owner",
     "Como product owner, mi trabajo durante el sprint empieza antes del sprint planning: dejar el product backlog "
     "ordenado y con criterios de aceptación claros para las tres historias seleccionadas, de modo que el equipo sepa "
     "qué significa «terminado». Durante la semana estaré disponible para resolver dudas de negocio el mismo día, "
     "cargaré los horarios de prueba de la clínica y, el viernes, presentaré el incremento a la clínica en la sprint "
     "review para aceptarlo o rechazarlo. El reto que anticipo es resistir la tentación de agregar trabajo a mitad del "
     "sprint: la clínica seguramente pedirá los recordatorios por WhatsApp en cuanto vea la reserva funcionando, y mi "
     "responsabilidad es llevar esa petición al backlog, no al sprint en curso. Otro reto es priorizar con datos y no "
     "por intuición, apoyándome en el objetivo de reducir inasistencias. Mi contribución al equipo será proteger su "
     "foco, decir que no cuando haga falta y traducir las necesidades de la clínica en historias pequeñas, claras y "
     "estimables, para que el equipo pueda comprometerse con algo realista."),
    ("Cesar Ivan Martinez Perez — Scrum master y desarrollador (pruebas)",
     "Como Scrum master facilitaré el sprint planning del lunes, las dailies de quince minutos y, el viernes, la "
     "sprint review y la retrospectiva. Mi tarea principal será detectar y quitar impedimentos: por ejemplo, conseguir "
     "a tiempo las credenciales del servicio de correo o resolver un bloqueo entre backend y frontend. Como el equipo "
     "es pequeño, también asumo las pruebas: diseñaré los casos para el registro, la disponibilidad y la reserva, y "
     "ejecutaré la prueba de punta a punta antes de la review. El reto que anticipo es el tiempo: en una semana no hay "
     "margen para descubrir los errores el viernes, así que probaré cada historia en cuanto esté lista y no al final. "
     "También tendré que separar bien mis dos sombreros, porque el Scrum master no reparte tareas ni decide por el "
     "equipo. Contribuiré cuidando el proceso y el ritmo, manteniendo visible el avance en el tablero y asegurando que "
     "la retrospectiva termine con al menos una mejora concreta para el siguiente sprint."),
    ("Mauricio Alberto Alvarez Aspeitia — Desarrollador (backend)",
     "Como desarrollador backend me encargaré del modelo de datos de pacientes y horarios, de las API de registro, "
     "disponibilidad y reserva, y del correo de confirmación. Es la mayor carga del sprint, unas veintitrés horas, así "
     "que en la daily avisaré en cuanto vea que alguna tarea se alarga. El reto técnico más delicado es impedir que "
     "dos pacientes reserven el mismo horario al mismo tiempo; lo resolveré con una restricción de unicidad en la base "
     "de datos y una transacción en la reserva, no solo con una validación en pantalla. Otro reto es acordar pronto "
     "con Diego el formato de las respuestas de la API para que el frontend no se quede esperando: el primer día "
     "publicaré los contratos de los servicios con datos de ejemplo. Contribuiré al equipo entregando servicios "
     "pequeños y probados que Cesar pueda verificar en cuanto estén listos, documentando cada endpoint y pidiendo "
     "ayuda a tiempo si la configuración del correo se complica, para no poner en riesgo el objetivo del sprint."),
    ("Diego Alfonso Nájera Ortiz — Desarrollador (frontend)",
     "Como desarrollador frontend construiré las pantallas de registro, el calendario de disponibilidad y el flujo de "
     "reserva con su confirmación. Muchos pacientes de la clínica entrarán desde el celular, así que diseñaré primero "
     "para móvil y después adaptaré a escritorio. Para no depender de que el backend esté terminado, trabajaré los "
     "primeros días con los datos de ejemplo que publique Mauricio y conectaré las API reales en cuanto estén "
     "disponibles. El reto que anticipo es el calendario: mostrar con claridad días llenos, horarios libres y el "
     "horario de comida sin que la pantalla se sature. Otro reto es estimar bien, porque las tareas de interfaz "
     "suelen crecer con los detalles; por eso me ceñiré a los criterios de aceptación del product owner y anotaré en "
     "el backlog cualquier mejora que no sea imprescindible. Contribuiré al equipo mostrando avances visibles desde el "
     "martes, para que el product owner pueda corregir el rumbo pronto, y apoyando a Cesar con las pruebas de "
     "usabilidad antes de la sprint review."),
]

# 6. Conclusión grupal (máximo 200 palabras)
CONCLUSION = (
    "Planear este sprint nos mostró que Scrum no consiste en hacer más rápido, sino en comprometerse con menos y "
    "terminarlo. Al principio queríamos incluir los recordatorios por WhatsApp y el panel de recepción; al estimar "
    "y comparar con nuestra capacidad de una semana, entendimos por qué el sprint backlog debe ser realista y por qué "
    "el product owner prioriza por valor: sin reservar una cita, nada de lo demás sirve. También aprendimos que "
    "desglosar cada historia en tareas pequeñas, con responsable y horas, deja ver los riesgos antes de empezar: la "
    "carga del backend era la más alta, y eso nos llevó a acordar los contratos de la API desde el primer día para "
    "que el frontend no se detuviera. Como equipo, la conversación sobre los roles fue tan valiosa como el resultado: "
    "tener claro qué decide el product owner, qué protege el Scrum master y qué se autoorganiza entre los "
    "desarrolladores evita fricciones. Nos llevamos la idea de que la transparencia (un tablero visible, dailies "
    "cortas y una retrospectiva honesta) es lo que hace que un equipo pequeño mejore sprint a sprint."
)
