/**
 * Created by clayton on 27/03/15.
 */
angular.module('xDukaBoletos')
    .controller('regeraBoletoController',function($scope , $http, $resource , _ , ngProgress, $location ){
        $scope.boleto = null;
        $scope.valid =  false;


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










