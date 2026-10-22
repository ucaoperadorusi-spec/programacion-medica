import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useRef, 
  useMemo, 
  useCallback 
} from 'react';
import { db, auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc, 
  getDocs, 
  writeBatch, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

import { getEstadosMedico, OpcionesTriaje, pesoPrioridadMap } from '../constants';
import { 
  obtenerFechaHoyLocal, 
  obtenerTiempoTranscurrido, 
  esEspecialidadEmergencia,
  estaEnTurno as calcEstaEnTurno,
  estaEnUltimaHora as calcEstaEnUltimaHora,
  estaEnVentanaAnticipada as calcEstaEnVentanaAnticipada,
  calcularEstadoInteligente as calcEstadoInteligente
} from '../utils/horarios';
import { 
  getFieldValue, 
  generarReporteExcelAuditoria,
  parseExcelCitasConsultaExterna
} from '../utils/excel';
import { useToast } from '../components/Toast';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const toast = useToast();

  // Detección de parámetros URL iniciales (Deep linking para Smart TVs)
  const getParametrosIniciales = () => {
    if (typeof window === 'undefined') return { servicio: 'CONSULTA_EXTERNA', tv: false };
    try {
      const params = new URLSearchParams(window.location.search);
      const tvParam = params.get('tv');
      const servicioParam = params.get('servicio');
      let serv = 'CONSULTA_EXTERNA';
      let tv = false;
      if (tvParam !== null) {
        tv = true;
        const val = String(tvParam).toLowerCase();
        if (val === 'emergencia' || val === 'emerg') serv = 'EMERGENCIA';
        else if (val === 'consulta' || val === 'consulta_externa') serv = 'CONSULTA_EXTERNA';
      }
      if (servicioParam) {
        const val = String(servicioParam).toLowerCase();
        if (val === 'emergencia' || val === 'emerg') serv = 'EMERGENCIA';
        else if (val === 'consulta' || val === 'consulta_externa') serv = 'CONSULTA_EXTERNA';
      }
      return { servicio: serv, tv };
    } catch {
      return { servicio: 'CONSULTA_EXTERNA', tv: false };
    }
  };

  const paramsInit = useMemo(() => getParametrosIniciales(), []);

  // Estados Generales
  const [programacion, setProgramacion] = useState([]);
  const [comunicado, setComunicado] = useState("Bienvenido al H. II PUCALLPA. Recuerde presentar su documento de identidad.");
  const [nuevoComunicado, setNuevoComunicado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [soloTurnoActual, setSoloTurnoActual] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('MONITOR');
  const [servicioActivo, setServicioActivo] = useState(paramsInit.servicio);
  const [temaClaro, setTemaClaro] = useState(false);

  // Módulos independientes por canal con persistencia en localStorage
  const [modulosSeleccionadosConsulta, setModulosSeleccionadosConsulta] = useState(() => {
    try {
      const guardados = localStorage.getItem('modulos_consulta');
      return guardados ? JSON.parse(guardados) : [];
    } catch { return []; }
  });

  const [modulosSeleccionadosEmergencia, setModulosSeleccionadosEmergencia] = useState(() => {
    try {
      const guardados = localStorage.getItem('modulos_emergencia');
      return guardados ? JSON.parse(guardados) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('modulos_consulta', JSON.stringify(modulosSeleccionadosConsulta));
    } catch {}
  }, [modulosSeleccionadosConsulta]);

  useEffect(() => {
    try {
      localStorage.setItem('modulos_emergencia', JSON.stringify(modulosSeleccionadosEmergencia));
    } catch {}
  }, [modulosSeleccionadosEmergencia]);

  const modulosSeleccionados = useMemo(() => {
    return servicioActivo === 'EMERGENCIA' ? modulosSeleccionadosEmergencia : modulosSeleccionadosConsulta;
  }, [servicioActivo, modulosSeleccionadosEmergencia, modulosSeleccionadosConsulta]);

  const [mostrarModalModulos, setMostrarModalModulos] = useState(false);

  // Estados de Usuario & Autenticación
  const [rolUsuario, setRolUsuario] = useState(null);
  const [servicioPermitidoUsuario, setServicioPermitidoUsuario] = useState('TODOS');
  const [medicoAsignadoUsuario, setMedicoAsignadoUsuario] = useState('');
  const [emailUsuarioActivo, setEmailUsuarioActivo] = useState('');
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalComunicado, setMostrarModalComunicado] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorPin, setErrorPin] = useState(false);

  // Citas y Pacientes de Consulta Externa (Carga Masiva Excel & Manual)
  const [citasConsultaExterna, setCitasConsultaExterna] = useState([]);
  const [medicoParaSubirCitas, setMedicoParaSubirCitas] = useState(null);
  const [mostrarModalSubirCitas, setMostrarModalSubirCitas] = useState(false);
  const [medicoParaCitaManual, setMedicoParaCitaManual] = useState(null);
  const [mostrarModalCitaManual, setMostrarModalCitaManual] = useState(false);

  // Estados de Llamado & Cola
  const [medicoParaLlamar, setMedicoParaLlamar] = useState(null);
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [consultorioTopico, setConsultorioTopico] = useState('');
  const [accionPacienteAnterior, setAccionPacienteAnterior] = useState('FINALIZAR_ATENDIDO');
  const [listaEspera, setListaEspera] = useState([]);
  const [medicoParaCola, setMedicoParaCola] = useState(null);
  const [nivelTriaje, setNivelTriaje] = useState('VERDE');

  // Corrección de Paciente
  const [medicoParaEditarPaciente, setMedicoParaEditarPaciente] = useState(null);
  const [nuevoNombreEditado, setNuevoNombreEditado] = useState('');

  // Reemplazo Médico
  const [medicoParaReemplazo, setMedicoParaReemplazo] = useState(null);
  const [nombreReemplazo, setNombreReemplazo] = useState('');

  // Edición / Alta de Programación
  const [medicoParaEditar, setMedicoParaEditar] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    Medico: '', Area: '', Rol: '', Modulo: '', Hora_Inicio: '', Hora_Fin: '', Fecha: '', TipoServicio: 'CONSULTA_EXTERNA'
  });
  const [mostrarModalNuevoRegistro, setMostrarModalNuevoRegistro] = useState(false);
  const [formNuevo, setFormNuevo] = useState({
    Medico: '', Area: '', Rol: '', Modulo: '', Hora_Inicio: '', Hora_Fin: '', Fecha: '', TipoServicio: 'CONSULTA_EXTERNA'
  });

  // Reporte de Carga Excel
  const [duplicadosOmitidos, setDuplicadosOmitidos] = useState([]);
  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);

  // Historial & Auditoría
  const [historialLlamados, setHistorialLlamados] = useState([]);
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [busquedaAuditoria, setBusquedaAuditoria] = useState('');
  const [filtroEtapaAuditoria, setFiltroEtapaAuditoria] = useState('TODOS');
  const [filaExpandidaAuditoria, setFilaExpandidaAuditoria] = useState(null);

  // Modo TV
  const [modoTvActivo, setModoTvActivo] = useState(paramsInit.tv);
  const [indiceRotacionTv, setIndiceRotacionTv] = useState(0);
  const [cicloTv, setCicloTv] = useState(0);
  const mainScrollRef = useRef(null);

  // Sistema de Voceo por Voz (SpeechSynthesis)
  const colaLlamadosRef = useRef([]);
  const reproduciendoAudioRef = useRef(false);
  const llamadosProcesadosRef = useRef(new Set());

  // Reloj de estado sincronizado cada 15 segundos para turnos (evita re-renders cada segundo)
  const [horaReferencia, setHoraReferencia] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setHoraReferencia(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const ESTADOS_MEDICO = useMemo(() => getEstadosMedico(temaClaro), [temaClaro]);

  // Wrappers de cálculo de turnos
  const estaEnTurno = useCallback((horarios) => calcEstaEnTurno(horarios, horaReferencia), [horaReferencia]);
  const estaEnUltimaHora = useCallback((horarios) => calcEstaEnUltimaHora(horarios, horaReferencia), [horaReferencia]);
  const estaEnVentanaAnticipada = useCallback((horarios) => calcEstaEnVentanaAnticipada(horarios, horaReferencia), [horaReferencia]);
  const calcularEstadoInteligente = useCallback((med, activo) => calcEstadoInteligente(med, activo, horaReferencia), [horaReferencia]);
  const obtenerTiempoTranscurridoRef = useCallback((iso) => obtenerTiempoTranscurrido(iso, horaReferencia), [horaReferencia]);

  // Autenticación en tiempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const emailLimpio = user.email.toLowerCase().trim();
        setEmailUsuarioActivo(emailLimpio);

        try {
          const userDocRef = doc(db, "usuarios", emailLimpio);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists() && userSnap.data().activo !== false) {
            const dataUser = userSnap.data();
            const rolDB = dataUser.rol || 'OPERADOR';
            const servPermitido = dataUser.servicio || 'TODOS';
            const medAsignado = dataUser.medicoAsignado || '';
            setRolUsuario(rolDB);
            setServicioPermitidoUsuario(servPermitido);
            setMedicoAsignadoUsuario(medAsignado);

            // Restricción estricta de área según el perfil configurado
            if (servPermitido === 'EMERGENCIA' || rolDB === 'ADMISION') {
              setServicioActivo('EMERGENCIA');
            } else if (servPermitido === 'CONSULTA_EXTERNA') {
              setServicioActivo('CONSULTA_EXTERNA');
            }
          } else {
            setRolUsuario('OPERADOR');
            setServicioPermitidoUsuario('TODOS');
            setMedicoAsignadoUsuario('');
          }
        } catch (e) {
          console.error("Error al obtener rol del usuario:", e);
          setRolUsuario('OPERADOR');
          setServicioPermitidoUsuario('TODOS');
          setMedicoAsignadoUsuario('');
        }
      } else {
        setRolUsuario(null);
        setServicioPermitidoUsuario('TODOS');
        setMedicoAsignadoUsuario('');
        setEmailUsuarioActivo('');
      }
    });
    return () => unsubscribe();
  }, []);

  // Suscripción a Programación Médica
  useEffect(() => {
    const q = collection(db, "programacion_medica");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProgramacion(datos);
    });
    return () => unsubscribe();
  }, []);

  // Módulos disponibles estrictamente filtrados por el servicio activo
  const todosLosModulosDisponibles = useMemo(() => {
    const filtrados = programacion.filter(item => {
      const esEmerg = item.TipoServicio === 'EMERGENCIA' || esEspecialidadEmergencia(item.Area, item.Rol);
      return servicioActivo === 'EMERGENCIA' ? esEmerg : !esEmerg;
    });
    return Array.from(
      new Set(filtrados.map(item => item.Modulo || "Módulo General"))
    ).sort();
  }, [programacion, servicioActivo]);

  // Sincronización automática de módulos por canal
  useEffect(() => {
    if (todosLosModulosDisponibles.length === 0) return;

    if (servicioActivo === 'EMERGENCIA') {
      setModulosSeleccionadosEmergencia(prev => {
        if (prev.length === 0) return todosLosModulosDisponibles;
        const validos = prev.filter(m => todosLosModulosDisponibles.includes(m));
        return validos.length > 0 ? validos : todosLosModulosDisponibles;
      });
    } else {
      setModulosSeleccionadosConsulta(prev => {
        if (prev.length === 0) return todosLosModulosDisponibles;
        const validos = prev.filter(m => todosLosModulosDisponibles.includes(m));
        return validos.length > 0 ? validos : todosLosModulosDisponibles;
      });
    }
  }, [todosLosModulosDisponibles, servicioActivo]);

  // Suscripción a Lista de Espera (optimizada para hoy)
  useEffect(() => {
    const hoy = obtenerFechaHoyLocal();
    const q = query(
      collection(db, "lista_espera"),
      where("fecha", "==", hoy),
      where("estado", "==", "ESPERANDO")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaEspera(datos);
    });
    return () => unsub();
  }, []);

  // Suscripción a Citas de Consulta Externa (Pacientes citados de hoy)
  useEffect(() => {
    const hoy = obtenerFechaHoyLocal();
    const q = query(
      collection(db, "citas_consulta_externa"),
      where("fecha", "==", hoy)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      datos.sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
      setCitasConsultaExterna(datos);
    }, (error) => {
      console.error("Error en suscripción a citas_consulta_externa:", error);
    });
    return () => unsub();
  }, []);

  // Suscripción al Comunicado Global
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

  // Suscripción a Historial de Llamados y Auditoría
  useEffect(() => {
    const q = collection(db, "historial_llamados");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      datos.sort((a, b) => new Date(b.fechaIso || 0).getTime() - new Date(a.fechaIso || 0).getTime());
      setHistorialLlamados(datos);
    }, (error) => {
      console.error("Error en suscripción a historial_llamados:", error);
    });
    return () => unsubscribe();
  }, []);

  // Voceo por voz
  const procesarSiguienteLlamado = useCallback(() => {
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
  }, []);

  const agregarAColaDeLlamados = useCallback((nombre, medico, consultorio = '') => {
    colaLlamadosRef.current.push({ nombre, medico, consultorio });
    procesarSiguienteLlamado();
  }, [procesarSiguienteLlamado]);

  // Detección de llamados en vivo para vocear (tanto en Emergencia como en Consulta Externa según el canal activo)
  useEffect(() => {
    programacion.forEach(p => {
      const esEmerg = p.TipoServicio === 'EMERGENCIA' || esEspecialidadEmergencia(p.Area, p.Rol);
      const coincideServicio = servicioActivo === 'EMERGENCIA' ? esEmerg : !esEmerg;
      if (!coincideServicio) return;

      if (p.estado === 'LLAMANDO' && p.pacienteLlamado && p.estadoUltimoCambio) {
        const claveUnicaLlamado = `${p.id}_${p.pacienteLlamado}_${p.estadoUltimoCambio}`;
        const tiempoCambio = new Date(p.estadoUltimoCambio).getTime();
        const segundosDesdeLlamado = (Date.now() - tiempoCambio) / 1000;

        if (!llamadosProcesadosRef.current.has(claveUnicaLlamado)) {
          llamadosProcesadosRef.current.add(claveUnicaLlamado);
          if (segundosDesdeLlamado < 15) {
            agregarAColaDeLlamados(p.pacienteLlamado, p.Medico, p.consultorioTopico || p.Modulo || '');
          }
        }
      }
    });
  }, [programacion, servicioActivo, agregarAColaDeLlamados]);

  // Rotación Automática en Modo TV
  const medicoLlamandoEnVivo = useMemo(() => {
    return programacion.find(p => {
      if (p.estado !== 'LLAMANDO' || !p.pacienteLlamado) return false;
      const esEmerg = p.TipoServicio === 'EMERGENCIA' || esEspecialidadEmergencia(p.Area, p.Rol);
      const coincideServicio = (servicioActivo === 'EMERGENCIA' && esEmerg) || 
                               (servicioActivo === 'CONSULTA_EXTERNA' && !esEmerg);
      if (!coincideServicio) return false;
      return modulosSeleccionados.includes(p.Modulo || "Módulo General");
    });
  }, [programacion, servicioActivo, modulosSeleccionados]);

  const moduloActualTv = modoTvActivo && modulosSeleccionados.length > 0 
    ? modulosSeleccionados[indiceRotacionTv % modulosSeleccionados.length] 
    : null;

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
  }, [medicoLlamandoEnVivo, modoTvActivo, modulosSeleccionados, indiceRotacionTv]);

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

  // Auditoría en Firestore
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

  // Manejadores de Autenticación
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
          toast.error("Acceso denegado: Tu cuenta se encuentra inactiva. Contacta al administrador.");
          return;
        }
      }

      setMostrarModalLogin(false);
      setEmailInput('');
      setPasswordInput('');
      toast.success("Sesión iniciada correctamente.");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setErrorPin(true);
      toast.error("Credenciales incorrectas o problema de conexión.");
    }
  };

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
          toast.error("Acceso denegado: Tu cuenta se encuentra inactiva.");
          return;
        }
      }

      setMostrarModalLogin(false);
      toast.success("Autenticado con Google correctamente.");
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setErrorPin(true);
      toast.error("No se pudo iniciar sesión con Google.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setRolUsuario(null);
      setServicioPermitidoUsuario('TODOS');
      setMedicoAsignadoUsuario('');
      setEmailUsuarioActivo('');
      setVistaActiva('MONITOR');
      toast.info("Sesión cerrada.");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  // Modificar Estados Médicos
  const cambiarEstadoMedico = async (idsDocs, nuevoEstado, estaActivo = false, estaEnUltimaHoraFlag = false, medObj = null, enVentanaAnticipadaFlag = false) => {
    const esActivacionAnticipada = enVentanaAnticipadaFlag && nuevoEstado === 'CONSULTA';

    if (!estaActivo && !esActivacionAnticipada) {
      toast.warn("El médico no se encuentra en turno activo ni dentro de la hora previa de inicio.");
      return;
    }

    if (servicioActivo === 'EMERGENCIA' && rolUsuario === 'ADMISION') {
      if (nuevoEstado !== 'PAUSA' && nuevoEstado !== 'AUSENTE' && nuevoEstado !== 'CONSULTA') {
        toast.warn("El perfil de Admisión solo puede asignar: 'En Consulta', 'En Pausa' o 'Ausente'.");
        return;
      }
    }

    if (nuevoEstado === "LLAMANDO") {
      if (rolUsuario === 'ADMISION' || rolUsuario === 'OPERADOR') {
        toast.warn("Su perfil no tiene permitido realizar el voceo/llamado de pacientes.");
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
      toast.warn("No se puede asignar 'Próximo Turno' a un médico en turno activo.");
      return;
    }

    if (estaActivo && nuevoEstado === "CULMINADO" && !estaEnUltimaHoraFlag) {
      toast.warn("Solo se puede marcar como CULMINADO dentro de la última hora del turno.");
      return;
    }

    try {
      const rawIds = Array.isArray(idsDocs) ? idsDocs : [idsDocs];
      const validIds = rawIds.filter(id => typeof id === 'string' && id.trim().length > 0);

      if (validIds.length === 0) {
        if (medObj?.id && typeof medObj.id === 'string') {
          validIds.push(medObj.id);
        } else {
          toast.error("No se encontró el identificador del registro a actualizar.");
          return;
        }
      }

      const batch = writeBatch(db);
      const ahoraIso = new Date().toISOString();

      validIds.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        const updateData = { 
          estado: nuevoEstado,
          estadoUltimoCambio: ahoraIso
        };

        if (nuevoEstado === "LLAMANDO") {
          updateData.pacienteLlamado = medObj?.pacienteLlamado || '';
        } else if (nuevoEstado === "CULMINADO") {
          updateData.pacienteLlamado = null;
          updateData.nivelTriajeLlamado = null;
          updateData.horaIngresoConsulta = null;
        }

        batch.update(medRef, updateData);
      });

      await batch.commit();
      toast.success(`Estado actualizado a ${nuevoEstado}`);
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      toast.error(`Error al actualizar estado: ${err.message || 'Error en la base de datos'}`);
    }
  };

  // Cola de Espera (Triaje)
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
        toast.warn(`El paciente "${nombreLimpio}" ya está en la lista de espera de este médico.`);
        setCargando(false);
        return;
      }

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
      toast.success(`Paciente "${nombreLimpio}" agregado a la cola.`);
    } catch (err) {
      console.error("Error al encolar paciente:", err);
      toast.error("Ocurrió un error al registrar el paciente.");
    } finally {
      setCargando(false);
    }
  };

  const llamarSiguienteCola = async (medObj, pacienteEnCola) => {
    if (!medObj || !pacienteEnCola || cargando) return;

    if (rolUsuario === 'ADMISION' || rolUsuario === 'OPERADOR') {
      toast.warn("Su perfil no tiene permitido realizar el llamado de pacientes a pantalla.");
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
      toast.success(`Llamando a ${pacienteEnCola.paciente}`);
    } catch (err) {
      console.error("Error llamando al siguiente en cola:", err);
      toast.error("Error al realizar el llamado.");
    } finally {
      setCargando(false);
    }
  };

  const confirmarLlamadaPaciente = async (e) => {
    e.preventDefault();
    if (!medicoParaLlamar || !nombrePaciente.trim() || cargando) return;

    if (rolUsuario === 'ADMISION' || rolUsuario === 'OPERADOR') {
      toast.warn("Su perfil no tiene permitido realizar el llamado de pacientes.");
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

      ids.forEach(idDoc => {
        const medRef = doc(db, "programacion_medica", idDoc);
        batch.update(medRef, {
          estado: 'LLAMANDO',
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
      toast.success(`Llamando a paciente ${nombreLimpio}`);
    } catch (err) {
      console.error("Error al ingresar/llamar paciente:", err);
      toast.error("Error al ejecutar el llamado.");
    } finally {
      setCargando(false);
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

      // Sincronizar con cita de Consulta Externa si existe
      if (servicioActivo === 'CONSULTA_EXTERNA') {
        const citaMatch = citasConsultaExterna.find(c => 
          (c.id === medObj.citaIdActual) || 
          (c.medico === medObj.Medico && c.paciente === pacienteNombre && c.situacion !== 'ATENDIDA')
        );
        if (citaMatch) {
          await updateDoc(doc(db, "citas_consulta_externa", citaMatch.id), {
            situacion: 'EN_CONSULTA',
            horaInicioConsulta: ahoraIso
          });
        }
      }

      toast.success(`Paciente ${pacienteNombre} ingresó a consulta.`);
    } catch (err) {
      console.error("Error al registrar ingreso a consulta:", err);
      toast.error("Error al registrar ingreso a consulta.");
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
          citaIdActual: null,
          nivelTriajeLlamado: null,
          horaIngresoConsulta: null,
          estadoUltimoCambio: ahoraIso
        });
      });

      await batch.commit();

      // Sincronizar con cita de Consulta Externa (pasa de PENDIENTE/EN_CONSULTA a ATENDIDA)
      if (servicioActivo === 'CONSULTA_EXTERNA') {
        const citaMatch = citasConsultaExterna.find(c => 
          (c.id === medObj.citaIdActual) || 
          (c.medico === medObj.Medico && c.paciente === pacienteNombre && c.situacion !== 'ATENDIDA')
        );
        if (citaMatch) {
          await updateDoc(doc(db, "citas_consulta_externa", citaMatch.id), {
            situacion: 'ATENDIDA',
            horaFinConsulta: ahoraIso
          });
        }
      }

      toast.success(`Atención de ${pacienteNombre} finalizada con éxito (ATENDIDA).`);
    } catch (err) {
      console.error("Error al marcar como atendido:", err);
      toast.error("Error al registrar paciente atendido.");
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
          citaIdActual: null,
          nivelTriajeLlamado: null,
          horaIngresoConsulta: null,
          estadoUltimoCambio: ahoraIso
        });
      });

      await batch.commit();

      // Sincronizar con cita de Consulta Externa
      if (servicioActivo === 'CONSULTA_EXTERNA') {
        const citaMatch = citasConsultaExterna.find(c => 
          (c.id === medObj.citaIdActual) || 
          (c.medico === medObj.Medico && c.paciente === pacienteNombre && c.situacion !== 'ATENDIDA')
        );
        if (citaMatch) {
          await updateDoc(doc(db, "citas_consulta_externa", citaMatch.id), {
            situacion: 'NO_RESPONDIO',
            horaNoRespondio: ahoraIso
          });
        }
      }

      toast.warn(`Paciente ${pacienteNombre} registrado como 'No Respondió'.`);
    } catch (err) {
      console.error("Error al registrar no respondió:", err);
      toast.error("Error al actualizar registro.");
    }
  };

  const volverALlamarPaciente = async (medObj, nombreDirecto = null) => {
    if (rolUsuario === 'ADMISION' || rolUsuario === 'OPERADOR') {
      toast.warn("Su perfil no tiene permitido realizar el voceo/llamado.");
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
      toast.info(`Re-llamando al paciente ${pacienteAVisar}`);
    } catch (err) {
      console.error("Error al re-llamar paciente:", err);
      toast.error("Error al re-llamar paciente.");
    }
  };

  const marcarInasistenciaDefinitiva = async (medObj, pacienteNombre) => {
    if (!medObj || !pacienteNombre) return;
    if (!window.confirm(`¿Seguro que desea registrar la INASISTENCIA DEFINITIVA de ${pacienteNombre}?`)) return;

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
      toast.warn(`Inasistencia definitiva registrada para ${pacienteNombre}.`);
    } catch (err) {
      console.error("Error al registrar inasistencia:", err);
      toast.error("Error al guardar inasistencia.");
    }
  };

  // ===== GESTIÓN DE CITAS DE CONSULTA EXTERNA (EXCEL Y MANUAL) =====

  // 1. Subir lista de citados del día desde Excel (Orden, H.A., Paciente, Situacion)
  const handleSubirCitasExcel = async (archivo, medObj) => {
    if (!archivo || !medObj) return;
    try {
      setCargando(true);
      const data = await archivo.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const parsedCitas = parseExcelCitasConsultaExterna(jsonData);
      if (parsedCitas.length === 0) {
        toast.warn("No se encontraron registros de pacientes válidos en el archivo Excel. Verifique las columnas: Orden, H.A., Apellidos y Nombres Paciente, Situacion.");
        return;
      }

      const hoy = obtenerFechaHoyLocal();
      const batch = writeBatch(db);

      parsedCitas.forEach((c) => {
        const docRef = doc(collection(db, "citas_consulta_externa"));
        batch.set(docRef, {
          medico: medObj.Medico,
          modulo: medObj.Modulo || "Módulo General",
          consultorio: medObj.consultorioTopico || medObj.Modulo || "",
          fecha: hoy,
          orden: c.orden,
          horaAtencion: c.horaAtencion,
          paciente: c.paciente,
          situacion: c.situacion || 'PENDIENTE',
          esManual: false,
          fechaCreacion: new Date().toISOString()
        });
      });

      await batch.commit();
      setMostrarModalSubirCitas(false);
      setMedicoParaSubirCitas(null);
      toast.success(`Se cargaron ${parsedCitas.length} pacientes citados exitosamente para ${medObj.Medico}`);
    } catch (err) {
      console.error("Error al procesar Excel de citas:", err);
      toast.error(`Error al procesar el archivo Excel: ${err.message || 'Formato no compatible'}`);
    } finally {
      setCargando(false);
    }
  };

  // 2. Agregar paciente manual en Consulta Externa (adicional que no vino en el Excel)
  const agregarCitaManual = async (medObj, nombrePacienteManual, horaAtencionManual = '') => {
    if (!medObj || !nombrePacienteManual.trim()) return;
    try {
      setCargando(true);
      const hoy = obtenerFechaHoyLocal();
      const nombreLimpio = nombrePacienteManual.trim().toUpperCase();

      // Calcular el siguiente número de orden para este médico hoy
      const citasDoctor = citasConsultaExterna.filter(c => c.medico === medObj.Medico && c.fecha === hoy);
      const maxOrden = citasDoctor.reduce((max, c) => Math.max(max, Number(c.orden) || 0), 0);
      const siguienteOrden = maxOrden + 1;

      const horaDefecto = horaAtencionManual.trim() || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      await addDoc(collection(db, "citas_consulta_externa"), {
        medico: medObj.Medico,
        modulo: medObj.Modulo || "Módulo General",
        consultorio: medObj.consultorioTopico || medObj.Modulo || "",
        fecha: hoy,
        orden: siguienteOrden,
        horaAtencion: horaDefecto,
        paciente: nombreLimpio,
        situacion: 'PENDIENTE',
        esManual: true,
        fechaCreacion: new Date().toISOString()
      });

      setMostrarModalCitaManual(false);
      setMedicoParaCitaManual(null);
      toast.success(`Paciente adicional "${nombreLimpio}" agregado en el orden #${siguienteOrden}`);
    } catch (err) {
      console.error("Error al agregar paciente manual:", err);
      toast.error("Error al registrar paciente adicional.");
    } finally {
      setCargando(false);
    }
  };

  // 3. Llamar paciente citado en Consulta Externa
  const llamarPacienteCitado = async (medObj, citaObj) => {
    if (!medObj || !citaObj || cargando) return;
    try {
      setCargando(true);
      const ahoraIso = new Date().toISOString();
      const consultorioDoc = medObj.consultorioTopico || medObj.Modulo || '';

      // Actualizar cita en citas_consulta_externa
      await updateDoc(doc(db, "citas_consulta_externa", citaObj.id), {
        situacion: 'LLAMANDO',
        horaLlamado: ahoraIso
      });

      // Actualizar tarjeta del médico en programacion_medica
      const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
      const batch = writeBatch(db);
      ids.forEach(idDoc => {
        batch.update(doc(db, "programacion_medica", idDoc), {
          estado: 'LLAMANDO',
          pacienteLlamado: citaObj.paciente,
          citaIdActual: citaObj.id,
          nivelTriajeLlamado: null,
          consultorioTopico: consultorioDoc,
          estadoUltimoCambio: ahoraIso
        });
      });
      await batch.commit();

      // Auditoría: Registrar llamado
      await registrarEnHistorialFirestore(
        medObj.Medico,
        citaObj.paciente,
        'LLAMADO',
        'CONSULTA_EXTERNA',
        ahoraIso,
        consultorioDoc,
        'CONSULTA'
      );

      // Voceo
      agregarAColaDeLlamados(citaObj.paciente, medObj.Medico, consultorioDoc);

      toast.success(`Llamando a paciente #${citaObj.orden}: ${citaObj.paciente}`);
    } catch (err) {
      console.error("Error al llamar paciente citado:", err);
      toast.error("Error al llamar al paciente.");
    } finally {
      setCargando(false);
    }
  };

  // 4. Ingresar a consulta paciente citado
  const ingresarAConsultaCitado = async (medObj, citaObj) => {
    if (!medObj || !citaObj) return;
    try {
      const ahoraIso = new Date().toISOString();
      const consultorioDoc = medObj.consultorioTopico || medObj.Modulo || '';

      await updateDoc(doc(db, "citas_consulta_externa", citaObj.id), {
        situacion: 'EN_CONSULTA',
        horaInicioConsulta: ahoraIso
      });

      const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
      const batch = writeBatch(db);
      ids.forEach(idDoc => {
        batch.update(doc(db, "programacion_medica", idDoc), {
          estado: 'CONSULTA',
          pacienteLlamado: citaObj.paciente,
          citaIdActual: citaObj.id,
          horaIngresoConsulta: ahoraIso,
          estadoUltimoCambio: ahoraIso
        });
      });
      await batch.commit();

      await registrarEnHistorialFirestore(
        medObj.Medico,
        citaObj.paciente,
        'EN_CONSULTA',
        'CONSULTA_EXTERNA',
        ahoraIso,
        consultorioDoc,
        'CONSULTA'
      );

      toast.success(`Paciente #${citaObj.orden} - ${citaObj.paciente} ingresó a consulta.`);
    } catch (err) {
      console.error("Error al ingresar citado a consulta:", err);
      toast.error("Error al registrar ingreso.");
    }
  };

  // 5. Finalizar consulta paciente citado (de PENDIENTE/EN_CONSULTA a ATENDIDA)
  const marcarCitadoAtendido = async (medObj, citaObj) => {
    if (!medObj || !citaObj) return;
    try {
      const ahoraIso = new Date().toISOString();
      const consultorioDoc = medObj.consultorioTopico || medObj.Modulo || '';

      await updateDoc(doc(db, "citas_consulta_externa", citaObj.id), {
        situacion: 'ATENDIDA',
        horaFinConsulta: ahoraIso
      });

      const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
      const batch = writeBatch(db);
      ids.forEach(idDoc => {
        batch.update(doc(db, "programacion_medica", idDoc), {
          estado: 'CONSULTA',
          pacienteLlamado: null,
          citaIdActual: null,
          nivelTriajeLlamado: null,
          horaIngresoConsulta: null,
          estadoUltimoCambio: ahoraIso
        });
      });
      await batch.commit();

      await registrarEnHistorialFirestore(
        medObj.Medico,
        citaObj.paciente,
        'ATENDIDO',
        'CONSULTA_EXTERNA',
        ahoraIso,
        consultorioDoc,
        'CONSULTA'
      );
      await registrarEnPacientesMedico(
        medObj.Medico,
        citaObj.paciente,
        'ATENDIDO',
        consultorioDoc
      );

      toast.success(`Atención de ${citaObj.paciente} finalizada: Estado ATENDIDA registrado en auditoría.`);
    } catch (err) {
      console.error("Error al finalizar atención de citado:", err);
      toast.error("Error al finalizar atención.");
    }
  };

  // 6. Marcar citado como NO_RESPONDIO
  const marcarCitadoNoRespondio = async (medObj, citaObj) => {
    if (!medObj || !citaObj) return;
    try {
      const ahoraIso = new Date().toISOString();
      const consultorioDoc = medObj.consultorioTopico || medObj.Modulo || '';

      await updateDoc(doc(db, "citas_consulta_externa", citaObj.id), {
        situacion: 'NO_RESPONDIO',
        horaNoRespondio: ahoraIso
      });

      const ids = Array.isArray(medObj.ids) ? medObj.ids : [medObj.id];
      const batch = writeBatch(db);
      ids.forEach(idDoc => {
        batch.update(doc(db, "programacion_medica", idDoc), {
          estado: 'CONSULTA',
          pacienteLlamado: null,
          citaIdActual: null,
          nivelTriajeLlamado: null,
          horaIngresoConsulta: null,
          estadoUltimoCambio: ahoraIso
        });
      });
      await batch.commit();

      await registrarEnHistorialFirestore(
        medObj.Medico,
        citaObj.paciente,
        'NO_RESPONDIO',
        'CONSULTA_EXTERNA',
        ahoraIso,
        consultorioDoc,
        'CONSULTA'
      );

      toast.warn(`Paciente ${citaObj.paciente} registrado como 'No Respondió'.`);
    } catch (err) {
      console.error("Error al marcar citado como no respondió:", err);
      toast.error("Error al actualizar estado.");
    }
  };

  // 7. Eliminar citas de un médico de hoy
  const eliminarCitasMedico = async (medicoNombre) => {
    if (!medicoNombre) return;
    if (!window.confirm(`¿Seguro que deseas eliminar la lista de citados de hoy para ${medicoNombre}?`)) return;

    try {
      setCargando(true);
      const hoy = obtenerFechaHoyLocal();
      const citasDoctor = citasConsultaExterna.filter(c => c.medico === medicoNombre && c.fecha === hoy);

      const batch = writeBatch(db);
      citasDoctor.forEach(c => {
        batch.delete(doc(db, "citas_consulta_externa", c.id));
      });
      await batch.commit();

      toast.info(`Lista de citados eliminada para ${medicoNombre}.`);
    } catch (err) {
      console.error("Error al eliminar citas del médico:", err);
      toast.error("Error al eliminar lista de citas.");
    } finally {
      setCargando(false);
    }
  };

  // Corrección de nombre con query filtrada (optimizada)
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
        batch.update(medRef, { pacienteLlamado: nombreLimpio });
      });

      await batch.commit();

      // Query optimizada: solo busca registros de este médico y paciente en lugar de toda la colección
      const qHist = query(
        collection(db, "historial_llamados"),
        where("medico", "==", medicoParaEditarPaciente.Medico),
        where("paciente", "==", nombreAnterior)
      );
      const snapshotHistorial = await getDocs(qHist);
      snapshotHistorial.docs.forEach(async (d) => {
        await updateDoc(doc(db, "historial_llamados", d.id), { paciente: nombreLimpio });
      });

      setMedicoParaEditarPaciente(null);
      setNuevoNombreEditado('');
      toast.success("Nombre de paciente actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar nombre del paciente:", err);
      toast.error("Error al actualizar el nombre del paciente.");
    }
  };

  // Inasistentes pendientes hoy
  const obtenerInasistentesPendientes = useCallback((nombreMedico) => {
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
  }, [historialLlamados]);

  // Reemplazo Médico
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
      toast.success("Reemplazo asignado con éxito.");
    } catch (err) {
      console.error("Error asignando reemplazo:", err);
      toast.error("Error al asignar reemplazo.");
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
      toast.info("Titular restaurado correctamente.");
    } catch (err) {
      console.error("Error al restaurar titular:", err);
      toast.error("Error al restaurar titular.");
    }
  };

  // Edición / Registro de Médicos
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
      toast.success("Registro modificado correctamente.");
    } catch (err) {
      console.error("Error al editar programación:", err);
      toast.error("Error al guardar cambios de programación.");
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
      toast.info("Programación eliminada.");
    } catch (err) {
      console.error("Error al eliminar:", err);
      toast.error("Error al eliminar registro.");
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
      toast.success("Nuevo registro médico agregado con éxito.");
    } catch (err) {
      console.error("Error al agregar nuevo registro:", err);
      toast.error("Error al registrar programación.");
    }
  };

  // Comunicado & Limpieza
  const guardarComunicado = async (e) => {
    e.preventDefault();
    if (rolUsuario !== 'ADMIN') return;
    try {
      await setDoc(doc(db, "configuracion", "comunicado"), { mensaje: nuevoComunicado });
      setMostrarModalComunicado(false);
      toast.success("Comunicado oficial actualizado.");
    } catch (err) {
      console.error("Error guardando comunicado:", err);
      toast.error("Error al guardar comunicado.");
    }
  };

  const limpiarBaseDatos = async () => {
    if (rolUsuario !== 'ADMIN') return;
    if (!window.confirm("¿Seguro que deseas eliminar TODA la programación cargada? Esta acción no se puede deshacer.")) return;
    
    setCargando(true);
    try {
      const querySnapshot = await getDocs(collection(db, "programacion_medica"));
      
      // Batch write en bloques de 490 para respetar el límite de 500 de Firestore
      const BATCH_SIZE = 490;
      const docs = querySnapshot.docs;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + BATCH_SIZE);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      setModulosSeleccionadosConsulta([]);
      setModulosSeleccionadosEmergencia([]);
      toast.success("Toda la programación fue eliminada correctamente.");
    } catch (err) {
      console.error("Error al limpiar base de datos:", err);
      toast.error("Error al limpiar programación.");
    } finally {
      setCargando(false);
    }
  };

  // Carga Masiva Excel con Batch Chunks seguros
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
          toast.error("El archivo Excel no contiene datos válidos.");
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

        const colRef = collection(db, "programacion_medica");
        const modulosDetectadosEmergencia = new Set();
        const modulosDetectadosConsulta = new Set();
        const listaDuplicados = [];
        const registrosParaInsertar = [];
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
            const claveUnica = `${tipoServicioFinal}_${String(medico).trim().toLowerCase()}_${fechaFormateada}_${String(hInicio).trim()}_${String(hFin).trim()}_${String(rol).trim().toLowerCase()}`;

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
              if (tipoServicioFinal === 'EMERGENCIA') {
                modulosDetectadosEmergencia.add(modulo);
              } else {
                modulosDetectadosConsulta.add(modulo);
              }
              registrosParaInsertar.push({
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

        // Insertar en chunks de 490 para evitar límite de Firestore
        const BATCH_SIZE = 490;
        for (let i = 0; i < registrosParaInsertar.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const chunk = registrosParaInsertar.slice(i, i + BATCH_SIZE);
          chunk.forEach(registro => {
            const newDocRef = doc(colRef);
            batch.set(newDocRef, registro);
          });
          await batch.commit();
        }

        if (modulosDetectadosEmergencia.size > 0) {
          setModulosSeleccionadosEmergencia(Array.from(modulosDetectadosEmergencia).sort());
        }
        if (modulosDetectadosConsulta.size > 0) {
          setModulosSeleccionadosConsulta(Array.from(modulosDetectadosConsulta).sort());
        }

        if (listaDuplicados.length > 0) {
          setDuplicadosOmitidos(listaDuplicados);
          setMostrarModalReporte(true);
          toast.warn(`Se guardaron ${registrosParaInsertar.length} registros nuevos. Se omitieron ${listaDuplicados.length} duplicados.`);
        } else {
          toast.success(`¡Carga exitosa! Se guardaron ${registrosParaInsertar.length} registros nuevos.`);
        }

      } catch (err) {
        console.error("Error en la subida:", err);
        toast.error("Ocurrió un error al procesar el archivo Excel.");
      } finally {
        setCargando(false);
        e.target.value = null;
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Selector de Módulos por Canal
  const toggleModuloSeleccionado = (mod) => {
    if (servicioActivo === 'EMERGENCIA') {
      setModulosSeleccionadosEmergencia(prev =>
        prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
      );
    } else {
      setModulosSeleccionadosConsulta(prev =>
        prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
      );
    }
  };

  const seleccionarTodosLosModulos = () => {
    if (servicioActivo === 'EMERGENCIA') {
      setModulosSeleccionadosEmergencia([...todosLosModulosDisponibles]);
    } else {
      setModulosSeleccionadosConsulta([...todosLosModulosDisponibles]);
    }
  };

  const deseleccionarTodosLosModulos = () => {
    if (servicioActivo === 'EMERGENCIA') {
      setModulosSeleccionadosEmergencia([]);
    } else {
      setModulosSeleccionadosConsulta([]);
    }
  };

  // Copiar Enlace Directo para Smart TVs de Sala de Espera
  const copiarEnlaceTv = () => {
    try {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const servParam = servicioActivo === 'EMERGENCIA' ? 'emergencia' : 'consulta';
      const enlace = `${origin}${pathname}?tv=${servParam}`;
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(enlace);
        toast.success(`Enlace Smart TV (${servicioActivo === 'EMERGENCIA' ? 'Emergencia' : 'Consulta'}) copiado al portapapeles.`);
      } else {
        toast.info(`Enlace directo TV: ${enlace}`);
      }
    } catch {
      toast.warn("No se pudo copiar el enlace.");
    }
  };

  // Agrupación y filtrado de programación médica
  const programacionAgrupada = useMemo(() => {
    try {
      const mapaMedicos = new Map();
      const fechaHoy = obtenerFechaHoyLocal();

      programacion.forEach((item) => {
        if (item.Fecha && item.Fecha !== fechaHoy) return;

        const esEmerg = item.TipoServicio === 'EMERGENCIA' || esEspecialidadEmergencia(item.Area, item.Rol);
        const tipoServicioFinal = esEmerg ? 'EMERGENCIA' : 'CONSULTA_EXTERNA';
        const nombreMedico = (item.Medico || "Sin Nombre").toLowerCase().trim();
        const key = `${tipoServicioFinal}_${item.Modulo || "Módulo General"}_${item.Area || "General"}_${nombreMedico}`;
        const rolLimpio = item.Rol || "Consulta Médica";

        if (!mapaMedicos.has(key)) {
          mapaMedicos.set(key, {
            ...item,
            TipoServicio: tipoServicioFinal,
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

  const datosFiltrados = useMemo(() => {
    return programacionAgrupada.filter(item => {
      const mod = item.Modulo || "Módulo General";
      
      const esEmerg = item.TipoServicio === 'EMERGENCIA' || esEspecialidadEmergencia(item.Area, item.Rol);
      if (servicioActivo === 'EMERGENCIA' && !esEmerg) return false;
      if (servicioActivo === 'CONSULTA_EXTERNA' && esEmerg) return false;

      if (modoTvActivo && mod !== moduloActualTv) return false;
      if (!modoTvActivo && !modulosSeleccionados.includes(mod)) return false;
      if (soloTurnoActual && !estaEnTurno(item.horarios)) return false;

      return true;
    });
  }, [programacionAgrupada, servicioActivo, modoTvActivo, moduloActualTv, modulosSeleccionados, soloTurnoActual, estaEnTurno]);

  const agrupadoPorModulo = useMemo(() => {
    return datosFiltrados.reduce((acc, item) => {
      const moduloKey = item.Modulo || "Módulo General";
      if (!acc[moduloKey]) acc[moduloKey] = [];
      acc[moduloKey].push(item);
      return acc;
    }, {});
  }, [datosFiltrados]);

  // Auditoría agrupada
  const historialAgrupadoAuditoria = useMemo(() => {
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

  const historialFiltradoAuditoria = useMemo(() => {
    return historialAgrupadoAuditoria.filter(grupo => {
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
  }, [historialAgrupadoAuditoria, busquedaAuditoria, filtroEtapaAuditoria]);

  const descargarReporteExcelAuditoriaHandler = () => {
    const ok = generarReporteExcelAuditoria(historialFiltradoAuditoria, servicioActivo);
    if (!ok) {
      toast.warn("No hay registros disponibles para exportar.");
    } else {
      toast.success("Reporte Excel generado correctamente.");
    }
  };

  const puedeModificarEstados = rolUsuario === 'ADMIN' || rolUsuario === 'OPERADOR' || rolUsuario === 'ADMISION' || rolUsuario === 'MEDICO';

  const contextValue = {
    // Auth & Perfil
    rolUsuario,
    servicioPermitidoUsuario,
    medicoAsignadoUsuario,
    emailUsuarioActivo,
    mostrarModalLogin,
    setMostrarModalLogin,
    emailInput,
    setEmailInput,
    passwordInput,
    setPasswordInput,
    errorPin,
    handleLogin,
    loginConGoogle,
    handleLogout,

    // Citas Consulta Externa (Excel y Manual)
    citasConsultaExterna,
    medicoParaSubirCitas,
    setMedicoParaSubirCitas,
    mostrarModalSubirCitas,
    setMostrarModalSubirCitas,
    medicoParaCitaManual,
    setMedicoParaCitaManual,
    mostrarModalCitaManual,
    setMostrarModalCitaManual,
    handleSubirCitasExcel,
    agregarCitaManual,
    llamarPacienteCitado,
    ingresarAConsultaCitado,
    marcarCitadoAtendido,
    marcarCitadoNoRespondio,
    eliminarCitasMedico,

    // Estados Generales
    programacion,
    agrupadoPorModulo,
    listaEspera,
    historialLlamados,
    comunicado,
    nuevoComunicado,
    setNuevoComunicado,
    mostrarModalComunicado,
    setMostrarModalComunicado,
    guardarComunicado,
    cargando,
    soloTurnoActual,
    setSoloTurnoActual,
    vistaActiva,
    setVistaActiva,
    servicioActivo,
    setServicioActivo,
    temaClaro,
    setTemaClaro,

    // Módulos
    modulosSeleccionados,
    todosLosModulosDisponibles,
    mostrarModalModulos,
    setMostrarModalModulos,
    toggleModuloSeleccionado,
    seleccionarTodosLosModulos,
    deseleccionarTodosLosModulos,

    // Modo TV
    modoTvActivo,
    setModoTvActivo,
    setIndiceRotacionTv,
    moduloActualTv,
    medicoLlamandoEnVivo,
    mainScrollRef,
    copiarEnlaceTv,

    // Configuración & Cálculos Médicos
    ESTADOS_MEDICO,
    estaEnTurno,
    estaEnUltimaHora,
    estaEnVentanaAnticipada,
    calcularEstadoInteligente,
    obtenerTiempoTranscurrido: obtenerTiempoTranscurridoRef,
    puedeModificarEstados,
    obtenerInasistentesPendientes,

    // Acciones de Gestión de Pacientes / Llamado
    cambiarEstadoMedico,
    medicoParaLlamar,
    setMedicoParaLlamar,
    nombrePaciente,
    setNombrePaciente,
    consultorioTopico,
    setConsultorioTopico,
    nivelTriaje,
    setNivelTriaje,
    accionPacienteAnterior,
    setAccionPacienteAnterior,
    confirmarLlamadaPaciente,
    ingresarAConsultaConPaciente,
    marcarPacienteAtendido,
    marcarPacienteNoRespondio,
    volverALlamarPaciente,
    marcarInasistenciaDefinitiva,

    // Cola de Espera
    medicoParaCola,
    setMedicoParaCola,
    agregarAPilaEspera,
    llamarSiguienteCola,

    // Edición de Paciente
    medicoParaEditarPaciente,
    setMedicoParaEditarPaciente,
    nuevoNombreEditado,
    setNuevoNombreEditado,
    guardarEdicionNombrePaciente,

    // Reemplazo Médico
    medicoParaReemplazo,
    setMedicoParaReemplazo,
    nombreReemplazo,
    setNombreReemplazo,
    aplicarReemplazo,
    restaurarTitular,

    // Edición y Alta de Programación
    medicoParaEditar,
    setMedicoParaEditar,
    formEdicion,
    setFormEdicion,
    abrirModalEditar,
    guardarEdicionRegistro,
    eliminarRegistroIndividual,
    mostrarModalNuevoRegistro,
    setMostrarModalNuevoRegistro,
    formNuevo,
    setFormNuevo,
    guardarNuevoRegistro,
    limpiarBaseDatos,
    handleFileUpload,

    // Reporte de Duplicados
    duplicadosOmitidos,
    mostrarModalReporte,
    setMostrarModalReporte,

    // Auditoría
    mostrarModalHistorial,
    setMostrarModalHistorial,
    busquedaAuditoria,
    setBusquedaAuditoria,
    filtroEtapaAuditoria,
    setFiltroEtapaAuditoria,
    filaExpandidaAuditoria,
    setFilaExpandidaAuditoria,
    historialFiltradoAuditoria,
    descargarReporteExcelAuditoria: descargarReporteExcelAuditoriaHandler
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
