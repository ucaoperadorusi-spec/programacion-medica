import React, { memo } from 'react';
import { Megaphone } from 'lucide-react';

const ComunicadoMarquee = ({ comunicado, temaClaro }) => {
  if (!comunicado) return null;

  return (
    <div className={`py-2 px-4 border-b flex items-center gap-3 overflow-hidden ${
      temaClaro ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-blue-950/40 border-blue-900/50 text-blue-300'
    }`}>
      <Megaphone className="w-4 h-4 shrink-0 text-cyan-500 animate-bounce relative z-10" />
      <div className="overflow-hidden w-full whitespace-nowrap relative flex items-center">
        <p className="animacion-marquee text-xs font-semibold tracking-wide uppercase">
          {comunicado}
        </p>
      </div>
    </div>
  );
};

export default memo(ComunicadoMarquee);
