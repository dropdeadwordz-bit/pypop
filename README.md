# PyPop – Python lernen mit K-Pop

Lern-App für Python-Einsteigerinnen (13–16 Jahre), optimiert für Android-Handys.
Begleiterin ist Baemi, die Code-Schlange. Gelernt wird in „Eras“ (Kapiteln), belohnt wird mit XP, Streaks, Alben und Fotokarten.

## Online stellen (GitHub + Vercel, ca. 10 Minuten)

1. **GitHub-Repository anlegen:** github.com → „New repository“ → Name z. B. `pypop` → Sichtbarkeit **Private** → „Create repository“.
2. **Dateien hochladen:** Im leeren Repo auf „uploading an existing file“ klicken. Die ZIP entpacken und den **Inhalt** des Ordners `pypop` (also `package.json`, `src`, `public` usw. – nicht den Ordner selbst) ins Browserfenster ziehen → „Commit changes“.
3. **Vercel verbinden:** vercel.com → „Add New…“ → „Project“ → das Repo `pypop` importieren. Vercel erkennt „Vite“ automatisch. Auf „Deploy“ klicken.
4. Nach ca. 1 Minute gibt es eine Adresse wie `pypop-xyz.vercel.app`.

Spätere Änderungen: Dateien im GitHub-Repo ersetzen → Vercel veröffentlicht automatisch neu.

## Auf dem Android-Handy installieren

1. Die Vercel-Adresse in **Chrome** öffnen.
2. Nach der ersten Lektion erscheint „Installieren“ auf der Startseite (alternativ: Chrome-Menü ⋮ → „App installieren“).
3. PyPop hat dann ein eigenes Icon, läuft im Vollbild und auch offline.

Beim allerersten Start einer Code-Aufgabe lädt die App Python (einige MB). Danach liegt es im Speicher des Handys.

## Für Eltern

- Profil → **Eltern-Bereich** (beim ersten Öffnen 4-stellige PIN festlegen).
- Dort: echte Belohnung festlegen (Ziel: Streak-Tage, Lektionen oder XP), Lernstatistik, Testmodus (alle Lektionen freischalten), Zurücksetzen.
- Alle Daten bleiben auf dem Handy, es gibt kein Konto und keinen Server. Profil → **Backup-Code** sichert den Fortschritt (z. B. vor einem Handywechsel).

## Inhalt

| Era | Thema | Status |
|---|---|---|
| 1 Debut | print, Strings, Kommentare, Fehler lesen | fertig (5 Lektionen) |
| 2 Profile | Variablen | fertig (5 Lektionen) |
| 3 Charts | Zahlen & Rechnen | fertig (6 Lektionen) |
| 4–12 | f-Strings, input, if, Schleifen, Listen, Funktionen, Dictionaries, Projekte | in Planung |

Aufgabentypen: Erklärkarte (mit „Ausführen“), Multiple Choice, Ausgabe vorhersagen, Lückentext, Bausteine ordnen, Bug-Jagd, Code schreiben.

## Neue Eras hinzufügen

Inhalte werden in `tools/content/era_XX.py` geschrieben und mit

```
python3 tools/build_content.py
```

nach `src/content/era-XX.json` übersetzt. Das Skript führt dabei **jedes Code-Beispiel mit echtem Python aus**: Es ermittelt die richtigen Antworten, prüft Musterlösungen und Fehler-Aufgaben und akzeptiert automatisch alle gleichwertigen Reihenfolgen. Eine neue JSON-Datei erscheint ohne Code-Änderung in der App.

Platzhalter in Texten und Code: `@@NAME@@` (Name) und `@@GRUPPE@@` (selbst gewählter Gruppenname).

## Technik

- Vite + React, kein Backend. Fortschritt in `localStorage`.
- Python: [Pyodide](https://pyodide.org) 0.26.4 (WebAssembly) in einem Web Worker (`public/py-worker.js`). Endlosschleifen werden nach 6 Sekunden abgebrochen.
- PWA: `public/manifest.webmanifest`, `public/sw.js` (offline, Python wird gecacht).
- Lokal starten: `npm install` → `npm run dev`.
