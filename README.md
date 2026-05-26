# CaterPro — Catering Management System
**ITE 1943 | University of Moratuwa | Student: ANF Imzama (E2420420)**

---

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript               |
| Backend   | Java 11, Servlets (Jakarta EE / Tomcat 9)     |
| Database  | MySQL 8.x                                     |
| Build     | Maven 3.8+                                    |
| Server    | Apache Tomcat 9.x                             |

---

## Project Structure

```
catering-system/
├── pom.xml                                  ← Maven build config
├── sql/
│   └── schema.sql                           ← DB schema + seed data
└── src/main/
    ├── java/com/catering/
    │   ├── controller/                      ← Servlet REST endpoints
    │   │   ├── CorsFilter.java              ← CORS headers (@WebFilter)
    │   │   ├── CustomerServlet.java         ← /api/customers/*
    │   │   ├── MenuItemServlet.java         ← /api/menu/*
    │   │   ├── OrderServlet.java            ← /api/orders/*
    │   │   ├── BillServlet.java             ← /api/bills/*
    │   │   └── InventoryServlet.java        ← /api/inventory/*
    │   ├── dao/                             ← Database access layer
    │   │   ├── CustomerDAO.java
    │   │   ├── MenuItemDAO.java
    │   │   ├── OrderDAO.java
    │   │   ├── BillDAO.java
    │   │   └── InventoryDAO.java
    │   ├── model/                           ← Plain data objects (POJOs)
    │   │   ├── Customer.java
    │   │   ├── MenuItem.java
    │   │   ├── Order.java                   ← includes nested OrderItem
    │   │   ├── Bill.java
    │   │   └── InventoryItem.java
    │   └── util/
    │       └── DBConnection.java            ← MySQL connection helper
    └── webapp/
        ├── WEB-INF/
        │   └── web.xml
        ├── css/
        │   └── style.css                    ← Shared stylesheet
        ├── js/
        │   ├── shared.js                    ← Shared utilities (API, auth, modals)
        │   ├── login.js
        │   ├── menu.js
        │   ├── book.js
        │   ├── my-account.js
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
        ├── my-account.html                  ← Customer account & bookings
        ├── admin-dashboard.html             ← Admin overview
        ├── admin-customers.html             ← Admin CRM
        ├── admin-menu.html                  ← Admin menu management
        ├── admin-orders.html                ← Admin orders management
        ├── admin-billing.html               ← Admin billing & invoices
        ├── admin-inventory.html             ← Admin stock control
        └── admin-reports.html               ← Admin analytics & reports
```

---

## Setup Instructions

### 1. Prerequisites
- JDK 11+
- Maven 3.8+
- MySQL 8.x
- Apache Tomcat 9.x

### 2. Database Setup
```bash
mysql -u root -p < sql/schema.sql
```
Creates the `catering_db` database with all tables and sample data.

### 3. Configure Database Credentials
Edit `src/main/java/com/catering/util/DBConnection.java`:
```java
private static final String DB_URL  = "jdbc:mysql://localhost:3306/catering_db?useSSL=false&serverTimezone=UTC";
private static final String DB_USER = "root";
private static final String DB_PASS = "your_password_here";
```

### 4. Build the WAR
```bash
mvn clean package
```
Generates `target/catering-system.war`.

### 5. Deploy to Tomcat
```bash
cp target/catering-system.war $TOMCAT_HOME/webapps/
```

### 6. Access the Application
```
http://localhost:8080/catering-system/
```

**Admin login:**
- Email: `admin@caterpro.com`
- Password: `admin123`

---

## REST API Endpoints

### Customers `/api/customers`
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | /api/customers        | List all customers  |
| GET    | /api/customers/{id}   | Get by ID           |
| POST   | /api/customers        | Create customer     |
| PUT    | /api/customers        | Update customer     |
| DELETE | /api/customers/{id}   | Delete customer     |

### Menu Items `/api/menu`
| Method | Endpoint                 | Description          |
|--------|--------------------------|----------------------|
| GET    | /api/menu                | List all items       |
| GET    | /api/menu?available=true | Available items only |
| GET    | /api/menu/{id}           | Get by ID            |
| POST   | /api/menu                | Add item             |
| PUT    | /api/menu                | Update item          |
| DELETE | /api/menu/{id}           | Delete item          |

### Orders `/api/orders`
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| GET    | /api/orders            | List all orders      |
| GET    | /api/orders?type=stats | Dashboard stats      |
| GET    | /api/orders/{id}       | Get order + items    |
| POST   | /api/orders            | Create order         |
| PUT    | /api/orders/{id}       | Update order status  |
| DELETE | /api/orders/{id}       | Delete order         |

### Billing `/api/bills`
| Method | Endpoint                  | Description         |
|--------|---------------------------|---------------------|
| GET    | /api/bills                | List all bills      |
| GET    | /api/bills/order/{id}     | Get bill for order  |
| POST   | /api/bills                | Generate bill       |
| PUT    | /api/bills/{orderId}/pay  | Mark as paid        |

### Inventory `/api/inventory`
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | /api/inventory        | List all stock      |
| GET    | /api/inventory/{id}   | Get item by ID      |
| POST   | /api/inventory        | Add stock item      |
| PUT    | /api/inventory        | Update stock item   |
| DELETE | /api/inventory/{id}   | Delete stock item   |

---

## Features
- ✅ Customer Management with Loyalty Points (CRM)
- ✅ Menu Management (CRUD, categories, availability)
- ✅ Order Management with event details and menu selections
- ✅ Automatic Bill Generation (tax + loyalty discount)
- ✅ Payment status tracking
- ✅ Inventory / Stock Control with low-stock alerts
- ✅ Dashboard with live statistics
- ✅ Reports & Analytics (charts via Chart.js)
- ✅ Public booking form and menu browser
- ✅ Print-friendly invoice
- ✅ Responsive design (mobile-friendly)
