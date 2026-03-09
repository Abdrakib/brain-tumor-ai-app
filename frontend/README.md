# Brain MRI AI – Frontend

Modern premium SaaS-style React frontend for brain tumor classification.

## Requirements

- Node.js 18+

## Setup

```bash
cd frontend
cp .env.example .env   # optional: override VITE_API_URL for local backend
npm install
npm run dev
```

Runs at `http://localhost:5173` (Vite default). By default, API calls go to `http://localhost:8000`. For production, set `VITE_API_URL` to your Render API URL in Vercel environment variables.

## Build

```bash
npm run build
npm run preview
```

## Design Features

- Dark theme with animated gradient background
- Glassmorphism cards
- Gradient buttons and badge
- Inter font, smooth transitions
- Animated loading spinner
- Smooth confidence progress bar
- Fade-in results animation
- Responsive layout
 -Update deployement trigger
