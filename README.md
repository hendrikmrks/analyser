# Analyser

![License](https://img.shields.io/github/license/hendrikmrks/analyser)

Eine Web-App, mit der du dein Spotify-Hörverhalten analysieren kannst. Nach der Anmeldung über den offiziellen Spotify-OAuth-Flow erhältst du eine ausführliche, mehrsprachige Profilseite: Top-Künstler und -Tracks, eine Genre-Aufschlüsselung, eine "Music DNA" mit erkannter Hörpersönlichkeit, einen Diversitäts-Score und viele weitere aus deinen Spotify-Daten berechnete Kennzahlen. Zusätzlich kannst du dein Profil als Bild/Text teilen oder es per Code mit einem Freund/einer Freundin vergleichen.

## Features

- **Spotify OAuth Login** — sichere Anmeldung über dein Spotify-Konto (Authorization Code Flow, `state`-Prüfung gegen CSRF, Refresh-Token-Handling für abgelaufene Access-Tokens)
- **Profil-Übersicht** — Avatar, Follower, Land, Premium-Status
- **Top-Künstler & Top-Tracks** — filterbar nach 4 Wochen, 6 Monaten oder Gesamtzeitraum
- **Genre-Analyse** — visuelle Aufschlüsselung deiner Lieblingsgenres sowie gruppiert nach übergeordneten Genre-Familien (z. B. Rock & Metal, Hip-Hop & Rap, Electronic, ...)
- **Music DNA / Hörpersönlichkeit** — automatisch erkanntes Hörprofil (z. B. "Underground Explorer", "Chart Curator", "Nostalgia Archivist") auf Basis von Mainstream-Score, Diversität, Explicit-Anteil, Katalog-Alter, Anzahl Kollaborationen u. a.
- **Diversitäts-Score** — wie abwechslungsreich dein Geschmack ist, basierend auf der Anzahl einzigartiger Genres und Künstler
- **Taste Evolution & Artist Momentum** — vergleicht deinen kurzfristigen mit deinem langfristigen Geschmack (welche Genres/Künstler neu sind, welche "verblassen", wer gerade im Kommen ist)
- **Listening Deep Dive** — u. a. "Superfans" (meistgehörte Künstler), Album-Champions, Feature-Künstler, Track-Varianten (Remix/Live/Acoustic/Deluxe), Popularitäts- und Erscheinungsjahr-Verteilung, Hörrhythmus (Wochenende vs. Wochentag, Hör-"Binges") basierend auf deinem zuletzt gehörten Verlauf
- **Automatisch generierte Insights** — kurze, für dich generierte Text-Erkenntnisse zu deinem Hörverhalten
- **Profil teilen & vergleichen** — Share-Card als PNG-Download, Teilen als Text (Web Share API) sowie ein client-seitig kodierter "Share-Code"/Link, mit dem zwei Personen ihre Profile ohne eigenes Backend vergleichen können (Kompatibilitäts-Score, gemeinsame Genres/Künstler)
- **Mehrsprachig** — Deutsch, Englisch und brasilianisches Portugiesisch, umschaltbar in der App

> **Hinweis:** Eine frühere Version plante ein zusätzliches "Audio-Profil" (Tanzbarkeit, Energie, Positivität u. Ä.) auf Basis von Spotifys Audio-Features-Endpoint. Da Spotify diesen Endpoint für neue Apps nicht mehr freigibt, ist das aktuell **keine aktive Funktion** der App (es existieren nur noch ungenutzte Farb-/Label-Konstanten im Frontend-Code).

## Architektur

Analyser besteht aus zwei Teilen in einem Repository:

- **Client** (`client/`) — React-19-Single-Page-App, gebaut mit Vite. Enthält die komplette UI inklusive i18n (Deutsch/Englisch/Portugiesisch), Diagramme/Visualisierungen (reines SVG/CSS, keine Chart-Bibliothek) sowie die Share-/Vergleichs-Logik.
- **Server** (`server/`) — Express-Backend, das drei Aufgaben übernimmt:
  1. **OAuth-Flow** (`server/routes/auth.js`, `server/spotify.js`): `/api/auth/login` leitet zu Spotify weiter (inkl. zufälligem `state`-Parameter, der serverseitig in der Session gespeichert wird), `/api/auth/callback` tauscht den Autorisierungscode gegen Access-/Refresh-Token und legt beides in einer serverseitigen Session (`express-session`, HttpOnly-Cookie) ab. `/api/auth/status` prüft den Login-Status, `/api/auth/logout` zerstört die Session.
  2. **Spotify-API-Proxy** (`server/routes/api.js`): `/api/profile` lädt (mit automatischer Token-Erneuerung) Profil, Top-Künstler/-Tracks (alle drei Zeiträume) und die zuletzt gespielten Titel von der Spotify Web API und reicht sie gebündelt ans Frontend weiter.
  3. **Analyse-Engine** (`server/listeningAnalysis.js`): reine Funktionen ohne externe Abhängigkeiten, die aus den rohen Spotify-Daten alle oben genannten Kennzahlen, Insights und die Music DNA berechnen.

  Im Produktionsmodus (`NODE_ENV=production`) liefert derselbe Express-Server zusätzlich das gebaute Frontend (`client/dist`) aus — es läuft also nur ein einziger Prozess/Container.

- **Sessions**: Login-Zustand und Tokens werden ausschließlich serverseitig in der Express-Session gehalten (Cookie ist `httpOnly`, `sameSite: lax`, und bei HTTPS-Origins `secure`). Es werden keine Tokens im Browser-Storage abgelegt.

## Tech-Stack

| Bereich | Technologie |
| --- | --- |
| Frontend | React 19, Vite 6, eigenes i18n (ohne Bibliothek), reines CSS |
| Backend | Node.js, Express 4, `express-session`, `cors`, `dotenv` |
| Build/Dev-Tooling | `concurrently` (paralleles Starten von Client & Server), eigene Node-Skripte in `scripts/` |
| Deployment | Docker (Multi-Stage-Build), Docker Compose, Caddy 2 (automatisches TLS via Let's Encrypt) |
| Externe API | [Spotify Web API](https://developer.spotify.com/documentation/web-api) (OAuth 2.0 Authorization Code Flow) |

Es gibt aktuell keine automatisierten UI-/Integrationstests (kein Jest/Vitest) und keine ESLint-/Prettier-Konfiguration im Repository. `npm run check` führt lediglich ein einfaches Node-Skript mit `assert`-Prüfungen gegen die Analyse-Engine aus (siehe unten).

## Voraussetzungen

- [Node.js](https://nodejs.org/) 18+ (Docker-Image nutzt Node 20)
- Ein [Spotify Developer Account](https://developer.spotify.com/dashboard)
- Für den Docker-Weg: [Docker](https://docs.docker.com/get-docker/) mit Compose

## Spotify App einrichten

1. Gehe zu [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Erstelle eine neue App ("Create App")
3. Notiere **Client ID** und **Client Secret**
4. Unter **Settings** → **Redirect URIs** füge hinzu:
   ```
   http://127.0.0.1:5173/api/auth/callback
   ```
5. Speichere die Einstellungen

> **Wichtig:** Spotify erlaubt `localhost` nicht mehr. Verwende `127.0.0.1` mit `http://` für lokale Entwicklung. Öffne die App unter **http://127.0.0.1:5173** (nicht `localhost`).

## Installation

```bash
# Abhängigkeiten installieren (installiert via "postinstall" automatisch auch client/)
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Dann .env mit deinen Spotify-Credentials befüllen
```

### Umgebungsvariablen (`.env.example`)

| Variable | Beschreibung |
| --- | --- |
| `SPOTIFY_CLIENT_ID` | Client ID deiner Spotify-App |
| `SPOTIFY_CLIENT_SECRET` | Client Secret deiner Spotify-App |
| `SESSION_SECRET` | Zufälliger, geheimer String zum Signieren der Session-Cookies |
| `SPOTIFY_REDIRECT_URI` | Muss exakt einer im Spotify-Dashboard hinterlegten Redirect-URI entsprechen (z. B. `http://127.0.0.1:5173/api/auth/callback` für `npm run dev`) |
| `CLIENT_URL` | Origin des Frontends, wird u. a. für CORS und OAuth-Redirects verwendet |
| `PORT` | Port des Express-Servers (Standard: `3001`) |
| `USE_HTTPS` | `true`/`false` — ob der Dev-Server lokale HTTPS-Zertifikate nutzen soll (siehe `npm run setup:certs`) |

`.env.example` enthält zusätzlich auskommentierte Beispielwerte für den Docker-Test lokal (`http://127.0.0.1:8080/...`) und für Produktion. Für den reinen Docker-Weg gibt es außerdem `.env.docker.example` mit denselben Variablen, angepasst an `docker-compose.local.yml`/`docker-compose.prod.yml`.

`server/validateEnv.js` prüft beim Start automatisch, ob die Pflichtvariablen gesetzt sind und ob `SPOTIFY_REDIRECT_URI`/`CLIENT_URL` zueinander passen (u. a. wird `localhost` explizit abgelehnt) — fehlende Variablen führen zum sofortigen Abbruch, unpassende Kombinationen erzeugen nur eine Warnung.

## Starten (Entwicklung)

```bash
npm run dev
```

Das startet Client (Vite) und Server (Express) parallel über `concurrently`:

- Frontend: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- Backend: [http://127.0.0.1:3001](http://127.0.0.1:3001)

Öffne die Frontend-URL im Browser und klicke auf **Mit Spotify anmelden**. Anfragen an `/api/*` werden vom Vite-Dev-Server transparent an den Express-Server weitergeleitet (siehe `client/vite.config.js`).

### Weitere Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Client + Server gleichzeitig starten |
| `npm run build` | Frontend für Produktion bauen (`client/dist`) |
| `npm start` | Nur den Express-Server starten (liefert in Produktion auch `client/dist` aus) |
| `npm run check` | Führt Sanity-Checks der Analyse-Engine aus (`scripts/check.js`) |
| `npm run setup:certs` | Erstellt selbstsignierte HTTPS-Zertifikate für die lokale Entwicklung |

## Produktion (ohne Docker)

```bash
npm run build
NODE_ENV=production npm start
```

In Produktion wird das gebaute Frontend vom Express-Server ausgeliefert. Passe `CLIENT_URL` und `SPOTIFY_REDIRECT_URI` entsprechend an.

## Docker

Die App läuft als ein einzelner Container (Frontend + API in einem Node-Prozess). Für Produktion übernimmt ein separater Caddy-Container automatisch TLS für die Domain.

### Voraussetzungen

- [Docker](https://docs.docker.com/get-docker/) mit Compose
- `.env` mit Spotify-Credentials (siehe `.env.docker.example`)
- Im [Spotify Dashboard](https://developer.spotify.com/dashboard) diese Redirect-URIs eintragen:
  - `http://127.0.0.1:8080/api/auth/callback` (Container-Test lokal)
  - `https://analyser.hendrik.tech/api/auth/callback` (Produktion)

### Lokal testen (127.0.0.1)

```bash
npm run docker:local
# entspricht: docker compose -f docker-compose.local.yml up --build
```

App: [http://127.0.0.1:8080](http://127.0.0.1:8080)

Diese Compose-Datei baut auf der gemeinsamen Basis `docker-compose.yml` auf (Multi-Stage-`Dockerfile`, Healthcheck über `/api/health`) und überschreibt nur Port-Mapping sowie `CLIENT_URL`/`SPOTIFY_REDIRECT_URI` für den lokalen Test.

### Produktion (analyser.hendrik.tech)

DNS muss auf den Server zeigen. Dann auf dem Server:

```bash
npm run docker:prod
# entspricht: docker compose -f docker-compose.prod.yml up -d --build
```

`docker-compose.prod.yml` startet zusätzlich einen `caddy:2-alpine`-Container (Konfiguration in `deploy/Caddyfile`), der Let's-Encrypt-Zertifikate automatisch bezieht und HTTPS-Traffic per Reverse-Proxy an den App-Container weiterleitet.

Logs ansehen:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

Stoppen:

```bash
npm run docker:down
# entspricht: docker compose -f docker-compose.prod.yml down
```

## Projektstruktur

```
analyser/
├── client/                        # React-Frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── Landing.jsx        # Login-Startseite
│       │   ├── Profile.jsx        # Hauptseite nach dem Login
│       │   ├── AnalysisSummary.jsx
│       │   ├── MusicDNA.jsx       # Kachel-Übersicht der Hörpersönlichkeit
│       │   ├── ListeningDeepDive.jsx
│       │   ├── FriendCompare.jsx  # Profilvergleich per Share-Code
│       │   ├── ShareCard.jsx      # Teilen als PNG/Text/Link
│       │   ├── CollapsibleSection.jsx
│       │   ├── ExplainedStat.jsx
│       │   ├── HelpTip.jsx
│       │   ├── LanguageSelect.jsx
│       │   └── PageNav.jsx
│       ├── hooks/useMetricHelpers.js
│       ├── i18n/                  # Übersetzungen (de, en, pt-BR)
│       ├── utils/shareProfile.js  # Kodierung/Vergleich der Share-Codes
│       ├── App.jsx
│       ├── api.js
│       └── index.css
├── server/                        # Express-Backend
│   ├── routes/
│   │   ├── auth.js                # OAuth-Flow
│   │   └── api.js                 # Profil-/Analyse-API
│   ├── spotify.js                 # Spotify-Auth-Client (Token-Exchange/-Refresh)
│   ├── listeningAnalysis.js       # Analyse-Engine (Genres, Diversität, Music DNA, Insights, ...)
│   ├── validateEnv.js             # Validierung der Umgebungsvariablen beim Start
│   ├── https.js                   # Lokale HTTPS-Unterstützung
│   └── index.js                   # Express-App/Server-Einstiegspunkt
├── scripts/                       # Hilfsskripte (Dev-Setup, Zertifikate, Sanity-Checks)
├── deploy/Caddyfile                # Reverse-Proxy-/TLS-Konfiguration für Produktion
├── docker-compose.yml              # Basis-Compose (App-Container + Healthcheck)
├── docker-compose.local.yml        # Overlay für lokalen Container-Test
├── docker-compose.prod.yml         # Overlay für Produktion inkl. Caddy
├── Dockerfile
├── .env.example
├── .env.docker.example
└── package.json
```

## Contributing

Beiträge sind willkommen! Bitte lies [CONTRIBUTING.md](CONTRIBUTING.md) für Details zur lokalen Einrichtung, zum Branch-/PR-Ablauf und zum Melden von Bugs. Für alle Mitwirkenden gilt unser [Code of Conduct](CODE_OF_CONDUCT.md).

## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).
