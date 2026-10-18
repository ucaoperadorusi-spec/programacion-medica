import React, { useState, useEffect } from 'react';
import { db, auth, firebaseConfig } from './firebase';
import { initializeApp } from 'firebase/app';
import { 
  createUserWithEmailAndPassword, 
  getAuth as getAuthSecondary, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  collection, onSnapshot, doc, setDoc, updateDoc 
} from 'firebase/firestore';
import { 
  Shield, UserPlus, Search, Pencil, Key, Trash2, X, Mail 
} from 'lucide-react';

export default function GestionUsuarios({ temaClaro }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [cargandoGuardado, setCargandoGuardado] = useState(false);
  
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  const [formUsuario, setFormUsuario] = useState({
    nombre: '', email: '', password: '', rol: 'OPERADOR', servicio: 'TODOS', activo: true
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
    if (!formUsuario.email.trim() || !formUsuario.password.trim()) return;
    if (formUsuario.password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargandoGuardado(true);
    try {
      const emailClean = formUsuario.email.trim().toLowerCase();
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuthApp_" + Date.now());
      const secondaryAuth = getAuthSecondary(secondaryApp);
      
      await createUserWithEmailAndPassword(secondaryAuth, emailClean, formUsuario.password);

      await setDoc(doc(db, "usuarios", emailClean), {
        nombre: formUsuario.nombre.trim(),
        email: emailClean,
        rol: formUsuario.rol,
        servicio: formUsuario.servicio,
        activo: formUsuario.activo,
        estado: "activo",
        fechaCreacion: new Date().toISOString()
      });

      setMostrarModalNuevo(false);
      setFormUsuario({ nombre: '', email: '', password: '', rol: 'OPERADOR', servicio: 'TODOS', activo: true });
      alert(`¡Usuario ${emailClean} registrado exitosamente!`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        alert("El correo ya se encuentra registrado en el sistema.");
      } else {
        alert("Error al registrar: " + err.message);
      }
    } finally {
      setCargandoGuardado(false);
    }
  };

  const desactivarUsuario = async (id, email) => {
    if (!window.confirm(`¿Seguro que deseas DESACTIVAR al usuario ${email}? No podrá acceder al sistema.`)) return;
    try {
      await updateDoc(doc(db, "usuarios", id), { 
        activo: false, 
        estado: "inactivo" 
      });
    } catch (err) {
      console.error("Error al desactivar:", err);
    }
  };

  const reactivarUsuario = async (id) => {
    try {
      await updateDoc(doc(db, "usuarios", id), { activo: true, estado: "activo" });
    } catch (err) {
      console.error("Error al reactivar:", err);
    }
  };

  const guardarEdicionUsuario = async (e) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    try {
      await updateDoc(doc(db, "usuarios", usuarioEditando.id), {
        nombre: usuarioEditando.nombre,
        rol: usuarioEditando.rol,
        servicio: usuarioEditando.servicio
      });
      setMostrarModalEditar(false);
      alert("Datos del usuario actualizados correctamente.");
    } catch (err) {
      console.error("Error al editar:", err);
    }
  };

  const enviarCorreoRestablecimiento = async (email) => {
    if (!window.confirm(`¿Enviar enlace al correo ${email} para que el usuario asigne una nueva contraseña?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Correo enviado a ${email}. El usuario debe revisar su bandeja de entrada para cambiar su clave.`);
    } catch (err) {
      console.error("Error enviando correo:", err);
      alert("Hubo un error al intentar enviar el correo. Verifique que la cuenta exista en Authentication.");
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
          <p className="text-xs text-slate-400">Administración de credenciales, edición y bloqueos</p>
        </div>

        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Registrar Usuario</span>
        </button>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none transition ${
            temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
          }`}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b ${temaClaro ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
              <th className="py-3 px-4">Usuario / Nombre</th>
              <th className="py-3 px-4">Correo Electrónico</th>
              <th className="py-3 px-4">Rol / Servicio</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-400 font-medium">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((u) => (
                <tr key={u.id} className={`border-b transition ${
                  u.activo === false ? 'opacity-50 grayscale' : ''
                } ${temaClaro ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800/60 hover:bg-slate-800/40'}`}>
                  <td className="py-3 px-4 font-bold">{u.nombre || 'Sin Nombre'}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 text-[10px]">
                        {u.rol}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">{u.servicio}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {u.activo !== false ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600/30 text-emerald-300 border border-emerald-500">
                        ACTIVO
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600/30 text-rose-300 border border-rose-500">
                        INACTIVO
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => { setUsuarioEditando({ ...u }); setMostrarModalEditar(true); }}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                        title="Editar datos del usuario"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => enviarCorreoRestablecimiento(u.email)}
                        className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-lg transition"
                        title="Enviar correo para cambiar clave"
                      >
                        <Key className="w-4 h-4" />
                      </button>

                      {u.activo !== false ? (
                        <button
                          onClick={() => desactivarUsuario(u.id, u.email)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                          title="Desactivar y bloquear acceso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => reactivarUsuario(u.id)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition"
                          title="Volver a activar usuario"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${temaClaro ? 'bg-white' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex justify-between pb-3 border-b border-slate-700/50 mb-4">
              <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2"><UserPlus className="w-5 h-5" /> Registrar Usuario</h3>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardarUsuario} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo:</label>
                <input type="text" required value={formUsuario.nombre} onChange={e => setFormUsuario({...formUsuario, nombre: e.target.value})} className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Correo Electrónico:</label>
                <input type="email" required value={formUsuario.email} onChange={e => setFormUsuario({...formUsuario, email: e.target.value})} className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Contraseña:</label>
                <input type="password" required minLength={6} value={formUsuario.password} onChange={e => setFormUsuario({...formUsuario, password: e.target.value})} className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Rol Permiso:</label>
                  <select value={formUsuario.rol} onChange={e => setFormUsuario({...formUsuario, rol: e.target.value})} className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`}>
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="ADMISION">ADMISIÓN</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Servicio:</label>
                  <select value={formUsuario.servicio} onChange={e => setFormUsuario({...formUsuario, servicio: e.target.value})} className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`}>
                    <option value="TODOS">TODOS</option>
                    <option value="EMERGENCIA">EMERGENCIA</option>
                    <option value="CONSULTA_EXTERNA">CONSULTA EXTERNA</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setMostrarModalNuevo(false)} className="px-4 py-2 text-xs border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 transition">Cancelar</button>
                <button type="submit" disabled={cargandoGuardado} className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold rounded-xl shadow-lg transition">{cargandoGuardado ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalEditar && usuarioEditando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${temaClaro ? 'bg-white' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex justify-between pb-3 border-b border-slate-700/50 mb-4">
              <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><Pencil className="w-5 h-5" /> Editar Datos del Usuario</h3>
              <button onClick={() => setMostrarModalEditar(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={guardarEdicionUsuario} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo:</label>
                <input 
                  type="text" required 
                  value={usuarioEditando.nombre} 
                  onChange={e => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})} 
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Correo (No modificable):</label>
                <input 
                  type="email" disabled value={usuarioEditando.email} 
                  className="w-full p-2.5 rounded-xl border text-xs bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Rol Permiso:</label>
                  <select 
                    value={usuarioEditando.rol} 
                    onChange={e => setUsuarioEditando({...usuarioEditando, rol: e.target.value})} 
                    className={`w-full p-2.5 rounded-xl border text-xs ${temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`}
                  >
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="ADMISION">ADMISIÓN</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Servicio:</label>
                  <select 
                    value={usuarioEditando.servicio} 
                    onChange={e => setUsuarioEditando({...usuarioEditando, servicio: e.target.value})} 
                    className={`w-full p-2.5 rounded-xl border text-xs ${temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`}
                  >
                    <option value="TODOS">TODOS</option>
                    <option value="EMERGENCIA">EMERGENCIA</option>
                    <option value="CONSULTA_EXTERNA">CONSULTA EXTERNA</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                 <button
                    type="button"
                    onClick={() => enviarCorreoRestablecimiento(usuarioEditando.email)}
                    className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                 >
                   <Mail className="w-4 h-4" /> Enviar enlace para cambiar contraseña
                 </button>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setMostrarModalEditar(false)} className="px-4 py-2 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 rounded-xl transition">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}