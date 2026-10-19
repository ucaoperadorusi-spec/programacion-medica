import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { 
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc 
} from 'firestore/lite'; // O de 'firebase/firestore' según tu configuración de imports
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  UserPlus, Shield, Pencil, Trash2, Check, X, Search, UserCheck, UserX, Key
} from 'lucide-react';

export default function GestionUsuarios({ temaClaro }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);

  const [formCrear, setFormCrear] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'OPERADOR',
    servicio: 'TODOS'
  });

  const [formEditar, setFormEditar] = useState({
    nombre: '',
    rol: 'OPERADOR',
    servicio: 'TODOS',
    activo: true
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const lista = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setUsuarios(lista);
    });
    return () => unsub();
  }, []);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!formCrear.email.trim() || !formCrear.password.trim()) return;

    try {
      setCargando(true);
      const emailClean = formCrear.email.toLowerCase().trim();

      // Guardar registro en la colección "usuarios" de Firestore
      await setDoc(doc(db, "usuarios", emailClean), {
        nombre: formCrear.nombre.trim() || emailClean.split('@')[0],
        email: emailClean,
        rol: formCrear.rol,
        servicio: formCrear.servicio,
        activo: true,
        estado: 'activo',
        fechaCreacion: new Date().toISOString()
      });

      setMostrarModalCrear(false);
      setFormCrear({ nombre: '', email: '', password: '', rol: 'OPERADOR', servicio: 'TODOS' });
      alert("Usuario registrado con éxito en el sistema.");
    } catch (err) {
      console.error("Error al registrar usuario:", err);
      alert("Error al guardar usuario: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!usuarioEditar) return;

    try {
      setCargando(true);
      await updateDoc(doc(db, "usuarios", usuarioEditar.id), {
        nombre: formEditar.nombre.trim(),
        rol: formEditar.rol,
        servicio: formEditar.servicio,
        activo: formEditar.activo,
        estado: formEditar.activo ? 'activo' : 'inactivo'
      });

      setUsuarioEditar(null);
    } catch (err) {
      console.error("Error al editar usuario:", err);
    } finally {
      setCargando(false);
    }
  };

  const toggleEstadoActivo = async (u) => {
    try {
      const nuevoEstado = !u.activo;
      await updateDoc(doc(db, "usuarios", u.id), {
        activo: nuevoEstado,
        estado: nuevoEstado ? 'activo' : 'inactivo'
      });
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  const eliminarUsuario = async (u) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario ${u.email}?`)) return;
    try {
      await deleteDoc(doc(db, "usuarios", u.id));
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const term = busqueda.toLowerCase().trim();
    return (
      (u.nombre || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.rol || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Header Módulo */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 ${
        temaClaro ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-500" />
            Gestión y Control de Usuarios
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Administra perfiles, roles y permisos de acceso a las áreas del hospital
          </p>
        </div>

        <button
          onClick={() => setMostrarModalCrear(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Usuario</span>
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o rol..."
          className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-xs focus:outline-none transition ${
            temaClaro ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900/80 border-slate-800 text-white'
          }`}
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className={`border rounded-3xl overflow-hidden shadow-xl ${
        temaClaro ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b text-xs font-bold ${
              temaClaro ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <th className="py-3.5 px-4">Usuario / Nombre</th>
              <th className="py-3.5 px-4">Correo Electrónico</th>
              <th className="py-3.5 px-4">Rol Asignado</th>
              <th className="py-3.5 px-4">Servicio</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-xs font-medium">
            {usuariosFiltrados.map((u) => (
              <tr key={u.id} className={temaClaro ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                <td className="py-3.5 px-4 font-bold">{u.nombre || 'Sin nombre'}</td>
                <td className="py-3.5 px-4 font-mono text-slate-400">{u.email}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                    u.rol === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                    u.rol === 'MEDICO' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                    u.rol === 'ADMISION' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {u.rol || 'OPERADOR'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400">{u.servicio || 'TODOS'}</td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => toggleEstadoActivo(u)}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition flex items-center gap-1 mx-auto ${
                      u.activo !== false
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {u.activo !== false ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                    <span>{u.activo !== false ? 'Activo' : 'Inactivo'}</span>
                  </button>
                </td>
                <td className="py-3.5 px-4 text-right space-x-1">
                  <button
                    onClick={() => {
                      setUsuarioEditar(u);
                      setFormEditar({
                        nombre: u.nombre || '',
                        rol: u.rol || 'OPERADOR',
                        servicio: u.servicio || 'TODOS',
                        activo: u.activo !== false
                      });
                    }}
                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition"
                    title="Editar permisos"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => eliminarUsuario(u)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR USUARIO CON ROL MÉDICO INCLUIDO */}
      {mostrarModalCrear && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
                <UserPlus className="w-5 h-5" />
                Registrar Usuario
              </h3>
              <button onClick={() => setMostrarModalCrear(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={formCrear.nombre}
                  onChange={(e) => setFormCrear({ ...formCrear, nombre: e.target.value })}
                  placeholder="Ej. Dr. Mario Torres"
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  value={formCrear.email}
                  onChange={(e) => setFormCrear({ ...formCrear, email: e.target.value })}
                  placeholder="usuario@essalud.gob.pe"
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Contraseña:</label>
                <input
                  type="password"
                  required
                  value={formCrear.password}
                  onChange={(e) => setFormCrear({ ...formCrear, password: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Rol Permiso:</label>
                  <select
                    value={formCrear.rol}
                    onChange={(e) => setFormCrear({ ...formCrear, rol: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                      temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="ADMISION">ADMISIÓN</option>
                    <option value="MEDICO">MÉDICO</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Servicio:</label>
                  <select
                    value={formCrear.servicio}
                    onChange={(e) => setFormCrear({ ...formCrear, servicio: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                      temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="TODOS">TODOS</option>
                    <option value="EMERGENCIA">EMERGENCIA</option>
                    <option value="CONSULTA_EXTERNA">CONSULTA EXTERNA</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalCrear(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg"
                >
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {usuarioEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                <Pencil className="w-5 h-5" />
                Editar Usuario
              </h3>
              <button onClick={() => setUsuarioEditar(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Correo: <strong className="text-white">{usuarioEditar.email}</strong></p>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={formEditar.nombre}
                  onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Rol Permiso:</label>
                  <select
                    value={formEditar.rol}
                    onChange={(e) => setFormEditar({ ...formEditar, rol: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                      temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="ADMISION">ADMISIÓN</option>
                    <option value="MEDICO">MÉDICO</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Servicio:</label>
                  <select
                    value={formEditar.servicio}
                    onChange={(e) => setFormEditar({ ...formEditar, servicio: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                      temaClaro ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="TODOS">TODOS</option>
                    <option value="EMERGENCIA">EMERGENCIA</option>
                    <option value="CONSULTA_EXTERNA">CONSULTA EXTERNA</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chkActivo"
                  checked={formEditar.activo}
                  onChange={(e) => setFormEditar({ ...formEditar, activo: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700"
                />
                <label htmlFor="chkActivo" className="text-xs font-bold text-slate-300">Cuenta Activa</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUsuarioEditar(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
                >
                  {cargando ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}