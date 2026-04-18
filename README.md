# APSFL Cable Operator Management System

A full-stack web application to digitise your cable operator's notebook — manage customers, track payments, and monitor collections.

---

## 📁 Project Structure

```
apsfl/
├── backend/          ← Node.js + Express + MongoDB
│   ├── config/db.js
│   ├── models/       ← Customer, Payment schemas
│   ├── controllers/  ← Business logic
│   ├── routes/       ← API endpoints
│   ├── middleware/   ← Multer file upload
│   ├── jobs/         ← Cron job (daily expiry check)
│   └── server.js
│
└── frontend/         ← React + Vite + Tailwind CSS
    └── src/
        ├── pages/    ← Dashboard, Customers, Import, Payments
        ├── components/  ← Sidebar, PaymentModal, StatCard, etc.
        └── services/api.js
```

---

## 🚀 Setup Instructions

### Step 1 — Backend

```bash
cd backend

# 1. Copy env file
cp .env.example .env

# 2. Edit .env — add your MongoDB Atlas URI
#    MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/apsfl_cable

# 3. Install dependencies
npm install

# 4. Start server
npm run dev        # development (with nodemon)
npm start          # production
```

Server runs on: `http://localhost:5000`

---

### Step 2 — Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

> ✅ The Vite proxy forwards `/api/*` to `localhost:5000` automatically.
> No CORS issues in development.

---

## 🔌 API Reference

### Customers

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/customers`            | List all (+ search/filter) |
| GET    | `/api/customers/:id`        | Get one customer         |
| POST   | `/api/customers`            | Add manually             |
| PUT    | `/api/customers/:id`        | Update details           |
| DELETE | `/api/customers/:id`        | Delete                   |
| POST   | `/api/customers/import`     | Bulk import CSV/XLSX     |

**Query params for GET /api/customers:**

- `search` — name / CAF / phone
- `status` — PAID | UNPAID | PARTIAL
- `page`, `limit`

### Payments

| Method | Endpoint                        | Description           |
|--------|---------------------------------|-----------------------|
| POST   | `/api/payments/mark/:customerId` | Record payment       |
| POST   | `/api/payments/unpaid/:customerId` | Mark as unpaid     |
| GET    | `/api/payments/history/:customerId` | Payment history   |
| GET    | `/api/payments/all`             | All payments (+ date range) |

**POST /api/payments/mark/:id — Body:**

```json
{
  "paymentType": "FULL",     // or "PARTIAL"
  "amountPaid": 300,
  "planMonths": 1,
  "notes": "UPI payment"
}
```

### Dashboard

| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/dashboard/stats`        | All KPIs                 |
| GET    | `/api/dashboard/expiring`     | Expiring soon (?days=7)  |
| GET    | `/api/dashboard/monthly-chart`| Daily income for chart   |

---

## 📊 Dashboard KPIs Explained

| KPI | How it's calculated |
|-----|---------------------|
| **Total to Receive** | Sum of `planAmount` for all UNPAID + carry-over for PARTIAL customers |
| **Daily Income** | Sum of payments recorded today |
| **Monthly Income** | Sum of payments recorded this calendar month |
| **Expiring Soon** | PAID customers with `validTill` within next 5 days |

---

## 📅 Subscription Logic

- Each "month" = **30 days** (fixed, not calendar month)
- `validTill = paymentDate + (planMonths × 30)`
- Cron job runs at **9:00 AM every day**
- If `today > validTill` → status automatically set to `UNPAID`

---

## 🗂 CSV Import Format

Your CSV/Excel must have columns (any name variation accepted):

| Column | Accepted names |
|--------|----------------|
| Name | `name`, `customer name`, `customername`, `subscriber name` |
| Phone | `phone`, `mobile`, `mobile number`, `contact` |
| CAF | `caf`, `cafnumber`, `caf number`, `caf no`, `caf id` |

Duplicate CAF numbers are **automatically skipped**.

---

## ⚙️ Environment Variables

```env
PORT=5000
MONGO_URI=mongodb+srv://...
NODE_ENV=development
OPERATOR_SIGNUP_CODE=YOUR_SECRET_CODE_HERE # A secret code required for new operator signups
```
