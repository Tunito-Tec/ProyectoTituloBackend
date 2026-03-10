const Proceeding = require("../models/Proceeding");
const User = require("../models/User");
const crypto = require("crypto");

// Simulación de conexión con HSM (Hardware Security Module)
// En un entorno real, esto se conectaría con un dispositivo físico o servicio cloud
class HSMService {
  constructor() {
    this.connected = false;
    this.hsmSimulation = {
      // Simula un certificado digital del notario
      certificado: {
        serialNumber: "1234567890ABCDEF",
        issuer: "CN=Autoridad Certificadora Notarial, C=CL",
        subject: "CN=Notario Ejemplo, OU=Notaría, O=Registro Civil, C=CL",
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2025-12-31"),
      },
    };
  }

  async connect() {
    // Simular conexión con HSM
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        console.log("✅ Conectado al HSM (simulado)");
        resolve(true);
      }, 500);
    });
  }

  async signDocument(documentHash, notarioId) {
    if (!this.connected) {
      await this.connect();
    }

    // Simular firma digital usando RSA (en producción usarías el HSM real)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Crear una firma digital simulada
        const sign = crypto.createSign("RSA-SHA256");
        sign.update(documentHash);

        // Simular una llave privada (en HSM real esto estaría protegido)
        const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8Lc2VXvBrF9hJ
... (esto es solo una simulación)
-----END PRIVATE KEY-----`;

        // En producción, esta operación ocurre dentro del HSM
        const signature = sign.sign(privateKey, "base64");

        // Obtener timestamp del servidor (en producción sería un timestamp cualificado)
        const timestamp = new Date().toISOString();

        // Crear sello de tiempo (simulado)
        const timeStampToken = crypto
          .createHash("sha256")
          .update(timestamp + documentHash)
          .digest("hex");

        resolve({
          signature,
          timestamp,
          timeStampToken,
          certificado: this.hsmSimulation.certificado,
          hashFirmado: documentHash,
        });
      }, 1000); // Simular tiempo de procesamiento del HSM
    });
  }

  async verifySignature(documentHash, signature, certificado) {
    // Simular verificación de firma
    return new Promise((resolve) => {
      setTimeout(() => {
        // En producción, esto verificaría la firma contra el certificado
        const isValid = true; // Simular verificación exitosa

        resolve({
          isValid,
          detalles: {
            hashVerificado: documentHash,
            fechaVerificacion: new Date().toISOString(),
            certificadoValido: certificado.validTo > new Date(),
          },
        });
      }, 300);
    });
  }
}

// Instancia global del servicio HSM (singleton)
const hsmService = new HSMService();

// @desc    Obtener trámites pendientes de firma
// @route   GET /api/notario/tramites/pendientes-firma
const getProceedingsPendingSignature = async (req, res) => {
  try {
    const proceedings = await Proceeding.find({
      estado: { $in: ["esperando_firma_notario", "esperando_firma_cliente"] },
    })
      .populate("cliente", "nombre email rut")
      .populate("asignadoA", "nombre email")
      .sort("-updatedAt");

    // Separar por tipo de firma pendiente
    const resultado = {
      pendientesFirmaNotario: proceedings.filter(
        (p) => p.estado === "esperando_firma_notario",
      ),
      pendientesFirmaCliente: proceedings.filter(
        (p) => p.estado === "esperando_firma_cliente",
      ),
    };

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Firmar digitalmente un documento (notario)
// @route   POST /api/notario/tramites/:id/firmar
const signDocument = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id);

    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    // Verificar que el trámite está en estado correcto
    if (proceeding.estado !== "esperando_firma_notario") {
      return res.status(400).json({
        message: "Este trámite no está listo para firma del notario",
        estadoActual: proceeding.estado,
      });
    }

    // Generar o usar hash existente
    let documentHash = proceeding.hashDocumentoFinal;
    if (!documentHash) {
      // Generar hash del contenido del trámite
      const documentContent = JSON.stringify({
        id: proceeding._id,
        tipo: proceeding.tipo,
        datos: proceeding.datosFormulario,
        documentos: proceeding.documentos,
        cliente: proceeding.cliente,
        timestamp: new Date().toISOString(),
      });

      documentHash = crypto
        .createHash("sha256")
        .update(documentContent)
        .digest("hex");
      proceeding.hashDocumentoFinal = documentHash;
    }

    // Firmar con HSM
    const firmaDigital = await hsmService.signDocument(
      documentHash,
      req.user._id,
    );

    // Guardar información de la firma en el trámite
    proceeding.firmaNotario = {
      firma: firmaDigital.signature,
      timestamp: firmaDigital.timestamp,
      timeStampToken: firmaDigital.timeStampToken,
      certificado: firmaDigital.certificado,
      hashFirmado: firmaDigital.hashFirmado,
    };

    proceeding.estado = "completado";
    proceeding.fechaFirmaNotario = new Date();

    proceeding.historial.push({
      accion: "FIRMA_NOTARIO_COMPLETADA",
      usuario: req.user._id,
      detalles: `Documento firmado digitalmente por notario. Hash: ${documentHash.substring(0, 10)}...`,
    });

    await proceeding.save();

    // Opcional: Enviar notificación al cliente
    // await sendEmailNotification(proceeding.cliente.email, 'documento_firmado');

    res.json({
      success: true,
      data: {
        proceeding: {
          id: proceeding._id,
          estado: proceeding.estado,
          fechaFirma: proceeding.fechaFirmaNotario,
        },
        firma: {
          hashFirmado: firmaDigital.hashFirmado,
          timestamp: firmaDigital.timestamp,
          certificado: firmaDigital.certificado.serialNumber,
        },
      },
      message: "Documento firmado exitosamente",
    });
  } catch (error) {
    console.error("Error en firma digital:", error);
    res.status(500).json({
      message: "Error al procesar la firma digital",
      error: error.message,
    });
  }
};

// @desc    Validar minuta antes de firma
// @route   POST /api/notario/tramites/:id/validar-minuta
const validateMinuta = async (req, res) => {
  try {
    const { observaciones, aprobado } = req.body;

    const proceeding = await Proceeding.findById(req.params.id);

    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    if (aprobado) {
      proceeding.estado = "esperando_firma_notario";
    } else {
      proceeding.estado = "borrador";
    }

    proceeding.historial.push({
      accion: aprobado ? "MINUTA_APROBADA" : "MINUTA_RECHAZADA",
      usuario: req.user._id,
      detalles:
        observaciones ||
        (aprobado
          ? "Minuta validada por notario"
          : "Minuta requiere correcciones"),
    });

    await proceeding.save();

    res.json({
      success: true,
      data: proceeding,
      message: aprobado
        ? "Minuta aprobada, lista para firma"
        : "Minuta rechazada, se requieren correcciones",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verificar firma digital de un documento
// @route   POST /api/notario/tramites/:id/verificar-firma
const verifySignature = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id);

    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    if (!proceeding.firmaNotario) {
      return res
        .status(400)
        .json({ message: "Este trámite no tiene firma digital registrada" });
    }

    // Verificar la firma usando el HSM
    const verificacion = await hsmService.verifySignature(
      proceeding.firmaNotario.hashFirmado,
      proceeding.firmaNotario.firma,
      proceeding.firmaNotario.certificado,
    );

    // Verificar integridad del documento
    const documentContent = JSON.stringify({
      id: proceeding._id,
      tipo: proceeding.tipo,
      datos: proceeding.datosFormulario,
      documentos: proceeding.documentos,
      cliente: proceeding.cliente,
    });

    const currentHash = crypto
      .createHash("sha256")
      .update(documentContent)
      .digest("hex");
    const hashIntegro = currentHash === proceeding.hashDocumentoFinal;

    res.json({
      success: true,
      data: {
        firmaValida: verificacion.isValid,
        documentoIntegro: hashIntegro,
        certificadoValido: verificacion.detalles.certificadoValido,
        fechaVerificacion: verificacion.detalles.fechaVerificacion,
        detalles: {
          hashActual: currentHash,
          hashOriginal: proceeding.hashDocumentoFinal,
          certificado: proceeding.firmaNotario.certificado,
          timestampFirma: proceeding.firmaNotario.timestamp,
        },
      },
      message:
        verificacion.isValid && hashIntegro
          ? "✅ Firma válida y documento íntegro"
          : "⚠️ La verificación falló - el documento puede haber sido alterado",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener estadísticas del dashboard notarial
// @route   GET /api/notario/dashboard/stats
const getNotaryStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Estadísticas en paralelo para mejor performance
    const [
      totalTramitesHoy,
      pendientesFirma,
      tiempoPromedioResolucion,
      tramitesPorEstado,
      tramitesPorTipo,
    ] = await Promise.all([
      // Trámites del día
      Proceeding.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
      }),

      // Pendientes de firma (notario)
      Proceeding.countDocuments({
        estado: "esperando_firma_notario",
      }),

      // Tiempo promedio de resolución (en horas)
      Proceeding.aggregate([
        {
          $match: {
            estado: "completado",
            fechaFirmaNotario: { $exists: true },
          },
        },
        {
          $project: {
            tiempoResolucion: {
              $divide: [
                { $subtract: ["$fechaFirmaNotario", "$createdAt"] },
                3600000, // convertir milisegundos a horas
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            promedio: { $avg: "$tiempoResolucion" },
          },
        },
      ]),

      // Conteo por estado
      Proceeding.aggregate([
        {
          $group: {
            _id: "$estado",
            count: { $sum: 1 },
          },
        },
      ]),

      // Conteo por tipo de trámite
      Proceeding.aggregate([
        {
          $group: {
            _id: "$tipo",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        tramitesHoy: totalTramitesHoy,
        pendientesFirma: pendientesFirma,
        tiempoPromedioHoras: Math.round(
          tiempoPromedioResolucion[0]?.promedio || 0,
        ),
        distribucionEstados: tramitesPorEstado.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        distribucionTipos: tramitesPorTipo.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalTramites: tramitesPorEstado.reduce(
          (sum, item) => sum + item.count,
          0,
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProceedingsPendingSignature,
  signDocument,
  validateMinuta,
  verifySignature,
  getNotaryStats,
};
