# create-vrtw-usgmathe

> ⚡ Scaffold a modern React stack in seconds — **Vite + React + TypeScript + TailwindCSS + optional shadcn/ui**

No templates. No boilerplate. Just a clean, production-ready setup.

---

## 📦 Quick Start

```bash
pnpm create vrtw-usgmathe@latest my-app
cd my-app
pnpm dev
````

---

## 🎥 Demo

```bash
pnpm create vrtw-usgmathe my-app
```

```
📦 Using pnpm

→ Creating Vite app...
→ Cleaning files...
→ Configuring App...
→ Installing dependencies...
→ Configuring Vite...
→ Configuring tsconfig...
→ Installing shadcn... (optional)
→ Configuring Prettier...

✅ Project created successfully!
```

---

## ✨ Features

* ⚡ **Vite + React + TypeScript**
* 🎨 **TailwindCSS (official Vite plugin)**
* 📦 **`@/` path alias configured**
* 🧠 **TypeScript properly configured**
* ✨ **Prettier + Tailwind sorting**
* 🧩 **Optional shadcn/ui**
* 🧹 **Clean project (no junk files)**
* 🤖 **Auto-detects npm or pnpm**
* 🔒 **Safe file edits using AST (no regex hacks)**

---

## ⚙️ CLI Options

```bash
create-vrtw-usgmathe my-app [options]
```

| Option        | Description                |
| ------------- | -------------------------- |
| `--no-shadcn` | Skip shadcn/ui setup       |
| `--yes`       | Skip all prompts (CI mode) |

---

## 🧠 Philosophy

Most starters either:

* ship too much boilerplate
* rely on outdated templates
* or break easily when modified

This CLI takes a different approach:

* 🧩 **Programmatic setup instead of templates**
* 🔍 **AST-based file manipulation (reliable)**
* 🎯 **Minimal but extensible foundation**

You start clean — and scale your way.

---

## 🛠 What Happens Under the Hood

* Creates a Vite React + TS project
* Removes unnecessary files
* Configures TailwindCSS
* Adds `@/` path alias
* Updates `tsconfig.json`
* Replaces default `App.tsx` with a minimal `app.tsx`
* Updates `main.tsx` using AST
* Sets up Prettier + Tailwind plugin
* Optionally installs **shadcn/ui**

---

## 🎨 Adding shadcn/ui later

```bash
pnpm dlx shadcn@latest init --template vite
```

---

## 📌 Requirements

* Node.js >= 18
* pnpm (recommended) or npm

---

## 🤝 Contributing

PRs are welcome.

If you want to improve the CLI, feel free to open an issue or submit a pull request.

---

## 📄 License

MIT
