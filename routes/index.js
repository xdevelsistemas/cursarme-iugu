'use strict';
let express = require('express');
let router = express.Router();
let passport = require('passport');
const parcelas = require('../model/xdukaBoleto');
const controller = require('../controller/invoice')();

/* show invoices from xduka */
router.get('/boletos/gerar/:unidade/:year/:month',passport.authenticate('bearer', { session: false }), (req,res) => controller.processAllInvoices(req,res,false) );
router.get('/boletos/regerartodos/:unidade/:year/:month',passport.authenticate('bearer', { session: false }), (req,res) => controller.processAllInvoices(req,res,true) );
/* regenerate single invoice */
router.get('/boletos/regerar/:unidade/:movimento/:parcela',passport.authenticate('bearer', { session: false }), controller.processInvoice);



module.exports = router;
