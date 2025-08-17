# ClashArenaGG - La Arena Definitiva

La plataforma definitiva para torneos de League of Legends con tracking automático de partidas y leaderboards en tiempo real.

## 🎯 Características del MVP

- ✅ **Autenticación** con Supabase
- ✅ **Vinculación de cuentas LoL** via RSO OAuth
- ✅ **Torneos por ventana de tiempo** (horas/días)
- ✅ **Tracking automático** de partidas
- ✅ **Sistema de puntuación** configurable
- ✅ **Leaderboards en tiempo real**
- ✅ **Anti-abuso** básico

## 🚀 Instalación

### 1. Clonar y instalar dependencias

```bash
cd project
npm install
```

### 2. Configurar variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/tournament_db"

# Riot Games API
RIOT_API_KEY=your_riot_api_key
NEXT_PUBLIC_RIOT_CLIENT_ID=your_riot_client_id
RIOT_CLIENT_SECRET=your_riot_client_secret

# Redis Configuration (opcional, para rate limiting)
UPSTASH_REDIS_REST_URL=redis://localhost:6379
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Admin Configuration
ADMIN_EMAIL=admin@example.com
```

### 3. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Obtener las credenciales de la API
3. Configurar autenticación con email/password

### 4. Configurar Riot Games API

1. Crear una aplicación en el [Riot Developer Portal](https://developer.riotgames.com/)
2. Solicitar acceso a producción para RSO OAuth
3. Configurar las URLs de redirección:
   - `http://localhost:3000/api/auth/riot/callback` (desarrollo)
   - `https://yourdomain.com/api/auth/riot/callback` (producción)

### 5. Configurar la base de datos

```bash
# Generar el cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# (Opcional) Ejecutar seed con datos de ejemplo
npm run db:seed
```

### 6. Ejecutar el proyecto

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 🔧 Configuración del Cron Job

Para el tracking automático de partidas, necesitas configurar un cron job:

### Opción 1: Usando el script local

```bash
# Ejecutar manualmente
npm run cron:scan

# O con node directamente
node scripts/cron.js
```

### Opción 2: Usando un servicio de cron

Configurar un cron job que ejecute cada 2-3 minutos:

```bash
# Ejemplo con crontab
*/3 * * * * cd /path/to/project && npm run cron:scan
```

### Opción 3: Usando Supabase Edge Functions

Crear una Edge Function en Supabase que se ejecute automáticamente.

## 📊 Flujo de Usuario

### 1. Registro e Inscripción
1. Usuario crea cuenta en la web
2. Vincula su cuenta de LoL via RSO OAuth
3. Se inscribe a un torneo activo

### 2. Tracking Automático
1. El cron job escanea partidas cada 2-3 minutos
2. Filtra partidas por:
   - Ventana de tiempo del torneo
   - Colas válidas
   - Usuario inscrito
3. Calcula puntos según la configuración
4. Actualiza el leaderboard en tiempo real

### 3. Sistema de Puntuación

```json
{
  "winPoints": 3,
  "lossPoints": 0,
  "kdaBonus": {
    "threshold": 3.0,
    "points": 1
  },
  "minDurationSec": 1200,
  "minDurationBonusPoints": 1,
  "maxCountedMatches": 10
}
```

## 🛡️ Anti-Abuso

- **Ventana por inscripción**: Solo cuenta partidas después del registro
- **Colas válidas**: Solo partidas en colas permitidas
- **Rate limiting**: Respeto a los límites de la API de Riot
- **Idempotencia**: No cuenta la misma partida dos veces
- **Validación de duración**: Evita partidas muy cortas

## 📈 Próximos Pasos

### Hito 2 - Calidad de Vida
- [ ] Filtros por región/cola
- [ ] Caps diarios
- [ ] Badges y logros
- [ ] Webhooks internos

### Hito 3 - Torneos con Salas
- [ ] Tournament-V5 API
- [ ] Códigos de torneo
- [ ] Callbacks automáticos

### Hito 4 - Multi-Juego
- [ ] TFT
- [ ] LoR
- [ ] VALORANT

## 🔍 Troubleshooting

### Error: "supabaseUrl is required"
- Verificar que las variables de entorno de Supabase estén configuradas

### Error: "Riot API rate limited"
- El sistema respeta automáticamente los rate limits
- Considerar aumentar el intervalo del cron job

### Error: "No matches found"
- Verificar que el usuario tenga partidas en las colas válidas
- Verificar que las partidas estén dentro de la ventana del torneo

## 📝 Licencia

MIT License - ver LICENSE para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request












