/**
 * update-templates-styled.mjs
 * Actualiza las plantillas HTML con diseño profesional de email marketing B2B.
 * Diseño: header de marca con colores corporativos, CSS inline, un solo CTA.
 * 
 * Ejecución: node scripts/update-templates-styled.mjs
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjwT70wFxV-H834XsZy4EMmf55Hdyy878",
  authDomain: "proyecto1-76315.firebaseapp.com",
  projectId: "proyecto1-76315",
  storageBucket: "proyecto1-76315.firebasestorage.app",
  messagingSenderId: "354528165392",
  appId: "1:354528165392:web:3ddc7b1d8e956a934f1495",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================
// DISEÑO: Email B2B profesional con identidad de marca Lezcom
// - Header con franja de color corporativo + logo tipo texto
// - Saludo personalizado destacado
// - Cuerpo con tipografía legible y espaciado generoso
// - Bloque de propuesta con borde acento
// - UN solo botón CTA
// - Footer de firma con datos de contacto
// ============================================================

const BASE_STYLES = `
  body { margin: 0; padding: 0; background-color: #eef2f7; font-family: Arial, Helvetica, sans-serif; }
  .wrapper { background-color: #eef2f7; padding: 32px 16px; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background-color: #1a2e4a; padding: 28px 36px; }
  .logo-text { font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; }
  .logo-sub { font-size: 11px; color: #7eb8e8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
  .accent-bar { height: 4px; background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
  .body { padding: 36px 36px 24px; }
  .greeting { font-size: 17px; color: #1a2e4a; font-weight: 700; margin: 0 0 20px; }
  .paragraph { font-size: 15px; color: #374151; line-height: 1.75; margin: 0 0 16px; }
  .highlight-box { background-color: #f0f7ff; border-left: 4px solid #3b82f6; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 24px 0; }
  .highlight-box p { font-size: 14px; color: #1e3a5f; line-height: 1.7; margin: 0; }
  .cta-wrap { text-align: center; margin: 28px 0; }
  .cta-button { display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 6px; letter-spacing: 0.3px; }
  .question { font-size: 15px; color: #1a2e4a; font-weight: 600; line-height: 1.6; margin: 20px 0 0; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 20px; }
  .signature-name { font-size: 15px; font-weight: 700; color: #1a2e4a; margin: 0 0 2px; }
  .signature-role { font-size: 13px; color: #6b7280; margin: 0 0 2px; }
  .signature-company { font-size: 13px; color: #3b82f6; font-weight: 600; margin: 0 0 2px; }
  .footer { background-color: #f8fafc; padding: 18px 36px; border-top: 1px solid #e5e7eb; }
  .footer p { font-size: 11px; color: #9ca3af; margin: 0; line-height: 1.6; text-align: center; }
  .footer a { color: #6b7280; text-decoration: none; }
`;

function makeTemplate({ title, rubro, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <!-- HEADER -->
      <div class="header">
        <div class="logo-text">LEZCOM SpA</div>
        <div class="logo-sub">Fabricación en Acero Inoxidable · Santiago, Chile</div>
      </div>
      <div class="accent-bar"></div>

      <!-- CUERPO -->
      <div class="body">
${bodyHtml}
        <hr class="divider">
        <p class="signature-name">Gabriel Muñoz</p>
        <p class="signature-role">Ejecutivo Comercial</p>
        <p class="signature-company">Lezcom SpA — Acero Inoxidable Industrial</p>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <p>
          Lezcom SpA · Santiago, Chile<br>
          <a href="https://www.lezcom.cl">www.lezcom.cl</a> · <a href="mailto:info@lezcom.cl">info@lezcom.cl</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// PLANTILLAS POR RUBRO
// ─────────────────────────────────────────────────────────────

const templates = {

"Alimentos y Cocina Industrial": makeTemplate({
  title: "Equipamiento de cocina industrial en acero inoxidable — {{RazonSocial}}",
  rubro: "Alimentos y Cocina Industrial",
  bodyHtml: `
        <p class="greeting">Hola {{Representante}},</p>

        <p class="paragraph">
          Espero que estés teniendo una muy buena semana. Mi nombre es Gabriel Muñoz y soy ejecutivo comercial de <strong>Lezcom SpA</strong>, empresa chilena con más de una década fabricando equipamiento gastronómico e industrial en acero inoxidable.
        </p>

        <p class="paragraph">
          Me puse en contacto contigo porque trabajamos con empresas del sector de <strong>{{Rubro}}</strong> y quería presentarte lo que podemos hacer para <strong>{{RazonSocial}}</strong>:
        </p>

        <div class="highlight-box">
          <p>
            ✔ Mesones y estaciones de trabajo a medida<br>
            ✔ Lavamanos industriales con certificación sanitaria<br>
            ✔ Carros de servicio, bandejas y piezas bajo norma<br>
            ✔ Fabricación local en Santiago — plazos de entrega concretos
          </p>
        </div>

        <p class="paragraph">
          Todo nuestro equipamiento cumple con las normativas del MINSAL y está diseñado para entornos de alta demanda. Fabricamos directamente, sin intermediarios, lo que nos permite ajustarnos a las especificaciones técnicas de cada proyecto.
        </p>

        <div class="cta-wrap">
          <a href="https://www.lezcom.cl" class="cta-button">Ver catálogo y casos de uso →</a>
        </div>

        <p class="question">
          ¿Tienen actualmente algún requerimiento de equipamiento o están planificando una ampliación? Me gustaría entender sus necesidades para ver cómo podemos ayudarlos.
        </p>
`}),

"Construcción e Ingeniería": makeTemplate({
  title: "Piezas y estructuras en acero inoxidable para proyectos — {{RazonSocial}}",
  rubro: "Construcción e Ingeniería",
  bodyHtml: `
        <p class="greeting">Hola {{Representante}},</p>

        <p class="paragraph">
          Mi nombre es Gabriel Muñoz, ejecutivo comercial de <strong>Lezcom SpA</strong>. Me contacto contigo porque trabajamos con empresas del rubro de <strong>{{Rubro}}</strong> que necesitan componentes o estructuras en acero inoxidable para sus proyectos.
        </p>

        <p class="paragraph">
          Sé que en <strong>{{RazonSocial}}</strong> manejan proyectos donde los plazos y la calidad del suministro son factores críticos. Por eso quería mostrarte lo que ofrecemos:
        </p>

        <div class="highlight-box">
          <p>
            ✔ Pasamanos, escaleras y estructuras de soporte a medida<br>
            ✔ Componentes según plano técnico en acero 304 o 316<br>
            ✔ Cubiertas, revestimientos y piezas arquitectónicas<br>
            ✔ Fabricación local — adaptación rápida a cambios de obra
          </p>
        </div>

        <p class="paragraph">
          Fabricamos directamente en nuestra planta en Santiago, lo que nos permite comprometer plazos concretos y reaccionar con agilidad ante modificaciones de especificación durante la obra.
        </p>

        <div class="cta-wrap">
          <a href="https://www.lezcom.cl" class="cta-button">Conocer nuestra capacidad de fabricación →</a>
        </div>

        <p class="question">
          ¿Tienen algún proyecto activo donde estén buscando este tipo de suministro? Con gusto revisamos los detalles y preparamos una cotización.
        </p>
`}),

"Metalurgia y Estructuras": makeTemplate({
  title: "Fabricación especializada en acero inoxidable para su sector — {{RazonSocial}}",
  rubro: "Metalurgia y Estructuras",
  bodyHtml: `
        <p class="greeting">Hola {{Representante}},</p>

        <p class="paragraph">
          Soy Gabriel Muñoz de <strong>Lezcom SpA</strong>. Me comunico contigo porque en el área de <strong>{{Rubro}}</strong>, sabemos que la precisión en la fabricación y la calidad del material no admiten margen de error.
        </p>

        <p class="paragraph">
          En <strong>{{RazonSocial}}</strong> probablemente manejan requerimientos donde los componentes deben resistir condiciones exigentes. Es exactamente el tipo de desafío en que Lezcom tiene experiencia:
        </p>

        <div class="highlight-box">
          <p>
            ✔ Fabricación desde planos técnicos o muestras físicas<br>
            ✔ Acero inoxidable 304, 316 y 430 según aplicación<br>
            ✔ Piezas para entornos corrosivos, alta temperatura o fricción<br>
            ✔ Control de calidad en cada etapa del proceso productivo
          </p>
        </div>

        <p class="paragraph">
          Trabajamos con series desde prototipos únicos hasta producción en volumen. Toda la fabricación se realiza en Chile, con supervisión técnica directa y tiempos de entrega comprometidos por escrito.
        </p>

        <div class="cta-wrap">
          <a href="https://www.lezcom.cl" class="cta-button">Ver proyectos y capacidades técnicas →</a>
        </div>

        <p class="question">
          ¿Tienen actualmente algún requerimiento o proyecto en planificación donde podamos cotizar? Estaré feliz de revisar las especificaciones con usted.
        </p>
`}),

"Montajes y Suministros Industriales": makeTemplate({
  title: "Suministro en acero inoxidable para operaciones industriales — {{RazonSocial}}",
  rubro: "Montajes y Suministros Industriales",
  bodyHtml: `
        <p class="greeting">Hola {{Representante}},</p>

        <p class="paragraph">
          Mi nombre es Gabriel Muñoz y soy parte del área comercial de <strong>Lezcom SpA</strong>, fabricantes nacionales de piezas y suministros en acero inoxidable para la industria.
        </p>

        <p class="paragraph">
          Me pongo en contacto con <strong>{{RazonSocial}}</strong> porque empresas del rubro de <strong>{{Rubro}}</strong> con las que trabajamos nos han valorado especialmente por dos razones:
        </p>

        <div class="highlight-box">
          <p>
            ✔ Suministro de piezas estándar y soluciones a medida en un solo proveedor<br>
            ✔ Fabricación local — sin dependencia de importaciones ni tiempos de despacho inciertos<br>
            ✔ Flexibilidad ante cambios de especificación durante el proyecto<br>
            ✔ Soporte técnico directo del equipo de producción
          </p>
        </div>

        <p class="paragraph">
          En operaciones industriales, los tiempos son críticos. Por eso fabricamos en Santiago y nos comprometemos con plazos reales desde el primer contacto.
        </p>

        <div class="cta-wrap">
          <a href="https://www.lezcom.cl" class="cta-button">Conocer más sobre Lezcom SpA →</a>
        </div>

        <p class="question">
          ¿Están trabajando en algún proyecto de montaje o suministro donde necesiten este tipo de material? Me gustaría saber si podemos ser parte de su cadena de proveedores.
        </p>
`})

};

async function updateTemplates() {
  console.log("📋 Cargando plantillas desde Firestore...");
  const snap = await getDocs(collection(db, "templates"));

  let updated = 0;
  let skipped = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const rubro = data.Rubro;

    if (templates[rubro]) {
      await updateDoc(doc(db, "templates", docSnap.id), {
        Template: templates[rubro],
        ultimoSync: new Date()
      });
      console.log(`  ✅ Actualizada: ${rubro}`);
      updated++;
    } else {
      console.log(`  ⏭️  Sin plantilla nueva para: ${rubro}`);
      skipped++;
    }
  }

  console.log(`\n🎉 Proceso completado: ${updated} actualizadas, ${skipped} sin cambios.`);
  process.exit(0);
}

updateTemplates().catch(err => {
  console.error("❌ Error al actualizar:", err.message);
  process.exit(1);
});
