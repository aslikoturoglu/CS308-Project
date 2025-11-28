USE cs308_project;

CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    tax_id VARCHAR(50),
    home_address VARCHAR(255)
);

CREATE TABLE user_roles (
    user_id INT,
    role_id INT,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    warranty_status VARCHAR(50),
    distributor_info VARCHAR(100),
    cost_price DECIMAL(10,2)
);

CREATE TABLE product_categories (
    product_id INT,
    category_id INT,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE product_stock (
    stock_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity INT NOT NULL
);

CREATE TABLE discounts (
    discount_id INT PRIMARY KEY AUTO_INCREMENT,
    discount_name VARCHAR(100) NOT NULL,
    percent_value DECIMAL(5,2) NOT NULL
);

CREATE TABLE discount_products (
    discount_id INT,
    product_id INT,
    PRIMARY KEY (discount_id, product_id)
);

CREATE TABLE wishlists (
    wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL
);

CREATE TABLE wishlist_items (
    wishlist_id INT,
    product_id INT,
    PRIMARY KEY (wishlist_id, product_id)
);

CREATE TABLE carts (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL
);

CREATE TABLE cart_items (
    cart_id INT,
    product_id INT,
    quantity INT NOT NULL,
    PRIMARY KEY(cart_id, product_id)
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_date DATETIME NOT NULL,
    status VARCHAR(50),
    total_amount DECIMAL(10,2),
    shipping_address VARCHAR(255),
    billing_address VARCHAR(255)
);

CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2)
);

CREATE TABLE invoices (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deliveries (
    delivery_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    order_item_id INT NOT NULL,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10,2),
    delivery_address VARCHAR(255),
    delivery_status VARCHAR(50)
);

CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    amount DECIMAL(10,2)
);

CREATE TABLE refunds (
    refund_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT NOT NULL,
    refund_amount DECIMAL(10,2),
    refund_date DATETIME
);

CREATE TABLE return_requests (
    return_id INT PRIMARY KEY AUTO_INCREMENT,
    order_item_id INT NOT NULL,
    reason TEXT,
    status VARCHAR(50)
);

CREATE TABLE support_conversations (
    conversation_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender VARCHAR(20),
    message_text TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_attachments (
    attachment_id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    file_path VARCHAR(255)
);

CREATE TABLE product_comments (
    comment_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_ratings (
    rating_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5)
);
