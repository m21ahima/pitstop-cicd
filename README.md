# 🏁 Pit Stop — A Deploy Pipeline You Can Actually Watch

**What it does, in one sentence:** it safely publishes a new version of an app, and automatically throws it away and keeps the old version running if the new one is broken — with zero downtime, and no human needed to decide.

## The problem this solves

Shipping a code update straight to a live app is risky — if the new version has a bug, users see it break in real time. Real companies solve this with an automated checklist that runs on every deploy. Pit Stop is a tiny, from-scratch version of that same checklist, built to actually understand every step instead of copy-pasting someone else's pipeline.

## The 5-step checklist

1. **Build** — install dependencies. Does the new code even come together?
2. **Test** — run basic sanity checks.
3. **Deploy** — start the new version running, on its own port, *without touching the old one yet*.
4. **Healthcheck** — actually poke the new version and ask "are you working?" — not just "did you start."
5. **Decide** — if healthy, switch live traffic over to it and stop the old version. If not, kill the new one and keep serving from the old one. Either way, nothing breaks for users.

## Why it's zero-downtime

The new version never touches real traffic until it's proven healthy. If it fails, the old version was never stopped — it just kept running the whole time. This pattern is called **blue-green deployment**.

## What's in this repo

- **`sample-app/`** — a stand-in for "some real app." It has a `/health` endpoint that honestly reports if it's working, and a `/break` endpoint to simulate a bug for testing.
- **`bin/pitstop.js`** — the checklist-runner. Run `node bin/pitstop.js deploy` and it walks through all 5 steps live in your terminal.
- **`lib/`** — the logic behind each step (build, test, deploy, healthcheck, rollback), plus a logger that records every run.
- **`logs/`** — every deploy gets saved as a `.jsonl` file. Run `node bin/pitstop.js replay` to watch any past deploy again, step by step, with real timing.
- **`visual/pitstop-visual.html`** — a visual, animated version of the same pipeline for demos — no terminal needed. [Live demo →](#) *(add your GitHub Pages link here)*

## Try it yourself

```bash
npm install
cd sample-app && npm install && cd ..
node bin/pitstop.js deploy
```

To see a deploy actually get rejected: edit `sample-app/index.js` so `/health` always returns a 500 error, save, then run `node bin/pitstop.js deploy` again. Watch it fail the healthcheck and roll back automatically — the old version never goes down.

## Tech stack

Node.js · Express · plain HTML/CSS/JS for the visual demo — no cloud, no external services. Everything runs locally so anyone can clone it and see it work in under a minute.
