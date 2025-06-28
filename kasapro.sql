CREATE DATABASE IF NOT EXISTS kasapro;
USE kasapro;

CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    rayon VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM('income', 'installment', 'expense') NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    method ENUM('cash', 'transfer') NOT NULL,
    date DATE NOT NULL,
    member_id VARCHAR(36),
    month_id VARCHAR(2),
    year VARCHAR(4),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_name VARCHAR(255) NOT NULL DEFAULT 'KasaPro',
    active_month VARCHAR(2) NOT NULL DEFAULT '6',
    monthly_fee DECIMAL(15,2) NOT NULL DEFAULT 100000,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('bendahara', 'pengawas') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT IGNORE INTO settings (organization_name, active_month, monthly_fee) 
VALUES ('KasaPro', '6', 100000);

-- Insert a test user (password: 'password', replace with bcrypt hash)
INSERT IGNORE INTO users (username, password, role) 
VALUES ('admin', '$2b$10$YOUR_HASHED_PASSWORD', 'bendahara');