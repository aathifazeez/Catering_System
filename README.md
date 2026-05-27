# CaterPro — Catering Management System
**ITE 1943 | University of Moratuwa**

A full-stack web application for managing catering orders, customers, menu items, billing, and inventory.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Complete Setup Guide (New Developer)](#complete-setup-guide-new-developer)
   - [Step 1 — Install Prerequisites](#step-1--install-prerequisites)
   - [Step 2 — Clone the Repository](#step-2--clone-the-repository)
   - [Step 3 — Set Up MySQL](#step-3--set-up-mysql)
   - [Step 4 — Configure Database Credentials](#step-4--configure-database-credentials)
   - [Step 5 — Install Apache Tomcat](#step-5--install-apache-tomcat)
   - [Step 6 — Build the WAR File](#step-6--build-the-war-file)
   - [Step 7 — Deploy to Tomcat](#step-7--deploy-to-tomcat)
   - [Step 8 — Open the Website](#step-8--open-the-website)
4. [How to Use MySQL from the Terminal](#how-to-use-mysql-from-the-terminal)
5. [REST API Reference](#rest-api-reference)
6. [Features](#features)

---

## Tech Stack

| Layer     | Technology                                         |
|-----------|----------------------------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript (Fetch API)        |
| Backend   | Java 11, Jakarta Servlets (Jakarta EE 10)          |
| Database  | MySQL 8.x                                          |
| Build     | Apache Maven 3.8+                                  |
| Server    | Apache Tomcat 10.1+ or Tomcat 11                   |

> ⚠️ **Important:** This project uses `jakarta.servlet.*` (Jakarta EE). You **must** use **Tomcat 10.1 or newer**. Tomcat 9 uses the old `javax.servlet.*` namespace and will not work.

---

## Project Structure

```
catering-system/
├── pom.xml                                  ← Maven build config
├── sql/
│   └── schema.sql                           ← DB schema + all seed data
└── src/main/
    ├── java/com/catering/
    │   ├── controller/                      ← Servlet REST endpoints
    │   │   ├── CorsFilter.java              ← CORS headers (@WebFilter /*)
    │   │   ├── CustomerServlet.java         ← /api/customers/*
    │   │   ├── MenuItemServlet.java         ← /api/menu/*
    │   │   ├── OrderServlet.java            ← /api/orders/*
    │   │   ├── BillServlet.java             ← /api/bills/*
    │   │   └── InventoryServlet.java        ← /api/inventory/*
    │   ├── dao/                             ← Database access layer (JDBC)
    │   │   ├── CustomerDAO.java
    │   │   ├── MenuItemDAO.java
    │   │   ├── OrderDAO.java
    │   │   ├── BillDAO.java
    │   │   └── InventoryDAO.java
    │   ├── model/                           ← Plain Java data objects (POJOs)
    │   │   ├── Customer.java
    │   │   ├── MenuItem.java
    │   │   ├── Order.java                   ← includes nested OrderItem list
    │   │   ├── Bill.java
    │   │   └── InventoryItem.java
    │   └── util/
    │       └── DBConnection.java            ← Loads credentials from db.properties
    └── webapp/
        ├── WEB-INF/
        │   └── web.xml
        ├── css/
        │   └── style.css
        ├── js/
        │   ├── shared.js                    ← Shared API helper, auth, modals
        │   ├── login.js / menu.js / book.js / my-account.js
        │   ├── admin-dashboard.js
        │   ├── admin-customers.js
        │   ├── admin-menu.js
        │   ├── admin-orders.js
        │   ├── admin-billing.js
        │   ├── admin-inventory.js
        │   └── admin-reports.js
        ├── index.html                       ← Public home page
        ├── menu.html                        ← Public menu browser
        ├── book.html                        ← Public booking form
        ├── login.html                       ← Login / Register
        ├── my-account.html                  ← Customer account
        ├── admin-dashboard.html
        ├── admin-customers.html
        ├── admin-menu.html
        ├── admin-orders.html
        ├── admin-billing.html
        ├── admin-inventory.html
        └── admin-reports.html
```

---

## Complete Setup Guide (New Developer)

Follow every step in order. This guide covers **macOS** and **Windows**.

---

### Step 1 — Install Prerequisites

You need four tools installed before anything else.

#### ✅ Java Development Kit (JDK) 11 or newer

**macOS:**
```bash
brew install openjdk@11
```
After installing, add it to your PATH (run this once):
```bash
echo 'export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Windows:**  
Download from https://adoptium.net/ → choose **JDK 11**, installer (.msi).  
After install, verify in Command Prompt:
```
java -version
```
Expected output: `openjdk version "11.x.x"`

---

#### ✅ Apache Maven 3.8+

**macOS:**
```bash
brew install maven
```

**Windows:**  
Download from https://maven.apache.org/download.cgi → Binary zip.  
Extract to `C:\maven`, then add `C:\maven\bin` to your System PATH.

Verify:
```bash
mvn -version
```

---

#### ✅ MySQL 8.x

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Windows:**  
Download MySQL Installer from https://dev.mysql.com/downloads/installer/  
Choose **MySQL Server 8.x** during install.  
Set a root password when prompted — remember it, you will need it.

Verify MySQL is running:
```bash
# macOS
brew services list | grep mysql

# Windows — check in Services app or run:
mysql --version
```

---

#### ✅ Apache Tomcat 10.1 or 11

> ⚠️ Must be **version 10.1 or 11**. Do NOT use Tomcat 9 — it will not work with this project.

**macOS:**
```bash
brew install tomcat
```
This installs the latest Tomcat (10.1+). Start it:
```bash
brew services start tomcat
```

**Windows:**  
Download from https://tomcat.apache.org/download-11.cgi → **64-bit Windows zip**  
Extract to `C:\tomcat`.  
Start it:
```
C:\tomcat\bin\startup.bat
```

Verify Tomcat is running — open in browser:
```
http://localhost:8080
```
You should see the Tomcat welcome page.

---

### Step 2 — Clone the Repository

```bash
git clone <repository-url>
cd catering-system
```

---

### Step 3 — Set Up MySQL

#### 3a. Find your MySQL port

The default MySQL port is `3306`. Some installations use `3307`. Check yours:

**macOS (Homebrew):**
```bash
cat /opt/homebrew/etc/my.cnf
```
Look for a `port=` line. If there is none, your port is `3306`.

**Windows:**  
Default is `3306` unless you changed it during install.

#### 3b. Connect to MySQL and load the database

**macOS:**
```bash
mysql -u root -p --host=127.0.0.1 --port=3306
```
*(Replace `3306` with your actual port if different.)*

**Windows:**
```
mysql -u root -p --host=127.0.0.1 --port=3306
```

You will be prompted for your root password. Type it and press Enter.

Once inside the `mysql>` prompt, load the schema:
```sql
SOURCE /full/path/to/catering-system/sql/schema.sql;
EXIT;
```

**Or, run it directly from your terminal (without entering MySQL):**
```bash
# macOS / Linux
mysql -u root -p --host=127.0.0.1 --port=3306 < sql/schema.sql

# Windows (from the catering-system folder)
mysql -u root -p --host=127.0.0.1 --port=3306 < sql\schema.sql
```

This creates the `catering_db` database with all 7 tables and sample data:
- 4 sample customers
- 12 menu items (appetizers, mains, desserts, beverages, sides)
- 6 inventory ingredients
- 20 recipe-ingredient links

#### 3c. Verify it loaded correctly

```bash
mysql -u root -p --host=127.0.0.1 --port=3306 -e "USE catering_db; SHOW TABLES;"
```

Expected output:
```
+----------------------+
| Tables_in_catering_db|
+----------------------+
| bills                |
| customers            |
| inventory            |
| menu_items           |
| order_items          |
| orders               |
| recipe_ingredients   |
+----------------------+
```

---

### Step 4 — Configure Database Credentials

Copy the template credentials file:

**macOS / Linux:**
```bash
cp src/main/resources/db.properties.template src/main/resources/db.properties
```

**Windows:**
```
copy src\main\resources\db.properties.template src\main\resources\db.properties
```

Now open `src/main/resources/db.properties` in any text editor and fill in your details:

```properties
db.url=jdbc:mysql://localhost:3306/catering_db?useSSL=false&serverTimezone=UTC
db.user=root
db.password=YOUR_MYSQL_PASSWORD_HERE
```

> ⚠️ If your MySQL is on port **3307**, change `3306` to `3307` in the URL above.

> 🔒 This file is in `.gitignore` — your password is never committed to git.

---

### Step 5 — Install Apache Tomcat

*(Already covered in Step 1. This step is just to confirm Tomcat is running.)*

Open http://localhost:8080 in your browser. If you see the Tomcat welcome page, you're good. If not:

**macOS:**
```bash
brew services start tomcat
```

**Windows:**
```
C:\tomcat\bin\startup.bat
```

Now find your Tomcat `webapps` folder — you will need this in Step 7:

| OS | Default path |
|----|-------------|
| macOS (Homebrew) | `/opt/homebrew/opt/tomcat/libexec/webapps/` |
| Windows | `C:\tomcat\webapps\` |

---

### Step 6 — Build the WAR File

From inside the `catering-system` folder:

```bash
mvn clean package
```

This compiles all Java code and packages everything into a deployable WAR file at:
```
target/catering-system.war
```

If the build fails, check:
- Is Java 11+ installed? (`java -version`)
- Is Maven installed? (`mvn -version`)
- Does `src/main/resources/db.properties` exist?

---

### Step 7 — Deploy to Tomcat

Copy the WAR file into Tomcat's `webapps` folder:

**macOS (Homebrew Tomcat):**
```bash
cp target/catering-system.war /opt/homebrew/opt/tomcat/libexec/webapps/
```

**Windows:**
```
copy target\catering-system.war C:\tomcat\webapps\
```

Tomcat auto-deploys WAR files. Wait about 5 seconds, then check Tomcat extracted a `catering-system/` folder in the webapps directory. If it didn't, restart Tomcat:

**macOS:**
```bash
brew services restart tomcat
```

**Windows:**
```
C:\tomcat\bin\shutdown.bat
C:\tomcat\bin\startup.bat
```

---

### Step 8 — Open the Website

Open your browser and go to:

```
http://localhost:8080/catering-system/
```

That's it — the website is running! 🎉

---

## How to Use MySQL from the Terminal

### Connect to MySQL

```bash
# macOS (replace port if yours is different)
mysql -u root -p --host=127.0.0.1 --port=3306

# Windows (same command)
mysql -u root -p --host=127.0.0.1 --port=3306
```

You'll see a `mysql>` prompt. Type commands after it.

### Useful Commands

```sql
-- List all databases
SHOW DATABASES;

-- Switch to the catering database
USE catering_db;

-- List all tables
SHOW TABLES;

-- See the columns of a table
DESCRIBE customers;
DESCRIBE menu_items;
DESCRIBE orders;
DESCRIBE order_items;
DESCRIBE bills;
DESCRIBE inventory;
DESCRIBE recipe_ingredients;

-- View all data in a table
SELECT * FROM customers;
SELECT * FROM menu_items;
SELECT * FROM inventory;
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT * FROM bills;
SELECT * FROM recipe_ingredients;

-- Count rows in every table at once
SELECT 'customers'         AS table_name, COUNT(*) AS rows FROM customers
UNION SELECT 'menu_items',          COUNT(*) FROM menu_items
UNION SELECT 'inventory',           COUNT(*) FROM inventory
UNION SELECT 'recipe_ingredients',  COUNT(*) FROM recipe_ingredients
UNION SELECT 'orders',              COUNT(*) FROM orders
UNION SELECT 'order_items',         COUNT(*) FROM order_items
UNION SELECT 'bills',               COUNT(*) FROM bills;

-- See which menu items are available
SELECT name, category, price FROM menu_items WHERE available = TRUE;

-- See inventory items below their minimum level (low stock)
SELECT name, quantity, unit, min_level
FROM inventory
WHERE quantity < min_level;

-- See all orders with customer names
SELECT o.order_id, c.name AS customer, o.event_type, o.event_date, o.status
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.created_at DESC;

-- See a bill with order details
SELECT b.bill_id, b.order_id, b.subtotal, b.tax_amount, b.discount, b.total_amount, b.paid
FROM bills b;

-- Reload the database from scratch (drops and recreates everything)
DROP DATABASE IF EXISTS catering_db;
SOURCE /full/path/to/catering-system/sql/schema.sql;

-- Exit MySQL
EXIT;
```

### Run a single query without entering MySQL

```bash
mysql -u root -p --host=127.0.0.1 --port=3306 -e "USE catering_db; SELECT * FROM menu_items;"
```

---

## REST API Reference

All endpoints are under `http://localhost:8080/catering-system/api/`

### Customers `/api/customers`
| Method | Endpoint            | Description            |
|--------|---------------------|------------------------|
| GET    | /api/customers      | List all customers     |
| GET    | /api/customers/{id} | Get one customer by ID |
| POST   | /api/customers      | Create a new customer  |
| PUT    | /api/customers      | Update customer        |
| DELETE | /api/customers/{id} | Delete customer        |

### Menu Items `/api/menu`
| Method | Endpoint                 | Description            |
|--------|--------------------------|------------------------|
| GET    | /api/menu                | List all menu items    |
| GET    | /api/menu?available=true | Available items only   |
| GET    | /api/menu/{id}           | Get one item by ID     |
| POST   | /api/menu                | Add a menu item        |
| PUT    | /api/menu                | Update a menu item     |
| DELETE | /api/menu/{id}           | Delete a menu item     |

### Orders `/api/orders`
| Method | Endpoint               | Description             |
|--------|------------------------|-------------------------|
| GET    | /api/orders            | List all orders         |
| GET    | /api/orders?type=stats | Dashboard summary stats |
| GET    | /api/orders/{id}       | Get order + items       |
| POST   | /api/orders            | Create a new order      |
| PUT    | /api/orders/{id}       | Update order status     |
| DELETE | /api/orders/{id}       | Delete an order         |

### Billing `/api/bills`
| Method | Endpoint                 | Description           |
|--------|--------------------------|-----------------------|
| GET    | /api/bills               | List all bills        |
| GET    | /api/bills/order/{id}    | Get bill for an order |
| POST   | /api/bills               | Generate a bill       |
| PUT    | /api/bills/{orderId}/pay | Mark bill as paid     |

### Inventory `/api/inventory`
| Method | Endpoint            | Description           |
|--------|---------------------|-----------------------|
| GET    | /api/inventory      | List all stock items  |
| GET    | /api/inventory/{id} | Get one item by ID    |
| POST   | /api/inventory      | Add a stock item      |
| PUT    | /api/inventory      | Update a stock item   |
| DELETE | /api/inventory/{id} | Delete a stock item   |

---

## Features

- ✅ Customer Management with Loyalty Points
- ✅ Menu Management (CRUD, categories, availability toggle)
- ✅ Order Management with event details and menu selections
- ✅ Automatic Bill Generation (tax + loyalty discount)
- ✅ Payment status tracking
- ✅ Inventory / Stock Control with low-stock alerts
- ✅ Automatic ingredient deduction when orders are confirmed
- ✅ Dashboard with live statistics
- ✅ Reports & Analytics
- ✅ Public booking form and menu browser
- ✅ Print-friendly invoice
- ✅ Responsive design (mobile-friendly)
