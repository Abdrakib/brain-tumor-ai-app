# Brain MRI AI — Tumor Classification with Grad-CAM

[![Live Demo](https://img.shields.io/badge/Live_Demo-View_App-success?style=for-the-badge)](#)

Production-ready AI application for brain tumor classification from MRI images, featuring explainable Grad-CAM visualization, confidence scoring, and uncertain prediction handling.

---

## Live Deployment

After deploying (see [DEPLOYMENT.md](DEPLOYMENT.md)), update the URLs below:

| Component | URL |
|-----------|-----|
| **Frontend** (Vercel) | `YOUR_VERCEL_FRONTEND_URL` |
| **Backend API** (Render) | `YOUR_RENDER_API_URL` |

---

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Frontend (Vercel)  │────▶│  Backend (Render)   │────▶│  TensorFlow Model   │
│  React + Vite       │     │  FastAPI            │     │  EfficientNet +     │
│  Tailwind CSS       │     │  /predict endpoint  │     │  Grad-CAM           │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** FastAPI with async image handling
- **Model:** EfficientNetB0-based binary classifier (Tumor / No Tumor)

---

## Features

- **Brain tumor classification** — Binary prediction (Tumor Detected / No Tumor Detected)
- **Grad-CAM explainability** — Heatmap overlay showing model attention regions
- **Confidence scoring** — Per-class probabilities with 2-decimal display
- **Uncertain prediction handling** — When confidence < 60%, returns "Uncertain" with clinical review message
- **Image validation** — JPEG/PNG only, min 128×128, rejects corrupted files
- **PDF export** — Download report with thumbnails and summary
- **Live deployment** — Full-stack app deployable on Vercel + Render
- **Request tracking** — Unique `request_id` per prediction for traceability

---

## Demo Instructions

1. Open the Live Demo URL (after deployment)
2. Upload a brain MRI image (JPEG or PNG, min 128×128 pixels)
3. Click **Analyze** and view prediction, confidence, and Grad-CAM overlay
4. Use Demo buttons (if images are in `/public/demo/`) for quick testing
5. Export results as PDF or copy JSON summary

---

## API Endpoint

### `POST /predict`

Upload an image as `multipart/form-data` with key `file`.

**Request:** `Content-Type: multipart/form-data`, body: `file` (JPEG/PNG image)

**Response (200):**
```json
{
  "ok": true,
  "prediction": "Tumor Detected",
  "pred_label": "yes",
  "confidence": 0.93,
  "probs": {"no": 0.07, "yes": 0.93},
  "uncertain": false,
  "message": "",
  "request_id": "abc12345",
  "gradcam_overlay_b64": "<base64 PNG>"
}
```

**Validation:** JPEG/PNG only, min 128×128, RGB/L/RGBA channels.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Uvicorn, Python 3.11 |
| ML | TensorFlow/Keras, EfficientNetB0, Grad-CAM |
| Deployment | Vercel (frontend), Render (backend) |
| Validation | Pillow (PIL) |

---

## Project Structure

```
├── app/                    # FastAPI backend
│   ├── main.py             # App entry, lifespan, routes
│   ├── config.py           # Paths, model config
│   ├── api/routes/         # /predict, /predict_overlay
│   └── core/               # model_loader, predictor, gradcam, image_validation
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── App.tsx         # Main UI
│   │   ├── components/     # CompareSlider, ConfidenceChart, ExportSection, etc.
│   │   └── utils/
│   └── public/demo/        # Demo images (add demo1.jpg, demo2.jpg)
├── models/v1/              # Model artifacts
│   ├── adv_final_tfhub.keras
│   └── label_to_idx.json
├── gradcam.py              # Standalone Grad-CAM module
├── requirements.txt
├── render.yaml             # Render deployment config
├── runtime.txt             # Python 3.11
└── DEPLOYMENT.md           # Render + Vercel setup guide
```

---

## Model Information

- **Architecture:** Custom head on EfficientNetB0 (TensorFlow Hub)
- **Task:** Binary classification (Tumor / No Tumor)
- **Input:** 224×224 RGB images (resized from upload)
- **Output:** Class probabilities, Grad-CAM overlay
- **Training:** Pre-trained (no retraining in this repo)

---

## Limitations

- Binary classification only (no multi-class tumor types)
- Requires JPEG/PNG, min 128×128 pixels
- Not a substitute for clinical diagnosis; AI-assisted only
- Backend cold start on Render free tier (~30–60s first request)

---

## Local Development

**Backend:**
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` in frontend `.env` for local backend.

---

## License

MIT — See [LICENSE](LICENSE) for details.

---

## Author

**Abdrakib** — [GitHub](https://github.com/Abdrakib)
