
JPrime FitTrack — Gym Management System

"Train Smart. Track Better."

Overview
JPrime FitTrack is a web-based Gym Management System developed for JPrime Fitness Gym, a newly established fitness center in need of a centralized and organized digital platform. The system replaces manual and paper-based record keeping with a structured, database-driven solution that streamlines daily gym operations across three core modules.
Features

Membership Module — Register new gym members, assign and manage membership plans, track membership status (active, expired, frozen), and assign trainers to members.
Attendance & Payments Operations Module — Record daily member check-ins with automatic timestamps, process membership payments, select payment modes (Cash, Card, UPI), and view payment history per member and per plan.
Resource Operations Module — Manage system user accounts with role-based access (admin, staff), manage trainer profiles, log and categorize gym expenses (equipment, salary, maintenance), and control account activation and deactivation.

Tech Stack
LayerTechnologyFrontendReact.jsBackendExpress.js (Node.js)DatabaseMySQLRuntimeNode.jsDatabase ToolXAMPP / phpMyAdminFontPoppinsDesign ToolsFigma, draw.io, Canva
Project Structure
jprime-fittrack/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (Members, Attendance, etc.)
│   │   └── App.jsx         # Main app entry
├── server/                 # Express backend
│   ├── routes/             # API route handlers
│   ├── controllers/        # Business logic
│   ├── config/             # Database connection
│   └── index.js            # Server entry point
├── database_setup.sql      # MySQL schema and seed data
└── README.md
Database
The system uses a normalized relational MySQL database named fittrack, consisting of 8 tables with 8 foreign key relationships:
users · plans · members · trainers · trainerAssignments · attendance · payments · expenses
Installation
Prerequisites

Node.js (v18+)
MySQL / XAMPP
npm

Steps

Clone the repository

bashgit clone https://github.com/your-username/jprime-fittrack.git
cd jprime-fittrack

Set up the database

Open phpMyAdmin
Create a database named fittrack
Import database_setup.sql


Configure the backend

bashcd server
npm install
Create a .env file inside /server:
envDB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=fittrack
PORT=5000

Start the backend

bashnpm run dev

Install and start the frontend

bashcd ../client
npm install
npm run dev

Open in browser

http://localhost:5173

Log in using demo credentials

Admin: admin / admin123
Staff: staff / staff123



API Endpoints
MethodEndpointDescriptionPOST/api/auth/loginUser loginGET/api/membersGet all membersPOST/api/membersAdd new memberPUT/api/members/:idUpdate memberGET/api/attendanceGet attendance logsPOST/api/attendanceRecord check-inGET/api/paymentsGet payment recordsPOST/api/paymentsRecord paymentGET/api/expensesGet expensesPOST/api/expensesLog expenseGET/api/trainersGet trainersGET/api/plansGet membership plans
Developers
NameRoleModulePolinag, Paul Jude A.Backend Developer, Database DesignerMembership ModuleNabor, Ian Xersan V.Backend Developer, TesterOperations ModulePanibe, Mark John B.System Administrator, Backend DeveloperSystem Management Module