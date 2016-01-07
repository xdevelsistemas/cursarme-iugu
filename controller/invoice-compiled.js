'use strict';

const parcelas = require('../model/xdukaBoleto');
const iuguInvoice = require('../model/iuguInvoice');

module.exports = () => {
    let controller = {};

    controller.showxDukaInvoices = (req, res) => {
        if (parcelas.unidades[req.params.unidade]) {
            parcelas.getInvoices(req.params.month, req.params.year, parcelas.unidades[req.params.unidade].query).then(recordset => res.json([recordset[0]]));
        } else {
            res.json([]);
        }
    };

    controller.processaInvoices = (req, res) => {
        if (parcelas.unidades[req.params.unidade]) {
            parcelas.getInvoices(req.params.month, req.params.year, parcelas.unidades[req.params.unidade].query).then(recordset => {
                [recordset[0]].forEach(el => {
                    iuguInvoice.createInvoice(parcelas.unidades[req.params.unidade], el);
                });

                res.json([]);
            });
        } else {
            res.json([]);
        }
    };

    return controller;
};

//# sourceMappingURL=invoice-compiled.js.map