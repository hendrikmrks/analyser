# Analyser

Eine Web-App, mit der du dein Spotify-Profil analysieren kannst. Nach dem Login über den offiziellen Spotify OAuth-Flow erhältst du eine detaillierte Profilseite mit Top-Künstlern, Genres und mehr.

## Features

- **Spotify OAuth Login** — sichere Anmeldung über dein Spotify-Konto
- **Profil-Übersicht** — Avatar, Follower, Land, Premium-Status
- **Top Künstler** — filterbar nach 4 Wochen, 6 Monate oder Gesamt
- **Top Tracks** — deine meistgehörten Songs
- **Genre-Analyse** — visuelle Aufschlüsselung deiner Lieblingsgenres
- **Audio-Profil** — Tanzbarkeit, Energie, Positivität und mehr
- **Musik-Persönlichkeit** — automatisch erkanntes Hörprofil
- **Diversitäts-Score** — wie abwechslungsreich dein Geschmack ist

## Voraussetzungen

- [Node.js](https://nodejs.org/) 18+
- Ein [Spotify Developer Account](https://developer.spotify.com/dashboard)

## Spotify App einrichten

1. Gehe zu [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Erstelle eine neue App („Create App")
3. Notiere **Client ID** und **Client Secret**
4. Unter **Settings** → **Redirect URIs** füge hinzu:
   ```
   http://127.0.0.1:5173/api/auth/callback
   ```
5. Speichere die Einstellungen

> **Wichtig:** Spotify erlaubt `localhost` nicht mehr. Verwende `127.0.0.1` mit `http://` für lokale Entwicklung. Öffne die App unter **http://127.0.0.1:5173** (nicht `localhost`).

## Installation

```bash
# Abhängigkeiten installieren
npm install
cd client && npm install && cd ..

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Dann .env mit deinen Spotify-Credentials befüllen
```

## Starten

```bash
npm run dev
```

- Frontend: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- Backend: [http://127.0.0.1:3001](http://127.0.0.1:3001)

Öffne die Frontend-URL im Browser und klicke auf **Mit Spotify anmelden**.

## Projektstruktur

```
analyser/
├── client/          # React Frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── Landing.jsx
│       │   └── Profile.jsx
│       ├── App.jsx
│       ├── api.js
│       └── index.css
├── server/          # Express Backend
│   ├── routes/
│   │   ├── auth.js  # OAuth Flow
│   │   └── api.js   # Profil-Analyse API
│   ├── spotify.js
│   └── index.js
├── .env.example
└── package.json
```

## Produktion

```bash
npm run build
NODE_ENV=production npm start
```

In Produktion wird das gebaute Frontend vom Express-Server ausgeliefert. Passe `CLIENT_URL` und `SPOTIFY_REDIRECT_URI` entsprechend an.

## Docker

Die App läuft als ein Container (Frontend + API). TLS für die Domain übernimmt Caddy.

### Voraussetzungen

- [Docker](https://docs.docker.com/get-docker/) mit Compose
- `.env` mit Spotify-Credentials (siehe `.env.docker.example`)
- Im [Spotify Dashboard](https://developer.spotify.com/dashboard) diese Redirect URIs eintragen:
  - `http://127.0.0.1:8080/api/auth/callback` (Container-Test lokal)
  - `https://analyser.hendrik.tech/api/auth/callback` (Produktion)

### Lokal testen (127.0.0.1)

```bash
npm run docker:local
```

App: [http://127.0.0.1:8080](http://127.0.0.1:8080)

### Produktion (analyser.hendrik.tech)

DNS muss auf den Server zeigen. Dann auf dem Server:

```bash
npm run docker:prod
```

Caddy holt automatisch ein Let's-Encrypt-Zertifikat und leitet HTTPS an den App-Container weiter.

Logs ansehen:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

Stoppen:

```bash
npm run docker:down
```

## Lizenz

MIT
