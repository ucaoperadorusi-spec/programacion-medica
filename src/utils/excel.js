import { OpcionesTriaje } from '../constants';
import { obtenerFechaHoyLocal } from './horarios';

export const getFieldValue = (row, fieldKeys) => {
  const keyFound = Object.keys(row).find(k => 
    fieldKeys.some(fk => k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === fk.toLowerCase())
  );
  return keyFound ? row[keyFound] : null;
};

// Escapar texto para evitar inyecciones XSS en el HTML exportado a Excel
export const escapeHtml = (unsafeStr) => {
  if (unsafeStr === null || unsafeStr === undefined) return '';
  return String(unsafeStr)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const generarReporteExcelAuditoria = (historialFiltrado, servicioActivo) => {
  if (!historialFiltrado || historialFiltrado.length === 0) {
    return false;
  }

  const totalRegistros = historialFiltrado.length;
  const totalAtendidos = historialFiltrado.filter(h => h.estadoFinal === 'ATENDIDO').length;
  const totalEnConsulta = historialFiltrado.filter(h => h.estadoFinal === 'EN_CONSULTA').length;
  const totalNoRespondio = historialFiltrado.filter(h => h.estadoFinal === 'NO_RESPONDIO').length;
  const totalInasistencias = historialFiltrado.filter(h => h.estadoFinal === 'INASISTENCIA' || h.estadoFinal === 'DADO_DE_BAJA').length;

  const fechaHoy = obtenerFechaHoyLocal();
  const horaImpresion = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        .title-banner { background-color: #1E3A8A; color: #FFFFFF; font-size: 15pt; font-weight: bold; text-align: center; height: 40px; }
        .sub-banner { background-color: #2563EB; color: #FFFFFF; font-size: 9.5pt; text-align: center; height: 22px; }
        .kpi-title { background-color: #E2E8F0; color: #475569; font-size: 8.5pt; font-weight: bold; text-align: center; border: 1px solid #CBD5E1; }
        .kpi-num-total { background-color: #F1F5F9; color: #0F172A; font-size: 13pt; font-weight: bold; text-align: center; border: 1px solid #CBD5E1; height: 30px; }
        .kpi-num-atendido { background-color: #DCFCE7; color: #166534; font-size: 13pt; font-weight: bold; text-align: center; border: 1px solid #CBD5E1; height: 30px; }
        .kpi-num-consulta { background-color: #DBEAFE; color: #1E40AF; font-size: 13pt; font-weight: bold; text-align: center; border: 1px solid #CBD5E1; height: 30px; }
        .kpi-num-inasistente { background-color: #FEF3C7; color: #92400E; font-size: 13pt; font-weight: bold; text-align: center; border: 1px solid #CBD5E1; height: 30px; }
        .kpi-num-baja { background-color: #FEE2E2; color: #991B1B; font-size: 13pt; font-weight: bold; text-align: center; border: 1px solid #CBD5E1; height: 30px; }
        .th-header { background-color: #0F172A; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: center; border: 1px solid #334155; height: 32px; }
        .td-cell { font-size: 9.5pt; border: 1px solid #CBD5E1; vertical-align: middle; padding: 6px; }
        .td-center { text-align: center; }
        .td-left { text-align: left; }
        .td-trazabilidad { text-align: left; font-family: monospace; font-size: 9pt; }
        .row-even { background-color: #F8FAFC; }
        .row-odd { background-color: #FFFFFF; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="10" class="title-banner">HOSPITAL II PUCALLPA — REPORTE DE AUDITORÍA Y TRAZABILIDAD DE ATENCIONES</td></tr>
        <tr><td colspan="10" class="sub-banner">Fecha de Emisión: ${fechaHoy} ${horaImpresion} | Servicio: ${escapeHtml(servicioActivo)}</td></tr>
        <tr><td colspan="10"></td></tr>
        <tr>
          <td colspan="2" class="kpi-title">TOTAL PACIENTES</td>
          <td colspan="2" class="kpi-title">ATENCIONES FINALIZADAS</td>
          <td colspan="2" class="kpi-title">EN CONSULTA</td>
          <td colspan="2" class="kpi-title">NO RESPONDIO</td>
          <td colspan="2" class="kpi-title">INASISTENCIAS DEFINITIVAS</td>
        </tr>
        <tr>
          <td colspan="2" class="kpi-num-total">${totalRegistros}</td>
          <td colspan="2" class="kpi-num-atendido">${totalAtendidos}</td>
          <td colspan="2" class="kpi-num-consulta">${totalEnConsulta}</td>
          <td colspan="2" class="kpi-num-inasistente">${totalNoRespondio}</td>
          <td colspan="2" class="kpi-num-baja">${totalInasistencias}</td>
        </tr>
        <tr><td colspan="10"></td></tr>
        <thead>
          <tr>
            <th class="th-header">N°</th>
            <th class="th-header">Fecha</th>
            <th class="th-header">Hora Inicio</th>
            <th class="th-header">Hora Fin</th>
            <th class="th-header">Paciente</th>
            <th class="th-header">Médico</th>
            <th class="th-header">Servicio</th>
            <th class="th-header">Prioridad Triaje</th>
            <th class="th-header">Estado Final</th>
            <th class="th-header">Trazabilidad Paso a Paso</th>
          </tr>
        </thead>
        <tbody>
  `;

  historialFiltrado.forEach((item, index) => {
    const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
    let estadoLimpio = (item.estadoFinal || '').replace(/_/g, ' ');
    if (item.estadoFinal === 'DADO_DE_BAJA') estadoLimpio = 'INASISTENCIA';

    const objTriaje = OpcionesTriaje.find(t => t.id === item.nivelTriaje);
    const textoTriajeExcel = objTriaje ? objTriaje.label : 'S/N';

    const trazabilidadTexto = item.eventos
      .map((e, idx) => `Paso ${idx + 1}: ${escapeHtml(e.horaFormateada)} ➜ [${escapeHtml((e.estado || '').replace(/_/g, ' '))}]`)
      .join('<br/>');

    excelTemplate += `
      <tr class="${rowClass}">
        <td class="td-cell td-center">${index + 1}</td>
        <td class="td-cell td-center">${escapeHtml(item.fechaFormateada)}</td>
        <td class="td-cell td-center">${escapeHtml(item.horaInicio)}</td>
        <td class="td-cell td-center">${escapeHtml(item.horaFin)}</td>
        <td class="td-cell td-left" style="font-weight: bold;">${escapeHtml(item.paciente)}</td>
        <td class="td-cell td-left">${escapeHtml(item.medico)}</td>
        <td class="td-cell td-center">${escapeHtml(item.servicio || 'GENERAL')}</td>
        <td class="td-cell td-center" style="font-weight: bold;">${escapeHtml(textoTriajeExcel)}</td>
        <td class="td-cell td-center">${escapeHtml(estadoLimpio)}</td>
        <td class="td-cell td-trazabilidad">${trazabilidadTexto}</td>
      </tr>
    `;
  });

  excelTemplate += `</tbody></table></body></html>`;

  const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Reporte_Auditoria_Atenciones_${fechaHoy}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};
