angular.module('xDukaBoletos.directives', [])
    .directive('accordion', ['$timeout', function (timer) {
        return {
            link: function (scope, elem, attrs, ctrl) {
                var trg = function () {
                    $(elem).accordion();
                };
                trg();
            }
        }
}]);
