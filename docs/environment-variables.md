# Variables de Entorno - Finance Tracker

Este archivo contiene todas las variables de entorno necesarias para ejecutar la aplicación Finance Tracker.

## 📋 Variables Requeridas

### Notion API Configuration
```env
# Token de integración de Notion (REQUERIDO)
# Obtén este token desde: https://www.notion.so/my-integrations
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# IDs de las bases de datos de Notion (REQUERIDOS)
# Estos IDs se encuentran en la URL de cada base de datos de Notion
NOTION_AUTH_DB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_TRANSACTIONS_DB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_INCOME_DB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_TOTAL_SAVINGS_DB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_ACCOUNTS_DB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DEBTS_DB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_BUDGET_DB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Configuración de la Aplicación
```env
# Entorno de ejecución
NODE_ENV=production

# Puerto de la aplicación (opcional, por defecto 3000)
PORT=3000

# Hostname para el servidor (opcional, por defecto 0.0.0.0)
HOSTNAME=0.0.0.0
```

## 🔧 Cómo Obtener los Valores

### 1. Token de Notion
1. Ve a [Notion Integrations](https://www.notion.so/my-integrations)
2. Crea una nueva integración
3. Copia el "Internal Integration Token"
4. Pégalo como valor de `NOTION_TOKEN`

### 2. IDs de Bases de Datos
1. Abre cada base de datos en Notion
2. Copia la URL de la base de datos
3. El ID es la parte después de `/` y antes de `?` en la URL
4. Ejemplo: `https://notion.so/workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`
5. El ID sería: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 📝 Ejemplo de Archivo .env Completo

```env
# === NOTION CONFIGURATION ===
NOTION_TOKEN=secret_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
NOTION_AUTH_DB=12345678-1234-1234-1234-123456789abc
NOTION_TRANSACTIONS_DB=87654321-4321-4321-4321-cba987654321
NOTION_INCOME_DB=11111111-2222-3333-4444-555555555555
NOTION_TOTAL_SAVINGS_DB=22222222-3333-4444-5555-666666666666
NOTION_ACCOUNTS_DB=33333333-4444-5555-6666-777777777777
NOTION_DEBTS_DB=44444444-5555-6666-7777-888888888888
NOTION_BUDGET_DB=55555555-6666-7777-8888-999999999999

# === APPLICATION CONFIGURATION ===
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

## ⚠️ Importante

1. **NUNCA commits este archivo** al repositorio Git
2. **Mantén estos valores seguros** y no los compartas públicamente
3. **Usa diferentes tokens** para desarrollo y producción
4. **Verifica los permisos** de la integración de Notion en cada base de datos

## 🔒 Configuración de Permisos en Notion

Para cada base de datos, asegúrate de:

1. Ir a la configuración de la base de datos
2. Buscar "Connections" o "Conexiones"
3. Invitar a tu integración
4. Dar permisos de lectura y escritura según sea necesario

## 🚨 Solución de Problemas

### Error: "Invalid token"
- Verifica que el token de Notion sea correcto
- Asegúrate de que la integración esté activa

### Error: "Database not found"
- Verifica que los IDs de las bases de datos sean correctos
- Confirma que la integración tenga acceso a cada base de datos

### Error: "Permission denied"
- Revisa los permisos de la integración en cada base de datos
- Asegúrate de que la integración tenga los permisos necesarios
