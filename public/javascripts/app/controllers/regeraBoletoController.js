/**
 * Created by clayton on 27/03/15.
 */
angular.module('xDukaBoletos')
    .controller('regeraBoletoController',function($scope , $http, $resource , _ , ngProgress, $location ){
        $scope.boleto = null;
        $scope.valid =  false;

        $scope.erro = null;


        $scope.click = function(codunidade,codmovimento,parcela){
            regeraBoleto(ngProgress,$resource,$scope,_, codunidade,codmovimento,parcela)
        };
});

function regeraBoleto(ngProgress,$resource,$scope,_, codunidade,codmovimento,parcela){

    
    ngProgress.start();

    if (codunidade && codmovimento && parcela){

        var Cobranca = $resource('/boletos/regerar/:unidade/:movimento/:parcela');
        var promise  = Cobranca.get({unidade : codunidade , movimento : codmovimento , parcela : parcela}).$promise;

        promise.then(function(data) {
            $scope.boleto = data.url;
            $scope.valid = true;

            ngProgress.complete();

        }).catch(function(error){
            "use strict";
            $scope.erro = error.data.error;
            ngProgress.complete();
        });


    }else{
        $scope.valid = false;
        $scope.dados = {'alunos' : [] };
        ngProgress.complete();
    }
}










