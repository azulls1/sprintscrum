-- ════════════════════════════════════════════════════════════════════════════
-- SprintScrum · AgendaFácil — esquema (Supabase maestría, esquema public)
-- Nomenclatura: "SprintScrum_<tabla>" (identificadores entre comillas dobles).
-- Idempotente: se puede volver a correr sin perder datos.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- El proyecto planeado (una fila). Los textos salen de fuente/contenido.py.
create table if not exists public."SprintScrum_proyecto" (
    id                 text primary key,
    empresa            text not null,
    cliente            text not null,
    producto           text not null,
    objetivo_producto  text not null,
    objetivo_sprint    text not null,
    descripcion        jsonb not null,          -- párrafos del apartado 1
    portada            jsonb not null,          -- universidad, asignatura, equipo, profesora…
    duracion_dias      smallint not null check (duracion_dias between 1 and 30),
    nota_backlog       text not null,
    nota_sprint        text not null,
    conclusion         text not null,
    actualizado_en     timestamptz not null default now()
);

create table if not exists public."SprintScrum_integrantes" (
    id               smallint primary key,
    nombre           text not null unique,
    nombre_corto     text not null unique,     -- como aparece en el sprint backlog
    rol              text not null,
    rol_scrum        text not null check (rol_scrum in ('product_owner', 'scrum_master', 'developer')),
    responsabilidad  text not null,
    orden            smallint not null
);

create table if not exists public."SprintScrum_historias" (
    id          text primary key check (id ~ '^HU-[0-9]{2}$'),
    orden       smallint not null unique,
    texto       text not null,
    prioridad   text not null check (prioridad in ('Alta', 'Media', 'Baja')),
    puntos      smallint not null check (puntos in (1, 2, 3, 5, 8, 13, 21)),
    en_sprint   boolean not null default false,
    criterios   jsonb not null default '[]'::jsonb   -- criterios de aceptación (ampliación del portal)
);

create table if not exists public."SprintScrum_tareas" (
    id              smallint primary key,
    historia_id     text not null references public."SprintScrum_historias"(id) on delete cascade,
    nombre          text not null,
    responsable_id  smallint not null references public."SprintScrum_integrantes"(id),
    horas           numeric(4,1) not null check (horas > 0),
    dia_inicio      smallint not null check (dia_inicio between 1 and 5),
    dia_fin         smallint not null check (dia_fin between 1 and 5),
    tipo            text not null check (tipo in ('analisis', 'backend', 'frontend', 'pruebas', 'validacion')),
    check (dia_fin >= dia_inicio)
);
-- Precedencias del plan (ids de tareas que deben terminar antes)
alter table public."SprintScrum_tareas" add column if not exists depende_de smallint[] not null default '{}';
create index if not exists "SprintScrum_tareas_historia" on public."SprintScrum_tareas" (historia_id);

create table if not exists public."SprintScrum_eventos" (
    id            smallint primary key,
    nombre        text not null,
    dia           smallint not null check (dia between 1 and 5),
    hora          time not null,
    duracion_min  smallint not null check (duracion_min > 0),
    facilitador_id smallint not null references public."SprintScrum_integrantes"(id),
    descripcion   text not null
);

create table if not exists public."SprintScrum_reflexiones" (
    integrante_id  smallint primary key references public."SprintScrum_integrantes"(id) on delete cascade,
    titulo         text not null,
    texto          text not null
);

-- Simulaciones Monte Carlo pedidas desde el portal (las ejecuta el worker de Celery)
create table if not exists public."SprintScrum_simulaciones" (
    id             uuid primary key default gen_random_uuid(),
    task_id        text,
    estado         text not null default 'pendiente' check (estado in ('pendiente', 'completada', 'error')),
    parametros     jsonb not null,
    resultado      jsonb,
    error          text,
    duracion_ms    int,
    creado_en      timestamptz not null default now(),
    completado_en  timestamptz
);
create index if not exists "SprintScrum_simulaciones_creado" on public."SprintScrum_simulaciones" (creado_en desc);

-- Catálogo de archivos entregables (lo llena scripts/preparar_entregables.py en cada despliegue)
create table if not exists public."SprintScrum_entregables" (
    ruta      text primary key,
    nombre    text not null,
    tipo      text not null,
    criterio  text not null,
    detalle   text not null default '',
    bytes     bigint not null,
    sha256    text not null check (length(sha256) = 64),
    orden     smallint not null default 0
);

create table if not exists public."SprintScrum_paquetes" (
    id             uuid primary key default gen_random_uuid(),
    task_id        text,
    estado         text not null default 'pendiente' check (estado in ('pendiente', 'completada', 'error')),
    archivo        text,
    n_archivos     int,
    bytes          bigint,
    sha256         text,
    error          text,
    creado_en      timestamptz not null default now(),
    completado_en  timestamptz
);

commit;
