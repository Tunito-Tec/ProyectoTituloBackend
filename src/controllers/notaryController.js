const Proceeding = require("../models/Proceeding");
const User = require("../models/User");
const crypto = require("crypto");

// Simulación simplificada de HSM (Hardware Security Module)
class HSMService {
  constructor() {
    this.connected = false;
    this.hsmSimulation = {
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
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        console.log("✅ Conectado al HSM (simulado)");
        resolve(true);
      }, 500);
    });
  }

  async signDocument(documentHash, notarioId) {
    if (!this.connected) await this.connect();

    // Simular firma digital sin usar criptografía RSA
    return new Promise((resolve) => {
      setTimeout(() => {
        const timestamp = new Date().toISOString();

        // Generar una firma simulada basada en el hash y timestamp
        const firmaSimulada = crypto
          .createHash("sha256")
          .update(documentHash + timestamp + notarioId)
          .digest("hex");

        const signature = `SIM_SIGNATURE_${firmaSimulada.substring(0, 20)}`;
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
      }, 1000);
    });
  }

  async verifySignature(documentHash, signature, certificado) {
    // Simular verificación de firma
    return new Promise((resolve) => {
      setTimeout(() => {
        // En simulación, siempre es válida
        resolve({
          isValid: true,
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

const hsmService = new HSMService();

// @desc    Obtener trámites pendientes de firma del notario (para el listado)
// @route   GET /api/notario/tramites/pendientes-firma
const getPendingSignatures = async (req, res) => {
  try {
    const proceedings = await Proceeding.find({
      estado: "esperando_firma_notario",
      $or: [{ asignadoA: req.user._id }, { asignadoA: { $exists: false } }],
    })
      .populate("cliente", "nombre email rut")
      .populate("tipo", "nombre tipoId")
      .sort("-createdAt");

    const proceedingsFormateados = proceedings.map((proc) => {
      const procObj = proc.toObject();
      return {
        _id: procObj._id,
        tipo: procObj.tipo?.nombre || procObj.tipoId || "Sin tipo",
        cliente: procObj.cliente,
        estado: procObj.estado,
        createdAt: procObj.createdAt,
        tipoId: procObj.tipoId,
        documentos: procObj.documentos,
      };
    });

    res.json({
      success: true,
      data: {
        pendientesFirmaNotario: proceedingsFormateados,
        total: proceedingsFormateados.length,
      },
    });
  } catch (error) {
    console.error("Error en getPendingSignatures:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtener detalle de un trámite específico (para notario)
// @route   GET /api/notario/tramites/:id
const getProceedingById = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id)
      .populate("cliente", "nombre email rut")
      .populate("tipo", "nombre tipoId")
      .populate("asignadoA", "nombre email rol")
      .populate("historial.usuario", "nombre rol");

    if (!proceeding) {
      return res.status(404).json({
        success: false,
        message: "Trámite no encontrado",
      });
    }

    res.json({
      success: true,
      data: proceeding,
    });
  } catch (error) {
    console.error("Error en getProceedingById:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

    if (proceeding.estado !== "esperando_firma_notario") {
      return res.status(400).json({
        message: "Este trámite no está listo para firma del notario",
        estadoActual: proceeding.estado,
      });
    }

    // Generar hash si no existe
    let documentHash = proceeding.hashDocumentoFinal;
    if (!documentHash) {
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

    // Firmar con HSM (simulado)
    const firmaDigital = await hsmService.signDocument(
      documentHash,
      req.user._id,
    );

    // Guardar información de la firma
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

    const verificacion = await hsmService.verifySignature(
      proceeding.firmaNotario.hashFirmado,
      proceeding.firmaNotario.firma,
      proceeding.firmaNotario.certificado,
    );

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

// @desc    Verificar integridad del documento (ANTES de firmar)
// @route   POST /api/notario/tramites/:id/verificar-integridad
const verifyIntegrity = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id);

    if (!proceeding) {
      return res.status(404).json({
        success: false,
        message: "Trámite no encontrado",
      });
    }

    // Verificar que el trámite tenga hash
    if (!proceeding.hashDocumentoFinal) {
      return res.status(400).json({
        success: false,
        message: "Este trámite no tiene un hash de integridad generado",
      });
    }

    // Regenerar el hash del documento actual para comparar
    const documentContent = JSON.stringify({
      id: proceeding._id,
      tipo: proceeding.tipo,
      datos: proceeding.datosFormulario,
      documentos: proceeding.documentos,
      cliente: proceeding.cliente,
      fechaFirmaCliente: proceeding.fechaFirmaCliente,
    });

    const currentHash = crypto
      .createHash("sha256")
      .update(documentContent)
      .digest("hex");

    const isIntegro = currentHash === proceeding.hashDocumentoFinal;

    // También verificar si el documento ha sido firmado por el cliente
    const clienteFirmo = !!proceeding.fechaFirmaCliente;

    // Si el cliente ya firmó, permitir la firma aunque el hash sea diferente
    const puedeFirmar = isIntegro || clienteFirmo;

    res.json({
      success: true,
      data: {
        isIntegro,
        puedeFirmar,
        hashActual: currentHash,
        hashOriginal: proceeding.hashDocumentoFinal,
        documentoModificado: !isIntegro,
        clienteFirmo,
        estado: proceeding.estado,
      },
      message: isIntegro
        ? "✅ Documento íntegro - Puede firmar"
        : clienteFirmo
          ? "⚠️ El cliente ya firmó - Puede proceder con la firma"
          : "❌ El documento ha sido modificado - No se puede firmar",
    });
  } catch (error) {
    console.error("Error en verifyIntegrity:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtener estadísticas del dashboard notarial
// @route   GET /api/notario/dashboard/stats
// @desc    Obtener estadísticas del dashboard notarial
// @route   GET /api/notario/dashboard/stats
const getNotaryStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalTramitesHoy,
      pendientesFirma,
      documentosEntregables, // ← NUEVO
      tiempoPromedioResolucion,
      tramitesPorEstado,
      tramitesPorTipo,
    ] = await Promise.all([
      Proceeding.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Proceeding.countDocuments({ estado: "esperando_firma_notario" }),
      Proceeding.countDocuments({
        estado: "completado",
        // Opcional: filtrar por notario actual
        $or: [{ asignadoA: req.user._id }, { asignadoA: { $exists: false } }],
      }), // ← Documentos listos para entregar
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
                3600000,
              ],
            },
          },
        },
        { $group: { _id: null, promedio: { $avg: "$tiempoResolucion" } } },
      ]),
      Proceeding.aggregate([
        { $group: { _id: "$estado", count: { $sum: 1 } } },
      ]),
      Proceeding.aggregate([{ $group: { _id: "$tipo", count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      data: {
        tramitesHoy: totalTramitesHoy,
        pendientesFirma: pendientesFirma,
        documentosEntregables: documentosEntregables, // ← NUEVO
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
    console.error("Error en getNotaryStats:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generar copia para el cliente (no editable)
// @route   GET /api/tramites/:id/copia-cliente
// @desc    Generar copia para el cliente (no editable)
// @route   GET /api/tramites/:id/copia-cliente
// @desc    Generar copia para el cliente (no editable)
// @route   GET /api/notario/tramites/:id/copia-cliente
// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("es-CL") : "No disponible";

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("es-CL") : "No disponible";

/** Genera un CSV tipo "A3F8-C2D9-1E4B" a partir del trámite */
const buildCSV = (proceeding) =>
  crypto
    .createHash("sha256")
    .update(
      proceeding._id.toString() +
        (proceeding.hashDocumentoFinal || "") +
        Date.now(),
    )
    .digest("hex")
    .substring(0, 16)
    .toUpperCase()
    .match(/.{1,4}/g)
    .join("-");

/** Intenta cargar pdfkit y qrcode; lanza si no están instalados */
const loadDeps = () => {
  try {
    return {
      PDFDocument: require("pdfkit"),
      QRCode: require("qrcode"),
    };
  } catch {
    throw new Error(
      "Dependencias faltantes. Ejecute: npm install pdfkit qrcode",
    );
  }
};

// ─────────────────────────────────────────────────────────────
// Secciones del PDF
// ─────────────────────────────────────────────────────────────

/** Marca de agua diagonal en toda la página */
const drawWatermark = (doc) => {
  doc.save();
  doc
    .fontSize(60)
    .fillColor("#f0f0f0")
    .rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] })
    .text(
      "COPIA PARA EL CLIENTE",
      doc.page.width / 2 - 200,
      doc.page.height / 2 - 50,
      {
        width: 400,
        align: "center",
      },
    )
    .rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] });
  doc.restore();
};

/** Encabezado con logo, título y línea separadora */
const drawHeader = (doc) => {
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#1e3c72")
    .text("NOTARÍA DIGITAL", 50, 50);

  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#666")
    .text("Documento con valor legal — Copia para el cliente", 50, 75);

  doc
    .strokeColor("#ccc")
    .lineWidth(1)
    .moveTo(50, 95)
    .lineTo(doc.page.width - 50, 95)
    .stroke();
};

/** Cuadro CSV + QR en la esquina superior derecha */
const drawVerificationBox = (doc, csv, qrDataURL) => {
  if (!qrDataURL) return;

  const x = doc.page.width - 200;

  doc.roundedRect(x, 50, 150, 120, 5).fillAndStroke("#f8f9fa", "#dee2e6");

  doc
    .fontSize(9)
    .fillColor("#495057")
    .text("CÓDIGO DE VERIFICACIÓN", x + 10, 60);
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#1e3c72")
    .text(csv, x + 10, 75);
  doc
    .fontSize(8)
    .fillColor("#666")
    .text("Guarde este código para verificar", x + 10, 100);
  doc.image(qrDataURL, x + 10, 115, { width: 80, height: 80 });
};

/**
 * Dibuja un bloque con título y lista de campos clave-valor.
 * Devuelve la nueva posición Y.
 */
const drawSection = (doc, title, fields, y) => {
  doc.fontSize(11).font("Helvetica-Bold").fillColor("#333").text(title, 50, y);
  y += 20;

  fields.forEach(({ label, value }) => {
    doc
      .font("Helvetica-Bold")
      .fillColor("#555")
      .text(`${label}`, 50, y, { continued: true });
    doc
      .font("Helvetica")
      .fillColor("#333")
      .text(` ${value || "No especificado"}`, { continued: false });
    y += 20;
  });

  return y + 10;
};

/** Hash SHA-256 en fuente monospace */
const drawHashSection = (doc, hash, y) => {
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#333")
    .text("HASH DE INTEGRIDAD (SHA-256)", 50, y);
  y += 20;

  doc
    .font("Courier")
    .fontSize(9)
    .fillColor("#1e3c72")
    .text(hash, 50, y, { width: doc.page.width - 100, align: "left" });

  return y + 40;
};

/** Historial de acciones con formato de lista cronológica */
const drawHistorial = (doc, historial, y) => {
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#333")
    .text("HISTORIAL DE ACCIONES", 50, y);
  y += 20;

  if (!historial?.length) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#999")
      .text("No hay historial disponible", 50, y);
    return y + 20;
  }

  historial.forEach((item) => {
    if (y > 750) {
      doc.addPage();
      y = 50;
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1e3c72")
      .text(item.accion, 50, y);
    y += 15;

    if (item.fecha) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#666")
        .text(fmtDateTime(item.fecha), 70, y);
      y += 15;
    }

    if (item.detalles) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#333")
        .text(item.detalles, 70, y);
      y += 15;
    }

    doc
      .font("Helvetica-Oblique")
      .fontSize(8)
      .fillColor("#999")
      .text(`Por: ${item.usuario?.nombre || "Sistema"}`, 70, y);

    y += 25;
  });

  return y;
};

/** Bloque de firmas digitales */
const drawSignatures = (doc, proceeding, y) => {
  y = Math.max(y, 650);
  if (y > 700) {
    doc.addPage();
    y = 50;
  }

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#333")
    .text("FIRMAS DIGITALES", 50, y);
  y += 30;

  const drawSignRow = (label, fecha, notarioNombre) => {
    doc.font("Helvetica").fontSize(10).fillColor("#333").text(label, 50, y);

    if (fecha) {
      doc.font("Helvetica-Bold").fillColor("#1e3c72").text("✓ FIRMADO", 150, y);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#666")
        .text(fmtDateTime(fecha), 220, y);
      y += fecha && notarioNombre ? 20 : 25;

      if (notarioNombre) {
        doc
          .font("Helvetica-Oblique")
          .fontSize(9)
          .fillColor("#555")
          .text(`Notario: ${notarioNombre}`, 150, y);
        y += 25;
      }
    } else {
      doc.font("Helvetica").fillColor("#999").text("Pendiente", 150, y);
      y += 25;
    }
  };

  drawSignRow("Firma del Cliente:", proceeding.fechaFirmaCliente, null);
  drawSignRow(
    "Firma del Notario:",
    proceeding.fechaFirmaNotario,
    proceeding.asignadoA?.nombre,
  );

  return y;
};

/** Pie de página fijo al fondo */
const drawFooter = (doc, csv) => {
  const h = doc.page.height;

  doc
    .strokeColor("#ccc")
    .lineWidth(1)
    .moveTo(50, h - 50)
    .lineTo(doc.page.width - 50, h - 50)
    .stroke();

  doc
    .fontSize(8)
    .fillColor("#999")
    .text(
      "Este documento es una copia para el cliente. El original se encuentra en los archivos de la notaría.",
      50,
      h - 40,
      { width: doc.page.width - 100, align: "center" },
    );

  doc
    .fontSize(7)
    .fillColor("#aaa")
    .text(
      `Generado el: ${fmtDateTime(new Date())}  —  CSV: ${csv}`,
      50,
      h - 25,
      { width: doc.page.width - 100, align: "center" },
    );
};

// ─────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────

const generateClientCopy = async (req, res) => {
  // 1. Cargar trámite
  const proceeding = await Proceeding.findById(req.params.id)
    .populate("cliente", "nombre rut email")
    .populate("tipo", "nombre descripcion")
    .populate("asignadoA", "nombre")
    .populate("historial.usuario", "nombre");

  if (!proceeding) {
    return res
      .status(404)
      .json({ success: false, message: "Trámite no encontrado" });
  }

  if (proceeding.estado !== "completado") {
    return res.status(400).json({
      success: false,
      message: "El trámite debe estar completado para generar la copia",
    });
  }

  // 2. Cargar dependencias
  let PDFDocument, QRCode;
  try {
    ({ PDFDocument, QRCode } = loadDeps());
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }

  // 3. Generar y persistir CSV
  const csv = buildCSV(proceeding);
  proceeding.csv = csv;
  await proceeding.save();

  // 4. Generar QR
  const qrData = JSON.stringify({
    csv,
    id: proceeding._id,
    fecha: proceeding.fechaFirmaNotario,
    hash: proceeding.hashDocumentoFinal?.substring(0, 10),
  });

  let qrDataURL = null;
  try {
    qrDataURL = await QRCode.toDataURL(qrData, { width: 150, margin: 1 });
  } catch {
    /* QR opcional — continúa sin él */
  }

  // 5. Configurar respuesta
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=documento-${proceeding._id.toString().slice(-6)}.pdf`,
  );

  // 6. Construir PDF
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Documento Notarial — ${proceeding.tipo?.nombre || "Trámite"}`,
      Author: "Sistema Notarial",
      Subject: "Copia para el Cliente",
      Keywords: "notaría, documento, firma digital",
      CreationDate: new Date(),
    },
  });

  doc.pipe(res);

  try {
    drawWatermark(doc);
    drawHeader(doc);
    drawVerificationBox(doc, csv, qrDataURL);

    let y = 130;

    // Título
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#1e3c72")
      .text("DOCUMENTO NOTARIAL", 50, y);
    y += 25;

    // Sección: Información del trámite
    y = drawSection(
      doc,
      "INFORMACIÓN DEL TRÁMITE",
      [
        { label: "Tipo de trámite:", value: proceeding.tipo?.nombre },
        { label: "ID del documento:", value: proceeding._id.toString() },
        { label: "Fecha de inicio:", value: fmtDate(proceeding.createdAt) },
        {
          label: "Fecha de firma:",
          value: fmtDate(proceeding.fechaFirmaNotario),
        },
        { label: "Estado:", value: "COMPLETADO" },
      ],
      y,
    );

    // Sección: Datos del cliente
    if (proceeding.cliente) {
      y = drawSection(
        doc,
        "DATOS DEL CLIENTE",
        [
          { label: "Nombre:", value: proceeding.cliente.nombre },
          { label: "RUT:", value: proceeding.cliente.rut },
          { label: "Email:", value: proceeding.cliente.email },
        ],
        y,
      );
    }

    // Sección: Datos del formulario
    const datosEntries = Object.entries(proceeding.datosFormulario || {});
    if (datosEntries.length) {
      y = drawSection(
        doc,
        "DATOS INGRESADOS",
        datosEntries.map(([k, v]) => ({
          label: `${k.replace(/_/g, " ")}:`,
          value: v,
        })),
        y,
      );
    }

    // Hash de integridad
    if (proceeding.hashDocumentoFinal) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      y = drawHashSection(doc, proceeding.hashDocumentoFinal, y);
    }

    // Historial
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    y = drawHistorial(doc, proceeding.historial, y);

    // Firmas
    drawSignatures(doc, proceeding, y);

    // Pie de página
    drawFooter(doc, csv);
  } catch (pdfError) {
    // El PDF puede estar parcialmente escrito — solo se registra el error
    console.error("Error generando contenido del PDF:", pdfError);
  }

  doc.end();
};

// @desc    Obtener trámites completados (listos para entrega)
// @route   GET /api/notario/tramites/completados
const getCompletedProceedings = async (req, res) => {
  try {
    const proceedings = await Proceeding.find({
      estado: "completado",
      $or: [{ asignadoA: req.user._id }, { asignadoA: { $exists: false } }],
    })
      .populate("cliente", "nombre email rut")
      .populate("tipo", "nombre tipoId")
      .sort("-fechaFirmaNotario");

    const proceedingsFormateados = proceedings.map((proc) => {
      const procObj = proc.toObject();
      return {
        _id: procObj._id,
        tipo: procObj.tipo,
        cliente: procObj.cliente,
        fechaFirmaNotario: procObj.fechaFirmaNotario,
        csv: procObj.csv || "Por generar",
        hashDocumentoFinal: procObj.hashDocumentoFinal,
        documentos: procObj.documentos,
      };
    });

    res.json({
      success: true,
      data: proceedingsFormateados,
    });
  } catch (error) {
    console.error("Error en getCompletedProceedings:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPendingSignatures,
  signDocument,
  validateMinuta,
  verifySignature,
  verifyIntegrity,
  getNotaryStats,
  getProceedingById,
  generateClientCopy,
  getCompletedProceedings, // ← NUEVO
};
