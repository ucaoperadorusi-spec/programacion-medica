const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Tu clave de cuenta de servicio de Firebase

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Coloca el UID exacto de uca.operadorusi@essalud.gob.pe (lo ves en Firebase Console > Authentication)
const uid = "UID_DEL_USUARIO_AQUI"; 

admin.auth().setCustomUserClaims(uid, { role: 'ADMIN' })
  .then(() => {
    console.log("¡Rol ADMIN asignado con éxito!");
    process.exit();
  })
  .catch(error => {
    console.error("Error asignando rol:", error);
  });