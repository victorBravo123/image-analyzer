# Analizador Inteligente de Contenido de Imágenes

Aplicación web full-stack que permite subir una imagen, la analiza mediante un
servicio de IA (Imagga) y muestra las etiquetas detectadas con su nivel de
confianza.

**Flujo:** el usuario elige una imagen (con vista previa y validación) → el
backend verifica que el archivo sea realmente una imagen (magic bytes) → la
envía al proveedor de IA → devuelve `tags` ordenados por confianza → la UI los
muestra con barras de confianza.

## Tecnologías

| Capa | Stack |
|---|---|
| Backend | Node.js 22 · TypeScript 5 · Express 4 · Zod · Pino — **arquitectura hexagonal** |
| Frontend | React 18 · Vite 6 · TypeScript 5 |
| IA | [Imagga](https://imagga.com/) (adaptador intercambiable + modo demo sin credenciales) |
| Testing | Jest + Supertest (backend, 47 tests) · Vitest + Testing Library (frontend) |
| Infra | Docker multi-stage + docker-compose + nginx |

## Ejecución rápida con Docker (recomendada)

Requiere Docker. No necesita API key: por defecto usa un anotador de
demostración determinista.

```bash
docker compose up --build
```

Abre **http://localhost:8080**. Listo.

Para usar la IA real (Imagga), crea un archivo `.env` en la raíz:

```env
ANNOTATOR=imagga
IMAGGA_API_KEY=tu_api_key
IMAGGA_API_SECRET=tu_api_secret
```

y vuelve a ejecutar `docker compose up --build`.

## Ejecución local (sin Docker)

Requiere Node.js ≥ 20.

**Backend** (puerto 3000):

```bash
cd backend
npm install
copy .env.example .env   # Linux/macOS: cp .env.example .env
npm run dev
```

**Frontend** (puerto 5173, en otra terminal):

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173**. El dev-server de Vite hace proxy de `/api`
hacia el backend, así que no hay que configurar CORS ni URLs.

## Variables de entorno (backend)

Copiar `backend/.env.example` a `backend/.env` y ajustar:

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del API | `3000` |
| `MAX_IMAGE_MB` | Tamaño máximo de imagen aceptado | `5` |
| `ANNOTATOR` | Proveedor de IA: `imagga` o `fake` (demo sin credenciales) | `fake` |
| `IMAGGA_API_KEY` | API key de Imagga (obligatoria si `ANNOTATOR=imagga`) | — |
| `IMAGGA_API_SECRET` | API secret de Imagga | — |
| `IMAGGA_TIMEOUT_MS` | Timeout de la llamada al proveedor | `10000` |

Las credenciales gratuitas se obtienen en <https://imagga.com/auth/signup>
(plan free, sin tarjeta). La configuración se valida al arrancar: si falta una
variable requerida el proceso falla de inmediato con un mensaje claro.

## API

### `POST /api/analyze`

`multipart/form-data` con el archivo en el campo **`image`** (JPG, PNG, WebP o GIF, máx. 5 MB).

```bash
curl -X POST http://localhost:3000/api/analyze -F "image=@foto.jpg"
```

```json
{
  "tags": [
    { "label": "dog", "confidence": 0.98 },
    { "label": "park", "confidence": 0.91 }
  ]
}
```

**Errores** — siempre con la forma `{ "error": { "code", "message" } }`:

| HTTP | `code` | Caso |
|---|---|---|
| 400 | `IMAGE_REQUIRED` / `INVALID_UPLOAD` | Sin archivo o campo incorrecto |
| 413 | `IMAGE_TOO_LARGE` | Archivo mayor a `MAX_IMAGE_MB` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | El contenido no es una imagen (se inspeccionan los *magic bytes*, no la extensión) |
| 502 | `ANALYSIS_FAILED` | El proveedor de IA falló o no respondió a tiempo |
| 503 | `SERVICE_UNAVAILABLE` | Rate limit del proveedor |

### `GET /api/health`

Healthcheck: `{ "status": "ok" }`.

## Tests

```bash
cd backend && npm test          # unit + integración (supertest)
cd frontend && npm test         # componentes (Vitest + Testing Library)
```

Otros scripts útiles en ambos proyectos: `npm run lint`, `npm run typecheck`
(backend), `npm run build`.

## Arquitectura

Backend con **arquitectura hexagonal** (ports & adapters). La regla de
dependencia apunta siempre hacia adentro:

```
        HTTP (Express, multer)          Imagga API
              │  driving                    ▲  driven
              ▼                             │
┌─────────────────────────────────────────────────────┐
│  infrastructure   http/ · providers/ · config/      │
│  ┌───────────────────────────────────────────────┐  │
│  │  application    AnalyzeImageUseCase           │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  domain    Tag · ImageAnalysis          │  │  │
│  │  │            puerto ImageAnnotator        │  │  │
│  │  │            detectImageFormat (magic     │  │  │
│  │  │            bytes) · errores tipados     │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

La pieza clave es el puerto `ImageAnnotator`: Imagga es un adaptador más
(`ImaggaAnnotator`), igual que el modo demo (`FakeAnnotator`). Cambiar de
proveedor de IA (Google Vision, OpenAI…) es escribir otro adaptador y
seleccionarlo en el composition root — el dominio, el caso de uso y la capa
HTTP no se tocan. El frontend replica la misma separación en versión ligera
(`domain / application / infrastructure / ui`).

Más detalle y decisiones técnicas en [`docs/architecture.md`](docs/architecture.md).
El uso de IA durante el desarrollo está documentado en [`docs/AI_USAGE.md`](docs/AI_USAGE.md).

## Decisiones destacadas

- **Seguridad del upload:** validación por *magic bytes* en el servidor (nunca
  se confía en el mime type del cliente), límite de tamaño en multer, imagen
  procesada solo en memoria (nunca se escribe a disco), API keys únicamente
  por variables de entorno y `.gitignore` desde el primer commit.
- **Manejo de errores:** errores de dominio tipados traducidos en un único
  punto a códigos HTTP estables; los errores inesperados devuelven un 500
  opaco para no filtrar internals.
- **Modo demo:** `ANNOTATOR=fake` permite evaluar toda la aplicación sin
  registrar ninguna cuenta externa.
