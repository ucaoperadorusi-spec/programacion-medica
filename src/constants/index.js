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
    badge: temaClaro ? "bg-emerald-600 text-white font-extrabold shadow-sm" : "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20", 
    cardColor: temaClaro ? "bg-white border border-emerald-400 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20" : "bg-slate-900/90 border border-emerald-500/50 shadow-xl shadow-emerald-950/50 ring-1 ring-emerald-500/20",
    buttonActive: temaClaro ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-1 ring-emerald-400" : "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30 ring-1 ring-emerald-300",
    icon: UserCheck 
  },
  PROGRAMADO: {
    label: "Próximo Turno",
    badge: temaClaro ? "bg-blue-600 text-white font-extrabold shadow-sm" : "bg-blue-500 text-slate-950 font-black shadow-md shadow-blue-500/20",
    cardColor: temaClaro ? "bg-white border border-slate-300 shadow-sm" : "bg-slate-900/90 border border-slate-800 shadow-md",
    buttonActive: temaClaro ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 ring-1 ring-blue-400" : "bg-blue-500 text-slate-950 border-blue-400 shadow-md shadow-blue-500/30 ring-1 ring-blue-300",
    icon: Clock
  },
  PAUSA: { 
    label: "En Pausa", 
    badge: temaClaro ? "bg-amber-500 text-white font-extrabold shadow-sm" : "bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20", 
    cardColor: temaClaro ? "bg-white border border-amber-400 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20" : "bg-slate-900/90 border border-amber-500/50 shadow-xl shadow-amber-950/50 ring-1 ring-amber-500/20",
    buttonActive: temaClaro ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 ring-1 ring-amber-300" : "bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/30 ring-1 ring-amber-200",
    icon: Activity 
  },
  AUSENTE: { 
    label: "Ausente", 
    badge: temaClaro ? "bg-rose-600 text-white font-extrabold shadow-sm" : "bg-rose-500 text-white font-black shadow-md shadow-rose-500/20", 
    cardColor: temaClaro ? "bg-white border border-rose-400 shadow-lg shadow-rose-500/5 ring-1 ring-rose-500/20" : "bg-slate-900/90 border border-rose-500/50 shadow-xl shadow-rose-950/50 ring-1 ring-rose-500/20",
    buttonActive: temaClaro ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 ring-1 ring-rose-400" : "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30 ring-1 ring-rose-300",
    icon: AlertCircle 
  },
  LLAMANDO: { 
    label: "Llamando...", 
    badge: temaClaro ? "bg-cyan-600 text-white font-black shadow-md animate-pulse" : "bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-400/40 animate-pulse", 
    cardColor: temaClaro ? "bg-cyan-50/80 border-2 border-cyan-400 shadow-xl ring-2 ring-cyan-400/20" : "bg-slate-900/95 border-2 border-cyan-400/80 shadow-2xl ring-2 ring-cyan-400/30",
    buttonActive: temaClaro ? "bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20 ring-1 ring-cyan-400" : "bg-cyan-400 text-slate-950 border-cyan-300 shadow-md shadow-cyan-400/30 ring-1 ring-cyan-200",
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
