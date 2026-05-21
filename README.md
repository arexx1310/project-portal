# 🎓 Academic Project Management System

A full-stack web application for managing Bachelor's and Master's Technical Projects (BTP/MTP) at NSUT. It streamlines the entire project lifecycle — from session creation and group formation to supervisor assignment, progress tracking, document submissions, and publication management — for Admins, Faculty, and Students.

Built on Node.js, Express, MongoDB, and Google Drive API, the system supports five roles: Admin, HOD, Project Committee Head and Members, Faculty/Supervisor, and Student. Key features include bulk Excel-based student and faculty onboarding, peer group formation with TTL-expiring invites, multi-supervisor project approval via atomic transactions, weekly progress updates with faculty feedback threads, Drive-integrated PDF document management, publication lifecycle tracking from Idea to Published, and automated cron jobs for semester transitions, deadline reminders, and session-end cleanup.

Security is enforced through Helmet HTTP hardening, JWT stored in HttpOnly cookies, role and sub-role authorization middleware, NoSQL injection prevention, bcrypt password hashing, and rate limiting. Performance is optimized via JWT-embedded profiles eliminating auth-layer database queries, parallel async queries using Promise.all(), $facet aggregation for paginated responses, lean() on all read queries, and compound indexes on all high-frequency query patterns.

---

## 📌 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Google Drive Setup](#-google-drive-setup)
- [Email (SMTP) Setup](#-email-smtp-setup)
- [API Overview](#api-overview)
- [Roles & Permissions](#roles--permissions)

---

## ✨ Features

### 👤 Admin
- Manage faculty and student records (individual or bulk via Excel upload)
- Create and manage BTP/MTP sessions with configurable deadlines
- Manage departments and department-level configurations
- Update student and faculty passwords with strength validation

### 🏛 HOD & Project Committee Head
- View full department overview: groups, projects, publications across all sessions
- Send notifications to the entire department
- Configure BTP/MTP preferences (group size limits, supervisor caps, registration deadlines)
- Generate and export department-level reports

### 🧑‍🏫 Faculty / Supervisor
- Configure BTP preferences and supervision capacity
- View and respond to supervision requests from student groups
- Manage supervised groups and track weekly project progress
- Assign tasks with due dates and add structured feedback
- Manage publication records across all supervised projects

### 🎓 Student
- Form groups and send/receive peer group formation invites (UG)
- Select supervisor directly (PG — MTP)
- Submit project proposals with ranked supervisor preferences
- Submit weekly progress updates with document attachments
- Upload project documents (PDF) to Google Drive
- Track publications from Idea → Submitted → Accepted → Published
- View BTP/MTP notifications and updates

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT stored in HttpOnly cookies |
| File Upload | Multer (Excel/CSV bulk uploads) |
| File Storage | Google Drive API v3 (PDF documents) |
| Scheduling | node-cron (semester transitions, reminders, cleanup) |
| Email | Nodemailer via SMTP |
| Deployment | Vercel (client), configurable (server) |

---

## 📁 Project Structure

```
root/
├── client/
│   └── my-project/
│       ├── public/
│       └── src/
│           ├── assets/
│           ├── components/
│           ├── context/
│           │   └── AuthContext.jsx       # Global auth state
│           ├── pages/
│           │   ├── Admin/
│           │   ├── Auth/
│           │   ├── Faculty/
│           │   └── Student/
│           ├── services/
│           │   ├── Admin/
│           │   ├── Faculty/
│           │   └── Student/
│           └── utils/
│               ├── apiPaths.js           # Centralized API route constants
│               └── axiosInstance.js      # Axios config with interceptors
│
└── server/
    ├── config/
    │   ├── db.js                         # MongoDB connection
    │   ├── initAdmin.js                  # Seeds default admin on startup
    │   ├── multer.js                     # File upload config
    │   └── googledrive.js                # Google Drive OAuth2 client
    ├── controllers/
    │   ├── admin/
    │   ├── faculty/
    │   ├── student/
    │   ├── cron/                         # Scheduled jobs
    │   ├── authController.js
    │   └── notificationController.js
    ├── middleware/
    │   ├── protect.js                    # JWT verification
    │   ├── authorize.js                  # Role-based access control
    │   ├── facultyAccess.js
    │   ├── studentAccess.js
    │   ├── errorHandler.js
    │   └── upload.js
    ├── models/
    │   ├── User.js
    │   ├── Student.js
    │   ├── Faculty.js
    │   ├── Group.js
    │   ├── GroupFormationInvite.js
    │   ├── Project.js
    │   ├── ProjectApprovalRequest.js
    │   ├── Publication.js
    │   ├── WorkItem.js
    │   ├── Session.js
    │   ├── DepartmentConfig.js
    │   └── Notifications.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── adminRoutes.js
    │   ├── facultyRoutes.js
    │   └── studentRoutes.js
    ├── getToken.js                       # Run once to get Google Drive refresh token
    └── server.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB instance (local or Atlas)
- Google Cloud project with Drive API enabled
- A Gmail account for SMTP (or any SMTP provider)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/btp-general.git
cd project-portal
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory — see [Environment Variables](#environment-variables), [Google Drive Setup](#-google-drive-setup), and [Email Setup](#-email-smtp-setup) below.

```bash
nodemon server.js
```

### 3. Setup the Client

```bash
cd client/my-project
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and backend at `http://localhost:5000`.

---

## 🔐 Environment Variables

Create a `.env` file inside the `server/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URL=your_mongodb_connection_url

# Admin Seed
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password

# JWT
JWT_SECRET=your_jwt_secret

# Frontend
FRONTEND_URL=http://localhost:5173

# Google Drive (see Google Drive Setup below)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=token_obtained_from_getToken.js
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_drive_folder_id

# Email / SMTP (see Email Setup below)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
APP_NAME=BTP Management System
```

Create a `.env` inside `client/my-project/`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 📁 Google Drive Setup

The system uploads project documents (PDFs) directly to a Google Drive folder using OAuth2. Follow these steps **once** before running the server.

### Step 1 — Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **New Project**, give it a name, and create it
3. In the sidebar go to **APIs & Services → Library**
4. Search for **Google Drive API** and click **Enable**

### Step 2 — Create OAuth2 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External**
   - Fill in app name, support email, and developer email
   - Add scope: `https://www.googleapis.com/auth/drive`
   - Add your own Google email as a **Test User**
4. Back on Create Credentials:
   - Application type: **Desktop app**
   - Give it any name and click **Create**
5. Copy your **Client ID** and **Client Secret** → add to `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Step 3 — Get the Refresh Token

The project includes `server/getToken.js` for this. Open it and replace the placeholder values with your credentials:

```javascript
const oauth2Client = new google.auth.OAuth2(
  "YOUR_CLIENT_ID",       // ← paste your Client ID
  "YOUR_CLIENT_SECRET",   // ← paste your Client Secret
  "urn:ietf:wg:oauth:2.0:oob"
);
```

Then run it:

```bash
cd server
node getToken.js
```

1. Open the printed URL in your browser
2. Sign in with your Google account and allow Drive access
3. Copy the authorization code shown on screen
4. Paste it into the terminal when prompted
5. Copy the printed **refresh token** → add to `.env` as `GOOGLE_REFRESH_TOKEN`

> **Note:** The refresh token is generated only once. Store it safely — if you lose it, repeat this step.

### Step 4 — Create the Root Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder (e.g. `BTP Documents`)
3. Open the folder — the URL will look like:
   `https://drive.google.com/drive/folders/1ABC123XYZxxxxxxx`
4. Copy the ID at the end → add to `.env` as `GOOGLE_DRIVE_ROOT_FOLDER_ID`

> Make sure the Google account you authorized in Step 3 has **Editor** access to this folder.

---

## 📧 Email (SMTP) Setup

The system sends email notifications (deadline reminders, approval updates, etc.) via SMTP. The easiest option is Gmail with an App Password.

### Using Gmail

> Regular Gmail passwords won't work here. You need an **App Password** — a 16-character code Gmail generates for third-party apps.

**Step 1 — Enable 2-Step Verification**
1. Go to your [Google Account](https://myaccount.google.com/)
2. Navigate to **Security**
3. Under "How you sign in to Google", enable **2-Step Verification**

**Step 2 — Generate an App Password**
1. Go to **Security → 2-Step Verification → App passwords**
   (or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) directly)
2. Click **Create**, give it a name like `BTP System`, and click **Create**
3. Copy the **16-character password** shown on screen

**Step 3 — Add to `.env`**

```env
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
APP_NAME=BTP Management System
```

> Spaces in the App Password are fine — Gmail accepts them with or without spaces.

### Using Another SMTP Provider

If you use Outlook, SendGrid, Mailgun, etc., update the Nodemailer transport config in the server with the appropriate `host`, `port`, and credentials for your provider.

---

## 🔗 API Overview

| Prefix | Endpoints | Description |
|---|---|---|
| `/api/auth` | 4 | Login, logout, current-user, admin login |
| `/api/admin` | 20 | Session CRUD, department CRUD, student/faculty CRUD + bulk upload, password update |
| `/api/faculty` | 35+ | Profile, notifications, config, proposals, groups, projects, tasks, publications, reports |
| `/api/student` | 30+ | Profile, notifications, group formation, invites, proposals, projects, weekly updates, documents, publications |

Authentication is handled via JWT stored in HttpOnly cookies. Protected routes use the `protect` middleware; role-specific routes are further guarded by `authorize`, `facultyAccess`, or `studentAccess` middleware.

---

## 👥 Roles & Permissions

| Feature | Admin | HOD | BTP Committee Head | Faculty / Supervisor | Student |
|---|:---:|:---:|:---:|:---:|:---:|
| Manage Sessions | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bulk Upload Students / Faculty (Excel) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Departments | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update Student / Faculty Passwords | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configure BTP / MTP Preferences | ❌ | ❌ | ✅ | ❌ | ❌ |
| Department-wide Notifications | ❌ | ✅ | ✅ | ❌ | ❌ |
| View Department Overview & Reports | ❌ | ✅ | ✅ | ❌ | ❌ |
| Manage Faculty in Department | ❌ | ✅ | ❌ | ❌ | ❌ |
| Handle Supervision / Approval Requests | ❌ | ❌ | ❌ | ✅ | ❌ |
| View & Manage Supervised Groups | ❌ | ❌ | ❌ | ✅ | ❌ |
| Assign Tasks & Give Feedback | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage Publications | ❌ | ❌ | ❌ | ✅ | ✅ |
| Form Groups & Send Invites (UG) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Submit Project Proposals | ❌ | ❌ | ❌ | ❌ | ✅ |
| Submit Weekly Progress Updates | ❌ | ❌ | ❌ | ❌ | ✅ |
| Upload Project Documents (Google Drive) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Select Supervisor (PG — MTP) | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Notifications | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 📄 License

This project was developed as part of a Bachelor's Technical Project at NSUT. All rights reserved.
