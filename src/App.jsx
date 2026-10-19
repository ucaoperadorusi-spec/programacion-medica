import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, onSnapshot, doc, getDoc, getDocs, writeBatch, setDoc, addDoc, updateDoc, query, where 
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { 
  Upload, Clock, Activity, Building2, Trash2, Filter, Unlock, Lock, X, 
  CheckCircle, Megaphone, Edit3, Tv, Play, Pause, UserCheck, 
  UserPlus, Sun, Moon, CheckSquare, 
  Square, SlidersHorizontal, Shield, Pencil, Plus, Siren,
  History, UserMinus, AlertCircle, Check, Search, ChevronDown, ChevronUp,
  Download, Users, ListPlus, LogIn
} from 'lucide-react';

import GestionUsuarios from './GestionUsuarios';
import ProgramacionMedica from './ProgramacionMedica';

export default function App() {
  const [programacion, setProgramacion] = useState([]);
  const [comunicado, setComunicado] = useState("Bienvenido al H. II PUCALLPA. Recuerde presentar su documento de identidad.");
  const [nuevoComunicado, setNuevoComunicado] = useState("");
  const [horaActual, setHoraActual] = useState(new Date());
  const [cargando, setCargando] = useState(false);
  const [soloTurnoActual, setSoloTurnoActual] = useState(false);

  const [vistaActiva, setVistaActiva] = useState('MONITOR');
  const [duplicadosOmitidos, setDuplicadosOmitidos] = useState([]);
  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);

  const [medicoParaLlamar, setMedicoParaLlamar] = useState(null);
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [consultorioTopico, setConsultorioTopico] = useState('');
  const [accionPacienteAnterior, setAccionPacienteAnterior] = useState('FINALIZAR_ATENDIDO');

  // Estados de Lista de Espera (Admisión / Triaje)
  const [listaEspera, setListaEspera] = useState([]);
  const [medicoParaCola, setMedicoParaCola] = useState(null);
  const [nivelTriaje, setNivelTriaje] = useState('VERDE');

  const [medicoParaEditarPaciente, setMedicoParaEditarPaciente] = useState(null);
  const [nuevoNombreEditado, setNuevoNombreEditado] = useState('');

  const [historialLlamados, setHistorialLlamados] = useState([]);
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);

  const [busquedaAuditoria, setBusquedaAuditoria] = useState('');
  const [filtroEtapaAuditoria, setFiltroEtapaAuditoria] = useState('TODOS');
  const [filaExpandidaAuditoria, setFilaExpandidaAuditoria] = useState(null);

  const [servicioActivo, setServicioActivo] = useState('CONSULTA_EXTERNA');
  const [temaClaro, setTemaClaro] = useState(false);

  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [mostrarModalModulos, setMostrarModalModulos] = useState(false);

  const OpcionesTriaje = [
    { id: 'ROJO', label: 'PRIORIDAD I - RIESGO VIDA/RESUCITAC', corto: 'PRIORIDAD I', cls: 'bg-red-600 text-white' },
    { id: 'NARANJA', label: 'PRIORIDAD II - EMERGENCIA', corto: 'PRIORIDAD II', cls: 'bg-orange-500 text-white' },
    { id: 'AMARILLO', label: 'PRIORIDAD III - URGENCIA MAYOR', corto: 'PRIORIDAD III', cls: 'bg-yellow-400 text-black' },
    { id: 'VERDE', label: 'PRIORIDAD IV - URGENCIA MENOR', corto: 'PRIORIDAD IV', cls: 'bg-emerald-600 text-white' },
    { id: 'AZUL', label: 'PRIORIDAD V - CONSULTA', corto: 'PRIORIDAD V', cls: 'bg-blue-600 text-white' }
  ];

  const ESTADOS_MEDICO = {
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
  };

  const [rolUsuario, setRolUsuario] = useState(null);
  const [emailUsuarioActivo, setEmailUsuarioActivo] = useState('');
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalComunicado, setMostrarModalComunicado] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorPin, setErrorPin] = useState(false);

  const [medicoParaReemplazo, setMedicoParaReemplazo] = useState(null);
  const [nombreReemplazo, setNombreReemplazo] = useState('');

  const [medicoParaEditar, setMedicoParaEditar] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    Medico: '', Area: '', Rol: '', Modulo: '', Hora_Inicio: '', Hora_Fin: '', Fecha: '', TipoServicio: 'CONSULTA_EXTERNA'
  });

  const [mostrarModalNuevoRegistro, setMostrarModalNuevoRegistro] = useState(false);
  const [formNuevo, setFormNuevo] = useState({
    Medico: '', Area: '', Rol: '', Modulo: '', Hora_Inicio: '', Hora_Fin: '', Fecha: '', TipoServicio: 'CONSULTA_EXTERNA'
  });

  const [modoTvActivo, setModoTvActivo] = useState(false);
  const [indiceRotacionTv, setIndiceRotacionTv] = useState(0);
  const [cicloTv, setCicloTv] = useState(0);
  const mainScrollRef = useRef(null);

  const colaLlamadosRef = useRef([]);
  const reproduciendoAudioRef = useRef(false);
  const llamadosProcesadosRef = useRef(new Set());

  const obtenerFechaHoyLocal = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  const obtenerTiempoTranscurrido = (fechaIso) => {
    if (!fechaIso) return null;
    const inicio = new Date(fechaIso).getTime();
    const ahora = horaActual.getTime();
    const diffMs = ahora - inicio;
    if (isNaN(diffMs) || diffMs < 0) return '0 min';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return '< 1 min';
    if (diffMins < 60) return `${diffMins} min`;

    const horas = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${horas}h ${mins}m`;
  };

  const esEspecialidadEmergencia = (area = '', rol = '') => {
    const texto = `${area} ${rol}`.toLowerCase();
    const palabrasClave = ['emergencia', 'triaje', 'shock', 'trauma', 'observacion', 'observación', 'guardia', 'urgencia', 'urgencias'];
    return palabrasClave.some(p => texto.includes(p));
  };

  const procesarSiguienteLlamado = () => {
    if (reproduciendoAudioRef.current || colaLlamadosRef.current.length === 0) return;

    const siguiente = colaLlamadosRef.current.shift();
    if (!siguiente) return;

    if ('speechSynthesis' in window) {
      reproduciendoAudioRef.current = true;
      
      const ubicacionTexto = siguiente.consultorio ? `en el ${siguiente.consultorio}` : '';
      const texto = `Paciente ${siguiente.nombre}, acercarse con el doctor ${siguiente.medico} ${ubicacionTexto}`.trim();
      
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        setTimeout(() => {
          reproduciendoAudioRef.current = false;
          procesarSiguienteLlamado();
        }, 1000);
      };

      utterance.onerror = () => {
        reproduciendoAudioRef.current = false;
        procesarSiguienteLlamado();
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const agregarAColaDeLlamados = (nombre, medico, consultorio = '') => {
    colaLlamadosRef.current.push({ nombre, medico, consultorio });
    procesarSiguienteLlamado();
  };

  const registrarEnHistorialFirestore = async (medico, paciente, estadoLlamado, servicio, horaIngresoIso = null, consultorio = '', nivelTriajeDoc = '') => {
    try {
      await addDoc(collection(db, "historial_llamados"), {
        medico: medico || "Desconocido",
        paciente: paciente || "Desconocido",
        consultorio: consultorio || "",
        nivelTriaje: nivelTriajeDoc || "",
        estado: estadoLlamado, 
        servicio: servicio || 'EMERGENCIA',
        fechaIso: horaIngresoIso || new Date().toISOString(),
        fechaFormateada: obtenerFechaHoyLocal(),
        horaFormateada: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } catch (err) {
      console.error("Error guardando en historial_llamados:", err);
    }
  };

  const registrarEnPacientesMedico = async (medico, paciente, estadoFinal, consultorio = '') => {
    try {
      await addDoc(collection(db, "pacientes_medico"), {
        medico: medico || "Desconocido",
        paciente: paciente || "Desconocido",
        consultorio: consultorio || "",
        tipoRegistro: estadoFinal,
        fechaFormateada: obtenerFechaHoyLocal(),
        horaFormateada: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        fechaIso: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error guardando en pacientes_medico:", err);
    }
  };

  useEffect(() => {
    const q = collection(db, "lista_espera");
    const unsub = onSnapshot(q, (snapshot) => {
      const hoy = obtenerFechaHoyLocal();
      const datos = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => d.fecha === hoy && d.estado === 'ESPERANDO');
      setListaEspera(datos);
    });
    return () => unsub();
  }, []);

  const agregarAPilaEspera = async (e) => {
    e.preventDefault();
    if (!medicoParaCola || !nombrePaciente.trim() || cargando) return;

    const nombreLimpio = nombrePaciente.trim().toUpperCase();

    try {
      setCargando(true);

      const q = query(
        collection(db, "lista_espera"),
        where("medico", "==", medicoParaCola.Medico),
        where("paciente", "==", nombreLimpio),
        where("estado", "==", "ESPERANDO")
      );
      
      const snapshotExistente = await getDocs(q);

      if (!snapshotExistente.empty) {
        alert(`El paciente "${nombreLimpio}" ya se encuentra actualmente en la lista de espera de este médico.`);
        setCargando(false);
        return;
      }

      const pesoPrioridadMap = {
        'ROJO': 1,
        'NARANJA': 2,
        'AMARILLO': 3,
        'VERDE': 4,
        'AZUL': 5
      };

      await addDoc(collection(db, "lista_espera"), {
        medico: medicoParaCola.Medico,
        paciente: nombreLimpio,
        nivelTriaje: nivelTriaje || 'VERDE',
        pesoPrioridad: pesoPrioridadMap[nivelTriaje] || 4,
        fecha: obtenerFechaHoyLocal(),
        fechaIso: new Date().toISOString(),
        estado: 'ESPERANDO',
        servicio: 'EMERGENCIA'
      });

      setMedicoParaCola(null);
      setNombrePaciente('');
      setNivelTriaje('VERDE');
    } catch (err) {
      console.error("Error al encolar paciente:", err);
      alert("Ocurrió un error al registrar el paciente.");
    } finally {
      setCargando(false);
    }
  };

  const llamarSiguienteCola = async (medObj, pacienteEnCola) => {
    if (!medObj || !pacienteEnCola || cargando) return;

    if (rolUsuario === 'ADMISION' || rolUsuario === 'OPERADOR') {
      alert("Su perfil no tiene permitido realizar el voceo/llamado de pacientes a pantalla TV.");
      return;
    }

    if (!medObj.consultorioTopico || !medObj.consultorioTopico.trim()) {
      setMedicoParaLlamar(medObj);
      setNombrePaciente(pacienteEnCola.paciente);
      setConsultorioTopico('');
      setAccionPacienteAnterior('FINALIZAR_ATENDIDO');
      return;
    }

    try {
      setCargando(true);
      const ahoraIso = new Date().toISOString();
      const batch = writeBatch(db);

      batch.update(doc(db, "lista_espera", pacienteEnCola.id), { estado: 'LLAMADO' });

      const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          estado: 'LLAMANDO',
          pacienteLlamado: pacienteEnCola.paciente,
          nivelTriajeLlamado: pacienteEnCola.nivelTriaje || 'VERDE',
          estadoUltimoCambio: ahoraIso
        });
      });
      await batch.commit();

      await registrarEnHistorialFirestore(
        medObj.Medico, 
        pacienteEnCola.paciente, 
        'LLAMADO', 
        servicioActivo, 
        ahoraIso, 
        medObj.consultorioTopico,
        pacienteEnCola.nivelTriaje || 'VERDE'
      );
    } catch (err) {
      console.error("Error llamando al siguiente en cola:", err);
    } finally {
      setCargando(false);
    }
  };

  const obtenerInasistentesPendientes = (nombreMedico) => {
    const hoy = obtenerFechaHoyLocal();
    const historialMedicoHoy = historialLlamados.filter(
      h => h.medico === nombreMedico && h.fechaFormateada === hoy
    );

    const cronologico = [...historialMedicoHoy].sort(
      (a, b) => new Date(a.fechaIso || 0).getTime() - new Date(b.fechaIso || 0).getTime()
    );

    const mapaPacientes = new Map();

    cronologico.forEach(item => {
      const pac = item.paciente?.trim().toUpperCase();
      if (!pac) return;

      if (!mapaPacientes.has(pac)) {
        mapaPacientes.set(pac, {
          paciente: pac,
          intentosNoRespondio: 0,
          ultimoEstado: null,
          ultimaHora: item.horaFormateada
        });
      }

      const info = mapaPacientes.get(pac);
      info.ultimoEstado = item.estado;
      info.ultimaHora = item.horaFormateada;

      if (item.estado === 'NO_RESPONDIO') {
        info.intentosNoRespondio += 1;
      }
    });

    const pendientes = [];
    mapaPacientes.forEach(info => {
      if (info.ultimoEstado === 'NO_RESPONDIO') {
        pendientes.push(info);
      }
    });

    return pendientes;
  };

  const marcarInasistenciaDefinitiva = async (medObj, pacienteNombre) => {
    if (!medObj || !pacienteNombre) return;
    if (!window.confirm(`¿Seguro que desea registrar la INASISTENCIA definitiva del paciente ${pacienteNombre}?`)) return;

    try {
      const ahoraIso = new Date().toISOString();

      await registrarEnHistorialFirestore(medObj.Medico, pacienteNombre, 'INASISTENCIA', servicioActivo, ahoraIso, medObj.consultorioTopico);
      await registrarEnPacientesMedico(medObj.Medico, pacienteNombre, 'INASISTENCIA', medObj.consultorioTopico);

      if (medObj.pacienteLlamado === pacienteNombre) {
        const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
        const batch = writeBatch(db);

        ids.forEach(idDoc => {
          const medRef = doc(db, "programacion_medica", idDoc);
          batch.update(medRef, {
            estado: "CONSULTA",
            pacienteLlamado: null,
            nivelTriajeLlamado: null,
            horaIngresoConsulta: null,
            estadoUltimoCambio: ahoraIso
          });
        });

        await batch.commit();
      }
    } catch (err) {
      console.error("Error al registrar inasistencia:", err);
    }
  };

  const ingresarAConsultaConPaciente = async (medObj) => {
    if (!medObj || !medObj.pacienteLlamado) return;

    try {
      const pacienteNombre = medObj.pacienteLlamado;
      const ahoraIso = new Date().toISOString();

      await registrarEnHistorialFirestore(medObj.Medico, pacienteNombre, 'EN_CONSULTA', servicioActivo, ahoraIso, medObj.consultorioTopico, medObj.nivelTriajeLlamado);

      const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
      const batch = writeBatch(db);

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          estado: "CONSULTA",
          pacienteLlamado: pacienteNombre,
          horaIngresoConsulta: ahoraIso,
          estadoUltimoCambio: ahoraIso
        });
      });

      await batch.commit();
    } catch (err) {
      console.error("Error al registrar ingreso a consulta:", err);
    }
  };

  const marcarPacienteAtendido = async (medObj) => {
    if (!medObj || !medObj.pacienteLlamado) return;

    try {
      const pacienteNombre = medObj.pacienteLlamado;
      const ahoraIso = new Date().toISOString();

      await registrarEnHistorialFirestore(medObj.Medico, pacienteNombre, 'ATENDIDO', servicioActivo, ahoraIso, medObj.consultorioTopico);
      await registrarEnPacientesMedico(medObj.Medico, pacienteNombre, 'ATENDIDO', medObj.consultorioTopico);

      const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
      const batch = writeBatch(db);

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          estado: "CONSULTA",
          pacienteLlamado: null,
          nivelTriajeLlamado: null,
          horaIngresoConsulta: null,
          estadoUltimoCambio: ahoraIso
        });
      });

      await batch.commit();
    } catch (err) {
      console.error("Error al marcar como atendido:", err);
    }
  };

  const marcarPacienteNoRespondio = async (medObj) => {
    if (!medObj || !medObj.pacienteLlamado) return;

    try {
      const pacienteNombre = medObj.pacienteLlamado;
      const ahoraIso = new Date().toISOString();

      await registrarEnHistorialFirestore(medObj.Medico, pacienteNombre, 'NO_RESPONDIO', servicioActivo, ahoraIso, medObj.consultorioTopico);

      const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
      const batch = writeBatch(db);

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          estado: "CONSULTA",
          pacienteLlamado: null,
          nivelTriajeLlamado: null,
          horaIngresoConsulta: null,
          estadoUltimoCambio: ahoraIso
        });
      });

      await batch.commit();
    } catch (err) {
      console.error("Error al registrar no respondió:", err);
    }
  };

  const volverALlamarPaciente = async (medObj, nombreDirecto = null) => {
    if (rolUsuario === 'ADMISION' || rolUsuario === 'OPERADOR') {
      alert("Su perfil no tiene permitido realizar el voceo/llamado de pacientes.");
      return;
    }

    const pacienteAVisar = nombreDirecto || medObj?.pacienteLlamado;
    if (!medObj || !pacienteAVisar) return;

    if (
      medObj.pacienteLlamado && 
      nombreDirecto && 
      medObj.pacienteLlamado.trim().toUpperCase() !== nombreDirecto.trim().toUpperCase()
    ) {
      setMedicoParaLlamar(medObj);
      setNombrePaciente(nombreDirecto.trim().toUpperCase());
      setConsultorioTopico(medObj.consultorioTopico || '');
      setAccionPacienteAnterior('MARCAR_NO_RESPONDIO');
      return;
    }

    try {
      const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
      const batch = writeBatch(db);
      const ahoraIso = new Date().toISOString();

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          estado: "LLAMANDO",
          pacienteLlamado: pacienteAVisar.trim().toUpperCase(),
          estadoUltimoCambio: ahoraIso 
        });
      });

      await batch.commit();
    } catch (err) {
      console.error("Error al re-llamar paciente:", err);
    }
  };

  const guardarEdicionNombrePaciente = async (e) => {
    e.preventDefault();
    if (!medicoParaEditarPaciente || !nuevoNombreEditado.trim()) return;

    const nombreLimpio = nuevoNombreEditado.trim().toUpperCase();
    const nombreAnterior = medicoParaEditarPaciente.pacienteLlamado;

    try {
      const ids = Array.isArray(medicoParaEditarPaciente.ids) ? medicoParaEditarPaciente.ids : [medicoParaEditarPaciente.id];
      const batch = writeBatch(db);

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          pacienteLlamado: nombreLimpio
        });
      });

      await batch.commit();

      const snapshotHistorial = await getDocs(collection(db, "historial_llamados"));
      snapshotHistorial.docs.forEach(async (d) => {
        const data = d.data();
        if (data.medico === medicoParaEditarPaciente.Medico && data.paciente === nombreAnterior) {
          await updateDoc(doc(db, "historial_llamados", d.id), {
            paciente: nombreLimpio
          });
        }
      });

      setMedicoParaEditarPaciente(null);
      setNuevoNombreEditado('');
    } catch (err) {
      console.error("Error al actualizar el nombre del paciente:", err);
    }
  };

  useEffect(() => {
    const q = collection(db, "historial_llamados");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      datos.sort((a, b) => new Date(b.fechaIso || 0).getTime() - new Date(a.fechaIso || 0).getTime());
      setHistorialLlamados(datos);
    });
    return () => unsubscribe();
  }, []);

  const historialAgrupadoAuditoria = React.useMemo(() => {
    const mapaGrupos = new Map();

    if (!Array.isArray(historialLlamados)) return [];

    const ordenados = [...historialLlamados].sort(
      (a, b) => new Date(a.fechaIso || 0).getTime() - new Date(b.fechaIso || 0).getTime()
    );

    ordenados.forEach(item => {
      const pac = (item.paciente || "DESCONOCIDO").trim().toUpperCase();
      const med = (item.medico || "DESCONOCIDO").trim();
      const fec = item.fechaFormateada || "";

      const claveGrupo = `${fec}_${med}_${pac}`;

      if (!mapaGrupos.has(claveGrupo)) {
        mapaGrupos.set(claveGrupo, {
          idUnico: claveGrupo,
          fechaFormateada: fec,
          paciente: pac,
          medico: med,
          servicio: item.servicio || 'EMERGENCIA',
          consultorio: item.consultorio || '',
          nivelTriaje: item.nivelTriaje || '',
          eventos: [],
          estadoFinal: item.estado || '',
          horaInicio: item.horaFormateada || '--:--',
          horaFin: item.horaFormateada || '--:--',
          fechaIsoUltima: item.fechaIso || new Date().toISOString()
        });
      }

      const g = mapaGrupos.get(claveGrupo);
      g.eventos.push(item);
      g.estadoFinal = item.estado || '';
      g.horaFin = item.horaFormateada || '--:--';
      g.fechaIsoUltima = item.fechaIso || new Date().toISOString();
    });

    const resultado = Array.from(mapaGrupos.values());
    resultado.sort((a, b) => new Date(b.fechaIsoUltima).getTime() - new Date(a.fechaIsoUltima).getTime());

    return resultado;
  }, [historialLlamados]);

  const historialFiltradoAuditoria = historialAgrupadoAuditoria.filter(grupo => {
    const termino = busquedaAuditoria.trim().toLowerCase();
    const coincideTexto = !termino || 
      grupo.paciente.toLowerCase().includes(termino) || 
      grupo.medico.toLowerCase().includes(termino);

    if (!coincideTexto) return false;

    if (filtroEtapaAuditoria !== 'TODOS') {
      if (filtroEtapaAuditoria === 'INASISTENCIA' && (grupo.estadoFinal !== 'INASISTENCIA' && grupo.estadoFinal !== 'DADO_DE_BAJA')) return false;
      if (filtroEtapaAuditoria === 'ATENDIDO' && grupo.estadoFinal !== 'ATENDIDO') return false;
      if (filtroEtapaAuditoria === 'EN_CONSULTA' && grupo.estadoFinal !== 'EN_CONSULTA') return false;
      if (filtroEtapaAuditoria === 'NO_RESPONDIO' && grupo.estadoFinal !== 'NO_RESPONDIO') return false;
      if (filtroEtapaAuditoria === 'LLAMANDO' && (grupo.estadoFinal !== 'LLAMADO' && grupo.estadoFinal !== 'RE_LLAMADO')) return false;
    }

    return true;
  });

  const descargarReporteExcelAuditoria = () => {
    if (!historialFiltradoAuditoria || historialFiltradoAuditoria.length === 0) {
      alert("No hay registros disponibles para exportar en el reporte actual.");
      return;
    }

    const totalRegistros = historialFiltradoAuditoria.length;
    const totalAtendidos = historialFiltradoAuditoria.filter(h => h.estadoFinal === 'ATENDIDO').length;
    const totalEnConsulta = historialFiltradoAuditoria.filter(h => h.estadoFinal === 'EN_CONSULTA').length;
    const totalNoRespondio = historialFiltradoAuditoria.filter(h => h.estadoFinal === 'NO_RESPONDIO').length;
    const totalInasistencias = historialFiltradoAuditoria.filter(h => h.estadoFinal === 'INASISTENCIA' || h.estadoFinal === 'DADO_DE_BAJA').length;

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
          <tr><td colspan="10" class="sub-banner">Fecha de Emisión: ${fechaHoy} ${horaImpresion} | Servicio: ${servicioActivo}</td></tr>
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

    historialFiltradoAuditoria.forEach((item, index) => {
      const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
      let estadoLimpio = (item.estadoFinal || '').replace(/_/g, ' ');
      if (item.estadoFinal === 'DADO_DE_BAJA') estadoLimpio = 'INASISTENCIA';

      const objTriaje = OpcionesTriaje.find(t => t.id === item.nivelTriaje);
      const textoTriajeExcel = objTriaje ? objTriaje.label : 'S/N';

      const trazabilidadTexto = item.eventos
        .map((e, idx) => `Paso ${idx + 1}: ${e.horaFormateada} ➜ [${(e.estado || '').replace(/_/g, ' ')}]`)
        .join('<br/>');

      excelTemplate += `
        <tr class="${rowClass}">
          <td class="td-cell td-center">${index + 1}</td>
          <td class="td-cell td-center">${item.fechaFormateada}</td>
          <td class="td-cell td-center">${item.horaInicio}</td>
          <td class="td-cell td-center">${item.horaFin}</td>
          <td class="td-cell td-left" style="font-weight: bold;">${item.paciente}</td>
          <td class="td-cell td-left">${item.medico}</td>
          <td class="td-cell td-center">${item.servicio || 'GENERAL'}</td>
          <td class="td-cell td-center" style="font-weight: bold;">${textoTriajeExcel}</td>
          <td class="td-cell td-center">${estadoLimpio}</td>
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
  };

  useEffect(() => {
    if (servicioActivo !== 'EMERGENCIA') return;

    programacion.forEach(p => {
      if (p.TipoServicio === 'EMERGENCIA' && p.estado === 'LLAMANDO' && p.pacienteLlamado && p.estadoUltimoCambio) {
        const claveUnicaLlamado = `${p.id}_${p.pacienteLlamado}_${p.estadoUltimoCambio}`;
        const tiempoCambio = new Date(p.estadoUltimoCambio).getTime();
        const segundosDesdeLlamado = (new Date().getTime() - tiempoCambio) / 1000;

        if (!llamadosProcesadosRef.current.has(claveUnicaLlamado)) {
          llamadosProcesadosRef.current.add(claveUnicaLlamado);
          if (segundosDesdeLlamado < 15) {
            agregarAColaDeLlamados(p.pacienteLlamado, p.Medico, p.consultorioTopico || '');
          }
        }
      }
    });
  }, [programacion, servicioActivo]);

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- LÓGICA DE AUTENTICACIÓN SEGURA SIN CORREOS HARDCODED ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const emailLimpio = user.email.toLowerCase().trim();
        setEmailUsuarioActivo(emailLimpio);

        try {
          const userDocRef = doc(db, "usuarios", emailLimpio);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists() && userSnap.data().activo !== false) {
            const rolDB = userSnap.data().rol || 'OPERADOR';
            setRolUsuario(rolDB);
            if (rolDB === 'ADMISION') setServicioActivo('EMERGENCIA');
          } else {
            // Fallback seguro: Asignar operador si no hay rol en la DB
            setRolUsuario('OPERADOR');
          }
        } catch (e) {
          console.error("Error al obtener rol del usuario:", e);
          setRolUsuario('OPERADOR');
        }
      } else {
        setRolUsuario(null);
        setEmailUsuarioActivo('');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collection(db, "programacion_medica");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProgramacion(datos);
    });
    return () => unsubscribe();
  }, []);

  const todosLosModulosDisponibles = Array.from(
    new Set(programacion.map(item => item.Modulo || "Módulo General"))
  ).sort();

  useEffect(() => {
    if (todosLosModulosDisponibles.length > 0 && modulosSeleccionados.length === 0) {
      setModulosSeleccionados(todosLosModulosDisponibles);
    }
  }, [programacion]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "configuracion"), (snapshot) => {
      snapshot.docs.forEach(d => {
        if (d.id === "comunicado") {
          setComunicado(d.data().mensaje || "");
        }
      });
    });
    return () => unsubscribe();
  }, []);

  const medicoLlamandoEnVivo = programacion.find(
    p => p.estado === 'LLAMANDO' && p.pacienteLlamado && modulosSeleccionados.includes(p.Modulo || "Módulo General")
  );

  useEffect(() => {
    if (!modoTvActivo || modulosSeleccionados.length === 0) return;

    if (medicoLlamandoEnVivo) {
      const moduloLlamado = medicoLlamandoEnVivo.Modulo || "Módulo General";
      const indiceModuloLlamado = modulosSeleccionados.indexOf(moduloLlamado);

      if (indiceModuloLlamado !== -1 && indiceModuloLlamado !== (indiceRotacionTv % modulosSeleccionados.length)) {
        setIndiceRotacionTv(indiceModuloLlamado);
        if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
      }
    }
  }, [medicoLlamandoEnVivo, modoTvActivo, modulosSeleccionados]);

  useEffect(() => {
    let scrollInterval = null;
    let timeoutAccion = null;
    let isWaiting = false;

    if (modoTvActivo && modulosSeleccionados.length > 0 && mainScrollRef.current) {
      if (medicoLlamandoEnVivo) {
        if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
        return; 
      }

      timeoutAccion = setTimeout(() => {
        scrollInterval = setInterval(() => {
          const el = mainScrollRef.current;
          if (!el) return;

          const cabeEnPantalla = el.scrollHeight <= el.clientHeight;
          const llegoAlFondo = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 2;

          if (cabeEnPantalla || llegoAlFondo) {
            if (!isWaiting) {
              isWaiting = true;
              clearInterval(scrollInterval);
              const tiempoEspera = cabeEnPantalla ? 10000 : 4000; 

              timeoutAccion = setTimeout(() => {
                setIndiceRotacionTv(prev => (prev + 1) % modulosSeleccionados.length);
                setCicloTv(prev => prev + 1);
                if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
                isWaiting = false;
              }, tiempoEspera);
            }
          } else {
            el.scrollTop += 1; 
          }
        }, 35);
      }, 3000); 
    }

    return () => {
      clearInterval(scrollInterval);
      clearTimeout(timeoutAccion);
    };
  }, [modoTvActivo, modulosSeleccionados, indiceRotacionTv, cicloTv, medicoLlamandoEnVivo]);

  const cambiarEstadoMedico = async (idsDocs, nuevoEstado, estaActivo = false, estaEnUltimaHora = false, medObj = null) => {
    if (servicioActivo === 'EMERGENCIA' && rolUsuario === 'ADMISION') {
      if (nuevoEstado !== 'PAUSA' && nuevoEstado !== 'AUSENTE' && nuevoEstado !== 'CONSULTA') {
        alert("El perfil de Admisión solo tiene permitido cambiar los estados a 'En Consulta', 'En Pausa' o 'Ausente'.");
        return;
      }
    }

    if (nuevoEstado === "LLAMANDO") {
      if (rolUsuario === 'ADMISION' || rolUsuario === 'OPERADOR') {
        alert("Su perfil no tiene permitido realizar el voceo/llamado de pacientes.");
        return;
      }

      if (servicioActivo === 'EMERGENCIA' && medObj) {
        setMedicoParaLlamar(medObj);
        setNombrePaciente('');
        setConsultorioTopico(medObj.consultorioTopico || '');
        setAccionPacienteAnterior('FINALIZAR_ATENDIDO');
        return;
      }
    }

    if (estaActivo && nuevoEstado === "PROGRAMADO") {
      alert("No se puede asignar 'Próximo Turno' a un médico que se encuentra en turno activo.");
      return;
    }

    if (estaActivo && nuevoEstado === "CULMINADO" && !estaEnUltimaHora) {
      alert("Solo se puede marcar como CULMINADO dentro de la última hora del turno activo.");
      return;
    }

    try {
      const ids = Array.isArray(idsDocs) ? idsDocs : [idsDocs];
      const batch = writeBatch(db);
      const ahoraIso = new Date().toISOString();

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, { 
          estado: nuevoEstado,
          pacienteLlamado: nuevoEstado === "LLAMANDO" ? (medObj?.pacienteLlamado || '') : medObj?.pacienteLlamado,
          estadoUltimoCambio: ahoraIso
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  const confirmarLlamadaPaciente = async (e) => {
    e.preventDefault();
    if (!medicoParaLlamar || !nombrePaciente.trim() || cargando) return;

    if (rolUsuario === 'ADMISION' || rolUsuario === 'OPERADOR') {
      alert("Su perfil no tiene permitido realizar el voceo/llamado de pacientes.");
      return;
    }

    const nombreLimpio = nombrePaciente.trim().toUpperCase();
    const consultorioLimpio = consultorioTopico.trim();
    const pacienteAnterior = medicoParaLlamar.pacienteLlamado;
    const ahoraIso = new Date().toISOString();

    try {
      setCargando(true);
      if (pacienteAnterior) {
        if (accionPacienteAnterior === 'FINALIZAR_ATENDIDO') {
          await registrarEnHistorialFirestore(medicoParaLlamar.Medico, pacienteAnterior, 'ATENDIDO', servicioActivo, ahoraIso, consultorioLimpio);
          await registrarEnPacientesMedico(medicoParaLlamar.Medico, pacienteAnterior, 'ATENDIDO', consultorioLimpio);
        } else if (accionPacienteAnterior === 'MARCAR_NO_RESPONDIO') {
          await registrarEnHistorialFirestore(medicoParaLlamar.Medico, pacienteAnterior, 'NO_RESPONDIO', servicioActivo, ahoraIso, consultorioLimpio);
        } else if (accionPacienteAnterior === 'MARCAR_INASISTENCIA') {
          await registrarEnHistorialFirestore(medicoParaLlamar.Medico, pacienteAnterior, 'INASISTENCIA', servicioActivo, ahoraIso, consultorioLimpio);
          await registrarEnPacientesMedico(medicoParaLlamar.Medico, pacienteAnterior, 'INASISTENCIA', consultorioLimpio);
        }
      }

      const ids = Array.isArray(medicoParaLlamar.ids) ? medicoParaLlamar.ids : [medicoParaLlamar.id];
      const batch = writeBatch(db);

      const nuevoEstadoAsignado = 'LLAMANDO';

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          estado: nuevoEstadoAsignado,
          pacienteLlamado: nombreLimpio,
          consultorioTopico: consultorioLimpio,
          nivelTriajeLlamado: nivelTriaje || 'VERDE',
          horaIngresoConsulta: null,
          estadoUltimoCambio: ahoraIso
        });
      });

      await batch.commit();
      await registrarEnHistorialFirestore(
        medicoParaLlamar.Medico, 
        nombreLimpio, 
        'LLAMADO', 
        servicioActivo, 
        ahoraIso, 
        consultorioLimpio,
        nivelTriaje || 'VERDE'
      );

      setMedicoParaLlamar(null);
      setNombrePaciente('');
      setConsultorioTopico('');
      setNivelTriaje('VERDE');
      setAccionPacienteAnterior('FINALIZAR_ATENDIDO');
    } catch (err) {
      console.error("Error al ingresar/llamar paciente:", err);
    } finally {
      setCargando(false);
    }
  };

  const aplicarReemplazo = async (e) => {
    e.preventDefault();
    if (!medicoParaReemplazo || !nombreReemplazo.trim()) return;

    try {
      const ids = Array.isArray(medicoParaReemplazo.ids) ? medicoParaReemplazo.ids : [medicoParaReemplazo.id];
      const batch = writeBatch(db);

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          medicoTitular: medicoParaReemplazo.medicoTitular || medicoParaReemplazo.Medico,
          Medico: nombreReemplazo.trim(),
          esReemplazo: true
        });
      });

      await batch.commit();
      setMedicoParaReemplazo(null);
      setNombreReemplazo('');
    } catch (err) {
      console.error("Error asignando reemplazo:", err);
    }
  };

  const restaurarTitular = async (item) => {
    if (!item.medicoTitular) return;
    try {
      const ids = Array.isArray(item.ids) ? item.ids : [item.id];
      const batch = writeBatch(db);

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          Medico: item.medicoTitular,
          esReemplazo: false,
          medicoTitular: null
        });
      });

      await batch.commit();
    } catch (err) {
      console.error("Error al restaurar titular:", err);
    }
  };

  const abrirModalEditar = (med) => {
    setMedicoParaEditar(med);
    const tipoServ = med.TipoServicio || (esEspecialidadEmergencia(med.Area, med.Rol) ? 'EMERGENCIA' : 'CONSULTA_EXTERNA');
    setFormEdicion({
      Medico: med.Medico || '', Area: med.Area || '', Rol: med.Rol || '', Modulo: med.Modulo || '', Hora_Inicio: med.horarios?.[0]?.inicio || med.Hora_Inicio || '', Hora_Fin: med.horarios?.[0]?.fin || med.Hora_Fin || '', Fecha: med.Fecha || obtenerFechaHoyLocal(), TipoServicio: tipoServ
    });
  };

  const guardarEdicionRegistro = async (e) => {
    e.preventDefault();
    if (rolUsuario !== 'ADMIN' || !medicoParaEditar) return;

    try {
      const ids = Array.isArray(medicoParaEditar.ids) ? medicoParaEditar.ids : [medicoParaEditar.id];
      const batch = writeBatch(db);

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          Medico: formEdicion.Medico.trim(),
          Area: formEdicion.Area.trim(),
          Rol: formEdicion.Rol.trim(),
          Modulo: formEdicion.Modulo.trim(),
          Hora_Inicio: formEdicion.Hora_Inicio.trim(),
          Hora_Fin: formEdicion.Hora_Fin.trim(),
          Fecha: formEdicion.Fecha,
          TipoServicio: formEdicion.TipoServicio
        });
      });

      await batch.commit();
      setMedicoParaEditar(null);
    } catch (err) {
      console.error("Error al editar programación:", err);
    }
  };

  const eliminarRegistroIndividual = async (med) => {
    if (rolUsuario !== 'ADMIN') return;
    if (!window.confirm(`¿Seguro que deseas eliminar la programación de "${med.Medico}"?`)) return;

    try {
      const ids = Array.isArray(med.ids) ? med.ids : [med.id];
      const batch = writeBatch(db);
      ids.forEach(idDoc => {
        batch.delete(doc(db, "programacion_medica", idDoc));
      });
      await batch.commit();
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  const guardarNuevoRegistro = async (e) => {
    e.preventDefault();
    if (rolUsuario !== 'ADMIN') return;

    try {
      const colRef = collection(db, "programacion_medica");
      const ahoraIso = new Date().toISOString();

      await addDoc(colRef, {
        Modulo: formNuevo.Modulo.trim() || "Módulo General",
        Area: formNuevo.Area.trim() || "General",
        Medico: formNuevo.Medico.trim() || "Sin Nombre",
        Rol: formNuevo.Rol.trim() || "Consulta Médica",
        Fecha: formNuevo.Fecha || obtenerFechaHoyLocal(),
        Hora_Inicio: formNuevo.Hora_Inicio.trim() || "--:--",
        Hora_Fin: formNuevo.Hora_Fin.trim() || "--:--",
        TipoServicio: formNuevo.TipoServicio || servicioActivo,
        estado: "CONSULTA",
        estadoUltimoCambio: ahoraIso
      });

      setMostrarModalNuevoRegistro(false);
      setFormNuevo({
        Medico: '', Area: '', Rol: '', Modulo: '', Hora_Inicio: '', Hora_Fin: '', Fecha: obtenerFechaHoyLocal(), TipoServicio: servicioActivo
      });
    } catch (err) {
      console.error("Error al agregar nuevo registro:", err);
    }
  };

  const obtenerMinutos = (horaStr) => {
    if (!horaStr || horaStr === "--:--") return 0;
    const [h, m] = horaStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const obtenerEstadoHorario = (h) => {
    if (!h || !h.inicio || !h.fin || h.inicio === "--:--" || h.fin === "--:--") return 'PASADO';
    
    const ahora = horaActual.getHours() * 60 + horaActual.getMinutes();
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

  const esRangoActivo = (h) => obtenerEstadoHorario(h) === 'ACTIVO';

  const estaEnTurno = (horariosArray) => {
    if (!horariosArray || horariosArray.length === 0) return false;
    return horariosArray.some(h => esRangoActivo(h));
  };

  const estaEnUltimaHora = (horariosArray) => {
    if (!horariosArray || horariosArray.length === 0) return false;
    const ahora = horaActual.getHours() * 60 + horaActual.getMinutes();

    return horariosArray.some(h => {
      if (obtenerEstadoHorario(h) === 'ACTIVO') {
        const finMin = obtenerMinutos(h.fin);
        let diferencia = finMin - ahora;
        if (diferencia < 0) diferencia += 1440;
        return diferencia <= 60;
      }
      return false;
    });
  };

  const calcularEstadoInteligente = (med, estaActivoAhora) => {
    if (!med.horarios || med.horarios.length === 0) return med.estado || "CONSULTA";

    const todosPasados = med.horarios.every(h => obtenerEstadoHorario(h) === 'PASADO');
    if (todosPasados) return "CULMINADO";

    if (estaActivoAhora) {
      if (med.estado === "CULMINADO" && estaEnUltimaHora(med.horarios)) {
        return "CULMINADO";
      }
      if (med.estado === "PROGRAMADO" || med.estado === "CULMINADO") return "CONSULTA";
      return med.estado || "CONSULTA";
    }

    const tieneTurnoFuturo = med.horarios.some(h => obtenerEstadoHorario(h) === 'FUTURO');
    if (tieneTurnoFuturo) {
      return "PROGRAMADO";
    }

    return med.estado || "CONSULTA";
  };

  const getFieldValue = (row, fieldKeys) => {
    const keyFound = Object.keys(row).find(k => 
      fieldKeys.some(fk => k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === fk.toLowerCase())
    );
    return keyFound ? row[keyFound] : null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorPin(false);

    try {
      const cleanEmail = emailInput.trim().toLowerCase();
      const cleanPassword = passwordInput.trim();

      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      
      const userDocRef = doc(db, "usuarios", cleanEmail);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.activo === false || data.estado === "inactivo") {
          await signOut(auth);
          alert("Acceso denegado: Tu cuenta se encuentra inactiva. Contacta al administrador.");
          return;
        }
      }

      setMostrarModalLogin(false);
      setEmailInput('');
      setPasswordInput('');
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setErrorPin(true);
    }
  };

  // --- LÓGICA DE LOGIN CON GOOGLE SEGURA SIN CORREOS HARDCODED ---
  const loginConGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      setErrorPin(false);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const emailClean = user.email.toLowerCase().trim();

      const userDocRef = doc(db, "usuarios", emailClean);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        // Todo nuevo registro automático por Google asume rol OPERADOR por seguridad
        await setDoc(userDocRef, {
          nombre: user.displayName || emailClean.split('@')[0],
          email: emailClean,
          rol: 'OPERADOR', 
          servicio: 'TODOS',
          activo: true,
          estado: 'activo',
          fechaCreacion: new Date().toISOString()
        });
        setRolUsuario('OPERADOR');
      } else {
        const data = userSnap.data();
        if (data.activo === false || data.estado === "inactivo") {
          await signOut(auth);
          alert("Acceso denegado: Tu cuenta se encuentra inactiva. Contacta al administrador.");
          return;
        }
      }

      setMostrarModalLogin(false);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setErrorPin(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
    setRolUsuario(null);
    setEmailUsuarioActivo('');
    setVistaActiva('MONITOR');
  };

  const guardarComunicado = async (e) => {
    e.preventDefault();
    if (rolUsuario !== 'ADMIN') return;
    try {
      await setDoc(doc(db, "configuracion", "comunicado"), { mensaje: nuevoComunicado });
      setMostrarModalComunicado(false);
    } catch (err) {
      console.error("Error guardando comunicado:", err);
    }
  };

  const limpiarBaseDatos = async () => {
    if (rolUsuario !== 'ADMIN') return;
    if (!window.confirm("¿Seguro que deseas eliminar TODA la programación cargada?")) return;
    setCargando(true);
    try {
      const querySnapshot = await getDocs(collection(db, "programacion_medica"));
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setModulosSeleccionados([]);
    } catch (err) {
      console.error("Error al limpiar:", err);
    } finally {
      setCargando(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (rolUsuario !== 'ADMIN' && rolUsuario !== 'OPERADOR') return;
    const file = e.target.files[0];
    if (!file) return;

    setCargando(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (!jsonData || jsonData.length === 0) {
          alert("El archivo Excel no contiene datos válidos.");
          setCargando(false);
          return;
        }

        const querySnapshot = await getDocs(collection(db, "programacion_medica"));
        const clavesProcesadas = new Set();

        querySnapshot.docs.forEach(docSnap => {
          const d = docSnap.data();
          const med = String(d.Medico || "").trim().toLowerCase();
          const fec = String(d.Fecha || "").trim();
          const ini = String(d.Hora_Inicio || "").trim();
          const fin = String(d.Hora_Fin || "").trim();
          const rol = String(d.Rol || "").trim().toLowerCase();

          if (med) {
            clavesProcesadas.add(`${med}_${fec}_${ini}_${fin}_${rol}`);
          }
        });

        const batchInsert = writeBatch(db);
        const colRef = collection(db, "programacion_medica");
        const modulosDetectados = new Set();
        const listaDuplicados = [];
        let registrosProcesadosCount = 0;
        const ahoraIso = new Date().toISOString();

        jsonData.forEach((item, index) => {
          const medico = getFieldValue(item, ['profesional', 'medico', 'nombre']) || "Sin Nombre";
          const area = getFieldValue(item, ['servicio', 'area', 'especialidad']) || "General";
          const rol = getFieldValue(item, ['subactividad', 'rol', 'actividad']) || "Consulta Médica";
          
          let modulo = getFieldValue(item, ['modulo', 'ubicacion', 'consultorio']);
          modulo = (!modulo || String(modulo).trim() === "") ? "Módulo General" : String(modulo).trim();

          const fechaRaw = getFieldValue(item, ['fecha_programacion', 'fecha']);
          let fechaFormateada = obtenerFechaHoyLocal();

          if (fechaRaw) {
            if (fechaRaw instanceof Date) {
              const offset = fechaRaw.getTimezoneOffset() * 60000;
              fechaFormateada = new Date(fechaRaw.getTime() - offset).toISOString().split('T')[0];
            } else {
              const strFecha = String(fechaRaw).trim();
              if (strFecha.includes('/')) {
                const partes = strFecha.split('/');
                if (partes.length === 3) {
                  const anio = partes[2].length === 2 ? `20${partes[2]}` : partes[2];
                  fechaFormateada = `${anio}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                }
              } else {
                const d = new Date(strFecha);
                if (!isNaN(d.getTime())) {
                  const offset = d.getTimezoneOffset() * 60000;
                  fechaFormateada = new Date(d.getTime() - offset).toISOString().split('T')[0];
                } else {
                  fechaFormateada = strFecha;
                }
              }
            }
          }

          const turnoRaw = getFieldValue(item, ['turno', 'horario']) || "";
          let hInicio = "--:--", hFin = "--:--";

          if (turnoRaw && String(turnoRaw).includes('-')) {
            const partes = String(turnoRaw).split('-');
            hInicio = partes[0].trim();
            hFin = partes[1].trim();
          } else {
            hInicio = getFieldValue(item, ['hora_inicio', 'inicio']) || "--:--";
            hFin = getFieldValue(item, ['hora_fin', 'fin']) || "--:--";
          }

          const esEmerg = esEspecialidadEmergencia(String(area), String(rol));
          const tipoServicioFinal = esEmerg ? 'EMERGENCIA' : 'CONSULTA_EXTERNA';

          if (medico !== "Sin Nombre" || area !== "General") {
            const claveUnica = `${String(medico).trim().toLowerCase()}_${fechaFormateada}_${String(hInicio).trim()}_${String(hFin).trim()}_${String(rol).trim().toLowerCase()}`;

            if (clavesProcesadas.has(claveUnica)) {
              listaDuplicados.push({
                filaExcel: index + 2,
                medico: String(medico).trim(),
                area: String(area).trim(),
                rol: String(rol).trim(),
                fecha: fechaFormateada,
                horario: `${hInicio} - ${hFin}`
              });
            } else {
              clavesProcesadas.add(claveUnica);
              modulosDetectados.add(modulo);
              registrosProcesadosCount++;

              const newDocRef = doc(colRef);
              batchInsert.set(newDocRef, {
                Modulo: modulo,
                Area: String(area).trim(),
                Medico: String(medico).trim(),
                Rol: String(rol).trim(),
                Fecha: fechaFormateada,
                Hora_Inicio: String(hInicio).trim(),
                Hora_Fin: String(hFin).trim(),
                TipoServicio: tipoServicioFinal,
                estado: "CONSULTA",
                estadoUltimoCambio: ahoraIso
              });
            }
          }
        });

        if (registrosProcesadosCount > 0) {
          await batchInsert.commit();
        }

        const listaNuevosModulos = Array.from(modulosDetectados).sort();
        if (listaNuevosModulos.length > 0) {
          setModulosSeleccionados(listaNuevosModulos);
        }

        if (listaDuplicados.length > 0) {
          setDuplicadosOmitidos(listaDuplicados);
          setMostrarModalReporte(true);
        } else {
          alert(`¡Carga exitosa! Se guardaron ${registrosProcesadosCount} registros nuevos.`);
        }

      } catch (err) {
        console.error("Error en la subida:", err);
      } finally {
        setCargando(false);
        e.target.value = null;
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const toggleModuloSeleccionado = (mod) => {
    if (modulosSeleccionados.includes(mod)) {
      setModulosSeleccionados(modulosSeleccionados.filter(m => m !== mod));
    } else {
      setModulosSeleccionados([...modulosSeleccionados, mod]);
    }
  };

  const seleccionarTodosLosModulos = () => setModulosSeleccionados([...todosLosModulosDisponibles]);
  const deseleccionarTodosLosModulos = () => setModulosSeleccionados([]);

  const moduloActualTv = modoTvActivo && modulosSeleccionados.length > 0 
    ? modulosSeleccionados[indiceRotacionTv % modulosSeleccionados.length] 
    : null;

  const programacionAgrupada = React.useMemo(() => {
    try {
      const mapaMedicos = new Map();
      const fechaHoy = obtenerFechaHoyLocal();

      programacion.forEach((item) => {
        if (item.Fecha && item.Fecha !== fechaHoy) return;

        const nombreMedico = (item.Medico || "Sin Nombre").toLowerCase().trim();
        const key = `${item.Modulo || "Módulo General"}_${item.Area || "General"}_${nombreMedico}`;
        const rolLimpio = item.Rol || "Consulta Médica";

        if (!mapaMedicos.has(key)) {
          mapaMedicos.set(key, {
            ...item,
            Rol: rolLimpio,
            rolesLista: [rolLimpio],
            ids: [item.id],
            horarios: [{ inicio: item.Hora_Inicio || "--:--", fin: item.Hora_Fin || "--:--" }]
          });
        } else {
          const existente = mapaMedicos.get(key);
          existente.ids.push(item.id);
          
          if (item.estadoUltimoCambio) {
            existente.estadoUltimoCambio = item.estadoUltimoCambio;
          }

          if (!existente.rolesLista.includes(rolLimpio)) {
            existente.rolesLista.push(rolLimpio);
            existente.Rol = existente.rolesLista.join(" / ");
          }

          const hInicio = item.Hora_Inicio || "--:--";
          const hFin = item.Hora_Fin || "--:--";

          const yaExisteHorario = existente.horarios.some(
            h => h.inicio === hInicio && h.fin === hFin
          );
          if (!yaExisteHorario) {
            existente.horarios.push({ inicio: hInicio, fin: hFin });
          }
        }
      });

      return Array.from(mapaMedicos.values()).map(medico => {
        if (Array.isArray(medico.horarios)) {
          medico.horarios.sort((a, b) => {
            const iniA = String(a?.inicio || "--:--");
            const iniB = String(b?.inicio || "--:--");
            if (iniA === "--:--") return 1;
            if (iniB === "--:--") return -1;
            return iniA.localeCompare(iniB);
          });
        }
        return medico;
      });
    } catch (err) {
      console.error("Error al procesar agrupación:", err);
      return [];
    }
  }, [programacion]);

  const datosFiltrados = programacionAgrupada.filter(item => {
    const mod = item.Modulo || "Módulo General";
    
    const esEmerg = item.TipoServicio === 'EMERGENCIA' || esEspecialidadEmergencia(item.Area, item.Rol);
    if (servicioActivo === 'EMERGENCIA' && !esEmerg) return false;
    if (servicioActivo === 'CONSULTA_EXTERNA' && esEmerg) return false;

    if (modoTvActivo && mod !== moduloActualTv) return false;
    if (!modoTvActivo && !modulosSeleccionados.includes(mod)) return false;
    if (soloTurnoActual && !estaEnTurno(item.horarios)) return false;

    return true;
  });

  const agrupadoPorModulo = datosFiltrados.reduce((acc, item) => {
    const moduloKey = item.Modulo || "Módulo General";
    if (!acc[moduloKey]) acc[moduloKey] = [];
    acc[moduloKey].push(item);
    return acc;
  }, {});

  const puedeModificarEstados = rolUsuario === 'ADMIN' || rolUsuario === 'OPERADOR' || rolUsuario === 'ADMISION' || rolUsuario === 'MEDICO';

  return (
    <div className={`min-h-screen flex flex-col font-sans overflow-hidden h-screen relative transition-colors duration-300 ${
      temaClaro ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-white'
    }`}>

      <style>{`
        @keyframes marqueeAnimation {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animacion-marquee {
          display: inline-block;
          white-space: nowrap;
          padding-left: 100%;
          animation: marqueeAnimation 30s linear infinite;
          will-change: transform;
        }
        .animacion-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      {/* Header Superior */}
      <header className={`px-8 py-4 flex flex-wrap justify-between items-center gap-4 shadow-xl z-30 border-b transition-colors ${
        temaClaro ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
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
              H. II PUCALLPA / {servicioActivo === 'EMERGENCIA' ? 'SERVICIO DE EMERGENCIA 24H' : 'CONSULTA EXTERNA'}
            </h1>
            <p className={`text-xs font-medium ${temaClaro ? 'text-slate-500' : 'text-slate-400'}`}>
              {modoTvActivo && moduloActualTv 
                ? `VISTA TV: Proyectando ${moduloActualTv} ${medicoLlamandoEnVivo ? '🔔 (INTERRUPCIÓN POR VOCEO)' : ''}` 
                : `Mostrando ${modulosSeleccionados.length} de ${todosLosModulosDisponibles.length} módulo(s)`}
            </p>
          </div>
        </div>

        {/* Pestañas Principales (Restringidas según rol) */}
        <div className={`flex p-1 rounded-2xl border transition ${
          temaClaro ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/80 border-slate-700'
        }`}>
          {rolUsuario !== 'ADMISION' && (
            <button
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
            onClick={() => { setVistaActiva('MONITOR'); setServicioActivo('EMERGENCIA'); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              vistaActiva === 'MONITOR' && servicioActivo === 'EMERGENCIA'
                ? 'bg-rose-600 text-white shadow-lg'
                : temaClaro ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Siren className="w-4 h-4 text-rose-400" />
            <span>Emergencia 24H</span>
          </button>

          {rolUsuario === 'ADMIN' && (
            <button
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

        <div className="flex flex-wrap items-center gap-3">
          
          {puedeModificarEstados && (
            <button
              onClick={() => setMostrarModalHistorial(true)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                temaClaro 
                  ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100' 
                  : 'bg-purple-900/30 text-purple-300 border-purple-700/50 hover:bg-purple-800/50'
              }`}
              title="Ver auditoría de llamados e inasistencias"
            >
              <History className="w-4 h-4 text-purple-400" />
              <span>Auditoría</span>
            </button>
          )}

          <button
            onClick={() => setSoloTurnoActual(!soloTurnoActual)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              soloTurnoActual
                ? 'bg-emerald-500/20 text-emerald-700 border-emerald-400'
                : temaClaro ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{soloTurnoActual ? "Filtrado: Turno Actual" : "Vista: Todo"}</span>
          </button>

          <button
            onClick={() => setMostrarModalModulos(true)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              temaClaro ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
            <span>Módulos ({modulosSeleccionados.length})</span>
          </button>

          <button
            onClick={() => setTemaClaro(!temaClaro)}
            className={`p-2.5 rounded-xl border transition flex items-center gap-2 text-xs font-bold ${
              temaClaro 
                ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {temaClaro ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>

          <button
            onClick={() => {
              if (modulosSeleccionados.length === 0) {
                alert("Seleccione al menos un módulo para activar el Modo TV.");
                return;
              }
              setModoTvActivo(!modoTvActivo);
              setIndiceRotacionTv(0);
              if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              modoTvActivo 
                ? 'bg-cyan-500/20 text-cyan-600 border-cyan-400 animate-pulse' 
                : temaClaro ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Tv className="w-4 h-4 text-cyan-500" />
            <span>{modoTvActivo ? "TV Automático" : "Modo TV"}</span>
            {modoTvActivo ? <Pause className="w-3 h-3 text-cyan-500" /> : <Play className="w-3 h-3 text-slate-400" />}
          </button>

          <div className={`flex items-center space-x-2 border px-4 py-2 rounded-xl ${
            temaClaro ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <Clock className="w-5 h-5 text-cyan-500 animate-pulse" />
            <span className={`text-xl font-mono font-bold ${temaClaro ? 'text-slate-800' : 'text-cyan-300'}`}>
              {horaActual.toLocaleDateString('es-ES')} | {horaActual.toLocaleTimeString('es-ES', { hour12: false })}
            </span>
          </div>

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
                    onClick={() => {
                      setFormNuevo({
                        Medico: '', Area: '', Rol: '', Modulo: '', Hora_Inicio: '', Hora_Fin: '', Fecha: obtenerFechaHoyLocal(), TipoServicio: servicioActivo
                      });
                      setMostrarModalNuevoRegistro(true);
                    }}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Registro</span>
                  </button>

                  <button
                    onClick={() => { setNuevoComunicado(comunicado); setMostrarModalComunicado(true); }}
                    className={`p-2 border rounded-xl transition ${
                      temaClaro ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50' : 'bg-slate-700 hover:bg-slate-600 text-cyan-300 border-slate-600'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {programacion.length > 0 && (
                    <button 
                      onClick={limpiarBaseDatos} 
                      disabled={cargando}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={handleLogout}
                className={`p-2 rounded-xl transition border ${
                  temaClaro ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}
              >
                <Unlock className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setMostrarModalLogin(true)}
              className={`p-2.5 border rounded-xl transition ${
                temaClaro ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 border-slate-700/50'
              }`}
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {comunicado && vistaActiva === 'MONITOR' && (
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
      )}

      {/* VISTA PRINCIPAL */}
      <main ref={mainScrollRef} className="flex-1 p-8 overflow-y-auto relative">
        {vistaActiva === 'USUARIOS' ? (
          <GestionUsuarios temaClaro={temaClaro} />
        ) : (
          <ProgramacionMedica
            agrupadoPorModulo={agrupadoPorModulo}
            servicioActivo={servicioActivo}
            temaClaro={temaClaro}
            rolUsuario={rolUsuario}
            emailUsuarioActivo={emailUsuarioActivo}
            modoTvActivo={modoTvActivo}
            soloTurnoActual={soloTurnoActual}
            modulosSeleccionados={modulosSeleccionados}
            ESTADOS_MEDICO={ESTADOS_MEDICO}
            estaEnTurno={estaEnTurno}
            estaEnUltimaHora={estaEnUltimaHora}
            calcularEstadoInteligente={calcularEstadoInteligente}
            obtenerTiempoTranscurrido={obtenerTiempoTranscurrido}
            obtenerInasistentesPendientes={obtenerInasistentesPendientes}
            listaEspera={listaEspera}
            puedeModificarEstados={puedeModificarEstados}
            cambiarEstadoMedico={cambiarEstadoMedico}
            ingresarAConsultaConPaciente={ingresarAConsultaConPaciente}
            volverALlamarPaciente={volverALlamarPaciente}
            marcarPacienteNoRespondio={marcarPacienteNoRespondio}
            marcarPacienteAtendido={marcarPacienteAtendido}
            marcarInasistenciaDefinitiva={marcarInasistenciaDefinitiva}
            llamarSiguienteCola={llamarSiguienteCola}
            setMedicoParaEditarPaciente={setMedicoParaEditarPaciente}
            setNuevoNombreEditado={setNuevoNombreEditado}
            setMedicoParaCola={setMedicoParaCola}
            setNombrePaciente={setNombrePaciente}
            setMedicoParaLlamar={setMedicoParaLlamar}
            setConsultorioTopico={setConsultorioTopico}
            setMedicoParaReemplazo={setMedicoParaReemplazo}
            restaurarTitular={restaurarTitular}
            abrirModalEditar={abrirModalEditar}
            eliminarRegistroIndividual={eliminarRegistroIndividual}
            horaActual={horaActual}
          />
        )}
      </main>

      {/* MODAL AUDITORÍA */}
      {mostrarModalHistorial && (
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
                  onClick={descargarReporteExcelAuditoria}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shrink-0"
                  title="Descargar reporte de auditoría estructurado en Excel"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Excel</span>
                </button>

                <button onClick={() => setMostrarModalHistorial(false)} className="text-slate-400 hover:text-slate-200 p-1 rounded-xl">
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
                    <button onClick={() => setBusquedaAuditoria('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs">
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
                            <p className="font-mono text-xs font-bold text-slate-300">
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
                            <p className="text-xs text-slate-300 font-medium">Médico: {item.medico}</p>
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
                onClick={() => setMostrarModalHistorial(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL COLA DE ESPERA CON SELECCIÓN DE TRIAJE OFICIAL */}
      {medicoParaCola && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                Agregar a Cola de Espera
              </h3>
              <button onClick={() => setMedicoParaCola(null)} className="text-slate-400 hover:text-slate-200">
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
      )}

      {/* MODAL LLAMAR PACIENTE MANUAL (SOLO ADMIN Y MEDICO) */}
      {medicoParaLlamar && (rolUsuario === 'ADMIN' || rolUsuario === 'MEDICO') && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <Clock className="w-5 h-5 text-rose-500 animate-bounce" />
                Llamado Manual a Pantalla TV
              </h3>
              <button onClick={() => setMedicoParaLlamar(null)} className="text-slate-400 hover:text-slate-200">
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

                <label className="block text-xs font-bold mb-1.5 text-slate-400">Apellidos y Nombres del Nuevo Paciente:</label>
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
      )}

      {/* MODAL CORREGIR NOMBRE PACIENTE */}
      {medicoParaEditarPaciente && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-amber-500">
                <Pencil className="w-5 h-5 text-amber-500" />
                Corregir Nombre del Paciente
              </h3>
              <button onClick={() => setMedicoParaEditarPaciente(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicionNombrePaciente} autoComplete="off" className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-2">
                  Médico: <strong className={temaClaro ? 'text-slate-800' : 'text-white'}>{medicoParaEditarPaciente.Medico}</strong>
                </p>
                <label className="block text-xs font-bold mb-1.5 text-slate-400">Nombre Correcto del Paciente:</label>
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
      )}

      {/* MODAL EDITAR PROGRAMACIÓN */}
      {medicoParaEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" />
                Modificar Programación Médica
              </h3>
              <button onClick={() => setMedicoParaEditar(null)} className="text-slate-400 hover:text-slate-200">
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
      )}

      {/* MODAL NUEVO REGISTRO */}
      {mostrarModalNuevoRegistro && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                Agregar Nuevo Registro Médico
              </h3>
              <button onClick={() => setMostrarModalNuevoRegistro(false)} className="text-slate-400 hover:text-slate-200">
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
      )}

      {/* MODAL SELECCIONAR MÓDULOS */}
      {mostrarModalModulos && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-cyan-500" />
                Seleccionar Módulos
              </h3>
              <button onClick={() => setMostrarModalModulos(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={seleccionarTodosLosModulos}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
              >
                <CheckSquare className="w-4 h-4" /> Seleccionar Todos
              </button>
              <button
                onClick={deseleccionarTodosLosModulos}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition"
              >
                <Square className="w-4 h-4" /> Deseleccionar Todos
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-6">
              {todosLosModulosDisponibles.map((mod, i) => {
                const seleccionado = modulosSeleccionados.includes(mod);
                return (
                  <label
                    key={i}
                    onClick={() => toggleModuloSeleccionado(mod)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      seleccionado
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                        : temaClaro ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold">{mod}</span>
                    {seleccionado ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setMostrarModalModulos(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN */}
      {mostrarModalLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                Acceso al Sistema
              </h3>
              <button onClick={() => setMostrarModalLogin(false)} className="text-slate-400 hover:text-slate-200">
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
                  onChange={(e) => { setEmailInput(e.target.value); setErrorPin(false); }}
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
                  onChange={(e) => { setPasswordInput(e.target.value); setErrorPin(false); }}
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
      )}

      {/* MODAL COMUNICADO */}
      {mostrarModalComunicado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-cyan-500" />
                Editar Comunicado
              </h3>
              <button onClick={() => setMostrarModalComunicado(false)} className="text-slate-400 hover:text-slate-200">
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
      )}

      {/* MODAL REEMPLAZO */}
      {medicoParaReemplazo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-500" />
                Asignar Reemplazo Médico
              </h3>
              <button onClick={() => setMedicoParaReemplazo(null)} className="text-slate-400 hover:text-slate-200">
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
      )}

      {/* MODAL DUPLICADOS EXCEL */}
      {mostrarModalReporte && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-2xl rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-500 animate-bounce" />
                <h3 className="text-lg font-bold">Reporte de Carga: Duplicados Omitidos</h3>
              </div>
              <button onClick={() => setMostrarModalReporte(false)} className="text-slate-400 hover:text-slate-200">
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
                onClick={() => setMostrarModalReporte(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}