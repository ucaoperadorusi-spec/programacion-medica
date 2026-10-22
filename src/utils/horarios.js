export const obtenerFechaHoyLocal = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export const obtenerMinutos = (horaStr) => {
  if (!horaStr || horaStr === "--:--") return 0;
  const [h, m] = horaStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const obtenerEstadoHorario = (h, horaActual = new Date()) => {
  if (!h || !h.inicio || !h.fin || h.inicio === "--:--" || h.fin === "--:--") return 'PASADO';
  
  const ahora = horaActual.getHours() * 60 + horaActual.getMinutes();
  const inicioMin = obtenerMinutos(h.inicio);
  const finMin = obtenerMinutos(h.fin);

  if (inicioMin <= finMin) {
    if (ahora >= finMin) return 'PASADO';
    if (ahora >= inicioMin && ahora < finMin) return 'ACTIVO';
    return 'FUTURO';
  } else {
    // Turno cruza medianoche (guardia nocturna)
    if (ahora >= inicioMin || ahora < finMin) return 'ACTIVO';
    return 'PASADO';
  }
};

export const esRangoActivo = (h, horaActual) => obtenerEstadoHorario(h, horaActual) === 'ACTIVO';

export const estaEnTurno = (horariosArray, horaActual) => {
  if (!horariosArray || horariosArray.length === 0) return false;
  return horariosArray.some(h => esRangoActivo(h, horaActual));
};

export const estaEnUltimaHora = (horariosArray, horaActual = new Date()) => {
  if (!horariosArray || horariosArray.length === 0) return false;
  const ahora = horaActual.getHours() * 60 + horaActual.getMinutes();

  return horariosArray.some(h => {
    if (obtenerEstadoHorario(h, horaActual) === 'ACTIVO') {
      const finMin = obtenerMinutos(h.fin);
      let diferencia = finMin - ahora;
      if (diferencia < 0) diferencia += 1440;
      return diferencia <= 60;
    }
    return false;
  });
};

// Verifica si faltan hasta 60 minutos (1 hora) antes del inicio del turno programado
export const estaEnVentanaAnticipada = (horariosArray, horaActual = new Date()) => {
  if (!horariosArray || horariosArray.length === 0) return false;
  const ahora = horaActual.getHours() * 60 + horaActual.getMinutes();

  return horariosArray.some(h => {
    if (!h.inicio || h.inicio === "--:--" || !h.fin || h.fin === "--:--") return false;
    const inicioMin = obtenerMinutos(h.inicio);
    let difInicio = inicioMin - ahora;
    if (difInicio < 0) difInicio += 1440;
    return difInicio <= 60 && difInicio > 0;
  });
};

export const calcularEstadoInteligente = (med, estaActivoAhora, horaActual = new Date()) => {
  if (!med.horarios || med.horarios.length === 0) return med.estado || "CONSULTA";

  const todosPasados = med.horarios.every(h => obtenerEstadoHorario(h, horaActual) === 'PASADO');
  if (todosPasados) return "CULMINADO";

  // Si faltan hasta 60 minutos para iniciar y activó CONSULTA:
  const enAnticipada = estaEnVentanaAnticipada(med.horarios, horaActual);
  if (enAnticipada && med.estado === 'CONSULTA') {
    return "CONSULTA";
  }

  if (estaActivoAhora) {
    if (med.estado === "CULMINADO" && estaEnUltimaHora(med.horarios, horaActual)) {
      return "CULMINADO";
    }
    if (med.estado === "PROGRAMADO") return "CONSULTA";
    return med.estado || "CONSULTA";
  }

  const tieneTurnoFuturo = med.horarios.some(h => obtenerEstadoHorario(h, horaActual) === 'FUTURO');
  if (tieneTurnoFuturo) {
    return "PROGRAMADO";
  }

  return med.estado || "CONSULTA";
};

export const obtenerTiempoTranscurrido = (fechaIso, horaActual = new Date()) => {
  if (!fechaIso) return null;
  const inicio = new Date(fechaIso).getTime();
  const ahora = horaActual.getTime();
  const diffMs = ahora - inicio;
  if (isNaN(diffMs) || diffMs < 0) return '0 min';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return '< 1 min';
  if (diffMins < 60) return `${diffMins} min`;

  const horas = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${horas}h ${mins}m`;
};

export const esEspecialidadEmergencia = (area = '', rol = '') => {
  const texto = `${area} ${rol}`.toLowerCase();
  const palabrasClave = ['emergencia', 'triaje', 'shock', 'trauma', 'observacion', 'observación', 'guardia', 'urgencia', 'urgencias'];
  return palabrasClave.some(p => texto.includes(p));
};
