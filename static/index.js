var navi = [ // Array containing navigation items in form [Font-Awesome class name, Display Text].
	["bar-chart", "Data Values"],
	["database", "Database and Files"],
	["bell", "Updates and Progress"]
];

for(var i = 0; i < navi.length; i++) { // Create navigation tabs.
	var side = document.getElementById("sidebar");
	var div = document.createElement("div");
	div.className = "navi colorFade";
	var ic = document.createElement("i");
	ic.className = "fa fa-"+navi[i][0];
	ic["aria-hidden"] = true;
	var p = document.createElement("p");
	p.appendChild(document.createTextNode(navi[i][1]));
	div.appendChild(ic);
	div.appendChild(p);
	side.appendChild(div);
}

