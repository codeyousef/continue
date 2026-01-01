# BUG FILE: Missing exception handling for testing

import json
import os
import sqlite3
import urllib.request


def load_user_config():
    """BUG 1: Multiple unhandled exceptions"""
    config_path = os.environ['CONFIG_PATH']  # KeyError if not set
    with open(config_path) as f:  # FileNotFoundError
        config = json.load(f)  # JSONDecodeError
    return config['database']['connection_string']  # KeyError


def fetch_url_data(url):
    """BUG 2: Network errors not handled"""
    response = urllib.request.urlopen(url)  # URLError, HTTPError
    data = response.read().decode('utf-8')  # UnicodeDecodeError
    return json.loads(data)  # JSONDecodeError


def execute_query(db_path, query):
    """BUG 3: Database errors not handled"""
    conn = sqlite3.connect(db_path)  # OperationalError
    cursor = conn.cursor()
    cursor.execute(query)  # SQL errors
    results = cursor.fetchall()
    conn.close()
    return results
    # Also: connection not closed on error


def process_user_input(user_input):
    """BUG 4: Type conversion without handling"""
    age = int(user_input['age'])  # ValueError, KeyError
    height = float(user_input['height'])  # ValueError, KeyError
    return {'age': age, 'height': height}


def divide_and_format(numerator, denominator, precision):
    """BUG 5: Multiple potential errors"""
    result = numerator / denominator  # ZeroDivisionError
    formatted = f"{{:.{precision}f}}".format(result)  # ValueError
    return formatted


def read_binary_file(filepath):
    """BUG 6: No cleanup on error"""
    f = open(filepath, 'rb')
    content = f.read()
    # If error occurs, file handle leaks
    f.close()
    return content


def parse_date(date_string):
    """BUG 7: Date parsing without handling"""
    from datetime import datetime
    return datetime.strptime(date_string, '%Y-%m-%d')  # ValueError


def get_nested_config(config, *keys):
    """BUG 8: Deep nesting without checks"""
    result = config
    for key in keys:
        result = result[key]  # KeyError at any level
    return result


class DataProcessor:
    """BUG 9: Resource management issues"""
    
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path)  # Not in try block
        self.cursor = self.conn.cursor()
    
    def process(self, query):
        self.cursor.execute(query)  # Errors leave connection open
        return self.cursor.fetchall()
    
    # Missing __del__ or context manager for cleanup


def batch_process(items, processor_func):
    """BUG 10: One failure stops all processing"""
    results = []
    for item in items:
        result = processor_func(item)  # One bad item crashes everything
        results.append(result)
    return results


# Example usage that will crash
if __name__ == "__main__":
    # These will all raise exceptions:
    # load_user_config()
    # fetch_url_data("http://invalid-url")
    # parse_date("not-a-date")
    pass
