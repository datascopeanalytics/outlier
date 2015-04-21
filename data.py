import os
import csv
import json
from pprint import pprint


def normalize(s):
    return s.strip().lower()


def normalize_to_list(s):
    result = s.split(',')
    for i in range(len(result)):
        result[i] = normalize(result[i])
    return result


def get_survey_responses():
    # load the csv file and cast the variables into sane names to be used in javascript
    data = []
    with open('Dropbox/Background/data.csv') as csvfile:
        csvreader = csv.DictReader(csvfile)
        for row in csvreader:
            print row.keys()
            data.append({
                'before': normalize_to_list(row['Open-ended factors (beginning)']),
                'after': normalize_to_list(row['Open-ended factors (end)']),
                'district': normalize(row['District']),
                'grade': normalize(row['Grade']),
            })
    return data

if __name__ == "__main__":
    data = get_survey_responses()
    pprint(data)
