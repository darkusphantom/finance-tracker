# Finance Tracker - Análisis Completo del Proyecto

## 1. Contexto del Proyecto

**Finance Tracker** es una aplicación web moderna diseñada para la gestión integral de finanzas personales. Su objetivo principal es ofrecer a al usuario una plataforma centralizada y visualmente atractiva para monitorizar sus ingresos, gastos, deudas, presupuestos y balances de cuentas.

La aplicación está construida utilizando las últimas tecnologías del ecosistema frontend y apoyada en servicios externos potentes para el almacenamiento de datos y capacidades de Inteligencia Artificial.

### Tecnologías Clave (Tech Stack)

- **Core:** Next.js 15 (App Router), React 18, TypeScript.
- **Estilos y UI:** Tailwind CSS, Shadcn UI (Radix Primitives), Lucide React.
- **Formularios:** React Hook Form, Zod.
- **Fechas:** date-fns, react-day-picker.
- **Gráficos:** Recharts.
- **Fuentes de Datos:** Notion API (Base de datos principal), Binance API, DolarAPI, Airtable.
- **Inteligencia Artificial:** Firebase Genkit (@genkit-ai/googleai) - Gemini API.

### Arquitectura y Patrones

- Uso intensivo de **React Server Components (RSC)** en el App Router de Next.js, limitando `"use client"` a componentes estrictamente interactivos.
- Tipado estricto con **TypeScript** apoyado por esquemas de **Zod**.
- **Patrón de UI:** Tablas de solo lectura para listar datos y Modales/Sheets (ej. `Dialog`) para edición y creación.
- **Manejo Defensivo:** Verificación de variables en cliente para compatibilidad SSR (ej. evitando errores de `localStorage`).
- **Acciones de Servidor seguras:** Rate limiting, validación de schemas de entrada y mitigación de inyecciones (ej. validaciones de seguridad en `actions.ts`).

---

## 2. Estructura del Proyecto

El proyecto sigue una estructura limpia orientada a funcionalidades, agrupada principalmente dentro del directorio `src`.

```text
finance-tracker/
├── docs/                        # Documentación técnica, blueprints y notas de despliegue.
├── src/
│   ├── ai/                      # Configuración de Firebase Genkit y prompts para IA.
│   ├── app/                     # Rutas de Next.js App Router (Páginas y Server Actions).
│   │   ├── accounts/            # Gestión de cuentas bancarias/billeteras.
│   │   ├── binance/             # Integración y balances de Binance.
│   │   ├── budget/              # Visualización de presupuestos y pagos programados.
│   │   ├── calculator/          # Calculadora de divisas (DolarAPI).
│   │   ├── chat/                # Interfaz conversacional (posible interacción con IA).
│   │   ├── dashboard/           # Panel principal con resúmenes y gráficos.
│   │   ├── debts/               # Seguimiento de deudas y préstamos.
│   │   ├── login/ & register/   # Flujos de autenticación.
│   │   ├── risk-analysis/       # Análisis de riesgos financieros.
│   │   ├── transactions/        # Historial de transacciones financieras.
│   │   ├── actions.ts           # Server Actions principales (Notion, mutaciones, etc.).
│   │   └── binance-actions.ts   # Server Actions específicas para Binance.
│   ├── components/              # Componentes de UI reutilizables.
│   │   ├── ui/                  # Componentes base de Shadcn UI (botones, inputs, dialogs).
│   │   └── ...                  # Formularios, tablas y gráficos específicos del dominio.
│   ├── hooks/                   # Custom Hooks de React (ej. validación SSR, fetchers).
│   └── lib/                     # Lógica de negocio y clientes API (Notion, utils, rate-limit).
├── package.json                 # Dependencias y scripts del proyecto.
└── tailwind.config.ts           # Configuración de temas y estilos de Tailwind.
```

---

## 3. Funcionalidades Principales

La aplicación ofrece un conjunto de herramientas robusto dividido en los siguientes módulos:

1.  **Panel de Control (Dashboard):**
    - Vista general del estado financiero.
    - Integración con gráficos (`Recharts`) para visualizar tendencias de gastos, ingresos y distribución de capital.

2.  **Gestión de Transacciones:**
    - Registro de ingresos y gastos.
    - Soporte avanzado para _Transferencias_ entre cuentas e _Intercambios_ de divisas.
    - Uso de formularios modales que actualizan reactivamente el estado de la aplicación tras el envío exitoso.

3.  **Seguimiento de Cuentas y Balances:**
    - Visualización de saldos en múltiples cuentas e instituciones.
    - Las transacciones y transferencias actualizan dinámicamente los balances.

4.  **Presupuestos y Planificación:**
    - Calendarios de pagos programados.
    - Integración de listas de deseos (Wishlist) conectadas a Notion.
    - Filtros interactivos y acceso a modales de creación desde vistas rápidas.

5.  **Control de Deudas:**
    - Asociación de transacciones específicas a deudas para cálculo automático de balances restantes.

6.  **Integración de Criptomonedas (Binance):**
    - Conexión con la API de Binance para obtener balances y valoraciones en tiempo real de billeteras cripto.

7.  **Herramientas Auxiliares:**
    - **Calculadora de Divisas:** Conversión en tiempo real soportada por DolarAPI.
    - **Asistente IA:** Extracción de transacciones a partir de lenguaje natural e interacciones conversacionales utilizando Firebase Genkit y Gemini API (con mecanismos de retries para evitar problemas de cuota).

8.  **Seguridad y Rendimiento:**
    - Flujos protegidos por Server Actions asegurados (`requireAuth`).
    - Limitador de tasa (Rate Limiting) para evitar abusos en APIs de terceros y endpoints de autenticación.
    - Diseño "Mobile-First" altamente responsivo, con especial foco en optimización de componentes asíncronos y Server-Side Rendering (SSR).
