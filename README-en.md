# Jocb — Hilla + Spring Boot Clipboard & Image Manager

## Project Overview
Jocb is a modern full-stack example built with Java Spring Boot (backend), Vaadin Hilla (type-safe API generator), and React (frontend). All uploaded images and text are kept in memory only (not persisted to disk or database): everything will be lost if the server restarts. This makes it suitable for temporary file storage, cross-device clipboard use, or as a practical end-to-end demo project. The app supports light/dark themes and multiple languages.

[wiki for snapshot](https://github.com/LaplusIjns/jocb/wiki)
---

## Features
- 🖼️ Drag & drop or paste images for upload, instant thumbnail preview, and large image dialog
- 📋 Quickly paste, manage, save, and organize multiple text blocks — instant sync, copy, and delete supported
- 🌒 Built-in light / dark theme toggle
- 🌏 Multilingual structure; switch UI language on the fly (currently English/Zh-TW by default)
- 🧩 End-to-end Spring Boot + Vaadin Hilla with automatic TypeScript type sync between backend and frontend

---

## Getting Started
1. **Quick Start (Requires JDK 25)**
   - Run using the built-in Spring Boot plugin (with live reload):
     ```bash
     ./mvnw spring-boot:run    # Mac/Linux
     mvnw spring-boot:run      # Windows
     ```
   Once running, open your browser to [http://localhost:8080](http://localhost:8080)

2. **Build for Production**
   - Windows:
     ```bash
     mvnw clean package -Dvaadin.force.production.build=true
     ```
   - Mac/Linux:
     ```bash
     ./mvnw clean package -Dvaadin.force.production.build=true
     ```
   When complete, run:
   ```bash
   java -jar target/jocb-1.0-SNAPSHOT.jar
   ```

3. **Import to IDE**
   - Import as a Maven project using IntelliJ IDEA, Eclipse, or VSCode.

---

## Project Structure
```
├─ src
│  ├─ main
│  │  ├─ java/com/github/laplusijns     // Spring Boot source, entry Application.java
│  │  ├─ frontend                        // React UI, routes, i18n
│  │  │  ├─ index.html, themes, views
│  │  │  ├─ @layout.tsx, @index.tsx, textClip.tsx (main UI components)
│  │  └─ resources                       // Configs, i18n, static assets
│  └─ test                               // Tests
├─ package.json, pom.xml                 // Project dependency & config
├─ vite.config.ts                        // Frontend build config
└─ README.md / README-en.md
```

---

## Feature Highlights
### 1. Image Upload
- Select, drag, or paste images; shows preview with click-to-enlarge dialog.
- Images are uploaded via backend API (endpoint demo; extend as needed).

### 2. Text Clipboard Manager
- Directly paste multiple text blocks, with copy/delete/clear-all options.
- Instantly synced, one-click copy for single or all items.

### 3. Theme & Language Switch
- Sidebar toggle for light/dark mode
- Dynamically switch languages, setting saved to localStorage

---

## Docs & Community
- Vaadin Documentation: [https://vaadin.com/docs/latest//](https://vaadin.com/docs/latest/)
- Vaadin Forum: [https://vaadin.com/forum](https://vaadin.com/forum)
- For bugs or feature requests, please use project issues or pull requests.

---

## License
This project is licensed under the terms of [LICENSE.md](./LICENSE.md).
