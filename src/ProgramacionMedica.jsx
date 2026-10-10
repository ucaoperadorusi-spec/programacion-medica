import React, { useState } from "react";
import { db, auth } from "./firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getDocs, collection, writeBatch } from "firebase/firestore";

export default function ProgramacionMedica() {
  const [cargando, setCargando] = useState(false);
  const [rolUsuario, setRolUsuario] = useState(null); // 'ADMIN' | 'OPERADOR' | null
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorPin, setErrorPin] = useState(false);
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);

  // Autenticación segura mediante Firebase Auth
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorPin(false);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;

      // Único correo con permisos de Administrador
      const correosAdmin = ['andymsr2000@gmail.com'];
      
      if (correosAdmin.includes(user.email.toLowerCase())) {
        setRolUsuario('ADMIN');
      } else {
        setRolUsuario('OPERADOR');
      }

      setEmailInput('');
      setPasswordInput('');
    } catch (error) {
      console.error("Error al iniciar sesión:", error.code, error.message);
      setErrorPin(true);
    }
  };

  // Cierre de sesión de Firebase
  const handleLogout = async () => {
    await signOut(auth);
    setRolUsuario(null);
  };

  // Función de eliminación masiva por bloques (solo ADMIN)
  const limpiarBaseDatos = async () => {
    if (rolUsuario !== 'ADMIN') return;
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

      {!rolUsuario ? (
        <form onSubmit={handleLogin} style={{ marginBottom: "20px", maxWidth: "320px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
              Correo Electrónico:
            </label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="usuario@hospital.gob.pe"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} 
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
              Contraseña:
            </label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} 
            />
          </div>

          {errorPin && (
            <p style={{ color: "red", fontSize: "12px" }}>Credenciales no válidas.</p>
          )}

          <button type="submit" style={{ padding: "8px 16px", cursor: "pointer" }}>
            Ingresar
          </button>
        </form>
      ) : (
        <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <p style={{ color: rolUsuario === 'ADMIN' ? "green" : "#0284c7", fontWeight: "bold", margin: 0 }}>
              Modo {rolUsuario === 'ADMIN' ? 'Administrador' : 'Operador'} Activo
            </p>
            <button
              onClick={handleLogout}
              style={{ padding: "6px 12px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Cerrar Sesión
            </button>
          </div>

          {/* El botón de borrado solo se renderiza si el usuario es Administrador */}
          {rolUsuario === 'ADMIN' && (
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
          )}
        </div>
      )}
    </div>
  );
}