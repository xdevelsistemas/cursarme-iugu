'use strict';
const parcelas = require('../model/xdukaBoleto');
const iuguInvoice = require('../model/iuguInvoice');
const _ = require('lodash');
const request = require('sync-request');
const Promise = require("bluebird");

let  reErrStatus = /^[4|5]/;





module.exports = () => {
    let controller = {};


    controller.showxDukaInvoices = (req, res) => {
        if (parcelas.getUnidade(req.params.unidade)){
            parcelas.getInvoices(req.params.month,req.params.year,parcelas.unidades[req.params.unidade].query)
                .then((recordset)=> res.json([recordset[0]]));
        }else {
            res.json([]);
        }
    };







    controller.processInvoice = (req, res) => {
        if (parcelas.getUnidade(req.params.unidade)){

            const codUnidade = req.params.unidade;
            const codMovimento = req.params.movimento;
            const parcela = req.params.parcela;



            parcelas.invoiceControllerCall(codUnidade,codMovimento,parcela)
                .then(() => res.status(201).json("transacao criada"))
                .catch((err) => {
                    if (err.message){
                        res.status(500).send(err.message);
                    }else{
                        res.status(500).json(err);
                    }
                });
        }else {
            res.status(400).json({err : 'unidade não configurada'});
        }
    };

    controller.processAllInvoices = (req, res, regenerate) => {
        if (parcelas.getUnidade(req.params.unidade)){


            const unidade = req.params.unidade;
            const month = req.params.month;
            const year = req.params.year;
            let  methods = [];

            parcelas
                .getInvoices(month,year,parcelas.getUnidade(unidade).query,regenerate)
                .then((recordset)=> {
                    let totalItens = recordset.length;
                    return Promise.reduce(recordset, (info, el) => {
                        return parcelas.invoiceControllerCall(el.CodUnidade, el.CodMovimento, el.Parcela)
                            .then(() => {
                                console.log('----------------------');
                                console.log('{} de {}'.format(info.total,recordset.length));
                                console.log('----------------------');
                                return {total: info.total + 1 , invoiceWithErrors: info.invoiceWithErrors };
                            })
                            .catch((err) => {
                                console.log('problema com o boleto CodUnidade = {} /  CodMovimento = {} / Parcela = {} : {}'
                                    .format(el.CodUnidade ,
                                        el.CodMovimento,
                                        el.Parcela,
                                        err.message));
                                info.invoiceWithErrors.push({invoice: el, error: err.message});
                                return {total: info.total , invoiceWithErrors: info.invoiceWithErrors };
                            });
                    }, {total : 0,invoiceWithErrors:[]})
                })
                .then((info) => {
                    res.status(201).json({msg : '{} boletos (re)gerados'.format(info.total) , invoiceErrors : info.invoiceWithErrors});
                })
                .catch((err) => {
                    if (err.message){
                        res.status(500).json({err : err.message});
                    }else{
                        res.status(500).json(err);
                    }
            });
        }else {
            res.status(400).json({ err : 'unidade não configurada'});
        }
    };



    return controller;
};