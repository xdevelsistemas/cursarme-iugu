'use strict';

let express = require('express');
let router = express.Router();
const parcelas = require('../model/xdukaBoleto');
const controller = require('../controller/invoice')();

/* show invoices from xduka */
router.get('/boletos/:unidade/:year/:month', controller.processaInvoices);

module.exports = router;

//# sourceMappingURL=index-compiled.js.map