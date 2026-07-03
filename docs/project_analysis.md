# Finance Tracker - Análisis Completo del Proyecto

## 1. Contexto del Proyecto

**Finance Tracker** es una aplicación web moderna diseñada para la gestión integral de finanzas personales. Su objetivo principal es ofrecer al usuario una plataforma centralizada y visualmente atractiva para monitorizar sus ingresos, gastos, deudas, presupuestos y balances de cuentas de forma interactiva y dinámica.

La aplicación está construida utilizando las últimas tecnologías del ecosistema frontend y apoyada en servicios externos potentes para el almacenamiento de datos y capacidades de Inteligencia Artificial.

### Tecnologías Clave (Tech Stack)

- **Core:** Next.js 15 (App Router), React 18, TypeScript.
- **Gestión de Paquetes:** pnpm.
- **Estilos y UI:** Tailwind CSS, Shadcn UI (Radix Primitives), Lucide React.
- **Formularios:** React Hook Form, Zod.
- **Fechas:** date-fns, react-day-picker (v8).
- **Gráficos:** Recharts.
- **Fuentes de Datos:** Notion API (Base de datos principal), Binance API, DolarAPI (tasas oficiales y paralelas), Airtable.
- **Inteligencia Artificial:** Firebase Genkit (@genkit-ai/googleai) - Gemini API.

### Arquitectura y Patrones

- Uso intensivo de **React Server Components (RSC)** en el App Router de Next.js (`src/app`), limitando `"use client"` a componentes estrictamente interactivos (ej. formularios de adición y modales).
- Tipado estricto con **TypeScript** apoyado por esquemas de **Zod** (`z.infer`) para validaciones robustas y de alto rendimiento.
- **Patrón de UI:** Tablas de solo lectura para listar datos y Modales/Sheets (ej. `Dialog` de Radix/Shadcn) para edición y creación directa.
- **Manejo Defensivo:** Compatibilidad estricta con SSR (Server-Side Rendering) evitando accesos directos al `localStorage` o `window` fuera de `useEffect` o hooks seguros.
- **Acciones de Servidor Seguras:** Implementación de Rate Limiting y validación de schemas en `actions.ts` para mitigar ataques y abusos.

---

## 2. Estructura del Proyecto

El proyecto sigue una estructura limpia orientada a funcionalidades, agrupada principalmente dentro del directorio `src`.

```text
finance-tracker/
├── docs/                        # Documentación técnica, blueprints y notas de despliegue.
├── src/
├── src/ai/                      # Configuración de Firebase Genkit y prompts/flujos de IA.
├── src/app/                     # Rutas de Next.js App Router (Páginas y Server Actions).
│   ├── accounts/            # Gestión de cuentas bancarias/billeteras.
│   ├── binance/             # Integración y balances de Binance.
│   ├── budget/              # Visualización de presupuestos y pagos programados.
│   ├── calculator/          # Calculadora de divisas en tiempo real.
│   ├── chat/                # Chatbot de IA para asesoramiento financiero.
│   ├── dashboard/           # Panel principal con resúmenes y gráficos.
│   ├── debts/               # Seguimiento de deudas y préstamos.
│   ├── login/ & register/   # Flujos de autenticación de usuario.
│   ├── risk-analysis/       # Análisis de perfil de riesgo y fondo de emergencia.
│   ├── transactions/        # Historial de transacciones financieras.
│   ├── actions.ts           # Server Actions principales (Notion, transacciones, deudas, etc.).
│   └── binance-actions.ts   # Server Actions específicas para Binance.
├── src/components/              # Componentes de UI reutilizables.
│   ├── ui/                  # Componentes base de Shadcn UI (botones, inputs, dialogs, tooltips).
│   └── ...                  # Formularios específicos (ej. AddTransferForm, AddTransactionForm).
├── src/hooks/                   # Custom Hooks (ej. useExchangeRates, useLocalStorage).
└── src/lib/                     # Lógica de negocio y clientes API (Notion, utils, rate-limit).
```

---

## 3. Funcionalidades Principales y Lógica de Negocio

La aplicación cuenta con una lógica financiera enriquecida distribuida en varios módulos avanzados:

### A. Gestión de Transacciones e Ingresos
- Creación y edición interactiva de ingresos/gastos.
- Soporte para cobro de **Comisión Bancaria (0.3%)** en transacciones tipo *gasto* en bolívares (VES) originadas de bancos que apliquen comisiones (ej. Banco de Venezuela y Provincial) cuando se selecciona el método de pago **Pago Móvil**.

### B. Módulo de Transferencias e Intercambios (FX)
- **Flujo en 6 pasos estructurado:**
  1. Moneda Origen.
  2. Cuenta Origen (filtrada por la moneda seleccionada).
  3. Monto Enviado.
  4. Moneda Destino.
  5. Cuenta Destino (filtrada por la moneda destino).
  6. Monto Recibido.
- **Transferencias Internas (Misma Moneda):**
  - La moneda destino se bloquea de forma idéntica a la de origen.
  - La cuenta de origen seleccionada es automáticamente excluida de las opciones de destino para evitar transferencias inválidas a la misma cuenta.
  - Cálculo automático de **Comisión Interbancaria (0.3%)** cuando la transferencia ocurre entre diferentes entidades de cobro (ej. de Banesco/Venezuela a Provincial).
- **Cambio de Divisa (Diferente Moneda):**
  - La moneda de destino no puede ser idéntica a la moneda de origen.
  - Registro opcional de tasas (Rate Source, Reference Rate y Base Rate) para auditar la compra/venta de divisas.
  - Estimación y registro automático de **Pérdida Cambiaria** como un gasto en Notion cuando el valor recibido es menor que el valor original estimado de los fondos (comparando Base Rate vs Reference Rate).

### C. Análisis de Riesgo y Fondos de Emergencia
- Módulo para calificar el perfil de riesgo del usuario (Estabilidad laboral, salud, deudas, dependientes) y determinar su tolerancia al riesgo.
- Recomendación de tamaño para el fondo de emergencia según el perfil arrojado.

### D. Asistente Conversacional y Escaneo IA
- Integración de **Firebase Genkit** con Gemini para chat sobre finanzas.
- **Lector de Facturas/Recibos:** Carga de imágenes que extrae automáticamente la fecha, monto y concepto del gasto para poblar el formulario al instante, agilizando el registro manual.
