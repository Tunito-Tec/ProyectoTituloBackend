const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const TramiteType = require("../models/TramiteType");
require("dotenv").config();

const seedDatabase = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Conectado a MongoDB para seeding...");

    // Limpiar colecciones existentes
    await User.deleteMany({});
    await TramiteType.deleteMany({});
    console.log("🧹 Colecciones limpiadas");

    // Crear usuario admin por defecto
    const adminPassword = await bcrypt.hash("Admin123!", 10);
    const admin = await User.create({
      nombre: "Administrador",
      email: "admin@sinotarial.cl",
      rut: "11111111-1",
      password: adminPassword,
      rol: "admin",
    });
    console.log("👤 Usuario admin creado:", admin.email);

    // Crear tipos de trámite por defecto
    const tiposTramite = [
      {
        nombre: "Poder Simple",
        tipoId: "poder_simple",
        descripcion: "Otorgamiento de poder general o especial",
        campos: [
          {
            nombre: "poderdante",
            etiqueta: "Poderdante",
            tipo: "text",
            requerido: true,
          },
          {
            nombre: "apoderado",
            etiqueta: "Apoderado",
            tipo: "text",
            requerido: true,
          },
          {
            nombre: "facultades",
            etiqueta: "Facultades",
            tipo: "textarea",
            requerido: true,
          },
        ],
      },
      {
        nombre: "Compraventa",
        tipoId: "compraventa",
        descripcion: "Contrato de compraventa de bienes",
        campos: [
          {
            nombre: "vendedor",
            etiqueta: "Vendedor",
            tipo: "text",
            requerido: true,
          },
          {
            nombre: "comprador",
            etiqueta: "Comprador",
            tipo: "text",
            requerido: true,
          },
          {
            nombre: "inmueble",
            etiqueta: "Inmueble",
            tipo: "textarea",
            requerido: true,
          },
          {
            nombre: "precio",
            etiqueta: "Precio",
            tipo: "number",
            requerido: true,
          },
        ],
      },
    ];

    await TramiteType.insertMany(tiposTramite);
    console.log("📋 Tipos de trámite creados");

    console.log("✅ Seed completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }
};

seedDatabase();
