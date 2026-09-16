# Contributing zu Analyser

Danke für dein Interesse, an Analyser mitzuwirken! Dieses Dokument beschreibt, wie du eine lokale Entwicklungsumgebung einrichtest, wie Beiträge abläufen und worauf beim Code-Stil zu achten ist.

Mit deiner Teilnahme an diesem Projekt erklärst du dich damit einverstanden, den [Code of Conduct](CODE_OF_CONDUCT.md) einzuhalten. Bitte lies ihn, bevor du loslegst.

## Projektaufbau

Analyser ist ein npm-Workspace-ähnliches Monorepo mit zwei Teilen:

- **`client/`** — React-Frontend (Vite, React 19)
- **`server/`** — Express-Backend (OAuth-Flow, Spotify-API-Proxy, Analyse-Logik in `server/listeningAnalysis.js`)

Es gibt keine echten npm-Workspaces im `package.json`-Sinn, sondern ein `postinstall`-Skript im Root-`package.json`, das automatisch `npm install --prefix client` ausführt. Es reicht also, im Projekt-Root `npm install` auszuführen — die Client-Abhängigkeiten werden automatisch mitinstalliert.

## Lokale Entwicklungsumgebung einrichten

1. Repository forken und klonen:
   ```bash
   git clone https://github.com/<dein-user>/analyser.git
   cd analyser
   ```
2. Abhängigkeiten installieren (installiert dank `postinstall` automatisch auch `client/`):
   ```bash
   npm install
   ```
3. Eigene Spotify-App im [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) anlegen und als Redirect-URI `http://127.0.0.1:5173/api/auth/callback` eintragen (siehe README für Details — **wichtig:** `127.0.0.1`, nicht `localhost`).
4. `.env` aus der Vorlage erstellen und mit deinen Spotify-Credentials befüllen:
   ```bash
   cp .env.example .env
   ```
5. Entwicklungsserver starten (Client + Server gleichzeitig, via `concurrently`):
   ```bash
   npm run dev
   ```
   Frontend läuft auf `http://127.0.0.1:5173`, Backend auf `http://127.0.0.1:3001`.

Weitere nützliche Skripte aus dem Root-`package.json`:

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Startet Client (Vite) und Server (Express) parallel |
| `npm run build` | Baut das Frontend (`client`) für die Produktion |
| `npm start` | Startet nur den Express-Server (erwartet einen vorhandenen Build in `client/dist`, wenn `NODE_ENV=production`) |
| `npm run check` | Führt `scripts/check.js` aus — ein einfaches Node-Skript mit `assert`-Checks, das die Analyse-Engine in `server/listeningAnalysis.js` mit Mock-Daten gegen Regressionen prüft |
| `npm run setup:certs` | Erzeugt selbstsignierte HTTPS-Zertifikate für die lokale Entwicklung mit HTTPS |
| `npm run docker:local` | Baut und startet den Container lokal via `docker-compose.local.yml` |
| `npm run docker:prod` | Baut und startet den Container für die Produktion via `docker-compose.prod.yml` |
| `npm run docker:down` | Stoppt die Produktions-Container |

Es gibt aktuell **keine automatisierten Tests im klassischen Sinn** (kein Jest/Vitest) und **keine ESLint- oder Prettier-Konfiguration** im Repository. Bitte erfinde beim Beitragen keine entsprechenden Regeln oder Tools — orientiere dich stattdessen am bestehenden Code-Stil (siehe unten) und nutze `npm run check` als einfachen Sanity-Check für Änderungen an der Analyse-Logik.

## Code-Stil

Da es keine automatisierte Formatierung gibt, gilt "konsistent mit dem umgebenden Code":

- **Server (`server/`)**: CommonJS (`require`/`module.exports`), 2 Leerzeichen Einrückung, `async/await` für asynchronen Code, einfache Single Quotes.
- **Client (`client/src`)**: React-Funktionskomponenten mit Hooks, ES-Modules (`import`/`export`), JSX-Dateiendung `.jsx` für Komponenten. Neue UI-Texte gehören in die i18n-Locales (`client/src/i18n/locales/`), nicht hartkodiert in die Komponente — das Projekt unterstützt Deutsch, Englisch und brasilianisches Portugiesisch.
- Halte Pull Requests fokussiert und klein, wenn möglich. Größere Refactorings vorher in einem Issue ankündigen/besprechen.

## Branches und Commits

- Arbeite nicht direkt auf `main` — erstelle einen Feature-Branch von `main` aus deinem Fork.
- Branch-Namen nach dem Schema `<typ>/<kurzbeschreibung>`, z. B.:
  - `feature/friend-compare-export`
  - `fix/oauth-state-check`
  - `docs/contributing-guide`
  - `chore/update-dependencies`
- Schreibe klare, prägnante Commit-Nachrichten, die beschreiben, **warum** eine Änderung gemacht wurde, nicht nur was.

## Pull Requests öffnen

1. Erstelle einen Branch wie oben beschrieben.
2. Committe deine Änderungen und pushe sie in deinen Fork.
3. Öffne einen Pull Request gegen den `main`-Branch von `hendrikmrks/analyser`.
4. Beschreibe im PR, was sich ändert und warum, und wie du es getestet hast (z. B. `npm run check`, manueller Test im Browser mit eigenem Spotify-Account).
5. Verlinke ein zugehöriges Issue, falls vorhanden.
6. Sei offen für Rückfragen und Änderungswünsche im Review.

## Bugs melden

Bitte öffne ein [GitHub Issue](https://github.com/hendrikmrks/analyser/issues) und gib dabei möglichst an:

- Was du erwartet hast und was stattdessen passiert ist
- Schritte zum Reproduzieren
- Umgebung (Betriebssystem, Node-Version, Browser, lokal vs. Docker)
- Relevante Server-/Browser-Konsolen-Logs (bitte **keine** Spotify-Zugangsdaten, Access-Tokens oder `.env`-Inhalte posten)

Für Sicherheitsrelevante Findings (z. B. Probleme im OAuth-Flow oder Session-Handling) bitte nach Möglichkeit zunächst direkt Kontakt aufnehmen, statt Details öffentlich in einem Issue zu posten.

## Verhalten

Wir erwarten von allen Mitwirkenden einen respektvollen Umgang miteinander, wie im [Code of Conduct](CODE_OF_CONDUCT.md) beschrieben. Verstöße können an github@hendrik-beier.de gemeldet werden.

Viel Spaß beim Beitragen!
