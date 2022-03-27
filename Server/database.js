var mysql = require('mysql');

var con = mysql.createConnection({
  host: "34.122.166.170",
  //socketPath: 'projects/linen-totality-315715/global/networks/default',
  user: "root",
  password: process.env.SQL_PASS,
  database: "encodes"
});

module.exports = {
    addHash: function(name, base64) {
        return new Promise(async (resolve, reject) => {
            let foundHash = await module.exports.getHash(name);
            if (!foundHash[0]) {
                con.connect(function(err) {
                    if (err) {
                        resolve({success: false})
                        return
                    }
                    console.log("Connected to db, trying to add var!");
                    var sql = "INSERT INTO files (Name, Hash) VALUES ('" + name + "', '" + base64 + "')";
                    con.query(sql, function (err, result) {
                        if (err) {
                            resolve({success: false})
                        } else {
                            resolve({success: true})
                            console.log("1 record inserted");
                        }
                        
                    });
                });
            } else {
                resolve({success: true})
            }
        });
    },
    getHash: async function(name) {
        return new Promise((resolve, reject) => {
            con.connect(function(err) {
                if (err) {
                    resolve({success: false})
                }
                con.query("SELECT * FROM files WHERE Name = '" + name + "'", function (err, result) {
                    if (err) {
                        resolve({success: false})
                    }
                    resolve({success: false, data: result})
                });
            });
        });
        
    }
}