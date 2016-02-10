var redisClient = require('redis');

// get enviroment variables
var redis_host = 'localhost';
var redis_port = 6379;
var redis_db = 0;
//var redis_auth = process.env.REDIS_AUTH;


var options = {
    host : redis_host,
    port : redis_port,
    db: redis_db,
//    pass: redis_auth
};



module.exports = {
    ttl: (60000 * 24 * 30),
    options : options
};