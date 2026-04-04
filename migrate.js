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
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      \`desc\` TEXT DEFAULT '',
      info TEXT DEFAULT '',
      image_url VARCHAR(500),
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Default services
  const defaultServices = [
    ['Equipment Installation', 'Professional installation and setup of all our agricultural equipment with on-site guidance for your farm.', 'Expert installation services for all agricultural equipment. Our skilled technicians ensure your machinery operates at peak performance.', 1],
    ['Maintenance & Repair', 'Regular maintenance services and quick repairs to keep your equipment running at peak performance.', 'Professional customization services to adapt equipment to your specific farming needs. We modify and upgrade machinery for optimal results.', 2],
    ['Delivery & Logistics', 'Reliable pan-India delivery with careful handling to ensure your equipment arrives in perfect condition.', 'Fast and reliable delivery services across all regions. We ensure your equipment reaches you safely and on time, ready for immediate use.', 3],
    ['After-Sales Support', 'Dedicated customer support and spare parts availability to minimize downtime during critical farming seasons.', '24/7 customer support and technical assistance. Our dedicated team is always ready to help you with any questions or concerns.', 4],
  ];

  for (const [title, desc, info, sort_order] of defaultServices) {
    const [existing] = await conn.query('SELECT id FROM services WHERE title = ?', [title]);
    if (!existing.length) {
      await conn.query('INSERT INTO services (title, `desc`, info, sort_order) VALUES (?, ?, ?, ?)', [title, desc, info, sort_order]);
    }
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS blogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      excerpt TEXT NOT NULL,
      content LONGTEXT DEFAULT '',
      image_url VARCHAR(500),
      author VARCHAR(100) DEFAULT 'Admin',
      date VARCHAR(50),
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
    ['about_tagline', 'Who We Are'],
    ['about_title', 'About Us'],
    ['about_subtitle', 'Learn about our legacy of quality and commitment to Indian agriculture.'],
    ['about_story_tag', 'Our Story'],
    ['about_story_title', 'A Legacy of Agricultural Excellence'],
    ['about_story_p1', 'Abdul Gani Hazi Gulam Mohd is a renowned manufacturer and supplier of premium agricultural equipment.'],
    ['about_story_p2', 'Our product range includes disc ploughs, automatic disc ploughs, levellers, cultivators, and MB ploughs.'],
    ['about_story_p3', 'We take pride in combining traditional craftsmanship with modern engineering.'],
    ['about_milestone1_year', 'Founded'],
    ['about_milestone1_title', 'Company Established'],
    ['about_milestone1_desc', 'Started manufacturing quality agricultural equipment.'],
    ['about_milestone2_year', 'Growth'],
    ['about_milestone2_title', 'Pan-India Expansion'],
    ['about_milestone2_desc', 'Extended delivery and services across all Indian states.'],
    ['about_milestone3_year', 'Innovation'],
    ['about_milestone3_title', 'Automatic Equipment'],
    ['about_milestone3_desc', 'Launched hydraulic disc ploughs with automatic controls.'],
    ['about_milestone4_year', 'Today'],
    ['about_milestone4_title', '500+ Farmers Served'],
    ['about_milestone4_desc', 'Trusted by hundreds of farmers across the nation.'],
    ['about_value1_title', 'Quality First'],
    ['about_value1_desc', 'Every product undergoes rigorous quality checks before delivery.'],
    ['about_value2_title', 'Customer Focus'],
    ['about_value2_desc', 'We build lasting relationships with farmers across India.'],
    ['about_value3_title', 'Innovation'],
    ['about_value3_desc', 'Continuously improving our designs for modern farming needs.'],
    ['about_value4_title', 'Sustainability'],
    ['about_value4_desc', 'Promoting sustainable farming through efficient equipment.'],
  ];

  for (const [key, value] of defaults) {
    await conn.query(
      'INSERT IGNORE INTO site_content (key_name, value) VALUES (?, ?)',
      [key, value]
    );
  }

  // Default FAQs
  const defaultBlogs = [
    ['Choosing the Right Plough for Your Soil Type', 'Understanding your soil type is the first step to selecting the perfect plough. Learn how to match disc ploughs, MB ploughs, and cultivators to your specific soil conditions.', 'January 15, 2026', 1],
    ['5 Tips for Maintaining Your Agricultural Equipment', 'Proper maintenance extends the life of your farming equipment and ensures optimal performance. Follow these essential tips for disc ploughs and cultivators.', 'January 10, 2026', 2],
    ['Benefits of Automatic Disc Ploughs in Modern Farming', 'Automatic disc ploughs revolutionize tillage by reducing operator fatigue and ensuring consistent depth. Discover why more farmers are making the switch.', 'January 5, 2026', 3],
    ['Land Levelling: Why It Matters for Crop Yield', 'Proper land levelling improves water distribution, reduces waterlogging, and significantly boosts crop yield. Learn how levellers can transform your fields.', 'December 28, 2025', 4],
  ];

  for (const [title, excerpt, date, sort_order] of defaultBlogs) {
    const [existing] = await conn.query('SELECT id FROM blogs WHERE title = ?', [title]);
    if (!existing.length) {
      await conn.query('INSERT INTO blogs (title, excerpt, date, sort_order) VALUES (?, ?, ?, ?)', [title, excerpt, date, sort_order]);
    }
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
