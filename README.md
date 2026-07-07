# Store Manager

Aplicacion web para administrar un negocio local con autenticacion (Better Auth), panel protegido y persistencia en PostgreSQL con Prisma.

## Stack

- Next.js 16 (App Router)
- React 19
- Better Auth
- Prisma 7 + PostgreSQL
- Tailwind CSS 4

## Requisitos

- Node.js 20+
- npm 10+
- Base de datos PostgreSQL accesible

## Variables de entorno

Crea un archivo `.env` con las siguientes variables:

```env
DATABASE_URL=
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=
NEXT_PUBLIC_AUTH_BASE_URL=http://localhost:3000
ADMIN_EMAILS=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Notas:

- `ADMIN_EMAILS` acepta una lista separada por comas.
- `NEXT_PUBLIC_AUTH_BASE_URL` debe coincidir con la URL publica del frontend.

## Instalacion

```bash
npm install
```

## Desarrollo

1. Genera cliente de Prisma:

```bash
npx prisma generate
```

2. Aplica migraciones:

```bash
npx prisma migrate dev
```

3. Inicia la app:

```bash
npm run dev
```

Aplicacion disponible en `http://localhost:3000`.

## Scripts

```bash
npm run dev      # entorno local
npm run build    # build de produccion
npm run start    # iniciar build de produccion
npm run lint     # ejecutar ESLint
```

## Estructura relevante

- `app/api/auth/[...all]/route.ts`: handler de Better Auth para Next.js.
- `app/auth/(dashboard)/*`: secciones protegidas del panel.
- `src/lib/auth.ts`: configuracion de Better Auth.
- `src/lib/auth-server.ts`: helpers de sesion y autorizacion en servidor.
- `prisma/schema.prisma`: modelos y relaciones.
- `prisma/migrations/*`: historial de migraciones.

## Seed

El proyecto incluye un seed basico en `prisma/seed.ts` que promueve a rol `admin` los correos definidos en `ADMIN_EMAILS`.

Para ejecutar seed:

```bash
npx prisma db seed
```

## Despliegue

Antes de desplegar:

1. Define todas las variables de entorno en el proveedor.
2. Ejecuta migraciones en la base de datos objetivo.
3. Asegura que `BETTER_AUTH_URL` y `NEXT_PUBLIC_AUTH_BASE_URL` apunten al dominio final.
