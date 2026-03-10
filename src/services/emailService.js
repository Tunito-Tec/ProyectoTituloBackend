// Servicio de correos (simulado)
const sendEmail = async (to, subject, template, data) => {
  console.log("📧 Enviando email:");
  console.log(`   Para: ${to}`);
  console.log(`   Asunto: ${subject}`);
  console.log(`   Template: ${template}`);

  // Aquí iría la integración con nodemailer, SendGrid, etc.
  return true;
};

// Templates específicos
const sendNotificationEmail = async (user, notification) => {
  const subject = `Nueva notificación: ${notification.titulo}`;
  await sendEmail(user.email, subject, "notification", {
    nombre: user.nombre,
    mensaje: notification.mensaje,
  });
};

const sendDocumentSignedEmail = async (user, proceeding) => {
  const subject = "Documento firmado exitosamente";
  await sendEmail(user.email, subject, "document-signed", {
    nombre: user.nombre,
    tramiteId: proceeding._id,
    tipoTramite: proceeding.tipo,
  });
};

module.exports = {
  sendEmail,
  sendNotificationEmail,
  sendDocumentSignedEmail,
};
