'use strict';
const model = require('../model/invoiceCPF');
const _ = require('lodash');
let  reErrStatus = /^[4|5]/;



module.exports = () => {
    let controller = {};

    controller.getInvoices = (req, res) => {
        model.getInvoices(req.params.cpf)
            .then( (response) => res.status(response.status).json(response.data))
            .catch(
                (error) => {
                    console.log(error.message);
                    res.json([]);
                }
            );
    };

    return controller;
};
