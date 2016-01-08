'use strict';
let express = require('express');
let router = express.Router();
let passport = require('passport');
const parcelas = require('../model/xdukaBoleto');
const controller = require('../controller/invoice')();

/* processa todos os boletos que nao criaram vinculo com iugu  */
router.get('/boletos/gerar/:unidade/:year/:month',passport.authenticate('bearer', { session: false }), (req,res) => controller.processAllInvoices(req,res,false) );
/* processa todos os boletos do periodo regerando os existentes  */
router.get('/boletos/regerartodos/:unidade/:year/:month',passport.authenticate('bearer', { session: false }), (req,res) => controller.processAllInvoices(req,res,true) );
/* regera boleto  */
router.get('/boletos/regerar/:unidade/:movimento/:parcela',passport.authenticate('bearer', { session: false }), controller.processInvoice);
/* processa retorno  */
router.post('/boletos/retorno/:unidade/:movimento/:parcela', controller.testreturn);


router.get('/boletos/get/:unidade/:invoiceid', controller.showInvoice);


module.exports = router;
