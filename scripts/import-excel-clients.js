process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Cargar variables de entorno desde .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

// Inicializar Firebase App y Firestore
const { initializeApp } = require('firebase/app');
const { initializeFirestore, doc, setDoc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Inicializando conexión con Firebase:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});

const EXCEL_PATH = 'C:/Users/diemo/Downloads/BBDD_clientes.xlsx';
const BACKUP_PATH = 'C:/Users/diemo/Downloads/BBDD_clientes_BACKUP_ORIGINAL.xlsx';

async function main() {
  try {
    if (!fs.existsSync(EXCEL_PATH)) {
      console.error("El archivo no existe en:", EXCEL_PATH);
      process.exit(1);
    }

    // 1. Crear copia de seguridad si no existe
    if (!fs.existsSync(BACKUP_PATH)) {
      console.log("Creando copia de respaldo original en:", BACKUP_PATH);
      fs.copyFileSync(EXCEL_PATH, BACKUP_PATH);
    }

    console.log("Leyendo archivo Excel...");
    const wb = XLSX.readFile(EXCEL_PATH);
    
    // Seleccionamos la hoja con mayor riqueza de datos (20.000 EMPRESAS SI)
    const targetSheetName = wb.SheetNames.includes('20.000 EMPRESAS SI') 
      ? '20.000 EMPRESAS SI' 
      : wb.SheetNames[1];

    console.log(`Usando la hoja: "${targetSheetName}"`);
    const sheet = wb.Sheets[targetSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const header = rows[0];
    const dataRows = rows.slice(1);

    console.log(`Total de filas encontradas en la hoja: ${dataRows.length}`);

    // Identificar índices de columnas principales
    const getIndex = (possibleNames) => {
      return header.findIndex(h => h && possibleNames.some(name => h.toString().toLowerCase().trim() === name.toLowerCase().trim()));
    };

    const idxRut = getIndex(['rut']);
    const idxDv = getIndex(['dv']);
    const idxRazonSocial = getIndex(['razón social', 'razonsocial']);
    const idxTipoEmpresa = getIndex(['tipo empresa', 'tipoempresa']);
    const idxRubro = getIndex(['rubro económico', 'rubro']);
    const idxSubrubro = getIndex(['subrubro económico', 'subrubro']);
    const idxActividad = getIndex(['actividad económica', 'actividad']);
    const idxComuna = getIndex(['comuna']);
    const idxCiudad = getIndex(['ciudad']);
    const idxCalle = getIndex(['calle', 'direccion']);
    const idxNumero = getIndex(['numero', 'número']);
    const idxEmail = getIndex(['email', 'correo']);
    const idxDomain = getIndex(['domain', 'sitio web', 'sitioweb']);

    // Filtrar filas válidas que tengan correo o RUT
    const validRows = [];
    const skippedRows = [];

    for (const r of dataRows) {
      if (!r || r.length === 0) continue;
      const email = idxEmail !== -1 && r[idxEmail] ? r[idxEmail].toString().trim() : '';
      const rutNum = idxRut !== -1 && r[idxRut] ? r[idxRut].toString().trim() : '';
      const razonSocial = idxRazonSocial !== -1 && r[idxRazonSocial] ? r[idxRazonSocial].toString().trim() : '';

      if ((email || rutNum) && razonSocial) {
        validRows.push(r);
      } else {
        skippedRows.push(r);
      }
    }

    console.log(`Filas con datos válidos: ${validRows.length}`);

    const processCount = Math.min(5000, validRows.length);
    const toProcessRows = validRows.slice(0, processCount);
    const remainingValidRows = validRows.slice(processCount);
    const totalRemainingRows = [...remainingValidRows, ...skippedRows];

    console.log(`Se procesarán ${toProcessRows.length} clientes para subir a Firestore.`);
    console.log(`Quedarán ${totalRemainingRows.length} clientes en el archivo Excel.`);

    // 2. Formatear clientes a la estructura de Firestore
    const contacts = [];
    for (const r of toProcessRows) {
      const email = idxEmail !== -1 && r[idxEmail] ? r[idxEmail].toString().trim() : '';
      const rawRut = idxRut !== -1 && r[idxRut] ? r[idxRut].toString().trim() : '';
      const dv = idxDv !== -1 && r[idxDv] !== undefined ? r[idxDv].toString().trim() : '';
      const fullRut = rawRut ? (dv ? `${rawRut}-${dv}` : rawRut) : '';
      const razonSocial = idxRazonSocial !== -1 && r[idxRazonSocial] ? r[idxRazonSocial].toString().trim() : 'Empresa sin nombre';

      // Determinar Rubro refinado
      const rubroEcon = idxRubro !== -1 && r[idxRubro] ? r[idxRubro].toString().trim() : '';
      const subrubro = idxSubrubro !== -1 && r[idxSubrubro] ? r[idxSubrubro].toString().trim() : '';
      const actividad = idxActividad !== -1 && r[idxActividad] ? r[idxActividad].toString().trim() : '';
      
      let finalRubro = actividad || subrubro || rubroEcon || 'General / Comercio';

      if (finalRubro.length > 80) {
        finalRubro = finalRubro.substring(0, 77) + '...';
      }

      const calle = idxCalle !== -1 && r[idxCalle] ? r[idxCalle].toString().trim() : '';
      const numero = idxNumero !== -1 && r[idxNumero] ? r[idxNumero].toString().trim() : '';
      const direccion = `${calle} ${numero}`.trim();
      const comuna = idxComuna !== -1 && r[idxComuna] ? r[idxComuna].toString().trim() : '';
      const ciudad = idxCiudad !== -1 && r[idxCiudad] ? r[idxCiudad].toString().trim() : '';
      const domain = idxDomain !== -1 && r[idxDomain] ? r[idxDomain].toString().trim() : '';
      const sitioWeb = domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : '';
      const tipoEmpresa = idxTipoEmpresa !== -1 && r[idxTipoEmpresa] ? r[idxTipoEmpresa].toString().trim() : '';

      const docId = (fullRut || email).replace(/\./g, '_');

      const contactObj = {
        id: docId,
        Rut: fullRut,
        rut: fullRut,
        RazonSocial: razonSocial,
        Rubro: finalRubro,
        Pitch_Personalizado: '',
        TipoEmpresa: tipoEmpresa,
        Direccion: direccion,
        Comuna: comuna,
        Ciudad: ciudad,
        Pais: 'Chile',
        Representante: '',
        NombreContacto: '',
        CargoContacto: '',
        CelularContacto: '',
        TelefonoContacto: '',
        FonoContacto: '',
        SitioWeb: sitioWeb,
        EMAIL: email,
        Estado: 'Activo',
        tracking: {
          estadoEnvio: 'pendiente',
          ultimoEnvio: null,
          mensajeId: null,
          errorDetalle: null,
          intentos: 0
        }
      };

      contacts.push(contactObj);
    }

    // 3. Subir a Firestore en lotes de 500 (Batch writes)
    console.log("\n--- Subiendo clientes a Firebase Firestore ---");
    const BATCH_SIZE = 500;
    let uploadedCount = 0;

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const chunk = contacts.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const contact of chunk) {
        const docRef = doc(db, 'contacts', contact.id);
        batch.set(docRef, contact, { merge: true });
      }

      await batch.commit();
      uploadedCount += chunk.length;
      console.log(`✔ Lote subido exitosamente: ${uploadedCount} de ${contacts.length} clientes...`);
    }

    console.log(`\n🎉 ¡Carga completa! Se subieron ${uploadedCount} clientes a la colección "contacts" de Firebase.`);

    // 4. Actualizar el archivo Excel manteniendo solo los registros restantes
    console.log("\n--- Actualizando archivo Excel con los registros restantes ---");
    const newSheetData = [header, ...totalRemainingRows];
    const newSheet = XLSX.utils.aoa_to_sheet(newSheetData);
    wb.Sheets[targetSheetName] = newSheet;

    XLSX.writeFile(wb, EXCEL_PATH);
    console.log(`✔ El archivo Excel "${EXCEL_PATH}" ha sido actualizado.`);
    console.log(`Registros restantes guardados en la hoja "${targetSheetName}": ${totalRemainingRows.length}`);
    console.log("Proceso finalizado con éxito.");

  } catch (error) {
    console.error("❌ Error durante el procesamiento:", error);
    process.exit(1);
  }
}

main();
