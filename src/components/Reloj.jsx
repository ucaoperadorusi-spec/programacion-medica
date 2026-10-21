import React, { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';

const Reloj = ({ temaClaro }) => {
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setHora(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`flex items-center space-x-2 border px-4 py-2 rounded-xl transition-colors ${
      temaClaro ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
    }`}>
      <Clock className="w-5 h-5 text-cyan-500 animate-pulse" />
      <span className={`text-xl font-mono font-bold ${temaClaro ? 'text-slate-800' : 'text-cyan-300'}`}>
        {hora.toLocaleDateString('es-ES')} | {hora.toLocaleTimeString('es-ES', { hour12: false })}
      </span>
    </div>
  );
};

export default memo(Reloj);
