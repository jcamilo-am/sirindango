# GUÍA DE GITFLOW, RAMAS, COMMITS Y VERSIONAMIENTO

Esta guía define las reglas oficiales de trabajo colaborativo y versionamiento para el proyecto `sistema-ferias-iw`, desarrollado en un monorepo que contiene frontend (Next.js) y backend (NestJS). Todo artisan del equipo debe seguir estrictamente estas normas para mantener la consistencia, trazabilidad y profesionalismo del repositorio.

---

## 1. ESTRUCTURA DE RAMAS (BRANCHING)

El flujo de trabajo sigue el modelo GitFlow:

- `main`: Rama principal. Contiene las versiones estables listas para entrega o despliegue.
- `develop`: Rama base para el desarrollo continuo. Aquí se integran todas las tareas.
- `feature/nombre`: Para nuevas funcionalidades. Derivan de `develop`.
- `fix/nombre`: Para correcciones de errores. Derivan de `develop`.
- `docs/nombre`: Para cambios exclusivos en documentación.
- `refactor/nombre`: Para refactorizaciones internas sin cambiar funcionalidad.
- `hotfix/nombre`: Para arreglos críticos sobre `main`.

---

## 2. SINTAXIS DE COMMITS

Todos los commits deben seguir el formato semántico convencional:

```bash
<tipo>(área): descripción breve en minúsculas
```

### Tipos permitidos:

- `feat`: Nueva funcionalidad.
- `fix`: Corrección de error.
- `refactor`: Mejora interna sin cambio de lógica.
- `docs`: Documentación.
- `style`: Cambios de estilo sin lógica (espaciado, formato).
- `test`: Archivos de pruebas.
- `chore`: Tareas de mantenimiento.
- `ci`: Configuración de integración continua.
- `deps`: Cambios en dependencias.

### Áreas (scopes) permitidas:

- `frontend`: Interfaz de usuario (Next.js)
- `backend`: API y lógica del servidor (NestJS)
- `config`: Archivos de configuración (.env, tsconfig, eslint, etc.)
- `infra`: Infraestructura del proyecto (estructura de carpetas, scripts, setup inicial)
- `docs`: Documentación escrita (README, manuales, etc.)
- `repo`: Archivos raíz del repositorio (como .gitignore, package.json, etc.)
- `tests`: Pruebas (unitarias, e2e, mocks)
- `ci`: Automatizaciones, workflows, GitHub Actions
- `deps`: Manejo de dependencias (instalación, actualización, eliminación)

### Ejemplos de commits:

```bash
feat(frontend/productos): crear pantalla para registrar productos
fix(backend/ventas): corregir bug en cálculo de totales
refactor(frontend/shared): optimizar componente de botones
chore(repo): actualizar dependencias y scripts de inicio
```

---

## 3. USO DE ISSUES

- Cada issue representa una tarea específica.
- Título debe incluir el área de trabajo (ej: `[Frontend] Crear pantalla de ventas`).
- Descripción debe explicar qué se hará, cómo, para qué y criterios de aceptación.
- Se relaciona con ramas (`feature/nombre`) y commits.
- Pull Requests deben incluir `Closes #ID`, `Fixes #ID` o similar.

---

## 4. FLUJO DE TRABAJO

1. Iniciar desde la rama `develop`.
2. Crear una nueva rama desde `develop` con el tipo adecuado (`feature/`, `fix/`, etc).
3. Hacer cambios y commits semánticos.
4. Subir rama a GitHub.
5. Crear Pull Request hacia `develop`.
6. Revisar y hacer merge tras aprobación.
7. Al finalizar un ciclo de trabajo, merge de `develop` a `main`.
8. Crear un tag (versión) tras el merge a `main`.

---

## 5. NOMBRAMIENTO DE VERSIONES (TAGS)

Formato semántico: `vX.Y.Z`

- `X`: Cambios mayores (rupturas de compatibilidad o versiones grandes)
- `Y`: Mejoras importantes o nuevas funcionalidades sin romper lo anterior
- `Z`: Correcciones menores o pequeños ajustes

Ejemplos:

- `v1.0.0`: Primer prototipo funcional entregado
- `v2.0.0`: Versión completa final
- `v2.1.0`: Nuevas funcionalidades agregadas
- `v2.1.1`: Corrección urgente (hotfix)

---

## 6. CONVENCIONES GENERALES

- Todos los cambios deben asociarse a un issue.
- No se trabaja directamente en `main` ni `develop`.
- Mantener el `README.md` y demás documentación actualizada.
- Evitar `squash` o `rebase` en ramas compartidas para conservar trazabilidad.
- El changelog se genera automáticamente desde los commits y tags.
- Toda documentación interna debe estar en formato Markdown (`.md`).

---

Este documento debe consultarse antes de iniciar cualquier tarea. Toda modificación debe realizarse por medio de Pull Request aprobado por el equipo.

