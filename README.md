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
- `app/api/dashboard/products/lookup/route.ts`: lookup de productos para flujo de venta rapida (protegido para admin).
- `app/dashboard/*`: secciones protegidas del panel.
- `src/lib/auth.ts`: configuracion de Better Auth.
- `src/lib/auth-server.ts`: helpers de sesion y autorizacion en servidor.
- `prisma/schema.prisma`: modelos y relaciones.
- `prisma/migrations/*`: historial de migraciones.

## Inventario: reglas de acciones

- `Editar`: permite actualizar nombre, SKU, precio, stock y estado del producto.
- `Eliminar` en producto activo:
	- si `quantity = 0`, elimina fisicamente el producto.
	- si `quantity > 0`, no elimina: lo marca como inactivo para proteger historial y operacion.
- `Activar` en producto inactivo: vuelve a marcarlo como activo.
- La tabla de inventario muestra un badge de stock (`Stock bajo` o `Con stock`) para facilitar decisiones rapidas.

## Ventas: modo escaner (kiosko)

- Vista: `app/dashboard/ventas/page.tsx`.
- Componente principal: `src/features/admin/sales/components/QuickSaleRegister.tsx`.
- Flujo:
	- El input esta en autofocus para usar lector USB tipo teclado.
	- Cada lectura con sufijo `Enter` ejecuta busqueda y agrega 1 unidad al carrito.
	- En celular, usa el boton `Escanear con camara` para leer codigo desde la camara.
	- Puedes elegir camara `Trasera` o `Frontal` antes (o durante) el escaneo.
	- Al detectar codigo, se emite vibracion y opcionalmente un beep de confirmacion.
	- Prioriza match exacto por SKU; si no existe, intenta coincidencia por nombre/SKU.
	- Solo agrega productos activos con stock disponible.
- Carrito:
	- Permite aumentar/disminuir cantidades respetando stock.
	- Muestra subtotales por item y total global.
	- Permite seleccionar metodo de pago antes del cierre.

Nota: actualmente el boton `Cerrar venta` implementa cierre rapido en memoria (UI) para operacion de mostrador. Si necesitas persistencia contable/fiscal, agrega modelo `Sale` y `SaleItem` en Prisma y una server action para descontar stock de forma transaccional.

Compatibilidad movil para camara:

- Recomendado Chrome/Edge movil.
- Requiere permisos de camara.
- En muchos navegadores, `getUserMedia`/lectura de codigos exige contexto seguro (`https://` o `http://localhost`).

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
