-- Create Database
CREATE DATABASE IF NOT EXISTS `u463483684_abdul_gani_sho`;
USE `u463483684_abdul_gani_sho`;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    short_desc TEXT,
    description TEXT,
    features JSON,
    image_url VARCHAR(500),
    images JSON,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    product_id VARCHAR(100),
    status ENUM('new', 'contacted', 'closed') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Products
INSERT INTO products (id, name, category, short_desc, description, features, images, sort_order) VALUES
('disc-plough', 'Disc Plough', 'Ploughs', 'Heavy-duty disc plough for primary tillage operations.', 'Our premium Disc Plough is engineered for efficient primary tillage in tough soil conditions. Built with high-carbon steel discs and a robust frame, it delivers superior soil turning and residue incorporation.', '["High-carbon steel discs", "Heavy-duty frame construction", "Adjustable disc angle", "Suitable for all soil types", "Low maintenance design"]', '["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"]', 1),
('automatic-disc-plough', 'Automatic Disc Plough', 'Ploughs', 'Hydraulic automatic disc plough for effortless tillage.', 'The Automatic Disc Plough features hydraulic lift and depth control for effortless operation. With automatic adjustment to varying soil conditions, it ensures consistent tillage depth.', '["Hydraulic lift system", "Automatic depth control", "Self-adjusting disc angles", "Heavy-duty bearings", "Compatible with major tractor brands"]', '["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"]', 2),
('leveller', 'Leveller', 'Land Preparation', 'Precision land leveller for perfect field preparation.', 'Our Leveller provides precision land leveling for optimal water distribution and crop uniformity. Engineered with a reinforced blade and adjustable frame.', '["Precision leveling blade", "Adjustable height control", "Reinforced steel frame", "Wide coverage area", "Easy tractor mounting"]', '["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"]', 3),
('cultivator', 'Cultivator', 'Tillage', 'Multi-purpose cultivator for soil aeration and weed control.', 'Our Cultivator is designed for secondary tillage, weed control, and soil aeration. With spring-loaded tines and adjustable depth settings.', '["Spring-loaded tines", "Adjustable working depth", "Wide working width", "Weed cutting capability", "Durable construction"]', '["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"]', 4),
('mb-plough', 'MB Plough', 'Ploughs', 'Mouldboard plough for deep soil inversion and mixing.', 'The MB (Mouldboard) Plough is the traditional choice for deep soil inversion and thorough mixing of crop residues. Features hardened steel mouldboards.', '["Hardened steel mouldboards", "Replaceable shares", "Deep soil penetration", "Excellent residue burial", "Multiple furrow options"]', '["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"]', 5);

-- Insert Default Admin User (username: admin, password: admin123)
INSERT INTO admin_users (username, password, email) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@abdulgani.com');

-- Useful Queries

-- Get all products
SELECT * FROM products ORDER BY sort_order ASC;

-- Get single product
SELECT * FROM products WHERE id = 'disc-plough';

-- Get all enquiries
SELECT * FROM enquiries ORDER BY created_at DESC;

-- Get enquiries with product details
SELECT e.*, p.name as product_name 
FROM enquiries e 
LEFT JOIN products p ON e.product_id = p.id 
ORDER BY e.created_at DESC;

-- Update enquiry status
UPDATE enquiries SET status = 'contacted' WHERE id = 1;

-- Count enquiries by status
SELECT status, COUNT(*) as count FROM enquiries GROUP BY status;

-- Search products
SELECT * FROM products WHERE name LIKE '%plough%' OR description LIKE '%plough%';

-- Get products by category
SELECT * FROM products WHERE category = 'Ploughs';
