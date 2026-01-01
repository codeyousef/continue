# SECURITY FILE: Intentional SQL injection vulnerabilities

import sqlite3
from flask import Flask, request, jsonify

app = Flask(__name__)


def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn


# VULNERABILITY 1: Direct string concatenation in SQL
@app.route('/users/<user_id>')
def get_user(user_id):
    conn = get_db_connection()
    # VULNERABLE: SQL Injection via string concatenation
    query = "SELECT * FROM users WHERE id = " + user_id
    user = conn.execute(query).fetchone()
    conn.close()
    return jsonify(dict(user)) if user else ('Not found', 404)


# VULNERABILITY 2: f-string SQL injection
@app.route('/search')
def search_users():
    search_term = request.args.get('q', '')
    conn = get_db_connection()
    # VULNERABLE: SQL Injection via f-string
    query = f"SELECT * FROM users WHERE name LIKE '%{search_term}%'"
    users = conn.execute(query).fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])


# VULNERABILITY 3: format() string SQL injection
@app.route('/products')
def get_products():
    category = request.args.get('category', '')
    min_price = request.args.get('min_price', '0')
    conn = get_db_connection()
    # VULNERABLE: SQL Injection via .format()
    query = "SELECT * FROM products WHERE category = '{}' AND price >= {}".format(
        category, min_price
    )
    products = conn.execute(query).fetchall()
    conn.close()
    return jsonify([dict(p) for p in products])


# VULNERABILITY 4: % operator SQL injection
@app.route('/orders/<order_id>')
def get_order(order_id):
    conn = get_db_connection()
    # VULNERABLE: SQL Injection via % operator
    query = "SELECT * FROM orders WHERE id = '%s'" % order_id
    order = conn.execute(query).fetchone()
    conn.close()
    return jsonify(dict(order)) if order else ('Not found', 404)


# VULNERABILITY 5: Multiple values injection
@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username', '')
    password = request.form.get('password', '')
    conn = get_db_connection()
    # VULNERABLE: SQL Injection in authentication (most dangerous!)
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    user = conn.execute(query).fetchone()
    conn.close()
    if user:
        return jsonify({'message': 'Login successful', 'user': dict(user)})
    return jsonify({'message': 'Invalid credentials'}), 401


# VULNERABILITY 6: ORDER BY injection
@app.route('/users/sorted')
def get_sorted_users():
    sort_column = request.args.get('sort', 'name')
    sort_order = request.args.get('order', 'ASC')
    conn = get_db_connection()
    # VULNERABLE: SQL Injection in ORDER BY clause
    query = f"SELECT * FROM users ORDER BY {sort_column} {sort_order}"
    users = conn.execute(query).fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])


# VULNERABILITY 7: LIMIT/OFFSET injection
@app.route('/users/paginated')
def get_paginated_users():
    page = request.args.get('page', '1')
    per_page = request.args.get('per_page', '10')
    conn = get_db_connection()
    # VULNERABLE: SQL Injection in LIMIT/OFFSET
    offset = (int(page) - 1) * int(per_page)
    query = f"SELECT * FROM users LIMIT {per_page} OFFSET {offset}"
    users = conn.execute(query).fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])


# VULNERABILITY 8: IN clause injection
@app.route('/users/batch')
def get_batch_users():
    ids = request.args.get('ids', '')  # Expected: "1,2,3"
    conn = get_db_connection()
    # VULNERABLE: SQL Injection in IN clause
    query = f"SELECT * FROM users WHERE id IN ({ids})"
    users = conn.execute(query).fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])


# VULNERABILITY 9: Dynamic table name
@app.route('/data/<table_name>')
def get_table_data(table_name):
    conn = get_db_connection()
    # VULNERABLE: SQL Injection via dynamic table name
    query = f"SELECT * FROM {table_name}"
    try:
        data = conn.execute(query).fetchall()
        conn.close()
        return jsonify([dict(row) for row in data])
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True)
