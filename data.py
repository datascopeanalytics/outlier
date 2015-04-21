import os
import csv
import json


def normalize_to_list(s):
    result = s.split(',')
    for i in range(len(result)):
        result[i] = result[i].strip().lower()
    return result

def get_survey_responses():
    # load the csv file and cast the variables into sane names to be used in javascript
    data = []
    with open('Dropbox/Background/data.csv') as csvfile:
        csvreader = csv.DictReader(csvfile)
        for row in csvreader:
            data.append({
                'before': normalize_to_list(row['Open-ended factors (beginning)']),
                'after': normalize_to_list(row['Open-ended factors (end)']),
            })
    return data

if __name__ == "__main__":
    data = get_survey_responses()
    for d in data:
        print '\n'.join(d['before'])
        print '\n'.join(d['after'])
