/** Database setup for BizTime. */

const { Client } = require("pg");
const DATABASE_URL = require('./database_url.js')

let DB_URI;

if (process.env.NODE_ENV === 'test') {
    DB_URI = `${DATABASE_URL}_test`;
} else {
    DB_URI = DATABASE_URL;
}

let db = new Client ({
    connectionString: `${DB_URI}`
});

db.connect();

module.exports = db