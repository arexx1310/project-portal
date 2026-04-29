# 🎓 BTP Management System

A full-stack web application for managing Bachelor's Technical Projects (BTP) at NSUT. It streamlines the entire BTP lifecycle — from session creation and group formation to project proposals, supervision requests, and report submissions — for Admins, Faculty, and Students.

---

## 📌 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Roles & Permissions](#roles--permissions)

---

## ✨ Features

### 👤 Admin
- Manage faculty and student records (individual or bulk via Excel upload)
- Create and manage BTP sessions with configurable deadlines
- Manage departments and department-level configurations
- View system-wide dashboard

### 🧑‍🏫 Faculty
- Configure BTP preferences (topics, capacity, etc.)
- View and respond to supervision requests from student groups
- Manage supervised groups and track project progress
- Submit and manage project proposals on behalf of groups
- View reports submitted by supervised groups

### 🎓 Student
- Form groups and send/receive group formation invites
- Browse available faculty and send supervision requests
- Submit project proposals for faculty/admin approval
- View BTP-related notifications and updates
- Manage personal profile

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | React (Vite), React Router, Axios   |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB (Mongoose ODM)              |
| Auth       | JWT-based authentication            |
| File Upload| Multer (Excel/CSV bulk uploads)     |
| Scheduling | Node-cron (deadline enforcement)    |
| Deployment | Vercel (client), configurable (server) |

---

## 📁 Project Structure

```
root/
├── client/                         # React frontend
│   └── my-project/
│       ├── public/
│       └── src/
│           ├── assets/             # Static images
│           ├── components/
│           │   ├── admin/          # Faculty & student cards
│           │   ├── auth/           # Protected route wrapper
│           │   ├── common/         # Shared UI (modals, header)
│           │   └── layout/         # App layout, sidebar
│           ├── context/
│           │   └── AuthContext.jsx # Global auth state
│           ├── pages/
│           │   ├── Admin/          # Admin-specific pages
│           │   ├── Auth/           # Login pages
│           │   ├── Faculty/        # Faculty-specific pages
│           │   └── Student/        # Student-specific pages
│           ├── services/
│           │   ├── Admin/          # Admin API calls
│           │   ├── Faculty/        # Faculty API calls
│           │   └── Student/        # Student API calls
│           └── utils/
│               ├── apiPaths.js     # Centralized API route constants
│               └── axiosInstance.js # Axios config with interceptors
│
└── server/                         # Express backend
    ├── config/
    │   ├── db.js                   # MongoDB connection
    │   ├── initAdmin.js            # Seeds default admin
    │   └── multer.js               # File upload config
    ├── controllers/
    │   ├── admin/                  # Admin business logic
    │   ├── faculty/                # Faculty business logic
    │   ├── student/                # Student business logic
    │   ├── cron/                   # Scheduled deadline jobs
    │   ├── authController.js
    │   └── notificationController.js
    ├── middleware/
    │   ├── protect.js              # JWT verification
    │   ├── authorize.js            # Role-based access control
    │   ├── facultyAccess.js        # Faculty-only guard
    │   ├── studentAccess.js        # Student-only guard
    │   ├── errorHandler.js         # Global error handler
    │   └── upload.js               # Multer middleware
    ├── models/                     # Mongoose schemas
    │   ├── User.js
    │   ├── Student.js
    │   ├── Faculty.js
    │   ├── Group.js
    │   ├── GroupFormationInvite.js
    │   ├── Project.js
    │   ├── ProjectApprovalRequest.js
    │   ├── Session.js
    │   ├── DepartmentConfig.js
    │   └── Notifications.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── adminRoutes.js
    │   ├── facultyRoutes.js
    │   └── studentRoutes.js
    └── server.js                   # App entry point
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB instance (local or Atlas)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/btp-management-system.git
cd btp-management-system
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (see [Environment Variables](#environment-variables)).

```bash
nodemon server.js
```

### 3. Setup the Client

```bash
cd client/my-project
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000` (or your configured port).

---

## 🔐 Environment Variables

Create a `.env` file inside the `server/` directory:

```env
MONGODB_URL=your_mongodb_connection_string
PORT=5000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=yourpassword
JWT_SECRET=your_jwt_secret_key
NODE_ENV="development"
FRONTEND_URL=http://localhost:5173
```

For the client, create a `.env` inside client/my-project directory:

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🔗 API Overview

| Prefix          | Description                          |
|-----------------|--------------------------------------|
| `/api/auth`     | Login for all roles                  |
| `/api/admin`    | Admin-only operations                |
| `/api/faculty`  | Faculty-only operations              |
| `/api/student`  | Student-only operations              |

Authentication is handled via JWT Bearer tokens. Protected routes use the `protect` middleware, and role-specific routes are further guarded by `authorize`, `facultyAccess`, or `studentAccess` middleware.

---

## 👥 Roles & Permissions

| Feature                    | Admin | Faculty | Student |
|----------------------------|:-----:|:-------:|:-------:|
| Manage Sessions            | ✅    | ❌      | ❌      |
| Upload Faculty/Students    | ✅    | ❌      | ❌      |
| Manage Departments         | ✅    | ❌      | ❌      |
| Configure BTP Preferences  | ❌    | ✅      | ❌      |
| Handle Supervision Requests| ❌    | ✅      | ❌      |
| View Supervised Groups     | ❌    | ✅      | ❌      |
| Form Groups & Send Invites | ❌    | ❌      | ✅      |
| Submit Project Proposals   | ❌    | ❌      | ✅      |
| View Notifications         | ❌    | ✅      | ✅      |

---

## 📄 License

This project was developed as part of a Bachelor's Technical Project at NSUT. All rights reserved.
