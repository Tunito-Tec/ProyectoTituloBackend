// Validador de RUT chileno
const validateRUT = (rut) => {
  if (!rut) return false;

  // Limpiar RUT
  rut = rut.toString().replace(/\./g, "").replace(/-/g, "").toUpperCase();

  if (rut.length < 2) return false;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);

  // Calcular dígito verificador
  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplo;
    if (multiplo < 7) {
      multiplo++;
    } else {
      multiplo = 2;
    }
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalculado =
    dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

  return dvCalculado === dv;
};

// Validador de email
const validateEmail = (email) => {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
};

// Validador de teléfono chileno
const validatePhone = (phone) => {
  const re = /^(\+?56)?[ -]?(9|2)[ -]?[0-9]{4}[ -]?[0-9]{4}$/;
  return re.test(phone);
};

// Sanitizar strings
const sanitizeString = (str) => {
  if (!str) return "";
  return str.trim().replace(/[<>]/g, "");
};

module.exports = {
  validateRUT,
  validateEmail,
  validatePhone,
  sanitizeString,
};
