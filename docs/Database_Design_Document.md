# POS-Restaurant
## Database Design Document (DDD)

**Project Name:** Restaurant POS System
**Version:** 1.5
**Status:** Design Phase
**Prepared By:** Abdullah Parvaiz

---

### 1. Purpose
The purpose of this document is to define the database structure of the Restaurant POS System, including tables, relationships, constraints, and business rules. The database is designed to be scalable, maintainable, and suitable for future enhancements, leveraging Prisma ORM as the single source of truth.

### 2. Database Technology
| Item | Value |
|---|---|
| Database | MySQL 8.x |
| Storage Engine | InnoDB |
| ORM | Prisma |
| Character Set | UTF8MB4 |
| Primary Key | Auto Increment Integer |
| Foreign Keys | Enabled (with strict onDelete/onUpdate rules) |

#### 2.1 Database Naming Convention
To maintain consistency and professionalism across the database, the following naming conventions are strictly applied:
- **Tables**: `snake_case` (e.g., `menu_items`, `user_roles`)
- **Columns**: `snake_case` (e.g., `first_name`, `display_order`)
- **Primary Key**: `id`
- **Foreign Keys**: `<table_singular>_id` (e.g., `category_id`, `user_id`)
- **Timestamps**:
  - `created_at`
  - `updated_at`
  - `deleted_at`

*(Note: Prisma ORM automatically maps these `snake_case` database columns to `camelCase` fields in the application code for TypeScript compatibility).*

### 3. Entity Relationship Diagram (Logical)
```text
Categories
  │
  ▼
Menu Items
  │
  ▼
Menu Variants
  │
  ▼
Order Items
  ▲
  │
Orders ───────────────┐
  │                   │
  └──────────────► Users
  │                   │
  ▼                   ▼
User Roles         Settings
  ▲
  │
Roles

Order Items
  │
  ├────────► Kitchen Queue
  │
  └────────► Bar Queue
```

### 4. Tables
For Version 1, the system consists of the following core tables:
- Categories (`categories`)
- Menu Items (`menu_items`)
- Menu Variants (`menu_variants`)
- Orders (`orders`)
- Order Items (`order_items`)
- Kitchen Queue (`kitchen_queue`)
- Bar Queue (`bar_queue`)
- Users (`users`)
- Roles (`roles`)
- User Roles (`user_roles`)
- Settings (`settings`)

### 5. Table Details

#### 5.1 Categories (`categories`)
**Purpose**: Store menu categories.
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | Primary Key |
| name | VARCHAR(100) | Category name (Unique) |
| slug | VARCHAR(120) | URL-friendly slug (Unique) |
| description | TEXT | Optional |
| icon | VARCHAR(100) | Optional icon name |
| color | VARCHAR(20) | Optional hex color |
| image | VARCHAR(255) | Optional category image URL |
| display_order | INT | Sort categories (Default 0) |
| is_active | BOOLEAN | Enable/Disable (Default true) |
| created_by | INT FK | Reference to Users |
| updated_by | INT FK | Reference to Users |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last updated time |
| deleted_at | TIMESTAMP | Soft delete flag (Nullable) |

#### 5.2 Menu Items (`menu_items`)
**Purpose**: Store restaurant products.
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | Primary Key |
| category_id | INT FK | Reference to Categories |
| name | VARCHAR(150) | Menu item name (Unique) |
| slug | VARCHAR(170) | URL-friendly slug (Unique) |
| sku | VARCHAR(50) | Stock Keeping Unit (Optional, Unique) |
| description | TEXT | Optional description |
| image | VARCHAR(255) | Optional image URL |
| preparation_area | ENUM | KITCHEN, BAR |
| pricing_mode | ENUM | SINGLE_PRICE, MULTIPLE_VARIANTS, VARIANTS_WITH_CUSTOM |
| is_available | BOOLEAN | Enable/Disable (Default true) |
| display_order | INT | Sort order (Default 0) |
| created_by | INT FK | Reference to Users |
| updated_by | INT FK | Reference to Users |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last updated time |
| deleted_at | TIMESTAMP | Soft delete flag (Nullable) |

#### 5.3 Menu Variants (`menu_variants`)
**Purpose**: Store all predefined pricing variants for a menu item.
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | Primary Key |
| menu_item_id | INT FK | Reference to Menu Items |
| name | VARCHAR(100) | Variant Name (Unique per menu item) |
| price | DECIMAL(10,2) | Selling Price |
| display_order | INT | Sort order (Default 0) |
| is_default | BOOLEAN | Default Variant flag (Default false) |
| is_available | BOOLEAN | Enable/Disable Variant (Default true) |
| created_by | INT FK | Reference to Users |
| updated_by | INT FK | Reference to Users |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last updated time |
| deleted_at | TIMESTAMP | Soft delete flag (Nullable) |

#### 5.4 Orders (`orders`)
**Purpose**: Store every customer order with detailed financial and source tracking.
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | Primary Key |
| order_number | VARCHAR(50) | Receipt Number (Unique) |
| order_type | ENUM | DINE_IN, TAKEAWAY, DELIVERY |
| order_source | ENUM | POS, QR_ORDER, WEBSITE, MOBILE_APP |
| takeaway_mode | ENUM | COUNTER, CAR_WAIT (Nullable) |
| table_number | INT | Only for Dine-in (Nullable) |
| customer_name | VARCHAR(150) | Customer Name (Nullable) |
| customer_phone| VARCHAR(20) | Customer Phone (Nullable) |
| assigned_staff_id | INT FK | Staff assigned to this order (Nullable) |
| assigned_role | ENUM | Role performed for this order (Nullable) |
| subtotal | DECIMAL(10,2)| Order subtotal before tax/discount |
| tax_amount | DECIMAL(10,2)| Tax applied |
| discount_amount | DECIMAL(10,2)| Discount applied |
| total_amount | DECIMAL(10,2)| Final Order Total |
| payment_status| ENUM | UNPAID, PAID, CREDIT |
| payment_method| ENUM | CASH, CARD, QR, BANK_TRANSFER (Nullable) |
| status | ENUM | PENDING, PREPARING, READY, COMPLETED, CANCELLED |
| customer_notes| TEXT | Optional Notes |
| created_by | INT FK | Reference to Users |
| updated_by | INT FK | Reference to Users |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last updated time |
| deleted_at | TIMESTAMP | Soft delete flag (Nullable) |

#### 5.5 Order Items (`order_items`)
**Purpose**: Store products belonging to an order, capturing variant history securely.
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | Primary Key |
| line_number | INT | Display order on receipt |
| order_id | INT FK | Reference to Orders |
| menu_item_id | INT FK | Reference to Menu Items |
| menu_variant_id | INT FK | Reference to Menu Variants (Nullable) |
| menu_item_name | VARCHAR(150) | Snapshot of menu item name |
| variant_name | VARCHAR(100) | Snapshot of variant name (Nullable) |
| custom_variant_name | VARCHAR(100) | Name for custom variants (Nullable) |
| custom_variant_price | DECIMAL(10,2)| Price for custom variants (Nullable) |
| preparation_area | ENUM | Snapshot of preparation area (Kitchen/Bar) |
| quantity | INT | Quantity ordered |
| unit_price | DECIMAL(10,2)| Historical price per unit |
| discount_amount | DECIMAL(10,2)| Item discount |
| tax_amount | DECIMAL(10,2)| Item tax |
| subtotal | DECIMAL(10,2)| Final subtotal for this item row |
| notes | TEXT | Optional prep notes |
| status | ENUM | PENDING, PREPARING, READY, SERVED, CANCELLED |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last updated time |
| deleted_at | TIMESTAMP | Soft delete flag (Nullable) |

#### 5.6 Kitchen Queue (`kitchen_queue`)
**Purpose**: Store only food items that need to be prepared in the kitchen.
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | Primary Key |
| order_item_id | INT FK | Reference to Order Items |
| assigned_chef_id | INT FK | Chef responsible (Nullable) |
| status | ENUM | PENDING, PREPARING, READY, SERVED, CANCELLED |
| priority | ENUM | NORMAL, HIGH, URGENT |
| accepted_at | TIMESTAMP | When the chef accepted the order (Nullable) |
| started_at | TIMESTAMP | Preparation start time (Nullable) |
| completed_at | TIMESTAMP | Preparation end time (Nullable) |
| remarks | TEXT | Optional internal kitchen notes (Nullable) |
| created_at | TIMESTAMP | Queue entry creation |
| updated_at | TIMESTAMP | Last update |

#### 5.7 Bar Queue (`bar_queue`)
**Purpose**: Store only beverage items that need to be prepared by the bar.
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | Primary Key |
| order_item_id | INT FK | Reference to Order Items (One-to-One) |
| assigned_bartender_id | INT FK | Assigned bartender (Nullable) |
| status | ENUM | PENDING, PREPARING, READY, SERVED, CANCELLED |
| priority | ENUM | NORMAL, HIGH, URGENT |
| accepted_at | TIMESTAMP | Bartender accepted the item (Nullable) |
| started_at | TIMESTAMP | Preparation start time (Nullable) |
| completed_at | TIMESTAMP | Drink completed (Nullable) |
| remarks | TEXT | Internal notes (Nullable) |
| created_at | TIMESTAMP | Queue creation |
| updated_at | TIMESTAMP | Last update |

#### 5.8 Users (`users`)
**Purpose**: Store all system users (employees).
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | User ID |
| full_name | VARCHAR(150) | Full Name |
| phone | VARCHAR(20) | Phone Number (Unique) |
| email | VARCHAR(255) | Email Address (Optional, Unique) |
| password | VARCHAR(255) | Hashed password |
| address | TEXT | Address (Optional) |
| salary | DECIMAL(10,2)| Salary (Optional) |
| joining_date | DATE | Joining Date |
| status | ENUM | ACTIVE, INACTIVE |
| last_login_at | TIMESTAMP | Last login tracking (Nullable) |
| created_at | TIMESTAMP | Creation Time |
| updated_at | TIMESTAMP | Last Updated |
| deleted_at | TIMESTAMP | Soft delete flag (Nullable) |

#### 5.9 Roles (`roles`)
**Purpose**: Store all available roles in the system.
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | Role ID |
| name | VARCHAR(50) | Role Name (Unique) |
| description | TEXT | Optional Description |
| is_system | BOOLEAN | System role lock (Default false) |
| is_active | BOOLEAN | Role enabled/disabled (Default true) |
| created_at | TIMESTAMP | Creation Time |
| updated_at | TIMESTAMP | Last Updated |

#### 5.10 User Roles (`user_roles`)
**Purpose**: Assign one or more roles to each user.
**Fields**:
| Column | Type | Description |
|---|---|---|
| id | INT PK | User Role ID |
| user_id | INT FK | Reference to Users |
| role_id | INT FK | Reference to Roles |
| assigned_at | TIMESTAMP | Assignment Date |

#### 5.11 Settings (`settings`)
**Purpose**: Store restaurant-wide configuration. One installation = One restaurant.
**Fields**:
| Column | Type | Purpose |
|---|---|---|
| id | INT PK | Primary Key |
| restaurant_name | VARCHAR(200) | Restaurant Name |
| slogan | VARCHAR(255) | Optional slogan (Nullable) |
| logo | VARCHAR(255) | Restaurant logo (Nullable) |
| favicon | VARCHAR(255) | Browser icon (Nullable) |
| phone | VARCHAR(20) | Contact number |
| email | VARCHAR(150) | Email (Nullable) |
| website | VARCHAR(255) | Website (Nullable) |
| address | TEXT | Address |
| city | VARCHAR(100) | City |
| country | VARCHAR(100) | Country |
| postal_code | VARCHAR(20) | Postal code (Nullable) |
| currency | ENUM | PKR, USD, etc. |
| currency_symbol | VARCHAR(10) | Rs, $, € |
| tax_percentage | DECIMAL(5,2) | Default tax |
| service_charge | DECIMAL(5,2) | Optional service charge |
| timezone | VARCHAR(100) | Asia/Karachi |
| language | VARCHAR(50) | English |
| receipt_header | TEXT | Printed on receipt (Nullable) |
| receipt_footer | TEXT | Printed on receipt (Nullable) |
| order_prefix | VARCHAR(10) | ORD |
| invoice_prefix | VARCHAR(10) | INV |
| theme | ENUM | Light / Dark |
| created_at | TIMESTAMP | Created |
| updated_at | TIMESTAMP | Updated |

### 6. Relationships
- **Categories (1) to Menu Items (N)**
- **Menu Items (1) to Menu Variants (N)**
- **Menu Items (1) to Order Items (N)**
- **Menu Variants (1) to Order Items (N)**
- **Orders (1) to Order Items (N)**
- **Order Items (1) to Kitchen Queue (1)**
- **Order Items (1) to Bar Queue (1)**
- **Users (1) to User Roles (N)**
- **Roles (1) to User Roles (N)**
- **Users (1) to Categories (N)** (CreatedBy, UpdatedBy)
- **Users (1) to Menu Items (N)** (CreatedBy, UpdatedBy)
- **Users (1) to Menu Variants (N)** (CreatedBy, UpdatedBy)
- **Users (1) to Orders (N)** (CreatedBy, UpdatedBy, AssignedStaff)

### 7. Business Rules
1. **Rule 1**: A Menu Item must belong to one Category.
2. **Rule 2**: An Order must contain at least one Order Item.
3. **Rule 3**: Only Kitchen items are inserted into Kitchen Queue.
4. **Rule 4**: Only Bar items are inserted into Bar Queue.
5. **Rule 5**: Deleting a Category should not automatically delete Menu Items (Restricted).
6. **Rule 6**: Completed Orders should remain in the database for reporting.
7. **Rule 7**: A Menu Item may have one or more predefined variants depending on its pricing mode.
8. **Rule 8**: If the pricing mode is Single Price, the menu item must have exactly one default variant.
9. **Rule 9**: If the pricing mode allows custom variants, the cashier may enter a custom variant name and price during order creation.
10. **Rule 10**: Custom variants are stored only within the related Order Item and do not create permanent Menu Variants.
11. **Rule 11**: A user may have one or more roles.
12. **Rule 12**: A role may be assigned to multiple users.
13. **Rule 13**: Every user must have at least one assigned role.
14. **Rule 14**: A category name must be unique within the restaurant.
15. **Rule 15**: A category can contain multiple menu items.
16. **Rule 16**: A category cannot be permanently deleted if menu items belong to it.
17. **Rule 17**: Inactive categories are hidden from the POS but remain available for historical reports.
18. **Rule 18**: Categories and menu items are displayed according to their `display_order`.
19. **Rule 19**: Categories can have a custom icon, color, and image for better cashier usability.
20. **Rule 20**: Referential integrity is enforced with `onDelete: Restrict` and `onUpdate: Cascade` for audit fields (created_by/updated_by) and critical foreign keys.
21. **Rule 21**: Order Items store historical snapshots of the menu item name, variant name, preparation area, and unit price to preserve receipt and reporting accuracy.
22. **Rule 22**: Editing a Menu Item or Menu Variant must not modify existing Order Items.
23. **Rule 23**: A custom variant is stored only within the related Order Item and does not create a permanent Menu Variant.
24. **Rule 24**: Each Order Item maintains its own preparation status independently of the overall Order status.
25. **Rule 25**: The `line_number` determines the printed and display order of items on receipts.
26. **Rule 26**: Only OrderItems with preparationArea = KITCHEN may be inserted into the Kitchen Queue.
27. **Rule 27**: Each OrderItem can have only one Kitchen Queue record.
28. **Rule 28**: Changing a Kitchen Queue status updates the preparation progress of the corresponding OrderItem.
29. **Rule 29**: `completedAt` is automatically set when the status changes to READY.
30. **Rule 30**: Each Kitchen Queue record tracks the full preparation lifecycle, including acceptance, preparation, and completion times.
31. **Rule 31**: Kitchen remarks are optional and are used only for operational communication. They are not printed on customer receipts.
32. **Rule 32**: Only OrderItems with preparationArea = BAR may be inserted into the Bar Queue.
33. **Rule 33**: Each OrderItem can have only one Bar Queue record.
34. **Rule 34**: Changing a Bar Queue status updates the corresponding OrderItem preparation status.
35. **Rule 35**: Bar remarks are internal operational notes and are never printed on customer receipts.
36. **Rule 36**: Only one Settings record may exist.
37. **Rule 37**: Changing Settings must not affect historical Orders or Receipts.
38. **Rule 38**: Restaurant Logo is used for the Receipt, Login Page, Dashboard, and Reports.

### 8. Indexes
| Field | Reason |
|---|---|
| `name`, `slug` | Fast search and routing |
| `sku` | Exact product lookup |
| `category_id` | Load items by category |
| `display_order` | Fast sorting |
| `is_active`, `is_available` | Quickly load active records |
| `order_number` | Order lookup |
| `status` | Order/Queue status filtering |
| `preparation_area` | Route items to correct queue |
| `created_by`, `updated_by` | Audit logs and user activity reports |
| `payment_status` | Financial reporting |

### 9. Data Validation
- **Menu Price**: Must be greater than or equal to 0
- **Quantity**: Minimum = 1
- **Category Name**: Cannot be empty
- **Phone Number**: Unique if required
- **Unique Constraints**:
  - **User**: `phone`, `email`
  - **Role**: `name`
  - **UserRole**: `[user_id, role_id]` composite
  - **Category**: `name`, `slug`
  - **MenuItem**: `name`, `slug`, `sku`
  - **MenuVariant**: `[menu_item_id, name]` composite
  - **Settings**: `id`

### 10. Future Tables
- Customer Profiles / Loyalty Program
- Inventory / Stock Management

### 11. Database Workflow
```text
Cashier Creates Order
  │
  ▼
Save Order (with snapshot financials & source/payment info)
  │
  ▼
Select Variant (Predefined or Custom)
  │
  ▼
Calculate Price & Subtotals
  │
  ▼
Save Order Items
  │
  ▼
Check Preparation Area
  │                  │
  ▼                  ▼
Kitchen Queue      Bar Queue
```

### Revision History
| Version | Description |
|---|---|
| 1.0 | Initial DDD |
| 1.1 | User/Role redesign |
| 1.2 | Menu Variants & custom pricing |
| 1.3 | Audit fields & soft delete |
| 1.4 | Settings table |
| 1.5 | Payment method & order source, plus snake_case naming conventions |
