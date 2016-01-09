'use strict';
const iugu = require('iugu');
const _ = require('lodash');
const key = require('../config/tokens').xduka;
const api = require('../services/apiCall')('http://ieses-intermed.xduka.com.br',null);
let format = require('string-format');
format.extend(String.prototype);


let getInvoices = (cpf) => {
    return api.apiCall('/Boleto/Home/CobrancaporCPF?key={key}&numCPF={cpf}',api.method.GET,{key : key, cpf : cpf});

    //var options = {
    //    url: 'http://ieses-intermed.xduka.com.br/Boleto/Home/CobrancaporCPF?key='+ key +'&numCPF='+ req.params.cpf,
    //    port: 80,
    //    method: 'GET'
    //};
    //
    //function callback(error, response, body) {
    //    if (!error && response.statusCode == 200) {
    //        var info = JSON.parse(body);
    //        res.json(info)
    //    }
    //
    //    if (error){
    //        console.log(error.message);
    //        res.json([]);
    //    }
    //}
    //request(options, callback);

};



module.exports = {
    getInvoices : getInvoices
};






