'use strict';
const parcelas = require('../model/xdukaBoleto');
const iuguInvoice = require('../model/iuguInvoice');
const _ = require('lodash');
const request = require('sync-request');
let  reErrStatus = /^[4|5]/;
const Promise = require("bluebird");



let controller = {};
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



//controller.compareInvoice = (req, res) => {
//    if (parcelas.getUnidade(req.params.unidade)){
//
//        const codUnidade = req.params.unidade;
//        const codMovimento = req.params.movimento;
//        const parcela = req.params.parcela;
//
//        parcelas.getInvoice(codUnidade,codMovimento,parcela)
//            .then((response) => {
//                if (response){
//                    return iuguInvoice.compareInvoice(parcelas.getUnidade(req.params.unidade),response[0].xDevCobId,response[0]);
//                }else{
//                    return false;
//                }
//            })
//            .then((result) => {
//                return res.json({result : result})
//            })
//            .catch((err) => {
//                if (err.message){
//                    res.status(500).send({ error: err.message});
//                }else{
//                    res.status(500).json({ error: err});
//                }
//            });
//    }else {
//        res.status(400).json({err : 'unidade não configurada'});
//    }
//};


controller.processPayedInvoices = (req, res, regenerate) => {
    if (parcelas.getUnidade(req.params.unidade)){


        const unidade = req.params.unidade;
        const month = req.params.month;
        const year = req.params.year;
        let  methods = [];

        parcelas
            .getPayedInvoices(month,year,parcelas.getUnidade(unidade).query)
            .then((recordset)=> {
                let totalItens = recordset.length;
                return Promise.reduce(recordset, (info, el) => {
                    return iuguInvoice.getInvoice(parcelas.getUnidade(unidade), el.xDevCobId)
                        .then((info) => {
                            let invoice = info.body;
                            if (invoice.status === 'pending'){
                                return iuguInvoice.cancelInvoice(parcelas.getUnidade(unidade),invoice.id);
                            }else {
                                return Promise.resolve(null);
                            }
                        })
                        .then(() => {
                            console.log('----------------------');
                            console.log('{} de {}'.format(info.total + 1,recordset.length));
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
                res.status(201).json({msg : '{} boletos (re)processados'.format(info.total) , invoiceErrors : info.invoiceWithErrors});
            })
            .catch((err) => {
                if (err.message){
                    res.status(500).json({error : err.message});
                }else{
                    res.status(500).json({ error : err });
                }
            });
    }else {
        res.status(400).json({ error : 'unidade não configurada'});
    }
};



controller.processPendentInvoices = (req, res, regenerate) => {
    if (parcelas.getUnidade(req.params.unidade)){


        const unidade = req.params.unidade;
        const month = req.params.month;
        const year = req.params.year;
        let  methods = [];

        parcelas
            .getPendentInvoices(month,year,parcelas.getUnidade(unidade).query)
            .then((recordset)=> {
                let totalItens = recordset.length;
                return Promise.reduce(recordset, (info, el) => {
                    return iuguInvoice.getInvoice(parcelas.getUnidade(unidade), el.xDevCobId)
                        .then((info) => {
                            let invoice = info.body;
                            if (invoice.status === 'paid'){
                                //total_paid_cents ???
                                let  paidValue = invoice.paid_cents;
                                let  paidDate = new Date(invoice.paid_at);
                                return parcelas.payInvoice(invoice.id,paidValue,paidDate);
                            }else {
                                return Promise.resolve(null);
                            }
                        })
                        .then(() => {
                            console.log('----------------------');
                            console.log('{} de {}'.format(info.total + 1,recordset.length));
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
                res.status(201).json({msg : '{} boletos (re)processados'.format(info.total) , invoiceErrors : info.invoiceWithErrors});
            })
            .catch((err) => {
                if (err.message){
                    res.status(500).json({error : err.message});
                }else{
                    res.status(500).json({ error : err });
                }
            });
    }else {
        res.status(400).json({ error : 'unidade não configurada'});
    }
};



controller.invoiceDueDate = (req, res) => {

    if (parcelas.getUnidade(req.params.unidade)) {
        res.render('invoice',
            {   unidade : req.params.unidade ,
                codmovimento : req.params.movimento,
                parcela : req.params.parcela,
                aviso: true
            })
    }else {
        res.render('error', { error : { message : 'pagina nao encontrada' , status : '404'} })
    }

};


controller.reprocessa = (req, res) => {

    if (parcelas.getUnidade(req.params.unidade)) {
        res.render('invoice',
            {   unidade : req.params.unidade ,
                codmovimento : req.params.movimento,
                parcela : req.params.parcela,
                aviso: false
            })
    }else {
        res.render('error', { error : { message : 'pagina nao encontrada' , status : '404'} })
    }

};




controller.invoiceStatusChange = (req,res) => {
    if (req.body.data &&
        req.body.data.id &&
        req.body.event &&
        parcelas.getUnidade(req.params.unidade)
    ) {

        if  (
            req.body.data.status &&
            req.body.event == 'invoice.status_changed' &&
            req.body.data.status == 'paid'
        ){

            let invoiceid = req.body.data.id;
            let unidade = parcelas.getUnidade(req.params.unidade);

            iuguInvoice.getInvoice(unidade, invoiceid)
                .then((response) => {
                    let invoice = response.body;
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
                        res.status(500).json({error: err.message});
                    }else
                    {
                        res.status(500).json({error: err});
                    }
                })

        }else
        {
            // para transicoes que nao forem pagamento
            res.status(200).json('ok');
        }

    }else{
        res.status(400).json({error: "informacao incompleta"});
    }





};







controller.processInvoice = (req, res) => {
    if (parcelas.getUnidade(req.params.unidade)){

        const codUnidade = req.params.unidade;
        const codMovimento = req.params.movimento;
        const parcela = req.params.parcela;



        parcelas.invoiceControllerCall(codUnidade,codMovimento,parcela)
            .then((url) => res.status(201).send({url : url }))
            .catch((err) => {
                if (err.message){
                    res.status(500).send({ error: err.message});
                }else{
                    res.status(500).json({ error: err});
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
                    res.status(500).json({error : err.message});
                }else{
                    res.status(500).json({ error : err });
                }
            });
    }else {
        res.status(400).json({ error : 'unidade não configurada'});
    }
};




module.exports = () => {


    return controller;
};