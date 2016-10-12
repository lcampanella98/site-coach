var fs = require("fs");
var mysql = require("mysql");
var path = require("path");
var http = require("http");

var connect = require("connect");
var serve_static = require("serve-static");

var app = connect();

var sqlCon = mysql.createConnection({
    host: "localhost",
    user: "lcampanella",
    password: "lorenzo98",
    database: "site_coach"
});

app.use(serve_static(path.join(__dirname, "public")));
app.use("/getLogs", function(req, res, next) {
    var q = "SELECT ROUND(AVG(load_time)) as avg_load_time, CAST(time as DATE) as date FROM load_times GROUP BY date ORDER BY date";
    sqlCon.query(q, function(fields, results, err) {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(results));
        res.end();
    });
});

var server = http.createServer(app);
server.listen(8888);
