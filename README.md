# Sistema para Ferias Artesanales Indígenas

Este repositorio contiene el desarrollo del sistema de información para la gestión de productos, ventas y eventos artesanales, dirigido a comunidades indígenas. Está estructurado como un **monorepo** que incluye tanto el frontend como el backend, además de la documentación oficial del proyecto.

## Estructura del monorepo

```text
sirindango/
├── backend/      # API REST construida con NestJS + Prisma + PostgreSQL
├── frontend/     # Interfaz de usuario con Next.js (App Router) + Tailwind + shadcn/ui
├── docs/         # Documentación oficial: requerimientos, diagramas, guías, etc.
└── README.md     # Este archivo
```

## Tecnologías base

- Backend: NestJS + Prisma ORM + PostgreSQL
- Frontend: Next.js (App Router) + TailwindCSS + shadcn/ui
- Base de datos: PostgreSQL
- Validaciones: Zod (a nivel de configuración y DTOs)
- Control de versiones: Git + GitHub con flujo GitFlow
- Documentación: Markdown

## Guía de trabajo (resumen)

- Se utiliza GitFlow: ramas `develop`, `feature/`, `fix/`, `docs/`, `refactor/`, `hotfix/`
- Commits semánticos con formato: `tipo(scope): descripción`
- Issues con formato: `[Backend] Crear módulo de productos`, con descripción técnica y checklist de tareas
- Todo el flujo sigue la guía oficial ubicada en `docs/guia-gitflow.md`

## Estado actual

El sistema se encuentra en fase inicial. Ya se han definido los requerimientos y se avanza con:

- Definición de requerimientos funcionales y no funcionales
- Configuración del monorepo y documentación base
- Implementación inicial del backend con módulos por entidad
- Estructura del frontend (pantallas por flujo)

## Recomendaciones de uso

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/sirindango.git
cd sirindango
```