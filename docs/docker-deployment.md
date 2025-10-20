# Despliegue con Docker - Finance Tracker

Esta guía te ayudará a desplegar la aplicación Finance Tracker usando Docker en un entorno de producción.

## 📋 Prerrequisitos

- Docker Engine 20.10+ instalado
- Docker Compose 2.0+ instalado
- Acceso a las bases de datos de Notion configuradas
- Variables de entorno configuradas

## 🚀 Despliegue Rápido

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd finance-tracker
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración de Notion
NOTION_TOKEN=tu_token_de_notion
NOTION_AUTH_DB=id_de_base_de_datos_auth
NOTION_TRANSACTIONS_DB=id_de_base_de_datos_transacciones
NOTION_INCOME_DB=id_de_base_de_datos_ingresos
NOTION_TOTAL_SAVINGS_DB=id_de_base_de_datos_ahorros
NOTION_ACCOUNTS_DB=id_de_base_de_datos_cuentas
NOTION_DEBTS_DB=id_de_base_de_datos_deudas
NOTION_BUDGET_DB=id_de_base_de_datos_presupuesto

# Configuración de la aplicación
NODE_ENV=production
PORT=3000
```

### 3. Construir y ejecutar con Docker Compose
```bash
# Construir la imagen
docker-compose build

# Ejecutar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 4. Verificar el despliegue
La aplicación estará disponible en: `http://localhost:3000`

## 🐳 Despliegue Manual con Docker

### Construir la imagen
```bash
docker build -t finance-tracker:latest .
```

### Ejecutar el contenedor
```bash
docker run -d \
  --name finance-tracker-app \
  -p 3000:3000 \
  --env-file .env \
  finance-tracker:latest
```

## 🔧 Configuración Avanzada

### Variables de Entorno Detalladas

#### Notion API
- `NOTION_TOKEN`: Token de integración de Notion (requerido)
- `NOTION_AUTH_DB`: ID de la base de datos de autenticación
- `NOTION_TRANSACTIONS_DB`: ID de la base de datos de transacciones
- `NOTION_INCOME_DB`: ID de la base de datos de ingresos
- `NOTION_TOTAL_SAVINGS_DB`: ID de la base de datos de ahorros totales
- `NOTION_ACCOUNTS_DB`: ID de la base de datos de cuentas
- `NOTION_DEBTS_DB`: ID de la base de datos de deudas
- `NOTION_BUDGET_DB`: ID de la base de datos de presupuesto

#### Configuración de la Aplicación
- `NODE_ENV`: Entorno de ejecución (production/development)
- `PORT`: Puerto donde se ejecutará la aplicación (por defecto: 3000)

### Personalizar el Puerto
Para cambiar el puerto de la aplicación, modifica el archivo `docker-compose.yml`:

```yaml
services:
  next-app:
    ports:
      - "8080:3000"  # Puerto externo:puerto interno
```

## 📊 Monitoreo y Logs

### Ver logs en tiempo real
```bash
docker-compose logs -f next-app
```

### Ver logs específicos
```bash
docker logs finance-tracker-app
```

### Estadísticas del contenedor
```bash
docker stats finance-tracker-app
```

## 🔄 Actualización de la Aplicación

### Con Docker Compose
```bash
# Detener la aplicación
docker-compose down

# Actualizar código
git pull

# Reconstruir y ejecutar
docker-compose up -d --build
```

### Con Docker manual
```bash
# Detener contenedor
docker stop finance-tracker-app
docker rm finance-tracker-app

# Reconstruir imagen
docker build -t finance-tracker:latest .

# Ejecutar nuevo contenedor
docker run -d \
  --name finance-tracker-app \
  -p 3000:3000 \
  --env-file .env \
  finance-tracker:latest
```

## 🛠️ Comandos Útiles

### Gestión de contenedores
```bash
# Listar contenedores en ejecución
docker ps

# Listar todas las imágenes
docker images

# Eliminar imagen
docker rmi finance-tracker:latest

# Limpiar recursos no utilizados
docker system prune -a
```

### Debugging
```bash
# Acceder al contenedor
docker exec -it finance-tracker-app sh

# Ver variables de entorno
docker exec finance-tracker-app env
```

## 🚨 Solución de Problemas

### Error: Puerto ya en uso
```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Detener proceso o cambiar puerto en docker-compose.yml
```

### Error: Variables de entorno faltantes
- Verifica que el archivo `.env` existe y contiene todas las variables necesarias
- Asegúrate de que las variables están correctamente configuradas en Notion

### Error: Build fallido
```bash
# Limpiar caché de Docker
docker builder prune

# Reconstruir sin caché
docker-compose build --no-cache
```

### Error: Permisos de archivos
```bash
# Verificar permisos del directorio
ls -la

# Corregir permisos si es necesario
chmod 755 .
```

## 📈 Optimizaciones de Producción

### Configuración de recursos
Para limitar recursos del contenedor, modifica `docker-compose.yml`:

```yaml
services:
  next-app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Configuración de red
Para usar una red personalizada:

```yaml
services:
  next-app:
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## 🔒 Consideraciones de Seguridad

1. **Nunca commits el archivo `.env`** al repositorio
2. **Usa usuarios no-root** en el contenedor (ya configurado)
3. **Configura límites de recursos** para evitar ataques DoS
4. **Usa HTTPS en producción** con un proxy reverso como Nginx
5. **Mantén las imágenes actualizadas** regularmente

## 📝 Notas Adicionales

- La aplicación usa Next.js 15.3.3 con modo standalone para optimización
- El Dockerfile está optimizado para producción con multi-stage build
- Se usa pnpm como gestor de paquetes para mejor rendimiento
- La aplicación está configurada para ejecutarse en el puerto 3000 por defecto

## 🆘 Soporte

Si encuentras problemas durante el despliegue:

1. Revisa los logs del contenedor
2. Verifica la configuración de variables de entorno
3. Asegúrate de que todas las dependencias están instaladas
4. Consulta la documentación de Docker y Next.js

Para más ayuda, consulta los issues del repositorio o contacta al equipo de desarrollo.
