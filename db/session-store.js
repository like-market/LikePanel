const config = require('../config.js')
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const options = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    database: config.db.database,
    password: config.db.password,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};
 
module.exports = new MySQLStore(options);
