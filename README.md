# 🖐️ Manitas 3D – Barakaldesa

App web para generar modelos 3D desde texto o foto, usando Hunyuan3D en Hugging Face (gratis).

---

## 🚀 Cómo arrancar en local

### 1. Copia el logo
Pon el archivo `mama.jpg` (el logo) dentro de:
```
frontend/src/logo.jpg
```

### 2. Configura el backend
```bash
cd backend
cp .env.example .env
```
Edita `.env` y pon tu token de Hugging Face:
```
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxx
PORT=3001
```

### 3. Instala y arranca el backend
```bash
cd backend
npm install
npm run dev
```
Debería decir: `🖐️ Manitas 3D Backend arrancado en http://localhost:3001`

### 4. Instala y arranca el frontend (en otra terminal)
```bash
cd frontend
npm install
npm start
```
Se abre en: `http://localhost:3000`

---

## 🌐 Deploy en producción (gratis)

### Frontend → Vercel
1. Sube la carpeta `frontend` a GitHub
2. Conéctala en vercel.com
3. Añade variable de entorno: `REACT_APP_API_URL=https://tu-backend.railway.app`

### Backend → Railway
1. Sube la carpeta `backend` a GitHub
2. Conéctala en railway.app
3. Añade variable de entorno: `HF_TOKEN=hf_xxx`

---

## 📁 Estructura
```
manitas3d/
├── backend/
│   ├── server.js       ← API Express
│   ├── package.json
│   ├── .env.example
│   └── models/         ← modelos generados (se crea solo)
└── frontend/
    ├── src/
    │   ├── App.jsx     ← UI principal
    │   ├── App.css
    │   ├── services/api.js
    │   └── logo.jpg    ← pon aquí el logo de tu madre
    └── package.json
```

---

## ⚠️ Notas importantes
- La generación puede tardar **1-3 minutos** por la cola de Hugging Face
- Hugging Face Spaces tiene cola compartida — a veces hay espera
- Los modelos se guardan temporalmente en `backend/models/`
- El historial se pierde al recargar (es de sesión)
# manitas3D
