from flask import Flask
from flask import render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
# from numpy.polynomial.polynomial import polyfit
# from numpy import corrcoef
# import numpy as np
# import tkinter
# import matplotlib.pyplot as plt
from flask import send_file
import datetime
import os
# from scipy.optimize import curve_fit
# from scipy import stats

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config.update(
    DEBUG=True,
    TEMPLATES_AUTO_RELOAD=True
)
db = SQLAlchemy(app)
working_dir = os.path.dirname(__file__)

class Frequency(db.Model):
    language_id = db.Column(db.Integer, db.ForeignKey('language.id'), primary_key=True)
    phoneme_id = db.Column(db.Integer, db.ForeignKey('phoneme.id'), primary_key=True)
    value = db.Column(db.Float(6), nullable=False)
    phoneme = db.relationship('Phoneme')


class Language(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    # source = db.Column(db.LargeBinary)
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

# def rand_jitter(arr):
#     stdev = .01*(max(arr)-min(arr))
#     return arr + np.random.randn(len(arr)) * stdev

# def yule(x, a, b, c):
#     return a * (c**x) / (x**b)

# def uniqueness(title="Figure 1"):
#     x = []
#     y = []
#     languages = Language.query.all()
#     for phoneme in Phoneme.query.all():
#         frequencies = Frequency.query.filter_by(phoneme_id=phoneme.id).all()
#         values = [x.value for x in frequencies]
#         x.append(len(frequencies) / len(languages))
#         y.append(sum(values) / len(frequencies))
#     print(corrcoef(x, y))
#     b, m = polyfit(x, y, 1)
#     plt.scatter(rand_jitter(x), y, s=7)
#     bestfit = [b + m * number for number in x]
#     plt.plot(x, bestfit, '-')
#     plt.xlabel("Phoneme Presence in Studied Languages")
#     plt.ylabel("Average Frequency / %")
#     plt.title(title)
#     plt.show()

def phoneme_rank(yule=True, detail=1000, textOutput=False, title="Figure 2", databaseOut=False):
    speakers = {
        'Spanish (Castillian)': 46.4,
        'English (American)': 308.9,
        'Spanish (American)': 435.7,
        'Japanese': 128,
        'German': 76,
        'Arabic': 315,
        'Mandarin': 909,
        'Portuguese (Brazilian)': 194,
        'French': 76.8,
        'Hindi': 260,
        'Polish': 40.3,
        'Samoan': 0.40742,
        'Kaiwa': 0.0021,
        'Bengali': 243,
        'Swedish': 12.8,
        'Malay': 60.7,
        'Italian': 64.8
    }
    total = sum(speakers.values())
    calculation = sorted([(phoneme.name, sum([frequency.value * speakers[Language.query.filter_by(id=frequency.language_id).first().name] / (total * len(Language.query.filter_by(name=Language.query.filter_by(id=frequency.language_id).first().name).all()) ) for frequency in Frequency.query.filter_by(phoneme_id=phoneme.id).all()])) for phoneme in Phoneme.query.limit(detail).all()], key=lambda x:-x[1])
    if databaseOut:
        return calculation
    labels, data = zip(*calculation)
    if textOutput:
        return labels

    x = range(len(data)+1)[1:]
    if yule:
        # plot raw data
        plt.plot(x, data, 'b-')

        # Calculate Yule Distribution
        popt, pcov = curve_fit(yule, x, data)
        print(popt)

        # Calculate R^2
        ss_res = np.sum((data - yule(x, *popt))**2)
        ss_tot = np.sum((data - np.mean(data))**2)
        print(1 - (ss_res / ss_tot))

        plt.yscale("log")
        plt.plot(x, yule(x, *popt), "r--")
    else:
        plt.bar(x, data)

    # plt.xlim(xmin=1)
    plt.xlabel("Phoneme Rank")
    plt.ylabel("Frequency weighted by Number of Speakers / %")
    plt.title(title)
    plt.show()

# def phoible_compare():
#     # lang_id = Language.query.filter_by(name=lang).first().id
#     with open("phoible", "r") as f:
#         phoible = f.read().splitlines()
#     phonemes = [phoneme.name for phoneme in Phoneme.query.all()]
#     return [x for x in phoible if x in phonemes]

# def rank_compare(textOutput=True, title="Rank Comparison"):
#     phoible = phoible_compare()
#     original = phoneme_rank(textOutput=True)
#     phoible_ranks = list(range(len(phoible)+1))[1:]
#     original_ranks = [original.index(phoneme) + 1 for phoneme in phoible]
#     if textOutput:
#         return {"kendall": stats.kendalltau(phoible_ranks, original_ranks),
#                 "spearman": stats.spearmanr(phoible_ranks, original_ranks)}
#     plt.scatter(phoible_ranks, original_ranks)
#     plt.xlabel("Phoible Rank")
#     plt.ylabel("Weighted Rank")
#     plt.title(title)
#     plt.show()


def database():
    final = {'values': []}
    final['languages'] = [f.name for f in Language.query.order_by(Language.name).all()]
    final['phonemes'] = [f.name for f in Phoneme.query.all()]

    # Add All Optional
    allobject = {'id': 0,
                 'name': "All",
                 'phonemes': dict(phoneme_rank(databaseOut=True))}
    final['values'].append(allobject)
    final['languages'].append('All')

    for language in Language.query.order_by(Language.name).all():
        languageobject = {'id': language.id,
                          'name': language.name,
                          # 'source': language.source,
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
    if not phoneme:
        phoneme = Phoneme(name=info['phoneme'])
        db.session.add(phoneme)
    link = Frequency.query.filter_by(
        language_id=language.id,
        phoneme_id=phoneme.id).first()
    if not link:
        link = Frequency(value=info['value'])
        link.phoneme = phoneme
        language.phonemes.append(link)
        db.session.add(link)
    else:
        link.value = info['value']


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


# def language_source_add(info):
#     """Add or replace a source"""
#     # info = {
#     #     language_id: language_id,
#     #     language_source = source
#     # }
#     language = Language.query.filter_by(id=info['language_id']).first()
#     language.source = info['language_source']


patch_functions = {
    "phoneme_add": phoneme_add,  # Add and edit value
    "phoneme_remove": phoneme_remove,  # Remove association and/or phoneme
    "language_name_edit": language_name_edit,  # Change language name
    # "language_source_add": language_source_add  # Add/edit source
}



# Render the client at the default URL
@app.route("/")
def initial():
    return render_template('index.html')


# GET method for files
@app.route("/server/<lang_id>", methods=["GET"])
def file_return(lang_id):
    extensions = dict(x.split(".") for x in os.listdir("files/"))
    try:
        return send_file('files/' + lang_id+"."+extensions[str(lang_id)])
    except Exception as e:
        return str(e)

# POST files
@app.route("/source", methods=["POST"])
def source_add():
    """Add or replace a source"""
    if check_privelege({
            "username": request.form["username"],
            "password": request.form["password"]
        }, 2):
        f = request.files['file']
        write_path = os.path.join(working_dir, "files", request.form['lang_id']+"."+f.filename.split(".")[-1])
        # with open(write_path, 'w') as a:
        #     a.write()
        f.save(write_path)
        return "nice"

    return "Error"



# Add and Edit data
@app.route("/server", methods=["GET", "POST", "PATCH"])
def backend():
    # # GET method returns the latest database
    # if request.method == "GET":
    #     return jsonify(database())

    # POST method appends input to database['values']

    if request.method == "POST":
        received = request.get_json()

        if check_privelege(received['editor'], 2):
            language = Language(name=received['name'])
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
        if Editor.query.filter_by(username=received['username']).count() == 0 and check_privelege(received['editor'], 0):
            user = Editor(authority = received['authority'],
                          username = received['username'],
                          password = received['password'])
            db.session.add(user)
            db.session.commit()
            return "Success"
        else:
            return "Bad Request"
    else:
        return "Bad Request"

# @app.route("/directory", methods=["GET","POST"])
# def directory():
#     rootDir = "directory/"
#     if request.method == "GET":
#         return jsonify({"dir": rootDir})
#     if request.method == "POST":
#         received = request.get_json()
#         files = []
#         for filename in os.listdir(received["path"]):
#             file = {}
#             filedir = received["path"]+filename
#             isdir = os.path.isdir(filedir)
#             file["name"] = filename
#             file["date"] = datetime.datetime.fromtimestamp(os.path.getmtime(filedir)).strftime("%B %d, %Y")
#             if(isdir):
#                 file["size"] = "- - - -"
#                 file["folder"] = "true"
#             else:
#                 file["size"] = sizeof_fmt(os.path.getsize(filedir))
#                 file["folder"] = "false"

#             files.append(file)
#         return jsonify(files)

# def sizeof_fmt(num, suffix='B'):
#     for unit in ['','K','M','G','T','P','E','Z']:
#         if abs(num) < 1024.0:
#             return "%3.1f%s%s" % (num, unit, suffix)
#         num /= 1024.0
#     return "%.1f%s%s" % (num, 'Yi', suffix)

# @app.route("/directory/<path:file>", methods=["GET"])
# def dir_download(file):
#     print(file)
#     return send_file(file)

if __name__ == "__main__":
    app.run(host="0.0.0.0")

