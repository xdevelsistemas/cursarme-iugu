'use strict';
const iugu = require('iugu');
const _ = require('lodash');
const multaPercentual = 2;
let  reErrStatus = /^[4|5]/;
let format = require('string-format');
format.extend(String.prototype);



let calcTotal = (itens) => {
    if (itens.length > 0) {
        return itens.map(d=>d.price_cents = Number(d.price_cents)).reduce((a,b) => a + b );
    }else {
        return 0;
    }
};

// exemplo de boleto
//{
//    "CodUnidade": 215,
//    "CodMovimento": "-215021504130003",
//    "intMesRef": 1,
//    "Abatimento": 0,
//    "Acréscimo": 0,
//    "AcréscimoProgramado": 0,
//    "AnoLcto": null,
//    "AnoPgto": null,
//    "AnoRef": 2016,
//    "Bolsa": 0,
//    "BolsaCondicional": 18,
//    "Caixa": "Bradesco",
//    "CréditoTerceiro": 0,
//    "Curso": "Mestrado em Ciências da Educação",
//    "CursoAbreviado": "Me. C. Educação",
//    "MesLcto": null,
//    "MesPgto": null,
//    "MesRef": "01-Janeiro",
//    "NomeAluno": "ELIANA CARDOSO DE SENA",
//    "PagarValor": 360,
//    "PagoData": null,
//    "PagoValor": 0,
//    "Parcela": 20,
//    "QuitaçãoDescrição": "Manual",
//    "TipoCobrança": "Mensalidade",
//    "TurmaComplementoCompleta": "Turma 07",
//    "ValorAberto": 342,
//    "ValorCorrigido": 342,
//    "ValorPagoCorrigido": 342,
//    "Unidade": "Ieses / Cariacica",
//    "Ajuizada": false,
//    "Cancelada": false,
//    "CodCaixa": 6,
//    "ValorContabilizado": 0,
//    "DataVencimento": "2016-01-15T00:00:00.000Z"
//}

let dataFormatada = (data) => {
    var dia = data.getUTCDate();
    if (dia.toString().length == 1)
        dia = "0"+dia;
    var mes = data.getUTCMonth()+1;
    if (mes.toString().length == 1)
        mes = "0"+mes;
    var ano = data.getUTCFullYear();
    return dia+"/"+mes+"/"+ano;
};

let getAllInvoices = (unidade) => {
    let iuguUnidade = iugu(unidade.key,'v1');

    return iuguUnidade.invoices.list();
};

let getAllInvoicesPaginated = (unidade,start,limit,created_from,created_to) => {
    let iuguUnidade = iugu(unidade.key,'v1');
    return iuguUnidade.invoices.listPaginated(limit,start,created_from,created_to);
};


let getAllwithDrawRequest = (unidade) => {
    let iuguUnidade = iugu(unidade.key,'v1');

    return iuguUnidade.withDrawRequests.list();
};


let getInvoice = (unidade,invoiceId) => {
    let iuguUnidade = iugu(unidade.key,'v1');

    if (invoiceId){
        return iuguUnidade.invoices.retrieve(invoiceId);
    }else{
        return Promise.resolve(null);
    }
};


let populateInvoice = (boleto) => {
    const today = new Date();
    const vencimento = new Date(boleto.DataVencimento);
    let itensInvoice = [];




    let price_cents = (valor) => {
        //retornando em centavos no formato string
        return Math.round(valor * 100).toString();
    };


    let addValorPrincipal = (list) => {
        list.push({
            description: "Aluno(a) {} , {} Ref: {}/{} do Curso {}".format( boleto.NomeAluno, boleto.TipoCobrança, boleto.intMesRef, boleto.AnoRef, boleto.Curso),
            quantity: "1",
            price_cents: price_cents(boleto.ValorParcela).toString()
        });

        return list;

    };


    let addValorAcrescimo = (list) => {
        if(boleto.Acréscimo > 0){
            list.push({
                description: "Acréscimo: [{}]".format(boleto.AcréscimoMotivo),
                quantity: "1",
                price_cents: price_cents(boleto.Acréscimo).toString()
            });

        }

        return list;
    };


    let addValorAcrescimoProgramado = (list) => {
        if(boleto.AcréscimoProgramado > 0){
            list.push({
                description: "Acréscimo Programado: [{}]".format(boleto.AcréscimoProgramadoMotivo),
                quantity: "1",
                price_cents: price_cents(boleto.AcréscimoProgramado).toString()
            });

        }

        return list;
    };

    let addValorJuros = (list) => {
        if(isLate(vencimento,today) && boleto.JurosCorrigido > 0){
            list.push({
                description: "Multa e Juros por atraso",
                quantity: "1",
                price_cents: price_cents(boleto.JurosCorrigido).toString()
            });

        }

        return list;
    };



    let addValorBolsa = (list) => {
        let valor = Number(boleto.Bolsa);
        valor  = valor > 0 ? valor *(-1) : valor;

        if(valor != 0){
            list.push({
                description: "Desconto: [{}]".format(boleto.BolsaMotivo),
                quantity: "1",
                price_cents: price_cents(valor).toString()
            });

        }

        return list;
    };


    let addValorBolsaCondicional = (list) => {
        let valor = Number(boleto.BolsaCondicional);
        valor  = valor > 0 ? valor *(-1) : valor;

        if(valor != 0 && !isLate(vencimento,today)){
            list.push({
                description: "Desconto Condicionado ao Vencimento: [{}]".format(boleto.BolsaCondicionalMotivo),
                quantity: "1",
                price_cents: price_cents(valor).toString()
            });

        }

        return list;
    };


    let addValorAbatimento = (list) => {
        let valor = Number(boleto.Abatimento);
        valor  = valor > 0 ? valor *(-1) : valor;

        if(valor != 0){
            list.push({
                description: "Abatimento: [{}]".format(boleto.AbatimentoMotivo),
                quantity: "1",
                price_cents: price_cents(valor).toString()
            });

        }

        return list;
    };

    let getVencimento = () => {
        return dataFormatada(isLate(vencimento,today) ? today : vencimento);
    };

    let getEmail = () => {
        let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (boleto.Email && re.test(boleto.Email)){
            return boleto.Email;
        }else{
            return "ieses@ieses.com";
        }
    };

    itensInvoice = addValorPrincipal(itensInvoice);
    itensInvoice = addValorAcrescimo(itensInvoice);
    itensInvoice = addValorAcrescimoProgramado(itensInvoice);
    itensInvoice = addValorJuros(itensInvoice);
    itensInvoice = addValorBolsa(itensInvoice);
    itensInvoice = addValorBolsaCondicional(itensInvoice);
    itensInvoice = addValorAbatimento(itensInvoice);

    let objectInvoice = {
        email: getEmail(),
        due_date: getVencimento(),
        items: itensInvoice,
        notification_url: 'http://boletocpf.cursar.me/boletos/retorno/{}/{}/{}'.format(boleto.CodUnidade,boleto.CodMovimento,boleto.Parcela),
        expired_url: 'http://boletocpf.cursar.me/boletos/atrasado/{}/{}/{}'.format(boleto.CodUnidade,boleto.CodMovimento,boleto.Parcela), //todo ajustar a view de boleto atrasado para regerar
        fines: "true",
        late_payment_fine: multaPercentual.toString(),
        discount_cents: "0",
        per_day_interest: "true",
        ignore_due_email: "false",
        payable_with: 'bank_slip'
    };



    return objectInvoice;
};


//let compareInvoice = (unidade,invoiceId,objectInvoice) => {
//    //todo analisar nese ponto
//    if (invoiceId && objectInvoice) {
//        return getInvoice(unidade,invoiceId)
//        .then((response) => {
//            if (reErrStatus.test(response.statusCode)){
//                return false;
//            }else{
//                let remoteInvoice = response.body;
//                return _compareInvoices(remoteInvoice,populateInvoice(objectInvoice));
//            }
//        }).catch((error) => {
//            return false;
//        });
//    }else  {
//        return Promise.resolve(false);
//    }
//
//};

let isLate = (vencimento,today) => {
    var timeDiff = vencimento - today;
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return diffDays < 0
};


let compareInvoices = (invoiceIugu ,invoice ) => {
    let  boletoPreenchido = populateInvoice(invoice);
    let compareItens = (itensA,itensB) => {
        // sempre terá itens nos boletos
        if (itensA && itensB){
            if (itensA.length !== itensB.length){
                return false;
            }else {
                itensA.forEach((element, index, array) => {
                    if (element.description !== itensB[index].description){
                        return false;
                    }
                    if (element.quantity.toString() !== itensB[index].quantity){
                        return false;
                    }
                    if (element.price_cents.toString() !== itensB[index].price_cents){
                        return false;
                    }
                });
            }
        }else {
            return false;
        }

        return true;
    };

    if (invoiceIugu.email !== boletoPreenchido.email){
        return false;
    }
    //todo verificar se está atrasado
    if (dataFormatada(new Date(invoiceIugu.due_date)) !== boletoPreenchido.due_date){
        return false;
    }

    if (invoiceIugu.notification_url !== boletoPreenchido.notification_url){
        return false;
    }
    //todo abrir chamado com iugu e verificar
    //if (objectA.expired_url !== objectB.expired_url){
    //    return false;
    //}
    //if (objectA.fines !== objectB.fines){
    //    return false;
    //}
    //


    if (invoiceIugu.discount_cents.toString() !== boletoPreenchido.discount_cents){
        return false;
    }
    //if (objectA.per_day_interest.toString() !== objectB.per_day_interest){
    //    return false;
    //}
    if (invoiceIugu.ignore_due_email.toString() !== boletoPreenchido.ignore_due_email){
        return false;
    }
    if (invoiceIugu.payable_with !== boletoPreenchido.payable_with){
        return false;
    }

    return compareItens(invoiceIugu.items,boletoPreenchido.items);
};



let createInvoice = (unidade,objectInvoice) => {
    let iuguUnidade = iugu(unidade.key,'v1');






    if (calcTotal(objectInvoice.items) > 0) {
        return iuguUnidade.invoices.create(objectInvoice)
    }else {
        throw new Error("O total do boleto é zero");
    }

};

let cancelInvoice = (unidade,invoiceId) => {
    let iuguUnidade = iugu(unidade.key,'v1');

    if (invoiceId){
        return iuguUnidade.invoices.cancel(invoiceId);
    }else{
        return Promise.resolve(null);
    }
};



module.exports = {
    isLate: isLate,
    compareInvoices: compareInvoices,
    populateInvoice: populateInvoice,
    createInvoice : createInvoice,
    cancelInvoice : cancelInvoice,
    getInvoice : getInvoice,
    getAllInvoices: getAllInvoices,
    getAllwithDrawRequest: getAllwithDrawRequest,
    getAllInvoicesPaginated: getAllInvoicesPaginated
};






