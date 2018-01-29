import pickle
from flask import Flask
from flask import render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import ulid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config.update(
    DEBUG=True,
    TEMPLATES_AUTO_RELOAD=True
)
db = SQLAlchemy(app)


class Frequency(db.Model):
    language_id = db.Column(db.Integer, db.ForeignKey('language.id'), primary_key=True)
    phoneme_id = db.Column(db.Integer, db.ForeignKey('phoneme.id'), primary_key=True)
    value = db.Column(db.Float(6), nullable=False)
    phoneme = db.relationship('Phoneme')


class Language(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    source = db.Column(db.LargeBinary)
    phonemes = db.relationship('Frequency')


class Phoneme(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(5), nullable=False)


def database():
    final = {'values': []}
    final['languages'] = [f.name for f in Language.query.all()]
    final['phonemes'] = [f.name for f in Phoneme.query.all()]
    for language in Language.query.all():
        languageobject = {'name': language.name,
                          'source': language.source,
                          'phonemes': {}}
        languageobject['name'] = language.name
        for frequency in language.phonemes:
            languageobject['phonemes'][frequency.phoneme.name] = frequency.value
        final['values'].append(languageobject)
    return final


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
        return jsonify(database())

    # POST method appends input to database['values']
    elif request.method == "POST":
        recieved = request.get_json()
        language = Language(name=recieved['name'], source=recieved['source'])
        db.session.add(language)

        for phoneme, value in recieved['phonemes'].items():
            with db.session.no_autoflush:
                search = Phoneme.query.filter_by(name=phoneme).first()
            print(search)
            if not search:
                search = Phoneme(name=phoneme)
                db.session.add(search)
            link = Frequency(value=value, phoneme=search)
            language.phonemes.append(link)
            db.session.add(link)
        db.session.commit()
        return jsonify(database())


    # # PATCH method inputs edited language and returns updated database
    # elif request.method == "PATCH":
    #     newlanguage = request.get_json()
    #     database['values'] = [newlanguage if language['id'] == newlanguage['id'] else language for language in database['values']]
    #     saveDatabase()
    #     return jsonify(database())


if __name__ == "__main__":
    app.run(host="0.0.0.0")
