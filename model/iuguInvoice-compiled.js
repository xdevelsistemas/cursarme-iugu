'use strict';

const iugu = require('iugu');
const multaPercentual = 2;
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

let createInvoice = (unidade, boleto) => {
    let iuguUnidade = iugu(unidade.key, 'v1');

    let vencimento = new Date(boleto.DataVencimento);

    let multa = boleto.PagarValor * multaPercentual / 100 * 100;

    let isLate = vencimento => {
        let today = new Date();

        var timeDiff = vencimento - today;
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

        return diffDays < 0;
    };

    let discount = (bolsaCondicional, bolsa, vencimento) => {
        let valor = 0;

        if (bolsa) {
            valor += bolsa;
        }

        if (bolsaCondicional && !isLate(vencimento)) {
            valor += bolsaCondicional;
        }

        return valor * 100; // deve ser em centavos
    };

    let price_cents = (valorPagar, valorCorrigido, vencimento) => {

        let valorFinal = 0;

        if (isLate(vencimento)) {
            valorFinal += valorCorrigido;
        } else {
            valorFinal += valorPagar;
        }

        //retornando em centavos
        return valorFinal * 100;
    };

    let objectInvoice = {
        email: 'clayton@xdevel.com.br', //todo colocar email na view
        due_date: '14/01/2016', //vencimento.toLocaleDateString('pt-BR'),
        items: [{
            description: "{} Ref: {}/{} do Curso {}".format(boleto.TipoCobrança, boleto.intMesRef, boleto.AnoRef, boleto.Curso),
            quantity: "1",
            price_cents: price_cents(boleto.ValorCorrigido, boleto.ValorCorrigido, vencimento).toString()
        }],
        notification_url: 'http://localhost', //todo ajustar o endpoint para processar retorno
        fines: "true",
        late_payment_fine: multa.toString(),
        discount_cents: "0",
        per_day_interest: "true",
        ignore_due_email: "true",
        payable_with: 'bank_slip'
    };

    let test = {
        email: "teste@teste.com",
        due_date: "30/11/2014",
        items: [{
            description: "Item Um",
            quantity: "1",
            price_cents: "1000"
        }]
    };

    iuguUnidade.invoices.create(test, function (err, customer) {
        //err; // null se não ocorreu nenhum erro
        //customer; // O objeto de retorno da criação
        if (err) {
            console.log('erro ... ');
            console.log(err);
        } else {
            console.log(customer);
        }
    });
};

module.exports = {
    createInvoice: createInvoice
};

//# sourceMappingURL=iuguInvoice-compiled.js.map