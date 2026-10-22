import { UserCheck, Clock, Activity, AlertCircle, CheckSquare } from 'lucide-react';

export const OpcionesTriaje = [
  { id: 'ROJO', label: 'PRIORIDAD I - RIESGO VIDA/RESUCITAC', corto: 'PRIORIDAD I', cls: 'bg-red-600 text-white' },
  { id: 'NARANJA', label: 'PRIORIDAD II - EMERGENCIA', corto: 'PRIORIDAD II', cls: 'bg-orange-500 text-white' },
  { id: 'AMARILLO', label: 'PRIORIDAD III - URGENCIA MAYOR', corto: 'PRIORIDAD III', cls: 'bg-yellow-400 text-black' },
  { id: 'VERDE', label: 'PRIORIDAD IV - URGENCIA MENOR', corto: 'PRIORIDAD IV', cls: 'bg-emerald-600 text-white' },
  { id: 'AZUL', label: 'PRIORIDAD V - CONSULTA', corto: 'PRIORIDAD V', cls: 'bg-blue-600 text-white' }
];

export const NombresPrioridadOficial = {
  ROJO: { label: 'PRIORIDAD I - RIESGO VIDA/RESUCITAC', cls: 'bg-red-600 text-white font-black' },
  NARANJA: { label: 'PRIORIDAD II - EMERGENCIA', cls: 'bg-orange-500 text-white font-black' },
  AMARILLO: { label: 'PRIORIDAD III - URGENCIA MAYOR', cls: 'bg-yellow-400 text-black font-black' },
  VERDE: { label: 'PRIORIDAD IV - URGENCIA MENOR', cls: 'bg-emerald-600 text-white font-black' },
  AZUL: { label: 'PRIORIDAD V - CONSULTA', cls: 'bg-blue-600 text-white font-black' }
};

export const pesoPrioridadMap = {
  ROJO: 1,
  NARANJA: 2,
  AMARILLO: 3,
  VERDE: 4,
  AZUL: 5
};

export const getEstadosMedico = (temaClaro) => ({
  CONSULTA: { 
    label: "En Consulta", 
    badge: temaClaro 
      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40" 
      : "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-300", 
    cardColor: temaClaro 
      ? "bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30" 
      : "bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950 border-2 border-emerald-500/70 shadow-2xl shadow-emerald-950/60 ring-1 ring-emerald-500/30",
    buttonActive: temaClaro 
      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400" 
      : "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/40 ring-1 ring-emerald-300 font-black",
    icon: UserCheck 
  },
  PROGRAMADO: {
    label: "Próximo Turno",
    badge: temaClaro 
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold shadow-sm" 
      : "bg-gradient-to-r from-blue-500 to-indigo-500 text-slate-950 font-black shadow-md shadow-blue-500/20",
    cardColor: temaClaro 
      ? "bg-white border border-slate-300 shadow-sm hover:border-blue-400 transition" 
      : "bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 border border-slate-800 shadow-lg hover:border-slate-700 transition",
    buttonActive: temaClaro 
      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 ring-1 ring-blue-400" 
      : "bg-blue-500 text-slate-950 border-blue-400 shadow-md shadow-blue-500/30 ring-1 ring-blue-300",
    icon: Clock
  },
  PAUSA: { 
    label: "En Pausa", 
    badge: temaClaro 
      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold shadow-md shadow-amber-500/30" 
      : "bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-400/40", 
    cardColor: temaClaro 
      ? "bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-2 border-amber-400 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/30" 
      : "bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 border-2 border-amber-500/70 shadow-2xl shadow-amber-950/60 ring-1 ring-amber-500/30",
    buttonActive: temaClaro 
      ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30 ring-1 ring-amber-300" 
      : "bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/40 ring-1 ring-amber-200 font-black",
    icon: Activity 
  },
  AUSENTE: { 
    label: "Ausente", 
    badge: temaClaro 
      ? "bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold shadow-md shadow-rose-600/30" 
      : "bg-gradient-to-r from-rose-500 to-red-500 text-white font-black shadow-lg shadow-rose-500/40", 
    cardColor: temaClaro 
      ? "bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 border-2 border-rose-400 shadow-xl shadow-rose-500/10 ring-1 ring-rose-400/30" 
      : "bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-950 border-2 border-rose-500/70 shadow-2xl shadow-rose-950/60 ring-1 ring-rose-500/30",
    buttonActive: temaClaro 
      ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30 ring-1 ring-rose-400" 
      : "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 ring-1 ring-rose-300 font-black",
    icon: AlertCircle 
  },
  LLAMANDO: { 
    label: "¡Llamando Paciente!", 
    badge: temaClaro 
      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black shadow-xl shadow-cyan-500/40 animate-pulse ring-2 ring-cyan-300" 
      : "bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-300 text-slate-950 font-black shadow-xl shadow-cyan-400/50 animate-bounce ring-2 ring-cyan-200", 
    cardColor: temaClaro 
      ? "bg-gradient-to-br from-cyan-100/90 via-white to-blue-50 border-2 border-cyan-500 shadow-[0_0_35px_rgba(6,182,212,0.4)] ring-4 ring-cyan-400/40" 
      : "bg-gradient-to-br from-cyan-950/90 via-slate-900 to-blue-950/90 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.45)] ring-4 ring-cyan-400/50",
    buttonActive: temaClaro 
      ? "bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400" 
      : "bg-cyan-400 text-slate-950 border-cyan-300 shadow-md shadow-cyan-400/40 ring-1 ring-cyan-200 font-black",
    icon: Clock 
  },
  CULMINADO: {
    label: "Turno Culminado",
    badge: temaClaro ? "bg-slate-500 text-white font-bold" : "bg-slate-700 text-slate-300 font-bold",
    cardColor: temaClaro ? "bg-slate-100/80 border border-slate-300 opacity-60" : "bg-slate-900/40 border border-slate-800/80 opacity-50",
    buttonActive: temaClaro ? "bg-slate-600 text-white border-slate-600 shadow-sm" : "bg-slate-700 text-slate-200 border-slate-600 shadow-sm",
    icon: CheckSquare
  }
});
