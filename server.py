import pickle
from flask import Flask
from flask import render_template, jsonify, request
import time
import random
app = Flask(__name__)
app.config.update(
    DEBUG=True,
    TEMPLATES_AUTO_RELOAD=True
)

try:
    with open("save.p", "rb") as f:
        database = pickle.load(f)
except (FileNotFoundError) as e:
    database = {'languages': [],
                'phonemes': [],
                'values': []}


# Render the client at the default URL
@app.route("/")
def initial():
    return render_template('index.html')

# Place for client to communicate with the server
@app.route("/server", methods=["GET", "POST"])
def backend():
    # Get method returns the latest database
    if request.method == "GET":
        return jsonify(database)

    # Post method currently appends to the languages
    # TODO add more methods
    elif request.method == "POST":
        newlanguage = request.get_json()
        database['values'].append(newlanguage)

        # Add new phonemes
        newphonemes = list(newlanguage[ 'phonemes' ])
        uniquephonemes = list(set(newphonemes) - set(database[ 'phonemes' ]))
        database['phonemes'] = database['phonemes'] + uniquephonemes

        # Add new language
        newlang = {newlanguage['name']}
        uniquelanguages = list(newlang - set(database['languages']))
        database['languages'] = database['languages'] + uniquelanguages

        # Save copy under separate name
        with open("newestsave.p", "wb") as f:
            pickle.dump(database, f)

        return jsonify(database)

    else:
        return

if __name__ == "__main__":
    app.run(host="0.0.0.0")
