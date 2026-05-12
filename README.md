# Pomodoro Timer

A modern, single-file Pomodoro timer built with vanilla HTML, CSS, and JavaScript — no dependencies or build step required.

## Features

- **25-minute countdown** with a smooth animated progress ring
- **Custom duration** — set any time from 1 to 99 minutes via the input field
- **Start / Pause / Resume / Reset** controls
- **Chime on completion** — a 4-note ascending chord synthesized via the Web Audio API (no audio files needed)
- **Session tracker** — counts completed Pomodoros with dot indicators (cycles every 4)
- **Live tab title** — shows the countdown in the browser tab so you can monitor it without switching windows

## Usage

Open `pomodoro.html` directly in any modern browser — no server needed.

```bash
open pomodoro.html
```

Or serve it locally:

```bash
python3 -m http.server 8082
# then visit http://localhost:8082/pomodoro.html
```

## How It Works

| Step | Action |
|------|--------|
| 1 | Optionally change the **Minutes** input to set a custom duration |
| 2 | Click **Start** to begin the countdown |
| 3 | Click **Pause** / **Resume** to pause mid-session |
| 4 | Click **Reset** to return to the start |
| 5 | A chime plays when the timer reaches zero |

## Tech Stack

- **HTML5** — single self-contained file
- **CSS3** — SVG ring animation, CSS custom properties, responsive layout
- **Vanilla JavaScript** — Web Audio API for the completion chime, no frameworks or libraries

## Deployment

- **Docker** - container pomodoro-timer
- **Playwright** - 27 functional tests 