// ============================================================
//  index.js — CreatorWeb | Web del Cliente
//  Firebase Firestore: lee misión, visión, portafolio, servicios,
//  contacto y escribe citas.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc,
  doc, getDoc, query, orderBy, limit, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Firebase Config ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCG5hiyp-nuJoZnuH0XjqyA8Gx_4ATSFCg",
  authDomain: "creator-web-8b6f3.firebaseapp.com",
  projectId: "creator-web-8b6f3",
  storageBucket: "creator-web-8b6f3.firebasestorage.app",
  messagingSenderId: "542294059774",
  appId: "1:542294059774:web:f7c0bbb96147812a1313af",
  measurementId: "G-DJ0RX7RDB9"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Utilidades ───────────────────────────────────────────────
function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(div);
  setTimeout(() => div.remove(), 4200);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

// ── 1. CARGAR INFO DE LA EMPRESA ─────────────────────────────
async function cargarEmpresa() {
  try {
    const snap = await getDoc(doc(db, "empresa", "info"));
    if (!snap.exists()) {
      // Mostrar placeholders si no hay datos aún
      document.getElementById("mision-texto").textContent = "Próximamente...";
      document.getElementById("vision-texto").textContent  = "Próximamente...";
      return;
    }
    const data = snap.data();

    // Misión
    document.getElementById("mision-titulo").textContent = data.misionTitulo || "Nuestra Misión";
    document.getElementById("mision-texto").textContent  = data.mision       || "";

    // Visión
    document.getElementById("vision-titulo").textContent = data.visionTitulo || "Nuestra Visión";
    document.getElementById("vision-texto").textContent  = data.vision       || "";

    // Hero descripción
    if (data.heroDesc) document.getElementById("hero-desc").textContent = data.heroDesc;

    // Contacto
    const wa   = data.whatsapp || "";
    const mail = data.email    || "";
    const city = data.ciudad   || "";
    document.getElementById("contact-whatsapp").textContent = wa;
    document.getElementById("contact-email").textContent    = mail;
    document.getElementById("contact-ciudad").textContent   = city;
    document.getElementById("footer-desc").textContent      = data.footerDesc || "";

    // WhatsApp float button
    if (wa) {
      const num = wa.replace(/\D/g, "");
      document.getElementById("wa-float-btn").href   = `https://wa.me/${num}`;
      document.getElementById("footer-wa").href      = `https://wa.me/${num}`;
      document.getElementById("footer-wa").textContent = wa;
    }
    if (mail) {
      document.getElementById("footer-email").href      = `mailto:${mail}`;
      document.getElementById("footer-email").textContent = mail;
    }

    // Valores
    if (data.valores && Array.isArray(data.valores)) {
      renderValores(data.valores);
    }
  } catch (e) {
    console.error("Error cargando empresa:", e);
  }
}

function renderValores(valores) {
  const grid = document.getElementById("valores-grid");
  const defaultIcons = ["⚡","🎯","💡","🤝","🚀","🔒"];
  grid.innerHTML = valores.map((v, i) => `
    <div class="value-chip">
      <div class="icon">${v.icono || defaultIcons[i % defaultIcons.length]}</div>
      <h4>${v.nombre}</h4>
      <p>${v.descripcion || ""}</p>
    </div>
  `).join("");
}

// ── 2. CARGAR PORTAFOLIO ─────────────────────────────────────
async function cargarPortafolio() {
  const grid = document.getElementById("portfolio-grid");
  try {
    const q    = query(collection(db, "portafolio"), orderBy("orden", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="icon">🖥️</div>
        <p>Próximamente proyectos aquí.</p>
      </div>`;
      return;
    }

    let html = "";
    snap.forEach(d => {
      const p = d.data();
      const imgHtml = p.imagen
        ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy" />`
        : `<div class="placeholder-icon">🌐</div>`;
      const tagsHtml = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join("");
      html += `
        <div class="portfolio-card" onclick="${p.url ? `window.open('${p.url}','_blank')` : ''}">
          <div class="portfolio-preview">
            ${imgHtml}
            <div class="preview-overlay"><i class="fa fa-external-link-alt fa-lg" style="color:var(--accent)"></i></div>
          </div>
          <div class="portfolio-info">
            <h3>${p.nombre}</h3>
            <p>${p.descripcion || ""}</p>
            <div class="portfolio-tags">${tagsHtml}</div>
          </div>
        </div>`;
    });
    grid.innerHTML = html;
  } catch (e) {
    console.error("Error portafolio:", e);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="icon">⚠️</div><p>No se pudo cargar el portafolio.</p>
    </div>`;
  }
}

// ── 3. CARGAR SERVICIOS ──────────────────────────────────────
async function cargarServicios() {
  const grid = document.getElementById("servicios-grid");
  const colorAccents = [
    "rgba(0,229,255,0.08)", "rgba(124,58,237,0.08)", "rgba(245,158,11,0.08)"
  ];
  try {
    const q    = query(collection(db, "servicios"), orderBy("orden", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="icon">📦</div><p>Servicios próximamente.</p>
      </div>`;
      return;
    }

    let html = ""; let i = 0;
    snap.forEach(d => {
      const s = d.data();
      const bg = colorAccents[i % colorAccents.length];
      html += `
        <div class="service-card">
          <div class="service-icon" style="background:${bg}">
            <span style="font-size:1.5rem">${s.icono || "🌐"}</span>
          </div>
          <h3>${s.nombre}</h3>
          <p>${s.descripcion || ""}</p>
          ${s.precio ? `<div class="service-price">Desde $${Number(s.precio).toLocaleString("es-CO")} <small>COP</small></div>` : ""}
        </div>`;
      i++;
    });
    grid.innerHTML = html;
  } catch (e) {
    console.error("Error servicios:", e);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="icon">⚠️</div><p>No se pudieron cargar los servicios.</p>
    </div>`;
  }
}

// ── 4. AGENDAR CITA ──────────────────────────────────────────
window.agendarCita = async function() {
  const nombre   = document.getElementById("apt-nombre").value.trim();
  const telefono = document.getElementById("apt-telefono").value.trim();
  const email    = document.getElementById("apt-email").value.trim();
  const fecha    = document.getElementById("apt-fecha").value;
  const hora     = document.getElementById("apt-hora").value;
  const tipo     = document.getElementById("apt-tipo").value;
  const mensaje  = document.getElementById("apt-mensaje").value.trim();

  if (!nombre || !telefono || !email || !fecha) {
    showToast("Por favor completa los campos obligatorios *", "error");
    return;
  }

  const btn = document.getElementById("btn-cita");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Enviando...';

  try {
    await addDoc(collection(db, "citas"), {
      nombre, telefono, email, fecha, hora,
      tipo: tipo || "No especificado",
      mensaje,
      estado: "pendiente",
      creadoEn: Timestamp.now()
    });
    showToast("✅ ¡Cita agendada! Nos comunicaremos pronto.", "success");
    document.getElementById("appointment-form").reset();
    setTimeout(() => cerrarModalCita(), 1800);
  } catch (e) {
    console.error("Error cita:", e);
    showToast("Error al enviar la cita. Intenta de nuevo.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-calendar-check"></i> Agendar Cita';
  }
};

// ── 5. NAVBAR SCROLL ─────────────────────────────────────────
window.addEventListener("scroll", () => {
  document.getElementById("navbar").classList.toggle("scrolled", scrollY > 40);
});

// ── 6. MENÚ MÓVIL ────────────────────────────────────────────
window.toggleMenu = function() {
  document.getElementById("mobile-nav").classList.toggle("open");
  document.getElementById("overlay-nav").classList.toggle("open");
};
document.getElementById("hamburger").addEventListener("click", toggleMenu);

// ── 7. MODAL CITA ─────────────────────────────────────────────
window.abrirModalCita = function() {
  const overlay = document.getElementById("modal-cita-overlay");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  // Fecha mínima al abrir
  const hoy = new Date().toISOString().split("T")[0];
  const fechaInput = document.getElementById("apt-fecha");
  if (fechaInput) fechaInput.min = hoy;
};

window.cerrarModalCita = function() {
  document.getElementById("modal-cita-overlay").classList.remove("open");
  document.body.style.overflow = "";
};

// Cerrar al hacer clic fuera del modal
window.cerrarModalCitaOverlay = function(e) {
  if (e.target === document.getElementById("modal-cita-overlay")) {
    cerrarModalCita();
  }
};

// Cerrar con tecla Escape
document.addEventListener("keydown", e => {
  if (e.key === "Escape") cerrarModalCita();
});

// ── 8. REVEAL ON SCROLL ──────────────────────────────────────
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

// ── INIT ─────────────────────────────────────────────────────
(async () => {
  await cargarEmpresa();
  await cargarPortafolio();
  await cargarServicios();
})();
