<div align="center">

# 🩸 LIFELINE — Blood Bank Intelligence Network

### An AI-Powered, Full-Stack Blood Bank Management System

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)](LICENSE)

> A production-ready, intelligent blood bank management platform featuring a real-time inventory dashboard, AI-powered emergency donor matching, 7-day shortage risk forecasting, and persistent MySQL data storage — all wrapped in a premium glassmorphic dark-mode UI.

![LIFELINE Dashboard Preview](https://img.shields.io/badge/Status-Live%20%26%20Operational-38A169?style=for-the-badge)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Configuration](#database-configuration)
  - [Running the Application](#running-the-application)
- [API Reference](#-api-reference)
- [AI Capabilities](#-ai-capabilities)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**LIFELINE** is a comprehensive blood bank intelligence system designed to solve the real-world logistical challenges of managing blood supply chains, emergency hospital requests, and donor registries.

The system eliminates paper-based workflows and disconnected record-keeping by consolidating inventory tracking, donor management, and hospital requisition fulfillment into a single, intelligent, web-based platform — backed by a live MySQL database and an AI reasoning engine.

---

## ✨ Key Features

### 🏥 Admin Control Center
- **Real-time Inventory Dashboard** — Visual stock levels for all 8 blood types (`A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-`) with color-coded shortage warnings (critical / low / normal).
- **Live Chart.js Visualization** — Animated bar chart profile for instant visual comparison of all blood group stock levels.
- **Quick Stock Adjustment** — Hover-triggered `+` / `−` controls on each blood type card allow admins to manually add or remove units in one click, with instant database persistence.
- **Requisition Management Table** — Searchable, sortable table of all hospital requests with inline **Fulfill** and **Cancel** action buttons.
- **Transaction-Safe Fulfillment** — Marking a request as "Fulfilled" automatically deducts the exact units from the corresponding blood type inventory in MySQL, with stock sufficiency checks.

### 🩸 Donor Portal
- **Donor Registration Form** — Capture name, blood type, phone, city, and last donation date, persisted to MySQL.
- **90-Day Eligibility Calculator** — Instant clinical eligibility check based on the standard 90-day whole blood donation cooldown.
- **Searchable Donor Roster** — Full-roster table with real-time text filtering across name, blood type, city, and eligibility status.
- **AI Clinical Query Tool** — Inline question-answering widget powered by the Gemini AI for donor eligibility edge-case guidance.

### 🏨 Hospital Portal
- **Emergency Requisition Form** — Hospitals submit blood requests specifying blood type, quantity, and urgency priority (`Routine` / `Urgent` / `Critical`).
- **AI Matching Engine** — After submission, the AI instantly evaluates stock sufficiency and identifies compatible donors (using transfusion compatibility rules), providing an operational recommendation.
- **Request History Log** — Searchable full history table showing all past requisitions with their real-time status (`pending` / `fulfilled` / `cancelled`).

### 🤖 AI Intelligence Layer
- **7-Day Shortage Risk Forecasting** — Calculates a risk coefficient (0–100%) per blood type based on current stock levels, historical requests, and inherent rarity of negative blood groups.
- **Dual-Mode AI Engine** — Integrates the **Google Gemini API** for dynamic reasoning. If no API key is provided, a high-fidelity **local heuristics engine** kicks in automatically, ensuring full AI functionality even offline.
- **Floating Chat Assistant** — Context-aware chatbot widget for answering questions about blood compatibility, donation rules, and app navigation, with quick-select preset chip prompts.

### 🛡️ Resilience & Reliability
- **Fail-Safe Offline Mode** — If MySQL is unavailable (e.g., wrong credentials, service stopped), the server detects the failure and transparently falls back to a full in-memory simulation. The app remains 100% usable, with a visible `🟡 Offline Mode` badge in the header.
- **Auto Database Initialization** — On first boot, the server automatically creates the `blood_bank_db` database, initializes all required tables, and seeds default inventory levels — zero manual SQL setup required.
- **Live Connection Status Badge** — A real-time header indicator shows `🟢 MySQL Connected` or `🟡 Offline Mode` so operators always know the data persistence state.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, Vanilla CSS, Vanilla JavaScript | UI structure, styling, and client logic |
| **Typography** | Google Fonts (Fraunces, Inter, JetBrains Mono) | Premium typographic hierarchy |
| **Charting** | Chart.js (CDN) | Real-time animated inventory bar chart |
| **Backend** | Node.js + Express.js | REST API server and static file serving |
| **Database** | MySQL 8.0 | Persistent data storage for inventory, donors, and requests |
| **ORM / Driver** | mysql2 (with Promises) | Async MySQL connection pooling |
| **AI Integration** | Google Gemini 2.5 Flash API | Dynamic AI reasoning for matching, forecasting, and chat |
| **Configuration** | dotenv | Secure environment variable management |
| **CORS** | cors (npm) | Cross-origin request handling |

---

## 📁 Project Structure

```
AI POWERED BLOOD BANK MANGEMENT SOFTWARE/
│
├── public/
│   └── index.html          # 🎨 Full frontend — redesigned premium glassmorphic UI
│
├── db.js                   # 🗄️ MySQL connection pool, schema auto-init, and seeding
├── server.js               # ⚙️ Express API server — all routes and AI endpoints
│
├── package.json            # 📦 Project metadata and dependency declarations
├── package-lock.json       # 🔒 Locked dependency tree
│
├── .env                    # 🔑 Local environment config (DB credentials, API keys)
├── .env.example            # 📋 Safe template for environment setup
│
├── node_modules/           # 📂 Installed npm packages
│
└── README.md               # 📖 This file
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed on your system before proceeding:

| Requirement | Version | Download |
|-------------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| npm | v9+ | Included with Node.js |
| MySQL Server | v8.0+ | [mysql.com](https://dev.mysql.com/downloads/mysql/) |

---

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/lifeline-blood-bank.git
cd lifeline-blood-bank
```

**2. Install all Node.js dependencies:**
```bash
npm install
```

---

### Database Configuration

**1. Copy the environment template:**
```bash
copy .env.example .env
```

**2. Open the `.env` file and fill in your MySQL credentials:**
```env
# Server
PORT=5000

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD="your_mysql_password_here"
DB_NAME=blood_bank_db

# Google Gemini API (optional — app works fully offline without this)
GEMINI_API_KEY=your_gemini_api_key_here
```

> [!IMPORTANT]
> If your MySQL password contains special characters such as `#`, `@`, or `!`, you **must** wrap the value in double quotes inside the `.env` file, like: `DB_PASSWORD="my#password@123"`. Without quotes, the `#` character will be treated as the start of a comment and your password will be truncated.

> [!NOTE]
> **The database will be created automatically.** You do NOT need to manually create the database or run any SQL scripts. On first startup, the server will:
> - Create the `blood_bank_db` database.
> - Create the `inventory`, `donors`, and `requests` tables.
> - Seed the initial blood inventory with default stock levels.

---

### Running the Application

**Start the development server (with hot-reload):**
```bash
npm run dev
```

**Start the production server:**
```bash
npm start
```

**Expected terminal output on successful startup:**
```
LIFELINE Server listening on port 5000
Seeding initial blood inventory...
Database "blood_bank_db" initialized and tables verified successfully.
```

**Open the application in your browser:**
```
http://localhost:5000
```

You will see `🟢 MySQL Connected` in the top header, confirming live database connectivity.

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/inventory` | Fetch all blood type stock levels |
| `POST` | `/api/inventory/adjust` | Adjust units for a specific blood type |

### Donors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/donors` | Fetch all registered donors |
| `POST` | `/api/donors` | Register a new blood donor |

### Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/requests` | Fetch all hospital requisitions |
| `POST` | `/api/requests` | Submit a new blood requisition |
| `POST` | `/api/requests/:id/status` | Update requisition status (`fulfilled` / `cancelled`) |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat` | Query the clinical AI assistant |
| `POST` | `/api/ai/forecast` | Generate 7-day shortage risk forecast |
| `POST` | `/api/ai/match` | Run AI matching for a specific request |

---

## 🤖 AI Capabilities

### Blood Type Compatibility Matrix

The matching engine uses the following standard transfusion compatibility rules:

| Donor Type | Can Donate To |
|------------|---------------|
| `O-` | O-, O+, A-, A+, B-, B+, AB-, AB+ *(Universal Donor)* |
| `O+` | O+, A+, B+, AB+ |
| `A-` | A-, A+, AB-, AB+ |
| `A+` | A+, AB+ |
| `B-` | B-, B+, AB-, AB+ |
| `B+` | B+, AB+ |
| `AB-` | AB-, AB+ |
| `AB+` | AB+ *(Universal Recipient — can receive from all)* |

### Getting a Gemini API Key (Optional)
1. Visit [aistudio.google.com](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **"Create API Key"** and copy the key.
4. Paste it into your `.env` file as `GEMINI_API_KEY=your_key_here`.

Without an API key, the application falls back to a built-in offline heuristics engine for all AI features.

---

## 🗄️ Viewing Your Database

### Via MySQL Terminal
```bash
mysql -u root -p
```
```sql
USE blood_bank_db;
SHOW TABLES;
SELECT * FROM inventory;
SELECT * FROM donors;
SELECT * FROM requests;
```

### Via MySQL Workbench (GUI)
1. Open **MySQL Workbench** from your Start Menu.
2. Click your **Local Instance** connection.
3. In the left sidebar under **Schemas**, expand `blood_bank_db`.
4. Click any table to browse records visually.

---

## 🤝 Contributing

Contributions are welcome! Here is how to get started:

1. **Fork** this repository.
2. Create a new feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature description"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a **Pull Request** with a clear description of your changes.

---

## 📄 License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it with attribution.

---

<div align="center">

**Built with ❤️ and a lot of ☕**

*If this project helped you, please consider giving it a ⭐ on GitHub!*

</div>
