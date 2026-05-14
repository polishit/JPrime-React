-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 14, 2026 at 03:10 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fittrack`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `log_message` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `checkIn` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `attendance`
--
DELIMITER $$
CREATE TRIGGER `trg_after_insert_attendance` AFTER INSERT ON `attendance` FOR EACH ROW BEGIN
    INSERT INTO activity_logs (log_message)
    VALUES (
        CONCAT(
            'Check-in recorded. Attendance ID: ', NEW.attendance_id,
            ' | Member ID: ', NEW.member_id,
            ' | Check-In: ', NEW.checkIn
        )
    );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `audit_trail`
--

CREATE TABLE `audit_trail` (
  `id` int(11) NOT NULL,
  `table_name` varchar(50) NOT NULL,
  `record_id` int(11) NOT NULL,
  `action_type` varchar(20) NOT NULL,
  `changed_by` varchar(100) NOT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expenses_id` int(11) NOT NULL,
  `type` enum('equipment','salary','maintenance','utilities','other') NOT NULL,
  `amount` decimal(10,2) NOT NULL CHECK (`amount` >= 0),
  `expenseDate` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `recorded_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `expenses`
--
DELIMITER $$
CREATE TRIGGER `trg_after_insert_expense` AFTER INSERT ON `expenses` FOR EACH ROW BEGIN
    INSERT INTO activity_logs (log_message)
    VALUES (
        CONCAT(
            'New expense logged. Expense ID: ', NEW.expenses_id,
            ' | Type: ', NEW.type,
            ' | Amount: ₱', NEW.amount,
            ' | Date: ', NEW.expenseDate,
            ' | Notes: ', IFNULL(NEW.notes, 'N/A')
        )
    );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `member_id` int(11) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `joinDate` date NOT NULL,
  `expiryDate` date NOT NULL,
  `status` enum('active','expired','frozen') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `members`
--
DELIMITER $$
CREATE TRIGGER `trg_after_update_member` AFTER UPDATE ON `members` FOR EACH ROW BEGIN
    INSERT INTO activity_logs (log_message)
    VALUES (
        CONCAT(
            'Member ID ', OLD.member_id,
            ' (', OLD.fullName, ') was updated. ',
            'Status: ', OLD.status, ' → ', NEW.status, ' | ',
            'Plan ID: ', IFNULL(OLD.plan_id, 'NULL'),
            ' → ', IFNULL(NEW.plan_id, 'NULL'), ' | ',
            'Expiry: ', OLD.expiryDate, ' → ', NEW.expiryDate
        )
    );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_audit_member_update` AFTER UPDATE ON `members` FOR EACH ROW BEGIN
    IF OLD.status != NEW.status OR OLD.expiryDate != NEW.expiryDate THEN
        INSERT INTO audit_trail (
            table_name,
            record_id,
            action_type,
            changed_by,
            old_value,
            new_value
        ) VALUES (
            'members',
            OLD.member_id,
            'UPDATE',
            'system',
            CONCAT(
                'Status: ', OLD.status,
                ' | Plan ID: ', IFNULL(OLD.plan_id, 'NULL'),
                ' | Expiry: ', OLD.expiryDate
            ),
            CONCAT(
                'Status: ', NEW.status,
                ' | Plan ID: ', IFNULL(NEW.plan_id, 'NULL'),
                ' | Expiry: ', NEW.expiryDate
            )
        );
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payments_id` int(11) NOT NULL,
  `member_id` int(11) DEFAULT NULL,
  `walkin_name` varchar(100) DEFAULT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL CHECK (`amount` >= 0),
  `paymentDate` date NOT NULL,
  `paymentMode` enum('Cash','Card','UPI') NOT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `payments`
--
DELIMITER $$
CREATE TRIGGER `trg_after_insert_payment` AFTER INSERT ON `payments` FOR EACH ROW BEGIN
    INSERT INTO activity_logs (log_message)
    VALUES (
        CONCAT(
            'New payment recorded. Payment ID: ', NEW.payments_id,
            ' | Member ID: ', NEW.member_id,
            ' | Plan ID: ', IFNULL(NEW.plan_id, 'None'),
            ' | Amount: ₱', NEW.amount,
            ' | Mode: ', NEW.paymentMode,
            ' | Date: ', NEW.paymentDate
        )
    );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `plan_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `durationMonths` int(11) NOT NULL CHECK (`durationMonths` > 0),
  `price` decimal(10,2) NOT NULL CHECK (`price` >= 0),
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trainerassignments`
--

CREATE TABLE `trainerassignments` (
  `assignments_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `assignedDate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trainers`
--

CREATE TABLE `trainers` (
  `trainer_id` int(11) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','staff','trainer') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `users`
--
DELIMITER $$
CREATE TRIGGER `trg_after_update_user` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
    INSERT INTO activity_logs (log_message)
    VALUES (
        CONCAT(
            'User account updated. User ID: ', OLD.id,
            ' (', OLD.username, ') | ',
            'Role: ', OLD.role, ' → ', NEW.role, ' | ',
            'Active: ', OLD.is_active, ' → ', NEW.is_active
        )
    );
END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `idx_attendance_member_id` (`member_id`),
  ADD KEY `idx_attendance_checkIn` (`checkIn`);

--
-- Indexes for table `audit_trail`
--
ALTER TABLE `audit_trail`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expenses_id`),
  ADD KEY `fk_expense_user` (`recorded_by`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_members_status` (`status`),
  ADD KEY `idx_members_plan_id` (`plan_id`),
  ADD KEY `idx_members_expiryDate` (`expiryDate`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payments_id`),
  ADD KEY `fk_payment_plan` (`plan_id`),
  ADD KEY `idx_payments_member_id` (`member_id`),
  ADD KEY `idx_payments_paymentDate` (`paymentDate`);

--
-- Indexes for table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`plan_id`);

--
-- Indexes for table `trainerassignments`
--
ALTER TABLE `trainerassignments`
  ADD PRIMARY KEY (`assignments_id`),
  ADD KEY `fk_assignment_member` (`member_id`),
  ADD KEY `fk_assignment_trainer` (`trainer_id`);

--
-- Indexes for table `trainers`
--
ALTER TABLE `trainers`
  ADD PRIMARY KEY (`trainer_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_trail`
--
ALTER TABLE `audit_trail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expenses_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `member_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payments_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `plans`
--
ALTER TABLE `plans`
  MODIFY `plan_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainerassignments`
--
ALTER TABLE `trainerassignments`
  MODIFY `assignments_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainers`
--
ALTER TABLE `trainers`
  MODIFY `trainer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `fk_attendance_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `fk_expense_user` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `fk_member_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`plan_id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payment_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_payment_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`plan_id`);

--
-- Constraints for table `trainerassignments`
--
ALTER TABLE `trainerassignments`
  ADD CONSTRAINT `fk_assignment_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_assignment_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`) ON DELETE CASCADE;

--
-- Constraints for table `trainers`
--
ALTER TABLE `trainers`
  ADD CONSTRAINT `fk_trainer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
