'use strict';

module.exports = {
    user: 'xdevel',
    password: 'xdevelsystem',
    server: 'mssql.xduka.com.br', // You can use 'localhost\\instance' to connect to named instance
    database: 'xDuka',
    connectionTimeout: 5000,
    requestTimeout: 5000,
    options: {
      useUTC: false
    },
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 5000
    }
};