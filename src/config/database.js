const mongoose = require("mongoose");
const { mongoUri, nodeEnv } = require("./environment");

const connectDB = async () => {
  try {
    // Verificar que mongoUri existe
    if (!mongoUri) {
      throw new Error("MONGO_URI no está definida en las variables de entorno");
    }

    console.log("🔄 Conectando a MongoDB...");

    // ✅ Versión simplificada para Mongoose 6+
    // Eliminamos las opciones obsoletas
    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`.cyan.underline);

    // Eventos de conexión (opcional pero útil para debugging)
    mongoose.connection.on("error", (err) => {
      console.error("❌ Error en la conexión de MongoDB:".red, err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB desconectado".yellow);
    });

    return conn;
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:".red, error.message);
    console.error("💡 Verifica que:");
    console.error("   1. MongoDB esté instalado y corriendo (mongod)");
    console.error("   2. La variable MONGO_URI en .env sea correcta");
    console.error("   3. No haya problemas de red o firewall");

    // Intentar diagnosticar el problema
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n🔴 ERROR: MongoDB no está corriendo en localhost:27017");
      console.error("   Solución: Inicia MongoDB con:");
      console.error("   - Windows: net start MongoDB");
      console.error("   - Mac: brew services start mongodb-community");
      console.error("   - Linux: sudo systemctl start mongod");
    }

    // Salir con error
    process.exit(1);
  }
};

module.exports = connectDB;
