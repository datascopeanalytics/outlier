from flask import Flask
from flask import render_template
from flask.ext.scss import Scss

app = Flask(__name__)
app.debug = True
Scss(app, static_dir='static', asset_dir='assets')


@app.route('/')
def hello_world():
    return render_template('index.html')


if __name__ == '__main__':
    app.run()
