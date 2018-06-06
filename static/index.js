var navSelect = "home", flipMode = "dataValues1", currDir = "",
    dataMode, data, languageChart, rootDir, files,
    serverURL = window.location.origin,
    dataOpen = false, submittable = true, clickable = true,
    dropOp = {}, dropOpStore = {}, loginInfo = {};

var navi = [ // Array containing navigation items in form [Font-Awesome class name, Display Text, Onclick function].
    ["home", "Home", "home"],
    ["bar-chart", "Data Values", "dataValues1"],
    ["database", "Database and Files", "files"],
    ["info", "About", "about"]
];

var authorityLabels = {
    0: "#0: Full access",
    1: "#1: Create updates",
    2: "#2: Edit values and add files",
    3: "#3: No access"
};

var modals = [
    {
        name: "Add Language",
        modal: "newLanguage",
        button: "addData",
        structure: {
            width: "20%",
            form: [
                {
                    name: "Name",
                    formType: "input"
                },
                {
                    name: "Source",
                    formType: "input",
                    inputType: "file"
                },
                {
                    name: "Phonemes",
                    formType: "textarea",
                    height: "25vh"
                }
            ]
        }
    },
    {
        name: "Edit Language",
        modal: "editLanguage",
        button: "editData",
        buttonClick: function() {
            var langInfo = language(dropOpStore["langSelect"]);
            document.querySelectorAll("#editLanguageName input")[0].value = langInfo.name;
            var k = Object.keys(langInfo.phonemes);
            var v = Object.values(langInfo.phonemes);
            var str = "";
            for(var i = 0; i < k.length; i++) {
                str += k[i] + " " + v[i] + ((i === k.length-1) ? "" : "\n");
            }
            document.querySelectorAll("#editLanguagePhonemes textarea")[0].value = str;
        },
        structure: {
            width: "20%",
            form: [
                {
                    name: "Name",
                    formType: "input"
                },
                {
                    name: "Source",
                    formType: "input",
                    inputType: "file"
                },
                {
                    name: "Phonemes",
                    formType: "textarea",
                    height: "25vh"
                }
            ]
        }
    },
    {
        name: "Login",
        modal: "login",
        button: "signIn",
        structure: {
            width: "20%",
            form: [
                {
                    name: "Username",
                    formType: "input"
                },
                {
                    name: "Password",
                    formType: "input",
                    inputType: "password"
                },
            ]
        }
    },
    {
        name: "Add User",
        modal: "addUser",
        button: "addUserButton",
        structure: {
            width: "20%",
            form: [
                {
                    name: "Username",
                    formType: "input"
                },
                {
                    name: "Authority",
                    formType: "input",
                    inputType: "number"
                },
                {
                    name: "Password",
                    formType: "input",
                    inputType: "password"
                }
            ]
        }
    },
    {
        name: "Write Update",
        modal: "writePost",
        button: "addUpdateButton",
        structure: {
            width: "40%",
            form: [
                {
                    name: "Title",
                    formType: "input"
                },
                {
                    name: "Author",
                    formType: "input"
                },
                {
                    name: "Message",
                    formType: "textarea",
                    height: "18vh"
                }
            ]
        }
    },
];

function Rnd(item,fig) {
  if(varType(item) === "Array") {
    var arr = [];
    for(var i = 0; i < item.length; i++) arr[i] = Rnd(item[i],fig);
    return arr;
  } else if(varType(item) === "Number") {
    return Math.round(item*Math.pow(10,fig))/Math.pow(10,fig);
  } else {
    throw new TypeError("Expected Integers, got " + varType(item) + ".");
  }
}

function varType(variable) {
  var type = typeof variable;
  if(type === "object") {
      return (variable.constructor === Array) ? "Array" : "Object";
  } else {
    return type[0].toUpperCase() + type.slice(1);
  }
}


function createNav() {
    for (var i = 0; i < navi.length; i++) { // Create navigation tabs.
        var side = document.getElementById("sidebar");
        var div = document.createElement("div");
        div.className = "navi transition";
        div.setAttribute("option", navi[i][2]);
        div.onclick = function() {
            var op = this.getAttribute("option");
            if (navSelect === op) return;
            updateMain(op);
        };
        var ic = document.createElement("i");
        ic.className = "fa fa-" + navi[i][0];
        ic["aria-hidden"] = true;
        var p = document.createElement("p");
        p.appendChild(document.createTextNode(navi[i][1]));
        div.appendChild(ic);
        div.appendChild(p);
        side.appendChild(div);
    }
}

function updateMain(op) { // Updates the actual page.
    updateNav(op);
    if(flipMode === "dataValues2") navSelect = "dataValues2";
    if(op === "files") getFiles();
    document.getElementById(navSelect).style.opacity = "0";
    setTimeout(function() {
        document.getElementById(navSelect).style.display = "none";
        document.getElementById(op).style.display = "block";
        setTimeout(function() {
            document.getElementById(op).style.opacity = "1";
        }, 30);
        navSelect = op;
    }, 300);
}

function updateNav(op) { // Updates the sidebar navigation.
    document.getElementById("headerTitle").textContent = navi.filter(function(val) {
        return val[2] === op;
    })[0][1];
    var oldNav = document.querySelectorAll("[option=" + navSelect + "]")[0];
    var newNav = document.querySelectorAll("[option=" + op + "]")[0];
    oldNav.style.backgroundColor = "rgba(0,0,0,0)";
    oldNav.style.color = "white";
    newNav.style.backgroundColor = "#F8F3F0";
    newNav.style.color = "#F47922";
}

function getData(updatePage) {
    $.ajax({
            url: serverURL + '/server',
            type: 'GET'
        })
        .then(
            function success(incoming) {
                data = incoming;
                generateDropOp();
                createDrop();
                if(updatePage === "add") {
                    dropOpUpdate("langSelect");
                    document.querySelectorAll(".dropdown[option='langSelect'] .opCont p[dropoption='"+(data.languages.length)+"']")[0].click();
                } else if(updatePage === "edit") {
                    dropOpUpdate("langSelect");
                    document.querySelectorAll(".dropdown[option='langSelect'] .opCont p[dropoption='"+(dropOpStore["langSelect"])+"']")[0].click();
                }
                generateModals();
            },
            function error(e) {
                console.log(e);
            }
        );
}

function getFiles() {
    $.ajax({
        url: serverURL + "/directory",
        type: 'GET'
    })
    .then(
        function success(incoming) {
            rootDir = incoming.dir;
            listDir("");
        }
    );
}

function listDir(dir) {
    $.ajax({
        url: serverURL + "/directory",
        type: 'POST',
        dataType: "json",
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify({path:rootDir+dir})
    })
    .then(
        function success(incoming) {
            files = incoming;
            dispDir();
            clickable = true;
        }
    );
}

function dispDir() {
    updateLocation();
    document.getElementById("directory").removeChild(document.getElementById("directoryCont"));
    var cont = document.createElement("div");
    cont.id = "directoryCont";
    cont.style.opacity = "0";
    cont.className = "transition";

    selectName = "";
    var item;
    if(files.length === 0) {
        var p = document.createElement("p");
        p.appendChild(document.createTextNode("Nothing here!"));
        p.style.fontWeight = "100";
        cont.appendChild(p);
    }
    for(var i = 0; i < files.length; i++) {
        item = createRow();

        var curr = files[i];
        var name = document.createTextNode(curr.name);
        var modified = document.createTextNode(curr.date);
        var size = document.createTextNode(curr.size);

        item.childNodes[0].appendChild(name);
        item.childNodes[1].appendChild(modified);
        item.childNodes[2].appendChild(size);

        var ext = document.createAttribute("ext");

        if(curr.folder == "true") {
            ext.value = "fol";
        } else {
            console.log(name);
            var f = document.createElement("i");
            var a = document.createElement("a");
            a.href = getURI(curr.name);
            a.setAttribute("target", "_blank");
            f.className = "fa fa-download transition";
            a.appendChild(f);
            item.appendChild(a);
        }
        item.setAttributeNode(ext);

        item.onclick = function() {
            if(clickable == true) {
                var name = this.childNodes[0].innerText;
                if(selectName == name) {
                    clickable = false;
                    attr = this.getAttribute("ext");
                    if(attr == "fol") {
                        clearTbl();
                        setTimeout(function() {
                            currDir += name+"/";
                            listDir(currDir);
                        }, 300);
                        return;
                    }
                }
                selectName = name;
                selectDiv = this;
                for(var i =0; i < document.getElementsByClassName("item").length;i++){
                    document.getElementsByClassName("item")[i].style.backgroundColor = "";
                }
                this.style.backgroundColor = "#d9d9d9";
            }
        };
        cont.appendChild(item);
        item = null;
    }
    document.getElementById("directory").appendChild(cont);
    setTimeout(function() {
        document.getElementById("directoryCont").style.opacity = "1";
    }, 100);
}

function getURI(name) {
    var dirs = (rootDir+currDir+name).split("/");
    var uri = window.location.origin+"/directory";
    for(var i = 0; i < dirs.length; i++) uri+="/"+encodeURIComponent(dirs[i]);
    return uri;
}

function clearTbl() {
    selected = undefined;
    selectDiv = undefined;
    document.getElementById("directoryCont").style.opacity = "0";
    document.getElementById("directoryLocation").style.opacity = "0";
}

function createRow() {
    var item = document.createElement("div");
    item.className = "item transition card";
    var name = document.createElement("p");
    name.className = "name";
    item.appendChild(name);
    var modified = document.createElement("p");
    modified.className = "modified";
    item.appendChild(modified);
    var size = document.createElement("p");
    size.className = "size";
    item.appendChild(size);
    return item;
}

function updateLocation() {
    var loc = document.getElementById("directoryLocation");
    while(loc.firstChild) loc.removeChild(loc.firstChild);
    loc.style.opacity = "1";
    var subdir = currDir.split("/");
    subdir = subdir.slice(0, subdir.length-1);
    for(var i = 0; i < subdir.length+1; i++) {
        var p = document.createElement("p");
        var ic = document.createElement("i");
        ic.className = "fa fa-angle-right";
        if(i !== 0) loc.appendChild(ic);
        if(i === 0) {
            p.appendChild(document.createTextNode("Database"));
        } else {
            p.appendChild(document.createTextNode(subdir[i-1]));
        }
        if(i !== subdir.length) {
            p.style.cursor = "pointer";
            p.className = "subdir transition";
            p.onclick = function() {
                clickable = false;
                clearTbl();
                subdirNum = subdir.indexOf(this.innerText);
                if(subdirNum === -1) {
                    currDir = "";
                } else {
                    currDir = subdir.slice(0, subdirNum+1).reduce(function(a,b) { return a+"/"+b; })+"/";
                }
                listDir(currDir);
            };
        }
        loc.appendChild(p);
    }
}

function downloadFile(name) {
    $.ajax({
        url: serverURL + "/directory/download",
        type: 'POST',
        dataType: "json",
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify({path:rootDir+currDir+name})
    });
}

function language(language) {
    return data.values.filter(function(element) {
        return element.id === parseInt(language);
    })[0];
}

function phoneme(p) {
    return data.values.map(function(language) {
        obj = {};
        if (language.phonemes[p] !== undefined) {
            obj[language.name] = language.phonemes[p];
            return obj;
        }
        return undefined;
    }).filter(function(a) {
        return (a !== undefined);
    });
}

document.getElementById("flipMode1").onclick = function() {
    document.getElementById(flipMode).style.opacity = "0";
    setTimeout(function() {
        document.getElementById(flipMode).style.display = "none";
        flipMode  = (flipMode === "dataValues1") ? "dataValues2" : "dataValues1";
        document.getElementById(flipMode).style.display = "block";
        setTimeout(function() {
            document.getElementById(flipMode).style.opacity = "1";
        }, 30);
    }, 300);
};

document.getElementById("flipMode2").onclick = function() {
    document.getElementById(flipMode).style.opacity = "0";
    setTimeout(function() {
        document.getElementById(flipMode).style.display = "none";
        flipMode  = (flipMode === "dataValues1") ? "dataValues2" : "dataValues1";
        document.getElementById(flipMode).style.display = "block";
        setTimeout(function() {
            document.getElementById(flipMode).style.opacity = "1";
        }, 30);
    }, 300);
}

function generateDropOp() { // For options that change based on data.
    dropOp["langSelect"] = [function() { // Function that occurs when change language.
        // Generate info box material.
        var langInfo = language(dropOpStore["langSelect"]);
        var info = document.getElementById("langInfoCont");
        var dataBox = document.getElementById("dataTableCont");
        var graph = document.querySelectorAll("#langGraph > canvas")[0];
        info.style.opacity = "0";
        dataBox.style.opacity = "0";
        graph.style.opacity = "0";
        setTimeout(function() {
            while (info.firstChild) {
                info.removeChild(info.firstChild);
            }
            var a = document.createElement("a");
            a.appendChild(document.createTextNode("Source"));
            a.href = serverURL + "/server/" + langInfo.id;
            a.setAttribute("target", "_blank");
            info.appendChild(a);

            // Spreadsheet Download
            var download = document.createElement("a");

            var csvdata = "data:text/csv;charset=utf-8";
            var phonemedata = Object.entries(language(langInfo.id)["phonemes"]);
            phonemedata.forEach(function(phon) {
                csvdata += phon.join(',') + "\r\n";
            });
            var encodedcsv = encodeURI(csvdata);

            download.setAttribute("href", encodedcsv);
            download.setAttribute("download", langInfo.name + ".csv");
            download.innerHTML = "Spreadsheet";
            info.appendChild(download);

            // Generate data box material.
            var phonemes = Object.keys(langInfo.phonemes).sort(Intl.Collator().compare);

            while (dataBox.firstChild) {
                dataBox.removeChild(dataBox.firstChild);
            }
            dataBox.style.gridTemplateColumns = "repeat("+Math.ceil(phonemes.length/6).toString() + ", 1fr)";
            for(var i = 0; i < 9; i++) dataBox.appendChild(document.createElement("div")); // Extra divs will be filled if necessary.
            for(i = 0; i < phonemes.length; i++) {
                var tableNum = Math.floor(i/6);
                var row = i+2-tableNum*7;
                var p1 = document.createElement("p");
                var p2 = document.createElement("p");
                p1.style.textAlign = "right";
                p2.style.textAlign = "left";
                p1.style.borderRight = "1px solid #D5D5D5";
                if(i%6 === 0) {
                    var pT1 = document.createElement("p");
                    var pT2 = document.createElement("p");
                    pT1.style.textAlign = "right";
                    pT2.style.textAlign = "left";
                    pT1.style.borderRight = "1px solid #D5D5D5";
                    pT1.style.borderBottom = "1px solid #D5D5D5";
                    pT2.style.borderBottom = "1px solid #D5D5D5";
                    pT1.appendChild(document.createTextNode("Phoneme"));
                    pT2.appendChild(document.createTextNode("Percent"));
                    dataBox.children[tableNum].appendChild(pT1);
                    dataBox.children[tableNum].appendChild(pT2);
                }
                p1.appendChild(document.createTextNode(phonemes[i]));
                p2.appendChild(document.createTextNode(Rnd(langInfo.phonemes[phonemes[i]], 2)));
                dataBox.children[tableNum].appendChild(p1);
                dataBox.children[tableNum].appendChild(p2);
            }
            var graphData = Object.entries(langInfo.phonemes).sort(function(a,b) {
                return b[1] - a[1];
            });
            graphData = [graphData.map(function(a,b) {
                return a[0];
            }), graphData.map(function(a,b) {
                return a[1];
            })];
            // Generate graphs.
            var ctx = graph.getContext("2d");
            try {
                languageChart.destroy();
            } catch(err) {}
            languageChart = new Chart(ctx, chartOptions(graphData));
            info.style.opacity = "1";
            dataBox.style.opacity = "1";
            graph.style.opacity = "1";
        }, 300);
    }].concat(["Select language..."].concat(data.values.map(a=>a.id)));

    dropOp["phonemeSelect"] = [function() { // Function that occurs when change language.
        // Generate info box material.
        var langInfo = phoneme(dropOpStore["phonemeSelect"]);
        var info = document.getElementById("phonemeInfoCont");
        var dataBox = document.getElementById("dataTableCont2");
        info.style.opacity = "0";
        dataBox.style.opacity = "0";
        setTimeout(function() {
            while (info.firstChild) {
                info.removeChild(info.firstChild);
            }

            // Generate data box material.

            while (dataBox.firstChild) {
                dataBox.removeChild(dataBox.firstChild);
            }
            dataBox.style.gridTemplateColumns = "repeat("+Math.ceil(langInfo.length/6).toString() + ", 1fr)";
            for(var i = 0; i < 9; i++) dataBox.appendChild(document.createElement("div")); // Extra divs will be filled if necessary.
            for(i = 0; i < langInfo.length; i++) {
                var tableNum = Math.floor(i/6);
                var row = i+2-tableNum*7;
                var p1 = document.createElement("p");
                var p2 = document.createElement("p");
                p1.style.textAlign = "right";
                p2.style.textAlign = "left";
                p1.style.borderRight = "1px solid #D5D5D5";
                if(i%6 === 0) {
                    var pT1 = document.createElement("p");
                    var pT2 = document.createElement("p");
                    pT1.style.textAlign = "right";
                    pT2.style.textAlign = "left";
                    pT1.style.borderRight = "1px solid #D5D5D5";
                    pT1.style.borderBottom = "1px solid #D5D5D5";
                    pT2.style.borderBottom = "1px solid #D5D5D5";
                    pT1.appendChild(document.createTextNode("Language"));
                    pT2.appendChild(document.createTextNode("Percent"));
                    dataBox.children[tableNum].appendChild(pT1);
                    dataBox.children[tableNum].appendChild(pT2);
                }
                p1.appendChild(document.createTextNode(Object.keys(langInfo[i])));
                p2.appendChild(document.createTextNode(Rnd(langInfo[i][Object.keys(langInfo[i])], 2)));
                dataBox.children[tableNum].appendChild(p1);
                dataBox.children[tableNum].appendChild(p2);
            }
            info.style.opacity = "1";
            dataBox.style.opacity = "1";
        }, 300);
    }].concat(["Select phoneme..."].concat(data.phonemes.sort()));

}

function createDrop() {
    var dropButtons = document.getElementsByClassName("dropdown");
    for(var i = 0; i < dropButtons.length; i++) {
        while(dropButtons[i].firstChild) dropButtons[i].removeChild(dropButtons[i].firstChild);
    }
    for (i = 0; i < dropButtons.length; i++) {
        var div = document.createElement("div");
        div.className = "button";
        var p = document.createElement("p");
        let op = dropButtons[i].getAttribute("option");
        p.appendChild(document.createTextNode(dropOp[op][1]));
        var ic = document.createElement("i");
        ic.className = "fa fa-angle-down";
        ic["aria-hidden"] = true;
        div.appendChild(p);
        div.appendChild(ic);
        var div2 = document.createElement("div");
        div2.className = "opCont transition";

        if(op === "langSelect") {
            var p3 = document.createElement("p");
            p3.className = "transition";
            p3.id = "addData";
            p3.appendChild(document.createTextNode("Add language..."));
            div2.appendChild(p3);
        }

        for (var j = 2; j < dropOp[op].length; j++) {
            var p2 = document.createElement("p");
            p2.setAttribute("dropoption", dropOp[op][j]);
            p2.className = "transition";
            p2.onclick = function(e) {
                e.stopPropagation();
                dropOpStore[op] = this.getAttribute("dropoption");
                dropOpUpdate(op);
                let opCont = this.parentNode;
                opCont.style.opacity = "0";
                setTimeout(function() {
                    opCont.style.display = "none";
                }, 300);
            };
            if(op === "langSelect") p2.appendChild(document.createTextNode(language(dropOp[op][j]).name));
            if(op === "phonemeSelect") p2.appendChild(document.createTextNode(dropOp[op][j]));
            div2.appendChild(p2);
        }

        div.onclick = function(e) {
            e.stopPropagation();
            let opCont = this.nextElementSibling;
            if (opCont.style.display === "block") {
                opCont.style.opacity = "0";
                setTimeout(function() {
                    opCont.style.display = "none";
                }, 300);
            } else {
                opCont.style.display = "block";
                setTimeout(function() {
                    opCont.style.opacity = "1";
                }, 30);
            }
        };
        dropButtons[i].appendChild(div);
        dropButtons[i].appendChild(div2);
    }
}

function dropOpUpdate(op) {
    var dropdown = document.querySelectorAll(".dropdown[option=" + op + "] .button p")[0];
    if(op === "langSelect") dropdown.textContent = language(dropOpStore[op]).name;
    if(op === "phonemeSelect") dropdown.textContent = dropOpStore[op];
    (dropOp[op][0])();
}

document.onclick = function(event) {
    for (var i = 0; i < document.getElementsByClassName("dropdown").length; i++) {
        var opCont = document.querySelectorAll(".dropdown .opCont")[i];
        opCont.style.opacity = "0";
        setTimeout(function() {
            opCont.style.display = "none";
        }, 300);
    }
};


function homeCards() {
    var home = document.getElementById("home");
    while (home.firstChild) {
        home.removeChild(home.firstChild);
    }
    $.ajax({
        url: serverURL + '/updates',
        type: 'GET'
    })
    .then(
        function success(incoming) {
            var postList = incoming;
            for(var i = postList.length - 1; i >= 0 ; i--) {
                var div = document.createElement("div");
                div.className = "card";
                var h2 = document.createElement("h2");
                h2.textContent = postList[i].title;
                div.appendChild(h2);
                var h3 = document.createElement("h3");
                h3.textContent = postList[i].author + " - " + postList[i].date;
                div.appendChild(h3);
                var p = document.createElement("p");
                p.innerHTML = postList[i].content;
                div.appendChild(p);
                home.appendChild(div);
            }
        },
        function error(e) {
            console.log(e);
        }
    );

}

function chartOptions(graphData) {
    return {
        type: 'bar',
        data: {
            labels: graphData[0],
            datasets: [{
                label: "Phoneme Prevalence",
                data: graphData[1],
                backgroundColor: 'rgba(244, 121, 34, 0.7)',
                borderColor: 'rgba(246, 112, 18, 1)',
                borderWidth: 2
            }]
        },
        options: {
            legend: {
                labels: {
                    fontFamily: "'Open Sans Condensed', sans-serif",
                    fontSize: 20
                }
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Phoneme (%)",
                        fontFamily: "'Open Sans Condensed', sans-serif",
                        fontSize: 20,
                        padding: 4
                    },
                    ticks: {
                        fontFamily: "'Open Sans Condensed', sans-serif",
                        fontSize: 20,
                        callback: function(value) {
                            return value + "%";
                        }
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Percent Prevalence",
                        fontFamily: "'Open Sans Condensed', sans-serif",
                        fontSize: 20,
                        padding: 4
                    },
                    ticks: {
                        fontFamily: "'Open Sans Condensed', sans-serif",
                        fontSize: 20
                    }
                }]
            }
        }
    };
}

function modal(id, open) {
    if(open) {
        document.getElementById(id).style.display = "block";
        setTimeout(function() {
            document.getElementById(id).style.opacity = "1";
        }, 10);
    } else {
        document.getElementById(id).style.opacity = "0";
        setTimeout(function() {
           document.getElementById(id).style.display = "none";
        }, 300);
    }
}

function generateModals() {
    while(document.getElementsByClassName("modal").length > 0) {
        document.getElementsByTagName("body")[0].removeChild(document.getElementsByClassName("modal")[0]);
    }
    for(var i = 0; i < modals.length; i++) {
        let eachModal = modals[i];
        var overlay = document.createElement("div");
        overlay.id = modals[i].modal;
        overlay.className = "transition modal";

        var modalCont = document.createElement("div");
        modalCont.className = "card transition";
        modalCont.style.position = "absolute";
        modalCont.style.paddingBottom = "1vh";
        modalCont.style.width = modals[i].structure.width;
        var marg = 50-parseInt(modals[i].structure.width.replace("%",""))/2;
        modalCont.style.margin = "5% " + marg + "% 0 " + marg+"%";
        var h2 = document.createElement("h2");
        h2.appendChild(document.createTextNode(modals[i].name));
        h2.style.gridRow = "1";
        modalCont.appendChild(h2);

        var gridTemplate = "6vh ";
        var form = modals[i].structure.form;
        for(var j = 0; j < form.length; j++) {
            gridTemplate += (form[j].formType === "input") ? "7vh " : "auto ";
            var div = document.createElement("div");
            div.id = modals[i].modal + form[j].name;
            div.style.marginLeft = "5%";
            div.style.gridRow = j+2;
            var p = document.createElement("p");
            p.appendChild(document.createTextNode(form[j].name + ":"));
            var input = document.createElement(form[j].formType);
            if(form[j].inputType) input.type = form[j].inputType;
            if(form[j].height) input.style.height = form[j].height;

            div.appendChild(p);
            div.appendChild(input);
            modalCont.appendChild(div);
        }
        gridTemplate += "7vh";
        modalCont.style.gridTemplateRows = gridTemplate;
        modalCont.style.gridTemplateColumns = "100%";

        var submit = document.createElement("div");
        submit.id = modals[i].modal + "Submit";
        submit.style.gridRow = form.length+2;
        submit.style.display = "grid";
        submit.onclick = function() {
            (eachModal.submitClick)();
        };
        var p2 = document.createElement("p");
        p2.className = "card modalSubmit"; // Refer to modalSubmit CSS to edit.
        p2.appendChild(document.createTextNode("Submit!"));
        submit.appendChild(p2);
        modalCont.appendChild(submit);

        overlay.appendChild(modalCont);
        document.getElementsByTagName("body")[0].appendChild(overlay);
        document.getElementById(modals[i].button).onclick = function() {
            if(eachModal.buttonClick) (eachModal.buttonClick)();
            modal(eachModal.modal, true);
        };

        overlay.onclick = function(event) {
            if(this !== event.target) return;
            for(var i = 0; i < document.getElementsByTagName("input").length; i++) document.getElementsByTagName("input")[i].value = "";
            modal(eachModal.modal, false);
        };
    }
}

modals[0].submitClick = function() { // submitClick for newLanguage.
    if(!submittable) return;
    submittable = false;
    var name = document.querySelectorAll("#newLanguageName input")[0].value;
    if(name === "") {
        alert("Please enter in the name for language!");
        submittable = true;
        return;
    }
    var info = document.querySelectorAll("#newLanguagePhonemes textarea")[0].value;
    if(info === "") {
        alert("Please enter in the values for phonemes!");
        submittable = true;
        return;
    }
    info = info.split("\n");
    var phonemes = {};
    for(var i = 0; i < info.length; i++) {
        info[i] = info[i].split(/[ ,]+/);
        var num = parseFloat(info[i][1]);
        if(isNaN(num)) {
            alert("Value for " + info[i][0] + " is not a number or does not exist!");
            submittable = true;
            return;
        }
        phonemes[info[i][0]] = num;
    }

    var source = document.querySelectorAll("#newLanguageSource input")[0].files;
    if(source.length === 0) {
        alert("Please give a source!");
        submittable = true;
        return;
    }

    var newLanguage = {
        name: name,
        phonemes: phonemes,
        editor: loginInfo
    };

    var p = document.querySelectorAll("#newLanguageSubmit p")[0];
    p.innerText = "Processing...";
    p.style.backgroundColor = "rgba(0,0,0,0.2)";

    $.ajax({
        url: serverURL + '/server',
        type: 'POST',
        dataType: "json",
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify(newLanguage)
    })
    .then(
        function success(incoming) {

        },
        function error(e) {
            alert("There was an error adding a language.");
            console.log(e);
        }
    ).done(function(incoming) {
        var formData = new FormData();
        formData.append("file", source[0]);
        formData.append("lang_id", data.values.length);
        formData.append("username", newLanguage.editor.username);
        formData.append("password", newLanguage.editor.password);

        $.ajax({
            url: serverURL + '/source',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false
        }).then(
            function success(incoming) {
                document.getElementById("newLanguage").style.opacity = "0";
                setTimeout(function() {
                    document.getElementById("newLanguage").style.display = "none";
                    submittable = true;
                    p.innerText = "Submit!";
                    p.style.backgroundColor = "#FEFEFE";
                    document.querySelectorAll("#newLanguageName input")[0].value = "";
                    document.querySelectorAll("#newLanguagePhonemes textarea")[0].value = "";
                }, 300);
                getData("add");
            }
        );
    });
};

modals[1].submitClick= function() { // submitClick for editLanguage.
    if(!submittable) return;
    var langInfo = language(dropOpStore["langSelect"]);
    submittable = false;
    var name = document.querySelectorAll("#editLanguageName input")[0].value;
    if(name === "") {
        alert("Please enter in the name for language!");
        submittable = true;
        return;
    }
    var info = document.querySelectorAll("#editLanguagePhonemes textarea")[0].value;
    if(info === "") {
        alert("Please enter in the values for phonemes!");
        submittable = true;
        return;
    }
    info = info.split("\n");
    var newPhonemes = {};

    for(var i = 0; i < info.length; i++) {
        info[i] = info[i].split(/[ ,]+/);
        var num = parseFloat(info[i][1]);
        if(isNaN(num)) {
            alert("Value for " + info[i][0] + " is not a number or does not exist!");
            submittable = true;
            return;
        }
        newPhonemes[info[i][0]] = num;
    }


    var source = document.querySelectorAll("#editLanguageSource input")[0].files;

    var oldPhoneset = new Set(Object.keys(langInfo.phonemes));
    var newPhoneset = new Set(Object.keys(newPhonemes));
    var diffRemove = [...oldPhoneset].filter(x=>!newPhoneset.has(x));
    var diffChange = [...newPhoneset].filter(x=>!oldPhoneset.has(x));
    var union = [...newPhoneset].filter(x=>oldPhoneset.has(x));

    for(var i = 0; i < union.length; i++) {
        if(newPhonemes[union[i]] === undefined) {
            diffRemove.push(union[i]);
        } else if(langInfo.phonemes[union[i]] !== newPhonemes[union[i]]) {
            diffChange.push(union[i]);
        } else {
            continue;
        }
    }

    var todo = {
        name: name !== langInfo.name,
        add: diffChange.length > 0,
        remove: diffRemove.length > 0,
        source: source.length !== 0
    };
    console.log(todo);

    if(!todo.name && !todo.add && !todo.remove && !todo.source) {
        modal("editLanguage", false);
        return;
    }

    var p = document.querySelectorAll("#editLanguageSubmit p")[0];
    p.innerText = "Processing...";
    p.style.backgroundColor = "rgba(0,0,0,0.2)";

    var error = false;

    if(todo.name) { // Ajax requests for changing name.
        $.ajax({
            url: serverURL + '/server',
            type: 'PATCH',
            dataType: "json",
            contentType: 'application/json;charset=UTF-8',
            data: JSON.stringify({
                action: "language_name_edit",
                data: {
                    language_id: langInfo.id,
                    language_name: name
                },
                editor: loginInfo
            })
        })
        .then(
            function success(incoming) {
                if(todo.name && !todo.add && !todo.remove) {
                    document.getElementById("editLanguage").style.opacity = "0";
                    setTimeout(function() {
                        document.getElementById("editLanguage").style.display = "none";
                        submittable = true;
                        p.innerText = "Submit!";
                        p.style.backgroundColor = "#FEFEFE";
                        document.querySelectorAll("#editLanguageName input")[0].value = "";
                        document.querySelectorAll("#editLanguagePhonemes textarea")[0].value = "";
                    }, 300);
                    getData("edit");
                }
            },
            function error(e) {
                error = true;
                alert("There was an error change the language name.");
                console.log(e);
            }
        );
    }

    if(error) return;

    for(var i = 0; i < diffChange.length; i++) { // Ajax requests for adding or editing phonemes.
        $.ajax({
            url: serverURL + '/server',
            type: 'PATCH',
            dataType: "json",
            contentType: 'application/json;charset=UTF-8',
            context: {counter: i},
            data: JSON.stringify({
                action: "phoneme_add",
                data: {
                    language_id: langInfo.id,
                    phoneme: diffChange[i],
                    value: newPhonemes[diffChange[i]]
                },
                editor: loginInfo
            })
        })
        .then(
            function success(incoming) {
                if(todo.add && !todo.remove && !todo.source && this.counter === diffChange.length-1) {
                    document.getElementById("editLanguage").style.opacity = "0";
                    setTimeout(function() {
                        document.getElementById("editLanguage").style.display = "none";
                        submittable = true;
                        p.innerText = "Submit!";
                        p.style.backgroundColor = "#FEFEFE";
                        document.querySelectorAll("#editLanguageName input")[0].value = "";
                        document.querySelectorAll("#editLanguagePhonemes textarea")[0].value = "";
                    }, 300);
                    getData("edit");
                }

            },
            function error(e) {
                error = true;
                alert("There was an error change the phoneme values.");
                console.log(e);
            }
        );
    }

    if(error) return;

    for(var i = 0; i < diffRemove.length; i++) { // Ajax requests for removing phoneme values.
        $.ajax({
            url: serverURL + '/server',
            type: 'PATCH',
            dataType: "json",
            contentType: 'application/json;charset=UTF-8',
            context: {counter: i},
            data: JSON.stringify({
                action: "phoneme_remove",
                data: {
                    language_id: langInfo.id,
                    phoneme: diffRemove[i]
                },
                editor: loginInfo
            })
        })
        .then(
            function success(incoming) {
                if(todo.remove && !todo.source && this.counter === diffRemove.length-1) {
                    document.getElementById("editLanguage").style.opacity = "0";
                    setTimeout(function() {
                        document.getElementById("editLanguage").style.display = "none";
                        submittable = true;
                        p.innerText = "Submit!";
                        p.style.backgroundColor = "#FEFEFE";
                        document.querySelectorAll("#editLanguageName input")[0].value = "";
                        document.querySelectorAll("#editLanguagePhonemes textarea")[0].value = "";
                    }, 300);
                    getData("edit");
                }

            },
            function error(e) {
                error = true;
                alert("There was an error removing phoneme values.");
                console.log(e);
            }
        );
    }

    if(error) return;
    if(todo.source) {
        var formData = new FormData();
        formData.append("file", source[0]);
        formData.append("lang_id", langInfo.id);
        formData.append("username", loginInfo.username);
        formData.append("password", loginInfo.password);
        $.ajax({
            url: serverURL + '/source',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false
        }).then(
            function success(incoming) {
                document.getElementById("newLanguage").style.opacity = "0";
                setTimeout(function() {
                    document.getElementById("newLanguage").style.display = "none";
                    submittable = true;
                    p.innerText = "Submit!";
                    p.style.backgroundColor = "#FEFEFE";
                    document.querySelectorAll("#newLanguageName input")[0].value = "";
                    document.querySelectorAll("#newLanguagePhonemes textarea")[0].value = "";
                }, 300);
                getData("edit");
            }
        );
    }
};

modals[2].submitClick = function() { // submitClick for login.
    var info = [
        document.querySelectorAll("#loginUsername input")[0], 
        document.querySelectorAll("#loginPassword input")[0]
    ];
    if(info[0].value === "") {
        alert("Please enter in a username!");
        return;
    } else if(info[1].value === "") {
        alert("Please enter in a password!");
        return;
    }
    loginInfo.username = info[0].value;
    loginInfo.password = info[1].value;
    modal("login", false);
    document.getElementById("addData").style.display = "block";
    document.getElementById("editData").style.display = "grid";
    document.getElementById("addUserButton").style.display = "grid";
    document.getElementById("addUpdateButton").style.display = "grid";
    document.getElementById("signIn").style.display = "none";
    setTimeout(function() {
        info[0].value = "";
        info[1].value = "";
    }, 300);
};

modals[3].submitClick = function() {
    if(!submittable) return;
    submittable = false;
    var info = [
        document.querySelectorAll("#addUserUsername input")[0],
        document.querySelectorAll("#addUserPassword input")[0],
        document.querySelectorAll("#addUserAuthority input")[0]
    ];
    if(info[0].value === "") {
        alert("Please enter in a username!");
        submittable = true;
        return;
    } else if(info[1].value === "") {
        alert("Please enter in a password!");
        submittable = true;
        return;
    } else if(info[2] === "") {
        alert("Please enter in an authority level!");
        submittable = true;
        return;
    }

    var p = document.querySelectorAll("#addUserSubmit p")[0];
    p.innerText = "Processing...";
    p.style.backgroundColor = "rgba(0,0,0,0.2)";

    $.ajax({
        url: serverURL + '/editors',
        type: 'POST',
        dataType: "json",
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify({
            username: info[0].value,
            authority: parseInt(info[2]),
            password: info[1].value,
            editor: loginInfo
        })
    })
    .then(
        function success(incoming) {},
        function error(e) {
            if(e.responseText !== "Success") {
                alert("There was an error adding a user.");
                console.log(e);
            } else {
                modal("addUser", false);
                setTimeout(function() {
                    info[0].value = "";
                    info[1].value = "";
                    dropOpStore["authority"] = "";
                    submittable = true;
                    p.innerText = "Submit!";
                    p.style.backgroundColor = "#FEFEFE";
                    document.querySelectorAll(".dropdown[option=authority] .button p")[0].textContent = dropOp["authority"][1];
                }, 300);
            }
        }
    );
};

modals[4].submitClick = function() {
    if(!submittable) return;
    submittable = false;
    var info = [
        document.querySelectorAll("#writePostTitle input")[0],
        document.querySelectorAll("#writePostAuthor input")[0],
        document.querySelectorAll("#writePostMessage textarea")[0]
    ];
    if(info[0].value === "") {
        alert("Please enter in a title!");
        submittable = true;
        return;
    } else if(info[1].value === "") {
        alert("Please enter in an author!");
        submittable = true;
        return;
    } else if(info[2].value === "") {
        alert("Please enter in a message!");
        submittable = true;
        return;
    }

    var p = document.querySelectorAll("#writePostSubmit p")[0];
    p.innerText = "Processing...";
    p.style.backgroundColor = "rgba(0,0,0,0.2)";

    $.ajax({
        url: serverURL + '/updates',
        type: 'POST',
        dataType: "json",
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify({
            title: info[0].value,
            author: info[1].value,
            content: info[2].value,
            editor: loginInfo
        })
    })
    .then(
        function success(incoming) {
            modal("writePost", false);
            homeCards();
            setTimeout(function() {
                info[0].value = "";
                info[1].value = "";
                info[2].value = "";
                submittable = true;
                p.innerText = "Submit!";
                p.style.backgroundColor = "#FEFEFE";
            }, 300);
        },
        function error(e) {
            alert("There was an error adding a post.");
            console.log(e);
        }
    );
};



getData();
homeCards();
createNav();
updateNav(navSelect);
