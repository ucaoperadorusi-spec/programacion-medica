import React from 'react';
import { 
  Building2, 
  Siren, 
  Users, 
  History, 
  Filter, 
  SlidersHorizontal, 
  Sun, 
  Moon, 
  Tv, 
  Play, 
  Pause, 
  Upload, 
  Plus, 
  Edit3, 
  Trash2, 
  Unlock, 
  Lock, 
  CheckCircle, 
  Shield,
  Share2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Reloj from './Reloj';

export default function Header() {
  const {
    servicioActivo,
    setServicioActivo,
    vistaActiva,
    setVistaActiva,
    rolUsuario,
    temaClaro,
    setTemaClaro,
    modoTvActivo,
    setModoTvActivo,
    setIndiceRotacionTv,
    mainScrollRef,
    soloTurnoActual,
    setSoloTurnoActual,
    modulosSeleccionados,
    todosLosModulosDisponibles,
    setMostrarModalModulos,
    setMostrarModalHistorial,
    medicoLlamandoEnVivo,
    moduloActualTv,
    cargando,
    handleFileUpload,
    setFormNuevo,
    setMostrarModalNuevoRegistro,
    comunicado,
    setNuevoComunicado,
    setMostrarModalComunicado,
    programacion,
    limpiarBaseDatos,
    copiarEnlaceTv,
    handleLogout,
    setMostrarModalLogin,
    puedeModificarEstados
  } = useApp();

  return (
    <header className={`px-6 py-4 flex flex-wrap justify-between items-center gap-4 shadow-xl z-30 border-b transition-colors ${
      temaClaro ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Logo y Nombre de Hospital */}
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-2xl shadow-lg transition-colors ${
          servicioActivo === 'EMERGENCIA' 
            ? 'bg-rose-600 shadow-rose-600/30 animate-pulse' 
            : 'bg-blue-600 shadow-blue-500/20'
        }`}>
          {servicioActivo === 'EMERGENCIA' ? <Siren className="w-8 h-8 text-white" /> : <Building2 className="w-8 h-8 text-white" />}
        </div>
        <div>
          <h1 className={`text-2xl font-black tracking-wide ${
            servicioActivo === 'EMERGENCIA'
              ? 'bg-gradient-to-r from-rose-500 to-amber-400 bg-clip-text text-transparent'
              : temaClaro ? 'text-blue-900' : 'bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent'
          }`}>
            H. II PUCALLPA / {servicioActivo === 'EMERGENCIA' ? 'EMERGENCIA ' : 'CONSULTA EXTERNA'}
          </h1>
          <p className={`text-xs font-medium ${temaClaro ? 'text-slate-500' : 'text-slate-400'}`}>
            {modoTvActivo && moduloActualTv 
              ? `CANAL TV: ${servicioActivo === 'EMERGENCIA' ? 'Emergencia' : 'Consulta'} ➜ ${moduloActualTv} ${medicoLlamandoEnVivo ? '🔔 (INTERRUPCIÓN POR VOZ)' : ''}` 
              : `Módulos ${servicioActivo === 'EMERGENCIA' ? 'Emergencia' : 'Consulta'}: ${modulosSeleccionados.length} de ${todosLosModulosDisponibles.length} activo(s)`}
          </p>
        </div>
      </div>

      {/* Selector de Vistas / Pestañas Principales */}
      <div className={`flex p-1 rounded-2xl border transition ${
        temaClaro ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/80 border-slate-700'
      }`}>
        {rolUsuario !== 'ADMISION' && (
          <button
            type="button"
            onClick={() => { setVistaActiva('MONITOR'); setServicioActivo('CONSULTA_EXTERNA'); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              vistaActiva === 'MONITOR' && servicioActivo === 'CONSULTA_EXTERNA'
                ? 'bg-blue-600 text-white shadow-lg'
                : temaClaro ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Consulta Externa</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => { setVistaActiva('MONITOR'); setServicioActivo('EMERGENCIA'); }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            vistaActiva === 'MONITOR' && servicioActivo === 'EMERGENCIA'
              ? 'bg-rose-600 text-white shadow-lg'
              : temaClaro ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Siren className="w-4 h-4 text-rose-400" />
          <span>Emergencia</span>
        </button>

        {rolUsuario === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setVistaActiva(vistaActiva === 'USUARIOS' ? 'MONITOR' : 'USUARIOS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              vistaActiva === 'USUARIOS'
                ? 'bg-purple-600 text-white shadow-lg'
                : temaClaro ? 'text-purple-700 hover:text-purple-900' : 'text-purple-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestión Usuarios</span>
          </button>
        )}
      </div>

      {/* Barra de Acciones y Controles Rápidos */}
      <div className="flex flex-wrap items-center gap-3">
        {puedeModificarEstados && (
          <button
            type="button"
            onClick={() => setMostrarModalHistorial(true)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              temaClaro 
                ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100' 
                : 'bg-purple-900/30 text-purple-300 border-purple-700/50 hover:bg-purple-800/50'
            }`}
            title="Ver auditoría y tiempos de atención"
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>Auditoría</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setSoloTurnoActual(!soloTurnoActual)}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
            soloTurnoActual
              ? 'bg-emerald-500/20 text-emerald-700 border-emerald-400'
              : temaClaro ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>{soloTurnoActual ? "Filtrado: Turno Act" : "Vista: Todo"}</span>
        </button>

        <button
          type="button"
          onClick={() => setMostrarModalModulos(true)}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
            temaClaro ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
          <span>Sector ({modulosSeleccionados.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTemaClaro(!temaClaro)}
          className={`p-2.5 rounded-xl border transition flex items-center gap-2 text-xs font-bold ${
            temaClaro 
              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Alternar Modo Claro / Oscuro"
        >
          {temaClaro ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        <button
          type="button"
          onClick={() => {
            if (modulosSeleccionados.length === 0) {
              alert(`Seleccione al menos un módulo de ${servicioActivo === 'EMERGENCIA' ? 'Emergencia' : 'Consulta Externa'} para activar el Modo TV.`);
              return;
            }
            setModoTvActivo(!modoTvActivo);
            setIndiceRotacionTv(0);
            if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
          }}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
            modoTvActivo 
              ? servicioActivo === 'EMERGENCIA'
                ? 'bg-rose-500/20 text-rose-500 border-rose-400 animate-pulse'
                : 'bg-cyan-500/20 text-cyan-600 border-cyan-400 animate-pulse' 
              : temaClaro ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title={`Activar rotación TV independiente para ${servicioActivo === 'EMERGENCIA' ? 'Emergencia 24H' : 'Consulta Externa'}`}
        >
          <Tv className={`w-4 h-4 ${modoTvActivo ? (servicioActivo === 'EMERGENCIA' ? 'text-rose-500' : 'text-cyan-500') : 'text-cyan-500'}`} />
          <span>{modoTvActivo ? `TV ${servicioActivo === 'EMERGENCIA' ? 'Emergencia' : 'Consulta'}` : "Modo TV"}</span>
          {modoTvActivo ? <Pause className="w-3 h-3 text-cyan-500" /> : <Play className="w-3 h-3 text-slate-400" />}
        </button>

        {/* Botón Copiar Enlace Directo para Smart TV */}
        <button
          type="button"
          onClick={copiarEnlaceTv}
          className={`p-2 rounded-xl border text-xs font-bold transition ${
            temaClaro ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title={`Copiar enlace directo Smart TV para ${servicioActivo === 'EMERGENCIA' ? 'Emergencia' : 'Consulta Externa'}`}
        >
          <Share2 className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Reloj Aislado */}
        <Reloj temaClaro={temaClaro} />

        {/* Panel de Usuario y Sesión */}
        {rolUsuario ? (
          <div className={`flex items-center space-x-2 p-1.5 rounded-2xl border ${
            temaClaro ? 'bg-slate-100 border-blue-300' : 'bg-slate-800/60 border-blue-500/30'
          }`}>
            <span className={`text-xs font-bold px-2 flex items-center gap-1 ${
              rolUsuario === 'ADMIN' ? 'text-emerald-500' : rolUsuario === 'ADMISION' ? 'text-cyan-400 font-extrabold' : rolUsuario === 'MEDICO' ? 'text-purple-400 font-extrabold' : 'text-amber-400'
            }`}>
              {rolUsuario === 'ADMIN' ? <CheckCircle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              {rolUsuario === 'ADMIN' ? 'Admin' : rolUsuario === 'ADMISION' ? 'Admisión' : rolUsuario === 'MEDICO' ? 'Médico' : 'Operador'}
            </span>

            {(rolUsuario === 'ADMIN' || rolUsuario === 'OPERADOR') && (
              <label className={`flex items-center space-x-2 ${cargando ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-500'} text-white px-3 py-2 rounded-xl cursor-pointer text-xs font-semibold transition shadow-lg`}>
                <Upload className="w-4 h-4" />
                <span>{cargando ? "Cargando Excel..." : "Subir Excel"}</span>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={cargando} className="hidden" />
              </label>
            )}

            {rolUsuario === 'ADMIN' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFormNuevo({
                      Medico: '', Area: '', Rol: '', Modulo: '', Hora_Inicio: '', Hora_Fin: '', Fecha: new Date().toISOString().split('T')[0], TipoServicio: servicioActivo
                    });
                    setMostrarModalNuevoRegistro(true);
                  }}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Registro</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setNuevoComunicado(comunicado); setMostrarModalComunicado(true); }}
                  className={`p-2 border rounded-xl transition ${
                    temaClaro ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50' : 'bg-slate-700 hover:bg-slate-600 text-cyan-300 border-slate-600'
                  }`}
                  title="Editar Comunicado Oficial"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {programacion.length > 0 && (
                  <button 
                    type="button"
                    onClick={limpiarBaseDatos} 
                    disabled={cargando}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-xl transition"
                    title="Limpiar Toda la Programación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`p-2 rounded-xl transition border ${
                temaClaro ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
              title="Cerrar Sesión"
            >
              <Unlock className="w-4 h-4 text-emerald-500" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMostrarModalLogin(true)}
            className={`p-2.5 border rounded-xl transition ${
              temaClaro ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 border-slate-700/50'
            }`}
            title="Iniciar Sesión"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
