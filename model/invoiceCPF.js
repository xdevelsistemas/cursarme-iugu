'use strict';
const iugu = require('iugu');
const _ = require('lodash');
const key = require('../config/tokens').xduka;
const api = require('../services/apiCall')('http://ieses-intermed.xduka.com.br',null);
let format = require('string-format');
format.extend(String.prototype);


let getInvoices = (cpf) => {
    return api.apiCall('/Boleto/Home/CobrancaporCPF?key={key}&numCPF={cpf}',api.method.GET,{key : key, cpf : cpf});
};



module.exports = {
    getInvoices : getInvoices
};






