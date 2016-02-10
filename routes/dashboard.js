'use strict';
const verificaAutenticacao = require('../services/verificaAutenticacao.js');
let express = require('express');
let router = express.Router();
let passport = require('passport');
const controller = require('../controller/dashboard')();
const controllerCPF = require('../controller/invoiceCPF')();

/** funcoes de dashboard **/
router.get('/invoices/:unidade/:year/:month',verificaAutenticacao, (req,res) => controller.showAllInvoices(req,res) );
router.get('/transacoes/:unidade/:year/:month',verificaAutenticacao, (req,res) => controller.showAllWithDrawRequests(req,res) );
router.get('/transacoes/:unidade',verificaAutenticacao, (req,res) => controller.showAllWithDrawRequests(req,res) );





router.get('/',verificaAutenticacao, (req, res, next) => res.render('dashboard'));


module.exports = router;



