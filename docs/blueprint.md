# Blueprint: Integración de Tasa de Riesgo en Finanzas Personales

Este documento organiza las ideas para la funcionalidad de "Tasa de Riesgo" en un plan de desarrollo estructurado.

## Fase 1: Perfil de Riesgo y Fondo de Emergencia

El objetivo de esta fase es crear la base sobre la cual se construirán las demás funcionalidades.

### 1. Perfil de Riesgo del Usuario

-   **Funcionalidad:** Crear un cuestionario para determinar el perfil de riesgo del usuario.
-   **Implementación Técnica:**
    -   **Nueva Página:** Crear una nueva ruta y página en `src/app/risk-profile/page.tsx`.
    -   **Componente de Cuestionario:** Desarrollar un componente en `src/components/risk-questionnaire.tsx` con preguntas sobre:
        -   Estabilidad laboral (ej. tipo de contrato, industria).
        -   Salud (ej. tiene seguro, condiciones preexistentes).
        -   Dependientes económicos.
        -   Nivel de deudas actual.
    -   **Guardado de Perfil:** Por simplicidad inicial, el resultado del perfil (ej. "Conservador", "Moderado", "Agresivo") se guardará en el `localStorage` del navegador.
    -   **Acceso:** Añadir un enlace a esta nueva página en el menú de navegación (`src/components/main-nav.tsx`).

### 2. Cálculo del Fondo de Emergencia Dinámico

-   **Funcionalidad:** Calcular y mostrar el fondo de emergencia recomendado basado en el perfil de riesgo y los gastos mensuales promedio.
-   **Implementación Técnica:**
    -   **Lógica de Cálculo:** Crear una función en `src/lib/utils.ts` llamada `calculateDynamicEmergencyFund`.
        -   **Input:** Perfil de riesgo (string) y un array de transacciones de gastos.
        -   **Lógica:** Calculará el promedio de gastos mensuales de los últimos 3-6 meses. El multiplicador dependerá del perfil:
            -   Conservador: 6 meses de gastos.
            -   Moderado: 4 meses de gastos.
            -   Agresivo: 3 meses de gastos.
        -   **Output:** Monto total recomendado para el fondo de emergencia.
    -   **Visualización:** Modificar el `Dashboard` (`src/app/dashboard/page.tsx`) para mostrar una nueva tarjeta (`Card`) con el monto del fondo de emergencia recomendado y el progreso actual (basado en el balance de cuentas de ahorro).

## Fase 2: Proyecciones y Simulaciones

Con el perfil de riesgo definido, podemos empezar a crear herramientas predictivas.

### 3. Sistema de Proyecciones por Escenarios

-   **Funcionalidad:** Visualizar proyecciones del presupuesto del usuario bajo tres escenarios: optimista, realista y de crisis.
-   **Implementación Técnica:**
    -   **Flujo de IA (Genkit):** Crear un nuevo flujo en `src/ai/flows/scenario-projection-flow.ts`.
        -   **Input:** Perfil de riesgo, ingresos y gastos promedio, y opcionalmente, datos económicos externos.
        -   **Lógica:** El prompt de Genkit pedirá al modelo que genere una narrativa y cifras proyectadas para los próximos 3 meses en cada escenario.
            -   **Optimista:** Aumento de ingresos, reducción de gastos inesperados.
            -   **Realista:** Mantiene la tendencia actual.
            -   **Crisis:** Pérdida de empleo o gasto fuerte inesperado.
        -   **Output:** Un objeto JSON con las proyecciones para cada escenario.
    -   **Nueva Página:** Crear una ruta `src/app/projections/page.tsx`.
    -   **Componente de Visualización:** Desarrollar un componente en `src/components/scenario-projections.tsx` que llame al flujo de IA y muestre los resultados usando gráficos (ej. `recharts`) y texto descriptivo.

### 4. Conexión con APIs de Datos Económicos (Opcional, Avanzado)

-   **Funcionalidad:** Enriquecer las proyecciones con datos económicos reales.
-   **Implementación Técnica:**
    -   **Servicio de API:** Crear un servicio en `src/lib/economic-api.ts` para conectar con una API gratuita (ej. datos de desempleo o inflación de un banco central).
    -   **Integración con Genkit:** El flujo `scenario-projection-flow.ts` importará y usará este servicio para obtener datos y pasarlos al prompt de IA, haciéndolo más preciso.

## Fase 3: Interacción y Educación

Esta fase se centra en hacer la información accionable y comprensible para el usuario.

### 5. Alertas Preventivas

-   **Funcionalidad:** Notificar al usuario cuando sus finanzas se desvíen negativamente de lo recomendado por su perfil.
-   **Implementación Técnica:**
    -   **Lógica de Umbrales:** En el `Dashboard`, comparar el fondo de emergencia actual con el recomendado.
    -   **Componente de Alerta:** Si el fondo actual está por debajo del umbral (ej. 80% del recomendado), mostrar un componente de alerta (`Alert` de ShadCN) con un mensaje claro.
    -   **Notificaciones (Futuro):** Se podría extender a notificaciones push o por email si se implementa un backend más completo.

### 6. Módulo Educativo

-   **Funcionalidad:** Proveer explicaciones claras y contextuales sobre los conceptos de riesgo.
-   **Implementación Técnica:**
    -   **Componentes de Información:** Dentro de cada nueva funcionalidad (perfil de riesgo, proyecciones), añadir pequeños íconos de "información" (`Tooltip` o `Popover` de ShadCN).
    -   **Contenido:** Al pasar el cursor o hacer clic, mostrarán explicaciones sencillas. Por ejemplo, en el cuestionario: "Tu estabilidad laboral afecta cuánto deberías ahorrar para emergencias."

Con este plan, puedes abordar estas ideas complejas de forma incremental, construyendo una sobre otra. ¡Mucho éxito con la implementación!
