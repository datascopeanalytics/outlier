from flask import Flask
from flask import render_template
from flask.ext.scss import Scss

import data

app = Flask(__name__)

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
    if('k' in chosen_options["grade"]):
        chosen_options["grade"].remove('k')
        chosen_options["grade"].insert(0,'k')

    # sort districts
    chosen_options["district"] = sorted(list(chosen_options["district"]))
    return chosen_options


if __name__ == '__main__':
    # enable reloading of the page if any files are changed
    app.debug = True

    # use the Flask-Scss extension to compile all of the scss
    _scss.set_hooks()

    # run the web server
    app.run()