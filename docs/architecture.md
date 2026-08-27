# Arquitectura

## Visión general

```
┌──────────────┐   multipart    ┌──────────────────────────┐   multipart   ┌────────────┐
│   Frontend   │ ─────────────▶ │        Backend API       │ ────────────▶ │  Imagga    │
│  React+Vite  │                │  Express · hexagonal     │               │  (o fake)  │
│              │ ◀───────────── │                          │ ◀──────────── │            │
└──────────────┘   tags JSON    └──────────────────────────┘   tags 0-100  └────────────┘
```

En desarrollo el dev-server de Vite hace proxy de `/api` al backend; en Docker
ese rol lo cumple nginx. En ambos casos el navegador ve **un solo origen**, por
lo que no existe configuración de CORS que mantener.

## Backend: hexagonal (ports & adapters)

Regla de dependencia: `infrastructure → application → domain`. Nada del dominio
importa Express, fetch ni ninguna librería.

| Capa | Contenido | Regla |
|---|---|---|
| `domain` | `Tag`, `ImageAnalysis`, `detectImageFormat`, puerto `ImageAnnotator`, errores tipados | Cero dependencias externas; invariantes en los constructores |
| `application` | `AnalyzeImageUseCase` | Orquesta: valida formato → llama al puerto → ordena resultado |
| `infrastructure` | `http/` (rutas, multer, error handler), `providers/` (Imagga, fake, factory), `config/` (env con zod) | Adaptadores que implementan o consumen los puertos |
| `main.ts` | Composition root | Único archivo que conoce todos los adaptadores concretos |

### Por qué así

- **El puerto `ImageAnnotator` es el corazón del diseño.** El requisito
  "integrar un servicio de IA de terceros" es exactamente el caso de uso de un
  puerto: la dependencia externa más volátil queda detrás de una interfaz del
  dominio. `ImaggaAnnotator` y `FakeAnnotator` son adaptadores equivalentes;
  agregar Google Vision u OpenAI sería un archivo nuevo + una línea en el
  factory.
- **Validación por magic bytes en el dominio.** Decidir "¿esto es una imagen?"
  es una regla de negocio, no un detalle HTTP. Además el chequeo evita gastar
  una llamada (con costo y cuota) del proveedor en archivos inválidos.
- **Errores tipados con traducción única.** El dominio lanza errores con un
  `code` estable; `error-handler.ts` es el único punto que los convierte a
  HTTP (415/502/503…). El frontend consume esos códigos, no mensajes.
- **Express en vez de NestJS.** Con un solo endpoint, un framework con DI
  ocultaría precisamente lo que la prueba quiere ver: la arquitectura se
  compone a mano en `main.ts` y las dependencias se inyectan por constructor,
  lo que además hace trivial el testing con fakes.
- **fetch nativo + AbortSignal.timeout.** Node ≥ 18 no necesita un cliente
  HTTP de terceros; una dependencia menos que auditar.

### Flujo de una petición

```
POST /api/analyze
  → multer (memoria, límite MAX_IMAGE_MB)          [infrastructure/http]
  → AnalyzeImageUseCase.execute({ content })        [application]
      → detectImageFormat(content)                  [domain]      → 415 si no es imagen
      → annotator.annotate({ content, format })     [puerto]      → 502/503 si falla
      → ImageAnalysis.fromTags(tags)                [domain]      orden por confianza
  → 200 { tags: [{ label, confidence }] }
```

## Frontend: la misma idea, en ligero

| Capa | Contenido |
|---|---|
| `domain` | Tipos del contrato + validación de archivo (tipo/tamaño) |
| `application` | `useImageSelection` (archivo + preview con ciclo de vida del object URL) y `useImageAnalysis` (máquina de estados idle/loading/success/error) |
| `infrastructure` | `analyze-client.ts`: único punto que conoce fetch y los códigos de error del API |
| `ui` | Componentes presentacionales (dropzone, spinner, lista de tags, banner de error) |

La validación del cliente es solo UX (feedback inmediato); la frontera de
seguridad real es siempre el backend.

## Testing

- **Unit (dominio y aplicación):** invariantes de `Tag`, detección de formatos
  (incluye un RIFF/WAV que no es WebP y un .txt renombrado), caso de uso con
  stub del puerto.
- **Unit (adaptadores):** `ImaggaAnnotator` con `fetch` espiado — mapeo de
  tags, auth Basic, 429→503, 401→502, timeout y fallo de red.
- **Integración:** supertest sobre la app real con el anotador inyectado;
  cubre el contrato completo de errores HTTP.
- **Frontend:** flujo completo con el cliente mockeado — habilitación del
  botón, spinner, tags renderizados, error del proveedor, estado vacío y
  archivo sobredimensionado.

## Qué haría con más tiempo

- Rate limiting propio en el API (p. ej. `express-rate-limit`) además del del proveedor.
- Reintentos con backoff ante 5xx transitorios de Imagga.
- Cache de resultados por hash del archivo (mismo contenido → misma respuesta).
- E2E real con Playwright sobre el stack de docker-compose.
