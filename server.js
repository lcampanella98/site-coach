var fs = require("fs");
var mysql = require("mysql");
var path = require("path");
var http = require("http");

var connect = require("connect");
var serve_static = require("serve-static");

var app = connect();

var SERVER_PORT = 8888;

var dbConfigPath = path.join(__dirname, "dbconfig.json");
var dbConfigObj;

if (fs.existsSync(dbConfigPath)) {
    dbConfigObj = JSON.parse(fs.readFileSync(dbConfigPath));
} else {
    console.log("file not found");
    dbConfigObj = {
        host: "localhost",
        user: "root",
        password: "password"
    }
}

var sqlCon = mysql.createConnection({
    host: dbConfigObj["host"],
    user: dbConfigObj["user"],
    password: dbConfigObj["password"],
    database: "site_coach"
});

app.use(serve_static(path.join(__dirname, "public")));
app.use("/getAllLogs", function (req, res) {
    var q = "SELECT * FROM load_times";
    sqlCon.query(q, function (err, rows) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.write(err.toString());
            res.end();
            return;

        }
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(rows));
        res.end();
    })
});

var server = http.createServer(app);
server.listen(SERVER_PORT);
