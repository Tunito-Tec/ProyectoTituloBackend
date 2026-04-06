// ==============================================
// 0. CONFIGURACIÓN DE ENTORNO (DEBE SER LO PRIMERO)
// ==============================================
const path = require("path");
const fs = require("fs");

// Determinar qué archivo .env usar según NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

// Verificar si el archivo existe
if (fs.existsSync(path.resolve(process.cwd(), envFile))) {
  console.log(`📁 Cargando configuración desde: ${envFile}`);
  require("dotenv").config({ path: envFile });
} else {
  console.log(`⚠️ No se encontró ${envFile}, usando .env por defecto`);
  require("dotenv").config();
}

// ==============================================
// 1. IMPORTACIONES Y CONFIGURACIÓN
// ==============================================
const express = require("express");
const colors = require("colors");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/config/database");
const { port, clientUrl, nodeEnv } = require("./src/config/environment");

// Importar Rutas - VERIFICA QUE TODAS EXISTAN
const authRoutes = require("./src/routes/authRoutes");
const clientRoutes = require("./src/routes/clientRoutes");
const auxiliaryRoutes = require("./src/routes/auxiliaryRoutes");
const notaryRoutes = require("./src/routes/notaryRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const tramiteTypeRoutes = require("./src/routes/tramiteTypeRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const auditRoutes = require("./src/routes/auditRoutes");

// ==============================================
// 2. INICIALIZAR APP Y CONEXIONES
// ==============================================
const app = express();
app.set("trust proxy", 1); // ← agrega esta línea

// Conectar a MongoDB
connectDB();

// ==============================================
// 3. MIDDLEWARES GLOBALES
// ==============================================
app.use(helmet());

const allowedOrigins = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://159.112.142.255",
  "https://sinotarial.pages.dev",
  "https://unpessimistic-lane-exothermally.ngrok-free.dev",
  clientUrl,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`❌ CORS bloqueó el origen: ${origin}`);
        console.log(`✅ Orígenes permitidos: ${allowedOrigins.join(", ")}`);
        callback(new Error(`Origen ${origin} no permitido por CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "ngrok-skip-browser-warning",
    ],
    exposedHeaders: ["Authorization"],
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:
    "Demasiadas peticiones desde esta IP, por favor intenta de nuevo después de 15 minutos",
});
app.use("/api", limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================================
// 4. RUTAS DE LA API
// ==============================================
app.get("/", (req, res) => {
  res.send("🚀 API SINotarial funcionando!");
});

app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/auxiliar", auxiliaryRoutes);
app.use("/api/notario", notaryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tramite-types", tramiteTypeRoutes);
app.use("/api/notificaciones", notificationRoutes);
app.use("/api/auditoria", auditRoutes);

// ==============================================
// 5. MIDDLEWARE DE MANEJO DE ERRORES
// ==============================================
app.use((err, req, res, next) => {
  console.error("❌ Error detectado:".red);
  console.error(err.stack?.red || err);

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: "Error de validación",
      errors,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `El ${field} ya está registrado en el sistema`,
      field,
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "JSON mal formado" });
  }

  res.status(500).json({
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Error interno del servidor",
  });
});

// ==============================================
// 6. INICIAR SERVIDOR
// ==============================================
app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`.yellow.bold);
  console.log(`🌍 Modo: ${nodeEnv}`.cyan);
});
