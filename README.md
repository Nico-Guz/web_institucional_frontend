# Web Institucional Frontend

Frontend institucional headless basado en Next.js 16, React 19 y
`next-drupal`. Consume el contenido publicado por Drupal mediante JSON:API.

## Requisitos

- Node.js 20.x o superior
- npm
- Docker opcional para ejecutar el frontend en un contenedor

## Instalacion local

Instala las dependencias y crea las variables de entorno:

```bash
npm install
cp .env.example .env.local
```

Para ejecutar Next.js directamente en el host, cambia `DRUPAL_BASE_URL` en
`.env.local` a la URL publicada por Drupal en tu maquina:

```env
DRUPAL_BASE_URL=http://localhost:8080
NEXT_PUBLIC_DRUPAL_BASE_URL=http://localhost:8080
NEXT_IMAGE_DOMAIN=localhost
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre http://localhost:3000.

## Integracion con Docker Compose

Cuando Next.js se ejecuta como servicio Docker, `DRUPAL_BASE_URL` debe usar
el nombre del servicio interno de Compose, no `localhost`:

```env
DRUPAL_BASE_URL=http://backend:80
NEXT_PUBLIC_DRUPAL_BASE_URL=http://localhost:8080
NEXT_IMAGE_DOMAIN=backend
```

La estructura esperada por el Compose local es:

```text
udistrital-local/
├── docker-compose.yml
├── web_institucional_backend/
└── web_institucional_frontend/
```

Desde la raiz del entorno Compose:

```bash
docker compose build frontend
docker compose up -d frontend
```

El `Dockerfile` usa una compilacion de tres etapas y `output: "standalone"`
para producir una imagen de produccion.

## Comandos

```bash
npm run dev       # Desarrollo con recarga automatica
npm run lint      # ESLint
npm run build     # Compilacion de produccion
npm run start     # Ejecuta la compilacion producida
```

## Estructura principal

- `app/page.tsx`: listado de articulos publicados.
- `app/[...slug]/page.tsx`: pagina individual por alias de Drupal.
- `app/acerca-de/page.tsx`: pagina institucional fija.
- `lib/drupal.ts`: cliente centralizado de `next-drupal`.
- `next.config.js`: salida standalone y dominios autorizados para imagenes.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DRUPAL_BASE_URL` | URL que usa el servidor Next.js para consultar Drupal |
| `NEXT_PUBLIC_DRUPAL_BASE_URL` | URL publica disponible para el navegador |
| `NEXT_IMAGE_DOMAIN` | Host permitido para imagenes remotas |
| `DRUPAL_CLIENT_ID` | Opcional; OAuth para contenido privado |
| `DRUPAL_CLIENT_SECRET` | Opcional; secreto OAuth |
| `DRUPAL_REVALIDATE_SECRET` | Opcional; revalidacion bajo demanda |

No subas `.env.local` ni credenciales al repositorio. El archivo
`.env.example` si debe versionarse.

## Despliegue en AWS Amplify

Amplify debe conectarse al repositorio de este frontend y construirlo con
`npm ci` y `npm run build`. Configura las variables en Amplify, no en el
repositorio:

- `DRUPAL_BASE_URL`: URL HTTPS publica del backend Drupal.
- `NEXT_PUBLIC_DRUPAL_BASE_URL`: solo si alguna funcionalidad del navegador la
  necesita.
- `NEXT_IMAGE_DOMAIN`: dominio del backend sin protocolo.

El backend debe ser accesible desde internet mediante HTTPS, normalmente a
traves de un Application Load Balancer, CloudFront o una solucion equivalente.
Amplify no puede resolver el hostname interno `backend` de Docker.

Para produccion, usa Node.js 20 o una version soportada por Amplify y revisa
la configuracion de dominios de imagenes en `next.config.js`.

## Repositorio relacionado

El contenido proviene del repositorio independiente del backend Drupal. Para
desarrollo local, ambos repositorios se clonan junto con el repositorio de
infraestructura que contiene `docker-compose.yml`.
