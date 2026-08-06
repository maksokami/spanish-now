# Español Ya! 🇪🇸

Español Ya! is a lightweight, frontend-only Spanish learning application. It is built using HTML, CSS, and Vanilla JavaScript, powered by Vite for development and bundling. It supports four study modes (Standard Flashcards, Stories with hover vocabulary, Sentences with toggleable translations, and Spaced Repetition System flashcards) and works completely in the browser without a database.

---

## 🚀 Running the App Locally

To run the application on your local machine:

1. **Install Dependencies**: Open your terminal in the project root directory and run:
   ```bash
   npm install
   ```
2. **Start the Development Server**: Start the local Vite server by running:
   ```bash
   npm run dev
   ```
   This will start a hot-reloading development server and print the address (usually `http://localhost:5173/`). Open this link in your browser to view the application.
3. **Build for Production**: Compile and optimize the application into static files (stored in the `dist/` directory):
   ```bash
   npm run build
   ```
4. **Preview the Production Build**: Verify the compiled output locally:
   ```bash
   npm run preview
   ```

---

## ✨ Key Features & Recent Enhancements

- **Dynamic Search Bar**: A case-insensitive search bar in the sidebar lets you filter topics dynamically, with a clear (`×`) button to quickly reset the query.
- **Folder & Property-Based Grouping**: Sidebar topics are grouped automatically using folder names or an explicit `"group"` attribute inside their JSON file. Groups are sorted alphabetically, keeping `"Uncategorized"` items at the bottom.
- **Smart Story Highlighting**: In reading stories, only the **first encounter** of a vocabulary word displays with the hover tooltip translation and bold style. Any subsequent occurrences are rendered as plain text to encourage natural retrieval and active recall.
- **Spaced Repetition System (SRS)**: The `srs-flashcards` mode displays one card at a time and schedules card review intervals based on how well you remember the word.
- **Persistent Theme Toggle**: Toggling between light and dark mode updates the application's theme variables instantly and stores your choice across reloads.

---

## 🌐 Hosting on GitHub Pages

Since **Español Ya!** is a static web application, it can be hosted for free on GitHub Pages. Follow these steps to host your own version:

### Step 1: Initialize Git and Push to GitHub
1. Create a new public repository on [GitHub](https://github.com).
2. Open your terminal in the project directory and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

### Step 2: Configure Vite for Sub-paths (If Needed)
If your site is hosted at a sub-path (e.g., `https://<your-username>.github.io/<your-repo-name>/`), Vite needs to know this so that asset paths resolve correctly.

Create a `vite.config.js` file in the root of your project:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  // Set the base path to match your GitHub repository name
  base: '/<your-repo-name>/', 
});
```
*(If you are mapping a custom domain to your GitHub Pages site, you can omit this file or keep `base: '/'`)*

### Step 3: Deploy via GitHub Actions (Recommended)
You can set up GitHub to automatically build and deploy your app every time you push code.

1. In your project, create the following directory structure: `.github/workflows/`
2. Create a file named `deploy.yml` inside that folder with this content:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches:
         - main

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: "pages"
     cancel-in-progress: false

   jobs:
     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4

         - name: Set up Node
           uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Setup Pages
           uses: actions/configure-pages@v4

         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: './dist'

         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
```
3. Commit and push this workflow to GitHub.
4. Go to your repository settings on GitHub -> **Pages**.
5. Under **Build and deployment** -> **Source**, make sure it is set to **GitHub Actions**.
6. GitHub will now build and publish your site automatically!

---

## 📂 Organizing Topics

The app dynamically discovers and imports all `.json` files within the `topics/` directory. You can organize and group them using two methods:

### 1. Folder-Based Grouping
You can create subdirectories within `topics/` (e.g., `topics/Vocabulary/` or `topics/Grammar/`). The app will automatically read the folder name and use it as the category group header in the sidebar.
* E.g., `topics/Vocabulary/colors.json` will be grouped under **Vocabulary**.

### 2. JSON Field Grouping
You can explicitly set a `"group"` field inside the JSON file. This takes priority over the folder name:
```json
{
  "id": "my-topic-id",
  "title": "Topic Title",
  "group": "My Custom Group Name",
  "type": "..."
}
```

---

## 🤖 Asking AI to Generate More Topics

You can easily expand your curriculum by asking AI (like Gemini, Claude, or ChatGPT) to write new topic JSON files. Below is a copy-pasteable prompt template you can use.

### Copy-Paste Prompt Template

> **System Prompt for generating topics:**
> 
> "Please write a JSON study file for my Spanish learning app. The app supports four types of JSON topics. Depending on the topic type I request, please format the output EXACTLY like the matching schema below, returning only the raw JSON code block without any explanation. Use a unique `id` for the topic, and unique `id`s for each card."

Here are the four JSON schemas to feed the AI as reference:

#### 1. Standard Flashcards (`flashcards`)
Use this for simple word or phrase pairing.
```json
{
  "id": "basics-1",
  "title": "Basic Greetings",
  "type": "flashcards",
  "group": "Greetings",
  "data": [
    { "id": "f1", "es": "Hola", "en": "Hello" },
    { "id": "f2", "es": "Adiós", "en": "Goodbye" }
  ]
}
```

#### 2. Reading Stories (`story`)
Use this for reading comprehension. Any word in the story that appears in the `vocabulary` object will show a translation tooltip on hover.
```json
{
  "id": "story-1",
  "title": "Un Día en Madrid",
  "type": "story",
  "group": "Stories",
  "text": "Hoy es un día hermoso en Madrid. El sol brilla.",
  "vocabulary": {
    "hermoso": "beautiful",
    "sol": "sun",
    "brilla": "shines"
  }
}
```

#### 3. Sentence Practice (`sentences`)
Use this for looking at sentences in context. By default, translations are hidden until hovered over, but users can toggle this setting.
```json
{
  "id": "sentences-1",
  "title": "Restaurant Phrases",
  "type": "sentences",
  "group": "Conversational",
  "autoHide": true,
  "data": [
    { "es": "Una mesa para dos, por favor.", "en": "A table for two, please." },
    { "es": "La cuenta, por favor.", "en": "The bill, please." }
  ]
}
```

#### 4. Spaced Repetition Flashcards (`srs-flashcards`)
Use this to track vocabulary mastery. It presents one card at a time and schedules card intervals based on how well the user performs.
```json
{
  "id": "srs-colors",
  "title": "SRS: Colors",
  "type": "srs-flashcards",
  "group": "Spaced Repetition",
  "data": [
    { "id": "c1", "es": "Rojo", "en": "Red" },
    { "id": "c2", "es": "Azul", "en": "Blue" }
  ]
}
```

---

## 🍪 Cookies and Data Persistence

To keep the application backend-less, secure, and fast, **Español Ya!** saves all user data locally on your computer using browser cookies.

### What is saved in Cookies?
- **Theme preference:** Whether you prefer light mode or dark mode.
- **SRS progress:** Due dates, current card scheduling intervals, repetition history, and ease factors for Spaced Repetition topics (tracked per topic ID).

> [!IMPORTANT]
> **Cookies do NOT sync across browsers or devices.**
> Because this data is stored locally in the specific browser you are using:
> - If you study on **Chrome** on your laptop, your progress will **not** be visible if you open the site in **Firefox** or on your **mobile phone**.
> - Clearing your browser history, cache, or cookies will **permanently delete** your learning progress and reset all study schedules.
