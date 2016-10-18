var fs = require("fs");
var mysql = require("mysql");
var path = require("path");
var http = require("http");
var favicon = require("serve-favicon");

var connect = require("connect");
var serve_static = require("serve-static");

var app = connect();

var mysqlConOptions = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "site_coach"
};
var serverPort = 8888;

var configPath = path.join(__dirname, "config.json");

if (fs.existsSync(configPath)) {
    var configObj = JSON.parse(fs.readFileSync(configPath));
    if (configObj["database"] !== undefined) {
        dbConf = configObj["database"];
        if (dbConf["host"] !== undefined) mysqlConOptions.host = dbConf["host"];
        if (dbConf["port"] !== undefined) mysqlConOptions.port = dbConf["port"];
        if (dbConf["user"] !== undefined) mysqlConOptions.user = dbConf["user"];
        if (dbConf["password"] !== undefined) mysqlConOptions.password = dbConf["password"];
    }
    if (configObj["serverPort"] !== undefined) serverPort = configObj["serverPort"];
}

var sqlCon = mysql.createConnection(mysqlConOptions);

app.use(favicon(path.join(__dirname, "public/favicon-16x16.png")));
app.use(serve_static(path.join(__dirname, "public")));
app.use("/getAllLogs", function (req, res) {
    var q = "SELECT load_time, request_timestamp FROM load_times";

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
    });
});

var server = http.createServer(app);
server.listen(serverPort);
