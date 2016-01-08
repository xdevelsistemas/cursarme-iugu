'use strict';

let express = require('express');
let router = express.Router();
let passport = require('passport');
const parcelas = require('../model/xdukaBoleto');
const controller = require('../controller/invoice')();

/* processa todos os boletos que nao criaram vinculo com iugu  */
router.get('/boletos/gerar/:unidade/:year/:month', passport.authenticate('bearer', { session: false }), (req, res) => controller.processAllInvoices(req, res, false));
/* processa todos os boletos do periodo regerando os existentes  */
router.get('/boletos/regerartodos/:unidade/:year/:month', passport.authenticate('bearer', { session: false }), (req, res) => controller.processAllInvoices(req, res, true));
/* regera boleto  */
router.get('/boletos/regerar/:unidade/:movimento/:parcela', passport.authenticate('bearer', { session: false }), controller.processInvoice);
/* processa retorno  */
router.post('/boletos/retorno/:unidade/:movimento/:parcela', controller.invoiceStatusChange);
/* tela para regerar boleto*/
router.get('/boletos/atrasado/:unidade/:movimento/:parcela', controller.invoiceDueDate);
router.get('/boletos/get/:unidade/:invoiceid', passport.authenticate('bearer', { session: false }), controller.showInvoice);

module.exports = router;

//# sourceMappingURL=index-compiled.js.map