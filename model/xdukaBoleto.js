'use strict';
//https://github.com/patriksimek/node-mssql#promise
const config = require('../config/mssql');
const mssql = require('mssql');
const iuguInvoice = require('./iuguInvoice');
const _ = require('lodash');
let format = require('string-format');
format.extend(String.prototype);
let  reErrStatus = /^[4|5]/;


let unidades = {
    cariacica : {query : 'CodUnidade = 215', key: '6a15282aac50d771d858e6b86c64bcbe'},
    sao_mateus : {query : 'CodUnidade in (217,221)', key: '6d08dc26f116940a11b70d3111c66a53'}
};

let unidadesCodigos = {
    '215' : 'cariacica',
    '217' : 'sao_mateus',
    '221' : 'sao_mateus'
};

/*
usando retry
* */
let connect = (config) => {
    return mssql.connect(config).catch((err)=> {
        console.log('falha em conexao {}'.format(err));
        connect(config);
    } )
};


let getUnidade = (filter) => {
    let xreturn = unidades[filter];

    if (!xreturn){
        xreturn = unidades[unidadesCodigos[filter]];
    }
    return xreturn;

};


let invoiceControllerCall = (codUnidade,codMovimento,parcela)  => {

    if (getUnidade(codUnidade)){

        return getInvoice(codUnidade,codMovimento,parcela)
            .then((invoices)=> {
                return  Promise.all([iuguInvoice.createInvoice(getUnidade(codUnidade), invoices[0]),
                    iuguInvoice.cancelInvoice(getUnidade(codUnidade), invoices[0].xDevCobId)]
                )
            })
            .then((processed) => {
                let invoiceCreated = processed[0];
                let invoiceCanceled = processed[1];
                if (invoiceCreated && reErrStatus.test(invoiceCreated.statusCode)) {
                    throw new Error(JSON.stringify(invoiceCreated.body));
                } else  if (invoiceCreated) {
                    return addTransaction(invoiceCreated.body.id, invoiceCreated.body.secure_url,codUnidade, codMovimento, parcela)
                } else {
                    return Promise.resolve(null);
                }
            })
            .catch((err) => {
                throw  err;
            });
    }else {
        throw Error('unidade nao configurada')
    }
};


let getInvoices = (month,year,unidadeQuery,reprocess) =>
    connect(config)
        .then(() => {
            let query = `select *
                        from xdevbi_financeiro where month(DataVencimento) = {}
                        and  year(DataVencimento) = {}
                        and Cancelada = 0
                        and  PagoValor = 0
                        and  Ajuizada = 0
                        and  {}
                        and ( (CodUnidade = 215 and CodCaixa in (2,3,6))
                        or (CodUnidade = 217 and CodCaixa in (3))
                        or (CodUnidade = 221 and CodCaixa in (2)))`;

            if (!reprocess) {
                query += ' and xDevCobId is null';
            }


            return new mssql.Request()
                .query(query.format(month, year, unidadeQuery))
        })
        .then((result) => { mssql.close(); return Promise.resolve(result)})
        .catch((err) => { mssql.close(); throw err;});



let addTransaction = (transactId,transactUrl,CodUnidade,CodMovimento,Parcela) =>
    connect(config)
        .then(() => {
            return new mssql.Request()
                .query(`INSERT into
                        cntMovimentoParcelaIugu
                        (CodUnidade, CodMovimento, Parcela, xDevCobId, xDevExternalUrl)
                        VALUES ({},{},{},'{}','{}')`.format(CodUnidade, CodMovimento, Parcela,transactId,transactUrl))
                .catch((err) => {
                    throw err;
                });
        })
        .then(() => {
            return new mssql.Request()
                .query(`UPDATE cntMovimentoParcela
                        set xDevCobId = '{}',
                        xDevExternalUrl = '{}'
                        where CodUnidade = {}
                        and CodMovimento = {}
                        and Parcela = {}`.format(transactId, transactUrl, CodUnidade, CodMovimento, Parcela))
                .catch((err) => {
                    throw err;
                });
        })
        .then((result) => { mssql.close(); return Promise.resolve(result)})
        .catch((err) => { mssql.close(); throw err;});




let getInvoice = (CodUnidade,CodMovimento,Parcela) =>
    connect(config)
        .then(() => new mssql.Request()
            .query(`select *
                        from xdevbi_financeiro where
                        CodUnidade = {}
                        and CodMovimento = {}
                        and Parcela = {}
                        `.format(CodUnidade,CodMovimento,Parcela)))
        .then((result) => { mssql.close(); return Promise.resolve(result)})
        .catch((err) => {
            mssql.close();
            throw err;
        });


let payInvoice = (transactId,payValue,payDate) =>
    connect(config)
        .then(() => new mssql.Request()
            .query(`select *
                        from xdevbi_financeiro where
                        xDevCobId = '{}'
                        `.format(transactId)))
        .then((result) => {
            if (result && result.length > 0 ){
                return Promise.resolve(result);
            }else{
                return new mssql.Request()
                    .query(`select *
                        from cntMovimentoParcelaIugu where
                        xDevCobId = '{}'
                        `.format(transactId))

            }


        })
        .then((invoiceData) => {
            if (invoiceData && invoiceData.length > 0 ){
                let result = invoiceData[0];
                let  msg = ('Pagamento realizado via Boleto do Iugu, valor de {} e Data de Pagamento de {} na parcela {}').format(payValue,payDate, result.Parcela);

                return new mssql.Request()
                    .query(`insert into cntMovimentoLog
                (CodUnidade, CodMovimento, Data, IDUsuário, LogMensagem)
                VALUES  ({0},{1},getdate(), 6584 ,'{5}');
                update cntMovimentoParcela set
                PagoValor = PagoValor + {3},
                PagoData  = {4}
                where CodUnidade = {0}
                and CodMovimento = {1}
                and Parcela = {2}`.format(result.CodUnidade,result.CodMovimento,result.Parcela,payValue,payDate,msg))
            }else{
                return Promise.reject(Error("a transação '{} não pode ser processada".format(transactId)));
            }
        })
        .then((result) => { mssql.close(); return Promise.resolve(result)})
        .catch((err) => { mssql.close(); throw err;});

module.exports = {
    getUnidade : getUnidade,
    getInvoices: getInvoices,
    getInvoice : getInvoice,
    addTransaction : addTransaction,
    payInvoice: payInvoice,
    invoiceControllerCall: invoiceControllerCall

};
