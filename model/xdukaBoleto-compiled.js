'use strict';
//https://github.com/patriksimek/node-mssql#promise

const config = require('../config/mssql');
const mssql = require('mssql');
let format = require('string-format');
format.extend(String.prototype);

let unidades = {
    cariacica: { query: 'CodUnidade = 215', key: '82517338f2a7046de5a79f4f01a5a290' },
    sao_mateus: { query: 'CodUnidade in (217,221)', key: 'ccce2adc652947e86b5b0bd8f3fb8ee2' }
};

let getInvoices = (month, year, unidadeQuery) => mssql.connect(config).then(() => new mssql.Request().query(`select *
                        from xdevbi_financeiro where month(DataVencimento) = {}
                        and  year(DataVencimento) = {}
                        and Cancelada = 0
                        and  PagoValor = 0
                        and {}
                        and ( (CodUnidade = 215 and CodCaixa in (2,3,6))
                        or (CodUnidade = 217 and CodCaixa in (3))
                        or (CodUnidade = 221 and CodCaixa in (2)))`.format(month, year, unidadeQuery))).catch(err => console.log(err));

let setInvoiceUrl = (month, year) => mssql.connect(config).then(() => new mssql.Request().query("select * from xdevbi_financeiro where month(DataVencimento) = {} and  year(DataVencimento) = {} and Cancelada = 0 and  PagoValor = 0 and ( (CodUnidade = 215 and CodCaixa in (2,3,6)) or (CodUnidade = 217 and CodCaixa in (3)) or (CodUnidade = 221 and CodCaixa in (2)) )".format(month, year))).catch(err => console.log(err));

module.exports = {
    unidades: unidades,
    getInvoices: getInvoices
};

//# sourceMappingURL=xdukaBoleto-compiled.js.map