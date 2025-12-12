# JoinGo AI Summary Server

Microservicio de IA para JoinGo que proporciona transcripción de voz en tiempo real, generación automática de resúmenes de reuniones y envío de reportes por email.

## 🚀 Características

- ✅ **Transcripción en tiempo real** usando OpenAI Whisper
- ✅ **Resúmenes inteligentes** generados con Claude AI (Anthropic)
- ✅ **Identificación de participantes** y sus contribuciones
- ✅ **Extracción automática de tareas** y compromisos
- ✅ **Envío de emails** con resumen profesional formateado
- ✅ **WebSocket** para comunicación en tiempo real
- ✅ **REST API** para consultas y estadísticas

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de OpenAI (para Whisper API)
- Cuenta de Anthropic (para Claude API)
- Cuenta de email (Gmail recomendado)

## 🛠️ Instalación
```bash
# Clonar el repositorio
git clone https://github.com/DVVID-G/ai-summary-server-joingo.git
cd ai-summary-server-joingo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

## ⚙️ Configuración

Crea un archivo `.env` con las siguientes variables:
```env
# Server
PORT=4000
NODE_ENV=development

# OpenAI (Whisper)
OPENAI_API_KEY=sk-proj-...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password

# CORS
FRONTEND_URL=http://localhost:5173
VOICE_SERVER_URL=http://localhost:3001
CHAT_SERVER_URL=http://localhost:3002
```

### 🔐 Obtener Credenciales

**OpenAI API Key:**
1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Copia y pega en `OPENAI_API_KEY`

**Anthropic API Key:**
1. Ve a https://console.anthropic.com/
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" y genera una nueva
4. Copia y pega en `ANTHROPIC_API_KEY`

**Gmail App Password:**
1. Habilita 2FA en tu cuenta de Gmail
2. Ve a https://myaccount.google.com/apppasswords
3. Genera una contraseña de aplicación
4. Usa esa contraseña en `EMAIL_PASSWORD`

## 🚀 Uso

### Desarrollo Local
```bash
# Modo desarrollo (con auto-reload)
npm run dev

# El servidor estará en http://localhost:4000
```

### Producción
```bash
# Compilar TypeScript
npm run build

# Iniciar servidor
npm start
```

## 📡 API Endpoints

### REST API
```bash
# Health check
GET /health

# Listar reuniones activas
GET /api/meetings

# Obtener datos de una reunión
GET /api/meetings/:meetingId

# Obtener estadísticas de reunión
GET /api/meetings/:meetingId/stats

# Verificar servicio de email
GET /api/email/verify
```

### WebSocket Events

**Cliente → Servidor:**
```typescript
// Unirse a reunión
socket.emit('join-meeting', {
  meetingId: string,
  userId: string,
  userName: string,
  userEmail: string
});

// Enviar audio
socket.emit('audio-chunk', {
  meetingId: string,
  userId: string,
  userName: string,
  audioData: ArrayBuffer,
  timestamp: string
});

// Enviar mensaje de chat
socket.emit('chat-message', {
  meetingId: string,
  userId: string,
  userName: string,
  message: string,
  timestamp: string
});

// Generar resumen
socket.emit('generate-summary', {
  meetingId: string,
  participants: Array<{
    id: string,
    name: string,
    email: string
  }>
});
```

**Servidor → Cliente:**
```typescript
// Transcripción en tiempo real
socket.on('live-transcription', (data) => {
  // { userId, userName, text, timestamp }
});

// Resumen listo
socket.on('summary-ready', (data) => {
  // { meetingId, summary, emailSent }
});

// Error en resumen
socket.on('summary-error', (data) => {
  // { meetingId, error }
});
```

## 📦 Estructura del Proyecto
```
ai-summary-server-joingo/
├── src/
│   ├── config/
│   │   └── index.ts              # Configuración centralizada
│   ├── services/
│   │   ├── storage.service.ts    # Almacenamiento en memoria
│   │   ├── transcription.service.ts  # Whisper API
│   │   ├── summarizer.service.ts # Claude API
│   │   └── email.service.ts      # Nodemailer
│   ├── types/
│   │   ├── meeting.types.ts      # Tipos de reuniones
│   │   └── socket.types.ts       # Tipos de Socket.IO
│   ├── utils/
│   │   ├── logger.ts             # Logger personalizado
│   │   └── prompt-templates.ts   # Prompts para Claude
│   └── server.ts                 # Servidor principal
├── .env                          # Variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🌐 Despliegue en Render

1. **Crear cuenta en Render**: https://render.com

2. **Crear nuevo Web Service**:
   - Conecta tu repositorio GitHub
   - Selecciona `ai-summary-server-joingo`

3. **Configuración**:
   - **Name**: `ai-summary-server-joingo`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Variables de Entorno** (agregar en Render):
```
   NODE_ENV=production
   PORT=4000
   OPENAI_API_KEY=sk-proj-...
   ANTHROPIC_API_KEY=sk-ant-...
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASSWORD=tu-app-password
   FRONTEND_URL=https://join-go-new-front.vercel.app
```

5. **Deploy**: Click en "Create Web Service"

La URL será: `https://ai-summary-server-joingo.onrender.com`

## 🔗 Integración con Frontend

En tu frontend (JoinGo), conecta así:
```typescript
import { io } from 'socket.io-client';

const aiSocket = io('https://ai-summary-server-joingo.onrender.com');

// Unirse a reunión
aiSocket.emit('join-meeting', {
  meetingId: 'meeting-123',
  userId: user.uid,
  userName: user.displayName,
  userEmail: user.email
});

// Escuchar transcripciones
aiSocket.on('live-transcription', (data) => {
  console.log(`${data.userName}: ${data.text}`);
});
```

## 🧪 Testing
```bash
# Probar health endpoint
curl http://localhost:4000/health

# Probar email service
curl http://localhost:4000/api/email/verify
```

## 📝 Notas Importantes

- Los datos de reuniones se almacenan **en memoria** (se limpian al reiniciar)
- Los archivos de audio temporales se eliminan automáticamente
- El resumen se genera al finalizar la reunión
- Los emails se envían automáticamente a todos los participantes

## 🤝 Equipo

- DVVID-G
- Universidad del Valle
- Proyecto Integrador I

## 📄 Licencia

MIT

## 🐛 Problemas Comunes

**Error: "OPENAI_API_KEY is required"**
- Asegúrate de tener el archivo `.env` configurado

**Error al enviar emails:**
- Verifica que hayas habilitado "Acceso de aplicaciones menos seguras" o uses App Password

**Audio no se transcribe:**
- Revisa que el formato de audio sea compatible (webm, mp3, wav)
- Verifica tu cuota de OpenAI API

## 📞 Soporte

Para problemas o preguntas, abre un issue en GitHub.