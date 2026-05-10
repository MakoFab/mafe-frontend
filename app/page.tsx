'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ── Brand colors (Tailwind arbitrary values) ────────────────────────────────
const DARK    = '#085041'
const PRIMARY = '#1D9E75'
const ACCENT  = '#5DCAA5'
const LIGHT   = '#E1F5EE'

// ── Static data ──────────────────────────────────────────────────────────────
const SERVICIOS = [
  { icon: '🧠', titulo: 'Tratamientos Cognitivos', desc: 'Especialistas en Alzheimer y deterioros cognitivos. Desarrollamos un plan personalizado en casa de cuidado para cada paciente.' },
  { icon: '☀️', titulo: 'Centro Día', desc: 'Programas terapéuticos entre semana de 9 am a 4 pm, adaptados a las necesidades y condición de cada paciente.' },
  { icon: '💛', titulo: 'Apoyo Emocional', desc: 'Amor y dignidad en cada interacción. Brindamos acompañamiento integral a residentes y también a sus cuidadores.' },
  { icon: '🏡', titulo: 'Larga Estancia', desc: 'Nos convertimos en familia. Plan terapéutico físico y cognitivo orientado al bienestar y la felicidad de cada residente.' },
  { icon: '❤️', titulo: 'Cuidado con Amor', desc: 'Plan terapéutico individualizado que garantiza una vida digna, con calidad y mucho amor en cada momento.' },
  { icon: '🕐', titulo: 'Monitoreo 24/7', desc: 'Atención permanente y seguimiento continuo de cada residente, con registro digital y alertas para el equipo médico.' },
]

const TESTIMONIOS = [
  {
    nombre: 'Ana Suarez',
    ciudad: 'Colombia',
    texto: 'El cuidado y amor que brindan a nuestros mayores es invaluable. ¡Gracias, Mafe!',
    iniciales: 'AS',
  },
  {
    nombre: 'Jorge Andrés Pinilla',
    ciudad: 'Bogotá, Colombia',
    texto: 'La transparencia que ofrece Mafe es incomparable. Saber que mi papá está bien cuidado y poder seguir su progreso día a día nos da una tranquilidad enorme a toda la familia.',
    iniciales: 'JA',
  },
  {
    nombre: 'Lucía Fernanda Ospina',
    ciudad: 'Bogotá, Colombia',
    texto: 'Mi abuelita llegó con mucho temor, pero el ambiente cálido y las actividades diarias la transformaron. Hoy está más activa y feliz que nunca. El equipo de Mafe es extraordinario.',
    iniciales: 'LF',
  },
]

const STATS = [
  { valor: '98%',    label: 'Satisfacción familiar' },
  { valor: '+20',    label: 'Años de experiencia'   },
  { valor: '24/7',   label: 'Atención continua'     },
  { valor: '❤️',     label: 'Cuidamos con amor'     },
]

// ── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 60) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollA(id: string) {
    setMenuAbierto(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen font-sans antialiased text-gray-800 bg-white">

      {/* ── Sticky nav ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm"
              style={{ backgroundColor: PRIMARY }}
            >
              M
            </div>
            <span
              className={`font-bold text-lg transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}
            >
              Casa Geriátrica Mafe
            </span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {['servicios', 'plataforma', 'familias', 'testimonios', 'contacto'].map(id => (
              <button
                key={id}
                onClick={() => scrollA(id)}
                className={`text-sm font-medium capitalize transition-colors hover:opacity-80 ${
                  scrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                {id === 'plataforma' ? 'Plataforma' :
                 id === 'familias'   ? 'Familias'   :
                 id === 'testimonios'? 'Testimonios' :
                 id === 'contacto'   ? 'Contacto'   :
                 'Servicios'}
              </button>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/portal/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: PRIMARY }}
            >
              Portal Familiar
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menú"
          >
            <span className={`block text-2xl ${scrolled ? 'text-gray-800' : 'text-white'}`}>
              {menuAbierto ? '✕' : '☰'}
            </span>
          </button>
        </div>

        {/* Mobile menu */}
        {menuAbierto && (
          <div className="md:hidden bg-white shadow-lg mt-2 px-6 py-4 space-y-3">
            {['servicios', 'plataforma', 'familias', 'testimonios', 'contacto'].map(id => (
              <button
                key={id}
                onClick={() => scrollA(id)}
                className="block w-full text-left text-sm font-medium text-gray-700 py-2 capitalize"
              >
                {id}
              </button>
            ))}
            <Link href="/login" className="block text-sm font-medium text-gray-700 py-2">Iniciar sesión</Link>
            <Link
              href="/portal/login"
              className="block text-center text-sm font-semibold text-white py-2 rounded-lg"
              style={{ backgroundColor: PRIMARY }}
            >
              Portal Familiar
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        id="inicio"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${DARK} 0%, #0d6b56 50%, ${PRIMARY} 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: ACCENT }} />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: ACCENT }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ border: `1px solid ${ACCENT}` }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16 grid md:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
              style={{ backgroundColor: `${ACCENT}30`, color: ACCENT }}
            >
              Cuidado geriátrico de excelencia · Más de 20 años
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
              Cuidamos con amor,{' '}
              <span style={{ color: ACCENT }}>recordando desde el corazón</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              En Mafe confiamos en el amor como la mayor medicina. Con nuestro equipo desarrollamos un plan
              terapéutico individualizado y personalizado, de tal forma que se garantice una vida digna,
              con calidad y mucho amor.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => scrollA('contacto')}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 hover:shadow-xl"
                style={{ backgroundColor: PRIMARY }}
              >
                Agenda una visita gratuita
              </button>
              <Link
                href="/portal/login"
                className="px-6 py-3 rounded-xl font-semibold border-2 border-white/40 text-white hover:bg-white/10 transition-all"
              >
                Acceder al portal familiar →
              </Link>
            </div>

            {/* Mini stats */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-extrabold" style={{ color: ACCENT }}>{s.valor}</p>
                  <p className="text-xs text-white/60 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mockup card */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-80">
              {/* Card glow */}
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-30" style={{ backgroundColor: ACCENT }} />
              {/* Dashboard mockup */}
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header bar */}
                <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: DARK }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: PRIMARY }}>M</div>
                  <span className="text-white text-sm font-semibold">Casa Geriátrica Mafe</span>
                </div>
                {/* Content */}
                <div className="p-5 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Residentes — hoy</p>
                  {[
                    { nombre: 'Gloria Esperanza R.', hab: '101', estado: 'tranquilo', color: '#1D9E75' },
                    { nombre: 'Luis Arturo M.',       hab: '104', estado: 'activo',    color: '#1D9E75' },
                    { nombre: 'Carmen del Pilar V.',  hab: '202', estado: 'tranquilo', color: '#1D9E75' },
                  ].map(r => (
                    <div key={r.nombre} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: PRIMARY }}>
                        {r.nombre[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{r.nombre}</p>
                        <p className="text-[10px] text-gray-400">Hab. {r.hab}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: r.color }}>
                        {r.estado}
                      </span>
                    </div>
                  ))}
                  {/* Mini chart bars */}
                  <div className="pt-2">
                    <p className="text-[10px] text-gray-400 mb-2">Signos vitales promedio hoy</p>
                    <div className="flex items-end gap-1 h-10">
                      {[60, 75, 55, 80, 70, 65, 85, 72, 68, 78].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{ height: `${h}%`, backgroundColor: i % 2 === 0 ? PRIMARY : ACCENT, opacity: 0.7 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* ── Servicios ──────────────────────────────────────────────────────── */}
      <section id="servicios" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block"
              style={{ backgroundColor: LIGHT, color: PRIMARY }}>
              Nuestros servicios
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-4" style={{ color: DARK }}>
              Cuidado integral en cada aspecto
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Cada residente recibe atención personalizada respaldada por un sistema digital que garantiza continuidad y transparencia.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICIOS.map(s => (
              <div
                key={s.titulo}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: LIGHT }}
                >
                  {s.icon}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: DARK }}>{s.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plataforma ─────────────────────────────────────────────────────── */}
      <section id="plataforma" className="py-24" style={{ backgroundColor: LIGHT }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block text-white"
                style={{ backgroundColor: PRIMARY }}>
                Tecnología médica
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-4 mb-6" style={{ color: DARK }}>
                Una plataforma diseñada para el cuidado real
              </h2>
              <ul className="space-y-4 text-gray-600">
                {[
                  { icon: '✅', text: 'Historial clínico digital con acceso inmediato desde cualquier dispositivo' },
                  { icon: '🔔', text: 'Alertas automáticas cuando los signos vitales salen del rango normal' },
                  { icon: '📋', text: 'Reportes de turno en PDF generados en segundos para el equipo médico' },
                  { icon: '💊', text: 'MAR (Medication Administration Record) digital con trazabilidad completa' },
                  { icon: '📸', text: 'Galería de fotos de actividades visible para las familias en tiempo real' },
                  { icon: '🔒', text: 'Acceso seguro con roles: médico, enfermera, cuidador, familia y admin' },
                ].map(item => (
                  <li key={item.text} className="flex gap-3">
                    <span className="text-lg mt-0.5">{item.icon}</span>
                    <span className="text-sm leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: stylized phone mockup */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Phone frame */}
                <div
                  className="w-64 rounded-[2.5rem] p-2 shadow-2xl"
                  style={{ backgroundColor: DARK }}
                >
                  <div className="rounded-[2rem] overflow-hidden bg-white">
                    {/* Status bar */}
                    <div className="h-6 flex items-center justify-between px-4" style={{ backgroundColor: DARK }}>
                      <span className="text-[9px] text-white/60">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-1.5 rounded-sm bg-white/60" />
                        <div className="w-3 h-1.5 rounded-sm bg-white/60" />
                      </div>
                    </div>
                    {/* App header */}
                    <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#0a6352' }}>
                      <div className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: PRIMARY }}>M</div>
                      <span className="text-white text-xs font-semibold">Portal Familiar</span>
                    </div>
                    {/* Content */}
                    <div className="p-3 space-y-2">
                      <div className="rounded-xl p-3" style={{ backgroundColor: LIGHT }}>
                        <p className="text-[10px] font-bold" style={{ color: DARK }}>Gloria E. Rodríguez</p>
                        <p className="text-[9px] text-gray-500">Hab. 101 · Hoy</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-[9px] text-green-700 font-medium">Tranquila y activa</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg p-2 text-center" style={{ backgroundColor: LIGHT }}>
                          <p className="text-xs font-bold" style={{ color: PRIMARY }}>85%</p>
                          <p className="text-[9px] text-gray-500">Almuerzo</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ backgroundColor: LIGHT }}>
                          <p className="text-xs font-bold" style={{ color: PRIMARY }}>3/3</p>
                          <p className="text-[9px] text-gray-500">Medicamentos</p>
                        </div>
                      </div>
                      {/* Mini chart */}
                      <div className="rounded-lg p-2" style={{ backgroundColor: '#f8fdf9' }}>
                        <p className="text-[9px] text-gray-400 mb-1">Tensión arterial (7 días)</p>
                        <div className="flex items-end gap-0.5 h-8">
                          {[55, 70, 62, 75, 60, 68, 72].map((h, i) => (
                            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === 6 ? PRIMARY : ACCENT, opacity: 0.7 }} />
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg p-2 flex items-center gap-2" style={{ backgroundColor: LIGHT }}>
                        <span className="text-base">📸</span>
                        <div>
                          <p className="text-[9px] font-semibold" style={{ color: DARK }}>Nueva foto</p>
                          <p className="text-[9px] text-gray-400">Taller de tejido · 3:20 pm</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification */}
                <div className="absolute -right-8 top-16 bg-white rounded-2xl shadow-xl p-3 w-44 border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: LIGHT }}>🔔</span>
                    <span className="text-[10px] font-bold" style={{ color: DARK }}>Actualización</span>
                  </div>
                  <p className="text-[9px] text-gray-500">Gloria tomó sus medicamentos de la mañana ✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Portal familiar ────────────────────────────────────────────────── */}
      <section id="familias" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block"
            style={{ backgroundColor: LIGHT, color: PRIMARY }}>
            Para las familias
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-4" style={{ color: DARK }}>
            Siempre conectados con su bienestar
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-16">
            Con el portal familiar de Mafe, la distancia no significa desconexión. Accede desde cualquier dispositivo a toda la información de tu ser querido.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📰', titulo: 'Registros Diarios', desc: 'Estado emocional, alimentación y actividades de cada turno.' },
              { icon: '🖼️', titulo: 'Galería de Fotos', desc: 'Imágenes de actividades, visitas y momentos especiales.' },
              { icon: '💬', titulo: 'Mensajería Directa', desc: 'Comunícate en tiempo real con el equipo de cuidado.' },
              { icon: '📅', titulo: 'Agenda de Visitas', desc: 'Programa y gestiona tus visitas de manera sencilla.' },
            ].map(item => (
              <div key={item.titulo} className="p-6 rounded-2xl text-left" style={{ backgroundColor: LIGHT }}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-base mb-2" style={{ color: DARK }}>{item.titulo}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link
              href="/portal/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: PRIMARY }}
            >
              Acceder al portal familiar
              <span>→</span>
            </Link>
            <p className="text-xs text-gray-400 mt-3">Acceso exclusivo para familiares registrados</p>
          </div>
        </div>
      </section>

      {/* ── Testimonios ────────────────────────────────────────────────────── */}
      <section id="testimonios" className="py-24" style={{ background: `linear-gradient(180deg, ${LIGHT} 0%, white 100%)` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block"
              style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>
              Testimonios
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3" style={{ color: DARK }}>
              Lo que dicen las familias Mafe
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIOS.map(t => (
              <div key={t.nombre} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 flex flex-col gap-5">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: '#f59e0b' }}>★</span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">"{t.texto}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {t.iniciales}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: DARK }}>{t.nombre}</p>
                    <p className="text-xs text-gray-400">{t.ciudad}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / Contacto ─────────────────────────────────────────────────── */}
      <section
        id="contacto"
        className="py-24"
        style={{ background: `linear-gradient(135deg, ${DARK} 0%, #0d6b56 100%)` }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Dale a tu familia la tranquilidad que merece
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Agenda una visita gratuita y conoce nuestras instalaciones, conoce al equipo y resuelve todas tus dudas sin compromiso.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-left">
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-white/70 text-sm mb-1">Nombre completo</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 text-sm"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+57 300 000 0000"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 text-sm"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Correo electrónico</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 text-sm"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">¿Cuándo desea visitarnos?</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-white/60 text-sm"
                />
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-white/70 text-sm mb-1">Cuéntenos sobre su familiar</label>
              <textarea
                rows={3}
                placeholder="Edad, condición médica, necesidades especiales..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 text-sm resize-none"
              />
            </div>
            <button
              className="w-full py-4 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 hover:shadow-xl"
              style={{ backgroundColor: PRIMARY }}
            >
              Solicitar visita gratuita
            </button>
            <p className="text-white/40 text-xs text-center mt-3">
              Nos comunicaremos con usted en menos de 24 horas
            </p>
          </div>

          {/* Contact info */}
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-white/60 text-sm">
            <a href="tel:+573208980281" className="flex items-center gap-2 hover:text-white transition-colors">
              <span>📞</span> 320 898 0281
            </a>
            <a href="https://wa.me/message/76I5LRNN6XOML1" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors">
              <span>💬</span> WhatsApp
            </a>
            <a href="mailto:info@mafe.com.co" className="flex items-center gap-2 hover:text-white transition-colors">
              <span>✉️</span> info@mafe.com.co
            </a>
            <span className="flex items-center gap-2">
              <span>📍</span> Cl 127 B Bis 46 64, Bogotá
            </span>
          </div>
        </div>
      </section>

      {/* ── Sobre Nosotros strip ───────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block"
            style={{ backgroundColor: LIGHT, color: PRIMARY }}>
            Sobre nosotros
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-3 mb-6" style={{ color: DARK }}>
            El amor como la mayor medicina
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
            En Mafe confiamos en el amor como la mayor medicina. Con nuestro equipo desarrollamos un plan
            terapéutico individualizado y personalizado, de tal forma que se garantice una vida digna,
            con calidad y mucho amor.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {[
              { icon: '🧠', label: 'Especialistas cognitivos' },
              { icon: '💊', label: 'Gestión médica integral' },
              { icon: '❤️', label: 'Cuidado con amor' },
              { icon: '👨‍👩‍👧', label: 'Apoyo a familias' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm font-medium" style={{ color: DARK }}>
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp flotante ──────────────────────────────────────────────── */}
      <a
        href="https://wa.me/message/76I5LRNN6XOML1"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl text-white font-semibold text-sm transition-all hover:scale-105 hover:shadow-green-400/40"
        style={{ backgroundColor: '#25D366' }}
      >
        {/* WhatsApp icon */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>¿Hablamos?</span>
      </a>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#032b22' }} className="text-white/60 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: PRIMARY }}>M</div>
                <span className="text-white font-bold">Casa Geriátrica Mafe</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Cuidamos con amor, recordando desde el corazón. Más de 20 años brindando cuidado geriátrico
                integral con dignidad y calidad de vida.
              </p>
              {/* Redes sociales */}
              <div className="flex gap-2">
                <a href="#" target="_blank" rel="noopener noreferrer" title="Facebook"
                  className="w-9 h-9 rounded-lg border border-white/20 flex items-center justify-center text-sm hover:bg-white/10 hover:border-white/40 transition-colors font-bold">
                  f
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" title="Instagram"
                  className="w-9 h-9 rounded-lg border border-white/20 flex items-center justify-center text-sm hover:bg-white/10 hover:border-white/40 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" title="TikTok"
                  className="w-9 h-9 rounded-lg border border-white/20 flex items-center justify-center text-sm hover:bg-white/10 hover:border-white/40 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z"/></svg>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" title="Twitter / X"
                  className="w-9 h-9 rounded-lg border border-white/20 flex items-center justify-center text-sm hover:bg-white/10 hover:border-white/40 transition-colors font-bold">
                  𝕏
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Acceso para personal</Link></li>
                <li><Link href="/portal/login" className="hover:text-white transition-colors">Portal familiar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Servicios</h4>
              <ul className="space-y-2 text-sm">
                {['Tratamientos cognitivos', 'Centro día', 'Larga estancia', 'Monitoreo 24/7'].map(s => (
                  <li key={s}><span className="hover:text-white transition-colors cursor-default">{s}</span></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>📍 Bogotá, Colombia</li>
                <li>
                  <a href="tel:+573208980281" className="hover:text-white transition-colors">
                    📞 320 898 0281
                  </a>
                </li>
                <li>
                  <a href="mailto:info@mafe.com.co" className="hover:text-white transition-colors">
                    ✉️ info@mafe.com.co
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/message/76I5LRNN6XOML1" target="_blank" rel="noopener noreferrer"
                    className="hover:text-white transition-colors">
                    💬 WhatsApp directo
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <p>© {new Date().getFullYear()} Casa Geriátrica Mafe. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Política de privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos de uso</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
