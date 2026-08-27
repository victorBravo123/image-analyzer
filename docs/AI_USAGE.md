# Uso de IA en el desarrollo

La prueba pedía explícitamente apoyarse en IA. Este documento transparenta
cómo se usó (Claude Code como asistente de desarrollo) y qué quedó bajo
criterio y revisión del autor.

## Qué hizo la IA

- Redactar el plan de implementación inicial a partir del enunciado (fases,
  ramas, criterios de evaluación → mapa de cumplimiento).
- Generar el scaffolding de ambos proyectos (tooling de TypeScript, ESLint,
  Jest/Vitest, Docker) y el boilerplate repetitivo.
- Escribir primeras versiones de código y tests siguiendo la arquitectura
  definida, que luego revisé y ajusté.
- Detectar y corregir fricciones de tooling (p. ej. incompatibilidad de tipos
  entre vitest 2 y vite 6).

## Qué decidió y validó el autor

- **Arquitectura:** hexagonal con el proveedor de IA detrás de un puerto del
  dominio; Express en lugar de NestJS para que la composición sea explícita.
- **Proveedor:** Imagga por su plan gratuito y porque su respuesta mapea
  directo al contrato pedido; modo `fake` para evaluar sin credenciales.
- **Política de errores y seguridad:** códigos HTTP estables, magic bytes en
  el servidor, imagen solo en memoria, credenciales únicamente por entorno.
- **Verificación:** cada fase se validó ejecutando la suite completa (52
  tests), lint, typecheck, build y smoke tests manuales del API y del stack
  Docker antes de cada merge.

## Postura

La IA aceleró la ejecución (scaffolding, boilerplate, tests exhaustivos);
las decisiones de diseño, la revisión del código y la validación final son
responsabilidad del autor. Todo commit fue revisado antes de integrarse a
`main`.
