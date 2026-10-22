import React from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import ComunicadoMarquee from './components/ComunicadoMarquee';
import ProgramacionMedica from './components/ProgramacionMedica';
import GestionUsuarios from './components/GestionUsuarios';
import {
  ModalAuditoria,
  ModalColaEspera,
  ModalLlamadaPaciente,
  ModalEditarPaciente,
  ModalEdicionRegistro,
  ModalNuevoRegistro,
  ModalModulos,
  ModalLogin,
  ModalComunicado,
  ModalReemplazo,
  ModalDuplicados,
  ModalSubirCitas,
  ModalCitaManual
} from './components/Modales';

export default function App() {
  const { 
    vistaActiva, 
    temaClaro, 
    comunicado, 
    mainScrollRef 
  } = useApp();

  // Medidas de seguridad y protección de datos médicos / personales
  React.useEffect(() => {
    const handleContextMenu = (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      
      // Bloquear copia fuera de inputs
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !isInput) {
        e.preventDefault();
      }
      // Bloquear imprimir (Ctrl+P)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
      }
      // Bloquear guardar página (Ctrl+S)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
      }
      // Bloquear código fuente (Ctrl+U)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
      }
      // Mitigación básica de captura de pantalla
      if (e.key === 'PrintScreen') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('');
        }
      }
    };

    const handleCopy = (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  return (
    <div className={`min-h-screen flex flex-col font-sans overflow-hidden h-screen relative transition-colors duration-300 ${
      temaClaro ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-white'
    }`}>
      {/* Barra de Navegación y Cabecera Principal */}
      <Header />

      {/* Cintillo de Comunicado Oficial */}
      {vistaActiva === 'MONITOR' && (
        <ComunicadoMarquee comunicado={comunicado} temaClaro={temaClaro} />
      )}

      {/* Área de Visualización Principal */}
      <main ref={mainScrollRef} className="flex-1 p-6 md:p-8 overflow-y-auto relative">
        {vistaActiva === 'USUARIOS' ? (
          <GestionUsuarios />
        ) : (
          <ProgramacionMedica />
        )}
      </main>

      {/* Conjunto de Diálogos Modales Modulares */}
      <ModalAuditoria />
      <ModalColaEspera />
      <ModalLlamadaPaciente />
      <ModalEditarPaciente />
      <ModalEdicionRegistro />
      <ModalNuevoRegistro />
      <ModalModulos />
      <ModalLogin />
      <ModalComunicado />
      <ModalReemplazo />
      <ModalDuplicados />
      <ModalSubirCitas />
      <ModalCitaManual />
    </div>
  );
}
