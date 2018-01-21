import pickle
from flask import Flask
from flask import render_template, jsonify, request
import ulid

app = Flask(__name__)
app.config.update(
    DEBUG=True,
    TEMPLATES_AUTO_RELOAD=True
)

try:
    with open("save.p", "rb") as f:
        database = pickle.load(f)
        # Can be commented out after non-id languages are all converted
        for item in database['values']:
            if not 'id' in item:
                item['id'] = ulid.new().str
except (FileNotFoundError) as e:
    database = {'languages': [],
                'phonemes': [],
                'values': []}

def saveDatabase():
    # Save copy under separate name
    with open("newestsave.p", "wb") as f:
        pickle.dump(database, f)

# Render the client at the default URL
@app.route("/")
def initial():
    return render_template('index.html')

# Place for client to communicate with the server
@app.route("/server", methods=["GET", "POST", "PATCH"])
# TODO add more methods
def backend():
    # GET method returns the latest database
    if request.method == "GET":
        return jsonify(database)

    # POST method currently appends to the languages
    elif request.method == "POST":
        newlanguage = request.get_json()
        newlanguage['id'] = ulid.new().str
        database['values'].append(newlanguage)

        # Add new phonemes
        newphonemes = list(newlanguage[ 'phonemes' ])
        uniquephonemes = list(set(newphonemes) - set(database[ 'phonemes' ]))
        database['phonemes'] = database['phonemes'] + uniquephonemes

        # Add new language
        newlangname = {newlanguage['name']}
        uniquelanguages = list(newlangname - set(database['languages']))
        database['languages'] = database['languages'] + uniquelanguages

        saveDatabase()
        return jsonify(database)

    # PATCH method inputs edited language and returns updated database
    elif request.method == "PATCH":
        newlanguage = request.get_json()
        database['values'] = [newlanguage if language['id'] == newlanguage['id'] else language for language in database['values']]
        saveDatabase()
        return jsonify(database)

    else:
        return

if __name__ == "__main__":
    app.run(host="0.0.0.0")
