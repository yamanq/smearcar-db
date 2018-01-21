var navSelect = "home";
var serverURL = "http://localhost:5000";
var data;

var navi = [ // Array containing navigation items in form [Font-Awesome class name, Display Text, Onclick function].
    ["home", "Home", "home"],
    ["bar-chart", "Data Values", "dataValues"],
    ["database", "Database and Files", "files"],
    ["bell", "Updates and Progress", "updates"]
];

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

updateNav(navSelect);

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
            console.log(data);
        },
        function error(e) {
            console.log(e);
        }
    );
}

function language(language) {
    return data.languages.filter(function(element) {
        return element.name === language;
    });
}
