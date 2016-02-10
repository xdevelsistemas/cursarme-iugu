'use strict';
const parcelas = require('../model/xdukaBoleto');
const iuguInvoice = require('../model/iuguInvoice');
const _ = require('lodash');
const request = require('sync-request');
let  reErrStatus = /^[4|5]/;
const Promise = require("bluebird");



let controller = {};
//controller.showAllInvoices = (req,res) => {
//    if (parcelas.getUnidade(req.params.unidade)) {
//
//        const codUnidade = req.params.unidade;
//
//
//        try {
//
//            const month = req.params.month? Number(req.params.month) : null;
//            const year = req.params.month ? Number(req.params.year) : null;
//
//            iuguInvoice.getAllInvoices(parcelas.getUnidade(codUnidade))
//                .then((invoices) => {
//
//                    let _add = (data) => {
//                        data.unidade = req.params.unidade;
//                        data.month = (new Date(data.due_date).getMonth() + 1);
//                        data.year = (new Date(data.due_date).getFullYear());
//                        return data;
//                    };
//
//
//
//                    if (month && year){
//                        let _req = invoices.body.items.filter(d => (new Date(d.due_date).getMonth() + 1) === month && new Date(d.due_date).getFullYear() === year ).map(d=>_add(d));
//                        res.json(_req);
//
//                    }else{
//                        res.json(invoices.body.items.map(d=>_add(d)));
//                    }
//
//
//                })
//                .catch((err) => {
//                    throw  err;
//                });
//
//        } catch (err){
//            res.status(400).json("formato inválido");
//        }
//
//
//    }else {
//        throw Error('unidade nao configurada')
//    }
//};

controller.showAllInvoices = (req,res) => {
    if (parcelas.getUnidade(req.params.unidade)) {

        const codUnidade = req.params.unidade;

        let pages = (num,limit,lst) => {
            let _num = num;
            if (_num >= limit){
                _num -= limit;
                if (!lst){
                    return pages(_num,limit,[limit]);
                }else{
                    let _lst = lst;
                    _lst.push(limit);
                    return pages(_num,limit,_lst);
                }
            }else{
                if (!lst && _num > 0){
                    return [_num];
                }else if (num > 0){
                    let _lst = lst;
                    _lst.push(_num);
                    return _lst;
                }else{
                    return lst;
                }
            }
        };


        try {

            const month = req.params.month? Number(req.params.month) : null;
            const year = req.params.month ? Number(req.params.year) : null;
            const dateStart = (new Date(year,month-1,-15)).toISOString();
            const dateEnd = (new Date(year,month,15)).toISOString();

            iuguInvoice.getAllInvoicesPaginated(parcelas.getUnidade(codUnidade),0,0,dateStart,dateEnd)
                .then((total) => {
                    let _total = total.body.totalItems;
                    let calls = pages(_total,500,[]).map((d,index) => iuguInvoice.getAllInvoicesPaginated(parcelas.getUnidade(codUnidade),index * d +1 ,d,dateStart,dateEnd) )
                    return Promise.all(calls);
                })
                .then((lstResult) =>{

                    if (lstResult.length > 0 ){
                        let _add = (data) => {
                            data.unidade = req.params.unidade;
                            data.month = (new Date(data.due_date).getMonth() + 1);
                            data.year = (new Date(data.due_date).getFullYear());
                            return data;
                        };


                        let  itens =  _.flatten(lstResult.map(d=> d.body.items));
                        let _req = itens.filter(d => (new Date(d.due_date).getMonth() + 1) === month && new Date(d.due_date).getFullYear() === year ).map(d=>_add(d));
                        res.json(_req);

                    }else{
                        res.json(lstResult);
                    }

                })
                .catch((err) => {
                    //throw  err;
                    return res.status(500).json(err.message);
                });




        } catch (err){
            res.status(400).json("formato inválido");
        }


    }else {
        throw Error('unidade nao configurada')
    }
};

controller.showAllWithDrawRequests = (req,res) => {
    if (parcelas.getUnidade(req.params.unidade)) {

        const codUnidade = req.params.unidade;

        try {

            const month = req.params.month? Number(req.params.month) : null;
            const year = req.params.month ? Number(req.params.year) : null;

            iuguInvoice.getAllwithDrawRequest(parcelas.getUnidade(codUnidade))
                .then((requests) => {

                    let _add = (data) => {
                        data.unidade = req.params.unidade;
                        data.amount_cents = Number.parseInt(data.amount.replace('R$ ','').replace(',','').replace('.','')) ;
                        data.month = (new Date(data.created_at).getMonth() + 1);
                        data.year = (new Date(data.created_at).getFullYear());
                        return data;
                    };

                    if (month && year){
                        let _req = requests.body.items.filter(d => ((new Date(d.created_at).getMonth() + 1) === month && new Date(d.created_at).getFullYear() === year) ).map(d=>_add(d));
                        res.json(_req);

                    }else{
                        res.json(requests.body.items.map(d=>_add(d)));
                    }

                    res.json(_req);
                })
                .catch((err) => {
                    throw  err;
                });

        } catch (err){
            res.status(400).json("formato inválido");
        }





    }else {
        throw Error('unidade nao configurada')
    }
};



module.exports = () => {


    return controller;
};