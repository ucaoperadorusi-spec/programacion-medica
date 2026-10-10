import { signInWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { getDocs, collection, writeBatch } from "firebase/firestore";
import React, { useState } from "react";
import { db } from "./firebase";


export default function ProgramacionMedica() {
  const [cargando, setCargando] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);

  // Autenticación segura mediante Firebase Auth (reemplaza la verificación por PIN)
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorPin(false);

    // Limpiar espacios en blanco al inicio y al final
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;

      // Asignar rol según el correo
      const correosAdmin = ['uca.operadorusi@essalud.gob.pe', 'andymsr2000@gmail.com'];
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

  // Cierre de sesión de Firebase
  const handleLogoutAdmin = async () => {
    const auth = getAuth();
    await signOut(auth);
    setEsAdmin(false);
  };

  // Función de eliminación con división en bloques (chunks)
  const limpiarBaseDatos = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar TODA la programación cargada?")) return;

    setCargando(true);
    try {
      const querySnapshot = await getDocs(collection(db, "programacion_medica"));
      const docs = querySnapshot.docs;

      if (docs.length === 0) {
        alert("No hay registros guardados en Firestore para eliminar.");
        setCargando(false);
        return;
      }

      // Firestore permite máximo 500 operaciones por batch. Se usa 400 por seguridad.
      const BATCH_SIZE = 400;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + BATCH_SIZE);
        chunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      setModulosSeleccionados([]);
      alert("Toda la programación fue eliminada correctamente de Firestore.");
    } catch (err) {
      console.error("Error al limpiar la base de datos:", err);
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Módulo de Programación Médica</h2>

      {!esAdmin ? (
        <form onSubmit={handleLoginAdmin} style={{ marginBottom: "20px", maxWidth: "320px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
              Correo Electrónico de Administrador:
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hospital.gob.pe"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
              Contraseña:
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </div>

          <button type="submit" style={{ padding: "8px 16px", cursor: "pointer" }}>
            Ingresar
          </button>
        </form>
      ) : (
        <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <p style={{ color: "green", fontWeight: "bold", margin: 0 }}>
              Modo Administrador Activo
            </p>
            <button
              onClick={handleLogoutAdmin}
              style={{ padding: "6px 12px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Cerrar Sesión
            </button>
          </div>

          <button
            onClick={limpiarBaseDatos}
            disabled={cargando}
            style={{
              backgroundColor: cargando ? "#ccc" : "#d9534f",
              color: "white",
              padding: "10px 18px",
              border: "none",
              borderRadius: "4px",
              cursor: cargando ? "not-allowed" : "pointer"
            }}
          >
            {cargando ? "Eliminando registros..." : "Limpiar Base de Datos"}
          </button>
        </div>
      )}
    </div>
  );
}
