var navSelect = "home";
var serverURL = window.location.href;
var data;


var navi = [ // Array containing navigation items in form [Font-Awesome class name, Display Text, Onclick function].
    ["home", "Home", "home"],
    ["bar-chart", "Data Values", "dataValues"],
    ["database", "Database and Files", "files"],
    ["bell", "Updates and Progress", "updates"]
];

var dropOp = {
    //Insert correct   
};


var dropOpStore = {};

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
            url: serverURL + 'server',
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
        if (a === undefined) {
            return false;
        }
        return true;
    });
}

function generateDropOp() { // For options that change based on data.
    dropOp["langSelect"] = [function() {
        var info = document.getElementById("langInfoCont");
        while (info.firstChild) {
            info.removeChild(info.firstChild);
        }
        var p = document.createElement("p");
        var p2 = document.createElement("p2");
        var a = document.createElement("a");
        var langInfo = language(dropOpStore["langSelect"]);
        p.appendChild(document.createTextNode("Type: " + langInfo.type));
        p2.appendChild(document.createTextNode("Source: "));
        a.href = langInfo.source;
        srcText = (langInfo.source.length > 60) ? langInfo.source.substring(0, langInfo.source.length - 3) + "..." : langInfo.source;
        a.appendChild(document.createTextNode(srcText));
        p2.appendChild(a);
        info.appendChild(p);
        info.appendChild(p2);
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
    console.log("hi");
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

getData();
createNav();
updateNav(navSelect);
