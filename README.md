# Abdul Gani Shop - PHP Backend

## Setup Instructions

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server with mod_rewrite enabled

### Installation Steps

1. **Configure Database**
   - Open `config.php`
   - Update database credentials:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_USER', 'root');
     define('DB_PASS', '');
     define('DB_NAME', 'abdul_gani_shop');
     ```

2. **Setup Database**
   ```bash
   php setup.php
   ```
   This will:
   - Create the database
   - Create all required tables
   - Insert default products
   - Create admin user (username: admin, password: admin123)

3. **Start PHP Server**
   ```bash
   cd backend
   php -S localhost:8000
   ```

4. **Update Frontend API URL**
   - Update the frontend to use: `http://localhost:8000/api/`

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products?id=disc-plough` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products` - Update product
- `DELETE /api/products` - Delete product

### Enquiries
- `GET /api/enquiries` - Get all enquiries
- `POST /api/enquiries` - Submit enquiry

### Authentication
- `POST /api/auth` - Admin login

## Database Schema

### products
- id (VARCHAR PRIMARY KEY)
- name (VARCHAR)
- category (VARCHAR)
- short_desc (TEXT)
- description (TEXT)
- features (JSON)
- images (JSON)
- image_url (VARCHAR)
- sort_order (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### enquiries
- id (INT AUTO_INCREMENT PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- message (TEXT)
- product_id (VARCHAR)
- status (ENUM: new, contacted, closed)
- created_at (TIMESTAMP)

### admin_users
- id (INT AUTO_INCREMENT PRIMARY KEY)
- username (VARCHAR UNIQUE)
- password (VARCHAR)
- email (VARCHAR)
- created_at (TIMESTAMP)

## Default Admin Credentials
- Username: admin
- Password: admin123

**Important:** Change the default password after first login!
