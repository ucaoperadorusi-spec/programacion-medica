import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth, firebaseConfig } from './firebase'

// Importante: Reutilizamos las credenciales de tu archivo firebase.js para crear la app secundaria
import { firebaseConfig } from './firebase'; 

function GestionUsuarios({ temaClaro }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [cargandoGuardado, setCargandoGuardado] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'OPERADOR',
    servicio: 'EMERGENCIA',
    activo: true
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsuarios(docs);
    });
    return () => unsubscribe();
  }, []);

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setErrorModal('');

    if (!formUsuario.email.trim() || !formUsuario.password.trim()) {
      setErrorModal('El correo y la contraseña son obligatorios.');
      return;
    }

    if (formUsuario.password.length < 6) {
      setErrorModal('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCargandoGuardado(true);
    const emailClean = formUsuario.email.trim().toLowerCase();

    try {
      // 1. Crear usuario en Firebase Authentication usando una App Secundaria en segundo plano
      // Esto evita que el Administrador pierda su sesión activa
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuthApp_" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);

      await createUserWithEmailAndPassword(secondaryAuth, emailClean, formUsuario.password);

      // 2. Guardar datos de perfil y permisos en la colección 'usuarios' de Firestore
      await setDoc(doc(db, "usuarios", emailClean), {
        nombre: formUsuario.nombre.trim(),
        email: emailClean,
        rol: formUsuario.rol,
        servicio: formUsuario.servicio,
        activo: formUsuario.activo,
        fechaCreacion: new Date().toISOString()
      });

      // Limpiar y cerrar modal
      setMostrarModalNuevo(false);
      setFormUsuario({ nombre: '', email: '', password: '', rol: 'OPERADOR', servicio: 'EMERGENCIA', activo: true });
      alert(`¡Usuario ${emailClean} registrado exitosamente en Authentication y Firestore!`);

    } catch (err) {
      console.error("Error al registrar usuario:", err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorModal('El correo ya se encuentra registrado en el sistema.');
      } else {
        setErrorModal('Error al registrar: ' + err.message);
      }
    } finally {
      setCargandoGuardado(false);
    }
  };

  const cambiarEstadoUsuario = async (id, estadoActual) => {
    try {
      await updateDoc(doc(db, "usuarios", id), { activo: !estadoActual });
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario de Firestore?")) return;
    try {
      await deleteDoc(doc(db, "usuarios", id));
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    (u.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className={`p-6 rounded-3xl border shadow-xl ${
      temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
    }`}>
      <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-700/50 mb-6">
        <div>
          <h2 className="text-xl font-black text-cyan-400 flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            Gestión de Usuarios y Accesos
          </h2>
          <p className="text-xs text-slate-400">Creación automática de credenciales y roles</p>
        </div>

        <button
          onClick={() => { setErrorModal(''); setMostrarModalNuevo(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Registrar Usuario</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-4 relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none transition ${
            temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
          }`}
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b ${temaClaro ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
              <th className="py-3 px-4">Usuario / Nombre</th>
              <th className="py-3 px-4">Correo Electrónico</th>
              <th className="py-3 px-4">Rol Asignado</th>
              <th className="py-3 px-4">Servicio Permitido</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-400 font-medium">
                  No hay usuarios registrados en la base de datos.
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((u) => (
                <tr key={u.id} className={`border-b transition ${
                  temaClaro ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800/60 hover:bg-slate-800/40'
                }`}>
                  <td className="py-3 px-4 font-bold">{u.nombre || 'Sin Nombre'}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                      u.rol === 'ADMIN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      u.rol === 'ADMISION' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{u.servicio || 'EMERGENCIA'}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => cambiarEstadoUsuario(u.id, u.activo)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                        u.activo !== false 
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500' 
                          : 'bg-rose-600/30 text-rose-300 border border-rose-500'
                      }`}
                    >
                      {u.activo !== false ? 'ACTIVO' : 'INACTIVO'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => eliminarUsuario(u.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Nuevo Usuario */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/50 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
                <UserPlus className="w-5 h-5" /> Registrar Nuevo Usuario
              </h3>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarUsuario} className="space-y-3" autoComplete="off">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={formUsuario.nombre}
                  onChange={e => setFormUsuario({...formUsuario, nombre: e.target.value})}
                  placeholder="Ej. Andy Soriano"
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  value={formUsuario.email}
                  onChange={e => setFormUsuario({...formUsuario, email: e.target.value})}
                  placeholder="usuario@gmail.com"
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Contraseña de Acceso:</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formUsuario.password}
                  onChange={e => setFormUsuario({...formUsuario, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Rol Permiso:</label>
                  <select
                    value={formUsuario.rol}
                    onChange={e => setFormUsuario({...formUsuario, rol: e.target.value})}
                    className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                      temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="ADMISION">ADMISIÓN</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Servicio Destino:</label>
                  <select
                    value={formUsuario.servicio}
                    onChange={e => setFormUsuario({...formUsuario, servicio: e.target.value})}
                    className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                      temaClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="EMERGENCIA">EMERGENCIA</option>
                    <option value="CONSULTA_EXTERNA">CONSULTA EXTERNA</option>
                    <option value="TODOS">TODOS</option>
                  </select>
                </div>
              </div>

              {errorModal && (
                <p className="text-red-400 text-xs font-bold pt-1">{errorModal}</p>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="px-4 py-2 text-xs border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargandoGuardado}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1"
                >
                  {cargandoGuardado ? 'Guardando...' : 'Guardar y Crear Acceso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}