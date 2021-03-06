import os
import csv
import json
from pprint import pprint

# path manipulation convenience variables for below
web_root = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(web_root)
data_dir = os.path.join(project_root, "Dropbox", "Background")


def normalize(s):
    return s.strip()


def normalize_to_list(s):
    result = s.split(',')
    for i in range(len(result)):
        result[i] = normalize(result[i])
    return result


def get_survey_responses():
    # load the csv file and cast the variables into sane names to be used in javascript
    data = []
    with open(os.path.join(data_dir, 'updated_data.csv')) as csvfile:
        csvreader = csv.DictReader(csvfile)
        for row in csvreader:
            data.append({
                'before': normalize_to_list(row['Open-ended factors (beginning)']),
                'after': normalize_to_list(row['Open-ended factors (end)']),
                'district': normalize(row['District']),
                'grade': normalize(row['Grade']),
            })
    return data


def get_categories():
    categories = {}
    with open(os.path.join(data_dir, 'updated_categories.csv')) as csvfile:
        csvreader = csv.DictReader(csvfile)
        for row in csvreader:
            sub_category =  normalize(row['display_name'])
            categories[sub_category] = {
                'main_category': row['category'],
                'display_name': row['display_name'],
                'description': row['description'],
                }
    return categories


if __name__ == "__main__":
    data = get_survey_responses()
    # pprint(data)
    categories = get_categories()
    # pprint (categories)
    # print len(categories)
