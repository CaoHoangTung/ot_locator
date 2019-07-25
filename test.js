var mysql = require('mysql');

var conn = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
});

conn.connect((err) => {
    if (err) throw err;
    console.log("CONNECTED");
})