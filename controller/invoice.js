'use strict';
const parcelas = require('../model/xdukaBoleto');
const iuguInvoice = require('../model/iuguInvoice');
const _ = require('lodash');
const request = require('sync-request');
let  reErrStatus = /^[4|5]/;
const Promise = require("bluebird");







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


    controller.showInvoice = (req,res) => {
        if (parcelas.getUnidade(req.params.unidade)) {

            const codUnidade = req.params.unidade;
            const invoiceId = req.params.invoiceid;

            iuguInvoice.getInvoice(parcelas.getUnidade(codUnidade),invoiceId)
                .then((invoice) => {
                    if (invoice && reErrStatus.test(invoice.statusCode)) {
                        throw new Error(JSON.stringify(invoiceCreated.body));
                    } else if (invoice) {
                        return res.json(invoice.body)
                    } else {
                        return res.status(404).json({err : 'boleto não encontrado'})
                    }
                })
                .catch((err) => {
                    throw  err;
                });
        }else {
            throw Error('unidade nao configurada')
        }
    };



    constroller.invoiceStatusChange = (req,res) => {

        //{
        //    "data": {
        //    "subscription_id": "F4115E5E28AE4CCA941FCCCCCABE9A0A",
        //        "status": "paid",
        //        "id": "1757E1D7FD5E410A9C563024250015BF"
        //},
        //    "event": "invoice.status_changed"
        //}

        if (req.body.data &&
            req.body.data.id &&
            req.body.data.event &&
            req.body.data.status &&
            req.body.data.event == 'invoice.status_changed' &&
            req.body.data.status == 'paid' &&
            parcelas.getUnidade(req.params.unidade)
        ) {

            let invoiceid = req.body.data.id;
            let unidade = parcelas.getUnidade(req.params.unidade);

            iuguInvoice.getInvoice(unidade, invoiceid)
                .then((invoice) => {
                    if (invoice.status === 'paid'){
                        //total_paid_cents ???
                        let  paidValue = invoice.paid_cents;
                        let  paidDate = new Date(invoice.paid_at);
                        return parcelas.payInvoice(invoiceid,paidValue,paidDate);
                    }else {
                        return Promise.resolve(null);
                    }
                })
                .then(() => {
                    res.json({msg: 'sucesso'});
                })
                .catch((err) => {
                    if (err.message){
                        res.status(500).json({msg: err.message});
                    }else
                    {
                        res.status(500).json({msg: err});
                    }
                })

        }





    };


    controller.testreturn = (req,res) => {
        res.send(ok);
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