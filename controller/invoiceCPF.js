'use strict';
const model = require('../model/invoiceCPF');
const _ = require('lodash');
let  reErrStatus = /^[4|5]/;



module.exports = () => {
    let controller = {};

    controller.getInvoices = (req, res) => {
        model.getInvoices(req.params.cpf)
            .then( (response) => {

                let dados = response.data;
                //if (response.data.length > 0){
                //    dados = response.data.map(d=> {
                //        let saida = d;
                //        saida.cobrancas = d.cobrancas.filter(e=> e.xDevExternalUrl);
                //        return saida;
                //    });
                //}

                res.status(response.status).json(dados);

            })
            .catch(
                (error) => {
                    res.json({error : error.message});
                }
            );
    };

    return controller;
};
