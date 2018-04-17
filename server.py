from flask import Flask
from flask import render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import datetime

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
    name = db.Column(db.String(5), nullable=False, unique=True)


class Update(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    author = db.Column(db.String(30), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date = db.Column(db.DateTime, nullable=False,
                     default=datetime.datetime.now())


class Editor(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    authority = db.Column(db.Integer, nullable=False, default=1)
    # 0: Full Access
    # 1: Below + create Updates
    # 2: Edit values and Add files
    # 3: No Access

    username = db.Column(db.String(32), nullable=False)
    password = db.Column(db.String(32), nullable=False)


def database():
    final = {'values': []}
    final['languages'] = [f.name for f in Language.query.order_by(Language.name).all()]
    final['phonemes'] = [f.name for f in Phoneme.query.all()]
    for language in Language.query.order_by(Language.name).all():
        languageobject = {'id': language.id,
                          'name': language.name,
                          'source': language.source,
                          'phonemes': {}}
        for frequency in language.phonemes:
            languageobject['phonemes'][frequency.phoneme.name] = frequency.value
        final['values'].append(languageobject)
    return final

def check_privelege(doer, privelege):
    if Editor.query.filter_by(username=doer['username'], password=doer['password']).first().authority <= privelege:
        return True
    else:
        return False

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
        link = Frequency.query.filter_by(
            language_id=language.id,
            phoneme_id=phoneme.id).first()
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
    #     phoneme: phoneme_name
    # }
    phoneme = Phoneme.query.filter_by(name=info['phoneme']).first()
    language = Language.query.filter_by(id=info['language_id']).first()
    frequency = Frequency.query.filter_by(
        phoneme_id=phoneme.id, language_id=info['language_id']).first()

    if Frequency.query.filter_by(phoneme_id=phoneme.id).count() == 1:
        # Delete phoneme
        db.session.delete(phoneme)

    language.phonemes = [frequency for frequency in language.phonemes
                         if frequency.phoneme_id != phoneme.id]
    db.session.delete(frequency)


def language_name_edit(info):
    """Edit the name of a Language."""
    # info = {
    #     language_id: language_id,
    #     language_name: name
    # }
    language = Language.query.filter_by(id=info['language_id']).first()
    language.name = info['language_name']


def language_source_add(info):
    """Add or replace a source"""
    # info = {
    #     language_id: language_id,
    #     language_source = source
    # }
    language = Language.query.filter_by(id=info['language_id']).first()
    language.source = info['language_source']


patch_functions = {
    "phoneme_add": phoneme_add,  # Add and edit value
    "phoneme_remove": phoneme_remove,  # Remove association and/or phoneme
    "language_name_edit": language_name_edit,  # Change language name
    "language_source_add": language_source_add  # Add/edit source
}


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
def backend():
    # # GET method returns the latest database
    # if request.method == "GET":
    #     return jsonify(database())

    # POST method appends input to database['values']

    if request.method == "POST":
        received = request.get_json()

        if check_privelege(received['editor'], 2):
            language = Language(name=received['name'], source=received['source'])
            db.session.add(language)

            for phoneme, value in received['phonemes'].items():
                with db.session.no_autoflush:
                    search = Phoneme.query.filter_by(name=phoneme).first()
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
        received = request.get_json()

        if check_privelege(received['editor'], 2):
            patch_functions[received['action']](received['data'])
            db.session.commit()

    return jsonify(database())


# Manipulate Updates
@app.route("/updates", methods=["GET", "POST", "PATCH"])
def updates():

    if request.method == "POST":
        received = request.get_json()
        if check_privelege(received['editor'], 1):
            update = Update(author=received['author'],
                            title=received['title'],
                            content=received['content'])
            db.session.add(update)

    elif request.method == "PATCH":
        received = request.get_json()
        if check_privelege(received['editor'], 1):
            update = Update.query.filter_by(id=received['id']).first()
            update.name = received['author']
            update.title = received['title']
            update.content = received['content']

    db.session.commit()
    return jsonify([{"author": update.author,
                     "id": update.id,
                     "title": update.title,
                     "content": update.content,
                     "date": update.date.strftime("%m/%d/%Y | %A, %B %d, %Y")}
                    for update in Update.query.all()])

# Manipulate Editor
@app.route("/editors", methods=["POST"])
def editors():
    if request.method == "POST":
        received = request.get_json()
        if Editor.query.filter_by(username=received['username'].count()) == 0 and check_privelege(received['editor'], 0):
            user = Editor(authority = received['authority'],
                          username = received['username'],
                          password = received['password'])
            db.session.add(user)
            db.session.commit()
            return user
        else:
            return "Bad Request"
    else:
        return "Bad Request"

if __name__ == "__main__":
    app.run(host="0.0.0.0")
