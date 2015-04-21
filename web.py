from flask import Flask
from flask import render_template
from flask.ext.scss import Scss

import data

app = Flask(__name__)
app.debug = True
Scss(app, static_dir='static', asset_dir='assets')


@app.route('/')
def hello_world():
    return render_template('index.html', data=data.get_survey_responses())


if __name__ == '__main__':
    app.run()
