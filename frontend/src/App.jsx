import { useState, useRef } from 'react'
import { generarDesdeTexto, generarDesdeFoto, generarColoreable, getDownloadUrl } from './services/api'
import logo from './logo.jpg'
import './App.css'

const EMOJIS = {
  'dragón': '🐉', 'dragon': '🐉', 'jarrón': '🏺', 'jarron': '🏺',
  'casa': '🏠', 'mariposa': '🦋', 'pulpo': '🐙', 'engranaje': '⚙️',
  'flor': '🌸', 'flores': '🌸', 'gato': '🐱', 'perro': '🐶',
  'robot': '🤖', 'corazón': '❤️', 'barco': '⛵', 'árbol': '🌲',
}

function getEmoji(texto) {
  const lower = (texto || '').toLowerCase()
  for (const [k, v] of Object.entries(EMOJIS)) {
    if (lower.includes(k)) return v
  }
  return '🎲'
}

const PASOS = [
  '📤 Enviando a Hugging Face…',
  '🧠 Analizando…',
  '🔨 Generando geometría 3D…',
  '✨ Aplicando texturas…',
  '📦 Preparando archivos…',
  '⏳ Casi listo…'
]

const PASOS_COLOR = [
  '📤 Subiendo imagen…',
  '🧠 Claude analizando la imagen…',
  '✏️ Generando silueta…',
  '🎨 Creando dibujo para colorear…',
  '⏳ Casi listo…'
]

export default function App() {
  const [tab, setTab] = useState('texto')
  // 3D estado
  const [prompt, setPrompt] = useState('')
  const [estilo, setEstilo] = useState('cartoon')
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [loading3d, setLoading3d] = useState(false)
  const [step3d, setStep3d] = useState('')
  const [resultado3d, setResultado3d] = useState(null)
  const [error3d, setError3d] = useState(null)
  // Coloreable estado
  const [colorFile, setColorFile] = useState(null)
  const [colorPreview, setColorPreview] = useState(null)
  const [colorInstruccion, setColorInstruccion] = useState('Hazme la silueta de esta imagen en blanco y negro con todo lo de la imagen')
  const [loadingColor, setLoadingColor] = useState(false)
  const [stepColor, setStepColor] = useState('')
  const [resultadoColor, setResultadoColor] = useState(null)
  const [errorColor, setErrorColor] = useState(null)
  // Historial
  const [historial, setHistorial] = useState([])
  const [toast, setToast] = useState(null)

  const fileRef3d = useRef()
  const fileRefColor = useRef()
  const stepRef = useRef()

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function startSteps(setStep, pasos) {
    let i = 0
    setStep(pasos[0])
    stepRef.current = setInterval(() => {
      i = (i + 1) % pasos.length
      setStep(pasos[i])
    }, 5000)
  }

  function stopSteps(setStep) {
    clearInterval(stepRef.current)
    setStep('')
  }

  // ── GENERAR TEXTO → 3D ──
  async function handleTexto() {
    if (!prompt.trim()) return showToast('Escribe una descripción ✏️', 'warn')
    setLoading3d(true); setError3d(null); setResultado3d(null)
    startSteps(setStep3d, PASOS)
    try {
      const data = await generarDesdeTexto(prompt, estilo)
      const item = { ...data, nombre: prompt, emoji: getEmoji(prompt), tipo: 'texto', hora: hora() }
      setResultado3d(item)
      setHistorial(h => [item, ...h])
      showToast('¡Modelo generado! 🎉')
    } catch (err) {
      setError3d(err.response?.data?.error || err.message)
      showToast('Error al generar 😕', 'error')
    } finally { setLoading3d(false); stopSteps(setStep3d) }
  }

  // ── GENERAR FOTO → 3D ──
  async function handleFoto() {
    if (!fotoFile) return showToast('Sube una foto 📷', 'warn')
    setLoading3d(true); setError3d(null); setResultado3d(null)
    startSteps(setStep3d, PASOS)
    try {
      const data = await generarDesdeFoto(fotoFile)
      const item = { ...data, nombre: fotoFile.name.replace(/\.[^.]+$/, ''), emoji: '📷', tipo: 'foto', hora: hora() }
      setResultado3d(item)
      setHistorial(h => [item, ...h])
      showToast('¡Foto convertida a 3D! 🎉')
    } catch (err) {
      setError3d(err.response?.data?.error || err.message)
      showToast('Error al generar 😕', 'error')
    } finally { setLoading3d(false); stopSteps(setStep3d) }
  }

  // ── GENERAR COLOREABLE ──
  async function handleColoreable() {
    if (!colorFile) return showToast('Sube una foto del molde 📷', 'warn')
    setLoadingColor(true); setErrorColor(null); setResultadoColor(null)
    startSteps(setStepColor, PASOS_COLOR)
    try {
      const data = await generarColoreable(colorFile, colorInstruccion)
      setResultadoColor(data)
      showToast('¡Dibujo coloreable listo! 🎨')
    } catch (err) {
      setErrorColor(err.response?.data?.error || err.message)
      showToast('Error al generar 😕', 'error')
    } finally { setLoadingColor(false); stopSteps(setStepColor) }
  }

  function descargar3d(item, formato) {
    const url = getDownloadUrl(item.filename, formato)
    const a = document.createElement('a')
    a.href = url
    a.download = `manitas3d-${item.nombre.slice(0, 20).replace(/\s+/g, '-')}.${formato}`
    a.click()
    showToast(`Descargando .${formato.toUpperCase()} ⬇️`)
  }

  function descargarColoreable() {
    if (!resultadoColor?.imagen) return
    const a = document.createElement('a')
    a.href = resultadoColor.imagen
    a.download = `coloreable_${Date.now()}.png`
    a.click()
    showToast('Descargando dibujo ⬇️')
  }

  function onFotoChange(ref, setFile, setPreview) {
    return e => {
      const file = e.target.files[0]
      if (!file) return
      setFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const tabs = [
    { id: 'texto', label: '✏️ Escribir', color: 'teal' },
    { id: 'foto', label: '📷 Foto a 3D', color: 'pink' },
    { id: 'coloreable', label: '🎨 Coloreable', color: 'orange' },
    { id: 'historial', label: '🗂️ Historial', color: 'purple' },
  ]

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-brand">
          <img src={logo} alt="Manitas 3D" className="header-logo" />
          <div>
            <div className="header-title">Manitas <span>3D</span></div>
            <div className="header-sub">Barakaldesa · IA para imprimir</div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <img src={logo} alt="Barakaldesa Manitas 3D" className="hero-logo" />
        <div className="hero-badge">✨ Powered by Hunyuan3D + Claude · Gratis</div>
        <h1>Describe lo que quieres<br /><span className="pink">y lo imprimimos</span> en <span className="teal">3D</span></h1>
        <p>Genera modelos 3D desde texto o foto, y convierte moldes en dibujos para colorear.</p>
      </section>

      <main className="main">
        {/* TABS */}
        <div className="tabs">
          {tabs.map(t => (
            <button key={t.id}
              className={`tab-btn ${tab === t.id ? `tab-active-${t.color}` : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TEXTO → 3D ── */}
        {tab === 'texto' && (
          <div className="card card-teal animate-up">
            <div className="card-title teal">✏️ Describe tu modelo</div>
            <div className="card-desc">Cuanto más detallas, mejor resultado.</div>
            <textarea className="textarea" rows={4}
              placeholder="Ej: Un pequeño dragón sentado con alas plegadas, estilo cartoon…"
              value={prompt} onChange={e => setPrompt(e.target.value)} disabled={loading3d} />
            <div className="chips-label">💡 Ideas rápidas</div>
            <div className="chips">
              {['🌸 Jarrón con flores','🐉 Dragón pequeño','🏠 Casa miniatura','🦋 Mariposa','🐙 Pulpo llavero','⚙️ Engranaje'].map(c => (
                <span key={c} className="chip chip-teal" onClick={() => setPrompt(c.replace(/^[^\s]+\s/, ''))}>{c}</span>
              ))}
            </div>
            <div className="opciones-row">
              <div className="opcion-group">
                <label>🎨 Estilo</label>
                <select value={estilo} onChange={e => setEstilo(e.target.value)} disabled={loading3d}>
                  <option value="realistic">Realista</option>
                  <option value="cartoon">Cartoon</option>
                  <option value="low-poly">Low Poly</option>
                  <option value="sculpture">Escultura</option>
                </select>
              </div>
            </div>
            <button className="btn btn-teal" onClick={handleTexto} disabled={loading3d}>
              {loading3d ? '⏳ Generando…' : '🚀 Generar modelo 3D'}
            </button>
            {loading3d && <LoadingState step={step3d} color="teal" />}
            {error3d && <ErrorState msg={error3d} />}
            {resultado3d && !loading3d && <ResultadoPanel item={resultado3d} onDescargar={descargar3d} />}
          </div>
        )}

        {/* ── FOTO → 3D ── */}
        {tab === 'foto' && (
          <div className="card card-pink animate-up">
            <div className="card-title pink">📷 Foto a modelo 3D</div>
            <div className="card-desc">Sube una foto clara y la IA reconstruirá el objeto en 3D.</div>
            <UploadArea
              preview={fotoPreview}
              onFile={onFotoChange(fileRef3d, setFotoFile, setFotoPreview)}
              onDrop={e => { const f = e.dataTransfer.files[0]; if (f) { setFotoFile(f); setFotoPreview(URL.createObjectURL(f)) }}}
              fileRef={fileRef3d}
              color="pink"
            />
            <button className="btn btn-pink" style={{marginTop:'1.2rem'}}
              onClick={handleFoto} disabled={loading3d || !fotoFile}>
              {loading3d ? '⏳ Procesando…' : '🔮 Convertir foto a 3D'}
            </button>
            {loading3d && <LoadingState step={step3d} color="pink" />}
            {error3d && <ErrorState msg={error3d} />}
            {resultado3d && !loading3d && <ResultadoPanel item={resultado3d} onDescargar={descargar3d} />}
          </div>
        )}

        {/* ── COLOREABLE ── */}
        {tab === 'coloreable' && (
          <div className="card card-orange animate-up">
            <div className="card-title orange">🎨 Dibujo para colorear</div>
            <div className="card-desc">Sube una foto de tu molde y la IA genera la silueta lista para imprimir y colorear.</div>

            <UploadArea
              preview={colorPreview}
              onFile={onFotoChange(fileRefColor, setColorFile, setColorPreview)}
              onDrop={e => { const f = e.dataTransfer.files[0]; if (f) { setColorFile(f); setColorPreview(URL.createObjectURL(f)) }}}
              fileRef={fileRefColor}
              color="orange"
            />

            <div style={{marginTop:'1.2rem'}}>
              <div className="chips-label">✏️ Instrucción para la IA</div>
              <textarea className="textarea textarea-orange" rows={3}
                value={colorInstruccion}
                onChange={e => setColorInstruccion(e.target.value)}
                disabled={loadingColor}
                placeholder="Describe cómo quieres la silueta…"
              />
              <div className="chips" style={{marginTop:'0.5rem'}}>
                <span className="chip chip-orange" onClick={() => setColorInstruccion('Hazme la silueta de esta imagen en blanco y negro con todo lo de la imagen')}>
                  Silueta completa
                </span>
                <span className="chip chip-orange" onClick={() => setColorInstruccion('Hazme un dibujo para colorear de esta figura, con líneas gruesas y bien definidas')}>
                  Dibujo colorear
                </span>
                <span className="chip chip-orange" onClick={() => setColorInstruccion('Contorno simple de esta figura para imprimir y recortar')}>
                  Contorno recortable
                </span>
              </div>
            </div>

            <button className="btn btn-orange" onClick={handleColoreable} disabled={loadingColor || !colorFile}>
              {loadingColor ? '⏳ Generando dibujo…' : '🎨 Generar dibujo coloreable'}
            </button>

            {loadingColor && <LoadingState step={stepColor} color="orange" />}
            {errorColor && <ErrorState msg={errorColor} />}

            {resultadoColor && !loadingColor && (
              <div className="resultado animate-up">
                <div className="resultado-header">
                  <div className="check-badge">✓</div>
                  <h3>¡Dibujo listo para colorear!</h3>
                </div>
                <div className="coloreable-preview">
                  <img src={resultadoColor.imagen} alt="Dibujo coloreable" className="coloreable-img" />
                </div>
                <button className="btn btn-orange" onClick={descargarColoreable}>
                  ⬇️ Descargar PNG
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {tab === 'historial' && (
          <div className="card card-purple animate-up">
            <div className="card-title purple">🗂️ Modelos generados</div>
            <div className="card-desc">Todos los modelos 3D de esta sesión.</div>
            {historial.length === 0 ? (
              <div className="historial-vacio">
                <span>🗃️</span>
                <p>Todavía no hay modelos</p>
                <small>¡Genera el primero desde las otras pestañas!</small>
              </div>
            ) : (
              <div className="historial-grid">
                {historial.map((item, i) => (
                  <div key={i} className="hist-item">
                    <div className="hist-thumb">{item.emoji}</div>
                    <div className="hist-info">
                      <p title={item.nombre}>{item.nombre}</p>
                      <small>{item.tipo === 'texto' ? '✏️' : '📷'} · {item.hora}</small>
                    </div>
                    <div className="hist-btns">
                      <button className="hist-btn stl" onClick={() => descargar3d(item, 'stl')}>STL</button>
                      <button className="hist-btn tmf" onClick={() => descargar3d(item, '3mf')}>3MF</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Hecho con <span className="pink">♥</span> para Barakaldesa Manitas 3D</p>
      </footer>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

// ── SUBCOMPONENTES ───────────────────────────────────────────

function UploadArea({ preview, onFile, onDrop, fileRef, color }) {
  return (
    <div className={`upload-area upload-${color}`}
      onDragOver={e => e.preventDefault()} onDrop={onDrop}
      onClick={() => !preview && fileRef.current.click()}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFile} />
      {preview ? (
        <div className="preview-content">
          <img src={preview} alt="Vista previa" className="preview-img" />
          <button className={`btn-cambiar btn-cambiar-${color}`}
            onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
            🔄 Cambiar foto
          </button>
        </div>
      ) : (
        <div className="upload-placeholder">
          <div className="upload-icon">📸</div>
          <p>Haz clic o arrastra aquí tu foto</p>
          <small>JPG, PNG o WEBP · Máximo 15MB</small>
        </div>
      )}
    </div>
  )
}

function LoadingState({ step, color }) {
  return (
    <div className="loading-state animate-up">
      <div className={`loader-ring ${color}`} />
      <p>Generando…</p>
      <div className={`loading-step ${color}`}>{step}</div>
      <small style={{color:'var(--text-light)',marginTop:'0.5rem',display:'block'}}>
        Puede tardar 1-3 minutos
      </small>
    </div>
  )
}

function ErrorState({ msg }) {
  return (
    <div className="error-state animate-up">
      <span>⚠️</span>
      <p>{msg}</p>
    </div>
  )
}

function ResultadoPanel({ item, onDescargar }) {
  return (
    <div className="resultado animate-up">
      <div className="resultado-header">
        <div className="check-badge">✓</div>
        <h3>¡Modelo listo para imprimir!</h3>
      </div>
      <div className="visor-3d">
        <div className="visor-dot" />
        <div className="visor-emoji">{item.emoji}</div>
        <div className="visor-label">{item.nombre}</div>
      </div>
      <div className="descargas">
        <button className="btn-descarga stl" onClick={() => onDescargar(item, 'stl')}>⬇️ STL</button>
        <button className="btn-descarga tmf" onClick={() => onDescargar(item, '3mf')}>⬇️ 3MF</button>
      </div>
    </div>
  )
}

function hora() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
