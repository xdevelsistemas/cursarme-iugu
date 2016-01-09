/**
 * Created by clayton on 27/03/15.
 */
angular.module('xDukaBoletos')
    .controller('BoletosController',function($scope , $http, $resource , _ , ngProgress, $location ){
        $scope.cpf = "";
        $scope.valid = false;


        $scope.convert = function(inputFormat) {
            function pad(s) { return (s < 10) ? '0' + s : s; }
            var d = new Date(inputFormat.match(/\d+/)[0] * 1);
            return [pad(d.getDate()), pad(d.getMonth()+1), d.getFullYear()].join('/');
        };

        $scope.formatMoney = function(inputFormat){
            var n = inputFormat,
                c = 2,
                d = ",",
                t = ".",
                s = n < 0 ? "-" : "",
                i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
                j = (j = i.length) > 3 ? j % 3 : 0;
            return 'R$ ' + s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
        };

        $scope.click = function(inputFormat){
            var cpf = inputFormat.replace(/\./g,'').replace(/\-/g,'').replace(/\//g,'');
            $location.url("?numCPF="+cpf);
            callBoletos(ngProgress,$resource,$scope,_, $location)
        };

        callBoletos(ngProgress,$resource,$scope,_, $location)
});

function callBoletos(ngProgress,$resource,$scope,_,$location) {

    
    ngProgress.start();
    var numCPF = $location.search().numCPF;
    if (numCPF){
        var numCPFUnformat = numCPF.replace(/\./g,'').replace(/\-/g,'').replace(/\//g,'');

        $scope.valid = true;
        var Cobranca = $resource('/cobranca/:numCPF');
        var promise  = Cobranca.query({numCPF : numCPFUnformat}).$promise;

        promise.then(function(data) {
            var dados = [];
            var dgpAluno = _.groupBy(data,'nomeAluno');
            for (var keyNomeAluno in dgpAluno){
                dados.push({'nomeAluno': keyNomeAluno,
                    'mensalidades' :
                        _.each(_.toArray(_.groupBy(dgpAluno[keyNomeAluno],['nomeUnidade','nomeCurso','codMovimento','tipoCobranca']))[0],
                            function(el){
                                return $.extend(el,{'pendencias': _.size(_.where(el.cobrancas, {ajuizado: false, liberado: true}))});
                            })
                })
            }

            $scope.dados = {'alunos' : dados };
            ngProgress.complete();

        });

        promise.catch(function(response, status) {  
            console.log("The request failed with response " + response + " and status code " + status);
        });

    }else{
        $scope.valid = false;
        $scope.dados = {'alunos' : [] };
        ngProgress.complete();
    }
}










