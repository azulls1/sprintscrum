---
title: SprintScrum · AgendaFácil
type: product-brief
created: 2026-10-18
updated: 2026-10-18
status: final
inputDocuments:
  - ../../docs/DISENO.md
  - ../../../fuente/contenido.py
  - ../../../README.md
---

# Product Brief: SprintScrum · AgendaFácil

## Executive Summary

SprintScrum es un portal web, en `sprintscrum.iagentek.com.mx`, que presenta de forma interactiva y
verificable la Actividad 1 grupal de *Metodología de Diseño y Gestión de Proyectos* (UNIR México,
Maestría en Inteligencia Artificial, Equipo 2073 F): la planeación de un sprint Scrum de una semana para **AgendaFácil**, una
app de citas que la consultora ficticia Nexo Digital Solutions construye para la Clínica Dental Sonrisa
Plena.

El documento entregado (6 páginas) es estático: no deja ver cómo se reparte la carga por día, si el plan
cabe en la semana ni si cada requisito de la rúbrica se cumple. El portal toma **exactamente** el mismo
contenido, calcula todas las cifras, comprueba la rúbrica contra los datos y simula el riesgo del plan.

## Dos capas de Scrum

| | Capa A · AgendaFácil | Capa B · Portal SprintScrum |
|---|---|---|
| Qué es | El producto académico: sprint de 5 días, HU-01…HU-03, 15 tareas, 51 h | Este software |
| Estado | **Planeado, no ejecutado** (lo pide el enunciado) | Construido y desplegado |
| Método | Scrum (contenido de la actividad) | GitHub spec-kit (guiado por especificaciones) + método BMAD v6 |
| Dónde vive | `fuente/contenido.py` → tablas `SprintScrum_*` | `specs/`, `_bmad-output/`, código |

Este brief, el PRD, la arquitectura y las épicas son de la **capa B**.

## The Problem

- La profesora califica cinco criterios (descripción, product backlog, sprint backlog, reflexión
  individual, conclusión) y tiene que contar palabras y revisar campos a mano.
- El equipo puede introducir inconsistencias al editar (horas que no suman, una tarea sin responsable,
  una reflexión de 205 palabras) y no lo nota hasta después de entregar.
- Un plan de sprint en tabla no muestra el riesgo: Mauricio tiene 23 de 26 h posibles y nadie lo ve en
  el documento.

## The Solution

Un portal de lectura con 11 páginas: Resumen, Proyecto (C1), Equipo y roles, Product backlog (C2),
Sprint backlog (C3: tabla, tablero, calendario, carga), Simulación, Reflexiones (C4), Conclusión (C5),
Cumplimiento, Metodología y Entregables. Todo número se calcula; la rúbrica se comprueba sola; una
simulación Monte Carlo estima la probabilidad de tener todo listo para validarlo en la sprint review del
viernes.

## What Makes This Different

- **Una sola fuente**: el mismo `contenido.py` que genera el .docx y el .pdf alimenta el portal; no hay
  dos versiones del texto. El .docx va en Calibri 12 / 1,5 en todo el documento y el .pdf lo exporta
  Microsoft Word desde ese .docx (`../fuente/construir.py`).
- **Verificable**: cifras calculadas, rúbrica comprobada, entregables con SHA-256.
- **Honesto sobre el alcance**: el sprint de AgendaFácil se presenta como plan, y todo lo que el portal
  añade se rotula como complemento.

## Who This Serves

- **Profesora evaluadora** (Adriana Cervantes Castillo): revisa los cinco criterios y su cumplimiento en
  minutos.
- **Integrantes del equipo 2073 F**: detectan errores antes del cierre (26-oct-2026, 23:59) y confirman
  roles y reflexiones.
- **Visitante**: entiende cómo se planea un sprint y cómo se construyó el portal.

## Success Criteria

- 100 % del texto igual al .pdf entregado.
- Cumplimiento: 5 criterios en verde (16 de 17); solo el límite de 500 palabras como aviso
  explicados.
- Simulación de 2000 iteraciones en < 5 s.
- Accesibilidad AA sin errores críticos; `anon` de Supabase sin acceso a las tablas.

## Scope

**Dentro**: las 11 páginas, API de lectura calculada, simulación Monte Carlo, ZIP de entregables con
manifiesto, despliegue en Swarm.

**Fuera**: cuentas y edición en línea del contenido; ejecutar o registrar avance real del sprint de
AgendaFácil; construir AgendaFácil; entregar en Moodle desde el portal.

## Vision

Plantilla reutilizable para las siguientes actividades de la maestría: contenido académico en un solo
archivo, portal que lo presenta y lo verifica, y la metodología (spec-kit + BMAD) documentada como parte
del entregable.
