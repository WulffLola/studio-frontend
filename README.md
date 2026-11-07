# STUDIO · Frontend

Interfaz web de **STUDIO**, una plataforma para la gestión operativa de estudios de Pilates. Es la herramienta que usan la recepción y la administración del estudio en el día a día.

Consume la API de [studio-backend](https://github.com/WulffLola/studio-backend).

## Pantallas

| Ruta | Qué se hace |
|---|---|
| `/login` | Ingreso con email o DNI. |
| `/studioSelection` | Elección de la sede con la que se va a trabajar. |
| `/` | Inicio con accesos rápidos y la frase del día. |
| `/students` | Alumnos: alta, edición, planes vigentes, deudores y activos/inactivos. |
| `/lowsHistory` | Historial de bajas. |
| `/appointments` | Agenda semanal, reservas y lista de espera. |
| `/studios` | Estudios, salas, feriados, plantillas de turnos y generación de la agenda. |
| `/plans` | Tipos de plan, planes, precios por medio de pago, actividades y descuentos. |
| `/teachers` | Profesores, asignación a turnos y horas extra. |
| `/payments` | Cobros con uno o varios planes y comprobantes. |
| `/cashRegister` | Caja diaria: pagos y gastos. |
| `/stadistics` | Indicadores de ocupación, alumnos y finanzas. |
| `/studio-tips` | Notas y recetas que ven los alumnos. |
| `/feed` | Publicaciones para la app de alumnos. |
| `/users` | Usuarios del sistema y sus roles. |
| `/actions` | Registro de acciones de los operadores. |
| `/settings` | Configuración del estudio. |

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

## Instalación

Requisitos: Node 18 o superior y el backend corriendo.

```bash
git clone https://github.com/WulffLola/studio-frontend.git
cd studio-frontend
cp .env.example .env.local
npm install
npm run dev
```

Queda en `http://localhost:3000`.

Con los datos de prueba del backend se puede entrar con `admin@studio.local` / `studio1234`.

## Variables de entorno

Están todas en [`.env.example`](.env.example). Cada endpoint del backend tiene su variable `NEXT_PUBLIC_URL_BACKEND_*`, así se puede apuntar a otro servidor cambiando solo la URL base. Si el backend corre en otro host o puerto, hay que reemplazar `http://localhost:8000` en todo el archivo.

## Docker

```bash
cp .env.example .env.production
docker compose -f docker-compose.production.yml up -d --build
```

Queda publicado en el puerto `4010`. Para un entorno de pruebas está `docker-compose.testing.yml`, que lee `.env.testing`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build de producción. |
| `npm start` | Sirve el build. |
| `npm run lint` | ESLint. |

## Autora

Lola Wulff
