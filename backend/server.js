import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const HF_TOKEN = process.env.HF_TOKEN;
const HF_SPACE_URL = 'https://tencent-hunyuan3d-2.hf.space';


app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Manitas 3D API funcionando' });
});

// TEXTO → 3D
app.post('/api/texto-a-3d', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Falta el texto descriptivo' });

  try {
    console.log(`[texto-a-3d] "${prompt}"`);
    const response = await fetch(`${HF_SPACE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HF_TOKEN && { 'Authorization': `Bearer ${HF_TOKEN}` })
      },
      body: JSON.stringify({ fn_index: 0, data: [prompt, null, true, 0.5, 0.5] })
    });

    if (!response.ok) throw new Error(`Error Space: ${response.status}`);
    const result = await response.json();
    const modelUrl = result?.data?.[0];
    if (!modelUrl) throw new Error('Modelo no generado');

    res.json({ success: true, modelUrl, formato: 'glb', prompt });
  } catch (err) {
    console.error('[texto-a-3d]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// FOTO → 3D
app.post('/api/foto-a-3d', upload.single('imagen'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Falta la imagen' });

  const instruccion = req.body.instruccion || '';

  try {
    console.log(`[foto-a-3d] ${req.file.originalname} | instruccion: "${instruccion}"`);
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = `data:${req.file.mimetype};base64,${imageData.toString('base64')}`;
    fs.unlinkSync(req.file.path);

    // Si hay instrucción de texto, la usamos junto a la imagen (fn_index 0)
    // Si no, solo imagen (fn_index 1)
    const body = instruccion
      ? { fn_index: 0, data: [instruccion, base64Image, true, 0.5, 0.5] }
      : { fn_index: 1, data: [base64Image, true, 0.5, 0.5] };

    const response = await fetch(`${HF_SPACE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HF_TOKEN && { 'Authorization': `Bearer ${HF_TOKEN}` })
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`Error Space: ${response.status}`);
    const result = await response.json();
    const modelUrl = result?.data?.[0];
    if (!modelUrl) throw new Error('Modelo no generado');

    res.json({ success: true, modelUrl, formato: 'glb' });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('[foto-a-3d]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ESTADO DEL SPACE
app.get('/api/estado', async (req, res) => {
  try {
    const r = await fetch(`${HF_SPACE_URL}/info`);
    res.json({ online: r.ok });
  } catch {
    res.json({ online: false });
  }
});

// ── FOTO → DIBUJO COLOREABLE ───────────────────────────────────
app.post('/api/coloreable', upload.single('imagen'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Falta la imagen' });

  const instruccion = req.body.instruccion ||
    'silueta en blanco y negro de la figura, dibujo para colorear, líneas limpias';

  try {
    console.log(`[coloreable] instruccion: "${instruccion.slice(0, 60)}…"`);

    // 1. Leer imagen y convertir a base64
    const imageData = fs.readFileSync(req.file.path);
    fs.unlinkSync(req.file.path);

    // 2. Generar dibujo coloreable con HuggingFace FLUX
    const promptEN = `coloring page, black outline only on white background, no color fill, clean thick lines, children coloring book style, ${instruccion}`;
    console.log(`[coloreable] Generando con FLUX: "${promptEN.slice(0, 80)}…"`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    const hfRes = await fetch(
      'https://router.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: promptEN }),
        signal: controller.signal
      }
    );
    clearTimeout(timer);

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      throw new Error(`HF FLUX error ${hfRes.status}: ${errText.slice(0, 200)}`);
    }

    const imgBuffer = Buffer.from(await hfRes.arrayBuffer());
    const resultBase64 = imgBuffer.toString('base64');

    res.json({
      success: true,
      imagen: `data:image/png;base64,${resultBase64}`,
      prompt: promptEN
    });

  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('[coloreable]', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🖐️  Manitas 3D API en http://localhost:${PORT}`);
  console.log(`   HF Token: ${HF_TOKEN ? '✅' : '⚠️  no configurado'}`);
  console.log(`   Pollinations: ✅ gratis, sin key\n`);
});
