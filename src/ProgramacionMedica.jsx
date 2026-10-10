import React, { useState } from "react";
import { db } from "./firebase"; // Ajusta la ruta a tu archivo de configuración de Firebase
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function ProgramacionMedica() {
  const [cargando, setCargando] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);

  // Autenticación segura mediante Firebase Auth (reemplaza la verificación por PIN)
  const handleLoginAdmin = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEsAdmin(true);
      alert("Acceso concedido como administrador.");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Error al autenticar:", error);
      alert("Credenciales incorrectas o usuario no autorizado.");
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
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