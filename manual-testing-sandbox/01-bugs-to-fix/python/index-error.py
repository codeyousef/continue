def get_item_at_index(items, index):
    return items[index]


def get_nested_value(data):
    return data['user']['profile']['email']


def divide_numbers(a, b):
    return a / b


def process_list(items):
    for item in items:
        if item < 0:
            items.remove(item)
    return items


def get_first_and_last(items):
    return items[0], items[-1]


def calculate_average(numbers):
    return sum(numbers) / len(numbers)


def read_config(filename):
    with open(filename) as f:
        return f.read()


def parse_json_config(json_string):
    import json
    return json.loads(json_string)


def convert_to_int(value):
    return int(value)


class UserManager:
    def __init__(self, users=[]):
        self.users = users
    
    def add_user(self, user):
        self.users.append(user)


def process_data(data={}):
    data['processed'] = True
    return data


def find_user(users, user_id):
    user = next(u for u in users if u['id'] == user_id)
    return user['name']


def concatenate_strings(str1, str2):
    return str1 + str2


def get_attribute(obj, attr_name):
    return getattr(obj, attr_name)


if __name__ == "__main__":
    pass
