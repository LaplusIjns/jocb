# Jocb — Hilla + Spring Boot 超實用剪貼板/圖片管理工具

## 專案簡介
Jocb 是一套基於 Java Spring Boot (後端) + Vaadin Hilla (全端 API 生成) + React (前端) 的現代化應用專案，提供「圖片上傳」和「文字剪貼板」管理功能。所有上傳圖片及文字暫存內容，僅存在記憶體中（未寫入硬碟或資料庫），重新啟動服務即會清除。適合用於臨時檔案暫存、跨平台剪貼板用途，或作為全端範例專案參考使用。支援主題深/淺色切換與多語系（可依需求擴充）。

---

## 主要特色
- 🖼️ 支援拖拉貼上或選取圖片上傳，並即時產生預覽與大圖 Dialog 顯示
- 📋 可快速貼上、管理、儲存多段文字，自動同步、快取、複製、刪除
- 🌒 內建「淺色/深色」主題，可隨時切換
- 🌏 多語系架構，可快速切換語系（目前預設支援英文/繁中）
- 🧩 Spring Boot + Vaadin Hilla 全端架構，後端與前端 TypeScript 型態全自動同步

---

## 安裝與啟動
1. **快速啟動（需已安裝 JDK 25）**
   - 使用 Spring Boot 內建插件啟動（支援自動重載）：
     ```bash
     ./mvnw spring-boot:run    # Mac/Linux
     mvnw spring-boot:run      # Windows
     ```
   執行成功後，開啟瀏覽器前往 [http://localhost:8080](http://localhost:8080)

2. **專案打包（Production）**
   - Windows：
     ```bash
     mvnw clean package -Dvaadin.force.production.build=true
     ```
   - Mac/Linux：
     ```bash
     ./mvnw clean package -Dvaadin.force.production.build=true
     ```
   完成後執行：
   ```bash
   java -jar target/jocb-1.0-SNAPSHOT.jar
   ```

3. **IDE匯入**
   - 直接以 IntelliJ IDEA / Eclipse / VSCode 匯入為 Maven 專案即可

---

## 專案結構

```
├─ src
│  ├─ main
│  │  ├─ java/com/github/laplusijns     // Spring Boot 源碼，入口 Application.java
│  │  ├─ frontend                        // React 前端界面 + Route + 多語
│  │  │  ├─ index.html, themes, views
│  │  │  ├─ @layout.tsx, @index.tsx, textClip.tsx
│  │  │  │   - 主要畫面/元件（如圖片上傳、剪貼板）
│  │  └─ resources                       // 設定檔、國際化、靜態資源
│  └─ test                               // 測試
├─ package.json, pom.xml                 // 前後端依賴/設定
├─ vite.config.ts                        // 前端打包設定
└─ README.md
```

---

## 功能亮點速覽
### 1. 圖片上傳
- 支援選取/貼上圖片，所有圖片會出現預覽，點擊可放大彈窗顯示。
- 圖片實際會傳送給後端 API 儲存（範例用法，請依實際需求擴充 Endpoints）。

### 2. 文字快取/剪貼板
- 可直接貼上多段文字（如大量暫存內容），支援複製/刪除/全部清除等功能。
- 內容會即時同步顯示，支援單條與全部內容一鍵複製。

### 3. 主題與語言切換
- 側邊欄可切換「深/淺色」主題
- 支援動態語系切換，並可用 localStorage 記憶

---

## 延伸閱讀 & 技術支援
- Vaadin 文件：[https://vaadin.com/docs/latest/](https://vaadin.com/docs/latest/)
- Vaadin 框架討論：[https://vaadin.com/forum](https://vaadin.com/forum)
- 若有 Bugs / 需求，請直接於專案 Issues 或 PR

---

## 授權
本專案依 [LICENSE.md](./LICENSE.md) 授權。

---

[English README](./README-en.md)
