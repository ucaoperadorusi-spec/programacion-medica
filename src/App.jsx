import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, getDocs, writeBatch, setDoc, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { 
  Upload, Clock, Activity, Building2, Trash2, Filter, Lock, Unlock, X, 
  CheckCircle, Megaphone, Edit3, MapPin, Tv, Play, Pause, UserCheck, 
  Coffee, UserX, Bell, UserPlus, RefreshCw, Sun, Moon, CheckSquare, 
  Square, SlidersHorizontal, CalendarClock, Shield, Pencil, Plus, Siren 
} from 'lucide-react';

export default function App() {
  const [programacion, setProgramacion] = useState([]);
  const [comunicado, setComunicado] = useState("Bienvenido al H. II PUCALLPA. Recuerde presentar su documento de identidad.");
  const [nuevoComunicado, setNuevoComunicado] = useState("");
  const [horaActual, setHoraActual] = useState(new Date());
  const [cargando, setCargando] = useState(false);
  const [soloTurnoActual, setSoloTurnoActual] = useState(false);

  // Estados para reporte de duplicados en Excel
  const [duplicadosOmitidos, setDuplicadosOmitidos] = useState([]);
  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);

  // Estados para Llamar Paciente en Emergencia
  const [medicoParaLlamar, setMedicoParaLlamar] = useState(null);
  const [nombrePaciente, setNombrePaciente] = useState('');

  // Selección de servicio activo (Consulta Externa vs Emergencia)
  const [servicioActivo, setServicioActivo] = useState('CONSULTA_EXTERNA');

  // Modo Tema (Oscuro por defecto / Claro)
  const [temaClaro, setTemaClaro] = useState(false);

  // Módulos visibles seleccionados
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [mostrarModalModulos, setMostrarModalModulos] = useState(false);

  // Configuración de estados del médico con matices de fondo para cada estado
  const ESTADOS_MEDICO = {
    CONSULTA: { 
      label: "En Consulta", 
      badge: temaClaro 
        ? "bg-emerald-600 text-white font-black shadow-sm" 
        : "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20", 
      cardColor: temaClaro 
        ? "bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/20" 
        : "bg-slate-900/90 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-950/80 ring-1 ring-emerald-500/30",
      icon: UserCheck 
    },
    PROGRAMADO: {
      label: "Próximo Turno",
      badge: temaClaro 
        ? "bg-blue-600 text-white font-black shadow-sm" 
        : "bg-blue-500 text-slate-950 font-black shadow-md shadow-blue-500/20",
      cardColor: temaClaro 
        ? "bg-white border-2 border-blue-400 shadow-md shadow-blue-500/5" 
        : "bg-slate-900/90 border-2 border-slate-700/80 shadow-xl shadow-slate-950",
      icon: CalendarClock
    },
    PAUSA: { 
      label: "En Pausa", 
      badge: temaClaro 
        ? "bg-amber-500 text-white font-black shadow-sm" 
        : "bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20", 
      cardColor: temaClaro 
        ? "bg-white border-2 border-amber-400 shadow-xl shadow-amber-500/10" 
        : "bg-slate-900/90 border-2 border-amber-500/80 shadow-2xl shadow-amber-950/80 ring-1 ring-amber-500/30",
      icon: Coffee 
    },
    AUSENTE: { 
      label: "Ausente", 
      badge: temaClaro 
        ? "bg-rose-600 text-white font-black shadow-sm" 
        : "bg-rose-500 text-white font-black shadow-md shadow-rose-500/20", 
      cardColor: temaClaro 
        ? "bg-white border-2 border-rose-400 shadow-xl shadow-rose-500/10" 
        : "bg-slate-900/90 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/80 ring-1 ring-rose-500/30",
      icon: UserX 
    },
    LLAMANDO: { 
      label: "Llamando...", 
      badge: temaClaro 
        ? "bg-cyan-600 text-white font-black shadow-md animate-pulse" 
        : "bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-400/40 animate-pulse", 
      cardColor: temaClaro 
        ? "bg-cyan-50/90 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20 ring-2 ring-cyan-400/50" 
        : "bg-cyan-950/40 border-2 border-cyan-400 shadow-2xl shadow-cyan-950/90 ring-2 ring-cyan-400/60 animate-pulse",
      icon: Bell 
    },
    CULMINADO: {
      label: "Turno Culminado",
      badge: temaClaro 
        ? "bg-slate-500 text-white font-bold" 
        : "bg-slate-700 text-slate-300 font-bold",
      cardColor: temaClaro 
        ? "bg-slate-100/80 border-2 border-slate-300 opacity-60" 
        : "bg-slate-900/40 border-2 border-slate-800 opacity-40",
      icon: CheckSquare
    }
  };

  // Autenticación y roles
  const [rolUsuario, setRolUsuario] = useState(null);
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalComunicado, setMostrarModalComunicado] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorPin, setErrorPin] = useState(false);

  // Modal para Reemplazo de Emergencia
  const [medicoParaReemplazo, setMedicoParaReemplazo] = useState(null);
  const [nombreReemplazo, setNombreReemplazo] = useState('');

  // Modal para Editar Campos de la Programación (ADMIN)
  const [medicoParaEditar, setMedicoParaEditar] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    Medico: '',
    Area: '',
    Rol: '',
    Modulo: '',
    Hora_Inicio: '',
    Hora_Fin: '',
    Fecha: '',
    TipoServicio: 'CONSULTA_EXTERNA'
  });

  // Modal para Agregar Nuevo Registro Manual (ADMIN)
  const [mostrarModalNuevoRegistro, setMostrarModalNuevoRegistro] = useState(false);
  const [formNuevo, setFormNuevo] = useState({
    Medico: '',
    Area: '',
    Rol: '',
    Modulo: '',
    Hora_Inicio: '',
    Hora_Fin: '',
    Fecha: '',
    TipoServicio: 'CONSULTA_EXTERNA'
  });

  // Modo TV Inteligente
  const [modoTvActivo, setModoTvActivo] = useState(false);
  const [indiceRotacionTv, setIndiceRotacionTv] = useState(0);
  const [cicloTv, setCicloTv] = useState(0);
  const mainScrollRef = useRef(null);

  // Referencia para evitar repetir el audio infinitamente en la TV
  const ultimoLlamadoRef = useRef(null);

  const obtenerFechaHoyLocal = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  const esEspecialidadEmergencia = (area = '', rol = '') => {
    const texto = `${area} ${rol}`.toLowerCase();
    const palabrasClave = ['emergencia', 'triaje', 'shock', 'trauma', 'observacion', 'observación', 'guardia', 'urgencia', 'urgencias'];
    return palabrasClave.some(p => texto.includes(p));
  };

  const hablarNombrePaciente = (nombre, medico) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const texto = `Atención paciente ${nombre}, acercarse con el doctor ${medico}`;
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (servicioActivo !== 'EMERGENCIA') return;

    const medLlamando = programacion.find(
      p => p.TipoServicio === 'EMERGENCIA' && p.estado === 'LLAMANDO' && p.pacienteLlamado
    );

    if (medLlamando) {
      const claveLlamado = `${medLlamando.id}_${medLlamando.pacienteLlamado}`;
      if (ultimoLlamadoRef.current !== claveLlamado) {
        ultimoLlamadoRef.current = claveLlamado;
        hablarNombrePaciente(medLlamando.pacienteLlamado, medLlamando.Medico);
      }
    }
  }, [programacion, servicioActivo]);

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const correosAdmin = ['uca.operadorusi@essalud.gob.pe'];
        if (correosAdmin.includes(user.email.toLowerCase().trim())) {
          setRolUsuario('ADMIN');
        } else {
          setRolUsuario('OPERADOR');
        }
      } else {
        setRolUsuario(null);
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

  useEffect(() => {
    let scrollInterval = null;
    let timeoutAccion = null;
    let isWaiting = false;

    if (modoTvActivo && modulosSeleccionados.length > 0 && mainScrollRef.current) {
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
  }, [modoTvActivo, modulosSeleccionados, indiceRotacionTv, cicloTv]);

  const cambiarEstadoMedico = async (idsDocs, nuevoEstado, estaActivo = false, estaEnUltimaHora = false, medObj = null) => {
    if (nuevoEstado === "LLAMANDO" && servicioActivo === 'EMERGENCIA' && medObj) {
      setMedicoParaLlamar(medObj);
      setNombrePaciente(medObj.pacienteLlamado || '');
      return;
    }

    if (estaActivo && nuevoEstado === "PROGRAMADO") {
      alert("No se puede asignar 'Próximo Turno' a un médico que se encuentra actualmente en turno activo de consultorio.");
      return;
    }

    if (estaActivo && nuevoEstado === "CULMINADO" && !estaEnUltimaHora) {
      alert("Solo se puede marcar como CULMINADO dentro de la última hora del turno activo (60 minutos antes de finalizar).");
      return;
    }

    try {
      const ids = Array.isArray(idsDocs) ? idsDocs : [idsDocs];
      const batch = writeBatch(db);
      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, { 
          estado: nuevoEstado,
          pacienteLlamado: nuevoEstado === "LLAMANDO" ? (medObj?.pacienteLlamado || '') : null
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  const confirmarLlamadaPaciente = async (e) => {
    e.preventDefault();
    if (!medicoParaLlamar || !nombrePaciente.trim()) return;

    const nombreLimpio = nombrePaciente.trim().toUpperCase();
    hablarNombrePaciente(nombreLimpio, medicoParaLlamar.Medico);

    try {
      const ids = Array.isArray(medicoParaLlamar.ids) ? medicoParaLlamar.ids : [medicoParaLlamar.id];
      const batch = writeBatch(db);

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          estado: "LLAMANDO",
          pacienteLlamado: nombreLimpio
        });
      });

      await batch.commit();
      setMedicoParaLlamar(null);
      setNombrePaciente('');
    } catch (err) {
      console.error("Error al registrar llamada de paciente:", err);
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
      alert("Error al guardar reemplazo.");
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
      Medico: med.Medico || '',
      Area: med.Area || '',
      Rol: med.Rol || '',
      Modulo: med.Modulo || '',
      Hora_Inicio: med.horarios?.[0]?.inicio || med.Hora_Inicio || '',
      Hora_Fin: med.horarios?.[0]?.fin || med.Hora_Fin || '',
      Fecha: med.Fecha || obtenerFechaHoyLocal(),
      TipoServicio: tipoServ
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
      alert("Ocurrió un error al guardar los cambios.");
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
      console.error("Error al eliminar registro:", err);
      alert("Error al eliminar el registro.");
    }
  };

  const guardarNuevoRegistro = async (e) => {
    e.preventDefault();
    if (rolUsuario !== 'ADMIN') return;

    try {
      const colRef = collection(db, "programacion_medica");
      await addDoc(colRef, {
        Modulo: formNuevo.Modulo.trim() || "Módulo General",
        Area: formNuevo.Area.trim() || "General",
        Medico: formNuevo.Medico.trim() || "Sin Nombre",
        Rol: formNuevo.Rol.trim() || "Consulta Médica",
        Fecha: formNuevo.Fecha || obtenerFechaHoyLocal(),
        Hora_Inicio: formNuevo.Hora_Inicio.trim() || "--:--",
        Hora_Fin: formNuevo.Hora_Fin.trim() || "--:--",
        TipoServicio: formNuevo.TipoServicio || servicioActivo,
        estado: "CONSULTA"
      });

      setMostrarModalNuevoRegistro(false);
      setFormNuevo({
        Medico: '',
        Area: '',
        Rol: '',
        Modulo: '',
        Hora_Inicio: '',
        Hora_Fin: '',
        Fecha: obtenerFechaHoyLocal(),
        TipoServicio: servicioActivo
      });
    } catch (err) {
      console.error("Error al agregar registro:", err);
      alert("Error al guardar el nuevo registro.");
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

      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;

      const correosAdmin = ['uca.operadorusi@essalud.gob.pe'];
      if (correosAdmin.includes(user.email.toLowerCase())) {
        setRolUsuario('ADMIN');
      } else {
        setRolUsuario('OPERADOR');
      }

      setMostrarModalLogin(false);
      setEmailInput('');
      setPasswordInput('');
    } catch (error) {
      console.error("Error al iniciar sesión:", error.code, error.message);
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
    if (rolUsuario !== 'ADMIN') return;
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
                estado: "CONSULTA"
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
          alert(`¡Carga exitosa! Se guardaron ${registrosProcesadosCount} registros nuevos correctamente.`);
        }

      } catch (err) {
        console.error("Error en la subida:", err);
        alert("Ocurrió un error al procesar el archivo Excel.");
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
        if (item.Fecha && item.Fecha !== fechaHoy) {
          return;
        }

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

  const puedeModificarEstados = rolUsuario === 'ADMIN' || rolUsuario === 'OPERADOR';

  return (
    <div className={`min-h-screen flex flex-col font-sans overflow-hidden h-screen relative transition-colors duration-300 ${
      temaClaro ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-white'
    }`}>
      
      {/* Header Superior */}
      <header className={`px-8 py-4 flex flex-wrap justify-between items-center gap-4 shadow-xl z-20 border-b transition-colors ${
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
                ? `VISTA TV: Proyectando ${moduloActualTv}` 
                : `Mostrando ${modulosSeleccionados.length} de ${todosLosModulosDisponibles.length} módulo(s)`}
            </p>
          </div>
        </div>

        {/* Pestañas Principales */}
        <div className={`flex p-1 rounded-2xl border transition ${
          temaClaro ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/80 border-slate-700'
        }`}>
          <button
            onClick={() => setServicioActivo('CONSULTA_EXTERNA')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              servicioActivo === 'CONSULTA_EXTERNA'
                ? 'bg-blue-600 text-white shadow-lg'
                : temaClaro ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Consulta Externa</span>
          </button>

          <button
            onClick={() => setServicioActivo('EMERGENCIA')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              servicioActivo === 'EMERGENCIA'
                ? 'bg-rose-600 text-white shadow-lg'
                : temaClaro ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Siren className="w-4 h-4 text-rose-400" />
            <span>Emergencia 24H</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            title={temaClaro ? "Modo Oscuro" : "Modo Claro"}
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
                rolUsuario === 'ADMIN' ? 'text-emerald-500' : 'text-amber-400'
              }`}>
                {rolUsuario === 'ADMIN' ? <CheckCircle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                {rolUsuario === 'ADMIN' ? 'Admin' : 'Operador'}
              </span>

              {rolUsuario === 'ADMIN' && (
                <>
                  <button
                    onClick={() => {
                      setFormNuevo({
                        Medico: '',
                        Area: '',
                        Rol: '',
                        Modulo: '',
                        Hora_Inicio: '',
                        Hora_Fin: '',
                        Fecha: obtenerFechaHoyLocal(),
                        TipoServicio: servicioActivo
                      });
                      setMostrarModalNuevoRegistro(true);
                    }}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shadow-lg"
                    title="Agregar Nuevo Registro Manual"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Registro</span>
                  </button>

                  <button
                    onClick={() => { setNuevoComunicado(comunicado); setMostrarModalComunicado(true); }}
                    className={`p-2 border rounded-xl transition ${
                      temaClaro ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50' : 'bg-slate-700 hover:bg-slate-600 text-cyan-300 border-slate-600'
                    }`}
                    title="Editar Anuncio"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {programacion.length > 0 && (
                    <button 
                      onClick={limpiarBaseDatos} 
                      disabled={cargando}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-xl transition"
                      title="Limpiar toda la base de datos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <label className={`flex items-center space-x-2 ${cargando ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-500'} text-white px-3 py-2 rounded-xl cursor-pointer text-xs font-semibold transition shadow-lg`}>
                    <Upload className="w-4 h-4" />
                    <span>{cargando ? "Cargando Excel..." : "Subir Excel"}</span>
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={cargando} className="hidden" />
                  </label>
                </>
              )}

              <button
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
              onClick={() => setMostrarModalLogin(true)}
              className={`p-2.5 border rounded-xl transition ${
                temaClaro ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 border-slate-700/50'
              }`}
              title="Acceso Administrador / Operador"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Marquee del Comunicado Informativo */}
      {comunicado && (
        <div className={`py-2 px-4 border-b flex items-center gap-3 overflow-hidden ${
          temaClaro ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-blue-950/40 border-blue-900/50 text-blue-300'
        }`}>
          <style>
            {`
              @keyframes scroll-text {
                0% { transform: translateX(0); }
                100% { transform: translateX(-100%); }
              }
              .animacion-marquee {
                display: inline-block;
                padding-left: 100%;
                animation: scroll-text 25s linear infinite;
              }
            `}
          </style>
          
          <Megaphone className="w-4 h-4 shrink-0 text-cyan-500 animate-bounce relative z-10" />
          
          <div className="overflow-hidden w-full whitespace-nowrap">
            <p className="animacion-marquee text-xs font-semibold tracking-wide uppercase">
              {comunicado}
            </p>
          </div>
        </div>
      )}

      {/* Vista Principal de la Programación */}
      <main ref={mainScrollRef} className="flex-1 p-8 overflow-y-auto relative">
        {Object.keys(agrupadoPorModulo).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
            <Activity className="w-16 h-16 text-slate-400 animate-bounce" />
            <p className="text-xl font-medium text-center">
              {modulosSeleccionados.length === 0
                ? "No hay ningún módulo seleccionado. Haz clic en 'Módulos' arriba para activarlos."
                : soloTurnoActual 
                  ? `No hay personal médico atendiendo en este momento en ${servicioActivo === 'EMERGENCIA' ? 'Emergencia' : 'Consulta Externa'}.` 
                  : `No hay programación cargada o filtrada para el área de ${servicioActivo === 'EMERGENCIA' ? 'Emergencia' : 'Consulta Externa'}.`}
            </p>
          </div>
        ) : (
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

                {/* Tarjetas de los Médicos */}
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

                      const pesoA = prioridad[estadoA] || 10;
                      const pesoB = prioridad[estadoB] || 10;

                      if (pesoA === pesoB) {
                        return (a.Medico || "").localeCompare(b.Medico || "");
                      }

                      return pesoA - pesoB;
                    })
                    .map((med, mIdx) => {
                      const estaActivoAhora = estaEnTurno(med.horarios);
                      const enUltimaHora = estaEnUltimaHora(med.horarios);
                      const estadoClave = calcularEstadoInteligente(med, estaActivoAhora);
                      const configEstado = ESTADOS_MEDICO[estadoClave] || ESTADOS_MEDICO.PROGRAMADO;
                      const IconoEstado = configEstado.icon;

                      return (
                        <div 
                          key={mIdx} 
                          className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${configEstado.cardColor}`}
                        >
                          <div>
                            {/* Cabecera: Nombre y Botones de Edición / Eliminar */}
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className={`font-bold text-lg leading-snug ${temaClaro ? 'text-slate-900' : 'text-white'}`}>
                                  {med.Medico}
                                </h3>
                                {med.esReemplazo && med.medicoTitular && (
                                  <p className="text-[11px] text-purple-500 italic font-medium">
                                    Reemplaza a: {med.medicoTitular}
                                  </p>
                                )}

                                {/* Aviso de Paciente Llamado (Solo Emergencia) */}
                                {servicioActivo === 'EMERGENCIA' && estadoClave === "LLAMANDO" && med.pacienteLlamado && (
                                  <div className={`mt-3 p-3 rounded-2xl border-2 flex items-center gap-2.5 shadow-lg ${
                                    temaClaro 
                                      ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-rose-500/10' 
                                      : 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-rose-950/50'
                                  } animate-pulse`}>
                                    <Bell className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
                                    <div className="overflow-hidden">
                                      <p className={`text-[10px] uppercase font-bold tracking-wider ${temaClaro ? 'text-rose-700' : 'text-rose-400'}`}>
                                        Atendiendo a / Llamando a:
                                      </p>
                                      <p className={`text-sm font-black leading-tight truncate ${temaClaro ? 'text-rose-950' : 'text-white'}`}>
                                        {med.pacienteLlamado}
                                      </p>
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
                                      title="Editar Campos del Registro"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => eliminarRegistroIndividual(med)}
                                      className="p-1.5 rounded-lg border bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20 transition"
                                      title="Eliminar este Registro"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Badges de Área y Rol */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                temaClaro 
                                  ? 'bg-slate-200 text-slate-800 border border-slate-300' 
                                  : 'bg-slate-800 text-slate-200 border border-slate-700'
                              }`}>
                                {med.Area || "General"}
                              </span>
                              {med.Rol && (
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  temaClaro 
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                                    : 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
                                }`}>
                                  {med.Rol}
                                </span>
                              )}
                            </div>

                            {/* Horarios / Turnos */}
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

                          {/* 🔴 NUEVO: PANEL DE ESTADO Y CONTROLES CON FONDO MARCADO Y ESTRUCTURA */}
                          <div className={`mt-2 p-3 rounded-xl border space-y-3 ${
                            temaClaro 
                              ? 'bg-slate-100/90 border-slate-200/80 shadow-inner' 
                              : 'bg-slate-950/60 border-slate-800/80 shadow-inner'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${configEstado.badge}`}>
                                <IconoEstado className="w-3.5 h-3.5" />
                                <span>{configEstado.label}</span>
                              </div>

                              {puedeModificarEstados && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setMedicoParaReemplazo(med)}
                                    className={`p-1.5 rounded-lg border transition ${
                                      temaClaro ? 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50' : 'bg-purple-900/40 text-purple-300 border-purple-700/50 hover:bg-purple-800/50'
                                    }`}
                                    title="Asignar Reemplazo"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                  </button>
                                  {med.esReemplazo && (
                                    <button
                                      onClick={() => restaurarTitular(med)}
                                      className={`p-1.5 rounded-lg border transition ${
                                        temaClaro ? 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50' : 'bg-amber-900/40 text-amber-300 border-amber-700/50 hover:bg-amber-800/50'
                                      }`}
                                      title="Restaurar Titular"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Botonera de Estados */}
                            {puedeModificarEstados && (
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 pt-1">
                                {Object.keys(ESTADOS_MEDICO).map((key) => {
                                  const activeState = estadoClave === key;

                                  let esBloqueado = false;
                                  let tooltipBloqueo = ESTADOS_MEDICO[key].label;

                                  if (estaActivoAhora && key === "PROGRAMADO") {
                                    esBloqueado = true;
                                    tooltipBloqueo = "Deshabilitado: El profesional ya se encuentra atendiendo en turno activo";
                                  } else if (estaActivoAhora && key === "CULMINADO" && !enUltimaHora) {
                                    esBloqueado = true;
                                    tooltipBloqueo = "Habilitado solo dentro de la última hora de la programación (60 min antes de finalizar)";
                                  }

                                  return (
                                    <button
                                      key={key}
                                      disabled={esBloqueado}
                                      onClick={() => cambiarEstadoMedico(med.ids, key, estaActivoAhora, enUltimaHora, med)}
                                      title={tooltipBloqueo}
                                      className={`py-1.5 text-[10px] font-black tracking-wider rounded-lg border transition shadow-sm ${
                                        esBloqueado
                                          ? 'bg-slate-200/50 text-slate-400 border-slate-300/50 opacity-40 cursor-not-allowed dark:bg-slate-800/20 dark:text-slate-600 dark:border-slate-800/50'
                                          : activeState
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30 ring-2 ring-blue-400/50'
                                            : temaClaro
                                              ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
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
        )}
      </main>

      {/* Modales mantenidos intactos */}
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
                  <label className="block text-xs font-bold mb-1 text-slate-400">Servicio / Área Principal:</label>
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
                  <label className="block text-xs font-bold mb-1 text-slate-400">Médico / Profesional:</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
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
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
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
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
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
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    value={formEdicion.Modulo}
                    onChange={(e) => setFormEdicion({ ...formEdicion, Modulo: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">Hora Inicio (HH:MM):</label>
                  <input
                    type="time"
                    required
                    autoComplete="off"
                    value={formEdicion.Hora_Inicio}
                    onChange={(e) => setFormEdicion({ ...formEdicion, Hora_Inicio: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">Hora Fin (HH:MM):</label>
                  <input
                    type="time"
                    required
                    autoComplete="off"
                    value={formEdicion.Hora_Fin}
                    onChange={(e) => setFormEdicion({ ...formEdicion, Hora_Fin: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">Fecha de Programación:</label>
                  <input
                    type="date"
                    required
                    autoComplete="off"
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
                  <label className="block text-xs font-bold mb-1 text-slate-400">Nombre del Médico:</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
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
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
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
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="Ej. Consulta Médica / Emergencia"
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
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="Ej. Módulo 01 / Shock Trauma"
                    value={formNuevo.Modulo}
                    onChange={(e) => setFormNuevo({ ...formNuevo, Modulo: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">Hora Inicio (HH:MM):</label>
                  <input
                    type="time"
                    required
                    autoComplete="off"
                    value={formNuevo.Hora_Inicio}
                    onChange={(e) => setFormNuevo({ ...formNuevo, Hora_Inicio: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">Hora Fin (HH:MM):</label>
                  <input
                    type="time"
                    required
                    autoComplete="off"
                    value={formNuevo.Hora_Fin}
                    onChange={(e) => setFormNuevo({ ...formNuevo, Hora_Fin: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">Fecha de Programación:</label>
                  <input
                    type="date"
                    required
                    autoComplete="off"
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
              {todosLosModulosDisponibles.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">No hay módulos cargados.</p>
              ) : (
                todosLosModulosDisponibles.map((mod, i) => {
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
                })
              )}
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

      {mostrarModalLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                Acceso Administrador / Operador
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
                  autoComplete="off"
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
                  autoComplete="off"
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
                <p className="text-red-400 text-xs text-center font-semibold">Credenciales no válidas o no registradas.</p>
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
          </div>
        </div>
      )}

      {mostrarModalComunicado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-cyan-500" />
                Editar Comunicado Informativo
              </h3>
              <button onClick={() => setMostrarModalComunicado(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarComunicado} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-400">Mensaje a mostrar en la marquesina:</label>
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
                <label className="block text-xs font-bold mb-1.5 text-slate-400">Nombre del Médico Reemplazante:</label>
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
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
      
      {mostrarModalReporte && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-2xl rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
                <h3 className="text-lg font-bold">Reporte de Carga: Duplicados Omitidos</h3>
              </div>
              <button onClick={() => setMostrarModalReporte(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Se detectaron <strong className="text-amber-500">{duplicadosOmitidos.length} registro(s) duplicado(s)</strong> en el archivo Excel o ya existentes en el sistema. Estos registros no se volvieron a cargar:
            </p>

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

      {medicoParaLlamar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <Bell className="w-5 h-5 text-rose-500 animate-bounce" />
                Llamar Paciente a Pantalla TV
              </h3>
              <button onClick={() => setMedicoParaLlamar(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={confirmarLlamadaPaciente} autoComplete="off" className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-2">
                  Médico a cargo: <strong className={temaClaro ? 'text-slate-800' : 'text-white'}>{medicoParaLlamar.Medico}</strong>
                </p>
                <label className="block text-xs font-bold mb-1.5 text-slate-400">Apellidos y Nombres del Paciente:</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  placeholder="EJ. PÉREZ GARCÍA JUAN"
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
                  onClick={() => setMedicoParaLlamar(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 transition shadow-lg flex items-center gap-1.5"
                >
                  <Bell className="w-4 h-4" />
                  Llamar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}