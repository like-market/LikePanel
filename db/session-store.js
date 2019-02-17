var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
 
var options = {
    host: 'localhost',
    port: 3306,
    user: 'likepanel',
    password: 'r35ImTyr52Ks666',
    database: 'devlikepanel',
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
