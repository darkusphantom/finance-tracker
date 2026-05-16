---
trigger: always_on
---

<cursor-agent-rules>
  <role-and-context>
    Eres un asistente experto en desarrollo de software manteniendo la aplicación "Finance Tracker".
    Tu objetivo es escribir código limpio, eficiente y alineado con la arquitectura existente, respetando estrictamente las decisiones técnicas y los patrones de diseño del proyecto.
  </role-and-context>

  <tech-stack>
    <core>Next.js 15 (App Router), React 18, TypeScript</core>
    <package-manager>pnpm</package-manager>
    <styling>Tailwind CSS, Shadcn UI (Radix Primitives), Lucide React</styling>
    <forms>React Hook Form, Zod, @hookform/resolvers</forms>
    <date-management>date-fns, react-day-picker (v8)</date-management>
    <data-sources>Notion API (Base de datos principal), Binance API, Airtable, DolarAPI</data-sources>
    <ai-integration>Firebase Genkit (@genkit-ai/googleai)</ai-integration>
    <charts>Recharts</charts>
  </tech-stack>

  <architecture-and-standards>
    <rule>
      <strong>Next.js App Router y RSC:</strong> Utiliza convenciones del App Router (`src/app`). Prioriza siempre los Server Components (React Server Components). Usa la directiva `"use client"` de forma muy aislada y únicamente cuando sea estrictamente necesario para interactividad, hooks de React, o uso de APIs del navegador.
    </rule>
    <rule>
      <strong>TypeScript Estricto:</strong> Mantén tipado estricto en todo momento. Queda absolutamente prohibido el uso de `any`. Utiliza `zod` para validación de esquemas de datos y deduce los tipos de TypeScript a partir de ellos (`z.infer`).
    </rule>
    <rule>
      <strong>Alias de Rutas:</strong> Utiliza siempre los alias configurados en lugar de rutas relativas largas:
      - `@/components` para componentes generales.
      - `@/components/ui` para componentes de Shadcn.
      - `@/lib` para utilidades y lógica de negocio (Notion, integraciones).
      - `@/hooks` para hooks personalizados.
    </rule>
    <rule>
      <strong>Centralización de APIs:</strong> Las llamadas a APIs externas (Notion, DolarAPI, Binance) deben mantenerse centralizadas en `src/lib/` o consumirse a través de custom hooks (`src/hooks/`) para evitar código redundante.
    </rule>
  </architecture-and-standards>

  <ui-ux-patterns>
    <rule>
      <strong>Patrón de Visualización y Edición:</strong> Sigue el patrón establecido de UI/UX: Utiliza tablas de solo lectura para la visualización de datos (ej. presupuestos, transacciones) y utiliza Modales (`Dialog`) o `Sheet` (especialmente en móviles) para la mutación/edición de datos, evitando tener que crear un ítem antes de editar sus detalles.
    </rule>
    <rule>
      <strong>Componentes UI:</strong> Construye sobre la base de Shadcn UI y Radix. Para extender estilos, utiliza siempre clases utilitarias de Tailwind CSS y la función `cn()` definida en `@/lib/utils` para combinar clases condicionales usando `clsx` y `tailwind-merge`.
    </rule>
    <rule>
      <strong>Diseño Responsivo:</strong> Asegura que todas las interfaces sean responsivas. Presta especial atención al renderizado condicional en móviles (ej. visibilidad correcta del componente `Sheet` en el Sidebar).
    </rule>
  </ui-ux-patterns>

  <state-and-data-management>
    <rule>
      <strong>Seguridad SSR y LocalStorage:</strong> El proyecto corre en Next.js 15, lo que hace crítica la compatibilidad SSR (Server-Side Rendering). NUNCA accedas a `localStorage`, `window`, o `document` directamente en el cuerpo del componente o en contextos de servidor. Usa siempre hooks seguros para el cliente (ej. un hook custom que verifique si está montado) o dentro de `useEffect`.
    </rule>
    <rule>
      <strong>Reactividad en Formularios:</strong> Para componentes como `AddTransactionForm`, asegura que la actualización del estado local o global (ej. balances de cuentas o deudas restantes) ocurra de forma dinámica tras una inserción exitosa, sin requerir la recarga del componente o de la página.
    </rule>
    <rule>
      <strong>Manejo Defensivo de Datos:</strong> Valida siempre los datos antes de formatearlos para evitar crashes de la aplicación. Por ejemplo, verifica que los códigos de moneda sean válidos en formato ISO 4217 antes de pasarlos a `Intl.NumberFormat` (ej. maneja excepciones para códigos como "USDT").
    </rule>
    <rule>
      <strong>Compatibilidad de Librerías:</strong> Al trabajar con `react-day-picker` (versión 8), asegúrate de que cualquier componente personalizado para los días (ej. `DayWithIndicator`) cumpla estrictamente con la interfaz `DayProps` esperada para evitar errores de tipado en TypeScript.
    </rule>
  </state-and-data-management>
</cursor-agent-rules>
