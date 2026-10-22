# 🏥 Programación Médica — Hospital II Pucallpa (EsSalud)

Sistema web en tiempo real para la gestión de turnos médicos, llamado de pacientes por voceo sintético (Speech Synthesis), triaje de emergencia, modo TV rotativo y trazabilidad con auditoría de atenciones.

---

## 🚀 Mejoras Implementadas en la Reconstrucción

### 1. 🛡️ Seguridad Reforzada
- **Reglas de Seguridad Firestore (`firestore.rules`)**: Creadas para validar permisos según el rol del usuario (`ADMIN`, `OPERADOR`, `ADMISION`, `MEDICO`) directamente en los servidores de Google Firebase, impidiendo accesos no autorizados a través de la consola del navegador.
- **Protección contra XSS en Reportes**: El exportador de auditoría a Excel ahora escapa caracteres maliciosos en nombres de pacientes o doctores (`<`, `>`, `"`, `'`, `&`).
- **Encabezados HTTP Seguros (`vercel.json`)**: Configuración estricta de `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` y compatibilidad con ventanas emergentes de Google Authentication.
- **Aislamiento de Secretos**: `.env*` asegurado en `.gitignore` y creación de `.env.example` para despliegues limpios.

### 2. ⚡ Alto Rendimiento y Optimización
- **División de Chunks (`vite.config.js`)**: El archivo JavaScript principal bajó de **1,060 kB** a **124 kB**, aislando `firebase`, `xlsx` y `lucide-react` en chunks independientes. El tiempo de compilación se redujo a tan solo **2 segundos**.
- **Reloj Aislado (`Reloj.jsx`)**: El cronómetro de la cabecera ya no fuerza el renderizado de toda la aplicación cada segundo.
- **Consultas Filtradas en Firestore**: `historial_llamados` y `lista_espera` ahora filtran por la fecha del día (`where("fechaFormateada", "==", hoy)`), ahorrando miles de lecturas innecesarias en bases de datos con meses de actividad.
- **Inserción por Lotes Segura**: Las cargas masivas desde Excel ahora procesan en bloques de 490 registros, respetando el límite de 500 operaciones por lote de Firestore.

### 3. 🧩 Arquitectura Limpia y Modular
El archivo monolítico original de **3,035 líneas (`App.jsx`)** fue descompuesto en módulos claros y desacoplados:

```
src/
├── components/
│   ├── Header.jsx              # Cabecera, navegación y selector de roles
│   ├── ProgramacionMedica.jsx  # Grilla de turnos y tarjetas médicas
│   ├── GestionUsuarios.jsx     # Panel de administración de usuarios y roles
│   ├── Modales.jsx             # 11 diálogos modulares (auditoría, triaje, login, etc.)
│   ├── ComunicadoMarquee.jsx   # Cintillo animado de anuncios oficiales
│   ├── Reloj.jsx               # Cronómetro memoizado de bajo consumo
│   └── Toast.jsx               # Notificaciones flotantes no bloqueantes
├── context/
│   └── AppContext.jsx          # Estado centralizado con React Context
├── constants/
│   └── index.js                # Prioridades de triaje y estados de médico
├── utils/
│   ├── horarios.js             # Cálculos de turnos, guardias y tiempos
│   └── excel.js                # Procesamiento y exportación de reportes
├── firebase.js                 # Inicialización y validación de credenciales
├── App.jsx                     # Componente raíz simplificado (~60 líneas)
└── main.jsx                    # Entrada con ToastProvider y AppProvider
```

### 4. 🎨 Experiencia de Usuario (UX)
- Reemplazo de los diálogos nativos `alert()` por un sistema de **Notificaciones Toast** elegante y fluido.
- Accesibilidad mejorada (`lang="es"`, metadatos y etiquetas legibles).

---

## 🛠️ Instalación y Uso Local

1. Clona el repositorio e instala las dependencias:
```bash
npm install
```

2. Configura las variables de entorno:
Crea un archivo `.env` basado en `.env.example` con tus credenciales de Firebase:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=h-ii-pucallpa.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=h-ii-pucallpa
VITE_FIREBASE_STORAGE_BUCKET=h-ii-pucallpa.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=986111583818
VITE_FIREBASE_APP_ID=1:986111583818:web:...
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Compila para producción:
```bash
npm run build
```

---

## 🔒 Despliegue de Reglas de Seguridad en Firebase

Para activar las reglas de seguridad en tu base de datos de producción:

1. Instala Firebase CLI (si no lo tienes):
```bash
npm install -g firebase-tools
```

2. Inicia sesión en Firebase:
```bash
firebase login
```

3. Publica las reglas desde la raíz del proyecto:
```bash
firebase deploy --only firestore:rules
```
*(O copia y pega el contenido del archivo `firestore.rules` directamente en la consola de Firebase > Firestore Database > pestaña **Reglas**).*
