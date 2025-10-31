# COVID-19 DBMS Architecture Documentation

## Overview
This document explains how data flows in the COVID-19 DBMS application, API usage, notification system, and future extensibility.

## Architecture Overview

### Frontend (React + TypeScript)
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui components
- **State Management**: React hooks (useState, useEffect)
- **Routing**: React Router

### Backend (Flask + Python)
- **Framework**: Flask REST API
- **Database**: PostgreSQL (via Supabase)
- **ORM**: SQLAlchemy
- **Authentication**: JWT tokens

### Database
- **Primary Database**: PostgreSQL (Supabase)
- **Tables**: users, patients, locations, case_records, vaccinations, state_stats

---

## Data Flow & API Usage

### How Data is Called

#### 1. **Backend API Endpoints (REST)**
Your application uses a **RESTful API** architecture where the frontend makes HTTP requests to the Flask backend.

**Base URL**: `http://localhost:5000/api` (configurable via `VITE_API_BASE`)

**API Structure**:
```
/api/auth/login          - POST - User authentication
/api/auth/register       - POST - User registration
/api/users               - GET/POST/PUT/DELETE - User management
/api/patients            - GET/POST/PUT/DELETE - Patient management
/api/vaccinations        - GET/POST/PUT/DELETE - Vaccination records
/api/case-records        - GET/POST/PUT/DELETE - Case records
/api/locations           - GET/POST/PUT/DELETE - Location management
/api/notifications/me    - GET - Patient notifications
/api/notifications/admin/due - GET - Admin notifications
/api/predict/state/{state} - GET - State predictions
```

#### 2. **Frontend API Calls**

**Method 1: Direct Fetch API** (Most Common)
```typescript
// Example from PatientDashboard.tsx
fetch(`${API_BASE}/api/notifications/me`, {
  headers: { Authorization: `Bearer ${sessionStorage.getItem("jwt") || ""}` }
})
```

**Method 2: Helper Function** (Available but not widely used)
```typescript
// From lib/api.ts
import { api } from "@/lib/api";
const data = await api("/users");
```

**Method 3: Supabase Direct** (Currently used for some components)
```typescript
// Example from VaccinationsManagement.tsx (INCONSISTENT - should use backend API)
const { data } = await supabase.from("vaccinations").select("*");
```

**⚠️ Note**: Some components (like `VaccinationsManagement.tsx`) currently use Supabase directly, which bypasses your backend API and security. This should be migrated to use the backend API for consistency.

#### 3. **Authentication Flow**

1. User logs in → `POST /api/auth/login`
2. Backend validates credentials and returns JWT token
3. Frontend stores token in `sessionStorage`
4. All subsequent API calls include token in `Authorization: Bearer <token>` header
5. Backend validates token via `@require_auth` decorator

**Example**:
```python
# Backend (auth.py)
@bp.post("/login")
def login():
    # Validate password
    token = generate_jwt(user.id, user.role.value)
    return jsonify({"token": token, "user": {...}})
```

```typescript
// Frontend (Login.tsx)
const res = await fetch(`${API_BASE}/api/auth/login`, {
  method: "POST",
  body: JSON.stringify({ email, password })
});
const { token } = await res.json();
sessionStorage.setItem("jwt", token);
```

---

## Notification System

### Current Implementation

#### 1. **Patient Notifications** (`/api/notifications/me`)

**Triggers**:
- **Vaccination Due**: If patient has exactly 1 dose, notifies 7 days before second dose is due (180 days after first)
- **Retest Reminder**: If patient has active COVID case, notifies 7 days before retest date (15 days after diagnosis)

**How it Works**:
1. Patient dashboard loads → Calls `GET /api/notifications/me`
2. Backend queries vaccinations and case records for that patient
3. Calculates due dates and checks if within 7-day window
4. Returns array of notification messages
5. Frontend displays as toast notifications

**Code Flow**:
```python
# Backend (notifications.py)
@bp.get("/me")
def my_notifications():
    # Query vaccinations for patient
    first = s.scalars(select(Vaccination)...).all()
    if len(first) == 1:
        due_date = first_date + timedelta(days=180)
        if today >= due_date - timedelta(days=7):
            messages.append({"type": "vaccination_due", ...})
```

```typescript
// Frontend (PatientDashboard.tsx)
fetch(`${API_BASE}/api/notifications/me`, {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(json => {
  json.notifications.forEach(n => toast(n.title + ": " + n.message));
});
```

#### 2. **Admin Notifications** (`/api/notifications/admin/due`)

Similar logic but returns list of all patients with due notifications for admin dashboard.

---

## Vaccination System

### Current Behavior
- **Issue**: Currently allows different vaccine types for first and second dose
- **Problem**: Medical requirement - second dose must match first dose type

### Fix Applied
The backend now enforces that:
1. When creating a second dose, it must match the first dose's vaccine type
2. When updating vaccine type, it validates against existing doses

**Implementation**:
```python
# Backend (crud.py - create_vax)
existing_vax = s.scalars(select(Vaccination)...).all()
if len(existing_vax) >= 1:
    first_vax_type = existing_vax[0].vaccine_type
    if vaccine_type != first_vax_type:
        return jsonify({"error": "Second dose must match first dose"}), 400
```

---

## Adding Email Notifications

### Future Extension Architecture

#### 1. **Backend Email Service**

Create a new service file: `Backend/app/services/email.py`

```python
from flask_mail import Mail, Message
from ..config import Config

mail = Mail()

def send_notification_email(patient_email: str, notification: dict):
    """Send email notification to patient"""
    msg = Message(
        subject=f"COVID-19 DBMS: {notification['title']}",
        recipients=[patient_email],
        body=f"{notification['message']}\nDue Date: {notification.get('due_date', 'N/A')}"
    )
    mail.send(msg)
```

#### 2. **Update Notification Endpoint**

Modify `Backend/app/blueprints/notifications.py`:

```python
from ..services.email import send_notification_email

@bp.get("/me")
def my_notifications():
    # ... existing notification logic ...
    
    # Send emails for each notification
    user_email = s.get(User, user_id).email
    for msg in messages:
        send_notification_email(user_email, msg)
    
    return jsonify({"notifications": messages})
```

#### 3. **Configuration**

Add to `Backend/app/config.py`:
```python
class Config:
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
```

#### 4. **Install Dependencies**

```bash
pip install flask-mail
```

Add to `Backend/requirements.txt`:
```
flask-mail
```

#### 5. **Initialize in app.py**

```python
from flask_mail import Mail
from .services.email import mail

def create_app():
    # ...
    mail.init_app(app)
    # ...
```

### Dashboard Notifications

Dashboard notifications are already implemented:
- **Patient Dashboard**: Shows notifications as toast messages on load
- **Admin Dashboard**: Shows upcoming notifications in the Notifications tab

To enhance:
1. Add persistent notification badges/indicators
2. Add notification history/archive
3. Add mark-as-read functionality

---

## Data Consistency Notes

### Current Issues
1. **VaccinationsManagement** uses Supabase directly instead of backend API
   - **Fix**: Migrate to use `/api/vaccinations` endpoints
   - This ensures authorization checks and business logic are enforced

2. **PatientDashboard** uses Supabase for some queries
   - **Fix**: Use backend API endpoints like `/api/patients/me`

### Recommended Migration
Replace Supabase direct calls with backend API calls:
```typescript
// ❌ Current (Supabase direct)
const { data } = await supabase.from("vaccinations").select("*");

// ✅ Recommended (Backend API)
const res = await fetch(`${API_BASE}/api/vaccinations`, {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
```

---

## API Security

### Authentication
- JWT tokens stored in `sessionStorage`
- Tokens expire (configured in `generate_jwt`)
- Protected routes use `@require_auth(["admin", "manager"])` decorator

### Authorization
- Role-based access control (admin, manager, user)
- Database-level RLS policies for additional security

---

## Summary

### Current Architecture:
1. ✅ **REST API Backend** (Flask) - Main data source
2. ⚠️ **Mixed Frontend Access** - Some components use Supabase directly (needs migration)
3. ✅ **JWT Authentication** - Secure token-based auth
4. ✅ **Notifications System** - Real-time dashboard notifications
5. ✅ **Vaccination Validation** - Enforces same vaccine type for doses

### Future Enhancements:
1. 📧 **Email Notifications** - Add email service
2. 🔄 **Migrate Supabase Calls** - Use backend API consistently
3. 📊 **Notification History** - Persistent notification storage
4. 🔔 **Real-time Updates** - WebSocket or polling for live notifications

