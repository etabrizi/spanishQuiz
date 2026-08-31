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
