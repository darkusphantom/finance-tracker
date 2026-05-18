# Documentación de Arquitectura: Flujo de Transacciones y FX

Este documento detalla la arquitectura técnica y el modelo de negocio detrás del sistema de transacciones en la aplicación "Finance Tracker". El sistema está diseñado para soportar contabilidad de partida doble parcial, previniendo la fuga silenciosa de capital y manteniendo el rendimiento del cliente.

## 1. Visión General del Ecosistema

El sistema abandona el uso de Rollups y Fórmulas lentas en Notion para el cálculo de balances. En su lugar, el backend de Next.js (`actions.ts`) actúa como la fuente de la verdad, calculando y actualizando estáticamente la propiedad `Balance Amount` de cada cuenta. 

El ecosistema se divide en 4 bases de datos principales de Notion:
1. **Accounts DB:** Almacena el saldo actual estático (`Balance Amount`) y la divisa base de cada cuenta (VES, USD, USDT, etc.).
2. **Income DB:** Registra dinero "nuevo" que entra al ecosistema (Salarios, Bonos).
3. **Transactions DB (Expenses):** Registra dinero que sale del ecosistema (Gastos regulares, deudas, pérdida cambiaria).
4. **Transfer & FX DB:** Un libro mayor (Ledger) exclusivo para el movimiento de dinero interno entre tus propias cuentas.

---

## 2. Flujo 1: Ingresos y Gastos (Partida Simple)
Implementado en: `AddTransactionForm`

Cuando el dinero se origina externamente o se destruye (gasto):
* **UI:** El usuario selecciona "Income" o "Expense". Provee una sola cuenta (`accountId`) y un solo monto (`amount`).
* **Server Action (`addTransactionAction`):**
  1. Identifica la base de datos destino (`Income DB` o `Transactions DB`).
  2. Inyecta el registro con la categoría correspondiente.
  3. Modifica matemáticamente el `Balance Amount` de la cuenta seleccionada (suma si es ingreso, resta si es gasto).

---

## 3. Flujo 2: Transferencias y Cambios de Divisa (Partida Doble)
Implementado en: `AddTransferForm`

Cuando el dinero fluye internamente (ej. Banesco a Binance):
* **UI:** El usuario selecciona "Transferencia" o "Cambio Divisa". Se exigen dos cuentas (`From` y `To`) y dos montos (`Sent Amount` y `Received Amount`).
* **Server Action (`addTransferAction`):**
  1. Escribe el registro en la `Transfer & FX DB` vinculando ambas cuentas.
  2. Resta el `Sent Amount` de la cuenta Origen.
  3. Suma el `Received Amount` a la cuenta Destino.

### 3.1. Mitigación y Materialización de Pérdida Cambiaria (FX Loss)
Dado que los ingresos se perciben a una tasa histórica (ej. 515) y se cambian a una tasa futura (ej. 730), el dinero sufre depreciación de poder adquisitivo. 

Para evitar que el usuario asuma que tiene el mismo dinero original, se implementó la siguiente arquitectura:

1. **Proyección en el Cliente (Reactividad):**
   - Si el tipo es "Cambio Divisa", se habilita el campo `Base Rate` (Tasa de Adquisición).
   - El componente React (`add-transfer-form.tsx`) hace el cálculo en memoria RAM:
     `FX Loss = (Sent Amount / Base Rate) - Received Amount`
   - Si el valor es mayor a 0, se despliega una alerta roja advirtiendo al usuario de la pérdida neta proyectada.

2. **Materialización Automática del Gasto (Server-Side):**
   - Si el usuario confirma la transacción y existe una pérdida (`fxLoss > 0`), el Server Action hace una inyección adicional.
   - Crea un registro fantasma en la **Transactions DB (Gastos)** etiquetado como `Deposit on Binance` con el título `Pérdida Cambiaria: [Descripción]`.
   - **Inyección Centralizada de DolarAPI:** El cliente intercepta la divisa destino (ej. `USDT`) y la tasa oficial actual leyendo el hook `useExchangeRates`, enviándolas al servidor para que el gasto quede auditado con su respectiva moneda y `Exchange Rate Used`.

### Beneficio Arquitectónico
Al materializar la pérdida como un gasto explícito, el reporte mensual del dashboard (Ingresos vs Gastos) cuadra a la perfección con la caída del Patrimonio Neto (Net Worth), haciendo que la inflación y la devaluación sean rastreables y cuantificables sin necesidad de sistemas de inventario FIFO.
