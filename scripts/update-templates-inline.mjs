/**
 * update-templates-inline.mjs
 * 100% inline CSS — compatible con Gmail, Outlook, Apple Mail.
 * Sin bloques <style> en el <head>, todo el CSS va directo en cada elemento.
 * 
 * v2.0 — Plantillas reescritas con enfoque PROBLEMA → SOLUCIÓN.
 *         Cada correo empatiza con un dolor real del rubro antes de presentar
 *         lo que Lezcom puede hacer al respecto.
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

// ─── ESTILOS INLINE REUTILIZABLES ───────────────────────────
const S = {
  body:        'margin:0;padding:0;background-color:#eef2f7;font-family:Arial,Helvetica,sans-serif;',
  wrapper:     'background-color:#eef2f7;padding:32px 16px;',
  container:   'max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;',
  header:      'background-color:#1a2e4a;padding:28px 36px;',
  logoText:    'font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;margin:0;',
  logoSub:     'font-size:11px;color:#7eb8e8;text-transform:uppercase;letter-spacing:1.5px;margin:4px 0 0;',
  accentBar:   'height:4px;background-color:#1d4ed8;',
  body_:       'padding:36px 36px 24px;',
  greeting:    'font-size:17px;color:#1a2e4a;font-weight:700;margin:0 0 20px;',
  para:        'font-size:15px;color:#374151;line-height:1.75;margin:0 0 16px;',
  // Caja de PROBLEMA (roja/naranja sutil)
  problemBox:  'background-color:#fef3f2;border-left:4px solid #f87171;border-radius:0 6px 6px 0;padding:16px 20px;margin:20px 0;',
  problemP:    'font-size:14px;color:#7f1d1d;line-height:1.75;margin:0;',
  // Caja de SOLUCIÓN (azul)
  hbox:        'background-color:#f0f7ff;border-left:4px solid #3b82f6;border-radius:0 6px 6px 0;padding:16px 20px;margin:24px 0;',
  hboxP:       'font-size:14px;color:#1e3a5f;line-height:1.75;margin:0;',
  ctaWrap:     'text-align:center;margin:28px 0;',
  ctaBtn:      'display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:6px;letter-spacing:0.3px;mso-padding-alt:0;',
  question:    'font-size:15px;color:#1a2e4a;font-weight:600;line-height:1.6;margin:20px 0 0;',
  divider:     'border:none;border-top:1px solid #e5e7eb;margin:28px 0 20px;',
  sigName:     'font-size:15px;font-weight:700;color:#1a2e4a;margin:0 0 2px;',
  sigRole:     'font-size:13px;color:#6b7280;margin:0 0 2px;',
  sigCo:       'font-size:13px;color:#3b82f6;font-weight:600;margin:0;',
  footer:      'background-color:#f8fafc;padding:18px 36px;border-top:1px solid #e5e7eb;',
  footerP:     'font-size:11px;color:#9ca3af;margin:0;line-height:1.6;text-align:center;',
  footerA:     'color:#6b7280;text-decoration:none;',
};

function makeTemplate({ title, bodyRows }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="${S.body}">
  <div style="${S.wrapper}">
    <div style="${S.container}">

      <!-- HEADER -->
      <div style="${S.header}">
        <p style="${S.logoText}">LEZCOM SpA</p>
        <p style="${S.logoSub}">Fabricación en Acero Inoxidable &middot; Santiago, Chile</p>
      </div>
      <div style="${S.accentBar}"></div>

      <!-- CUERPO -->
      <div style="${S.body_}">
${bodyRows}
        <hr style="${S.divider}">
        <p style="${S.sigName}">Gabriel Muñoz</p>
        <p style="${S.sigRole}">Ejecutivo Comercial</p>
        <p style="${S.sigCo}">Lezcom SpA &mdash; Acero Inoxidable Industrial</p>
      </div>

      <!-- FOOTER -->
      <div style="${S.footer}">
        <p style="${S.footerP}">
          Lezcom SpA &middot; Santiago, Chile<br>
          <a href="https://www.lezcom.cl" style="${S.footerA}">www.lezcom.cl</a>
          &middot;
          <a href="mailto:info@lezcom.cl" style="${S.footerA}">info@lezcom.cl</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

// ─── PLANTILLAS (v2 — enfoque PROBLEMA → SOLUCIÓN) ──────────

const templates = {

"Alimentos y Cocina Industrial": makeTemplate({
  title: "Equipamiento de cocina industrial en acero inoxidable — {{RazonSocial}}",
  bodyRows: `
        <p style="${S.greeting}">Hola {{Representante}},</p>

        <p style="${S.para}">
          Mi nombre es Gabriel Muñoz y soy ejecutivo comercial de <strong>Lezcom SpA</strong>. Me puse en contacto contigo porque trabajamos con empresas del rubro de <strong>{{Rubro}}</strong> y conozco de cerca los desafíos que enfrentan a diario.
        </p>

        <div style="${S.problemBox}">
          <p style="${S.problemP}">
            En el sector gastronómico e industrial, los proveedores de equipamiento importado suelen demorar semanas o meses en entregar, las fiscalizaciones del MINSAL exigen materiales con certificación sanitaria, y un equipo dañado o inadecuado puede generar paros operativos que cuestan dinero cada hora.
          </p>
        </div>

        <p style="${S.para}">
          En <strong>Lezcom SpA</strong> nos especializamos en resolver exactamente esos problemas para empresas como <strong>{{RazonSocial}}</strong>:
        </p>

        <div style="${S.hbox}">
          <p style="${S.hboxP}">
            ✔&nbsp; Mesones y estaciones de trabajo a medida &mdash; sin depender de catálogos importados<br>
            ✔&nbsp; Lavamanos y equipos con certificación sanitaria MINSAL<br>
            ✔&nbsp; Fabricación local en Santiago &mdash; plazos de entrega concretos y comprometidos<br>
            ✔&nbsp; Reparación y reposición rápida para evitar paros operativos
          </p>
        </div>

        <p style="${S.para}">
          Al fabricar directamente y sin intermediarios, podemos ajustarnos a las especificaciones técnicas exactas de cada proyecto y reaccionar con rapidez ante cualquier urgencia.
        </p>

        <div style="${S.ctaWrap}">
          <a href="https://www.lezcom.cl" style="${S.ctaBtn}">Ver catálogo y casos de uso &rarr;</a>
        </div>

        <p style="${S.question}">
          ¿Tienen actualmente algún equipo que necesite reposición o están planificando una ampliación de cocina? Me gustaría entender sus necesidades para prepararles una cotización sin compromiso.
        </p>
`}),

"Construcción e Ingeniería": makeTemplate({
  title: "Piezas y estructuras en acero inoxidable para proyectos — {{RazonSocial}}",
  bodyRows: `
        <p style="${S.greeting}">Hola {{Representante}},</p>

        <p style="${S.para}">
          Soy Gabriel Muñoz, ejecutivo comercial de <strong>Lezcom SpA</strong>. Me contacto contigo porque trabajamos con empresas del rubro de <strong>{{Rubro}}</strong> y entiendo bien la presión que manejan en cada proyecto.
        </p>

        <div style="${S.problemBox}">
          <p style="${S.problemP}">
            En construcción, un proveedor que no cumple plazos puede paralizar una obra completa. Las especificaciones técnicas cambian a mitad de proyecto y muchos proveedores cobran recargos por cada modificación. Además, depender de importaciones introduce incertidumbre en la planificación y presupuesto.
          </p>
        </div>

        <p style="${S.para}">
          En <strong>Lezcom SpA</strong> fabricamos directamente en nuestra planta en Santiago, lo que nos permite ofrecerle a <strong>{{RazonSocial}}</strong> soluciones concretas para estos problemas:
        </p>

        <div style="${S.hbox}">
          <p style="${S.hboxP}">
            ✔&nbsp; Pasamanos, escaleras y estructuras de soporte fabricados según plano técnico<br>
            ✔&nbsp; Flexibilidad ante cambios de especificación durante la obra, sin recargos excesivos<br>
            ✔&nbsp; Acero inoxidable 304 o 316 según los requerimientos del proyecto<br>
            ✔&nbsp; Plazos de entrega comprometidos por escrito &mdash; sin depender de importaciones
          </p>
        </div>

        <p style="${S.para}">
          Nuestra cercanía permite visitas técnicas a obra, ajustes de última hora y tiempos de reacción que un proveedor externo simplemente no puede ofrecer.
        </p>

        <div style="${S.ctaWrap}">
          <a href="https://www.lezcom.cl" style="${S.ctaBtn}">Conocer nuestra capacidad de fabricación &rarr;</a>
        </div>

        <p style="${S.question}">
          ¿Tienen algún proyecto activo o en planificación donde necesiten este tipo de suministro? Con gusto revisamos los planos y preparamos una cotización ajustada a sus requerimientos.
        </p>
`}),

"Metalurgia y Estructuras": makeTemplate({
  title: "Fabricación especializada en acero inoxidable para su sector — {{RazonSocial}}",
  bodyRows: `
        <p style="${S.greeting}">Hola {{Representante}},</p>

        <p style="${S.para}">
          Soy Gabriel Muñoz de <strong>Lezcom SpA</strong>. Me comunico contigo porque en el área de <strong>{{Rubro}}</strong>, sabemos que la precisión en la fabricación y la calidad del material no admiten margen de error.
        </p>

        <div style="${S.problemBox}">
          <p style="${S.problemP}">
            En la industria metalúrgica, utilizar el grado de acero equivocado puede provocar fallas prematuras en piezas críticas. Muchos proveedores solo venden catálogo estándar y no fabrican desde plano. Y la falta de trazabilidad y control de calidad en componentes que operan bajo corrosión, alta temperatura o fricción puede significar costos enormes en mantención y reemplazo.
          </p>
        </div>

        <p style="${S.para}">
          En <strong>{{RazonSocial}}</strong> probablemente manejan requerimientos donde los componentes deben resistir condiciones exigentes. Es exactamente el tipo de desafío en que Lezcom tiene experiencia:
        </p>

        <div style="${S.hbox}">
          <p style="${S.hboxP}">
            ✔&nbsp; Fabricación desde planos técnicos o muestras físicas &mdash; no solo catálogo<br>
            ✔&nbsp; Asesoría en selección de acero: 304, 316 y 430 según la aplicación real<br>
            ✔&nbsp; Control de calidad documentado en cada etapa del proceso productivo<br>
            ✔&nbsp; Desde prototipos únicos hasta series en volumen, con trazabilidad completa
          </p>
        </div>

        <p style="${S.para}">
          Toda la fabricación se realiza en Chile, con supervisión técnica directa y tiempos de entrega comprometidos por escrito. No dependemos de terceros ni de importaciones.
        </p>

        <div style="${S.ctaWrap}">
          <a href="https://www.lezcom.cl" style="${S.ctaBtn}">Ver proyectos y capacidades técnicas &rarr;</a>
        </div>

        <p style="${S.question}">
          ¿Tienen actualmente algún requerimiento o proyecto en planificación donde podamos cotizar? Estaré feliz de revisar las especificaciones con usted.
        </p>
`}),

"Montajes y Suministros Industriales": makeTemplate({
  title: "Suministro en acero inoxidable para operaciones industriales — {{RazonSocial}}",
  bodyRows: `
        <p style="${S.greeting}">Hola {{Representante}},</p>

        <p style="${S.para}">
          Mi nombre es Gabriel Muñoz y soy parte del área comercial de <strong>Lezcom SpA</strong>, fabricantes nacionales de piezas y suministros en acero inoxidable para la industria.
        </p>

        <div style="${S.problemBox}">
          <p style="${S.problemP}">
            En operaciones industriales, un paro de planta por falta de piezas de repuesto puede costar millones. Manejar múltiples proveedores para piezas estándar y a medida multiplica la complejidad logística. Y depender de importaciones con tiempos impredecibles y costos ocultos pone en riesgo la continuidad operativa.
          </p>
        </div>

        <p style="${S.para}">
          Me pongo en contacto con <strong>{{RazonSocial}}</strong> porque podemos resolver estos problemas con una sola relación de proveedor:
        </p>

        <div style="${S.hbox}">
          <p style="${S.hboxP}">
            ✔&nbsp; Suministro de piezas estándar y soluciones a medida en un solo proveedor<br>
            ✔&nbsp; Fabricación local &mdash; sin dependencia de importaciones ni tiempos inciertos<br>
            ✔&nbsp; Flexibilidad para cambios de especificación durante el proyecto<br>
            ✔&nbsp; Soporte técnico directo del equipo de producción y respuesta ante urgencias
          </p>
        </div>

        <p style="${S.para}">
          Al fabricar en Santiago, nos comprometemos con plazos reales desde el primer contacto y podemos responder a urgencias operativas que un importador simplemente no puede atender a tiempo.
        </p>

        <div style="${S.ctaWrap}">
          <a href="https://www.lezcom.cl" style="${S.ctaBtn}">Conocer más sobre Lezcom SpA &rarr;</a>
        </div>

        <p style="${S.question}">
          ¿Están trabajando en algún proyecto de montaje o tienen piezas que necesitan reposición urgente? Me gustaría saber si podemos ser parte de su cadena de proveedores.
        </p>
`}),

};

// ─── EJECUCIÓN ───────────────────────────────────────────────

async function run() {
  console.log("📋 Cargando plantillas desde Firestore...");
  const snap = await getDocs(collection(db, "templates"));
  let updated = 0, skipped = 0;

  for (const docSnap of snap.docs) {
    const rubro = docSnap.data().Rubro;
    if (templates[rubro]) {
      await updateDoc(doc(db, "templates", docSnap.id), {
        Template: templates[rubro],
        ultimoSync: new Date()
      });
      console.log(`  ✅ ${rubro}`);
      updated++;
    } else {
      console.log(`  ⏭️  Sin cambio: ${rubro}`);
      skipped++;
    }
  }

  console.log(`\n🎉 ${updated} actualizadas, ${skipped} sin cambios.`);
  process.exit(0);
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
