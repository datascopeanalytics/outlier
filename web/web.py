import sys

from flask import Flask
from flask import render_template
from flask.ext.scss import Scss
from flask_frozen import Freezer

import data

app = Flask(__name__)
freezer = Freezer(app)

# configure flask extensions
_scss = Scss(app, static_dir='static', asset_dir='assets')


@app.route('/')
def hello_world():
    raw_data = data.get_survey_responses()
    categories = data.get_categories()
    chosen_options = get_chosen_options(raw_data)
    return render_template('index.html', raw_data=raw_data, categories=categories, chosen_options=chosen_options)


def get_chosen_options(raw_data):
    #get unique options with sets
    chosen_options = {"grade": set(), "district": set()};
    for response in raw_data:
        chosen_options["grade"].add(response["grade"])
        chosen_options["district"].add(response["district"])

    # sort grades
    chosen_options["grade"] = sorted(list(chosen_options["grade"]))
    if('K' in chosen_options["grade"]):
        chosen_options["grade"].remove('K')
        chosen_options["grade"].insert(0,'K')
    if('4 & 5' in chosen_options["grade"]):
        chosen_options["grade"].remove('4 & 5')

    # sort districts
    chosen_options["district"] = sorted(list(chosen_options["district"]))
    return chosen_options


if __name__ == '__main__':
    # enable reloading of the page if any files are changed
    app.debug = True

    # use the Flask-Scss extension to compile all of the scss
    _scss.set_hooks()

    # run the web server
    if len(sys.argv) > 1 and sys.argv[1] == "build":
        freezer.freeze()
    else:
        app.run()
