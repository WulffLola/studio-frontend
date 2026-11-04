# STUDIO · Frontend

Interfaz web de **STUDIO**, una plataforma para la gestión operativa de estudios de Pilates. Es la herramienta que usan la recepción y la administración del estudio en el día a día.

Consume la API del proyecto `studio-backend`.

## Pantallas

| Ruta | Qué se hace |
|---|---|
| `/login` | Ingreso con email o DNI. |
| `/studioSelection` | Elección de la sede con la que se va a trabajar. |
| `/` | Inicio con accesos rápidos y la frase del día. |
| `/students` | Alumnos: alta, edición, planes vigentes, deudores y activos/inactivos. |
| `/lowsHistory` | Historial de bajas del último año. |
| `/appointments` | Agenda semanal, reservas y lista de espera. |
| `/studios` | Estudios, salas, feriados, plantillas de turnos y generación de la agenda. |
| `/plans` | Tipos de plan, planes, precios por medio de pago, actividades y descuentos. |
| `/teachers` | Profesores, asignación a turnos y horas extra. |
| `/payments` | Cobros con uno o varios planes y comprobantes. |
| `/cashRegister` | Caja diaria: pagos y gastos. |
| `/stadistics` | Indicadores de ocupación, alumnos y finanzas. |
| `/feed` | Contenido para alumnos: publicaciones del inicio y, en la pestaña *Studio Tips*, notas y recetas (`/studio-tips`). |
| `/users` | Usuarios del sistema y sus roles. |
| `/actions` | Registro de acciones de los operadores. |

Lo que ve cada usuario depende de su rol (Super, Administrador o Consultor).

## Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 |
| Lenguaje | TypeScript |
| UI | Chakra UI, con un tema propio en `src/theme` |
| Estado | Redux Toolkit |
| HTTP | Axios |
| Gráficos | Recharts |
| Editor de texto | Tiptap |

## Estructura

```
src/
├── app/
│   ├── components/      # modales, tablas y componentes compartidos
│   │   └── ui/          # piezas base: logo, loaders, buscador, selects, badges
│   ├── stores/          # store de Redux y slices
│   ├── hooks/           # hooks propios (useAuth)
│   ├── utils/           # helpers de montos y estudios
│   ├── api/             # rutas internas de Next
│   └── <pantalla>/      # una carpeta por pantalla (page.tsx)
└── theme/               # colores, tipografía y estilos de componentes
public/brand/            # logos de STUDIO
```

## Cómo levantarlo

### 1. Requisitos

- **Docker Desktop** (Windows o Mac) o Docker Engine + Docker Compose (Linux). Se descarga de https://www.docker.com/products/docker-desktop/ y tiene que estar abierto.
- **El backend levantado** y con los datos de prueba cargados (ver el README de `studio-backend`). La API tiene que responder en `http://localhost:8000/`.
- El puerto `4010` libre.

No hace falta instalar Node: corre dentro del contenedor.

### 2. Descomprimir

Descomprimir `studio-frontend.zip` y abrir una terminal dentro de la carpeta `studio-frontend`.

### 3. Levantar

```bash
cp .env.example .env.production
docker compose -f docker-compose.production.yml up -d --build
```

En Windows con CMD se usa `copy .env.example .env.production` en lugar de `cp`.

La primera vez tarda varios minutos porque instala las dependencias y compila el proyecto.

Durante la instalación aparecen avisos de paquetes deprecados y de vulnerabilidades en dependencias (`npm warn deprecated`, `caniuse-lite is outdated`). No impiden que funcione.

### 4. Entrar

Abrir **http://localhost:4010** y entrar con `admin@studio.local` / `studio1234`. Después de iniciar sesión se elige el estudio con el que se va a trabajar (por ejemplo *Studio Central*).

También se puede entrar con `super@studio.local` o `recepcion@studio.local` (misma contraseña) para ver las pantallas según cada rol. El Consultor solo ve los estudios completamente configurados; con los datos de prueba es *Studio Central*.

### 5. Apagar

```bash
docker compose -f docker-compose.production.yml down
```

## Desarrollo sin Docker (opcional)

Requisitos: Node 18 o superior.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Queda en `http://localhost:3000`.

## Variables de entorno

Están todas en [`.env.example`](.env.example). Cada endpoint del backend tiene su variable `NEXT_PUBLIC_URL_BACKEND_*`, así se puede apuntar a otro servidor cambiando solo la URL base. Si el backend corre en otro host o puerto, hay que reemplazar `http://localhost:8000` en todo el archivo y volver a construir la imagen (`up -d --build`), porque las variables se fijan al compilar.

## Entorno de pruebas

`docker-compose.testing.yml` levanta el modo desarrollo en el puerto `4009` y lee `.env.testing`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build de producción. |
| `npm start` | Sirve el build. |
| `npm run lint` | ESLint. |

## Autora

Lola Wulff
