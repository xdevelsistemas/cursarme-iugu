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
    cariacica : {query : 'CodUnidade = 215', key: '62bee72f9892240958e39dac0e344341'},
    sao_mateus : {query : 'CodUnidade in (217,221)', key: '044325bfff65d13e8330641f39bbb830'}
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
            .then((invoices) => {
                let invoice = _.first(invoices);

                if (invoice){
                    if (invoice.PagoValor > 0) throw new Error('Boleto foi pago');
                    if (invoice.Cancelada ) throw new Error('Boleto foi cancelado');
                    if (invoice.Ajuizada ) throw new Error('Boleto foi Ajuizado');
                }else{
                    throw new Error('Boleto não encontrado');
                }

                return Promise.all([Promise.resolve(invoice),iuguInvoice.getInvoice(getUnidade(codUnidade),invoice.xDevCobId)]);
            })
            .then((processed) => {
                let invoice = processed[0];
                let invoiceIugu = processed[1];

                //todo colocar validacao de boleto ok
                if (invoiceIugu && invoice
                    && !reErrStatus.test(invoiceIugu.statusCode)
                    && !iuguInvoice.isLate(new Date(invoiceIugu.due_date),new Date())
                    && iuguInvoice.compareInvoices(invoiceIugu.body,invoice)){
                    throw new Error("O Boleto já está atualizado com os dados da cobrança e com data a vencer");
                }

                if ( invoiceIugu && invoiceIugu.status == 'paid') throw new Error('O Boleto já foi pago');
                //if ( invoiceIugu && invoiceIugu.status == 'pending' && (new Date(invoiceIugu.due_date) > new Date().setHours(0,0,0,0) ) ) throw new Error('Já existe um boleto em atividade');

                return Promise.resolve(invoice);
            })
            .then((invoice)=> {
                return  Promise.all([iuguInvoice.createInvoice(getUnidade(codUnidade),iuguInvoice.populateInvoice(invoice)),
                    iuguInvoice.cancelInvoice(getUnidade(codUnidade), invoice.xDevCobId)]
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
        .then((result) => { mssql.close(); return Promise.resolve(transactUrl)})
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

                let valorPago = payValue / 100;
                let  msg = ('Pagamento realizado via Boleto do Iugu, valor de {} e Data de Pagamento de "{}" na parcela {}').format(valorPago.toString().replace('.',','),payDate.toString(), result.Parcela);

                return new mssql.Request()
                    .query(`insert into cntMovimentoLog
                (CodUnidade, CodMovimento, Data, IDUsuário, LogMensagem)
                VALUES  ({0},{1},getdate(), 6584 ,'{5}');
                update cntMovimentoParcela set
                PagoValor = {3},
                PagoData  = CONVERT(char(30), '{4}',126)
                where CodUnidade = {0}
                and CodMovimento = {1}
                and Parcela = {2}`.format(result.CodUnidade,result.CodMovimento,result.Parcela,valorPago,payDate.toISOString(),msg))
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
