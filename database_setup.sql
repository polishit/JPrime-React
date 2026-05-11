-- ============================================================
-- JPrime FitTrack – Database Setup
-- Run this in phpMyAdmin or MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS fittrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fittrack;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','staff','trainer') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
  plan_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  durationMonths INT NOT NULL CHECK (durationMonths > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  member_id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(100) NOT NULL,
  gender ENUM('Male','Female','Other'),
  dob DATE,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(100) UNIQUE,
  address TEXT,
  plan_id INT,
  joinDate DATE NOT NULL,
  expiryDate DATE NOT NULL,
  status ENUM('active','expired','frozen') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_member_plan FOREIGN KEY (plan_id) REFERENCES plans(plan_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS trainers (
  trainer_id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  specialization VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT UNIQUE,
  CONSTRAINT fk_trainer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS trainerAssignments (
  assignments_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  trainer_id INT NOT NULL,
  assignedDate DATE NOT NULL,
  CONSTRAINT fk_assignment_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  checkIn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  payments_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  paymentDate DATE NOT NULL,
  paymentMode ENUM('Cash','Card','UPI') NOT NULL,
  remarks TEXT,
  CONSTRAINT fk_payment_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_plan FOREIGN KEY (plan_id) REFERENCES plans(plan_id)
);

CREATE TABLE IF NOT EXISTS expenses (
  expenses_id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('equipment','salary','maintenance','utilities','other') NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  expenseDate DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by INT,
  CONSTRAINT fk_expense_user FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Users (plain-text passwords for demo; hash in production)
INSERT IGNORE INTO users (username, password, role) VALUES
  ('admin', 'admin123', 'admin'),
  ('staff', 'staff123', 'staff');

-- Plans
INSERT IGNORE INTO plans (name, durationMonths, price, description) VALUES
  ('Monthly Basic',      1,  1500.00, 'Basic gym access for 1 month'),
  ('Quarterly Standard', 3,  4500.00, '3-month access with trainer'),
  ('Half-Year Premium',  6,  7000.00, '6-month full access'),
  ('Annual VIP',         12, 12000.00,'Full year VIP membership');

-- Trainers
INSERT IGNORE INTO trainers (fullName, phone, specialization) VALUES
  ('Marcus Rivera',  '09353313599', 'Strength Training'),
  ('Ana Reyes',      '09171234567', 'Yoga & Flexibility'),
  ('Bong Santos',    '09209876543', 'Cardio & Endurance');

-- Members
INSERT IGNORE INTO members (fullName, gender, dob, phone, email, address, plan_id, joinDate, expiryDate, status) VALUES
  ('Juan Dela Cruz',  'Male',   '1995-05-10', '09270001111', 'juan@email.com',   'Manila',  2, '2026-01-01', '2026-04-01', 'active'),
  ('Maria Santos',    'Female', '1998-08-22', '09270002222', 'maria@email.com',  'Quezon',  1, '2026-02-01', '2026-03-01', 'expired'),
  ('Carlos Mendoza',  'Male',   '1990-03-15', '09270003333', 'carlos@email.com', 'Makati',  2, '2026-01-15', '2026-04-15', 'active'),
  ('Paul Jude Polinag','Male',  '1993-11-02', '09270004444', 'paul@email.com',   'Pasig',   4, '2025-03-01', '2026-03-01', 'active'),
  ('Ana Lim',         'Female', '2000-07-19', '09270005555', 'ana@email.com',    'Taguig',  3, '2025-09-01', '2026-03-01', 'expired');

-- Trainer assignments
INSERT IGNORE INTO trainerAssignments (member_id, trainer_id, assignedDate) VALUES
  (1, 1, '2026-01-01'),
  (3, 1, '2026-01-15'),
  (4, 2, '2025-03-01'),
  (5, 3, '2025-09-01');

-- Sample payments
INSERT IGNORE INTO payments (member_id, plan_id, amount, paymentDate, paymentMode, remarks) VALUES
  (3, 2, 4500.00, '2026-01-15', 'Cash',  'Quarterly renewal'),
  (4, 4, 12000.00,'2025-03-01', 'Card',  'Annual VIP signup'),
  (1, 2, 4500.00, '2026-01-01', 'Cash',  'Initial payment'),
  (2, 1, 1500.00, '2026-02-01', 'UPI',   'Monthly basic'),
  (5, 3, 7000.00, '2025-09-01', 'Card',  'Half-year premium');

-- Sample expenses
INSERT IGNORE INTO expenses (type, amount, expenseDate, notes) VALUES
  ('equipment',    25000.00, '2025-01-10', 'Treadmill purchase'),
  ('salary',       15000.00, '2026-01-31', 'Staff salary January'),
  ('maintenance',   3500.00, '2026-02-05', 'AC servicing'),
  ('utilities',     5000.00, '2026-02-15', 'Electric bill February'),
  ('salary',       15000.00, '2026-02-28', 'Staff salary February'),
  ('utilities',     4800.00, '2026-03-15', 'Electric bill March');
