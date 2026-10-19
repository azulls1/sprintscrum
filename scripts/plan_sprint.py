# -*- coding: utf-8 -*-
"""Lo que el portal agrega al documento entregado: el calendario de cada tarea, su tipo, los eventos con hora y
los criterios de aceptación de las tres historias del sprint. Todo lo demás viene de ../fuente/contenido.py."""

# Orden de las tareas = orden de SPRINT_BACKLOG en contenido.py → (día de inicio, día de fin, tipo). 1 = lunes.
CALENDARIO_TAREAS = [
    (1, 1, "analisis"),
    (1, 1, "backend"),
    (1, 2, "backend"),
    (1, 1, "frontend"),
    (2, 2, "pruebas"),
    (2, 2, "backend"),
    (3, 3, "backend"),
    (2, 3, "frontend"),
    (2, 2, "analisis"),
    (4, 4, "pruebas"),
    (4, 4, "backend"),
    (5, 5, "backend"),
    (3, 4, "frontend"),
    (5, 5, "pruebas"),
    (5, 5, "validacion"),
]

# Precedencias explícitas (número de tarea → tareas que deben terminar antes). La prueba de punta a punta (14) cubre
# registro, consulta y reserva, no el correo; la validación (15) ocurre dentro de la sprint review con todo terminado.
DEPENDENCIAS = {
    1: [], 2: [1], 3: [1, 2], 4: [1], 5: [3, 4],
    6: [], 7: [6], 8: [], 9: [6], 10: [7, 8, 9],
    11: [3, 7], 12: [11], 13: [8], 14: [5, 10, 11, 13], 15: [12, 14],
}

# (nombre, día, hora, minutos, nombre corto del facilitador, descripción)
EVENTOS = [
    ("Sprint planning", 1, "09:00", 120, "Cesar Martinez",
     "El equipo elige HU-01 a HU-03 (16 puntos), las desglosa en 15 tareas y fija el objetivo del sprint."),
    ("Daily scrum", 2, "09:00", 15, "Cesar Martinez", "¿Qué hice ayer, qué haré hoy y qué me bloquea?"),
    ("Daily scrum", 3, "09:00", 15, "Cesar Martinez", "¿Qué hice ayer, qué haré hoy y qué me bloquea?"),
    ("Daily scrum", 4, "09:00", 15, "Cesar Martinez", "¿Qué hice ayer, qué haré hoy y qué me bloquea?"),
    ("Daily scrum", 5, "09:00", 15, "Cesar Martinez", "¿Qué hice ayer, qué haré hoy y qué me bloquea?"),
    ("Sprint review", 5, "15:00", 60, "Adonai Hernández",
     "El product owner presenta el incremento a la clínica y lo acepta o lo rechaza."),
    ("Retrospectiva", 5, "16:30", 60, "Cesar Martinez",
     "Qué funcionó, qué no y una mejora concreta para el siguiente sprint."),
]

# Criterios de aceptación (ampliación del portal: no forman parte del documento entregado)
CRITERIOS = {
    "HU-01": [
        "Nombre, teléfono a 10 dígitos y correo son obligatorios y se validan antes de guardar.",
        "Un correo ya registrado no puede volver a registrarse; se muestra un mensaje claro.",
        "Al registrarse, el paciente queda con sesión iniciada y llega a la pantalla de disponibilidad.",
    ],
    "HU-02": [
        "Se elige consultorio, dentista y día, y se ven solo los horarios libres de 30 minutos.",
        "Los días festivos, el horario de comida y los horarios ya reservados no aparecen como libres.",
        "La consulta responde en menos de un segundo con los horarios de prueba de la clínica.",
    ],
    "HU-03": [
        "Al reservar un horario libre, la cita queda registrada y el horario deja de estar disponible.",
        "Dos reservas simultáneas del mismo horario nunca se confirman ambas (restricción en la base de datos).",
        "El paciente recibe en menos de un minuto un correo con fecha, hora, dentista y consultorio.",
    ],
}

# Tipo de rol Scrum por orden de ROLES en contenido.py
ROL_SCRUM = ["product_owner", "scrum_master", "developer", "developer"]


def ruta_contenido():
    """../fuente/contenido.py es la fuente única (genera el .docx y el .pdf). Si existe, se copia a fuente/ del repo
    para que el repositorio se pueda reproducir solo; si no (p. ej. un clon), se usa esa copia."""
    import shutil
    from pathlib import Path
    raiz = Path(__file__).resolve().parents[1]
    original, copia = raiz.parent / "fuente" / "contenido.py", raiz / "fuente" / "contenido.py"
    if original.exists():
        copia.parent.mkdir(exist_ok=True)
        if not copia.exists() or copia.read_bytes() != original.read_bytes():
            shutil.copy2(original, copia)
    return copia
