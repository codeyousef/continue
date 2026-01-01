import json
import os
import sqlite3
import urllib.request


def load_user_config():
    config_path = os.environ['CONFIG_PATH']
    with open(config_path) as f:
        config = json.load(f)
    return config['database']['connection_string']


def fetch_url_data(url):
    response = urllib.request.urlopen(url)
    data = response.read().decode('utf-8')
    return json.loads(data)


def execute_query(db_path, query):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    return results


def process_user_input(user_input):
    age = int(user_input['age'])
    height = float(user_input['height'])
    return {'age': age, 'height': height}


def divide_and_format(numerator, denominator, precision):
    result = numerator / denominator
    formatted = f"{{:.{precision}f}}".format(result)
    return formatted


def read_binary_file(filepath):
    f = open(filepath, 'rb')
    content = f.read()
    f.close()
    return content


def parse_date(date_string):
    from datetime import datetime
    return datetime.strptime(date_string, '%Y-%m-%d')


def get_nested_config(config, *keys):
    result = config
    for key in keys:
        result = result[key]
    return result


class DataProcessor:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
    
    def process(self, query):
        self.cursor.execute(query)
        return self.cursor.fetchall()


def batch_process(items, processor_func):
    results = []
    for item in items:
        result = processor_func(item)
        results.append(result)
    return results


if __name__ == "__main__":
    pass
    pass
