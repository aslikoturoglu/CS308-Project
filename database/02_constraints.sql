USE cs308_project;

ALTER TABLE user_roles
ADD FOREIGN KEY (user_id) REFERENCES users(user_id),
ADD FOREIGN KEY (role_id) REFERENCES roles(role_id);

ALTER TABLE product_categories
ADD FOREIGN KEY (product_id) REFERENCES products(product_id),
ADD FOREIGN KEY (category_id) REFERENCES categories(category_id);

ALTER TABLE product_stock
ADD FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE discount_products
ADD FOREIGN KEY (discount_id) REFERENCES discounts(discount_id),
ADD FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE wishlists
ADD FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE wishlist_items
ADD FOREIGN KEY (wishlist_id) REFERENCES wishlists(wishlist_id),
ADD FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE carts
ADD FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE cart_items
ADD FOREIGN KEY (cart_id) REFERENCES carts(cart_id),
ADD FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE orders
ADD FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE order_items
ADD FOREIGN KEY (order_id) REFERENCES orders(order_id),
ADD FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE invoices
ADD FOREIGN KEY (order_id) REFERENCES orders(order_id);

ALTER TABLE deliveries
ADD FOREIGN KEY (order_id) REFERENCES orders(order_id),
ADD FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id),
ADD FOREIGN KEY (customer_id) REFERENCES users(user_id),
ADD FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE payments
ADD FOREIGN KEY (order_id) REFERENCES orders(order_id);

ALTER TABLE refunds
ADD FOREIGN KEY (payment_id) REFERENCES payments(payment_id);

ALTER TABLE return_requests
ADD FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id);

ALTER TABLE support_conversations
ADD FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE support_messages
ADD FOREIGN KEY (conversation_id) REFERENCES support_conversations(conversation_id);

ALTER TABLE support_attachments
ADD FOREIGN KEY (message_id) REFERENCES support_messages(message_id);

ALTER TABLE product_comments
ADD FOREIGN KEY (product_id) REFERENCES products(product_id),
ADD FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE product_ratings
ADD FOREIGN KEY (product_id) REFERENCES products(product_id),
ADD FOREIGN KEY (user_id) REFERENCES users(user_id);
