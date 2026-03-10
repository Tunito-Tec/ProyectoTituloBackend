const mongoose = require("mongoose");

const tramiteTypeSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    tipoId: { type: String, required: true, unique: true }, // poder_simple, compraventa, etc.
    descripcion: String,
    activo: { type: Boolean, default: true },

    // Configuración del formulario dinámico
    campos: [
      {
        nombre: String,
        etiqueta: String,
        tipo: {
          type: String,
          enum: [
            "text",
            "number",
            "date",
            "email",
            "rut",
            "select",
            "file",
            "textarea",
          ],
        },
        requerido: { type: Boolean, default: false },
        opciones: [String], // para campos tipo select
        validaciones: {
          min: Number,
          max: Number,
          pattern: String,
          mensaje: String,
        },
      },
    ],

    // Configuración del flujo
    flujo: {
      pasos: [
        {
          nombre: String,
          orden: Number,
          campos: [String], // nombres de campos incluidos en este paso
          requiereDocumentos: Boolean,
        },
      ],
      rolesPermitidos: [
        {
          rol: { type: String, enum: ["cliente", "auxiliar", "notario"] },
          puedeEditar: Boolean,
          puedeValidar: Boolean,
        },
      ],
    },

    // Documentos requeridos
    documentosRequeridos: [
      {
        nombre: String,
        descripcion: String,
        requerido: Boolean,
        tipoArchivo: [String], // pdf, image, etc.
      },
    ],

    // Costos y tarifas
    costos: {
      monto: Number,
      moneda: { type: String, default: "CLP" },
      incluyeIva: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TramiteType", tramiteTypeSchema);
