# BUG FILE: Intentional Python errors for testing

def get_item_at_index(items, index):
    """BUG 1: No bounds checking"""
    return items[index]  # Will crash if index out of range


def get_nested_value(data):
    """BUG 2: No key checking"""
    return data['user']['profile']['email']  # KeyError if missing


def divide_numbers(a, b):
    """BUG 3: No zero division check"""
    return a / b  # ZeroDivisionError


def process_list(items):
    """BUG 4: Modifying list while iterating"""
    for item in items:
        if item < 0:
            items.remove(item)  # Dangerous: modifying during iteration
    return items


def get_first_and_last(items):
    """BUG 5: No empty list check"""
    return items[0], items[-1]  # IndexError if empty


def calculate_average(numbers):
    """BUG 6: Division by zero when empty"""
    return sum(numbers) / len(numbers)  # ZeroDivisionError if empty


def read_config(filename):
    """BUG 7: File not found not handled"""
    with open(filename) as f:
        return f.read()  # FileNotFoundError


def parse_json_config(json_string):
    """BUG 8: Invalid JSON not handled"""
    import json
    return json.loads(json_string)  # JSONDecodeError


def convert_to_int(value):
    """BUG 9: Invalid conversion not handled"""
    return int(value)  # ValueError if not numeric


class UserManager:
    """BUG 10: Mutable default argument"""
    def __init__(self, users=[]):  # Mutable default argument!
        self.users = users
    
    def add_user(self, user):
        self.users.append(user)


def process_data(data={}):
    """BUG 11: Another mutable default"""
    data['processed'] = True
    return data


def find_user(users, user_id):
    """BUG 12: Assuming result exists"""
    user = next(u for u in users if u['id'] == user_id)  # StopIteration if not found
    return user['name']


def concatenate_strings(str1, str2):
    """BUG 13: None not handled"""
    return str1 + str2  # TypeError if either is None


def get_attribute(obj, attr_name):
    """BUG 14: Missing attribute not handled"""
    return getattr(obj, attr_name)  # AttributeError


# Test the functions (these will crash)
if __name__ == "__main__":
    # Uncomment to see crashes:
    # print(get_item_at_index([1, 2, 3], 10))
    # print(divide_numbers(10, 0))
    # print(calculate_average([]))
    pass
