var navSelect = "home";
var serverURL = window.location.origin;
var data;
var trelloInfo = {};


var navi = [ // Array containing navigation items in form [Font-Awesome class name, Display Text, Onclick function].
    ["home", "Home", "home"],
    ["bar-chart", "Data Values", "dataValues"],
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

function updateMain(op) {
    updateNav(op);
    document.getElementById(navSelect).style.opacity = "0";
    setTimeout(function() {
        document.getElementById(navSelect).style.display = "none";
        document.getElementById(op).style.display = "grid";
        setTimeout(function() {
            document.getElementById(op).style.opacity = "1";
        }, 30);
        navSelect = op;
    }, 300);
}

function updateNav(op) {
    var oldNav = document.querySelectorAll("[option=" + navSelect + "]")[0];
    var newNav = document.querySelectorAll("[option=" + op + "]")[0];
    oldNav.style.backgroundColor = "rgba(0,0,0,0)";
    oldNav.style.color = "white";
    newNav.style.backgroundColor = "#F8F3F0";
    newNav.style.color = "#F47922";
}

function getData() {
    $.ajax({
            url: serverURL + '/server',
            type: 'GET'
        })
        .then(
            function success(incoming) {
                data = incoming;
                generateDropOp();
                createDrop();
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

function generateDropOp() { // For options that change based on data.
    dropOp["langSelect"] = [function() {
        // Generate info box material.
        var langInfo = language(dropOpStore["langSelect"]);
        var info = document.getElementById("langInfoCont");
        info.style.opacity = "0";
        setTimeout(function() {
            while (info.firstChild) {
                info.removeChild(info.firstChild);
            }
            var p = document.createElement("p");
            var p2 = document.createElement("p");
            var a = document.createElement("a");
            p.appendChild(document.createTextNode("Type: " + (langInfo.type || "N/A")));
            p2.appendChild(document.createTextNode("Source: "));
            if(langInfo.source.length > 0) {
                a.href = langInfo.source;
                srcText = (langInfo.source.length > 60) ? langInfo.source.substring(0, langInfo.source.length - 3) + "..." : langInfo.source;
                a.appendChild(document.createTextNode(srcText));
                p2.appendChild(a); 
            } else {
                p2.appendChild(document.createTextNode("N/A"));
            }
            info.appendChild(p);
            info.appendChild(p2);
            info.style.opacity = "1";
        }, 400);
        // Generate data box material.
        var dataBox = document.getElementById("dataTableCont");
        var phonemes = Object.keys(langInfo.phonemes);
        dataBox.style.opacity = "0";
        setTimeout(function() {
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
            dataBox.style.opacity = "1";
        }, 400);
    }].concat(["Select language..."].concat(data.languages));
}

function createDrop() {
    var dropButtons = document.getElementsByClassName("dropdown");
    for (var i = 0; i < dropButtons.length; i++) {
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

function getTrelloCards() {
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
}

getData();
getTrelloCards();
createNav();
updateNav(navSelect);
