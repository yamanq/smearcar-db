var navSelect = "home";
var dataMode 
var serverURL = window.location.origin;
var data;
var languageChart;
var dataOpen = false;
var submittable = true;

// var trelloInfo = {};


var navi = [ // Array containing navigation items in form [Font-Awesome class name, Display Text, Onclick function].
    ["home", "Home", "home"],
    ["bar-chart", "Data Values", "dataValues1"],
    ["database", "Database and Files", "files"],
    ["info", "About", "about"]
];

var members = [
    "Kenneth Jao", "Yaman Qalieh", "Enrico Colon", "Arav Agarwal"
];

var dropOp = {
    //Insert correct   
};

var dropOpStore = {};

// Left This so that the post function can be reused

// function temporary(data) {
//     for(var i = 0; i < data.length; i++) {
//         $.ajax({
//             url: serverURL + '/server',
//             type: 'POST',
//             data: JSON.stringify(data[i]),
//             dataType: "json",
//             contentType: 'application/json;charset=UTF-8'
//         })
//             .then(
//                 function success(data) {
//                     console.log(data);
//                 },
//                 function error(e) {
//                     console.log(e);
//                 }
//             );
//     }
// }

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
    document.getElementById(navSelect).style.opacity = "0";
    setTimeout(function() {
        console.log(op);
        document.getElementById(navSelect).style.display = "none";
        document.getElementById(op).style.display = "block";   
        setTimeout(function() {
            document.getElementById(op).style.opacity = "1";
        }, 30);
        navSelect = op;
    }, 300);
}

function updateNav(op) { // Updates the sidebar navigation.
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
                if(updatePage) dropOpUpdate("langSelect");

            },
            function error(e) {
                console.log(e);
            }
        );
}

function language(language) {
    return data.values.filter(function(element) {
        return element.name === language;
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

document.getElementById("flipMode").onclick = function() {
    dropOpStore["flipMode"] = (dropOpStore["flipMode"] === "language") ? "phoneme" : "language";

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
            var p = document.createElement("p");
            var p2 = document.createElement("p");
            var a = document.createElement("a");
            p.appendChild(document.createTextNode("Type: " + (langInfo.type || "N/A")));
            p2.appendChild(document.createTextNode("Source: "));
            if(langInfo.source === null) {
                p2.appendChild(document.createTextNode("N/A"));
            } else if(langInfo.source.length > 0) {
                a.href = langInfo.source;
                srcText = (langInfo.source.length > 60) ? langInfo.source.substring(0, 57) + "..." : langInfo.source;
                a.appendChild(document.createTextNode(srcText));
                p2.appendChild(a); 
            }
            info.appendChild(p);
            info.appendChild(p2);
            
            // Generate data box material.
            
            var phonemes = Object.keys(langInfo.phonemes);
            
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
                p2.appendChild(document.createTextNode(langInfo.phonemes[phonemes[i]]));
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
    }].concat(["Select language..."].concat(data.languages))
}

function closeEditInput() {
    try {
        var input = document.getElementById("dataOpen");
        var p = input.parentNode;
        var patchData = {
            action: 'phoneme_add',
            data: {
                language_id: language(dropOpStore["langSelect"]).id,
                phoneme: p.previousSibling.innerText,
                value: input.value
            }
        };
        $.ajax({
            url: serverURL + '/server',
            type: 'PATCH',
            dataType: "json",
            contentType: 'application/json;charset=UTF-8',
            data: JSON.stringify(patchData)
        })
        .then(
            function success(incoming) {
                p.appendChild(document.createTextNode(input.value));
                p.removeChild(input);
            },
            function error(e) {
                console.log(e);
            }
        );
        dataOpen = false;
    } catch(err) {}
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
        var op = dropButtons[i].getAttribute("option");
        p.appendChild(document.createTextNode(dropOp[op][1]));
        var ic = document.createElement("i");
        ic.className = "fa fa-angle-down";
        ic["aria-hidden"] = true;
        div.appendChild(p);
        div.appendChild(ic);
        var div2 = document.createElement("div");
        div2.className = "opCont transition";

        var p3 = document.createElement("p");
        p3.className = "transition";
        p3.onclick = function() { // Open add language.
            document.getElementById("newLanguage").style.display = "block";
            setTimeout(function() {
                document.getElementById("newLanguage").style.opacity = "1";
            }, 10);
        }
        p3.appendChild(document.createTextNode("Add language..."));
        div2.appendChild(p3);

        for (var j = 2; j < dropOp[op].length; j++) {
            var p2 = document.createElement("p");
            p2.className = "transition";
            p2.onclick = function(e) {
                e.stopPropagation();
                dropOpStore[op] = this.textContent;
                dropOpUpdate(op);
                let opCont = this.parentNode;
                opCont.style.opacity = "0";
                setTimeout(function() {
                    opCont.style.display = "none";
                }, 300);
            };
            p2.appendChild(document.createTextNode(dropOp[op][j]));
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
    dropdown.textContent = dropOpStore[op];
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
}

function homeCards() {
    // GET posts from server
    var week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var examplePost = [
        {
            author: "Kenneth Jao",
            title: "Test Post!",
            content: "This is test post! <a target='_blank' href='https://google.com'>Link</a> This link should work.<br> Newlines work.",
            date: new Date(2018, 0, 26, 4, 51)
        }
    ];
    var home = document.getElementById("home");
    for(var i = 0; i < examplePost.length; i++) {
        var div = document.createElement("div");
        div.className = "card";
        var h2 = document.createElement("h2");
        h2.textContent = examplePost[i].title;
        div.appendChild(h2);
        var h3 = document.createElement("h3");
        var dt = examplePost[i].date;
        var smallDate = (function() {
            var m = (dt.getMonth()+1).toString();
            var d = (dt.getDay()+1).toString();
            m = (m.length === 1) ? "0" + m : m;
            d = (d.length === 1) ? "0" + d : d;
            return m+"/"+d+"/"+dt.getFullYear().toString();
        })();
        var fullDate = week[dt.getDay()] + ", " + month[dt.getMonth()] + " " + dt.getDate().toString() + ", " + dt.getFullYear().toString(); 
        h3.textContent = smallDate + " | " + fullDate;
        div.appendChild(h3);
        var p = document.createElement("p");
        p.innerHTML = examplePost[i].content;
        div.appendChild(p);
        home.appendChild(div);
    }
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

document.getElementById("newLanguage").onclick = function(event) { // Close add language.
    document.getElementById("newLanguage").style.opacity = "0";
    setTimeout(function() {
       document.getElementById("newLanguage").style.display = "none"; 
    }, 300);
    document.getElementById("editLanguage").style.opacity = "0";
    setTimeout(function() {
       document.getElementById("editLanguage").style.display = "none"; 
    }, 300);
}

document.querySelectorAll("#newLanguage > div")[0].onclick = function(event) {
    event.stopPropagation();
}

document.getElementById("editData").onclick = function() { // Open edit language.
    var langInfo = language(dropOpStore["langSelect"]);
    document.querySelectorAll("#editLanguageName input")[0].value = langInfo.name;
    var k = Object.keys(langInfo.phonemes);
    var v = Object.values(langInfo.phonemes);
    var str = "";
    for(var i = 0; i < k.length; i++) {
        str += k[i] + " " + v[i] + ((i === k.length-1) ? "" : "\n");
    }
    document.querySelectorAll("#editLanguagePhonemes textarea")[0].value = str;
    document.getElementById("editLanguage").style.display = "block";
    setTimeout(function() {
        document.getElementById("editLanguage").style.opacity = "1";
    }, 10);
}

document.querySelectorAll("#newLanguageSubmit p")[0].onclick = function() {
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
    var newLanguage = {
        name: name,
        source: null,
        phonemes: phonemes
    };

    this.innerText = "Processing...";
    this.style.backgroundColor = "rgba(0,0,0,0.2)";
    var p = this;
    $.ajax({
        url: serverURL + '/server',
        type: 'POST',
        dataType: "json",
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify(newLanguage)
    })
    .then(
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
            getData(true);
        },
        function error(e) {
            alert("There was an error adding a language.");
            console.log(e);
        }
    );
}

document.querySelectorAll("#editLanguageSubmit p")[0].onclick = function() {
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

    this.innerText = "Processing...";
    this.style.backgroundColor = "rgba(0,0,0,0.2)";
    var p = this;

    var diffChange = [];
    var diffRemove = [];
    var phoKeys = Object.keys(langInfo.phonemes);
    for(var i = 0; i < phoKeys.length; i++) {
        if(newPhonemes[phoKeys[i]] === undefined) {
            diffRemove.push(phoKeys[i]);
        } else if(langInfo.phonemes[phoKeys[i]] !== newPhonemes[phoKeys[i]]) {
            diffChange.push(phoKeys[i]); 
        } else {
            continue;
        }
    }

    var todo = {
        name: newLanguage.name !== langInfo.name,
        add: diffChange.length > 0,
        remove: diffRemove.length > 0
    }

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
                }
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
                    getData(true);
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
                }
            })
        })
        .then(
            function success(incoming) {
                if(todo.add && !todo.remove && this.counter === diffChange.length-1) {
                    document.getElementById("editLanguage").style.opacity = "0";
                    setTimeout(function() {
                        document.getElementById("editLanguage").style.display = "none";
                        submittable = true;
                        p.innerText = "Submit!";
                        p.style.backgroundColor = "#FEFEFE";
                        document.querySelectorAll("#editLanguageName input")[0].value = "";
                        document.querySelectorAll("#editLanguagePhonemes textarea")[0].value = "";
                    }, 300);
                    getData(true);
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

    console.log({
                action: "phoneme_remove",
                data: {
                    language_id: langInfo.id,
                    phoneme_id: diffRemove[i]
                }
            })

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
                    phoneme_id: diffRemove[i]
                }
            })
        })
        .then(
            function success(incoming) {
                if(this.counter === diffRemove.length-1) {
                    document.getElementById("editLanguage").style.opacity = "0";
                    setTimeout(function() {
                        document.getElementById("editLanguage").style.display = "none";
                        submittable = true;
                        p.innerText = "Submit!";
                        p.style.backgroundColor = "#FEFEFE";
                        document.querySelectorAll("#editLanguageName input")[0].value = "";
                        document.querySelectorAll("#editLanguagePhonemes textarea")[0].value = "";
                    }, 300);
                    getData(true);
                }
                
            },
            function error(e) {
                error = true;
                alert("There was an error removing phoneme values.");
                console.log(e);
            }
        );
    }
}

/*function getTrelloCards() {
    Trello.authorize();
    var cardArr, listArr, lists;
    var cards = window.Trello.rest(
        "GET", "boards/vm2c2IZd/cards", 
        function success() {
            cardArr = JSON.parse(cards.responseText);
            lists = window.Trello.rest(
            "GET", "boards/vm2c2IZd/lists",
            function success() {
                listArr = JSON.parse(lists.responseText);
                for(var i = 0; i < listArr.length; i++) {
                    var arr = cardArr.filter(function(obj) {
                        return obj.idList === listArr[i].id;
                    }).map(a => a.name);
                    trelloInfo[listArr[i].name] = arr;
                }
            },
            function error(e) {
                console.log(e);
            });
        },
        function error(e) {
            console.log(e);
    });
}*/

getData();
homeCards();
createNav();
updateNav(navSelect);

