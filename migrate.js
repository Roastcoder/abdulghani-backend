require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question VARCHAR(500) NOT NULL,
      answer TEXT NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(100) UNIQUE NOT NULL,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INT AUTO_INCREMENT PRIMARY KEY,
      url VARCHAR(500) NOT NULL,
      alt VARCHAR(255) DEFAULT '',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Default site content
  const defaults = [
    ['hero_title1', 'Precision'],
    ['hero_title2', 'Equipment'],
    ['hero_title3', 'Built for Indian Farms'],
    ['hero_desc', 'Premium agricultural implements engineered for Indian soil conditions. Trusted by 500+ farmers across the country.'],
    ['about_story_p1', 'Abdul Gani Hazi Gulam Mohd has been a trusted name in agricultural equipment for over a decade, serving farmers across India with high-quality implements.'],
    ['about_story_p2', 'Our journey began with a simple mission: to provide Indian farmers with durable, efficient, and affordable agricultural machinery that truly understands the demands of Indian soil.'],
    ['about_story_p3', 'Today, we offer a comprehensive range of tillage equipment, from disc ploughs to cultivators, all manufactured to the highest standards.'],
    ['contact_phone', '+91 98740 00000'],
    ['contact_email', 'Shabir9900@gmail.com'],
    ['contact_address', 'India'],
    ['stats_farmers', '500+'],
    ['stats_products', '5'],
    ['stats_years', '10+'],
    ['whatsapp_number', '919874000000'],
    ['carousel_1', ''],
    ['carousel_2', ''],
    ['carousel_3', ''],
    ['carousel_4', ''],
    ['carousel_5', ''],
    ['carousel_6', ''],
    ['about_image', ''],
    ['hero_image', ''],
  ];

  for (const [key, value] of defaults) {
    await conn.query(
      'INSERT IGNORE INTO site_content (key_name, value) VALUES (?, ?)',
      [key, value]
    );
  }

  // Default FAQs
  const defaultFaqs = [
    ['What types of agricultural equipment do you offer?', 'We offer a wide range of tillage equipment including Disc Ploughs, Automatic Disc Ploughs, MB Ploughs, Levellers, and Cultivators — all designed for Indian soil conditions.', 1],
    ['Do you provide pan-India delivery?', 'Yes, we deliver our agricultural equipment across India. Delivery timelines and charges depend on your location. Contact us for a delivery quote.', 2],
    ['What is the warranty on your products?', 'All our products come with a manufacturer warranty. Please contact us directly for specific warranty terms on each product.', 3],
    ['Can I get a custom order or bulk pricing?', 'Yes, we accept custom orders and offer special pricing for bulk purchases. Please reach out via our enquiry form or call us directly.', 4],
    ['How do I maintain the equipment?', 'Our equipment is designed for low maintenance. We recommend regular greasing of moving parts, checking bolt tightness, and cleaning after use. Manuals are provided with each product.', 5],
    ['How can I place an order?', 'You can place an order by filling out our enquiry form, calling us directly, or reaching out via WhatsApp. Our team will get back to you promptly.', 6],
  ];

  for (const [question, answer, sort_order] of defaultFaqs) {
    const [existing] = await conn.query('SELECT id FROM faqs WHERE question = ?', [question]);
    if (!existing.length) {
      await conn.query('INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)', [question, answer, sort_order]);
    }
  }

  console.log('✅ Migration completed — site_content and gallery tables ready');
  await conn.end();
}

migrate().catch(console.error);
