'use strict';

module.exports = {
    user: 'xdevel',
    password: 'xdevelsystem',
    server: 'mssql.xduka.com.br', // You can use 'localhost\\instance' to connect to named instance
    database: 'xDukaDev',
    connectionTimeout: 5000,
    requestTimeout: 5000,
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 5000
    }
};