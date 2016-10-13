var fs = require("fs");
var mysql = require("mysql");
var path = require("path");
var http = require("http");

var connect = require("connect");
var serve_static = require("serve-static");

var app = connect();

var SERVER_PORT = 8888;

var dbConfigPath = "../../dbsetup/dbconfig.json";
var dbConfigObj;

if (fs.existsSync(dbConfigPath)) {
    dbConfigObj = JSON.parse(fs.readFileSync(dbConfigPath));
} else {
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
app.use("/getLogs", function (req, res) {
    var q =
        "SELECT ROUND(AVG(load_time)) as avg_load_time, CAST(request_timestamp as DATE) as date " +
        "FROM load_times " +
        "GROUP BY date " +
        "ORDER BY date";
    sqlCon.query(q, function (err, rows) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.write("Database Error: " + err.toString());
            res.end();
            return;
        }
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(rows));
        res.end();
    });
});

var server = http.createServer(app);
server.listen(SERVER_PORT);
