# Requisitos Checklist: Portal SprintScrum · AgendaFácil

**Purpose**: validar la calidad de los requisitos de `spec.md` (completos, claros, medibles y coherentes con la constitución) antes de planear e implementar.
**Created**: 2026-10-18
**Feature**: [spec.md](../spec.md)

**Note**: `[x]` significa que el criterio de calidad del requisito se revisó y se cumple; no significa que la implementación esté terminada.

## Calidad del contenido

- [x] CHK001 La spec se centra en el valor para la profesora, el equipo y el visitante, no en la tecnología
- [x] CHK002 Todas las secciones obligatorias de la plantilla están completas
- [x] CHK003 La separación capa A (AgendaFácil, planeado) / capa B (portal, construido) es explícita [spec §Input, FR-009]
- [x] CHK004 El stack queda fuera de la spec y vive en `plan.md` (excepción: dominio y fuente de contenido, que son requisitos del encargo)

## Completitud de requisitos

- [x] CHK005 Los cinco criterios de la rúbrica (C1–C5) y los roles tienen requisito y página propios [FR-002–FR-007, US1]
- [x] CHK006 El origen único del contenido está definido (`fuente/contenido.py`) [FR-001]
- [x] CHK007 Los datos que no están en el documento entregado se identifican y se rotulan [FR-008, Assumptions]
- [x] CHK008 Los rangos de los parámetros de simulación están cerrados y su error definido [FR-013]
- [x] CHK009 Las reglas del modelo de simulación (capacidad, lunes/viernes, dependencias explícitas por tarea, validación dentro de la review) están escritas [FR-016]
- [x] CHK010 Requisitos de seguridad (cabecera anti-CSRF, límite por IP) y salud presentes [FR-021, FR-024]
- [x] CHK011 Accesibilidad e idioma especificados con norma medible (WCAG 2.1 AA, español MX, 360 px) [FR-020, FR-023]

## Claridad y medibilidad

- [x] CHK012 Cada historia tiene prioridad, justificación y prueba independiente
- [x] CHK013 Los escenarios de aceptación citan cifras verificables (50 / 16 puntos, 51 h, 23/16/8/4 h, 125 / 183 palabras)
- [x] CHK014 Los criterios de éxito son medibles y no dependen de la implementación [SC-001–SC-008]
- [x] CHK015 No quedan marcadores [NEEDS CLARIFICATION]

## Casos límite

- [x] CHK016 Fallo de base, de Redis y del worker cubiertos con comportamiento definido
- [x] CHK017 La contradicción del límite de 500 palabras tiene tratamiento explícito (advertencia, no incumplimiento) [US2-3]
- [x] CHK018 Ráfagas (429), escrituras sin cabecera (403) y paquetes expirados (404/410) definidos

## Coherencia con la constitución

- [x] CHK019 Principio I: ningún requisito pide escribir texto académico en el código
- [x] CHK020 Principio II: totales, palabras, carga y cumplimiento se piden calculados [FR-010–FR-012]
- [x] CHK021 Principio III: RLS y secretos verificables por un criterio de éxito [SC-007]
- [x] CHK022 Principio V: despliegue reproducible con criterio de éxito [SC-008]

## Notes

- Iteración 1: todos los puntos pasan. El enunciado, `docs/DISENO.md` y `fuente/contenido.py` resuelven alcance, datos y destino.
- Riesgo de contenido (no de requisitos): roles y reflexiones son borradores que el equipo debe confirmar; el portal los toma de la base, así que un cambio no exige modificar código.
