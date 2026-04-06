// seed.js - Versión corregida (sin opciones obsoletas)
require("dotenv").config();
const mongoose = require("mongoose");
const colors = require("colors");
const TramiteType = require("./src/models/TramiteType");

// Configurar colores
colors.enable();

// Datos de tipos de trámite (mantén el array completo que ya tienes)
const tramiteTypes = [
  {
    nombre: "Poder Simple",
    tipoId: "poder_simple",
    descripcion:
      "Otorgamiento de poder general o especial para representación en actos jurídicos",
    activo: true,
    campos: [
      {
        nombre: "nombre_poderdante",
        etiqueta: "Nombre del poderdante (quien otorga el poder)",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "rut_poderdante",
        etiqueta: "RUT del poderdante",
        tipo: "rut",
        requerido: true,
      },
      {
        nombre: "nombre_apoderado",
        etiqueta: "Nombre del apoderado",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "rut_apoderado",
        etiqueta: "RUT del apoderado",
        tipo: "rut",
        requerido: true,
      },
      {
        nombre: "facultades",
        etiqueta: "Facultades otorgadas",
        tipo: "textarea",
        requerido: true,
      },
    ],
    documentosRequeridos: [
      {
        nombre: "Cédula de identidad poderdante",
        descripcion: "Copia por ambos lados",
        requerido: true,
        tipoArchivo: ["pdf", "image"],
      },
      {
        nombre: "Cédula de identidad apoderado",
        descripcion: "Copia por ambos lados",
        requerido: true,
        tipoArchivo: ["pdf", "image"],
      },
    ],
    costos: {
      monto: 15000,
      moneda: "CLP",
      incluyeIva: true,
    },
  },
  {
    nombre: "Compraventa de Inmueble",
    tipoId: "compraventa",
    descripcion: "Contrato de compraventa de bienes raíces",
    activo: true,
    campos: [
      {
        nombre: "nombre_vendedor",
        etiqueta: "Nombre del vendedor",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "rut_vendedor",
        etiqueta: "RUT del vendedor",
        tipo: "rut",
        requerido: true,
      },
      {
        nombre: "nombre_comprador",
        etiqueta: "Nombre del comprador",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "rut_comprador",
        etiqueta: "RUT del comprador",
        tipo: "rut",
        requerido: true,
      },
      {
        nombre: "direccion_inmueble",
        etiqueta: "Dirección del inmueble",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "rol_avaluo",
        etiqueta: "Rol de avalúo",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "precio_venta",
        etiqueta: "Precio de venta",
        tipo: "number",
        requerido: true,
      },
      {
        nombre: "forma_pago",
        etiqueta: "Forma de pago",
        tipo: "select",
        requerido: true,
        opciones: ["Contado", "Crédito hipotecario", "Pagarés", "Mixto"],
      },
    ],
    documentosRequeridos: [
      {
        nombre: "Certificado de avalúo fiscal",
        descripcion: "Vigente",
        requerido: true,
        tipoArchivo: ["pdf"],
      },
      {
        nombre: "Certificado de hipotecas",
        descripcion: "Vigente",
        requerido: true,
        tipoArchivo: ["pdf"],
      },
    ],
    costos: {
      monto: 50000,
      moneda: "CLP",
      incluyeIva: true,
    },
  },
  {
    nombre: "Constitución de Sociedad",
    tipoId: "constitucion_sociedad",
    descripcion: "Creación de sociedad de responsabilidad limitada o SpA",
    activo: true,
    campos: [
      {
        nombre: "razon_social",
        etiqueta: "Razón social",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "tipo_sociedad",
        etiqueta: "Tipo de sociedad",
        tipo: "select",
        requerido: true,
        opciones: [
          "Sociedad de Responsabilidad Limitada",
          "Sociedad por Acciones (SpA)",
          "EIRL",
        ],
      },
      {
        nombre: "giro",
        etiqueta: "Giro comercial",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "capital_social",
        etiqueta: "Capital social",
        tipo: "number",
        requerido: true,
      },
      {
        nombre: "numero_socios",
        etiqueta: "Número de socios",
        tipo: "number",
        requerido: true,
      },
    ],
    documentosRequeridos: [
      {
        nombre: "Cédulas de identidad socios",
        descripcion: "Todos los socios",
        requerido: true,
        tipoArchivo: ["pdf", "image"],
      },
    ],
    costos: {
      monto: 80000,
      moneda: "CLP",
      incluyeIva: true,
    },
  },
  {
    nombre: "Mandato Judicial",
    tipoId: "mandato_judicial",
    descripcion:
      "Poder para representación en juicios y procedimientos judiciales",
    activo: true,
    campos: [
      {
        nombre: "nombre_mandante",
        etiqueta: "Nombre del mandante",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "rut_mandante",
        etiqueta: "RUT del mandante",
        tipo: "rut",
        requerido: true,
      },
      {
        nombre: "nombre_abogado",
        etiqueta: "Nombre del abogado patrocinante",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "rut_abogado",
        etiqueta: "RUT del abogado",
        tipo: "rut",
        requerido: true,
      },
      {
        nombre: "corte",
        etiqueta: "Corte o tribunal",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "materia_juicio",
        etiqueta: "Materia del juicio",
        tipo: "textarea",
        requerido: true,
      },
    ],
    documentosRequeridos: [
      {
        nombre: "Cédula de identidad mandante",
        descripcion: "Copia por ambos lados",
        requerido: true,
        tipoArchivo: ["pdf", "image"],
      },
      {
        nombre: "Cédula de identidad abogado",
        descripcion: "Copia por ambos lados",
        requerido: true,
        tipoArchivo: ["pdf", "image"],
      },
    ],
    costos: {
      monto: 25000,
      moneda: "CLP",
      incluyeIva: true,
    },
  },
  {
    nombre: "Testamento Abierto",
    tipoId: "testamento",
    descripcion: "Declaración de última voluntad",
    activo: true,
    campos: [
      {
        nombre: "nombre_testador",
        etiqueta: "Nombre completo del testador",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "rut_testador",
        etiqueta: "RUT del testador",
        tipo: "rut",
        requerido: true,
      },
      {
        nombre: "fecha_nacimiento",
        etiqueta: "Fecha de nacimiento",
        tipo: "date",
        requerido: true,
      },
      {
        nombre: "nacionalidad",
        etiqueta: "Nacionalidad",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "estado_civil",
        etiqueta: "Estado civil",
        tipo: "select",
        requerido: true,
        opciones: ["Soltero", "Casado", "Viudo", "Divorciado", "Separado"],
      },
      {
        nombre: "herederos",
        etiqueta: "Nombres de los herederos",
        tipo: "textarea",
        requerido: true,
      },
      {
        nombre: "bienes",
        etiqueta: "Descripción de bienes",
        tipo: "textarea",
        requerido: true,
      },
    ],
    documentosRequeridos: [
      {
        nombre: "Cédula de identidad testador",
        descripcion: "Vigente",
        requerido: true,
        tipoArchivo: ["pdf", "image"],
      },
      {
        nombre: "Certificado de nacimiento",
        descripcion: "Actualizado",
        requerido: true,
        tipoArchivo: ["pdf"],
      },
    ],
    costos: {
      monto: 45000,
      moneda: "CLP",
      incluyeIva: true,
    },
  },
  {
    nombre: "Autorización de Viaje",
    tipoId: "autorizacion_viaje",
    descripcion: "Autorización notarial para viaje de menores de edad",
    activo: true,
    campos: [
      {
        nombre: "nombre_menor",
        etiqueta: "Nombre del menor",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "rut_menor",
        etiqueta: "RUT del menor",
        tipo: "rut",
        requerido: true,
      },
      {
        nombre: "fecha_nacimiento_menor",
        etiqueta: "Fecha de nacimiento del menor",
        tipo: "date",
        requerido: true,
      },
      {
        nombre: "nombres_autorizantes",
        etiqueta: "Nombres de quienes autorizan (padres/tutores)",
        tipo: "textarea",
        requerido: true,
      },
      {
        nombre: "destino_viaje",
        etiqueta: "Destino del viaje",
        tipo: "text",
        requerido: true,
      },
      {
        nombre: "fecha_salida",
        etiqueta: "Fecha de salida",
        tipo: "date",
        requerido: true,
      },
      {
        nombre: "fecha_regreso",
        etiqueta: "Fecha de regreso",
        tipo: "date",
        requerido: true,
      },
    ],
    documentosRequeridos: [
      {
        nombre: "Cédulas de identidad autorizantes",
        descripcion: "De ambos padres/tutores",
        requerido: true,
        tipoArchivo: ["pdf", "image"],
      },
      {
        nombre: "Certificado de nacimiento menor",
        descripcion: "Actualizado",
        requerido: true,
        tipoArchivo: ["pdf"],
      },
    ],
    costos: {
      monto: 12000,
      moneda: "CLP",
      incluyeIva: true,
    },
  },
];

// Función para conectar a MongoDB (SIN opciones obsoletas)
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `✅ MongoDB Conectado: ${conn.connection.host}`.cyan.underline.bold,
    );
    return conn;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

// Función principal
const seedDatabase = async () => {
  try {
    // Mostrar URI (ocultando contraseña si existe)
    const mongoUri = process.env.MONGO_URI || "No definida";
    const hiddenUri = mongoUri.replace(/:[^:@]*@/, ":****@");
    console.log(`🔌 Conectando a MongoDB: ${hiddenUri}`.yellow);

    // Conectar a MongoDB
    await connectDB();

    console.log("\n📦 Limpiando colección existente...".yellow);
    await TramiteType.deleteMany({});
    console.log("✅ Colección limpiada".green);

    console.log("\n📝 Insertando tipos de trámite...".yellow);
    const result = await TramiteType.insertMany(tramiteTypes);

    console.log("\n" + "=".repeat(50).green);
    console.log("✅ SEED COMPLETADO EXITOSAMENTE".green.bold);
    console.log("=".repeat(50).green);
    console.log(`📊 Total insertados: ${result.length}`.cyan);
    console.log("\n📋 Tipos de trámite creados:".cyan);

    result.forEach((tipo, index) => {
      console.log(`   ${index + 1}. ${tipo.nombre} (${tipo.tipoId})`.white);
      console.log(
        `      💰 $${tipo.costos.monto.toLocaleString("es-CL")} - ${tipo.campos.length} campos`
          .gray,
      );
    });

    console.log("\n" + "=".repeat(50).green);

    // Cerrar conexión
    await mongoose.connection.close();
    console.log("🔌 Conexión cerrada".yellow);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error en seed:".red, error);
    process.exit(1);
  }
};

// Ejecutar seed
seedDatabase();
