import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Configuración de respaldo por variables de entorno
const envConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Función para obtener la configuración activa (entorno o localStorage)
export function getFirebaseConfig(): FirebaseConfig {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("lezcom_firebase_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return parsed as FirebaseConfig;
        }
      } catch (e) {
        console.error("Error al parsear Firebase config de localStorage:", e);
      }
    }
  }
  return envConfig;
}

// Inicializar de manera dinámica
export function getFirebaseApp() {
  const config = getFirebaseConfig();
  
  if (!config.apiKey || !config.projectId) {
    // Sin credenciales cargadas
    return null;
  }

  const apps = getApps();
  if (apps.length > 0) {
    // Si la configuración coincide, reusamos la app existente
    const currentApp = apps[0];
    if (currentApp.options.apiKey === config.apiKey && currentApp.options.projectId === config.projectId) {
      return currentApp;
    }
    // Si cambió la configuración en caliente, eliminamos la anterior y creamos una nueva
    try {
      deleteApp(currentApp);
    } catch (e) {
      console.error("Error deleting old Firebase App:", e);
    }
  }

  try {
    return initializeApp(config);
  } catch (error) {
    console.error("Error al inicializar Firebase App:", error);
    return null;
  }
}

// Obtener instancia de Firestore
export function getDb() {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch (error) {
    console.error("Error al obtener Firestore:", error);
    return null;
  }
}
