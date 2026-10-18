import React from 'react';
import { 
  MapPin, Stethoscope, Bell, Pencil, LogIn, RefreshCw, 
  UserMinus, UserCheck, Check, ListPlus, UserPlus, AlertCircle, 
  UserX, Trash2, Timer, CheckCircle, Activity
} from 'lucide-react';

export default function ProgramacionMedica({
  agrupadoPorModulo,
  servicioActivo,
  temaClaro,
  rolUsuario,
  modoTvActivo,
  soloTurnoActual,
  modulosSeleccionados,
  ESTADOS_MEDICO,
  estaEnTurno,
  estaEnUltimaHora,
  calcularEstadoInteligente,
  obtenerTiempoTranscurrido,
  obtenerInasistentesPendientes,
  listaEspera,
  puedeModificarEstados,
  cambiarEstadoMedico,
  ingresarAConsultaConPaciente,
  volverALlamarPaciente,
  marcarPacienteNoRespondio,
  marcarPacienteAtendido,
  marcarInasistenciaDefinitiva,
  llamarSiguienteCola,
  setMedicoParaEditarPaciente,
  setNuevoNombreEditado,
  setMedicoParaCola,
  setNombrePaciente,
  setMedicoParaLlamar,
  setConsultorioTopico,
  setMedicoParaReemplazo,
  restaurarTitular,
  abrirModalEditar,
  eliminarRegistroIndividual,
  horaActual
}) {

  const obtenerMinutos = (horaStr) => {
    if (!horaStr || horaStr === "--:--") return 0;
    const [h, m] = horaStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const obtenerEstadoHorario = (h) => {
    if (!h || !h.inicio || !h.fin || h.inicio === "--:--" || h.fin === "--:--") return 'PASADO';
    
    const ahora = (horaActual || new Date()).getHours() * 60 + (horaActual || new Date()).getMinutes();
    const inicioMin = obtenerMinutos(h.inicio);
    const finMin = obtenerMinutos(h.fin);

    if (inicioMin <= finMin) {
      if (ahora >= finMin) return 'PASADO';
      if (ahora >= inicioMin && ahora < finMin) return 'ACTIVO';
      return 'FUTURO';
    } else {
      if (ahora >= inicioMin || ahora < finMin) return 'ACTIVO';
      return 'PASADO';
    }
  };

  if (Object.keys(agrupadoPorModulo).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
        <Activity className="w-16 h-16 text-slate-400 animate-bounce" />
        <p className="text-xl font-medium text-center">
          {modulosSeleccionados.length === 0
            ? "No hay ningún módulo seleccionado."
            : soloTurnoActual 
              ? `No hay personal médico atendiendo en este momento.` 
              : `No hay programación cargada para este servicio.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {Object.keys(agrupadoPorModulo).map((moduloNombre, idx) => (
        <div key={idx} className={`border rounded-3xl p-6 shadow-xl transition-colors ${
          temaClaro ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          
          <div className={`flex items-center justify-between pb-4 border-b mb-6 ${
            temaClaro ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-2xl border ${
                servicioActivo === 'EMERGENCIA'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500'
              }`}>
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-xl font-black tracking-wide uppercase ${
                  servicioActivo === 'EMERGENCIA' ? 'text-rose-500' : 'text-cyan-500'
                }`}>
                  {moduloNombre}
                </h2>
                <p className={`text-xs ${temaClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                  {servicioActivo === 'EMERGENCIA' ? 'Área de Emergencia y Guardias' : 'Área de Atención y Consultorios Asignados'}
                </p>
              </div>
            </div>

            <span className={`text-xs border px-3 py-1 rounded-full font-mono font-bold ${
              temaClaro ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {agrupadoPorModulo[moduloNombre].length} Médico(s) Asignado(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...agrupadoPorModulo[moduloNombre]]
              .sort((a, b) => {
                const estadoA = calcularEstadoInteligente(a, estaEnTurno(a.horarios));
                const estadoB = calcularEstadoInteligente(b, estaEnTurno(b.horarios));

                const prioridad = {
                  "LLAMANDO": 1,
                  "CONSULTA": 2,
                  "PAUSA": 3,
                  "AUSENTE": 4,
                  "PROGRAMADO": 5,
                  "CULMINADO": 6
                };

                return (prioridad[estadoA] || 10) - (prioridad[estadoB] || 10);
              })
              .map((med, mIdx) => {
                const estaActivoAhora = estaEnTurno(med.horarios);
                const enUltimaHora = estaEnUltimaHora(med.horarios);
                const estadoClave = calcularEstadoInteligente(med, estaActivoAhora);
                const configEstado = ESTADOS_MEDICO[estadoClave] || ESTADOS_MEDICO.PROGRAMADO;
                const IconoEstado = configEstado.icon;
                const tiempoTranscurrido = obtenerTiempoTranscurrido(med.horaIngresoConsulta || med.estadoUltimoCambio);

                const inasistentesPendientes = obtenerInasistentesPendientes(med.Medico);
                
                const enCola = listaEspera
                  .filter(p => p.medico === med.Medico)
                  .sort((a,b) => new Date(a.fechaIso).getTime() - new Date(b.fechaIso).getTime());

                const isLlamando = estadoClave === "LLAMANDO";
                const animacionLlamado = isLlamando 
                  ? (temaClaro ? "scale-105 z-20 shadow-2xl ring-4 ring-cyan-500 shadow-cyan-500/40" : "scale-105 z-20 shadow-2xl ring-4 ring-rose-500 shadow-rose-500/50") 
                  : "hover:-translate-y-1 z-0";

                return (
                  <div 
                    key={mIdx} 
                    className={`p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 w-full relative ${animacionLlamado} ${configEstado.cardColor}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-full">
                          <h3 className={`font-bold text-lg leading-snug ${temaClaro ? 'text-slate-900' : 'text-white'}`}>
                            {med.Medico}
                          </h3>
                          {med.esReemplazo && med.medicoTitular && (
                            <p className="text-[11px] text-purple-400 italic font-medium">
                              Reemplaza a: {med.medicoTitular}
                            </p>
                          )}

                          {servicioActivo === 'EMERGENCIA' && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                                <Stethoscope className="w-3.5 h-3.5" />
                                <span>{med.consultorioTopico || "Sin consultorio asignado"}</span>
                              </p>
                              {puedeModificarEstados && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMedicoParaLlamar(med);
                                    setNombrePaciente(med.pacienteLlamado || '');
                                    setConsultorioTopico(med.consultorioTopico || '');
                                  }}
                                  className="text-[10px] text-amber-400 hover:underline font-bold"
                                >
                                  (Cambiar Ubicación)
                                </button>
                              )}
                            </div>
                          )}

                          {/* BLOQUE VOCEO LLAMANDO */}
                          {servicioActivo === 'EMERGENCIA' && isLlamando && med.pacienteLlamado && (
                            <div className={`mt-3 p-3.5 rounded-2xl border-2 flex flex-col gap-3 shadow-xl w-full ${
                              temaClaro 
                                ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-rose-500/10' 
                                : 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-rose-950/50'
                            } animate-pulse`}>
                              <div className="flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                  <Bell className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
                                  <div className="overflow-hidden w-full">
                                    <p className={`text-[10px] uppercase font-bold tracking-wider ${temaClaro ? 'text-rose-700' : 'text-rose-400'}`}>
                                      Llamando a:
                                    </p>
                                    <p className={`text-base font-black leading-tight tracking-wide break-words ${temaClaro ? 'text-rose-950' : 'text-white'}`}>
                                      {med.pacienteLlamado}
                                    </p>
                                    {med.consultorioTopico && (
                                      <p className="text-[11px] font-bold text-amber-300 mt-0.5">
                                        Ubicación: {med.consultorioTopico}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {puedeModificarEstados && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMedicoParaEditarPaciente(med);
                                      setNuevoNombreEditado(med.pacienteLlamado);
                                    }}
                                    className="p-2 bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-xl transition shrink-0"
                                    title="Corregir error de digitación"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {puedeModificarEstados && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-rose-500/30 w-full">
                                  <button
                                    type="button"
                                    onClick={() => ingresarAConsultaConPaciente(med)}
                                    className="flex-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1 shrink-0"
                                    title="El paciente ingresó físicamente al consultorio"
                                  >
                                    <LogIn className="w-3.5 h-3.5" />
                                    <span>Ingresó a Consulta</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => volverALlamarPaciente(med)}
                                    className="px-2 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1 shrink-0"
                                    title="Re-llamar en TV"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Re-llamar</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => marcarPacienteNoRespondio(med)}
                                    className="px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1 shrink-0"
                                    title="No acudió al llamado"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                    <span>No Respondió</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* BLOQUE EN CONSULTA */}
                          {servicioActivo === 'EMERGENCIA' && estadoClave === "CONSULTA" && med.pacienteLlamado && (
                            <div className={`mt-3 p-3.5 rounded-2xl border-2 flex flex-col gap-3 shadow-xl w-full ${
                              temaClaro 
                                ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-emerald-500/10' 
                                : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-emerald-950/50'
                            }`}>
                              <div className="flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                  <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                                  <div className="overflow-hidden w-full">
                                    <p className={`text-[10px] uppercase font-bold tracking-wider ${temaClaro ? 'text-emerald-800' : 'text-emerald-400'}`}>
                                      Atendiendo en Consulta a:
                                    </p>
                                    <p className={`text-base font-black leading-tight tracking-wide break-words ${temaClaro ? 'text-emerald-950' : 'text-white'}`}>
                                      {med.pacienteLlamado}
                                    </p>
                                    {med.consultorioTopico && (
                                      <p className="text-[11px] font-bold text-cyan-300 mt-0.5">
                                        Consultorio: {med.consultorioTopico}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {puedeModificarEstados && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMedicoParaEditarPaciente(med);
                                      setNuevoNombreEditado(med.pacienteLlamado);
                                    }}
                                    className="p-2 bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-xl transition shrink-0"
                                    title="Corregir error de digitación"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {puedeModificarEstados && (
                                <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/30 w-full">
                                  <button
                                    type="button"
                                    onClick={() => marcarPacienteAtendido(med)}
                                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-lg flex items-center justify-center gap-2"
                                    title="Culminar consulta y liberar consultorio"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Finalizar Consulta (Atendido)</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* COLA Y BOTONES EMERGENCIA */}
                          {servicioActivo === 'EMERGENCIA' && puedeModificarEstados && (
                            <div className="mt-4 pt-3 border-t border-slate-700/40 space-y-2">
                              {enCola.length > 0 && !modoTvActivo && (
                                <div className={`p-2.5 rounded-xl border mb-3 text-[11px] ${
                                  temaClaro ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-900/70 border-slate-700/60'
                                }`}>
                                  <p className={`font-bold mb-1.5 flex items-center gap-1 ${temaClaro ? 'text-cyan-800' : 'text-slate-400'}`}>
                                    <ListPlus className="w-3.5 h-3.5" />
                                    En Cola de Espera ({enCola.length}):
                                  </p>
                                  <p className={`font-black truncate ${temaClaro ? 'text-cyan-600' : 'text-cyan-400'}`}>1. {enCola[0].paciente}</p>
                                  {enCola.length > 1 && <p className={`truncate mt-0.5 ${temaClaro ? 'text-slate-500' : 'text-slate-500'}`}>2. {enCola[1].paciente}</p>}
                                </div>
                              )}

                              {rolUsuario === 'ADMISION' && (
                                <button
                                  type="button"
                                  onClick={() => { setMedicoParaCola(med); setNombrePaciente(''); }}
                                  className="w-full py-2 px-3 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  <span>Agregar a Lista de Espera</span>
                                </button>
                              )}

                              {rolUsuario !== 'ADMISION' && !med.pacienteLlamado && estadoClave !== 'LLAMANDO' && (
                                <div className="flex gap-2">
                                  {enCola.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => llamarSiguienteCola(med, enCola[0])}
                                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-1"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      <span>Siguiente ({enCola.length})</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMedicoParaLlamar(med);
                                      setNombrePaciente('');
                                      setConsultorioTopico(med.consultorioTopico || '');
                                    }}
                                    className={`${enCola.length > 0 ? 'flex-1 bg-slate-700 hover:bg-slate-600 text-white' : 'w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/40'} py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1`}
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    <span>{enCola.length > 0 ? 'Manual' : 'Ingresar / Llamar Manual'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* BOTÓN INGRESAR / LLAMAR CONSULTA EXTERNA */}
                          {servicioActivo === 'CONSULTA_EXTERNA' && puedeModificarEstados && !med.pacienteLlamado && estadoClave !== 'LLAMANDO' && (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setMedicoParaLlamar(med);
                                  setNombrePaciente('');
                                  setConsultorioTopico('');
                                }}
                                className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                              >
                                <UserPlus className="w-4 h-4" />
                                <span>Ingresar / Llamar Paciente</span>
                              </button>
                            </div>
                          )}

                          {/* LISTA DE PACIENTES INASISTENTES PENDIENTES */}
                          {puedeModificarEstados && !modoTvActivo && inasistentesPendientes.length > 0 && (
                            <div className="mt-3 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1.5">
                              <p className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                No Respondieron Hoy ({inasistentesPendientes.length}):
                              </p>
                              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                {inasistentesPendientes.map((ina, idxIna) => {
                                  const superoLimiteIntentos = ina.intentosNoRespondio >= 3;

                                  return (
                                    <div key={idxIna} className="flex items-center justify-between bg-slate-900/70 p-2 rounded-lg border border-slate-700/60 text-[11px]">
                                      <div className="truncate mr-2">
                                        <span className="font-bold text-white truncate block">{ina.paciente}</span>
                                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                                          <span>{ina.ultimaHora}</span>
                                          <span className={`px-1 rounded font-bold ${
                                            superoLimiteIntentos ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300'
                                          }`}>
                                            {ina.intentosNoRespondio}/3 llamados
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        {rolUsuario !== 'ADMISION' && (
                                          <button
                                            onClick={() => volverALlamarPaciente(med, ina.paciente)}
                                            className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                                            title="Volver a llamar al paciente"
                                          >
                                            <RefreshCw className="w-2.5 h-2.5" />
                                            Llamar
                                          </button>
                                        )}

                                        {superoLimiteIntentos && (
                                          <button
                                            onClick={() => marcarInasistenciaDefinitiva(med, ina.paciente)}
                                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                                            title="Marcar inasistencia definitiva"
                                          >
                                            <UserX className="w-2.5 h-2.5" />
                                            Marcar Inasistencia
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {med.esReemplazo && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-700 border border-purple-400">
                              REEMPLAZO
                            </span>
                          )}

                          {rolUsuario === 'ADMIN' && (
                            <>
                              <button
                                onClick={() => abrirModalEditar(med)}
                                className={`p-1.5 rounded-lg border transition ${
                                  temaClaro 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                                    : 'bg-blue-900/30 text-blue-300 border-blue-700/50 hover:bg-blue-800/40'
                                }`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => eliminarRegistroIndividual(med)}
                                className="p-1.5 rounded-lg border bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          temaClaro 
                            ? 'bg-slate-100 text-slate-700 border border-slate-200/80' 
                            : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                        }`}>
                          {med.Area || "General"}
                        </span>
                        {med.Rol && (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            temaClaro 
                              ? 'bg-slate-100 text-slate-700 border border-slate-200/80' 
                              : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                          }`}>
                            {med.Rol}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mb-4">
                        <p className={`text-[11px] font-semibold uppercase tracking-wider ${temaClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                          Horarios / Turnos:
                        </p>
                        <div className="flex flex-wrap gap-2 items-center">
                          {med.horarios && med.horarios.map((h, hIdx) => {
                            const estadoTurno = obtenerEstadoHorario(h);

                            if (estadoTurno === 'ACTIVO') {
                              return (
                                <div key={hIdx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-black shadow-md ${
                                  servicioActivo === 'EMERGENCIA'
                                    ? 'bg-rose-600 text-white shadow-rose-600/30'
                                    : temaClaro 
                                      ? 'bg-cyan-600 text-white shadow-cyan-600/20' 
                                      : 'bg-cyan-400 text-slate-950 shadow-cyan-400/30'
                                }`}>
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                  <span>{h.inicio} - {h.fin}</span>
                                </div>
                              );
                            }

                            if (estadoTurno === 'FUTURO') {
                              return (
                                <div key={hIdx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold transition ${
                                  temaClaro 
                                    ? 'bg-blue-50 text-blue-900 border-blue-300' 
                                    : 'bg-slate-800 text-blue-300 border-blue-500/40'
                                }`}>
                                  <span className={`text-[10px] uppercase font-sans font-extrabold px-1 rounded ${
                                    temaClaro ? 'bg-blue-200 text-blue-900' : 'bg-blue-900/80 text-blue-200'
                                  }`}>
                                    Próximo
                                  </span>
                                  <span>{h.inicio} - {h.fin}</span>
                                </div>
                              );
                            }

                            if (estadoTurno === 'PASADO') {
                              return (
                                <div key={hIdx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-semibold transition ${
                                  temaClaro 
                                    ? 'bg-slate-100 text-slate-600 border-slate-300' 
                                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                                }`}>
                                  <span className={`text-[10px] uppercase font-sans font-bold px-1 rounded ${
                                    temaClaro ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300'
                                  }`}>
                                    Culminado
                                  </span>
                                  <span className="line-through decoration-slate-400">{h.inicio} - {h.fin}</span>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      </div>
                    </div>

                    <div className={`mt-2 p-3 rounded-xl border space-y-3 ${
                      temaClaro 
                        ? 'bg-slate-50 border-slate-200/80 shadow-inner' 
                        : 'bg-slate-950/70 border-slate-800/80 shadow-inner'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${configEstado.badge}`}>
                          <IconoEstado className="w-3.5 h-3.5" />
                          <span>{configEstado.label}</span>
                          {tiempoTranscurrido && (
                            <span className="ml-1 pl-1.5 border-l border-current/30 text-[10px] opacity-90 font-mono font-black flex items-center gap-0.5">
                              <Timer className="w-3 h-3 inline" />
                              {tiempoTranscurrido}
                            </span>
                          )}
                        </div>

                        {puedeModificarEstados && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setMedicoParaReemplazo(med)}
                              className={`p-1.5 rounded-lg border transition ${
                                temaClaro ? 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50' : 'bg-purple-900/40 text-purple-300 border-purple-700/50 hover:bg-purple-800/50'
                              }`}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                            {med.esReemplazo && (
                              <button
                                onClick={() => restaurarTitular(med)}
                                className={`p-1.5 rounded-lg border transition ${
                                  temaClaro ? 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50' : 'bg-amber-900/40 text-amber-300 border-amber-700/50 hover:bg-amber-800/50'
                                }`}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {puedeModificarEstados && (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 pt-1">
                          {Object.keys(ESTADOS_MEDICO).map((key) => {
                            const activeState = estadoClave === key;
                            const configBtn = ESTADOS_MEDICO[key];

                            let esBloqueado = false;
                            if (estaActivoAhora && key === "PROGRAMADO") {
                              esBloqueado = true;
                            } else if (estaActivoAhora && key === "CULMINADO" && !enUltimaHora) {
                              esBloqueado = true;
                            }

                            if (servicioActivo === 'EMERGENCIA' && rolUsuario === 'ADMISION') {
                              if (key !== 'CONSULTA' && key !== 'PAUSA' && key !== 'AUSENTE') {
                                esBloqueado = true;
                              }
                            }

                            return (
                              <button
                                key={key}
                                disabled={esBloqueado}
                                onClick={() => cambiarEstadoMedico(med.ids, key, estaActivoAhora, enUltimaHora, med)}
                                className={`py-1.5 text-[10px] font-black tracking-wider rounded-lg border transition shadow-sm ${
                                  esBloqueado
                                    ? 'bg-slate-200/50 text-slate-400 border-slate-300/50 opacity-40 cursor-not-allowed dark:bg-slate-800/20 dark:text-slate-600 dark:border-slate-800/50'
                                    : activeState
                                      ? configBtn.buttonActive
                                      : temaClaro
                                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-700 hover:text-white'
                                }`}
                              >
                                {key.slice(0, 4)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}