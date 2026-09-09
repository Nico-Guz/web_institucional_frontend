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
cp web_institucional_backend/.env.example web_institucional_backend/.env
docker compose build frontend
docker compose up -d db backend frontend
```

El servicio `frontend` usa la etapa `dev` del `Dockerfile`; Drupal se resuelve
como `http://backend:80` y desde el navegador se accede mediante
`http://localhost:8080`. La imagen final del Dockerfile usa Nginx para servir
la carpeta `out/`, pero no es necesaria para publicar en S3. El Compose monta
el código fuente y conserva `node_modules` y `.next` en volúmenes separados,
por lo que los cambios del frontend se reflejan mediante recarga automática.

### Imagenes en local

En desarrollo no se necesita S3. Drupal guarda los archivos publicos en el
volumen Docker `drupal_files` y los sirve mediante:

```text
http://localhost:8080/sites/default/files/NOMBRE_DEL_ARCHIVO
```

Para probar imagenes:

1. Abre `http://localhost:8080/user/login` y entra al panel de Drupal.
2. Crea o edita un articulo y carga una imagen en `field_poster`.
3. Publica el articulo y abre su alias desde `http://localhost:3000`.
4. Si la imagen no aparece, comprueba directamente su URL bajo
	`/sites/default/files/` y revisa que el contenedor `backend` este activo.

El Compose publica `localhost:8080` para el navegador y usa `backend:80` solo
para las consultas internas del contenedor frontend. Por eso las dos URLs son
intencionales y no deben sustituirse por una URL de S3 en desarrollo.

Durante `next dev`, las consultas de artículos no usan caché y las imágenes
reciben una versión temporal para que Drupal refleje inmediatamente un archivo
reemplazado con la misma ruta. Los artículos nuevos pueden requerir reiniciar
el servidor de desarrollo porque las rutas se generan al iniciar la aplicación.

## Comandos

```bash
npm run dev       # Desarrollo con recarga automatica
npm run lint      # ESLint
npm run build     # Genera la exportacion estatica en out/
```

## Estructura principal

- `app/page.tsx`: listado de articulos publicados.
- `app/[...slug]/page.tsx`: pagina individual por alias de Drupal.
- `app/acerca-de/page.tsx`: pagina institucional fija.
- `lib/drupal.ts`: cliente centralizado de `next-drupal`.
- `next.config.js`: salida estatica y dominios autorizados para imagenes.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DRUPAL_BASE_URL` | URL que usa el servidor Next.js para consultar Drupal |
| `NEXT_PUBLIC_DRUPAL_BASE_URL` | URL publica disponible para el navegador |
| `NEXT_IMAGE_DOMAIN` | Host permitido para imagenes remotas |
| `NEXT_IMAGE_PROTOCOL` | Protocolo permitido para imagenes remotas (`http` o `https`) |
No subas `.env.local` ni credenciales al repositorio. El archivo
`.env.example` si debe versionarse.

## Despliegue en AWS S3 + CloudFront

La aplicación usa `output: "export"`; el build consulta Drupal y genera los
archivos estáticos en `out/`. El endpoint de Drupal debe estar accesible por
HTTPS durante el build:

```bash
export DRUPAL_BASE_URL=https://api.example.com
export NEXT_PUBLIC_DRUPAL_BASE_URL=https://api.example.com
export NEXT_IMAGE_DOMAIN=api.example.com
export NEXT_IMAGE_PROTOCOL=https
npm ci
npm run build
aws s3 sync out/ s3://NOMBRE_DEL_BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id ID_DISTRIBUCION --paths '/*'
```

Las imágenes no se copian a S3 por este comando: el HTML exportado conserva
las URLs públicas que Drupal devuelve. Por tanto, Drupal debe seguir sirviendo
`/sites/default/files/` o las imágenes deben estar previamente disponibles en
S3/CloudFront.

Configura en S3 el hosting del sitio y en CloudFront los documentos raíz,
errores y rutas profundas según la estrategia de aliases elegida. Cada cambio
editorial requiere un nuevo build, una sincronización del bucket y una
invalidación de CloudFront.
No ejecutes `next start`: no existe un servidor Next.js en la distribución
estática.

El build falla si Drupal no responde o no devuelve artículos. Para una prueba
local sin backend se puede habilitar explícitamente el fallback vacío:

```bash
ALLOW_EMPTY_EXPORT=true npm run build
```

No uses `ALLOW_EMPTY_EXPORT` en CI ni en producción.

El backend Drupal debe ser accesible desde internet mediante HTTPS, normalmente
a través de un Application Load Balancer. El hostname interno `backend` solo
existe dentro de Compose y no debe configurarse en AWS.

## Etapas Docker

`node:20-alpine` se usa solo para instalar dependencias, generar `out/` y
ejecutar el desarrollo local. La etapa final de producción usa Nginx y contiene
únicamente los archivos estáticos. Estas etapas no crean servicios adicionales
en Compose; el único servicio del frontend es `frontend`.

## Repositorio relacionado

El contenido proviene del repositorio independiente del backend Drupal. Para
desarrollo local, ambos repositorios se clonan junto con el repositorio de
infraestructura que contiene `docker-compose.yml`.
