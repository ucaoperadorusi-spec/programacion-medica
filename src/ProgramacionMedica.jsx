import React, { useState } from "react";
import { db } from "./firebase"; // Ajusta la ruta a tu archivo de configuración de Firebase
import { collection, getDocs, writeBatch } from "firebase/firestore";

export default function ProgramacionMedica() {
  const [cargando, setCargando] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);

  // Verificación simple de PIN local
  const handleLoginAdmin = (e) => {
    e.preventDefault();
    if (pin === "1234") {
      setEsAdmin(true);
      alert("Acceso concedido como administrador.");
    } else {
      alert("PIN incorrecto.");
    }
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
        <form onSubmit={handleLoginAdmin} style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Ingrese PIN de Administrador:
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Ej: 1234"
            style={{ padding: "8px", marginRight: "10px" }}
          />
          <button type="submit" style={{ padding: "8px 12px" }}>
            Ingresar
          </button>
        </form>
      ) : (
        <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
          <p style={{ color: "green", fontWeight: "bold" }}>
            Modo Administrador Activo
          </p>

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