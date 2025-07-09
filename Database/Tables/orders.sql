CREATE TABLE IF NOT EXISTS orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    table_id INT,
    item_id INT,
    quantity INT,
    order_time DATETIME,
    FOREIGN KEY (table_id) REFERENCES tables(table_id),
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);



