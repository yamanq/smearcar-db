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

# TODO Updates table (add, edit, delete) (author, date, title, content)
# TODO convert pickle to db

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
    name = db.Column(db.String(5), nullable=False, unique=True)


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

patch_functions = {
    "phoneme_add": phoneme_add, # Add and edit value
    "phoneme_remove": phoneme_remove, # Remove association and phoneme if necessary
    # "language_name_edit": language_name_edit, # Change language name
    # "language_source_add": language_source_add # Add/edit source
}


def phoneme_add(info):
    """Add or edit value associated with phoneme."""
    # info = {
    #     language_id: language_id,
    #     phoneme: phoneme_name,
    #     value: phoneme_value
    # }
    phoneme = Phoneme.query.filter_by(name=info['phoneme']).first()
    language = Language.query.filter_by(id=info['language_id']).first()
    if phoneme:
        link = Frequency.query.filter_by(language_id=language.id, phoneme_id=phoneme.id).first()
        link.value = info['value']
    else:
        phoneme = Phoneme(name=info['phoneme'])
        link = Frequency(value=info['value'])
        link.phoneme = phoneme
        language.phonemes.append(link)
        db.session.add_all([phoneme, link])


def phoneme_remove(info):
    """Remove a phoneme from a language."""
    # info = {
    #     language_id: language_id,
    #     phoneme_id: phoneme_id
    # }
    pass




# Render the client at the default URL
@app.route("/")
def initial():
    return render_template('index.html')


# GET method for files
@app.route("/server/<lang_id>")
def file_return(lang_id):
    return Language.query.filter_by(id=lang_id).first().source


# Place for client to communicate with the server
@app.route("/server", methods=["GET", "POST", "PATCH"])
# TODO add more methods
def backend():
    # # GET method returns the latest database
    # if request.method == "GET":
    #     return jsonify(database())

    # POST method appends input to database['values']
    if request.method == "POST":
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
        # return jsonify(database())


    # PATCH method inputs edited language and returns updated database
    elif request.method == "PATCH":
        recieved = request.get_json()
        patch_functions[recieved['action']](recieved['data'])
        db.session.commit()
        # database['values'] = [newlanguage if language['id'] == newlanguage['id'] else language for language in database['values']]
        # saveDatabase()

    return jsonify(database())


# if __name__ == "__main__":
#     app.run(host="0.0.0.0")
