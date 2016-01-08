'use strict';
const iugu = require('iugu');
const _ = require('lodash');
const multaPercentual = 2;
let format = require('string-format');
format.extend(String.prototype);


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

let dataAtualFormatada = (data) => {
    var dia = data.getDate();
    if (dia.toString().length == 1)
        dia = "0"+dia;
    var mes = data.getMonth()+1;
    if (mes.toString().length == 1)
        mes = "0"+mes;
    var ano = data.getFullYear();
    return dia+"/"+mes+"/"+ano;
};


let getInvoice = (unidade,invoiceId) => {
    let iuguUnidade = iugu(unidade.key,'v1');

    if (invoiceId){
        return iuguUnidade.invoices.retrieve(invoiceId);
    }else{
        return Promise.resolve(null);
    }
};


let createInvoice = (unidade,boleto) => {
    let iuguUnidade = iugu(unidade.key,'v1');
    const today = new Date();
    const vencimento = new Date(boleto.DataVencimento);
    let itensInvoice = [];


    let isLate = () => {
        var timeDiff = vencimento - today;
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays < 0
    };

    let price_cents = (valor) => {
        //retornando em centavos no formato string
        return Math.round(valor * 100).toString();
    };


    let addValorPrincipal = (list) => {
        list.push({
            description: "{} Ref: {}/{} do Curso {}".format(boleto.TipoCobrança, boleto.intMesRef, boleto.AnoRef, boleto.Curso),
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
        if(isLate() && boleto.JurosCorrigido > 0){
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

        if(valor != 0){
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

    let getVencimento = () => dataAtualFormatada(isLate() ? today : vencimento);

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
        email: getEmail(), //todo colocar email na view
        due_date: getVencimento(),
        items: itensInvoice,
        notification_url: 'https://cursarmeboleto.herokuapp.com/boletos/retorno/{}/{}/{}'.format(boleto.CodUnidade,boleto.CodMovimento,boleto.Parcela),
        expired_url: 'https://cursarmeboleto.herokuapp.com/boletos/atrasado/{}/{}/{}'.format(boleto.CodUnidade,boleto.CodMovimento,boleto.Parcela), //todo ajustar a view de boleto atrasado para regerar
        fines: "true",
        late_payment_fine: multaPercentual.toString(),
        discount_cents: "0",
        per_day_interest: "true",
        ignore_due_email: "true",
        payable_with: 'bank_slip'
    };

    let calcTotal = (itens) => {
      if (itens.length > 1) {
          return itens.reduce((a,b) => Number(a.price_cents) + Number(b.price_cents));
      } else if (itens.length = 1) {
          return Number(_.first(itens).price_cents);
      }else{
          return 0;
      }
    };

    if (calcTotal(itensInvoice) > 0) {
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
    createInvoice : createInvoice,
    cancelInvoice : cancelInvoice,
    getInvoice : getInvoice
};






