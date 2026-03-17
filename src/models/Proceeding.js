const mongoose = require("mongoose");

const proceedingSchema = new mongoose.Schema(
  {
    // Cambiar para guardar la referencia al tipo de trámite
    tipo: {
      type: mongoose.Schema.Types.ObjectId, // Cambiar a ObjectId
      ref: "TramiteType", // Referencia al modelo TramiteType
      required: true,
    },
    // Mantener el tipoId como campo separado para búsquedas rápidas
    tipoId: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: [
        "pendiente",
        "pendiente_revision_auxiliar",
        "en_revision",
        "esperando_firma_cliente",
        "esperando_firma_notario",
        "completado",
        "rechazado",
      ],
      default: "pendiente",
    },
    // Quién inició el trámite
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // A quién está asignado (auxiliar o notario)
    asignadoA: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Datos específicos del formulario dinámico (guardado como JSON)
    datosFormulario: { type: mongoose.Schema.Types.Mixed },
    // Documentos adjuntos (array de URLs o IDs)
    documentos: [
      {
        nombre: String,
        url: String,
        tipo: String,
        fechaSubida: { type: Date, default: Date.now },
      },
    ],
    // Hash del documento final para integridad (SHA-256)
    hashDocumentoFinal: String,
    // Fechas clave
    fechaFirmaCliente: Date,
    fechaFirmaNotario: Date,
    // Trazabilidad (logs simples)
    historial: [
      {
        accion: String,
        usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        fecha: { type: Date, default: Date.now },
        detalles: String,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Proceeding", proceedingSchema);
