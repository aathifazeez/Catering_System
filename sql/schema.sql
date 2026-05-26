-- ============================================
-- CATERING MANAGEMENT SYSTEM - DATABASE SCHEMA
-- University of Moratuwa | ITE 1943
-- ============================================

CREATE DATABASE IF NOT EXISTS catering_db;
USE catering_db;

-- ─────────────────────────────────────────
-- CUSTOMERS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    address     TEXT,
    loyalty_points INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- MENU ITEMS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
    item_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    category    ENUM('Appetizer','Main Course','Dessert','Beverage','Side Dish') NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    description TEXT,
    available   BOOLEAN DEFAULT TRUE,
    image_url   VARCHAR(255) NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- ORDERS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    order_id      INT AUTO_INCREMENT PRIMARY KEY,
    customer_id   INT NOT NULL,
    event_type    VARCHAR(100),
    event_date    DATE,
    venue         VARCHAR(200),
    guest_count   INT DEFAULT 1,
    status        ENUM('Pending','Confirmed','In Progress','Completed','Cancelled') DEFAULT 'Pending',
    notes         TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- ORDER ITEMS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL,
    item_id       INT NOT NULL,
    quantity      INT NOT NULL DEFAULT 1,
    unit_price    DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id)  REFERENCES menu_items(item_id)
);

-- ─────────────────────────────────────────
-- BILLS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
    bill_id       INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL,
    subtotal      DECIMAL(10,2) NOT NULL,
    tax_rate      DECIMAL(5,2)  DEFAULT 8.00,
    tax_amount    DECIMAL(10,2) NOT NULL,
    discount      DECIMAL(10,2) DEFAULT 0.00,
    total_amount  DECIMAL(10,2) NOT NULL,
    paid          BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bills_order (order_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- INVENTORY TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
    item_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    quantity    DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit        VARCHAR(20),
    min_level   DECIMAL(10,2) DEFAULT 10,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- RECIPE INGREDIENTS TABLE
-- Links each menu item to the inventory ingredients it uses,
-- with how much of each ingredient is needed per serving.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id         INT            NOT NULL,
    inventory_item_id    INT            NOT NULL,
    quantity_per_serving DECIMAL(8,4)   NOT NULL,
    UNIQUE KEY uq_recipe (menu_item_id, inventory_item_id),
    FOREIGN KEY (menu_item_id)      REFERENCES menu_items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory(item_id)  ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────
INSERT INTO customers (name, email, phone, address) VALUES
('Aisha Perera',    'aisha@email.com',   '+94 77 123 4567', '12 Galle Road, Colombo 03'),
('Rohan Fernando',  'rohan@email.com',   '+94 71 234 5678', '45 Kandy Road, Kandy'),
('Priya Rajapaksa', 'priya@email.com',   '+94 76 345 6789', '8 Marine Drive, Galle'),
('Kasun Silva',     'kasun@email.com',   '+94 78 456 7890', '22 Baseline Rd, Colombo 09');

INSERT INTO menu_items (name, category, price, description) VALUES
('Spring Rolls',        'Appetizer',   350.00, 'Crispy vegetable spring rolls with dipping sauce'),
('Chicken Satay',       'Appetizer',   550.00, 'Grilled chicken skewers with peanut sauce'),
('Rice & Curry',        'Main Course', 850.00, 'Traditional Sri Lankan rice with 5 curries'),
('Biriyani',            'Main Course', 950.00, 'Fragrant basmati rice with chicken or mutton'),
('Pasta Alfredo',       'Main Course', 780.00, 'Creamy fettuccine with parmesan'),
('Chocolate Cake',      'Dessert',     450.00, 'Rich chocolate layer cake slice'),
('Watalappan',          'Dessert',     380.00, 'Traditional Sri Lankan coconut custard'),
('Fresh Fruit Salad',   'Dessert',     320.00, 'Seasonal tropical fruits'),
('Orange Juice',        'Beverage',    250.00, 'Freshly squeezed orange juice'),
('Soft Drinks',         'Beverage',    150.00, 'Assorted sodas'),
('Garlic Bread',        'Side Dish',   280.00, 'Toasted bread with herb butter'),
('Coleslaw',            'Side Dish',   220.00, 'Creamy homemade coleslaw');

INSERT INTO inventory (name, quantity, unit, min_level) VALUES
('Rice',        50.0,  'kg',     20),
('Chicken',     30.0,  'kg',     15),
('Vegetables',  25.0,  'kg',     10),
('Cooking Oil', 10.0,  'liters',  5),
('Sugar',       15.0,  'kg',      8),
('Flour',       20.0,  'kg',     10);

-- Recipe: how much of each ingredient each menu item uses per serving
-- Uses subquery lookups so IDs never need to be hardcoded
INSERT INTO recipe_ingredients (menu_item_id, inventory_item_id, quantity_per_serving) VALUES
-- Spring Rolls
((SELECT item_id FROM menu_items WHERE name='Spring Rolls'),   (SELECT item_id FROM inventory WHERE name='Vegetables'),   0.0800),
((SELECT item_id FROM menu_items WHERE name='Spring Rolls'),   (SELECT item_id FROM inventory WHERE name='Cooking Oil'),  0.0300),
-- Chicken Satay
((SELECT item_id FROM menu_items WHERE name='Chicken Satay'),  (SELECT item_id FROM inventory WHERE name='Chicken'),      0.1500),
((SELECT item_id FROM menu_items WHERE name='Chicken Satay'),  (SELECT item_id FROM inventory WHERE name='Cooking Oil'),  0.0200),
-- Rice & Curry
((SELECT item_id FROM menu_items WHERE name='Rice & Curry'),   (SELECT item_id FROM inventory WHERE name='Rice'),         0.2000),
((SELECT item_id FROM menu_items WHERE name='Rice & Curry'),   (SELECT item_id FROM inventory WHERE name='Vegetables'),   0.1500),
((SELECT item_id FROM menu_items WHERE name='Rice & Curry'),   (SELECT item_id FROM inventory WHERE name='Cooking Oil'),  0.0300),
-- Biriyani
((SELECT item_id FROM menu_items WHERE name='Biriyani'),       (SELECT item_id FROM inventory WHERE name='Rice'),         0.2500),
((SELECT item_id FROM menu_items WHERE name='Biriyani'),       (SELECT item_id FROM inventory WHERE name='Chicken'),      0.2000),
((SELECT item_id FROM menu_items WHERE name='Biriyani'),       (SELECT item_id FROM inventory WHERE name='Cooking Oil'),  0.0500),
-- Pasta Alfredo
((SELECT item_id FROM menu_items WHERE name='Pasta Alfredo'),  (SELECT item_id FROM inventory WHERE name='Flour'),        0.1000),
((SELECT item_id FROM menu_items WHERE name='Pasta Alfredo'),  (SELECT item_id FROM inventory WHERE name='Cooking Oil'),  0.0200),
-- Chocolate Cake
((SELECT item_id FROM menu_items WHERE name='Chocolate Cake'), (SELECT item_id FROM inventory WHERE name='Sugar'),        0.0500),
((SELECT item_id FROM menu_items WHERE name='Chocolate Cake'), (SELECT item_id FROM inventory WHERE name='Flour'),        0.0500),
-- Watalappan
((SELECT item_id FROM menu_items WHERE name='Watalappan'),     (SELECT item_id FROM inventory WHERE name='Sugar'),        0.0500),
((SELECT item_id FROM menu_items WHERE name='Watalappan'),     (SELECT item_id FROM inventory WHERE name='Flour'),        0.0500),
-- Fresh Fruit Salad
((SELECT item_id FROM menu_items WHERE name='Fresh Fruit Salad'), (SELECT item_id FROM inventory WHERE name='Sugar'),     0.0200),
-- Garlic Bread
((SELECT item_id FROM menu_items WHERE name='Garlic Bread'),   (SELECT item_id FROM inventory WHERE name='Flour'),        0.0800),
((SELECT item_id FROM menu_items WHERE name='Garlic Bread'),   (SELECT item_id FROM inventory WHERE name='Cooking Oil'),  0.0150),
-- Coleslaw
((SELECT item_id FROM menu_items WHERE name='Coleslaw'),       (SELECT item_id FROM inventory WHERE name='Vegetables'),   0.1200);
