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
  ModalDuplicados
} from './components/Modales';

export default function App() {
  const { 
    vistaActiva, 
    temaClaro, 
    comunicado, 
    mainScrollRef 
  } = useApp();

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
    </div>
  );
}
