from flask import Flask
from flask import render_template
from flask.ext.scss import Scss

import data

app = Flask(__name__)
app.debug = True
Scss(app, static_dir='static', asset_dir='assets')


@app.route('/')
def hello_world():
    raw_data = data.get_survey_responses()
    chosen_options = {"grade": set(), "district": set()};
    for response in raw_data:
        chosen_options["grade"].add(response["grade"])
        chosen_options["district"].add(response["district"])

    return render_template('index.html', raw_data=raw_data, chosen_options=chosen_options)


if __name__ == '__main__':
    app.run()
