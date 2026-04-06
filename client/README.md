# Scrim App Frontend

A mobile-first React application for competitive gaming scrims with anti-cheat features.

## Deployment on Render

This app is configured to deploy on Render.com as a web service.

### Local Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Deployment

1. Connect your GitHub repository to Render
2. Create a new **Web Service**
3. Set the **Build Command** to: `npm run build`
4. Set the **Start Command** to: `npm start`
5. The app will be available at the provided Render URL

### Environment Variables

No environment variables are required for the frontend. All API calls are configured to work with the backend service.

## Features

- Mobile-first responsive design
- Trust score system
- Anti-cheat measures
- Real-time match finding
- Screenshot validation
- Dark gaming theme
