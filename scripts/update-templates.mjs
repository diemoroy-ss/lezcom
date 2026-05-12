/**
 * update-templates.mjs
 * Actualiza las plantillas HTML de correo en Firestore con versiones
 * optimizadas para pasar los filtros de Gmail (anti-Promociones).
 * 
 * Ejecución: node scripts/update-templates.mjs
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
// PLANTILLAS OPTIMIZADAS PARA ENTREGABILIDAD
// Principios aplicados:
//  1. HTML mínimo — parece escrito a mano, no un newsletter
//  2. Un solo enlace externo (lezcom.cl)
//  3. Sin imágenes, tablas complejas ni estilos de marketing
//  4. Personalización dinámica al inicio ({{Representante}})
//  5. Pregunta de cierre que invita a responder (señal de conversación)
//  6. Asunto en <title> — natural, sin palabras trigger
// ============================================================

const templates = {

  "Alimentos y Cocina Industrial": `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Coordinación de equipamiento para cocina industrial — {{RazonSocial}}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">

    <p style="margin:0 0 16px;">Hola {{Representante}},</p>

    <p style="margin:0 0 16px;">Espero que estés teniendo una excelente semana.</p>

    <p style="margin:0 0 16px;">
      Me llamo Gabriel Muñoz y soy parte del equipo técnico de <strong>Lezcom SpA</strong>, empresa chilena especializada en fabricación nacional de soluciones en acero inoxidable para la industria.
    </p>

    <p style="margin:0 0 16px;">
      Estuve revisando la actividad de <strong>{{RazonSocial}}</strong> en el rubro de <strong>{{Rubro}}</strong> y quería contactarte personalmente, porque creemos que podemos apoyarlos en sus requerimientos de equipamiento sanitario — ya sea mesones de trabajo, lavamanos industriales, carros de servicio u otras piezas a medida.
    </p>

    <p style="margin:0 0 16px;">
      Toda nuestra fabricación cumple con normativas sanitarias vigentes y la entrega es directa desde nuestra planta en Santiago.
    </p>

    <p style="margin:0 0 16px;">
      ¿Tienes disponibilidad para una llamada breve de 10 minutos esta semana? Me gustaría entender qué es lo que más necesitan en este momento.
    </p>

    <p style="margin:0 0 4px;">Quedo muy atento,</p>
    <p style="margin:0 0 4px;"><strong>Gabriel Muñoz</strong></p>
    <p style="margin:0 0 4px;">Lezcom SpA — Fabricación en Acero Inoxidable</p>
    <p style="margin:0 0 4px;"><a href="https://www.lezcom.cl" style="color:#1a1a1a;">www.lezcom.cl</a></p>

  </div>
</body>
</html>`,

  "Construcción e Ingeniería": `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Piezas y estructuras en acero inoxidable para proyectos — {{RazonSocial}}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">

    <p style="margin:0 0 16px;">Hola {{Representante}},</p>

    <p style="margin:0 0 16px;">
      Mi nombre es Gabriel Muñoz, del equipo técnico de <strong>Lezcom SpA</strong>. Me pongo en contacto contigo porque trabajamos directamente con empresas del sector de <strong>{{Rubro}}</strong> que necesitan piezas o estructuras en acero inoxidable fabricadas a medida.
    </p>

    <p style="margin:0 0 16px;">
      En <strong>{{RazonSocial}}</strong>, es posible que estén ejecutando proyectos que requieran componentes específicos — escaleras, pasamanos, estructuras de soporte, cubiertas o piezas personalizadas según plano.
    </p>

    <p style="margin:0 0 16px;">
      Trabajamos con distintos tipos de acero inoxidable (304, 316, 430) y tenemos capacidad de fabricar desde prototipos únicos hasta series de producción, con tiempos de entrega ajustados a las necesidades de obra.
    </p>

    <p style="margin:0 0 16px;">
      ¿Tienen actualmente algún proyecto donde pudieran necesitar este tipo de suministro? Me gustaría conocer los detalles para ver si podemos ser un aporte.
    </p>

    <p style="margin:0 0 4px;">Saludos cordiales,</p>
    <p style="margin:0 0 4px;"><strong>Gabriel Muñoz</strong></p>
    <p style="margin:0 0 4px;">Lezcom SpA — Fabricación en Acero Inoxidable</p>
    <p style="margin:0 0 4px;"><a href="https://www.lezcom.cl" style="color:#1a1a1a;">www.lezcom.cl</a></p>

  </div>
</body>
</html>`,

  "Metalurgia y Estructuras": `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Fabricación especializada en acero inoxidable — {{RazonSocial}}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">

    <p style="margin:0 0 16px;">Hola {{Representante}},</p>

    <p style="margin:0 0 16px;">
      Soy Gabriel Muñoz de <strong>Lezcom SpA</strong>. Me comunico contigo porque sabemos que en el área de <strong>{{Rubro}}</strong>, la calidad del material y la precisión en la fabricación son factores que no admiten margen de error.
    </p>

    <p style="margin:0 0 16px;">
      En <strong>{{RazonSocial}}</strong>, es probable que manejen requerimientos de componentes que deben resistir condiciones exigentes — altas temperaturas, fricción, ambientes corrosivos o cargas mecánicas importantes.
    </p>

    <p style="margin:0 0 16px;">
      Nos especializamos en la fabricación de piezas y estructuras en acero inoxidable directamente en nuestra planta en Santiago, con control de calidad en cada etapa del proceso. Podemos trabajar desde planos técnicos o muestras físicas.
    </p>

    <p style="margin:0 0 16px;">
      ¿Tienes algún requerimiento activo o en planificación donde podamos cotizar? Estaré feliz de revisar los detalles contigo.
    </p>

    <p style="margin:0 0 4px;">Quedamos a tu disposición,</p>
    <p style="margin:0 0 4px;"><strong>Gabriel Muñoz</strong></p>
    <p style="margin:0 0 4px;">Lezcom SpA — Fabricación en Acero Inoxidable</p>
    <p style="margin:0 0 4px;"><a href="https://www.lezcom.cl" style="color:#1a1a1a;">www.lezcom.cl</a></p>

  </div>
</body>
</html>`,

  "Montajes y Suministros Industriales": `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Suministro de acero inoxidable para operaciones industriales — {{RazonSocial}}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">

    <p style="margin:0 0 16px;">Hola {{Representante}},</p>

    <p style="margin:0 0 16px;">
      Mi nombre es Gabriel Muñoz y soy parte del área comercial de <strong>Lezcom SpA</strong>, fabricantes nacionales de soluciones en acero inoxidable.
    </p>

    <p style="margin:0 0 16px;">
      Me contacto contigo porque trabajamos habitualmente con empresas del rubro de <strong>{{Rubro}}</strong> como <strong>{{RazonSocial}}</strong>, suministrando tanto piezas estándar como soluciones a medida para distintas etapas de instalación y montaje.
    </p>

    <p style="margin:0 0 16px;">
      Entendemos que en operaciones industriales los tiempos son críticos. Por eso fabricamos localmente en Santiago, lo que nos permite comprometer plazos de entrega concretos y flexibilidad frente a cambios de especificación.
    </p>

    <p style="margin:0 0 16px;">
      ¿Están trabajando en algún proyecto de montaje o suministro donde necesiten este tipo de materiales? Me gustaría saber si podemos ser parte de su cadena de proveedores.
    </p>

    <p style="margin:0 0 4px;">Muchas gracias por tu tiempo,</p>
    <p style="margin:0 0 4px;"><strong>Gabriel Muñoz</strong></p>
    <p style="margin:0 0 4px;">Lezcom SpA — Fabricación en Acero Inoxidable</p>
    <p style="margin:0 0 4px;"><a href="https://www.lezcom.cl" style="color:#1a1a1a;">www.lezcom.cl</a></p>

  </div>
</body>
</html>`

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
