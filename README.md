# Spanish Quiz

A small Spanish vocabulary quiz game built with React and Vite.

Live app: https://spanish-quiz-game.netlify.app/

## What It Does

Spanish Quiz gives you a starter set of Spanish words and phrases so you can begin playing straight away. The included questions are just enough to get you started, and you can add more words over time from inside the app.

The quiz supports three modes:

- **Normal mode**: answer a fixed round of questions and build up a score.
- **Streak mode**: keep answering for as long as you can. One wrong answer or timeout ends the game.
- **Translate mode**: build short Spanish sentence prompts from the active quiz words, then pick the correct English option to keep your streak going.

## Adding Your Own Questions

Open the **Manage** screen in the app to add your own Spanish words and accepted English answers. Your added questions are saved in your browser, so you can keep building your own practice set in your own time. Translate mode can use the starter words and your added words, and it unlocks when there is enough vocabulary to build multiple sentence choices.

The app also includes a `public/questions.json` file with the starter question data.

## Offline Use

Open the deployed app once while online and wait for “Ready to use offline”. It saves the app,
starter questions, and images for later offline use. You can then reopen the same
URL without a connection, or add it to your home screen using your browser's
installation option. Custom questions and scores stay in that browser on that device.

Pronunciation prefers installed Spanish voices. If your device has no local Spanish
voice, speech may need a connection; the quiz itself still works offline.

New releases download when you open the app online and take effect after all app
tabs/windows close and you reopen it. Clearing site data removes the offline copy
and saved questions/scores. Browsers can also evict stored site data.

Offline caching runs in production builds served over HTTPS (or localhost), not in
the Vite development server. To check it locally, build and run the preview server,
load the page, wait for the service worker to activate in browser developer tools,
then switch the browser to offline and reload.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```
