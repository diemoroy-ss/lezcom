"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  getDb, 
  getFirebaseConfig, 
  FirebaseConfig 
} from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  limit 
} from "firebase/firestore";

// interfaces
interface ContactTracking {
  estadoEnvio: "pendiente" | "enviando" | "enviado" | "fallido";
  ultimoEnvio: any;
  mensajeId: string | null;
  errorDetalle: string | null;
  intentos: number;
}

interface Contact {
  id: string;
  rut?: string;
  n?: number | string;
  Rut: string;
  RazonSocial: string;
  Rubro: string;
  Pitch_Personalizado: string;
  TipoEmpresa?: string;
  Direccion?: string;
  Comuna?: string;
  Ciudad?: string;
  Pais?: string;
  Representante: string;
  FonoRepresentante?: string;
  Representante2?: string;
  FonoContacto?: string;
  SitioWeb?: string;
  EMAIL: string;
  Estado?: string;
  tracking: ContactTracking;
  // Campos del Excel del usuario
  NombreContacto?: string;
  CargoContacto?: string;
  CelularContacto?: string;
  TelefonoContacto?: string;
}


interface Template {
  id: string;
  Rubro: string;
  Template: string;
  ultimoSync?: any;
}

export interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string;
  imagen: string;
  keywords: string;
  metaDescription: string;
  fecha: any;
  leido: string;
  publicado: boolean;
}

interface ConsoleLog {
  text: string;
  type: "info" | "success" | "warn" | "error";
  timestamp: string;
}

interface FirestoreLog {
  id: string;
  emailCliente: string;
  razonSocial: string;
  areaTemplate: string;
  fecha: any;
  status: "exito" | "error";
  mensajeId: string | null;
  error: string | null;
}

export default function AdminPage() {
  // Pestaña Activa
  const [activeTab, setActiveTab] = useState<"dashboard" | "contacts" | "templates" | "settings" | "blogs">("dashboard");
  const [settingsSubTab, setSettingsSubTab] = useState<"credentials" | "sync">("credentials");

  // Estados del Blog IA
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [showBlogEditorModal, setShowBlogEditorModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);

  // Formulario de Generación de Blog
  const [newBlogTopic, setNewBlogTopic] = useState("");
  const [newBlogKeywords, setNewBlogKeywords] = useState("");
  const [newBlogTone, setNewBlogTone] = useState<"Profesional" | "Informativo" | "Persuasivo" | "Técnico" | "Cercano">("Profesional");

  // Editor de Blog
  const [blogFormTitle, setBlogFormTitle] = useState("");
  const [blogFormSlug, setBlogFormSlug] = useState("");
  const [blogFormResumen, setBlogFormResumen] = useState("");
  const [blogFormContent, setBlogFormContent] = useState("");
  const [blogFormKeywords, setBlogFormKeywords] = useState("");
  const [blogFormMetaDesc, setBlogFormMetaDesc] = useState("");
  const [blogFormImage, setBlogFormImage] = useState("");
  const [blogFormLeido, setBlogFormLeido] = useState("");
  const [blogFormPublicado, setBlogFormPublicado] = useState(false);


  // Configuración del Sistema
  const [brevoApiKey, setBrevoApiKey] = useState("");
  const [senderName, setSenderName] = useState("Lezcom SpA");
  const [senderEmail, setSenderEmail] = useState("info@lezcom.cl");
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("https://n8n.santisoft.cl/webhook/get-email-data");
  
  // Firebase local state
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  });
  const [firebaseActive, setFirebaseActive] = useState(false);

  // Datos principales
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // Selección de contactos en la tabla
  const [selectedContacts, setSelectedContacts] = useState<Record<string, boolean>>({});
  
  // Filtros de tabla
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [rubroFilter, setRubroFilter] = useState("todos");

  // Modales
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvType, setCsvType] = useState<"contacts" | "templates">("contacts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Custom Alert / Notification Modal State
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string; type: "success" | "info" | "error" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; type: "single" | "all"; contactId?: string } | null>(null);
  const [campaignConfirm, setCampaignConfirm] = useState<{ show: boolean; type: "send" | "reset"; selectedCount: number } | null>(null);
  const [selectedTrackingDetail, setSelectedTrackingDetail] = useState<Contact | null>(null);
  const [currentProcessingContact, setCurrentProcessingContact] = useState<string | null>(null);

  // Logs históricos persistentes de Firestore
  const [historicalLogs, setHistoricalLogs] = useState<FirestoreLog[]>([]);
  const [showLogsModal, setShowLogsModal] = useState<{ show: boolean; filter: "all" | "exito" | "error" } | null>(null);


  
  // New Template Creator Modal State
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTemplateRubro, setNewTemplateRubro] = useState("");
  const [newTemplateHtml, setNewTemplateHtml] = useState("");
  const [rubroSelectionType, setRubroSelectionType] = useState<"existing" | "new">("existing");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editorPreviewContactId, setEditorPreviewContactId] = useState<string>("");
  const [isImprovingTemplate, setIsImprovingTemplate] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<{
    puntuacion_total: number;
    diagnostico: Record<string, number>;
    problemas: string[];
    mejoras_aplicadas: string[];
    html_mejorado: string;
  } | null>(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, phase: "" });



  // Manual Client Creation State
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState<Partial<Contact>>({
    Rut: "",
    RazonSocial: "",
    Rubro: "",
    Representante: "",
    EMAIL: "",
    Pitch_Personalizado: ""
  });



  // Estados de carga / sincronización
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingBrevo, setIsTestingBrevo] = useState(false);

  // Vista previa de plantillas
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<string>("");
  const [selectedPreviewContact, setSelectedPreviewContact] = useState<string>("");

  // Motor de envío de correos
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(0);
  const [campaignTotal, setCampaignTotal] = useState(0);
  const [campaignSentCount, setCampaignSentCount] = useState(0);
  const [campaignFailedCount, setCampaignFailedCount] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientOnlyFileInputRef = useRef<HTMLInputElement>(null);


  // Carga inicial de datos desde LocalStorage y Firebase
  useEffect(() => {
    // 1. Carga de configuraciones desde LocalStorage
    if (typeof window !== "undefined") {
      setBrevoApiKey(localStorage.getItem("lezcom_brevo_api_key") || "");
      setSenderName(localStorage.getItem("lezcom_sender_name") || "Lezcom SpA");
      setSenderEmail(localStorage.getItem("lezcom_sender_email") || "info@lezcom.cl");
      setN8nWebhookUrl(localStorage.getItem("lezcom_n8n_webhook_url") || "");
      
      const savedFirebase = localStorage.getItem("lezcom_firebase_config");
      if (savedFirebase) {
        try {
          const parsed = JSON.parse(savedFirebase);
          setFirebaseConfig(parsed);
        } catch (e) {
          console.error("Error al parsear Firebase config de localStorage", e);
        }
      } else {
        // Cargar por defecto variables de entorno si existen
        setFirebaseConfig(getFirebaseConfig());
      }
    }
  }, []);

  // Carga de datos desde Firebase Firestore una vez configurado
  useEffect(() => {
    loadDataFromFirebase();
  }, [firebaseConfig]);

  // Scroll automático en consola de logs
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  // Función para cargar datos desde Firebase
  const loadDataFromFirebase = async () => {
    setIsDbLoading(true);
    const db = getDb();
    if (!db) {
      setFirebaseActive(false);
      setIsDbLoading(false);
      setContacts([]);
      setTemplates([]);
      return;
    }
    
    setFirebaseActive(true);
    try {
      // Cargar contactos
      const contactsSnap = await getDocs(collection(db, "contacts"));
      const contactsList: Contact[] = [];
      contactsSnap.forEach((doc) => {
        contactsList.push({ id: doc.id, ...doc.data() } as Contact);
      });
      // Ordenar por fila 'n' si existe, si no por razon social
      contactsList.sort((a, b) => {
        const nA = Number(a.n) || 99999;
        const nB = Number(b.n) || 99999;
        return nA - nB;
      });
      setContacts(contactsList);

      // Cargar plantillas
      const templatesSnap = await getDocs(collection(db, "templates"));
      const templatesList: Template[] = [];
      templatesSnap.forEach((doc) => {
        const data = doc.data();
        templatesList.push({ 
          id: doc.id, 
          Rubro: data.Rubro || data.Area || "", 
          Template: data.Template || "",
          ultimoSync: data.ultimoSync 
        } as Template);
      });
      setTemplates(templatesList);

      // Cargar logs históricos de envíos (ordenados por fecha desc, máximo 500)
      try {
        const logsQuery = query(collection(db, "logs"), orderBy("fecha", "desc"), limit(500));
        const logsSnap = await getDocs(logsQuery);
        const logsList: FirestoreLog[] = [];
        logsSnap.forEach((doc) => {
          logsList.push({ id: doc.id, ...doc.data() } as FirestoreLog);
        });
        setHistoricalLogs(logsList);
      } catch (logsErr) {
        console.warn("No se pudieron cargar logs históricos:", logsErr);
      }

      // Cargar blogs generados por IA
      try {
        const blogsQuery = query(collection(db, "blogs"), orderBy("fecha", "desc"));
        const blogsSnap = await getDocs(blogsQuery);
        const blogsList: BlogPost[] = [];
        blogsSnap.forEach((doc) => {
          blogsList.push({ id: doc.id, ...doc.data() } as BlogPost);
        });
        setBlogs(blogsList);
      } catch (blogsErr) {
        console.warn("No se pudieron cargar los blogs generados:", blogsErr);
      }

      // Inicializar seleccionados para previsualización
      if (templatesList.length > 0) {
        setSelectedPreviewTemplate(templatesList[0].Rubro);
      }
      if (contactsList.length > 0) {
        setSelectedPreviewContact(contactsList[0].id);
      }

    } catch (error) {
      console.error("Error al cargar datos desde Firebase Firestore:", error);
      addLog("Error al cargar datos desde Firebase: " + (error as any).message, "error");
    } finally {
      setIsDbLoading(false);
    }
  };

  // Función auxiliar para agregar logs a la consola virtual
  const addLog = (text: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => [...prev, { text, type, timestamp }]);
  };

  // Mostrar modal de alerta personalizado (reemplaza alert)
  const showNotificationModal = (title: string, message: string, type: "success" | "info" | "error" = "info") => {
    setNotification({ show: true, title, message, type });
  };

  // Parser de clientes de Excel únicamente
  const handleClientOnlyExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingExcel(true);
    setImportProgress({ current: 0, total: 0, phase: `Leyendo archivo Excel de clientes: ${file.name}...` });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        
        const sheetNames = wb.SheetNames;
        let clientsSheetName = sheetNames.find(name => 
          name.toLowerCase().trim() === "clientes" || 
          name.toLowerCase().includes("cliente")
        ) || sheetNames[0]; // Caer al primero por defecto

        if (!clientsSheetName) {
          showNotificationModal("Error", "No se encontró ninguna pestaña en el archivo Excel.", "error");
          setIsImportingExcel(false);
          return;
        }

        const parsedClients = XLSX.utils.sheet_to_json(wb.Sheets[clientsSheetName]);
        
        if (parsedClients.length === 0) {
          showNotificationModal("Archivo Vacío", "No se encontraron filas con datos de clientes en la pestaña leída.", "error");
          setIsImportingExcel(false);
          return;
        }

        addLog(`Cargando ${parsedClients.length} contactos en Firebase Firestore...`, "info");
        await handleBulkUpsert(parsedClients, []);

        showNotificationModal("¡Carga Exitosa! 🎉", `Se han cargado e importado ${parsedClients.length} contactos de forma exitosa en Firestore de Firebase.`, "success");
        
      } catch (err: any) {
        console.error("Error al leer Excel de clientes:", err);
        addLog(`Error al procesar Excel de clientes: ${err.message}`, "error");
        showNotificationModal("Error al Cargar", err.message, "error");
      } finally {
        setIsImportingExcel(false);
        if (e.target) {
          e.target.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Crear cliente manual en Firebase
  const handleCreateNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailVal = newClientData.EMAIL?.trim();
    if (!emailVal) {
      showNotificationModal("Campo Requerido", "El correo electrónico es obligatorio para registrar un contacto.", "error");
      return;
    }

    const db = getDb();
    if (!db) {
      showNotificationModal("Error", "Firebase Firestore no está conectado.", "error");
      return;
    }

    try {
      const docId = (newClientData.Rut?.trim() || emailVal).replace(/\./g, "_");
      const docRef = doc(db, "contacts", docId);
      
      const cleanData: any = {
        Rut: newClientData.Rut?.trim() || "",
        RazonSocial: newClientData.RazonSocial?.trim() || "",
        Rubro: newClientData.Rubro?.trim() || "",
        Representante: newClientData.Representante?.trim() || "",
        NombreContacto: newClientData.Representante?.trim() || "",
        CargoContacto: newClientData.CargoContacto?.trim() || "",
        CelularContacto: newClientData.CelularContacto?.trim() || "",
        TelefonoContacto: newClientData.TelefonoContacto?.trim() || "",
        FonoContacto: newClientData.TelefonoContacto?.trim() || newClientData.CelularContacto?.trim() || "",
        FonoRepresentante: newClientData.CelularContacto?.trim() || newClientData.TelefonoContacto?.trim() || "",
        EMAIL: emailVal,
        Pitch_Personalizado: newClientData.Pitch_Personalizado?.trim() || "",
        tracking: {
          estadoEnvio: "pendiente",
          ultimoEnvio: null,
          mensajeId: null,
          errorDetalle: null,
          intentos: 0
        }
      };


      await setDoc(docRef, cleanData, { merge: true });

      // Actualizar estado local
      setContacts(prev => {
        const existingIndex = prev.findIndex(c => c.id === docId);
        const contactObj = { id: docId, ...cleanData };
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = contactObj;
          return updated;
        } else {
          return [...prev, contactObj];
        }
      });

      setShowNewClientModal(false);
      showNotificationModal("Cliente Registrado 🎉", `El cliente "${newClientData.RazonSocial}" ha sido guardado exitosamente en Firestore.`, "success");
    } catch (err: any) {
      showNotificationModal("Error al Guardar", err.message, "error");
    }
  };

  // Guardar nueva plantilla creada en caliente
  const handleCreateNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rubroVal = newTemplateRubro.trim();
    if (!rubroVal || !newTemplateHtml.trim()) {
      showNotificationModal("Campos Faltantes", "Por favor ingresa un nombre para el Rubro y el código HTML de tu plantilla.", "error");
      return;
    }

    const db = getDb();
    if (!db) {
      showNotificationModal("Error de Conexión", "Firebase no está conectado.", "error");
      return;
    }

    try {
      const docId = editingTemplateId || rubroVal.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
      const docRef = doc(db, "templates", docId);
      
      const newTempObj = {
        Rubro: rubroVal,
        Template: newTemplateHtml,
        ultimoSync: new Date()
      };

      await setDoc(docRef, newTempObj, { merge: true });
      
      // Actualizar estado local
      setTemplates(prev => {
        const existingIndex = prev.findIndex(t => t.id === docId);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = { id: docId, ...newTempObj };
          return updated;
        } else {
          return [...prev, { id: docId, ...newTempObj }];
        }
      });

      setSelectedPreviewTemplate(rubroVal);
      setShowNewTemplateModal(false);
      setEditingTemplateId(null);
      showNotificationModal("Plantilla Guardada 🎉", `La plantilla para el Rubro "${rubroVal}" ha sido guardada en Firestore de forma segura.`, "success");
    } catch (err: any) {
      showNotificationModal("Error al Guardar", err.message, "error");
    }
  };


  // Guardar configuración de Brevo y n8n
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("lezcom_brevo_api_key", brevoApiKey);
    localStorage.setItem("lezcom_sender_name", senderName);
    localStorage.setItem("lezcom_sender_email", senderEmail);
    localStorage.setItem("lezcom_n8n_webhook_url", n8nWebhookUrl);
    
    showNotificationModal("Configuración Guardada", "Las credenciales de mensajería y Webhooks se han guardado localmente.", "success");
    addLog("Configuración de Brevo y n8n guardada localmente.", "success");
  };

  // Guardar configuración de Firebase
  const handleSaveFirebaseSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("lezcom_firebase_config", JSON.stringify(firebaseConfig));
    showNotificationModal("Firebase Configurado", "La configuración de Firebase Firestore fue guardada. El panel se reiniciará para reconectar.", "success");
  };

  // Conexión y sincronización de n8n
  const handleSyncWithN8n = async () => {
    if (!n8nWebhookUrl) {
      showNotificationModal("Falta Webhook", "Por favor, configura la URL del webhook de n8n en la sección de Configuración.", "error");
      return;
    }


    setIsSyncing(true);
    addLog("Llamando al Webhook de n8n para importar datos de Google Sheets...", "info");

    try {
      // Usar proxy interno para saltar CORS
      const response = await fetch(`/api/admin/proxy-sheet?url=${encodeURIComponent(n8nWebhookUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Error del servidor proxy: ${response.statusText}`);
      }

      const data = await response.json();
      addLog("Respuesta recibida exitosamente desde n8n.", "success");

      // Validar estructura de n8n
      // n8n debe devolver un JSON con formato: { clients: [...], templates: [...] }
      // O a veces viene directamente una lista si se hace individual. 
      // Soportaremos ambos comportamientos de manera inteligente:
      let importedClients: any[] = [];
      let importedTemplates: any[] = [];

      if (data && typeof data === "object") {
        if (Array.isArray(data.clients)) importedClients = data.clients;
        if (Array.isArray(data.templates)) importedTemplates = data.templates;
        
        // Si no viene en esa estructura sino directo en array
        if (Array.isArray(data) && data.length > 0) {
          // Detectamos si son clientes o plantillas
          if (data[0].EMAIL || data[0].RazonSocial) {
            importedClients = data;
          } else if (data[0].Template || data[0].Area) {
            importedTemplates = data;
          }
        }
      }

      if (importedClients.length === 0 && importedTemplates.length === 0) {
        addLog("Advertencia: El webhook devolvió un JSON pero no se detectaron clientes ni plantillas con la estructura esperada.", "warn");
        showNotificationModal("Sincronización Vacía", "Sincronización finalizada pero no se encontraron registros compatibles. Revisa la terminal.", "error");
        return;
      }


      addLog(`Se detectaron ${importedClients.length} contactos y ${importedTemplates.length} plantillas para sincronizar.`, "info");
      
      // Upsert a Firebase
      await handleBulkUpsert(importedClients, importedTemplates);

    } catch (error: any) {
      console.error("Error de sincronización con n8n:", error);
      addLog(`Error de sincronización: ${error.message}`, "error");
      showNotificationModal("Fallo de Sincronización", `La sincronización automática con n8n falló: ${error.message}`, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Función de sincronización masiva en Firestore
  const handleBulkUpsert = async (importedClients: any[], importedTemplates: any[]) => {
    const db = getDb();
    if (!db) {
      addLog("Error: Firebase no está configurado. Guardado temporal deshabilitado.", "error");
      return;
    }

    addLog("Iniciando guardado persistente en Firebase Firestore...", "info");
    const totalRecords = importedClients.length + importedTemplates.length;
    let processedRecords = 0;
    
    try {
      let contactsCount = 0;
      let templatesCount = 0;

      // Guardar Clientes
      for (const client of importedClients) {
        if (!client.EMAIL && !client.Rut) continue;
        
        // El ID del documento será el EMAIL o el Rut para evitar duplicados
        const docId = (client.Rut || client.EMAIL).replace(/\./g, "_");
        const docRef = doc(db, "contacts", docId);
        
        // Estructura limpia para el cliente
        const clientData: Partial<Contact> = {
          rut: client.rut || "",
          n: client.n || "",
          Rut: client.Rut || "",
          RazonSocial: client.RazonSocial || "",
          Rubro: client.Rubro || "",
          Pitch_Personalizado: client.Pitch_Personalizado || "",
          TipoEmpresa: client.TipoEmpresa || "",
          Direccion: client.Direccion || "",
          Comuna: client.Comuna || "",
          Ciudad: client.Ciudad || "",
          Pais: client.Pais || "",
          Representante: client.Representante || client.NombreContacto || "",
          NombreContacto: client.NombreContacto || "",
          CargoContacto: client.CargoContacto || "",
          CelularContacto: client.CelularContacto || "",
          TelefonoContacto: client.TelefonoContacto || "",
          FonoRepresentante: client.FonoRepresentante || client.CelularContacto || client.TelefonoContacto || "",
          Representante2: client.Representante2 || "",
          FonoContacto: client.FonoContacto || client.TelefonoContacto || client.CelularContacto || "",
          SitioWeb: client.SitioWeb || "",
          EMAIL: client.EMAIL || "",
          Estado: client.Estado || ""
        };


        // Preservar tracking previo si ya existía en Firestore para no pisar el seguimiento!
        const existing = contacts.find(c => c.id === docId);
        if (existing) {
          clientData.tracking = existing.tracking;
        } else {
          clientData.tracking = {
            estadoEnvio: "pendiente",
            ultimoEnvio: null,
            mensajeId: null,
            errorDetalle: null,
            intentos: 0
          };
        }

        await setDoc(docRef, clientData, { merge: true });
        contactsCount++;
        processedRecords++;
        setImportProgress({
          current: processedRecords,
          total: totalRecords,
          phase: `Sincronizando clientes con Firebase: ${contactsCount} de ${importedClients.length}`
        });
      }

      // Guardar Plantillas
      for (const temp of importedTemplates) {
        const rubroVal = (temp.Rubro || temp.Area || "").trim();
        if (!rubroVal || !temp.Template) continue;
        
        const docId = rubroVal.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
        const docRef = doc(db, "templates", docId);
        
        await setDoc(docRef, {
          Rubro: rubroVal,
          Template: temp.Template,
          ultimoSync: new Date()
        }, { merge: true });
        
        templatesCount++;
        processedRecords++;
        setImportProgress({
          current: processedRecords,
          total: totalRecords,
          phase: `Sincronizando plantillas de correo: ${templatesCount} de ${importedTemplates.length}`
        });
      }

      addLog(`¡Sincronización Firebase exitosa! Se procesaron ${contactsCount} contactos y ${templatesCount} plantillas.`, "success");
      
      // Recargar base de datos local
      setImportProgress(p => ({ ...p, phase: "Recargando datos locales desde Firebase..." }));
      await loadDataFromFirebase();

    } catch (e: any) {
      console.error("Error en Upsert de Firestore:", e);
      addLog(`Error al guardar datos en Firebase Firestore: ${e.message}`, "error");
    }
  };

  // Parser de Planilla Excel unificado (.xlsx / .xls)
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingExcel(true);
    setImportProgress({ current: 0, total: 0, phase: `Leyendo archivo Excel unificado: ${file.name}...` });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        
        const sheetNames = wb.SheetNames;
        addLog(`Pestañas detectadas en el Excel: ${sheetNames.join(", ")}`, "info");
        
        const clientsSheetName = sheetNames.find(name => 
          name.toLowerCase().trim() === "clientes" || 
          name.toLowerCase().includes("cliente")
        );
        
        const templatesSheetName = sheetNames.find(name => 
          name.toLowerCase().trim() === "template" || 
          name.toLowerCase().trim() === "templates" || 
          name.toLowerCase().includes("plantilla") || 
          name.toLowerCase().trim() === "rubro" ||
          name.toLowerCase().trim() === "rubros"
        );

        let parsedClients: any[] = [];
        let parsedTemplates: any[] = [];

        if (clientsSheetName) {
          parsedClients = XLSX.utils.sheet_to_json(wb.Sheets[clientsSheetName]);
          addLog(`Pestaña de clientes leída (${parsedClients.length} registros).`, "success");
        } else {
          addLog(`Advertencia: No se encontró la pestaña 'Clientes'.`, "warn");
        }

        if (templatesSheetName) {
          parsedTemplates = XLSX.utils.sheet_to_json(wb.Sheets[templatesSheetName]);
          addLog(`Pestaña de plantillas leída (${parsedTemplates.length} registros).`, "success");
        } else {
          addLog(`Advertencia: No se encontró la pestaña 'Templates' o 'Plantillas'.`, "warn");
        }

        if (parsedClients.length === 0 && parsedTemplates.length === 0) {
          showNotificationModal("Carga Fallida", "No se encontraron datos válidos en las pestañas 'Clientes' o 'Templates'. Revisa que tu libro Excel tenga los nombres correctos.", "error");
          setIsImportingExcel(false);
          return;
        }

        addLog(`Realizando upsert de datos unificados en Firebase Firestore...`, "info");
        await handleBulkUpsert(parsedClients, parsedTemplates);

        setShowCSVModal(false);
        showNotificationModal("¡Carga Exitosa! 🎉", `El libro de Excel fue importado con éxito. Se cargaron y sincronizaron ${parsedClients.length} clientes y ${parsedTemplates.length} plantillas en Firestore.`, "success");
        
      } catch (err: any) {
        console.error("Error al leer Excel:", err);
        addLog(`Error al procesar archivo Excel: ${err.message}`, "error");
        showNotificationModal("Error al Cargar", err.message, "error");
      } finally {
        setIsImportingExcel(false);
        if (e.target) {
          e.target.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };



  // Insertar un tag dinámico de plantilla en la posición del cursor de la textarea
  const insertTemplatePlaceholder = (placeholder: string) => {
    const textarea = document.getElementById("new-template-html-textarea") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const inserted = before + `{{${placeholder}}}` + after;
      setNewTemplateHtml(inserted);
      
      // Colocar foco y posicionar cursor después de la variable insertada {{placeholder}}
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + placeholder.length + 4;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setNewTemplateHtml(prev => prev + ` {{${placeholder}}}`);
    }
  };

  // Reemplazar variables dinámicas en plantilla HTML
  // Revisar y mejorar plantilla con IA (Gemini)
  const handleAiReviewTemplate = async () => {
    if (!newTemplateHtml || newTemplateHtml.trim().length < 50) {
      showNotificationModal("HTML Insuficiente", "Escribe al menos un borrador de la plantilla HTML antes de pedir la revisión de IA.", "error");
      return;
    }
    setIsImprovingTemplate(true);
    setAiReviewResult(null);
    try {
      const res = await fetch("/api/admin/improve-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: newTemplateHtml, rubro: newTemplateRubro })
      });
      const data = await res.json();
      if (!res.ok) {
        showNotificationModal("Error de IA", data.error || "Error desconocido al consultar Gemini.", "error");
        return;
      }
      setAiReviewResult(data);
    } catch (err: any) {
      showNotificationModal("Error de conexión", err.message || "No se pudo contactar el servidor de IA.", "error");
    } finally {
      setIsImprovingTemplate(false);
    }
  };

  const renderTemplateWithVariables = (htmlContent: string, contact: Contact) => {

    if (!htmlContent) return "";
    let rendered = htmlContent;

    const variables: Record<string, string> = {
      rut: contact.rut || "",
      n: String(contact.n || ""),
      Rut: contact.Rut || "",
      RazonSocial: contact.RazonSocial || "",
      Rubro: contact.Rubro || "",
      Pitch_Personalizado: contact.Pitch_Personalizado || "",
      TipoEmpresa: contact.TipoEmpresa || "",
      Direccion: contact.Direccion || "",
      Comuna: contact.Comuna || "",
      Ciudad: contact.Ciudad || "",
      Pais: contact.Pais || "",
      Representante: contact.Representante || "",
      FonoRepresentante: contact.FonoRepresentante || "",
      SitioWeb: contact.SitioWeb || "",
      EMAIL: contact.EMAIL || "",
      NombreContacto: contact.NombreContacto || contact.Representante || "",
      CargoContacto: contact.CargoContacto || "",
      CelularContacto: contact.CelularContacto || "",
      TelefonoContacto: contact.TelefonoContacto || ""
    };


    // Reemplazo robusto sensible e insensible a mayúsculas
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
      rendered = rendered.replace(regex, val || "");
    }

    return rendered;
  };

  // Actualizar contacto editado
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    const db = getDb();
    if (!db) return;

    try {
      const docRef = doc(db, "contacts", editingContact.id);
      await setDoc(docRef, editingContact, { merge: true });
      
      // Actualizar estado local
      setContacts(prev => prev.map(c => c.id === editingContact.id ? editingContact : c));
      setShowEditModal(false);
      addLog(`Contacto ${editingContact.EMAIL} editado en caliente exitosamente.`, "success");
      showNotificationModal("Contacto Actualizado", "El contacto ha sido actualizado con éxito en Firestore.", "success");
    } catch (e: any) {
      showNotificationModal("Error al Guardar", e.message, "error");
    }
  };


  // Reiniciar estado de envío de un contacto
  const handleResetContactStatus = async (contactId: string) => {
    const db = getDb();
    if (!db) return;

    try {
      const docRef = doc(db, "contacts", contactId);
      const updatedTracking = {
        estadoEnvio: "pendiente" as const,
        ultimoEnvio: null,
        mensajeId: null,
        errorDetalle: null,
        intentos: 0
      };

      await updateDoc(docRef, { tracking: updatedTracking });
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, tracking: updatedTracking } : c));
      addLog(`Estado de envío de contacto ${contactId} restablecido a Pendiente.`, "info");
    } catch (e: any) {
      console.error(e);
    }
  };
 
  // Eliminar un solo contacto de Firestore
  const handleDeleteContact = async (contactId: string) => {
    const db = getDb();
    if (!db) return;
    try {
      const docRef = doc(db, "contacts", contactId);
      await deleteDoc(docRef);
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setSelectedContacts(prev => {
        const updated = { ...prev };
        delete updated[contactId];
        return updated;
      });
      addLog(`Cliente ${contactId} eliminado permanentemente de Firestore.`, "success");
      showNotificationModal("Cliente Eliminado", "El cliente ha sido eliminado permanentemente de Firestore.", "success");
    } catch (e: any) {
      showNotificationModal("Error al Eliminar", e.message, "error");
    }
  };

  // Purgar por completo la base de clientes de Firestore
  const handleDeleteAllContacts = async () => {
    const db = getDb();
    if (!db) return;
    addLog(`Iniciando purga total de la base de clientes...`, "info");
    try {
      const batch = writeBatch(db);
      contacts.forEach(c => {
        const docRef = doc(db, "contacts", c.id);
        batch.delete(docRef);
      });
      await batch.commit();
      
      setContacts([]);
      setSelectedContacts({});
      addLog(`¡Purga total completada! Se eliminaron ${contacts.length} clientes.`, "success");
      showNotificationModal("Base de Clientes Purgada", `Se han eliminado los ${contacts.length} clientes exitosamente. Ya puedes cargar un nuevo archivo.`, "success");
    } catch (e: any) {
      addLog(`Error al purgar clientes: ${e.message}`, "error");
      showNotificationModal("Error al Purgar", e.message, "error");
    }
  };


  // Reiniciar estado de envío de TODOS los contactos seleccionados (Triggers modal)
  const handleBulkResetStatus = () => {
    const selectedIds = Object.keys(selectedContacts).filter(id => selectedContacts[id]);
    if (selectedIds.length === 0) {
      showNotificationModal("Selección Vacía", "Por favor, selecciona primero al menos un contacto de la tabla.", "error");
      return;
    }
    setCampaignConfirm({ show: true, type: "reset", selectedCount: selectedIds.length });
  };

  // Ejecución real del restablecimiento
  const executeBulkResetStatus = async () => {
    const db = getDb();
    if (!db) return;

    const selectedIds = Object.keys(selectedContacts).filter(id => selectedContacts[id]);
    addLog(`Restableciendo ${selectedIds.length} contactos a 'Pendiente' en base de datos...`, "info");

    try {
      for (const id of selectedIds) {
        const docRef = doc(db, "contacts", id);
        const updatedTracking = {
          estadoEnvio: "pendiente" as const,
          ultimoEnvio: null,
          mensajeId: null,
          errorDetalle: null,
          intentos: 0
        };
        await updateDoc(docRef, { tracking: updatedTracking });
      }

      setContacts(prev => prev.map(c => selectedIds.includes(c.id) ? {
        ...c, 
        tracking: {
          estadoEnvio: "pendiente",
          ultimoEnvio: null,
          mensajeId: null,
          errorDetalle: null,
          intentos: 0
        }
      } : c));

      addLog(`Restablecimiento masivo de ${selectedIds.length} contactos exitoso.`, "success");
      showNotificationModal("Estados Restablecidos", `Se restableció el estado a 'Pendiente' para los ${selectedIds.length} contactos seleccionados.`, "success");
    } catch (err: any) {
      addLog(`Error al restablecer estados: ${err.message}`, "error");
      showNotificationModal("Error", err.message, "error");
    }
  };


  // Selección de filas
  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const newSelected: Record<string, boolean> = {};
    
    if (checked) {
      filteredContacts.forEach(c => {
        newSelected[c.id] = true;
      });
    }
    
    setSelectedContacts(newSelected);
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedContacts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filtrado de contactos en la tabla
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = 
      (c.RazonSocial?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (c.EMAIL?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (c.Representante?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      statusFilter === "todos" || 
      c.tracking?.estadoEnvio === statusFilter;
      
    const matchesRubro = 
      rubroFilter === "todos" || 
      c.Rubro?.toLowerCase().trim() === rubroFilter.toLowerCase().trim();

    return matchesSearch && matchesStatus && matchesRubro;
  });

  // Obtener rubros únicos para filtro
  const uniqueRubros = Array.from(new Set(contacts.map(c => c.Rubro).filter(Boolean)));

  // Obtener todos los rubros de clientes y templates unificados
  const existingRubros = Array.from(new Set([
    ...templates.map(t => t.Rubro).filter(Boolean),
    ...contacts.map(c => c.Rubro).filter(Boolean)
  ]));

  // Probar envío simple con Brevo
  const handleTestBrevoConnection = async () => {
    if (!brevoApiKey) {
      showNotificationModal("Configuración Faltante", "Introduce tu API Key de Brevo en la pestaña Configuración antes de probar.", "error");
      return;
    }


    const testEmail = prompt("Ingresa un correo destinatario para la prueba:", senderEmail);
    if (!testEmail) return;

    setIsTestingBrevo(true);
    addLog(`Enviando correo de prueba vía Brevo API a ${testEmail}...`, "info");

    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: brevoApiKey,
          sender: { name: senderName, email: senderEmail },
          to: { email: testEmail, name: "Prueba Lezcom" },
          subject: "Lezcom SpA - Prueba de Conexión de API Brevo",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #3b82f6;">Conexión Brevo API Exitosa 🎉</h2>
              <p>Este es un correo de prueba automatizado enviado desde tu nuevo Panel Administrativo.</p>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;"/>
              <p style="font-size: 0.8rem; color: #94a3b8;">Lezcom SpA - Integración de correos masivos.</p>
            </div>
          `
        })
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Fallo en la petición");

      addLog(`¡Conexión probada con éxito! Correo enviado. ID del mensaje: ${res.messageId}`, "success");
      showNotificationModal("Prueba Exitosa", `Correo de prueba enviado de forma exitosa. ID de Mensaje: ${res.messageId}`, "success");

    } catch (err: any) {
      addLog(`Fallo en prueba de conexión de Brevo: ${err.message}`, "error");
      showNotificationModal("Error de Conexión", err.message, "error");
    } finally {

      setIsTestingBrevo(false);
    }
  };

  // MOTOR DE ENVÍOS MASIVOS EN LOTES (CLIENT-SIDE QUEUES)
  const handleStartCampaign = () => {
    const selectedIds = Object.keys(selectedContacts).filter(id => selectedContacts[id]);
    
    if (selectedIds.length === 0) {
      showNotificationModal("Selección Vacía", "Por favor, selecciona primero los contactos a los que deseas enviar correos en la tabla.", "error");
      return;
    }

    if (!brevoApiKey) {
      showNotificationModal("Falta Configuración", "Debes ingresar tu API Key de Brevo en la pestaña Configuración antes de iniciar.", "error");
      setActiveTab("settings");
      return;
    }

    if (templates.length === 0) {
      showNotificationModal("No hay Plantillas", "No hay plantillas de correo cargadas en el sistema para realizar envíos.", "error");
      return;
    }

    setCampaignConfirm({ show: true, type: "send", selectedCount: selectedIds.length });
  };

  // Ejecución real del envío masivo secuencial
  const executeStartCampaign = async () => {
    const selectedIds = Object.keys(selectedContacts).filter(id => selectedContacts[id]);

    // Contadores locales de la ejecución del momento
    let localSentCount = 0;
    let localFailedCount = 0;

    setIsSendingCampaign(true);
    setCampaignTotal(selectedIds.length);
    setCampaignSentCount(0);
    setCampaignFailedCount(0);
    setCampaignProgress(0);
    setConsoleLogs([]); // Limpiar terminal
    
    isSendingRef.current = true;
    addLog(`=== INICIANDO CAMPAÑA DE CORREOS MASIVOS ===`, "info");
    addLog(`Destinatarios seleccionados: ${selectedIds.length}`, "info");

    const db = getDb();

    // Procesamiento en cola secuencial
    for (let i = 0; i < selectedIds.length; i++) {
      if (!isSendingRef.current) {
        addLog(`=== CAMPAÑA DETENIDA POR EL USUARIO ===`, "warn");
        break;
      }

      const contactId = selectedIds[i];
      const contact = contacts.find(c => c.id === contactId);

      if (!contact) continue;

      setCurrentProcessingContact(contact.RazonSocial || contact.EMAIL);
      addLog(`[${i + 1}/${selectedIds.length}] Procesando: ${contact.RazonSocial} (${contact.EMAIL})...`, "info");

      // Buscar plantilla por Rubro (con soporte hacia atrás)
      // Buscamos coincidencia flexible
      const rubroSanitizado = (contact.Rubro || "").toLowerCase().trim();
      const template = templates.find(t => 
        (t.Rubro || "").toLowerCase().trim() === rubroSanitizado
      );

      if (!template) {
        addLog(`[ERROR] No se encontró plantilla compatible para el Rubro '${contact.Rubro}'.`, "error");
        localFailedCount++;
        setCampaignFailedCount(localFailedCount);
        
        // Actualizar Firebase a Fallido
        if (db) {
          try {
            const docRef = doc(db, "contacts", contactId);
            const updatedTracking: ContactTracking = {
              estadoEnvio: "fallido",
              ultimoEnvio: new Date(),
              mensajeId: null,
              errorDetalle: `No se encontró plantilla para el Rubro '${contact.Rubro}'`,
              intentos: (contact.tracking?.intentos || 0) + 1
            };
            await updateDoc(docRef, { tracking: updatedTracking });
            
            // Actualizar estado local
            setContacts(prev => prev.map(c => c.id === contactId ? { ...c, tracking: updatedTracking } : c));
          } catch (e) {
            console.error("Error al escribir en Firestore:", e);
          }
        }
        
        // Agregar al historial local de errores
        setHistoricalLogs(prev => [{
          id: `temp_notempl_${Date.now()}_${i}`,
          emailCliente: contact.EMAIL,
          razonSocial: contact.RazonSocial,
          areaTemplate: contact.Rubro || "Sin Rubro",
          fecha: new Date(),
          status: "error" as const,
          mensajeId: null,
          error: `No se encontró plantilla para el Rubro '${contact.Rubro}'`
        }, ...prev]);

        setCampaignProgress(((i + 1) / selectedIds.length) * 100);
        continue;
      }

      // Actualizar a estado: enviando
      if (db) {
        try {
          await updateDoc(doc(db, "contacts", contactId), { "tracking.estadoEnvio": "enviando" });
          setContacts(prev => prev.map(c => c.id === contactId ? { ...c, tracking: { ...c.tracking, estadoEnvio: "enviando" } } : c));
        } catch (e) {
          console.error(e);
        }
      }

      // Renderizar el HTML reemplazando variables
      const renderedHtml = renderTemplateWithVariables(template.Template, contact);

      // Extraer asunto de <title> o usar por defecto
      let subject = "Soluciones en Acero Inoxidable - Lezcom Spa";
      const titleMatch = template.Template.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        subject = titleMatch[1];
      }

      // Reemplazar variables también en el asunto por si las tuviera!
      for (const [key, val] of Object.entries({
        Representante: contact.Representante || "",
        RazonSocial: contact.RazonSocial || "",
        Rubro: contact.Rubro || ""
      })) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
        subject = subject.replace(regex, val || "");
      }

      try {
        // Enviar vía API Route
        const response = await fetch("/api/admin/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: brevoApiKey,
            sender: { name: senderName, email: senderEmail },
            to: { email: contact.EMAIL, name: contact.Representante },
            subject: subject,
            htmlContent: renderedHtml
          })
        });

        const res = await response.json();

        if (!response.ok) {
          throw new Error(res.error || "Error desconocido");
        }

        localSentCount++;
        setCampaignSentCount(localSentCount);
        addLog(`[ENVIADO] Éxito al entregar correo a ${contact.EMAIL}. Message ID: ${res.messageId}`, "success");

        // Agregar al historial local inmediatamente
        setHistoricalLogs(prev => [{
          id: `temp_${Date.now()}_${i}`,
          emailCliente: contact.EMAIL,
          razonSocial: contact.RazonSocial,
          areaTemplate: template.Rubro,
          fecha: new Date(),
          status: "exito" as const,
          mensajeId: res.messageId,
          error: null
        }, ...prev]);

        const updatedTracking: ContactTracking = {
          estadoEnvio: "enviado",
          ultimoEnvio: new Date(),
          mensajeId: res.messageId,
          errorDetalle: null,
          intentos: (contact.tracking?.intentos || 0) + 1
        };

        // Guardar resultado en Firebase
        if (db) {
          await updateDoc(doc(db, "contacts", contactId), { tracking: updatedTracking });
          
          // Registrar en bitácora de logs histórica
          await addDoc(collection(db, "logs"), {
            emailCliente: contact.EMAIL,
            razonSocial: contact.RazonSocial,
            areaTemplate: template.Rubro,
            fecha: new Date(),
            status: "exito",
            mensajeId: res.messageId,
            error: null
          });
        }

        // Actualizar localmente
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, tracking: updatedTracking } : c));

      } catch (err: any) {
        // Error
        addLog(`[FALLÓ] Error al enviar a ${contact.EMAIL}: ${err.message}`, "error");
        localFailedCount++;
        setCampaignFailedCount(localFailedCount);

        const updatedTracking: ContactTracking = {
          estadoEnvio: "fallido",
          ultimoEnvio: new Date(),
          mensajeId: null,
          errorDetalle: err.message,
          intentos: (contact.tracking?.intentos || 0) + 1
        };

        // Guardar fallo en Firebase
        if (db) {
          await updateDoc(doc(db, "contacts", contactId), { tracking: updatedTracking });
          
          // Registrar en logs
          await addDoc(collection(db, "logs"), {
            emailCliente: contact.EMAIL,
            razonSocial: contact.RazonSocial,
            areaTemplate: template.Rubro,
            fecha: new Date(),
            status: "error",
            mensajeId: null,
            error: err.message
          });
        }

        // Actualizar localmente
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, tracking: updatedTracking } : c));

        // Agregar al historial local de errores inmediatamente
        setHistoricalLogs(prev => [{
          id: `temp_err_${Date.now()}_${i}`,
          emailCliente: contact.EMAIL,
          razonSocial: contact.RazonSocial,
          areaTemplate: template?.Rubro || "N/A",
          fecha: new Date(),
          status: "error" as const,
          mensajeId: null,
          error: err.message
        }, ...prev]);
      }

      setCampaignProgress(((i + 1) / selectedIds.length) * 100);

      // Delay de respiro de 400ms para evitar tasas límite de API
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    isSendingRef.current = false;
    setIsSendingCampaign(false);
    setCurrentProcessingContact(null);
    addLog(`=== CAMPAÑA FINALIZADA ===`, "success");
    addLog(`Totales -> Éxito: ${localSentCount}, Fallidos: ${localFailedCount}`, "info");
    
    showNotificationModal("Envío Masivo Finalizado", `El proceso de envío ha terminado de ejecutarse. Enviados con éxito: ${localSentCount}, Fallidos: ${localFailedCount}.`, "success");
  };

  // Detener campaña
  const handleStopCampaign = () => {
    isSendingRef.current = false;
    setIsSendingCampaign(false);
    addLog("Deteniendo campaña masiva de envíos a solicitud del usuario...", "warn");
  };

  // Exportar logs de campaña a CSV
  const handleExportCampaignLogs = () => {
    if (consoleLogs.length === 0) {
      showNotificationModal("Sin Logs", "No hay logs en la consola para exportar.", "info");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp;Tipo;Mensaje\n";

    consoleLogs.forEach((log) => {
      const line = `"${log.timestamp}";"${log.type}";"${log.text.replace(/"/g, '""')}"`;
      csvContent += line + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_campana_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==============================================
  // MÉTODOS DEL BLOG IA
  // ==============================================
  const handleGenerateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTopic.trim()) return;

    setIsGeneratingBlog(true);
    try {
      const response = await fetch("/api/admin/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newBlogTopic,
          keywords: newBlogKeywords,
          tone: newBlogTone
        })
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.error || "No se pudo generar el artículo con IA.");
      }

      // Pre-llenar campos en el editor
      setBlogFormTitle(res.titulo || "");
      setBlogFormSlug(res.slug || "");
      setBlogFormResumen(res.resumen || "");
      setBlogFormContent(res.contenido || "");
      setBlogFormKeywords(res.keywords || "");
      setBlogFormMetaDesc(res.metaDescription || "");
      setBlogFormLeido(res.leido || "5 min de lectura");
      setBlogFormPublicado(false);

      // Usar sugerencia de query de imagen para proponer una bonita foto de Unsplash
      const imgKeyword = res.sugerenciaImagenQuery || "stainless-steel-commercial";
      setBlogFormImage(`https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80`); // Imagen estándar industrial de Unsplash

      setSelectedBlog(null); // Es un nuevo blog
      setShowBlogEditorModal(true);
      showNotificationModal("¡Artículo Generado!", "La IA ha creado una propuesta para tu blog. Puedes revisarla, editarla y guardarla ahora.", "success");
    } catch (err: any) {
      console.error(err);
      showNotificationModal("Error al Generar", err.message || "Error al comunicarse con Gemini.", "error");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDb();
    if (!db) {
      showNotificationModal("Error", "La base de datos de Firebase no está activa.", "error");
      return;
    }

    try {
      const blogData = {
        titulo: blogFormTitle,
        slug: blogFormSlug.toLowerCase().trim().replace(/\s+/g, '-'),
        resumen: blogFormResumen,
        contenido: blogFormContent,
        keywords: blogFormKeywords,
        metaDescription: blogFormMetaDesc,
        imagen: blogFormImage || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
        leido: blogFormLeido || "5 min de lectura",
        publicado: blogFormPublicado,
        fecha: selectedBlog?.fecha || new Date()
      };

      if (selectedBlog?.id) {
        // Actualizar existente
        const docRef = doc(db, "blogs", selectedBlog.id);
        await updateDoc(docRef, blogData);
        setBlogs(prev => prev.map(b => b.id === selectedBlog.id ? { ...b, ...blogData } : b));
        showNotificationModal("Blog Actualizado", "El artículo se guardó correctamente.", "success");
      } else {
        // Crear nuevo
        const docRef = await addDoc(collection(db, "blogs"), blogData);
        setBlogs(prev => [{ id: docRef.id, ...blogData } as BlogPost, ...prev]);
        showNotificationModal("Blog Creado", "El artículo se ha guardado de forma exitosa.", "success");
      }

      setShowBlogEditorModal(false);
      // Limpiar campos de generación rápida
      setNewBlogTopic("");
      setNewBlogKeywords("");
    } catch (err: any) {
      console.error(err);
      showNotificationModal("Error al Guardar", err.message || "Ocurrió un error al guardar el artículo.", "error");
    }
  };

  const handleEditBlog = (blog: BlogPost) => {
    setSelectedBlog(blog);
    setBlogFormTitle(blog.titulo || "");
    setBlogFormSlug(blog.slug || "");
    setBlogFormResumen(blog.resumen || "");
    setBlogFormContent(blog.contenido || "");
    setBlogFormKeywords(blog.keywords || "");
    setBlogFormMetaDesc(blog.metaDescription || "");
    setBlogFormImage(blog.imagen || "");
    setBlogFormLeido(blog.leido || "5 min de lectura");
    setBlogFormPublicado(blog.publicado || false);
    setShowBlogEditorModal(true);
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este artículo permanentemente?")) return;
    const db = getDb();
    if (!db) return;

    try {
      await deleteDoc(doc(db, "blogs", blogId));
      setBlogs(prev => prev.filter(b => b.id !== blogId));
      showNotificationModal("Blog Eliminado", "El artículo ha sido eliminado con éxito.", "success");
    } catch (err: any) {
      console.error(err);
      showNotificationModal("Error", "No se pudo eliminar el artículo.", "error");
    }
  };

  const handleTogglePublish = async (blog: BlogPost) => {
    const db = getDb();
    if (!db) return;

    try {
      const nextState = !blog.publicado;
      await updateDoc(doc(db, "blogs", blog.id), { publicado: nextState });
      setBlogs(prev => prev.map(b => b.id === blog.id ? { ...b, publicado: nextState } : b));
      showNotificationModal(
        nextState ? "Artículo Publicado" : "Borrador Guardado",
        nextState ? "El artículo ahora es visible en el sitio web." : "El artículo se ha despublicado y guardado como borrador.",
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showNotificationModal("Error", "No se pudo cambiar el estado de publicación.", "error");
    }
  };

  // Template activo para visor
  const activeTemplateObj = templates.find(t => t.Rubro === selectedPreviewTemplate);
  const activeContactObj = contacts.find(c => c.id === selectedPreviewContact);
  const renderedHtmlPreview = activeTemplateObj && activeContactObj 
    ? renderTemplateWithVariables(activeTemplateObj.Template, activeContactObj)
    : activeTemplateObj ? activeTemplateObj.Template : "Selecciona una plantilla y un contacto para previsualizar.";

  // Previsualizador en tiempo real dentro del Creador/Editor de Plantillas
  const modalPreviewContact = contacts.find(c => c.id === editorPreviewContactId);
  const modalPreviewHtml = modalPreviewContact 
    ? renderTemplateWithVariables(newTemplateHtml, modalPreviewContact)
    : newTemplateHtml;


  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">L</div>
          <div className="logo-text">
            Lezcom SpA <span>Panel de Envíos</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Cuadro de Mando
          </button>
          <button 
            className={`nav-item ${activeTab === "contacts" ? "active" : ""}`}
            onClick={() => setActiveTab("contacts")}
          >
            👥 Clientes ({contacts.length})
          </button>
          <button 
            className={`nav-item ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveTab("templates")}
          >
            📄 Plantillas ({templates.length})
          </button>
          <button 
            className={`nav-item ${activeTab === "blogs" ? "active" : ""}`}
            onClick={() => setActiveTab("blogs")}
          >
            ✍️ Blog IA ({blogs.length})
          </button>
          <button 
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Configuración
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>Lezcom SpA © 2026</p>
          <p style={{ fontSize: "0.7rem" }}>V1.0 - Firebase Cloud</p>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="admin-main">
        {/* Cabecera general */}
        <header className="admin-header">
          <div className="header-title">
            <h1>
              {activeTab === "dashboard" && "Cuadro de Mando"}
              {activeTab === "contacts" && "Base de Clientes"}
              {activeTab === "templates" && "Plantillas de Correo"}
              {activeTab === "blogs" && "Artículos del Blog IA"}
              {activeTab === "settings" && "Configuración General"}
            </h1>
            <p>
              {activeTab === "dashboard" && "Métricas globales y consola de control rápido."}
              {activeTab === "contacts" && "Gestión de destinatarios e histórico de entregas."}
              {activeTab === "templates" && "Previsualización y emparejamiento por Rubro."}
              {activeTab === "blogs" && "Genera automáticamente artículos de alta calidad optimizados para SEO usando Inteligencia Artificial."}
              {activeTab === "settings" && "Gestionar API de Brevo, webhooks y conexión a Firebase."}
            </p>
          </div>

          <div className="header-status-pills">
            <div className="status-indicator-pill">
              <span className={`status-dot ${firebaseActive ? "online" : "offline"}`}></span>
              Firebase: {firebaseActive ? "Conectado" : "Desconectado"}
            </div>
            <div className="status-indicator-pill">
              <span className={`status-dot ${brevoApiKey ? "online" : "offline"}`}></span>
              Brevo API: {brevoApiKey ? "Cargada" : "Falta Key"}
            </div>
          </div>
        </header>

        {/* ALERTA DE CONFIGURACIÓN DE FIREBASE */}
        {!firebaseActive && !isDbLoading && (
          <div className="admin-alert warning">
            ⚠️ <strong>Base de datos inactiva</strong>: Firebase Firestore no está configurado o las credenciales son incorrectas. Por favor, ve a la pestaña <strong>Configuración</strong> para cargar tus credenciales y activar el almacenamiento persistente.
          </div>
        )}

        {/* ==============================================
            VISTA: DASHBOARD
            ============================================== */}
        {activeTab === "dashboard" && (
          <>
            {/* GRILLA METRICAS */}
            <div className="stats-grid">
              <div className="glass-card stat-card blue">
                <div className="stat-card-header">
                  <span>CLIENTES</span>
                  <div className="stat-icon-wrapper">👥</div>
                </div>
                <div className="stat-number">{contacts.length}</div>
                <div className="stat-desc">Clientes totales en base de datos.</div>
              </div>

              <div className="glass-card stat-card purple">
                <div className="stat-card-header">
                  <span>PLANTILLAS</span>
                  <div className="stat-icon-wrapper">📄</div>
                </div>
                <div className="stat-number">{templates.length}</div>
                <div className="stat-desc">Areas con correo HTML asignado.</div>
              </div>

              <div 
                className="glass-card stat-card green"
                style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                onClick={() => setShowLogsModal(prev => prev?.filter === "exito" ? null : { show: true, filter: "exito" })}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(16,185,129,0.25)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                title="Haz clic para ver el detalle de envíos exitosos"
              >
                <div className="stat-card-header">
                  <span>ENVIADOS</span>
                  <div className="stat-icon-wrapper">✔️</div>
                </div>
                <div className="stat-number">
                  {historicalLogs.filter(l => l.status === "exito").length}
                </div>
                <div className="stat-desc">Total histórico de correos entregados. <span style={{ textDecoration: "underline", fontSize: "0.7rem" }}>{showLogsModal?.filter === "exito" ? "Ocultar ↑" : "Ver detalle →"}</span></div>
              </div>

              <div 
                className="glass-card stat-card red"
                style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                onClick={() => setShowLogsModal(prev => prev?.filter === "error" ? null : { show: true, filter: "error" })}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(239,68,68,0.25)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                title="Haz clic para ver el detalle de envíos fallidos"
              >
                <div className="stat-card-header">
                  <span>FALLIDOS</span>
                  <div className="stat-icon-wrapper">❌</div>
                </div>
                <div className="stat-number">
                  {historicalLogs.filter(l => l.status === "error").length}
                </div>
                <div className="stat-desc">Total histórico de errores de envío. <span style={{ textDecoration: "underline", fontSize: "0.7rem" }}>{showLogsModal?.filter === "error" ? "Ocultar ↑" : "Ver detalle →"}</span></div>
              </div>
            </div>

            {/* SECCIÓN INLINE: DETALLE DE LOGS HISTÓRICOS */}
            {showLogsModal && showLogsModal.show && (
              <div className="glass-card" style={{ marginTop: "20px", animation: "fadeIn 0.25s ease" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#ffffff", margin: "0 0 4px" }}>
                      {showLogsModal.filter === "exito" ? "✔️ Historial de Envíos Exitosos" : showLogsModal.filter === "error" ? "❌ Historial de Envíos Fallidos" : "📋 Historial Completo de Envíos"}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                      Registros persistentes ordenados del más reciente al más antiguo
                    </p>
                  </div>
                  <button 
                    className="btn-admin"
                    onClick={() => setShowLogsModal(null)}
                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                  >
                    ✕ Cerrar
                  </button>
                </div>

                {/* Filtros */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <button 
                    className={`btn-admin ${showLogsModal.filter === "all" ? "btn-admin-primary" : ""}`}
                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                    onClick={() => setShowLogsModal({ show: true, filter: "all" })}
                  >
                    📋 Todos ({historicalLogs.length})
                  </button>
                  <button 
                    className={`btn-admin ${showLogsModal.filter === "exito" ? "btn-admin-success" : ""}`}
                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                    onClick={() => setShowLogsModal({ show: true, filter: "exito" })}
                  >
                    ✔️ Exitosos ({historicalLogs.filter(l => l.status === "exito").length})
                  </button>
                  <button 
                    className={`btn-admin ${showLogsModal.filter === "error" ? "btn-admin-danger" : ""}`}
                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                    onClick={() => setShowLogsModal({ show: true, filter: "error" })}
                  >
                    ❌ Fallidos ({historicalLogs.filter(l => l.status === "error").length})
                  </button>
                </div>

                {/* Tabla de logs */}
                <div style={{ maxHeight: "450px", overflowY: "auto" }}>
                  {(() => {
                    const filtered = showLogsModal.filter === "all" 
                      ? historicalLogs 
                      : historicalLogs.filter(l => l.status === showLogsModal.filter);
                    
                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                          📭 No hay registros {showLogsModal.filter === "exito" ? "exitosos" : showLogsModal.filter === "error" ? "fallidos" : ""} en el historial.
                        </div>
                      );
                    }

                    return (
                      <div className="table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th style={{ width: "50px" }}>#</th>
                              <th style={{ width: "160px" }}>Fecha y Hora</th>
                              <th>Empresa</th>
                              <th>Correo</th>
                              <th>Rubro/Plantilla</th>
                              <th style={{ width: "80px" }}>Estado</th>
                              <th>Detalle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((log, idx) => {
                              let fechaStr = "N/A";
                              try {
                                const d = log.fecha?.seconds ? new Date(log.fecha.seconds * 1000) : (log.fecha instanceof Date ? log.fecha : new Date(log.fecha));
                                fechaStr = d.toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
                              } catch { fechaStr = "Fecha inválida"; }

                              return (
                                <tr key={log.id || idx}>
                                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{idx + 1}</td>
                                  <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{fechaStr}</td>
                                  <td>
                                    <strong style={{ fontSize: "0.85rem" }}>{log.razonSocial || "S/R"}</strong>
                                  </td>
                                  <td style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>{log.emailCliente}</td>
                                  <td style={{ fontSize: "0.8rem" }}>{log.areaTemplate || "N/A"}</td>
                                  <td>
                                    <span style={{
                                      display: "inline-block",
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      fontSize: "0.7rem",
                                      fontWeight: "700",
                                      textTransform: "uppercase",
                                      backgroundColor: log.status === "exito" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                      color: log.status === "exito" ? "#10b981" : "#ef4444",
                                      border: `1px solid ${log.status === "exito" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`
                                    }}>
                                      {log.status === "exito" ? "✔ Éxito" : "✘ Error"}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: "0.75rem", color: log.status === "exito" ? "#a7f3d0" : "#fca5a5", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {log.status === "exito" 
                                      ? (log.mensajeId ? `ID: ${log.mensajeId}` : "Enviado OK") 
                                      : (log.error || "Error desconocido")
                                    }
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}


        {/* ==============================================
            VISTA: CONTACTS (CLIENTES)
            ============================================== */}
        {activeTab === "contacts" && (
          <div className="glass-card">
            {/* Cabecera / Filtros */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flex: 1, alignItems: "center" }}>
                <div className="search-wrapper">

                  <input 
                    type="text" 
                    placeholder="Buscar por Empresa, Correo, Representante..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="search-icon">🔍</span>
                </div>

                <select 
                  className="select-admin"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="enviando">Enviando</option>
                  <option value="enviado">Enviados con éxito</option>
                  <option value="fallido">Fallidos</option>
                </select>

                <select 
                  className="select-admin"
                  value={rubroFilter}
                  onChange={(e) => setRubroFilter(e.target.value)}
                >
                  <option value="todos">Todos los rubros</option>
                  {uniqueRubros.map((rubro, idx) => (
                    <option key={idx} value={rubro}>{rubro}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button 
                  className="btn-admin btn-admin-primary"
                  onClick={() => {
                    setNewClientData({
                      Rut: "",
                      RazonSocial: "",
                      Rubro: "",
                      Representante: "",
                      EMAIL: "",
                      Pitch_Personalizado: ""
                    });
                    setShowNewClientModal(true);
                  }}
                >
                  ➕ Crear Cliente Manual
                </button>
                <button 
                  className="btn-admin"
                  onClick={() => clientOnlyFileInputRef.current?.click()}
                >
                  📥 Importar Excel (Clientes)
                </button>
                <button 
                  className="btn-admin btn-admin-danger"
                  onClick={() => setDeleteConfirm({ show: true, type: "all" })}
                  disabled={contacts.length === 0}
                  title="Purga completa de base de datos"
                >
                  🗑️ Eliminar Todos
                </button>
                <input 
                  type="file" 
                  ref={clientOnlyFileInputRef}
                  accept=".xlsx, .xls" 
                  style={{ display: "none" }}
                  onChange={handleClientOnlyExcelUpload}
                />
              </div>


              <div className="button-group" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {Object.keys(selectedContacts).filter(id => selectedContacts[id]).length > 0 && (
                  <>
                    <button 
                      className="btn-admin btn-admin-danger"
                      onClick={handleBulkResetStatus}
                    >
                      🔄 Reset a Pendiente ({Object.keys(selectedContacts).filter(id => selectedContacts[id]).length})
                    </button>
                    <button 
                      className="btn-admin btn-admin-primary"
                      onClick={() => { setActiveTab("dashboard"); handleStartCampaign(); }}
                    >
                      🚀 Enviar a Seleccionados ({Object.keys(selectedContacts).filter(id => selectedContacts[id]).length})
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tabla */}
            {isDbLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
                ⏳ Cargando contactos desde Firebase...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
                📭 No se encontraron clientes en la búsqueda.
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px", textAlign: "center" }}>
                        <input 
                          type="checkbox"
                          className="checkbox-admin"
                          onChange={handleToggleSelectAll}
                          checked={filteredContacts.length > 0 && filteredContacts.every(c => selectedContacts[c.id])}
                          style={{ margin: "0 auto" }}
                        />
                      </th>
                      <th style={{ width: "60px" }}>N°</th>
                      <th>Empresa / Razón Social</th>
                      <th>Representante</th>
                      <th>EMAIL</th>
                      <th>Rubro</th>
                      <th style={{ width: "130px" }}>Seguimiento</th>
                      <th style={{ width: "120px" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact, idx) => (
                      <tr 
                        key={contact.id}
                        className={selectedContacts[contact.id] ? "selected" : ""}
                      >
                        <td style={{ textAlign: "center" }}>
                          <input 
                            type="checkbox"
                            className="checkbox-admin"
                            checked={!!selectedContacts[contact.id]}
                            onChange={() => handleToggleSelectRow(contact.id)}
                            style={{ margin: "0 auto" }}
                          />
                        </td>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{contact.RazonSocial || "S/R"}</strong>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>RUT: {contact.Rut}</span>
                        </td>
                        <td>{contact.Representante || "Sin Representante"}</td>
                        <td>{contact.EMAIL}</td>
                        <td>
                          <span style={{ display: "inline-block", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={contact.Rubro}>
                            {contact.Rubro || "Sin Rubro"}
                          </span>
                        </td>
                        <td>
                          <span 
                            className={`badge-status ${contact.tracking?.estadoEnvio || "pendiente"}`}
                            style={{ 
                              cursor: (contact.tracking?.estadoEnvio === "fallido" || contact.tracking?.estadoEnvio === "enviado") ? "pointer" : "default",
                              transition: "all 0.15s ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title={(contact.tracking?.estadoEnvio === "fallido" || contact.tracking?.estadoEnvio === "enviado") ? "Hacer clic para ver logs de ejecución" : ""}
                            onClick={() => {
                              if (contact.tracking?.estadoEnvio === "fallido" || contact.tracking?.estadoEnvio === "enviado") {
                                setSelectedTrackingDetail(contact);
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (contact.tracking?.estadoEnvio === "fallido" || contact.tracking?.estadoEnvio === "enviado") {
                                e.currentTarget.style.transform = "scale(1.05)";
                                e.currentTarget.style.filter = "brightness(1.15)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.filter = "brightness(1)";
                            }}
                          >
                            {contact.tracking?.estadoEnvio === "pendiente" && "⏳ Pendiente"}
                            {contact.tracking?.estadoEnvio === "enviando" && "🔵 Enviando"}
                            {contact.tracking?.estadoEnvio === "enviado" && "✔️ Enviado"}
                            {contact.tracking?.estadoEnvio === "fallido" && "❌ Fallido"}
                          </span>
                          {contact.tracking?.ultimoEnvio && (
                            <span style={{ display: "block", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px" }}>
                              {new Date(contact.tracking.ultimoEnvio.seconds ? contact.tracking.ultimoEnvio.seconds * 1000 : contact.tracking.ultimoEnvio).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button 
                              className="btn-admin" 
                              style={{ padding: "6px 8px", fontSize: "0.8rem" }}
                              onClick={() => { setEditingContact(contact); setShowEditModal(true); }}
                              title="Editar Contacto"
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-admin" 
                              style={{ padding: "6px 8px", fontSize: "0.8rem" }}
                              onClick={() => handleResetContactStatus(contact.id)}
                              title="Restablecer"
                            >
                              🔄
                            </button>
                            {(contact.tracking?.estadoEnvio === "pendiente" || contact.tracking?.estadoEnvio === "fallido" || !contact.tracking?.estadoEnvio) && (
                              <button 
                                className="btn-admin btn-admin-danger" 
                                style={{ padding: "6px 8px", fontSize: "0.8rem" }}
                                onClick={() => setDeleteConfirm({ show: true, type: "single", contactId: contact.id })}
                                title="Eliminar Cliente"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="table-footer">
                  <span>Mostrando {filteredContacts.length} de {contacts.length} clientes</span>
                  <span>Seleccionados: {Object.keys(selectedContacts).filter(id => selectedContacts[id]).length}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==============================================
            VISTA: TEMPLATES (PLANTILLAS)
            ============================================== */}
        {activeTab === "templates" && (
          <div className="glass-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "1.1rem" }}>Gestión de Plantillas por Rubro</h3>
              <button 
                className="btn-admin btn-admin-primary"
                onClick={() => {
                  setNewTemplateRubro("");
                  setNewTemplateHtml(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; padding: 20px; line-height: 1.5; background-color: #f8fafc; }
    .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; }
    h1 { color: #1e3a8a; font-size: 1.5rem; margin-top: 0; }
    p { margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hola {{Representante}} de {{RazonSocial}}</h1>
    <p>Le escribimos porque vimos que su empresa se especializa en el rubro de <strong>{{Rubro}}</strong>.</p>
    <p>{{Pitch_Personalizado}}</p>
  </div>
</body>
</html>`);
                  setEditorPreviewContactId("");
                  setShowNewTemplateModal(true);
                }}
              >
                ➕ Crear Nueva Plantilla
              </button>
            </div>

            {templates.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
                📭 No hay plantillas HTML en el sistema. Presiona "Crear Nueva Plantilla" o importa tu Excel para iniciar.
              </div>
            ) : (
              <div className="preview-split">
                {/* Lado izquierdo: Lista de plantillas */}
                <div className="preview-list">
                  <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "8px" }}>RUBROS DISPONIBLES ({templates.length})</h4>
                  {templates.map((temp) => (
                    <button 
                      key={temp.id}
                      className={`template-card-selector ${selectedPreviewTemplate === temp.Rubro ? "active" : ""}`}
                      onClick={() => setSelectedPreviewTemplate(temp.Rubro)}
                    >
                      <div className="template-card-title">{temp.Rubro}</div>
                      <div className="template-card-desc">HTML completo estructurado</div>
                    </button>
                  ))}
                </div>


                {/* Lado derecho: Previsualizador Dinámico */}
                <div className="preview-frame-container">
                  <div className="preview-frame-header">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="preview-subject">
                        📧 Previsualizador Dinámico de Correo
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Plantilla: <strong>{selectedPreviewTemplate}</strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <button
                        className="btn-admin btn-admin-success"
                        style={{ padding: "6px 14px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
                        onClick={() => {
                          const activeTemp = templates.find(t => t.Rubro === selectedPreviewTemplate);
                          if (activeTemp) {
                            setEditingTemplateId(activeTemp.id);
                            setNewTemplateRubro(activeTemp.Rubro);
                            setRubroSelectionType("existing");
                            setNewTemplateHtml(activeTemp.Template);
                            const matching = contacts.find(c => c.Rubro === activeTemp.Rubro);
                            setEditorPreviewContactId(matching ? matching.id : "");
                            setShowNewTemplateModal(true);
                          }
                        }}
                      >
                        📝 Editar Plantilla
                      </button>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Ver con cliente:</span>
                      <select 
                        className="select-admin" 
                        style={{ padding: "6px 24px 6px 12px", fontSize: "0.8rem" }}
                        value={selectedPreviewContact}
                        onChange={(e) => setSelectedPreviewContact(e.target.value)}
                      >
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>{c.RazonSocial} ({c.EMAIL})</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Sandbox de Render */}
                  <iframe 
                    className="preview-iframe"
                    title="Render HTML"
                    srcDoc={renderedHtmlPreview}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {/* ============================================== */}

        {/* ==============================================
            VISTA: BLOGS (IA SEO BLOG GENERATOR)
            ============================================== */}
        {activeTab === "blogs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* PANEL DE GENERACIÓN CON IA */}
            <div className="glass-card" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
              {/* Efecto de luz de fondo sutil */}
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }}></div>
              
              <h3 style={{ display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0", fontSize: "1.2rem", fontWeight: "700" }}>
                <span>✨ Redacción de Blogs con Inteligencia Artificial (SEO)</span>
              </h3>
              
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 20px 0", lineHeight: "1.5" }}>
                Introduce un tema de interés para tus clientes potenciales (ej: "mantenimiento de mesones de acero" o "por qué preferir acero AISI 304"). Nuestra IA (Gemini 2.0 Flash) investigará y redactará un artículo completo optimizado para posicionamiento SEO con jerarquía HTML semántica, subtítulos, meta etiquetas y llamados a la acción automáticos hacia Lezcom.
              </p>

              <form onSubmit={handleGenerateBlog} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px", gap: "16px", alignItems: "end" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                    📝 Tema o Palabra Clave Semilla:
                  </label>
                  <input 
                    type="text"
                    className="input-admin-text"
                    placeholder="Ej. Guía para diseñar una cocina industrial higiénica en Santiago..."
                    value={newBlogTopic}
                    onChange={(e) => setNewBlogTopic(e.target.value)}
                    required
                    disabled={isGeneratingBlog}
                  />
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                    🎯 Palabras Clave Adicionales (opcional, separadas por comas):
                  </label>
                  <input 
                    type="text"
                    className="input-admin-text"
                    placeholder="Ej. cocinas industriales chile, acero inoxidable gastronomico, mesones..."
                    value={newBlogKeywords}
                    onChange={(e) => setNewBlogKeywords(e.target.value)}
                    disabled={isGeneratingBlog}
                  />
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                    🗣️ Tono de Redacción:
                  </label>
                  <select
                    className="select-admin"
                    style={{ width: "100%", height: "42px", padding: "8px 12px" }}
                    value={newBlogTone}
                    onChange={(e: any) => setNewBlogTone(e.target.value)}
                    disabled={isGeneratingBlog}
                  >
                    <option value="Profesional">👔 Profesional</option>
                    <option value="Informativo">📚 Informativo</option>
                    <option value="Persuasivo">🎯 Persuasivo</option>
                    <option value="Técnico">🔧 Técnico</option>
                    <option value="Cercano">🤝 Cercano</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button 
                    type="submit" 
                    className="btn-admin btn-admin-primary"
                    disabled={isGeneratingBlog || !newBlogTopic.trim()}
                    style={{ 
                      padding: "12px 24px", 
                      fontSize: "0.9rem", 
                      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
                    }}
                  >
                    {isGeneratingBlog ? (
                      <>
                        <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginRight: "8px" }}></span>
                        Redactando con IA... (Toma unos segundos)
                      </>
                    ) : (
                      <>🪄 Generar Artículo con IA</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* LISTADO DE ARTÍCULOS */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "700" }}>Artículos del Blog ({blogs.length})</h3>
                <button 
                  className="btn-admin btn-admin-success"
                  onClick={() => {
                    setSelectedBlog(null);
                    setBlogFormTitle("");
                    setBlogFormSlug("");
                    setBlogFormResumen("");
                    setBlogFormContent("<p>Comienza a escribir tu artículo aquí...</p><h2>Subtítulo principal</h2><p>...</p>");
                    setBlogFormKeywords("acero inoxidable, lezcom");
                    setBlogFormMetaDesc("");
                    setBlogFormImage("https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80");
                    setBlogFormLeido("5 min de lectura");
                    setBlogFormPublicado(false);
                    setShowBlogEditorModal(true);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
                >
                  ➕ Crear Artículo Manual
                </button>
              </div>

              {blogs.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "3rem" }}>✍️</span>
                  <div style={{ fontWeight: "600", fontSize: "1rem" }}>No hay artículos en tu blog todavía</div>
                  <p style={{ maxWidth: "450px", fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: "1.5" }}>
                    Usa el generador inteligente de arriba introduciendo un tema, o haz clic en "Crear Artículo Manual" para redactar tu propio contenido.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                  {blogs.map((blog) => (
                    <div 
                      key={blog.id} 
                      className="glass-card" 
                      style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        overflow: "hidden", 
                        border: "1px solid rgba(255,255,255,0.06)", 
                        borderRadius: "12px",
                        background: "rgba(30, 41, 59, 0.4)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        cursor: "default"
                      }}
                    >
                      {/* Imagen de Cabecera del Post */}
                      <div style={{ position: "relative", height: "160px", width: "100%", overflow: "hidden", backgroundColor: "#1e293b" }}>
                        <img 
                          src={blog.imagen} 
                          alt={blog.titulo} 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                          onError={(e: any) => {
                            e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        <span style={{ 
                          position: "absolute", 
                          top: "12px", 
                          right: "12px", 
                          padding: "4px 10px", 
                          borderRadius: "20px", 
                          fontSize: "0.75rem", 
                          fontWeight: "bold", 
                          background: blog.publicado ? "rgba(16, 185, 129, 0.9)" : "rgba(100, 116, 139, 0.9)",
                          color: "#ffffff"
                        }}>
                          {blog.publicado ? "🟢 Publicado" : "⚪ Borrador"}
                        </span>
                      </div>

                      {/* Contenido de la Tarjeta */}
                      <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                            <span>{blog.fecha ? new Date(blog.fecha.seconds ? blog.fecha.seconds * 1000 : blog.fecha).toLocaleDateString("es-CL") : ""}</span>
                            <span>⏱️ {blog.leido}</span>
                          </div>
                          
                          <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff", marginBottom: "8px", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {blog.titulo}
                          </h4>
                          
                          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "16px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                            {blog.resumen}
                          </p>
                        </div>

                        {/* Botones de acción */}
                        <div style={{ display: "flex", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "14px", marginTop: "10px" }}>
                          <button 
                            className="btn-admin" 
                            style={{ flex: 1, padding: "6px 0", fontSize: "0.75rem", justifyContent: "center" }}
                            onClick={() => handleEditBlog(blog)}
                          >
                            📝 Editar
                          </button>
                          
                          <button 
                            className="btn-admin" 
                            style={{ 
                              flex: 1.2, 
                              padding: "6px 0", 
                              fontSize: "0.75rem", 
                              justifyContent: "center",
                              backgroundColor: blog.publicado ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                              color: blog.publicado ? "#f87171" : "#34d399",
                              border: blog.publicado ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)"
                            }}
                            onClick={() => handleTogglePublish(blog)}
                          >
                            {blog.publicado ? "💤 Desactivar" : "🌐 Publicar"}
                          </button>

                          <button 
                            className="btn-admin btn-admin-danger" 
                            style={{ padding: "6px 10px", fontSize: "0.75rem", display: "flex", justifyContent: "center", alignItems: "center" }}
                            onClick={() => handleDeleteBlog(blog.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==============================================
            VISTA: CONFIGURACIÓN
            ============================================== */}
        {activeTab === "settings" && (
          <div>
            {/* Sub-Pestañas horizontales de Configuración */}
            <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "20px" }}>
              <button
                type="button"
                className={`btn-admin ${settingsSubTab === "credentials" ? "btn-admin-primary" : ""}`}
                style={{ borderRadius: "8px", padding: "8px 16px", fontSize: "0.85rem", border: settingsSubTab === "credentials" ? "none" : "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => setSettingsSubTab("credentials")}
              >
                🔐 Credenciales y Conexión
              </button>
              <button
                type="button"
                className={`btn-admin ${settingsSubTab === "sync" ? "btn-admin-primary" : ""}`}
                style={{ borderRadius: "8px", padding: "8px 16px", fontSize: "0.85rem", border: settingsSubTab === "sync" ? "none" : "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => setSettingsSubTab("sync")}
              >
                🔄 Sincronización y Pruebas API
              </button>
            </div>

            {settingsSubTab === "credentials" ? (
              <div className="settings-grid">
                {/* CREDENCIALES MENSAJERIA */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>📧 Configuración de Brevo y n8n</h3>
                  <form onSubmit={handleSaveSettings}>
                    <div className="admin-form-group">
                      <label>API Key de Brevo (v3 REST Key):</label>
                      <input 
                        type="password" 
                        placeholder="xkeysib-..." 
                        className="input-admin-text"
                        value={brevoApiKey}
                        onChange={(e) => setBrevoApiKey(e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Nombre del Remitente:</label>
                      <input 
                        type="text" 
                        placeholder="Lezcom SpA" 
                        className="input-admin-text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Correo Electrónico Autorizado:</label>
                      <input 
                        type="email" 
                        placeholder="info@lezcom.cl" 
                        className="input-admin-text"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                      />
                      <span style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "5px", display: "block", lineHeight: "1.4" }}>
                        ⚠️ <strong>IMPORTANTE:</strong> Este correo remitente debe estar previamente registrado y activado como remitente autorizado (Sender) dentro de tu cuenta de Brevo (sección <em>Senders & IPs</em>), de lo contrario Brevo rechazará todos los envíos con estado <strong>Fallido</strong>.
                      </span>
                    </div>

                    <div className="admin-form-group">
                      <label>URL del Webhook de n8n (Google Sheets Fetch):</label>
                      <input 
                        type="text" 
                        placeholder="https://n8n.santisoft.cl/webhook/..." 
                        className="input-admin-text"
                        value={n8nWebhookUrl}
                        onChange={(e) => setN8nWebhookUrl(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn-admin btn-admin-primary" style={{ marginTop: "12px", width: "100%", justifyContent: "center" }}>
                      💾 Guardar Configuraciones de Envío
                    </button>
                  </form>
                </div>

                {/* INTEGRACIÓN DE FIREBASE */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>🔥 Configuración de Firebase Firestore</h3>
                  <form onSubmit={handleSaveFirebaseSettings}>
                    <div className="admin-form-group">
                      <label>API Key:</label>
                      <input 
                        type="text" 
                        placeholder="AIzaSy..." 
                        className="input-admin-text"
                        value={firebaseConfig.apiKey}
                        onChange={(e) => setFirebaseConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Project ID (ID del Proyecto):</label>
                      <input 
                        type="text" 
                        placeholder="lezcom-db" 
                        className="input-admin-text"
                        value={firebaseConfig.projectId}
                        onChange={(e) => setFirebaseConfig(prev => ({ ...prev, projectId: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Auth Domain:</label>
                      <input 
                        type="text" 
                        placeholder="lezcom-db.firebaseapp.com" 
                        className="input-admin-text"
                        value={firebaseConfig.authDomain}
                        onChange={(e) => setFirebaseConfig(prev => ({ ...prev, authDomain: e.target.value }))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Storage Bucket:</label>
                      <input 
                        type="text" 
                        placeholder="lezcom-db.appspot.com" 
                        className="input-admin-text"
                        value={firebaseConfig.storageBucket}
                        onChange={(e) => setFirebaseConfig(prev => ({ ...prev, storageBucket: e.target.value }))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Messaging Sender ID:</label>
                      <input 
                        type="text" 
                        placeholder="3829104829" 
                        className="input-admin-text"
                        value={firebaseConfig.messagingSenderId}
                        onChange={(e) => setFirebaseConfig(prev => ({ ...prev, messagingSenderId: e.target.value }))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>App ID:</label>
                      <input 
                        type="text" 
                        placeholder="1:3829104829:web:a1b2c3d4..." 
                        className="input-admin-text"
                        value={firebaseConfig.appId}
                        onChange={(e) => setFirebaseConfig(prev => ({ ...prev, appId: e.target.value }))}
                      />
                    </div>

                    <button type="submit" className="btn-admin btn-admin-success" style={{ marginTop: "12px", width: "100%", justifyContent: "center" }}>
                      🔥 Conectar Firestore en Caliente
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* BOTONES DE CARGA RÁPIDA */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: "16px", fontSize: "1.1rem" }}>Acciones Rápidas de Sincronización</h3>
                  <div className="actions-row">
                    <div className="button-group">
                      <button 
                        className="btn-admin btn-admin-primary"
                        onClick={handleSyncWithN8n}
                        disabled={isSyncing || !n8nWebhookUrl}
                      >
                        {isSyncing ? "⏳ Sincronizando..." : "🔄 Sincronizar Google Sheets (n8n)"}
                      </button>
                      <button 
                        className="btn-admin"
                        onClick={() => setShowCSVModal(true)}
                      >
                        📂 Importar Libro Excel (.xlsx)
                      </button>
                    </div>

                    <div className="button-group">
                      <button 
                        className="btn-admin btn-admin-success"
                        onClick={handleTestBrevoConnection}
                        disabled={isTestingBrevo || !brevoApiKey}
                      >
                        {isTestingBrevo ? "⏳ Enviando..." : "📧 Probar API de Brevo"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CONSOLA DE ENVÍOS EN VIVO */}
                <div className="glass-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "1.1rem" }}>Consola de Envío de Campañas</h3>
                    {consoleLogs.length > 0 && (
                      <button className="btn-admin" style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={handleExportCampaignLogs}>
                        💾 Descargar Reporte CSV
                      </button>
                    )}
                  </div>

                  {/* Barra de Progreso */}
                  {isSendingCampaign && (
                    <div className="progress-container">
                      <div className="progress-header">
                        <span>Enviando correos... {campaignProgress.toFixed(0)}%</span>
                        <span>{campaignSentCount + campaignFailedCount} de {campaignTotal}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${campaignProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {/* Consola Terminal */}
                  <div className="console-container">
                    <div className="console-header">
                      <div className="console-title">
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isSendingCampaign ? "#3b82f6" : "#64748b", display: "inline-block" }}></span>
                        TERMINAL DE SALIDA LOGS Masivos
                      </div>
                      {isSendingCampaign && (
                        <button className="btn-admin btn-admin-danger" style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={handleStopCampaign}>
                          🛑 Detener Envío
                        </button>
                      )}
                    </div>
                    <div className="console-body">
                      {consoleLogs.length === 0 ? (
                        <div className="console-line info">&gt;_ Consola lista para emitir registros de envíos. Inicia un proceso desde la pestaña 'Clientes'...</div>
                      ) : (
                        consoleLogs.map((log, index) => (
                          <div key={index} className={`console-line ${log.type}`}>
                            <span className="console-line timestamp">[{log.timestamp}]</span>
                            {log.type === "error" && "🔴 "}
                            {log.type === "success" && "🟢 "}
                            {log.type === "warn" && "🟡 "}
                            {log.text}
                          </div>
                        ))
                      )}
                      <div ref={consoleBottomRef} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==============================================
          MODAL: CARGA DE CSV MANUAL
          ============================================== */}
      {showCSVModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Cargar Planilla Excel (Clientes + Plantillas)</h2>
              <button className="modal-close" onClick={() => setShowCSVModal(false)}>×</button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: "1.4" }}>
                Sube tu archivo de Excel (<strong>.xlsx</strong> o <strong>.xls</strong>) que contiene las dos pestañas de tu libro:<br />
                • Pestaña <strong>Clientes</strong> (columnas: <i>Rut, RazonSocial, Rubro, Representante, EMAIL</i>)<br />
                • Pestaña <strong>Templates</strong> o <strong>Plantillas</strong> (columnas: <i>Rubro, Template</i>)
              </p>
            </div>

            <div 
              className="drag-drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="drag-drop-icon">📊</span>
              <span className="drag-drop-text">Haz clic aquí para seleccionar tu archivo Excel</span>
              <span className="drag-drop-subtext">Soporta formato .xlsx o .xls con múltiples pestañas</span>
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".xlsx, .xls" 
                style={{ display: "none" }}
                onChange={handleExcelUpload}
              />
            </div>

          </div>
        </div>
      )}


      {/* ==============================================
          MODAL: EDICIÓN EN CALIENTE DE CONTACTO
          ============================================== */}
      {showEditModal && editingContact && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>Editar Contacto en Base de Datos</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <form onSubmit={handleUpdateContact}>
              <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "8px" }}>
                <div className="admin-form-group">
                  <label>Razón Social (Empresa):</label>
                  <input 
                    type="text" 
                    className="input-admin-text"
                    value={editingContact.RazonSocial}
                    onChange={(e) => setEditingContact({ ...editingContact, RazonSocial: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Representante (Contacto):</label>
                  <input 
                    type="text" 
                    className="input-admin-text"
                    value={editingContact.Representante}
                    onChange={(e) => setEditingContact({ ...editingContact, Representante: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Cargo del Representante:</label>
                  <input 
                    type="text" 
                    className="input-admin-text"
                    value={editingContact.CargoContacto || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, CargoContacto: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Celular del Contacto:</label>
                  <input 
                    type="text" 
                    className="input-admin-text"
                    value={editingContact.CelularContacto || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, CelularContacto: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Teléfono de Contacto:</label>
                  <input 
                    type="text" 
                    className="input-admin-text"
                    value={editingContact.TelefonoContacto || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, TelefonoContacto: e.target.value })}
                  />
                </div>


                <div className="admin-form-group">
                  <label>EMAIL:</label>
                  <input 
                    type="email" 
                    className="input-admin-text"
                    value={editingContact.EMAIL}
                    onChange={(e) => setEditingContact({ ...editingContact, EMAIL: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Rubro (Emparejador de Plantilla):</label>
                  <input 
                    type="text" 
                    className="input-admin-text"
                    value={editingContact.Rubro}
                    onChange={(e) => setEditingContact({ ...editingContact, Rubro: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Pitch Personalizado:</label>
                  <textarea 
                    className="input-admin-text"
                    rows={4}
                    style={{ fontFamily: "inherit", resize: "vertical" }}
                    value={editingContact.Pitch_Personalizado}
                    onChange={(e) => setEditingContact({ ...editingContact, Pitch_Personalizado: e.target.value })}
                  />
                </div>
              </div>

              <div className="button-group" style={{ marginTop: "20px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-admin" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-admin btn-admin-primary">
                  💾 Actualizar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: CONFIRMACIÓN DE ELIMINACIÓN
          ============================================== */}
      {deleteConfirm && deleteConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 1001 }}>
          <div className="modal-content" style={{ maxWidth: "420px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#ffffff" }}>
              {deleteConfirm.type === "all" ? "Purga Completa de Clientes" : "Eliminar Cliente"}
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "24px", lineHeight: "1.5" }}>
              {deleteConfirm.type === "all" 
                ? "¿Estás seguro de que deseas eliminar de forma permanente a TODOS los clientes de la base de datos Firestore? Esta acción es irreversible."
                : "¿Estás seguro de que deseas eliminar permanentemente a este cliente de la base de datos Firestore?"
              }
            </p>
            <div className="button-group" style={{ justifyContent: "center", gap: "12px" }}>
              <button 
                className="btn-admin" 
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn-admin btn-admin-danger" 
                onClick={async () => {
                  const type = deleteConfirm.type;
                  const cid = deleteConfirm.contactId;
                  setDeleteConfirm(null);
                  if (type === "all") {
                    await handleDeleteAllContacts();
                  } else if (cid) {
                    await handleDeleteContact(cid);
                  }
                }}
              >
                {deleteConfirm.type === "all" ? "Sí, Eliminar Todos" : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: DETALLES DE LOG / SEGUIMIENTO DE ENVÍO
          ============================================== */}
      {selectedTrackingDetail && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: "550px", border: "1px solid rgba(255,255,255,0.1)", padding: "30px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#ffffff", margin: 0 }}>
                🔍 Bitácora de Envío
              </h2>
              <button 
                onClick={() => setSelectedTrackingDetail(null)} 
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: "var(--text-secondary)", 
                  fontSize: "1.5rem", 
                  cursor: "pointer" 
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Cliente</div>
                <div style={{ fontSize: "1.05rem", fontWeight: "bold", color: "#ffffff" }}>{selectedTrackingDetail.RazonSocial || "S/R"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>RUT: {selectedTrackingDetail.Rut || "Sin RUT"}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Correo de Contacto</div>
                  <div style={{ fontSize: "0.9rem", color: "#ffffff", wordBreak: "break-all" }}>{selectedTrackingDetail.EMAIL}</div>
                </div>
                <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Rubro</div>
                  <div style={{ fontSize: "0.9rem", color: "#ffffff" }}>{selectedTrackingDetail.Rubro || "Sin Rubro"}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Último Intento</div>
                  <div style={{ fontSize: "0.85rem", color: "#ffffff" }}>
                    {selectedTrackingDetail.tracking?.ultimoEnvio 
                      ? new Date(selectedTrackingDetail.tracking.ultimoEnvio.seconds ? selectedTrackingDetail.tracking.ultimoEnvio.seconds * 1000 : selectedTrackingDetail.tracking.ultimoEnvio).toLocaleString()
                      : "Nunca intentado"
                    }
                  </div>
                </div>
                <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Intentos Realizados</div>
                  <div style={{ fontSize: "0.85rem", color: "#ffffff" }}>
                    {selectedTrackingDetail.tracking?.intentos || 0} de 3
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold", marginBottom: "6px" }}>Estado de Envío</div>
                <span className={`badge-status ${selectedTrackingDetail.tracking?.estadoEnvio || "pendiente"}`}>
                  {selectedTrackingDetail.tracking?.estadoEnvio === "pendiente" && "⏳ Pendiente"}
                  {selectedTrackingDetail.tracking?.estadoEnvio === "enviando" && "🔵 Enviando"}
                  {selectedTrackingDetail.tracking?.estadoEnvio === "enviado" && "✔️ Enviado"}
                  {selectedTrackingDetail.tracking?.estadoEnvio === "fallido" && "❌ Fallido"}
                </span>
              </div>

              {selectedTrackingDetail.tracking?.estadoEnvio === "enviado" && selectedTrackingDetail.tracking?.mensajeId && (
                <div style={{ backgroundColor: "rgba(16,185,129,0.05)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.1)" }}>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", textTransform: "uppercase", fontWeight: "bold" }}>ID del Mensaje (Brevo)</div>
                  <code style={{ fontSize: "0.8rem", color: "#a7f3d0", display: "block", marginTop: "4px", overflowX: "auto", whiteSpace: "pre" }}>
                    {selectedTrackingDetail.tracking.mensajeId}
                  </code>
                </div>
              )}

              {selectedTrackingDetail.tracking?.estadoEnvio === "fallido" && (
                <div style={{ backgroundColor: "rgba(239,68,68,0.05)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div style={{ fontSize: "0.75rem", color: "#f87171", textTransform: "uppercase", fontWeight: "bold", marginBottom: "6px" }}>Detalle del Error</div>
                  <pre style={{ 
                    fontSize: "0.75rem", 
                    color: "#fca5a5", 
                    backgroundColor: "rgba(0,0,0,0.3)", 
                    padding: "10px", 
                    borderRadius: "6px", 
                    whiteSpace: "pre-wrap", 
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                    margin: 0
                  }}>
                    {selectedTrackingDetail.tracking.errorDetalle || "No se registró detalle de error específico."}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
              <button 
                className="btn-admin" 
                onClick={() => setSelectedTrackingDetail(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: AVANCE DE ENVÍO DE CAMPAÑA MASIVA (LIGHTBOX DE PROGRESO)
          ============================================== */}
      {isSendingCampaign && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: "500px", border: "1px solid rgba(255,255,255,0.1)", padding: "30px 24px", textAlign: "center" }}>
            {/* Animación del cohete con aura de pulso */}
            <div style={{ position: "relative", height: "80px", marginBottom: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{
                position: "absolute",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                animation: "ping 1.5s infinite"
              }}></div>
              <span style={{ fontSize: "3rem", zIndex: 2, transform: "rotate(-15deg)", display: "inline-block" }}>
                🚀
              </span>
            </div>

            <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
              Enviando Campaña de Correos
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "24px" }}>
              Por favor, no cierres esta ventana mientras se realiza la transmisión masiva.
            </p>

            {/* Barra de Progreso Deslizante */}
            <div style={{ marginBottom: "24px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Progreso de la Campaña</span>
                <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{campaignProgress.toFixed(0)}%</span>
              </div>
              <div style={{ height: "10px", width: "100%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "999px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ 
                  height: "100%", 
                  width: `${campaignProgress}%`, 
                  backgroundColor: "#3b82f6", 
                  borderRadius: "999px", 
                  transition: "width 0.3s ease", 
                  backgroundImage: "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)", 
                  backgroundSize: "1rem 1rem", 
                  animation: "progress-bar-stripes 1s linear infinite" 
                }}></div>
              </div>
            </div>

            {/* Estadísticas de Envío Dinámicas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.12)", borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>{campaignSentCount}</div>
                <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: "500", textTransform: "uppercase" }}>✔️ Enviados</div>
              </div>
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.12)", borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ef4444" }}>{campaignFailedCount}</div>
                <div style={{ fontSize: "0.75rem", color: "#fca5a5", fontWeight: "500", textTransform: "uppercase" }}>❌ Fallidos</div>
              </div>
            </div>

            {/* Detalle del cliente procesado en tiempo real */}
            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "10px", padding: "12px 16px", marginBottom: "24px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <span>Total Procesados:</span>
                <span style={{ color: "#ffffff", fontWeight: "bold" }}>{campaignSentCount + campaignFailedCount} de {campaignTotal}</span>
              </div>
              {currentProcessingContact && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px", marginTop: "8px" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Procesando actualmente:</div>
                  <div style={{ fontSize: "0.85rem", color: "#93c5fd", fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginTop: "2px" }}>
                    🔄 {currentProcessingContact}
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Cancelación / Detener */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button 
                className="btn-admin btn-admin-danger" 
                onClick={handleStopCampaign}
                style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: "0.9rem" }}
              >
                🛑 Detener Envío
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==============================================
          MODAL: CONFIRMACIÓN DE CAMPAÑA MASIVA / REINICIO
          ============================================== */}
      {campaignConfirm && campaignConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 1002 }}>
          <div className="modal-content" style={{ maxWidth: "450px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", padding: "30px 24px" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>
              {campaignConfirm.type === "send" ? "🚀" : "🔄"}
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#ffffff" }}>
              {campaignConfirm.type === "send" ? "Iniciar Envío Masivo" : "Restablecer Estados de Envío"}
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "24px", lineHeight: "1.5" }}>
              {campaignConfirm.type === "send" 
                ? `¿Estás seguro de iniciar la campaña masiva para los ${campaignConfirm.selectedCount} contactos seleccionados? Se realizarán envíos automáticos secuenciales a través de Brevo.`
                : `¿Estás seguro de restablecer el estado de envío a 'Pendiente' para los ${campaignConfirm.selectedCount} contactos seleccionados? Sus contadores de intentos se reiniciarán a cero.`
              }
            </p>
            <div className="button-group" style={{ justifyContent: "center", gap: "12px" }}>
              <button 
                className="btn-admin" 
                onClick={() => setCampaignConfirm(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn-admin btn-admin-primary" 
                style={{ 
                  backgroundColor: campaignConfirm.type === "send" ? "var(--accent-color)" : "#dc2626",
                  color: "#ffffff"
                }}
                onClick={async () => {
                  const type = campaignConfirm.type;
                  setCampaignConfirm(null);
                  if (type === "send") {
                    setActiveTab("dashboard");
                    await executeStartCampaign();
                  } else {
                    await executeBulkResetStatus();
                  }
                }}
              >
                {campaignConfirm.type === "send" ? "Sí, Iniciar Envío" : "Sí, Restablecer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: CARGANDO / PROGRESO DE IMPORTACIÓN EXCEL
          ============================================== */}
      {isImportingExcel && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div className="modal-content" style={{ maxWidth: "450px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", padding: "30px 24px" }}>
            <div style={{ 
              width: "50px", 
              height: "50px", 
              border: "4px solid rgba(255,255,255,0.08)", 
              borderTopColor: "#3b82f6", 
              borderRadius: "50%", 
              margin: "0 auto 20px auto",
              animation: "spin 1s linear infinite"
            }}></div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "8px", color: "#ffffff" }}>
              Importando Planilla Excel
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#60a5fa", fontWeight: "600", marginBottom: "20px" }}>
              {importProgress.phase}
            </p>
            
            {importProgress.total > 0 && (
              <div style={{ marginTop: "16px", padding: "0 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  <span>Procesando registros...</span>
                  <span>{importProgress.current} de {importProgress.total}</span>
                </div>
                <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ 
                    width: `${(importProgress.current / importProgress.total) * 100}%`, 
                    height: "100%", 
                    backgroundColor: "#3b82f6", 
                    transition: "width 0.15s ease-out" 
                  }} />
                </div>
              </div>
            )}
            
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "20px", lineHeight: "1.4" }}>
              Por favor, no cierres esta ventana. Los registros se están sincronizando de forma segura en Firebase Firestore.
            </p>
          </div>
        </div>
      )}



      {/* ==============================================
          MODAL: ALERTA / NOTIFICACIÓN PERSONALIZADA
          ============================================== */}
      {notification && notification.show && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: "420px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>
              {notification.type === "success" ? "🎉" : notification.type === "error" ? "❌" : "ℹ️"}
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#ffffff" }}>
              {notification.title}
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "24px", lineHeight: "1.5" }}>
              {notification.message}
            </p>
            <button 
              className="btn-admin btn-admin-primary" 
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                const title = notification.title;
                setNotification(null);
                if (title.includes("Firebase") || title.includes("Configurado")) {
                  window.location.reload();
                }
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: CREADOR / EDITOR DE NUEVAS PLANTILLAS HTML
          ============================================== */}
      {showNewTemplateModal && (
        <div className="modal-overlay" style={{ zIndex: 999, padding: "20px" }}>
          <div className="modal-content" style={{ 
            maxWidth: "98%", 
            width: "1800px", 
            height: "92vh", 
            display: "flex", 
            flexDirection: "column", 
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "24px"
          }}>
            <div className="modal-header" style={{ marginBottom: "16px", flexShrink: 0 }}>
              <h2>{editingTemplateId ? "📝 Editar Plantilla de Correo HTML" : "➕ Crear Nueva Plantilla de Correo HTML"}</h2>
              <button className="modal-close" onClick={() => {
              setShowNewTemplateModal(false);
                setEditingTemplateId(null);
                setAiReviewResult(null);
              }}>×</button>
            </div>


            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "24px", flex: 1, minHeight: 0, marginBottom: "16px" }}>
              {/* Lado izquierdo: Inputs y Textarea */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", minHeight: 0 }}>
                
                {/* Selector de Rubro y Previsualización de Clientes */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flexShrink: 0 }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label style={{ color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.85rem" }}>
                      Asociar a Rubro:
                    </label>
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <select
                        className="select-admin"
                        style={{ flex: 1 }}
                        value={rubroSelectionType === "existing" ? newTemplateRubro : "__new_rubro__"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "__new_rubro__") {
                            setRubroSelectionType("new");
                            setNewTemplateRubro("");
                            setEditorPreviewContactId("");
                          } else {
                            setRubroSelectionType("existing");
                            setNewTemplateRubro(val);
                            const matching = contacts.find(c => c.Rubro === val);
                            setEditorPreviewContactId(matching ? matching.id : "");
                          }
                        }}
                        disabled={editingTemplateId !== null}
                      >
                        <option value="">-- Selecciona un Rubro existente --</option>
                        {existingRubros.map((rubro) => (
                          <option key={rubro} value={rubro}>{rubro}</option>
                        ))}
                        <option value="__new_rubro__">➕ Crear Nuevo Rubro...</option>
                      </select>
                    </div>

                    {rubroSelectionType === "new" && (
                      <input 
                        type="text"
                        placeholder="Escribe el nombre del NUEVO Rubro..."
                        className="input-admin-text"
                        style={{ marginTop: "10px" }}
                        value={newTemplateRubro}
                        onChange={(e) => setNewTemplateRubro(e.target.value)}
                        required
                        disabled={editingTemplateId !== null}
                      />
                    )}
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label style={{ color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.85rem" }}>
                      👤 Previsualizar con Datos de un Cliente del Rubro:
                    </label>
                    <select
                      className="select-admin"
                      style={{ width: "100%", marginTop: "6px" }}
                      value={editorPreviewContactId}
                      onChange={(e) => setEditorPreviewContactId(e.target.value)}
                    >
                      <option value="">-- Ninguno (Mostrar etiquetas {"{{RazonSocial}}"}) --</option>
                      {contacts.filter(c => c.Rubro === newTemplateRubro).map((c) => (
                        <option key={c.id} value={c.id}>{c.RazonSocial} ({c.EMAIL})</option>
                      ))}
                      {contacts.filter(c => c.Rubro === newTemplateRubro).length === 0 && contacts.length > 0 && (
                        <>
                          <option disabled>-- No hay clientes de este rubro, mostrando otros --</option>
                          {contacts.slice(0, 30).map((c) => (
                            <option key={c.id} value={c.id}>{c.RazonSocial} ({c.EMAIL}) - [{c.Rubro || "Sin Rubro"}]</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>


                <div className="admin-form-group" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", margin: 0, minHeight: 0 }}>
                  <label style={{ color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.85rem" }}>
                    Estructura HTML de la Plantilla:
                  </label>

                  {/* Barra de Herramientas de Variables Dinámicas */}
                  <div style={{ backgroundColor: "#111827", padding: "10px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", margin: "4px 0 8px 0", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                        ⚡ Haz clic en un campo para insertarlo en la plantilla en tu posición actual:
                      </div>
                      <button
                        type="button"
                        className="btn-admin btn-admin-primary"
                        style={{ 
                          padding: "5px 14px", 
                          fontSize: "0.75rem", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "6px",
                          background: isImprovingTemplate ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          border: "1px solid rgba(139,92,246,0.4)",
                          flexShrink: 0
                        }}
                        onClick={handleAiReviewTemplate}
                        disabled={isImprovingTemplate || !newTemplateHtml}
                        title="Analiza y mejora tu plantilla con Gemini AI para evitar la carpeta de Promociones"
                      >
                        {isImprovingTemplate ? (
                          <>
                            <span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}></span>
                            Analizando...
                          </>
                        ) : (
                          <>✨ Revisar con IA</>
                        )}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {[
                        { code: "RazonSocial", label: "🏢 Empresa" },
                        { code: "Rut", label: "🆔 RUT" },
                        { code: "Representante", label: "👤 Representante" },
                        { code: "CargoContacto", label: "💼 Cargo" },
                        { code: "EMAIL", label: "📧 Correo" },
                        { code: "Rubro", label: "🏷️ Rubro" },
                        { code: "CelularContacto", label: "📱 Celular" },
                        { code: "TelefonoContacto", label: "📞 Teléfono" },
                        { code: "SitioWeb", label: "🌐 Sitio Web" },
                        { code: "Pitch_Personalizado", label: "✨ Pitch Único" }
                      ].map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className="btn-admin"
                          style={{ padding: "4px 8px", fontSize: "0.7rem", backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px" }}
                          onClick={() => insertTemplatePlaceholder(item.code)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea 
                    id="new-template-html-textarea"
                    className="input-admin-text"
                    style={{ 
                      fontFamily: "Consolas, Monaco, monospace", 
                      fontSize: "0.8rem", 
                      lineHeight: "1.4",
                      flex: 1, 
                      resize: "none", 
                      backgroundColor: "#030712",
                      color: "#34d399",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "12px",
                      marginTop: "6px",
                      minHeight: "150px"
                    }}
                    placeholder="Escribe el código HTML de tu plantilla..."
                    value={newTemplateHtml}
                    onChange={(e) => setNewTemplateHtml(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Lado derecho: Previsualización en Tiempo Real */}
              <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", overflow: "hidden", backgroundColor: "#0b0f19", minHeight: 0 }}>
                <div style={{ backgroundColor: "#111827", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "700", flexShrink: 0 }}>
                  👁️ Previsualización del Correo en Tiempo Real
                </div>
                <iframe 
                  style={{ flex: 1, width: "100%", border: "none", backgroundColor: "#ffffff" }}
                  title="Realtime Sandbox Preview"
                  srcDoc={modalPreviewHtml || "<div style='padding:40px;color:#94a3b8;font-family:sans-serif;text-align:center;'>Escribe código HTML en el editor de la izquierda para comenzar a previsualizar...</div>"}
                />
              </div>
            </div>

            <div className="button-group" style={{ marginTop: "12px", justifyContent: "flex-end", flexShrink: 0 }}>
              <button className="btn-admin" onClick={() => {
                setShowNewTemplateModal(false);
                setAiReviewResult(null);
              }}>
                Cancelar
              </button>
              <button 
                className="btn-admin btn-admin-success"
                onClick={handleCreateNewTemplate}
              >
                💾 Guardar Plantilla en Firebase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: RESULTADO DE REVISIÓN DE IA
          ============================================== */}
      {aiReviewResult && (
        <div className="modal-overlay" style={{ zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" style={{ 
            maxWidth: "780px", 
            width: "95%",
            maxHeight: "90vh",
            overflowY: "auto",
            border: "1px solid rgba(139,92,246,0.3)",
            padding: "28px"
          }}>
            {/* Encabezado */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#ffffff", margin: "0 0 4px" }}>
                  ✨ Revisión de IA — Gemini
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                  Análisis de entregabilidad para evitar Spam y Promociones
                </p>
              </div>
              <button 
                onClick={() => setAiReviewResult(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Puntuación general */}
            <div style={{
              background: aiReviewResult.puntuacion_total >= 75 ? "rgba(16,185,129,0.08)" : aiReviewResult.puntuacion_total >= 50 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${aiReviewResult.puntuacion_total >= 75 ? "rgba(16,185,129,0.2)" : aiReviewResult.puntuacion_total >= 50 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`,
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px"
            }}>
              <div style={{ 
                fontSize: "2.5rem", 
                fontWeight: "900", 
                color: aiReviewResult.puntuacion_total >= 75 ? "#10b981" : aiReviewResult.puntuacion_total >= 50 ? "#f59e0b" : "#ef4444" 
              }}>
                {aiReviewResult.puntuacion_total}
              </div>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff" }}>
                  {aiReviewResult.puntuacion_total >= 75 ? "🟢 Buena entregabilidad" : aiReviewResult.puntuacion_total >= 50 ? "🟡 Entregabilidad mejorable" : "🔴 Alta probabilidad de Spam/Promoción"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Puntuación de entregabilidad sobre 100</div>
              </div>
            </div>

            {/* Diagnóstico por criterio */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "10px" }}>Diagnóstico por Criterio</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {Object.entries(aiReviewResult.diagnostico).map(([key, score]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ flex: 1, fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                      {key.replace(/_/g, " ")}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "60px", height: "6px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ 
                          width: `${(score as number) * 10}%`, 
                          height: "100%", 
                          backgroundColor: (score as number) >= 8 ? "#10b981" : (score as number) >= 5 ? "#f59e0b" : "#ef4444",
                          borderRadius: "3px",
                          transition: "width 0.5s ease"
                        }}></div>
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "700", color: (score as number) >= 8 ? "#10b981" : (score as number) >= 5 ? "#f59e0b" : "#ef4444", minWidth: "20px" }}>{score}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Problemas detectados */}
            {aiReviewResult.problemas.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "0.8rem", color: "#f87171", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>🚫 Problemas Detectados</div>
                <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {aiReviewResult.problemas.map((p, i) => (
                    <li key={i} style={{ fontSize: "0.85rem", color: "#fca5a5", lineHeight: "1.5" }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mejoras aplicadas */}
            {aiReviewResult.mejoras_aplicadas.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>✅ Mejoras Aplicadas en la Versión Sugerida</div>
                <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {aiReviewResult.mejoras_aplicadas.map((m, i) => (
                    <li key={i} style={{ fontSize: "0.85rem", color: "#6ee7b7", lineHeight: "1.5" }}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
              <button
                className="btn-admin"
                onClick={() => setAiReviewResult(null)}
              >
                Cancelar — Mantener Original
              </button>
              <button
                className="btn-admin btn-admin-primary"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "1px solid rgba(139,92,246,0.4)" }}
                onClick={() => {
                  setNewTemplateHtml(aiReviewResult.html_mejorado);
                  setAiReviewResult(null);
                  showNotificationModal("✨ Plantilla Actualizada", "El HTML mejorado por Gemini ha sido aplicado al editor. Revisa la previsualización y guarda cuando estés listo.", "success");
                }}
              >
                ✨ Aplicar HTML Mejorado por IA
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ==============================================
          MODAL: CREACIÓN MANUAL DE CLIENTES
          ============================================== */}
      {showNewClientModal && (
        <div className="modal-overlay" style={{ zIndex: 998 }}>
          <div className="modal-content" style={{ maxWidth: "550px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="modal-header">
              <h2>➕ Crear Nuevo Cliente (Manual)</h2>
              <button className="modal-close" onClick={() => setShowNewClientModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateNewClient}>
              <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
                <div className="admin-form-group">
                  <label>Razón Social (Empresa):</label>
                  <input 
                    type="text" 
                    placeholder="Empresa de Ejemplo SpA"
                    className="input-admin-text"
                    value={newClientData.RazonSocial}
                    onChange={(e) => setNewClientData({ ...newClientData, RazonSocial: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>RUT de la Empresa:</label>
                  <input 
                    type="text" 
                    placeholder="77.123.456-K"
                    className="input-admin-text"
                    value={newClientData.Rut}
                    onChange={(e) => setNewClientData({ ...newClientData, Rut: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>EMAIL de Contacto:</label>
                  <input 
                    type="email" 
                    placeholder="ejemplo@correo.com"
                    className="input-admin-text"
                    value={newClientData.EMAIL}
                    onChange={(e) => setNewClientData({ ...newClientData, EMAIL: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Representante (Contacto):</label>
                  <input 
                    type="text" 
                    placeholder="Nombre del Representante"
                    className="input-admin-text"
                    value={newClientData.Representante}
                    onChange={(e) => setNewClientData({ ...newClientData, Representante: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Cargo del Representante:</label>
                  <input 
                    type="text" 
                    placeholder="Gerente, Socio, KAM..."
                    className="input-admin-text"
                    value={newClientData.CargoContacto || ""}
                    onChange={(e) => setNewClientData({ ...newClientData, CargoContacto: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Celular de Contacto:</label>
                  <input 
                    type="text" 
                    placeholder="56-9-12345678"
                    className="input-admin-text"
                    value={newClientData.CelularContacto || ""}
                    onChange={(e) => setNewClientData({ ...newClientData, CelularContacto: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Teléfono de Contacto:</label>
                  <input 
                    type="text" 
                    placeholder="56-2-2123456"
                    className="input-admin-text"
                    value={newClientData.TelefonoContacto || ""}
                    onChange={(e) => setNewClientData({ ...newClientData, TelefonoContacto: e.target.value })}
                  />
                </div>


                <div className="admin-form-group">
                  <label>Asociar a Rubro:</label>
                  <select
                    className="select-admin"
                    style={{ width: "100%", marginTop: "6px" }}
                    value={newClientData.Rubro}
                    onChange={(e) => setNewClientData({ ...newClientData, Rubro: e.target.value })}
                  >
                    <option value="">-- Selecciona un Rubro --</option>
                    {existingRubros.map((rubro) => (
                      <option key={rubro} value={rubro}>{rubro}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="O escribe un nuevo Rubro aquí..."
                    className="input-admin-text"
                    style={{ marginTop: "10px" }}
                    value={newClientData.Rubro}
                    onChange={(e) => setNewClientData({ ...newClientData, Rubro: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Pitch Personalizado:</label>
                  <textarea 
                    placeholder="Escribe un párrafo personalizado para este cliente..."
                    className="input-admin-text"
                    rows={4}
                    style={{ fontFamily: "inherit", resize: "vertical" }}
                    value={newClientData.Pitch_Personalizado}
                    onChange={(e) => setNewClientData({ ...newClientData, Pitch_Personalizado: e.target.value })}
                  />
                </div>
              </div>

              <div className="button-group" style={{ marginTop: "20px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-admin" onClick={() => setShowNewClientModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-admin btn-admin-primary">
                  💾 Guardar Cliente en Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: EDITOR DE ARTÍCULOS DE BLOG
          ============================================== */}
      {showBlogEditorModal && (
        <div className="modal-overlay" style={{ zIndex: 1100, padding: "20px" }}>
          <div className="modal-content" style={{ 
            maxWidth: "1200px", 
            width: "95%", 
            maxHeight: "90vh", 
            display: "flex", 
            flexDirection: "column", 
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden"
          }}>
            {/* Cabecera */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexShrink: 0 }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#ffffff", margin: 0 }}>
                {selectedBlog ? "📝 Editar Artículo del Blog" : "✨ Revisar y Crear Artículo Generado"}
              </h2>
              <button 
                className="modal-close" 
                onClick={() => setShowBlogEditorModal(false)}
                style={{ fontSize: "1.8rem", color: "var(--text-secondary)", background: "transparent", border: "none", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            {/* Contenido principal en dos columnas (Formulario a la izq, Previsualización a la der) */}
            <form onSubmit={handleSaveBlog} style={{ display: "flex", flex: 1, gap: "24px", minHeight: 0 }}>
              
              {/* Columna Izquierda: Formulario de Edición */}
              <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", paddingRight: "8px" }}>
                
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>Título del Artículo:</label>
                  <input 
                    type="text" 
                    className="input-admin-text" 
                    value={blogFormTitle}
                    onChange={(e) => {
                      setBlogFormTitle(e.target.value);
                      if (!selectedBlog) {
                        // Generar slug automático si es creación nueva
                        setBlogFormSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
                      }
                    }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>Ruta / Slug URL:</label>
                    <input 
                      type="text" 
                      className="input-admin-text" 
                      value={blogFormSlug}
                      onChange={(e) => setBlogFormSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, '-'))}
                      required
                      placeholder="ej-guia-mantenimiento-acero"
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>Tiempo Lectura:</label>
                    <input 
                      type="text" 
                      className="input-admin-text" 
                      value={blogFormLeido}
                      onChange={(e) => setBlogFormLeido(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>URL Imagen de Cabecera:</label>
                  <input 
                    type="text" 
                    className="input-admin-text" 
                    value={blogFormImage}
                    onChange={(e) => setBlogFormImage(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>Resumen Corto (Meta Descripción SEO):</label>
                  <textarea 
                    className="input-admin-text" 
                    rows={2}
                    value={blogFormResumen}
                    onChange={(e) => setBlogFormResumen(e.target.value)}
                    required
                    style={{ resize: "vertical", fontFamily: "inherit", fontSize: "0.85rem" }}
                  />
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>Palabras Clave SEO (separadas por comas):</label>
                  <input 
                    type="text" 
                    className="input-admin-text" 
                    value={blogFormKeywords}
                    onChange={(e) => setBlogFormKeywords(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", margin: 0, minHeight: "200px" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>Contenido HTML del Artículo:</label>
                  <textarea 
                    className="input-admin-text" 
                    style={{ 
                      flex: 1, 
                      fontFamily: "monospace", 
                      fontSize: "0.8rem", 
                      lineHeight: "1.4", 
                      backgroundColor: "#0f172a", 
                      color: "#94a3b8",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      padding: "10px",
                      resize: "none"
                    }}
                    value={blogFormContent}
                    onChange={(e) => setBlogFormContent(e.target.value)}
                    required
                  />
                </div>

                {/* Switch de Publicación */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                  <input 
                    type="checkbox" 
                    id="blogFormPublicado"
                    checked={blogFormPublicado}
                    onChange={(e) => setBlogFormPublicado(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="blogFormPublicado" style={{ fontSize: "0.9rem", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>
                    🌐 Publicar inmediatamente en el sitio web público
                  </label>
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "14px", marginTop: "8px", flexShrink: 0 }}>
                  <button type="button" className="btn-admin" onClick={() => setShowBlogEditorModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-admin btn-admin-primary" style={{ padding: "10px 20px" }}>
                    💾 Guardar Cambios y Publicar
                  </button>
                </div>

              </div>

              {/* Columna Derecha: Vista Previa Renderizada en Vivo */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: "24px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "12px", display: "block" }}>
                  👀 Previsualización del Artículo:
                </span>
                
                {/* Contenedor del Preview simulando el post real */}
                <div style={{ 
                  flex: 1, 
                  overflowY: "auto", 
                  backgroundColor: "#ffffff", 
                  color: "#334155", 
                  borderRadius: "12px", 
                  padding: "24px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  fontFamily: "system-ui, -apple-system, sans-serif"
                }}>
                  {/* Cabecera del post */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>
                      <span>📅 {new Date().toLocaleDateString("es-CL")}</span>
                      <span>•</span>
                      <span>⏱️ {blogFormLeido || "5 min de lectura"}</span>
                    </div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0f172a", margin: "0 0 10px 0", lineHeight: "1.2" }}>
                      {blogFormTitle || "Sin Título"}
                    </h1>
                    <p style={{ fontSize: "0.95rem", color: "#475569", lineHeight: "1.5", margin: 0, fontStyle: "italic" }}>
                      {blogFormResumen || "Introduce un resumen para la meta descripción..."}
                    </p>
                  </div>

                  {/* Imagen */}
                  {blogFormImage && (
                    <div style={{ height: "200px", width: "100%", borderRadius: "8px", overflow: "hidden", marginBottom: "24px" }}>
                      <img src={blogFormImage} alt={blogFormTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  {/* Cuerpo del Artículo (HTML) */}
                  <div 
                    className="blog-rich-content"
                    dangerouslySetInnerHTML={{ __html: blogFormContent }} 
                    style={{ 
                      fontSize: "0.95rem", 
                      lineHeight: "1.7",
                      color: "#334155"
                    }}
                  />
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

