/**
 * Created by clayton on 27/03/15.
 */
angular.module('xDukaBoletos')
    .controller('DashboardController',function($scope , $http, $resource , _ , ngProgress, $location , $interval, formatMoney , formatDate){

        var today = new Date();
        var month = today.getMonth() + 1;
        var year = today.getFullYear();
        var lastMonth = (month - 1 === 0)? 12 : month -1;
        var lastYear = (month - 1 === 0)? year-1 : year;
        var units = ['cariacica','ieses_tec','sao_mateus'];
        var statuses = ['pending','canceled','paid','expired', 'partially_paid'];
        var  units_names = [
            {value : 'todos' , text :'Todos' },
            {value : 'cariacica' , text :'Unidade Cariacica' },
            {value : 'sao_mateus' , text :'Unidade São Mateus' },
            {value : 'ieses_tec' , text :'Unidade Cariacica - IESES-TEC' }
        ];


        $scope.unidade_selecionada = 'todos';
        $scope.unidades = units_names;
        $scope.sumaryInvoices = null;
        $scope.sumaryInvoicesBefore = null;




        $scope.showGraph = function(data) {
            if (!$scope.chart){
                $scope.chart = c3.generate({
                    bindto: '#chart',
                    data: {
                        x: 'x',
                        type: 'bar',
                        columns: data,
                        groups: [[translate_status('pending'),
                            translate_status('canceled'),
                            translate_status('paid'),
                            translate_status('expired')]]
                    },
                    axis: {
                        x: {
                            type: 'timeseries',
                            tick: {
                                count : 5 ,
                                format: '%d/%m/%Y'
                            }
                        },
                        y: {
                            tick : {
                                count : 5 ,
                                format: formatMoney
                            }
                        }
                    },
                    bar: {
                        width: {
                            ratio: 0.2
                        }
                    }
                });
            }else{
                $scope.chart.load({
                    x: 'x',
                        type: 'bar',
                        columns: data,
                        groups: [[translate_status('pending'),
                                  translate_status('canceled'),
                                  translate_status('paid'),
                                  translate_status('expired')]]
                });
            }


        };




        var translate_status = function (el) {
            if (el === 'expired'){
                return 'expirado';
            }else if (el == 'pending'){
                return 'pendente';
            }else if (el == 'canceled'){
                return 'cancelado';
            }else if (el == 'paid'){
                return 'pago';
            }else if (el == 'partially_paid'){
                return 'parcialmente pago';
            }else {
                return el;
            }
        };



        $scope.calcDiffPercent = function(oldValue,newValue) {
            return ((newValue - oldValue) / oldValue ) * 100;
        };


        $scope.$watch("unidade_selecionada", function(newValue, oldValue) {
            loadDashBoard(newValue);
        });




        $scope.select2Options = {
         width: 'resolve'
        };


        $scope.formatDate = formatDate;

        $scope.formatMoney = formatMoney;


        var loadDashBoard = function (unit) {
            ngProgress.start();
            var promisesT = [];
            var promisesI = [];
            var unit_proc = [];
            if (!unit || unit === 'todos'){
                unit_proc = units;
            }else{
                unit_proc = [unit];
            }

            for (var proc in unit_proc){
                promisesT.push($resource('/dashboard/transacoes/'+ unit_proc[proc]).query().$promise);
                promisesI.push($resource('/dashboard/invoices/'+ unit_proc[proc] + '/' + year.toString() + '/' + month.toString() ).query().$promise);
                var lastMonth = (month - 1 === 0)? 12 : month -1;
                var lastYear = (month - 1 === 0)? year-1 : year;
                promisesI.push($resource('/dashboard/invoices/'+ unit_proc[proc] + '/' + lastYear.toString() + '/' + lastMonth.toString() ).query().$promise);

            }

            $scope.transacoes = [];

            Promise.all(promisesT).then(function(all){
                var dados_agrupados = _.groupBy(_.flatten(all).filter(function(el) { return  el.month === month && el.year === year } ),'bank_address');
                for(var k in dados_agrupados) {
                    var  obj = {};
                    obj.banco = JSON.parse(k);
                    obj.dados = dados_agrupados[k].map(function(d){
                        var data = d;
                        if (data.status === 'pending'){
                            data.status_text = 'pendente';
                            data.status_percent = 0;
                        }else if (data.status === 'processing') {
                            data.status_percent = 50;
                            data.status_text = 'transito';
                        }else {
                            data.status_percent = 100;
                            data.status_text = 'banco';
                        }
                        return data;
                    });

                    obj.soma = dados_agrupados[k].reduce(function(n,n1){
                        return n + (n1.status === 'accepted' ?  n1.amount_cents : 0 );
                    },0);
                    $scope.transacoes.push(obj);
                }

            });





            Promise.all(promisesI).then(function(all){


                var allFlatened = _.flatten(all).filter(function(el) { return  el.month === month && el.year === year } );
                var allBeforeFlatened = _.flatten(all).filter(function(el) { return  el.month === lastMonth && el.year === lastYear } );
                var datesWithData = _.groupBy(allFlatened,'due_date');
                var statusWithData = _.groupBy(allFlatened,'status');
                var statusWithDataBefore = _.groupBy(allBeforeFlatened,'status');

                var sumarize = function (status,data,field) {
                    return {
                        sum: data[status] ? (_.sumBy(data[status], field) / 100 ) : 0,
                        count : (data[status])? data[status].length : 0
                    }
                };



                var sumByStatus = function(data) {
                    return {
                        pending : sumarize('pending',data,'total_cents'),
                        canceled : sumarize('canceled',data,'total_cents'),
                        paid : sumarize('paid',data,'total_paid_cents'),
                        partially_paid : sumarize('partially_paid',data,'total_paid_cents'),
                        expired : sumarize('expired',data,'total_cents')
                    };
                };

                var datal = ['x'];
                var data = [];
                var dataByStatus = {
                    pending : [],
                    canceled: [],
                    partially_paid : [],
                    paid: [],
                    expired: []
                };

                function statusInList(status,arr){
                    return arr[status];
                }


                for (var k in datesWithData ){

                    datal.push(k);
                    var statusGrp = _.groupBy(datesWithData[k],'status');
                    for (var k1 in statusGrp) {
                        dataByStatus[k1].push((_.sumBy(statusGrp[k1], (k1 === 'paid' || k1 === 'partially_paid') ? 'total_paid_cents' : 'total_cents') / 100 ));
                    }

                    statuses.forEach(function(el){
                        if (!statusInList(el,statusGrp)){
                            dataByStatus[el].push(0);
                        }
                    });
                }

                data.push(datal);
                statuses.forEach(function(el){
                    data.push( _.concat([translate_status(el)],dataByStatus[el]));
                });


                $scope.showGraph(data);
                $scope.sumaryInvoices = sumByStatus(statusWithData);
                $scope.sumaryInvoicesBefore = sumByStatus(statusWithDataBefore);

                console.log($scope.sumaryInvoices);
                console.log($scope.sumaryInvoicesBefore);

                ngProgress.complete();

            });

        }

    });








