# StoreRating Platform 🌟

A premium, modern web application that allows users to rate and review local stores, provides store owners with outlet analytics, and empowers system administrators to manage accounts and monitor store performance.

---

## 🚀 Key Features

### 1. System Administrator Dashboard
*   **Overview & Analytics**: Live stats (total users, total stores, total ratings) with a real-time **Recent Ratings** log feed.
*   **User Management**: View, search, filter, and modify user accounts. Register new user profiles or delete existing ones.
*   **Store Management**: Add new store outlets with custom logos, update store details, and link outlets to registered store owners.
*   **Profile Security**: Update administrator passwords with robust password strength checks.

### 2. User & Store Owner Experience
*   **Outlet Discovery**: Clean grid layout for normal users to search outlets by name/location, sort by name, address, or community rating, and submit/update store ratings.
*   **OTP Email Verification**: Robust registration and login protection via Gmail SMTP OTP (One-Time Password) verification.
*   **Resend OTP**: Cooldown-protected OTP resend flow on the email verification page to avoid email spam.

---

## 🛠️ Tech Stack

### Frontend
*   **Core**: React (Vite-powered, ES Modules)
*   **Icons**: `lucide-react`
*   **Styling**: Pure CSS (Luminous Glassmorphism Theme) with variables, CSS keyframes, micro-interactions, and responsive fluid layouts.

### Backend
*   **Runtime**: Node.js with Express
*   **Database**: MySQL (relational structure)
*   **Authentication**: JSON Web Token (JWT) & bcryptjs (password hashing)
*   **Mailer Utility**: Nodemailer with Gmail SMTP integration

---

## 💾 Database Schema

### `users`
*   `id` (INT, Primary Key, Auto Increment)
*   `name` (VARCHAR)
*   `email` (VARCHAR, Unique)
*   `password` (VARCHAR)
*   `address` (VARCHAR)
*   `role` (ENUM: `'normal'`, `'owner'`, `'admin'`)
*   `is_verified` (TINYINT)
*   `verification_code` (VARCHAR)

### `stores`
*   `id` (INT, Primary Key, Auto Increment)
*   `name` (VARCHAR)
*   `email` (VARCHAR)
*   `address` (VARCHAR)
*   `logo_url` (VARCHAR)
*   `owner_id` (INT, Foreign Key to `users.id`)

### `ratings`
*   `id` (INT, Primary Key, Auto Increment)
*   `user_id` (INT, Foreign Key to `users.id`)
*   `store_id` (INT, Foreign Key to `stores.id`)
*   `rating` (INT, 1 to 5)
*   `created_at` (TIMESTAMP)

---

## 📡 API Endpoints

### Auth Routes (`/api/auth`)
*   `POST /register` — Register a new account (normal/owner) and trigger verification OTP.
*   `POST /login` — Authenticate credentials. If unverified, returns a status indicating email verification is required.
*   `POST /verify` — Submit 6-digit OTP code to verify account and receive JWT access token.
*   `POST /resend-otp` — Generate and send a new OTP to user's registered email with a 30s cooldown.
*   `POST /forgot-password` — Generates a temporary reset password and emails it.
*   `PUT /change-password` — Authenticated route to update account passwords.

### Admin Routes (`/api/admin`)
*   `GET /stats` — Retrieve general platform metrics.
*   `GET /users` & `POST /users` — Fetch and create platform users.
*   `GET /stores` & `POST /stores` — Retrieve all stores or register new outlets with logo uploads.
*   `GET /ratings` — Retrieve and sort all system ratings.

### User Routes (`/api/user`)
*   `GET /stores` — Fetch stores with their average ratings and the current user's rating.
*   `POST /ratings` & `PUT /ratings/:id` — Submit or update outlet feedback ratings.

---

## ⚙️ Installation & Running Guide

### Prerequisites
*   Node.js (v16+)
*   MySQL Server running locally on port `3306`

### 1. Backend Setup
1. Open the `/backend` folder.
2. Create or verify the `.env` file configuration:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=YOUR_MYSQL_PASSWORD
   DB_NAME=store_rating_db
   JWT_SECRET=store_rating_secret_key_123
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=YOUR_GMAIL_ADDRESS
   SMTP_PASS=YOUR_GMAIL_APP_PASSWORD
   ```
3. Install dependencies and start development server:
   ```bash
   npm install
   npm run dev
   ```

### 2. Frontend Setup
1. Open the `/frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.
