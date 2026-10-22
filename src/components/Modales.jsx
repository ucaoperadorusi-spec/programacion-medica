import React, { useState } from 'react';
import { 
  X, History, Download, Search, AlertCircle, Check, LogIn, 
  UserMinus, Clock, ChevronUp, ChevronDown, UserPlus, Plus, 
  SlidersHorizontal, CheckSquare, Square, Lock, Megaphone, Pencil,
  Upload, FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OpcionesTriaje } from '../constants';

// 1. MODAL AUDITORÍA
export function ModalAuditoria() {
  const {
    mostrarModalHistorial,
    setMostrarModalHistorial,
    temaClaro,
    descargarReporteExcelAuditoria,
    busquedaAuditoria,
    setBusquedaAuditoria,
    filtroEtapaAuditoria,
    setFiltroEtapaAuditoria,
    historialFiltradoAuditoria,
    filaExpandidaAuditoria,
    setFilaExpandidaAuditoria
  } = useApp();

  if (!mostrarModalHistorial) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-4xl rounded-3xl p-6 shadow-2xl border flex flex-col max-h-[90vh] ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4 shrink-0">
          <div className="flex items-center space-x-2">
            <History className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-lg font-black tracking-wide">Auditoría y Tiempos de Atenciones</h3>
              <p className="text-xs text-slate-400">Consolidado inteligente de llamados, inasistencias y finalización</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarReporteExcelAuditoria}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shrink-0"
              title="Descargar reporte de auditoría estructurado en Excel"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Excel</span>
            </button>

            <button type="button" onClick={() => setMostrarModalHistorial(false)} className="text-slate-400 hover:text-slate-200 p-1 rounded-xl">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-4 shrink-0">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={busquedaAuditoria}
                onChange={(e) => setBusquedaAuditoria(e.target.value)}
                placeholder="Buscar por paciente o médico..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro 
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-purple-500' 
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-purple-400'
                }`}
              />
              {busquedaAuditoria && (
                <button type="button" onClick={() => setBusquedaAuditoria('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1 w-full md:w-auto">
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'ATENDIDO', label: 'Atendidos' },
                { id: 'EN_CONSULTA', label: 'En Consulta' },
                { id: 'NO_RESPONDIO', label: 'No Respondió' },
                { id: 'INASISTENCIA', label: 'Inasistencias' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroEtapaAuditoria(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    filtroEtapaAuditoria === tab.id
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : temaClaro
                        ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 mb-4 space-y-2">
          {historialFiltradoAuditoria.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-sm font-medium">No se encontraron registros que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historialFiltradoAuditoria.map((item, idx) => {
                const esExpandido = filaExpandidaAuditoria === item.idUnico;
                const esInasistencia = item.estadoFinal === 'INASISTENCIA' || item.estadoFinal === 'DADO_DE_BAJA';
                const objTriaje = OpcionesTriaje.find(t => t.id === item.nivelTriaje);

                return (
                  <div 
                    key={idx} 
                    className={`border rounded-2xl p-3 transition ${
                      esInasistencia
                        ? 'border-rose-500/30 bg-rose-500/5' 
                        : item.estadoFinal === 'ATENDIDO'
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : temaClaro ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-800/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="w-36">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Rango / Horas:</p>
                        <p className={`font-mono text-xs font-bold ${temaClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                          {item.horaInicio} {item.horaInicio !== item.horaFin && `→ ${item.horaFin}`}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono">{item.fechaFormateada}</p>
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm font-black text-cyan-400 uppercase tracking-wide flex flex-wrap items-center gap-2">
                          {item.paciente}
                          {objTriaje && (
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black ${objTriaje.cls}`}>
                              {objTriaje.label}
                            </span>
                          )}
                        </p>
                        <p className={`text-xs font-medium ${temaClaro ? 'text-slate-600' : 'text-slate-300'}`}>Médico: {item.medico}</p>
                        {item.consultorio && (
                          <p className="text-[11px] text-amber-300 font-bold">Lugar: {item.consultorio}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.estadoFinal === 'ATENDIDO' && (
                          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> ATENCIÓN FINALIZADA
                          </span>
                        )}
                        {item.estadoFinal === 'EN_CONSULTA' && (
                          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                            <LogIn className="w-3.5 h-3.5" /> EN CONSULTA
                          </span>
                        )}
                        {item.estadoFinal === 'NO_RESPONDIO' && (
                          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                            <UserMinus className="w-3.5 h-3.5" /> NO RESPONDIO
                          </span>
                        )}
                        {esInasistencia && (
                          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" /> INASISTENCIA DEFINITIVA
                          </span>
                        )}
                        {(item.estadoFinal === 'LLAMADO' || item.estadoFinal === 'RE_LLAMADO') && (
                          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> VOCEO / LLAMADO
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setFilaExpandidaAuditoria(esExpandido ? null : item.idUnico)}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition"
                          title="Ver detalle cronológico de llamadas"
                        >
                          {esExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {esExpandido && (
                      <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-950/60 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider flex items-center gap-1">
                          <History className="w-3 h-3" /> Trazabilidad de Intentos y Eventos ({item.eventos.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.eventos.map((e, eIdx) => {
                            let estadoTexto = (e.estado || '').replace(/_/g, ' ');
                            if (e.estado === 'DADO_DE_BAJA') estadoTexto = 'INASISTENCIA';

                            return (
                              <div key={eIdx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px]">
                                <span className="font-mono text-slate-400 font-bold">{e.horaFormateada}</span>
                                <span className="font-extrabold text-white">→</span>
                                <span className={`font-bold ${
                                  e.estado === 'NO_RESPONDIO' ? 'text-amber-400' :
                                  (e.estado === 'INASISTENCIA' || e.estado === 'DADO_DE_BAJA') ? 'text-rose-400 font-black' :
                                  e.estado === 'EN_CONSULTA' ? 'text-emerald-400' :
                                  e.estado === 'ATENDIDO' ? 'text-cyan-300' : 'text-blue-400'
                                }`}>
                                  {estadoTexto}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            Mostrando {historialFiltradoAuditoria.length} atenciones registradas
          </span>
          <button
            type="button"
            onClick={() => setMostrarModalHistorial(false)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. MODAL COLA DE ESPERA (TRIAJE)
export function ModalColaEspera() {
  const {
    medicoParaCola,
    setMedicoParaCola,
    temaClaro,
    agregarAPilaEspera,
    nivelTriaje,
    setNivelTriaje,
    nombrePaciente,
    setNombrePaciente,
    cargando
  } = useApp();

  if (!medicoParaCola) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            Agregar a Cola de Espera
          </h3>
          <button type="button" onClick={() => setMedicoParaCola(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={agregarAPilaEspera} autoComplete="off" className="space-y-4">
          <div>
            <p className="text-xs text-slate-400 mb-2">
              Médico a cargo: <strong className={temaClaro ? 'text-slate-800' : 'text-white'}>{medicoParaCola.Medico}</strong>
            </p>
            
            <label className="block text-xs font-bold mb-1.5 text-slate-400">Nivel de Prioridad de Emergencia:</label>
            <div className="space-y-1.5 mb-4">
              {OpcionesTriaje.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNivelTriaje(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-black border transition flex items-center justify-between ${t.cls} ${
                    nivelTriaje === t.id ? 'ring-2 ring-white scale-[1.02] shadow-lg' : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <span>{t.label}</span>
                  {nivelTriaje === t.id && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>

            <label className="block text-xs font-bold mb-1.5 text-slate-400">Apellidos y Nombres del Paciente:</label>
            <input
              type="text"
              autoComplete="off"
              value={nombrePaciente}
              onChange={(e) => setNombrePaciente(e.target.value)}
              placeholder="EJ. ANDY SORIANO"
              required
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold uppercase focus:outline-none transition mb-3 ${
                temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMedicoParaCola(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 transition shadow-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {cargando ? 'Guardando...' : 'Agregar a Pila'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. MODAL LLAMADA MANUAL DE PACIENTE
export function ModalLlamadaPaciente() {
  const {
    medicoParaLlamar,
    setMedicoParaLlamar,
    rolUsuario,
    temaClaro,
    confirmarLlamadaPaciente,
    accionPacienteAnterior,
    setAccionPacienteAnterior,
    nivelTriaje,
    setNivelTriaje,
    nombrePaciente,
    setNombrePaciente,
    servicioActivo,
    consultorioTopico,
    setConsultorioTopico,
    cargando
  } = useApp();

  if (!medicoParaLlamar || (rolUsuario !== 'ADMIN' && rolUsuario !== 'MEDICO')) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
            <Clock className="w-5 h-5 text-rose-500 animate-bounce" />
            {servicioActivo === 'EMERGENCIA' ? 'Llamado Manual a Pantalla TV' : 'Llamado a Pantalla TV (Consulta Externa)'}
          </h3>
          <button type="button" onClick={() => setMedicoParaLlamar(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={confirmarLlamadaPaciente} autoComplete="off" className="space-y-4">
          {medicoParaLlamar.pacienteLlamado && (
            <div className="p-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-2">
              <p className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Paciente registrado actualmente en el consultorio:
              </p>
              <p className="text-sm font-black text-white uppercase bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                {medicoParaLlamar.pacienteLlamado}
              </p>
              <p className="text-[11px] text-slate-300 font-semibold">Elija qué acción registrar para este paciente antes de ingresar al nuevo:</p>
              
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/60 transition">
                  <input
                    type="radio"
                    name="accionAnterior"
                    value="FINALIZAR_ATENDIDO"
                    checked={accionPacienteAnterior === 'FINALIZAR_ATENDIDO'}
                    onChange={() => setAccionPacienteAnterior('FINALIZAR_ATENDIDO')}
                    className="accent-emerald-500"
                  />
                  <span className="text-emerald-400">Finalizar atención (Marcar Atendido)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/60 transition">
                  <input
                    type="radio"
                    name="accionAnterior"
                    value="MARCAR_NO_RESPONDIO"
                    checked={accionPacienteAnterior === 'MARCAR_NO_RESPONDIO'}
                    onChange={() => setAccionPacienteAnterior('MARCAR_NO_RESPONDIO')}
                    className="accent-amber-500"
                  />
                  <span className="text-amber-300">Marcar como "No Respondió"</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/60 transition">
                  <input
                    type="radio"
                    name="accionAnterior"
                    value="MARCAR_INASISTENCIA"
                    checked={accionPacienteAnterior === 'MARCAR_INASISTENCIA'}
                    onChange={() => setAccionPacienteAnterior('MARCAR_INASISTENCIA')}
                    className="accent-rose-500"
                  />
                  <span className="text-rose-400">Marcar "Inasistencia Definitiva"</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-400 mb-2">
              Médico a cargo: <strong className={temaClaro ? 'text-slate-800' : 'text-white'}>{medicoParaLlamar.Medico}</strong>
            </p>

            {servicioActivo === 'EMERGENCIA' && (
              <>
                <label className="block text-xs font-bold mb-1.5 text-slate-400">Nivel de Prioridad de Emergencia:</label>
                <div className="space-y-1.5 mb-4">
                  {OpcionesTriaje.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNivelTriaje(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-black border transition flex items-center justify-between ${t.cls} ${
                        nivelTriaje === t.id ? 'ring-2 ring-white scale-[1.02] shadow-lg' : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      <span>{t.label}</span>
                      {nivelTriaje === t.id && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}

            {servicioActivo === 'CONSULTA_EXTERNA' && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs mb-3 text-blue-400 font-bold">
                Área: Consulta Externa (Atención por Cita / Sin Triaje)
              </div>
            )}

            <label className="block text-xs font-bold mb-1.5 text-slate-400">Apellidos y Nombres del Paciente:</label>
            <input
              type="text"
              autoComplete="off"
              value={nombrePaciente}
              onChange={(e) => setNombrePaciente(e.target.value)}
              placeholder="EJ. ANDY SORIANO"
              required
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold uppercase focus:outline-none transition mb-3 ${
                temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
              autoFocus
            />

            {servicioActivo === 'EMERGENCIA' && (
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-400">Consultorio / Tópico:</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={consultorioTopico}
                  onChange={(e) => setConsultorioTopico(e.target.value)}
                  placeholder="EJ. Tópico de Medicina 1"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold focus:outline-none transition ${
                    temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMedicoParaLlamar(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 transition shadow-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              {cargando ? 'Llamando...' : 'Llamar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. MODAL EDITAR NOMBRE DE PACIENTE
export function ModalEditarPaciente() {
  const {
    medicoParaEditarPaciente,
    setMedicoParaEditarPaciente,
    temaClaro,
    guardarEdicionNombrePaciente,
    nuevoNombreEditado,
    setNuevoNombreEditado
  } = useApp();

  if (!medicoParaEditarPaciente) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-amber-500">
            <Pencil className="w-5 h-5 text-amber-500" />
            Corregir Nombre del Paciente
          </h3>
          <button type="button" onClick={() => setMedicoParaEditarPaciente(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={guardarEdicionNombrePaciente} autoComplete="off" className="space-y-4">
          <div>
            <p className="text-xs text-slate-400 mb-2">
              Médico: <strong className={temaClaro ? 'text-slate-800' : 'text-white'}>{medicoParaEditarPaciente.Medico}</strong>
            </p>
            <label className="block text-xs font-bold mb-1.5 text-slate-400">Nombre corregido:</label>
            <input
              type="text"
              autoComplete="off"
              value={nuevoNombreEditado}
              onChange={(e) => setNuevoNombreEditado(e.target.value)}
              required
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold uppercase focus:outline-none transition ${
                temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMedicoParaEditarPaciente(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 transition shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Actualizar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5. MODAL EDITAR PROGRAMACIÓN MÉDICA
export function ModalEdicionRegistro() {
  const {
    medicoParaEditar,
    setMedicoParaEditar,
    temaClaro,
    guardarEdicionRegistro,
    formEdicion,
    setFormEdicion
  } = useApp();

  if (!medicoParaEditar) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-500" />
            Modificar Programación Médica
          </h3>
          <button type="button" onClick={() => setMedicoParaEditar(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={guardarEdicionRegistro} autoComplete="off" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Servicio:</label>
              <select
                value={formEdicion.TipoServicio}
                onChange={(e) => setFormEdicion({ ...formEdicion, TipoServicio: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="CONSULTA_EXTERNA">Consulta Externa</option>
                <option value="EMERGENCIA">Emergencia 24H</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Médico:</label>
              <input
                type="text"
                required
                value={formEdicion.Medico}
                onChange={(e) => setFormEdicion({ ...formEdicion, Medico: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Especialidad / Área:</label>
              <input
                type="text"
                required
                value={formEdicion.Area}
                onChange={(e) => setFormEdicion({ ...formEdicion, Area: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Subactividad / Rol:</label>
              <input
                type="text"
                required
                value={formEdicion.Rol}
                onChange={(e) => setFormEdicion({ ...formEdicion, Rol: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Módulo / Ubicación:</label>
              <input
                type="text"
                required
                value={formEdicion.Modulo}
                onChange={(e) => setFormEdicion({ ...formEdicion, Modulo: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Hora Inicio:</label>
              <input
                type="time"
                required
                value={formEdicion.Hora_Inicio}
                onChange={(e) => setFormEdicion({ ...formEdicion, Hora_Inicio: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Hora Fin:</label>
              <input
                type="time"
                required
                value={formEdicion.Hora_Fin}
                onChange={(e) => setFormEdicion({ ...formEdicion, Hora_Fin: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Fecha:</label>
              <input
                type="date"
                required
                value={formEdicion.Fecha}
                onChange={(e) => setFormEdicion({ ...formEdicion, Fecha: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMedicoParaEditar(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 6. MODAL NUEVO REGISTRO
export function ModalNuevoRegistro() {
  const {
    mostrarModalNuevoRegistro,
    setMostrarModalNuevoRegistro,
    temaClaro,
    guardarNuevoRegistro,
    formNuevo,
    setFormNuevo
  } = useApp();

  if (!mostrarModalNuevoRegistro) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            Agregar Nuevo Registro Médico
          </h3>
          <button type="button" onClick={() => setMostrarModalNuevoRegistro(false)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={guardarNuevoRegistro} autoComplete="off" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Servicio Destino:</label>
              <select
                value={formNuevo.TipoServicio}
                onChange={(e) => setFormNuevo({ ...formNuevo, TipoServicio: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="CONSULTA_EXTERNA">Consulta Externa</option>
                <option value="EMERGENCIA">Emergencia 24H</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Médico:</label>
              <input
                type="text"
                required
                placeholder="Ej. Dr. Carlos Ramírez"
                value={formNuevo.Medico}
                onChange={(e) => setFormNuevo({ ...formNuevo, Medico: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Especialidad / Área:</label>
              <input
                type="text"
                required
                placeholder="Ej. Pediatría"
                value={formNuevo.Area}
                onChange={(e) => setFormNuevo({ ...formNuevo, Area: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Subactividad / Rol:</label>
              <input
                type="text"
                required
                placeholder="Ej. Consulta Médica"
                value={formNuevo.Rol}
                onChange={(e) => setFormNuevo({ ...formNuevo, Rol: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Módulo / Ubicación:</label>
              <input
                type="text"
                required
                placeholder="Ej. Módulo 01"
                value={formNuevo.Modulo}
                onChange={(e) => setFormNuevo({ ...formNuevo, Modulo: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Hora Inicio:</label>
              <input
                type="time"
                required
                value={formNuevo.Hora_Inicio}
                onChange={(e) => setFormNuevo({ ...formNuevo, Hora_Inicio: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Hora Fin:</label>
              <input
                type="time"
                required
                value={formNuevo.Hora_Fin}
                onChange={(e) => setFormNuevo({ ...formNuevo, Hora_Fin: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">Fecha:</label>
              <input
                type="date"
                required
                value={formNuevo.Fecha}
                onChange={(e) => setFormNuevo({ ...formNuevo, Fecha: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                  temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMostrarModalNuevoRegistro(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-lg"
            >
              Agregar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 7. MODAL SELECCIONAR MÓDULOS
export function ModalModulos() {
  const {
    mostrarModalModulos,
    setMostrarModalModulos,
    temaClaro,
    servicioActivo,
    seleccionarTodosLosModulos,
    deseleccionarTodosLosModulos,
    todosLosModulosDisponibles,
    modulosSeleccionados,
    toggleModuloSeleccionado
  } = useApp();

  if (!mostrarModalModulos) return null;

  const esEmerg = servicioActivo === 'EMERGENCIA';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-500" />
              Seleccionar Módulos
            </h3>
            <p className={`text-xs font-semibold mt-0.5 ${esEmerg ? 'text-rose-400' : 'text-cyan-400'}`}>
              Canal activo: {esEmerg ? 'Emergencia 24H (Tópicos / Triaje)' : 'Consulta Externa (Consultorios)'}
            </p>
          </div>
          <button type="button" onClick={() => setMostrarModalModulos(false)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={seleccionarTodosLosModulos}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
              esEmerg 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30' 
                : 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30 hover:bg-cyan-500/30'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Seleccionar Todos
          </button>
          <button
            type="button"
            onClick={deseleccionarTodosLosModulos}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition"
          >
            <Square className="w-4 h-4" /> Deseleccionar Todos
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-6">
          {todosLosModulosDisponibles.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No hay módulos registrados en este momento para {esEmerg ? 'Emergencia' : 'Consulta Externa'}.
            </p>
          ) : (
            todosLosModulosDisponibles.map((mod, i) => {
              const seleccionado = modulosSeleccionados.includes(mod);
              return (
                <label
                  key={i}
                  onClick={() => toggleModuloSeleccionado(mod)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    seleccionado
                      ? esEmerg
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                        : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                      : temaClaro ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold">{mod}</span>
                  {seleccionado ? (
                    <CheckSquare className={`w-4 h-4 ${esEmerg ? 'text-rose-400' : 'text-cyan-400'}`} />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </label>
              );
            })
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setMostrarModalModulos(false)}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-lg ${
              esEmerg ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

// 8. MODAL INICIO DE SESIÓN
export function ModalLogin() {
  const {
    mostrarModalLogin,
    setMostrarModalLogin,
    temaClaro,
    handleLogin,
    emailInput,
    setEmailInput,
    passwordInput,
    setPasswordInput,
    errorPin,
    loginConGoogle
  } = useApp();

  if (!mostrarModalLogin) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-500" />
            Acceso al Sistema
          </h3>
          <button type="button" onClick={() => setMostrarModalLogin(false)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-400">Correo Electrónico:</label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="usuario@hospital.gob.pe"
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                errorPin
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-slate-400">Contraseña:</label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                errorPin
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          {errorPin && (
            <p className="text-red-400 text-xs text-center font-semibold">Credenciales no válidas o cuenta inactiva.</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMostrarModalLogin(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg"
            >
              Ingresar
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
          <button
            type="button"
            onClick={loginConGoogle}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
}

// 9. MODAL COMUNICADO
export function ModalComunicado() {
  const {
    mostrarModalComunicado,
    setMostrarModalComunicado,
    temaClaro,
    guardarComunicado,
    nuevoComunicado,
    setNuevoComunicado
  } = useApp();

  if (!mostrarModalComunicado) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-cyan-500" />
            Editar Comunicado
          </h3>
          <button type="button" onClick={() => setMostrarModalComunicado(false)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={guardarComunicado} autoComplete="off" className="space-y-4">
          <div>
            <textarea
              rows={4}
              value={nuevoComunicado}
              onChange={(e) => setNuevoComunicado(e.target.value)}
              placeholder="Escriba el anuncio oficial..."
              className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition ${
                temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMostrarModalComunicado(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg"
            >
              Guardar Mensaje
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 10. MODAL REEMPLAZO MÉDICO
export function ModalReemplazo() {
  const {
    medicoParaReemplazo,
    setMedicoParaReemplazo,
    temaClaro,
    aplicarReemplazo,
    nombreReemplazo,
    setNombreReemplazo
  } = useApp();

  if (!medicoParaReemplazo) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-500" />
            Asignar Reemplazo Médico
          </h3>
          <button type="button" onClick={() => setMedicoParaReemplazo(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={aplicarReemplazo} autoComplete="off" className="space-y-4">
          <div>
            <p className="text-xs text-slate-400 mb-2">
              Médico Titular: <strong className={temaClaro ? 'text-slate-800' : 'text-white'}>{medicoParaReemplazo.Medico}</strong>
            </p>
            <input
              type="text"
              value={nombreReemplazo}
              onChange={(e) => setNombreReemplazo(e.target.value)}
              placeholder="Ej. Dr. Juan Pérez"
              required
              className={`w-full px-4 py-2 rounded-xl border text-xs focus:outline-none transition ${
                temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMedicoParaReemplazo(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 transition shadow-lg"
            >
              Confirmar Reemplazo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 11. MODAL DUPLICADOS EXCEL
export function ModalDuplicados() {
  const {
    mostrarModalReporte,
    setMostrarModalReporte,
    temaClaro,
    duplicadosOmitidos
  } = useApp();

  if (!mostrarModalReporte) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-2xl rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-500 animate-bounce" />
            <h3 className="text-lg font-bold">Reporte de Carga: Duplicados Omitidos</h3>
          </div>
          <button type="button" onClick={() => setMostrarModalReporte(false)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${temaClaro ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                <th className="py-2 px-3">Fila Excel</th>
                <th className="py-2 px-3">Médico</th>
                <th className="py-2 px-3">Especialidad / Rol</th>
                <th className="py-2 px-3">Horario</th>
              </tr>
            </thead>
            <tbody>
              {duplicadosOmitidos.map((dup, i) => (
                <tr key={i} className={`border-b ${
                  temaClaro ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800/50 hover:bg-slate-800/40'
                }`}>
                  <td className="py-2 px-3 font-mono font-bold text-amber-500">#{dup.filaExcel}</td>
                  <td className="py-2 px-3 font-bold">{dup.medico}</td>
                  <td className="py-2 px-3">{dup.area} - {dup.rol}</td>
                  <td className="py-2 px-3 font-mono">{dup.horario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setMostrarModalReporte(false)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// 12. MODAL SUBIR CITAS EXCEL (CONSULTA EXTERNA)
export function ModalSubirCitas() {
  const {
    medicoParaSubirCitas,
    setMedicoParaSubirCitas,
    mostrarModalSubirCitas,
    setMostrarModalSubirCitas,
    handleSubirCitasExcel,
    cargando,
    temaClaro
  } = useApp();

  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState('');

  if (!mostrarModalSubirCitas || !medicoParaSubirCitas) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoSeleccionado(file);
      setNombreArchivo(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!archivoSeleccionado) return;
    handleSubirCitasExcel(archivoSeleccionado, medicoParaSubirCitas);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-700/60 mb-4">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold">Cargar Pacientes Citados (Excel)</h3>
          </div>
          <button 
            type="button" 
            onClick={() => {
              setMostrarModalSubirCitas(false);
              setMedicoParaSubirCitas(null);
            }} 
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
          <p className="text-cyan-400 font-bold mb-1">
            Médico Asignado: {medicoParaSubirCitas.Medico}
          </p>
          <p className="text-slate-400">
            {medicoParaSubirCitas.Area} — {medicoParaSubirCitas.Modulo || 'Módulo General'}
          </p>
        </div>

        <div className={`p-4 rounded-2xl border mb-4 text-xs ${
          temaClaro ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <p className="font-bold text-slate-300 mb-2">Columnas esperadas en el archivo Excel:</p>
          <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
            <div className="p-2 bg-slate-800/80 rounded-lg text-cyan-400 border border-slate-700">Orden</div>
            <div className="p-2 bg-slate-800/80 rounded-lg text-cyan-400 border border-slate-700">H.A. (Hora)</div>
            <div className="p-2 bg-slate-800/80 rounded-lg text-cyan-400 border border-slate-700">Apellidos y Nombres</div>
            <div className="p-2 bg-slate-800/80 rounded-lg text-cyan-400 border border-slate-700">Situacion</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
            archivoSeleccionado ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-500'
          }`}>
            <input
              type="file"
              id="excelCitasInput"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="excelCitasInput" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
              <Upload className="w-8 h-8 text-cyan-400 animate-bounce" />
              <span className="text-xs font-bold text-cyan-400">
                {nombreArchivo ? nombreArchivo : "Haz clic para seleccionar el archivo Excel (.xlsx, .xls)"}
              </span>
              <span className="text-[11px] text-slate-400">
                {nombreArchivo ? "Archivo listo para procesar" : "Padrón descargado de citas médicas"}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setMostrarModalSubirCitas(false);
                setMedicoParaSubirCitas(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!archivoSeleccionado || cargando}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{cargando ? "Procesando Citas..." : "Cargar Pacientes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 13. MODAL REGISTRO MANUAL DE PACIENTE (CONSULTA EXTERNA)
export function ModalCitaManual() {
  const {
    medicoParaCitaManual,
    setMedicoParaCitaManual,
    mostrarModalCitaManual,
    setMostrarModalCitaManual,
    agregarCitaManual,
    cargando,
    temaClaro
  } = useApp();

  const [nombreManual, setNombreManual] = useState('');
  const [horaManual, setHoraManual] = useState('');

  if (!mostrarModalCitaManual || !medicoParaCitaManual) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombreManual.trim()) return;
    agregarCitaManual(medicoParaCitaManual, nombreManual, horaManual);
    setNombreManual('');
    setHoraManual('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
        temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-700/60 mb-4">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold">+ Registrar Paciente Adicional</h3>
          </div>
          <button 
            type="button" 
            onClick={() => {
              setMostrarModalCitaManual(false);
              setMedicoParaCitaManual(null);
            }} 
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
          <p className="text-blue-400 font-bold">
            Médico: {medicoParaCitaManual.Medico}
          </p>
          <p className="text-slate-400">
            {medicoParaCitaManual.Modulo || 'Módulo General'} — {medicoParaCitaManual.consultorioTopico || 'Consultorio Asignado'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-400">Apellidos y Nombres del Paciente:</label>
            <input
              type="text"
              required
              autoFocus
              value={nombreManual}
              onChange={(e) => setNombreManual(e.target.value)}
              placeholder="EJ. MENDOZA CASTILLO CARLOS"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold uppercase focus:outline-none transition ${
                temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-slate-400">Hora de Atención (H.A.):</label>
            <input
              type="text"
              value={horaManual}
              onChange={(e) => setHoraManual(e.target.value)}
              placeholder="Ej. 10:30 (Opcional, tomará hora actual)"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setMostrarModalCitaManual(false);
                setMedicoParaCitaManual(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{cargando ? "Guardando..." : "Agregar a la Lista"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
