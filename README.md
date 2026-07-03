# Finance Tracker (Firebase Studio Edition)

## Descripción del Proyecto

Este proyecto es una aplicación web moderna construida con **Next.js 15 (App Router)**, **React 18** y **TypeScript**. Está diseñada para la gestión integral de finanzas personales, permitiendo a los usuarios centralizar el seguimiento de transacciones, deudas, balances de cuentas y presupuestos con una experiencia de usuario fluida y visualmente atractiva.

La aplicación utiliza la **Notion API** como base de datos principal, lo que permite al usuario mantener el control y propiedad total de sus datos directamente en su workspace de Notion. Adicionalmente, cuenta con integraciones de IA avanzada para facilitar la automatización del registro diario.

---

## Características Principales

*   **Gestión de Transacciones:** Registro interactivo de ingresos y gastos con categorización automática.
*   **Transferencias y Cambio de Divisas (FX):**
    *   Flujo paso a paso optimizado (Moneda origen → Cuenta origen → Monto enviado | Moneda destino → Cuenta destino → Monto recibido).
    *   Exclusión mutua de monedas en modo Cambio de Divisa (FX).
    *   Bloqueo y sincronización automática de monedas en modo Transferencia Interna.
    *   Cálculo automático de **Pérdidas Cambiarias** proyectadas con registro automático en Notion.
    *   Cálculo y previsualización en tiempo real de **Comisión Bancaria Interbancaria (0.3%)** para transferencias en VES entre diferentes bancos nacionales (ej. de Banco de Venezuela a Provincial).
*   **Seguimiento de Deudas:** Registro y amortización de deudas pendientes asociadas directamente a transacciones de pago.
*   **Balances de Cuentas:** Visualización en tiempo real del saldo disponible y últimas actividades, agrupadas por moneda (VES, USD, USDT).
*   **Visualizaciones Analíticas:** Gráficos e indicadores interactivos (vía Recharts) para comprender patrones de gasto mensual y anual.
*   **Calculadora Integrada:** Conversión en tiempo real de divisas utilizando datos oficiales de **DolarAPI**.
*   **Inteligencia Artificial (Firebase Genkit):**
    *   **Escaneo de Recibos:** Carga o captura imágenes de recibos y facturas para extraer automáticamente la descripción, monto y tipo de transacción.
    *   **Sugerencia de Categoría:** Clasificación automática de gastos basada en el modelo Gemini de Google.
    *   **Asistente Financiero IA:** Chatbot integrado para análisis financiero personalizado a través de lenguaje natural.

---

## Tecnologías Utilizadas (Tech Stack)

*   **Core:** Next.js 15, React 18, TypeScript, pnpm (Gestor de paquetes).
*   **Diseño y UI:** Tailwind CSS, Shadcn UI (Radix Primitives), Lucide React.
*   **Formularios y Validación:** React Hook Form, Zod.
*   **Fechas:** date-fns, react-day-picker (v8).
*   **Integraciones / APIs:**
    *   Notion API (Base de datos principal)
    *   Binance API (Balances crypto)
    *   DolarAPI (Tasas oficiales y paralelas de Venezuela)
    *   Firebase Genkit & Gemini API (Extracción e IA de chat)

---

## Instalación y Configuración

Sigue estos pasos para ejecutar la aplicación de forma local:

1.  Clona el repositorio.
2.  Instala las dependencias usando `pnpm`:
    ```bash
    pnpm install
    ```
3.  Configura las variables de entorno creando un archivo `.env.local` en la raíz con las claves requeridas para Notion, Binance, DolarAPI y Firebase/Genkit:
    ```env
    NOTION_TOKEN=your_notion_integration_token
    NOTION_ACCOUNTS_DB=your_db_id
    NOTION_TRANSACTIONS_DB=your_db_id
    NOTION_INCOME_DB=your_db_id
    NOTION_TRANSFER_DB=your_db_id
    NOTION_DEBTS_DB=your_db_id
    NOTION_BUDGET_DB=your_db_id
    NOTION_TOTAL_SAVINGS_DB=your_db_id
    GEMINI_API_KEY=your_gemini_api_key
    # ... otras configuraciones de Firebase y Binance
    ```
4.  Ejecuta la aplicación en modo desarrollo:
    ```bash
    pnpm dev
    ```
5.  Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Estructura del Proyecto

*   `src/app`: Rutas del App Router, páginas y Server Actions (`actions.ts`).
*   `src/components`: Componentes del frontend (formularios, layouts, visualizaciones, etc.).
*   `src/lib`: Lógica de comunicación con las APIs (Notion, Binance, DolarAPI) y utilidades comunes.
*   `src/ai`: Lógica y flujos conversacionales de Genkit.
*   `src/hooks`: Hooks personalizados (ej. `useExchangeRates`).
*   `docs`: Documentación técnica y blueprints.