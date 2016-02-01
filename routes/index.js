'use strict';
let express = require('express');
let router = express.Router();
let passport = require('passport');
const controller = require('../controller/invoice')();
const controllerCPF = require('../controller/invoiceCPF')();

router.get('/boletos/reprocessarpendentes/:unidade/:year/:month',passport.authenticate('bearer', { session: false }), (req,res) => controller.processPendentInvoices(req,res) );
router.get('/boletos/reprocessarpagos/:unidade/:year/:month',passport.authenticate('bearer', { session: false }), (req,res) => controller.processPayedInvoices(req,res) );
/* processa todos os boletos que nao criaram vinculo com iugu  */
router.get('/boletos/gerar/:unidade/:year/:month',passport.authenticate('bearer', { session: false }), (req,res) => controller.processAllInvoices(req,res,false) );
/* processa todos os boletos do periodo regerando os existentes  */
router.get('/boletos/regerartodos/:unidade/:year/:month',passport.authenticate('bearer', { session: false }), (req,res) => controller.processAllInvoices(req,res,true) );
/* regera boleto  */
router.get('/boletos/regerar/:unidade/:movimento/:parcela', controller.processInvoice);
/* processa retorno  */
router.post('/boletos/retorno/:unidade/:movimento/:parcela' , controller.invoiceStatusChange);
/* tela para regerar boleto*/
router.get('/boletos/atrasado/:unidade/:movimento/:parcela', controller.invoiceDueDate);
/* tela para o financeiro reprocessar o boleto do aluno */
router.get('/boletos/reprocessar/:unidade/:movimento/:parcela', controller.reprocessa);
/* verifica se tem diferença entre o movimento do sistema e o boleto associado  */
//router.get('/boletos/comparar/:unidade/:movimento/:parcela' ,passport.authenticate('bearer', { session: false }),controller.compareInvoice);
/* mostrar a invoice*/
router.get('/boletos/get/:unidade/:invoiceid',passport.authenticate('bearer', { session: false }), controller.showInvoice);

/* GET home page. */
router.get('/', (req, res, next) => res.render('index'));
/* busca invoices por cpf. */
router.get('/cobranca/:cpf', controllerCPF.getInvoices );
/* retorna o frame de cpf que pode ser usado por site externo. */
router.get('/frame', function(req, res, next) {
    res.render('frame');
});





module.exports = router;



