# Hospital Management System (HMS)

View our website : [https://vithms.vercel.app](vithmsproject.vercel.app/) 

A comprehensive, multi-portal web application for hospital operations, built with **React 19**, **Vite 7**, and **Firebase (Auth & Firestore)**.

## 🚀 Key Features

### 1. Patient Portal
Allows patients to manage their healthcare journey from home.
- **Signup & Login**: Create an account via email or Google.
- **Medical Vitals**: Onboarding flow to record blood group, allergies, and chronic conditions.
- **Appointment Booking**: Select a specialty and a specific doctor to view and book active time slots.
- **Medical Dashboard**: View appointment status (Confirmed/Pending/Cancelled), vitals, and billing summaries.

### 2. Doctor Portal
Streamlines consultation management and patient records.
- **Claim Account**: Doctors can sign up using an email pre-registered by the Administrator.
- **Review Schedules**: Manage daily appointment queues.
- **Consultation Updates**: Approve or reject pending appointment requests with real-time progress tracking.
- **Patient History**: Access detailed medical history for patients assigned to the doctor.

### 3. Admin Portal
Provides complete oversight of hospital staff and operations.
- **Staff Management**: Add, update, or remove doctors from the directory.
- **Doctor Configuration**: Set up doctor specializations, availability, and specific time slots.
- **System Monitoring**: View all system data for administrative control.

---

## 🛠 Tech Stack
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Database**: [Google Cloud Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)

---

## ⚙️ Local Setup

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Run Development Server
Start the Vite development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### 3. Build for Production
Generate optimized production artifacts:
```bash
npm run build
```

### 4. Preview 
View the preview on local host 
```bash
npm run preview 
```

---

## 🔑 Accessing Portals

| Portal | URL Path | Login Method |
| :--- | :--- | :--- |
| **Patient** | `/patient-login` | Email/Password or Google Login |
| **Doctor** | `/doctor-login` | Email/Password (Claimed) or Google Login |
| **Admin** | `/admin-login` | Dedicated Admin Credentials |

### 🛠 Administrative Onboarding (First Run)
1. Navigate to `/admin-signup` to create the first system administrator.
2. Log in through `/admin-login` to begin adding doctors.
3. Doctors will then be able to register through `/doctor-signup`.

---

## 👨‍💻 Developed by
MOHIT NANDA KRISHNA PABBATI (24BCI0107)
Arjun M Kandhan             (24BDS0271) 
ABHINAV ANNAM               (24BCE0578)
DADIBATHINA GOWTHAM REDDY   (24BAI0224)
DAGGUPATI GAGAN SAI KOUSHIK (23BCE0397)




