import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 300000 // 5 minutos (la generación puede tardar)
})

export async function generarDesdeTexto(prompt, estilo) {
  const { data } = await API.post('/api/texto-a-3d', { prompt, estilo })
  return data
}

export async function generarDesdeFoto(file) {
  const formData = new FormData()
  formData.append('imagen', file)
  const { data } = await API.post('/api/foto-a-3d', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function generarColoreable(file, instruccion) {
  const formData = new FormData()
  formData.append('imagen', file)
  if (instruccion) formData.append('instruccion', instruccion)
  const { data } = await API.post('/api/coloreable', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}
export function getDownloadUrl(filename, formato) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  return `${base}/api/descargar/${filename}/${formato}`
}

export function getModelUrl(modelUrl) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  return `${base}${modelUrl}`
}

export async function checkStatus() {
  const { data } = await API.get('/api/status')
  return data
}
