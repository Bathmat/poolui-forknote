'use strict';

app.controller('BlocksCtrl', function($scope, $route, dataService, timerService) {
	$scope.blocks = {};
	$scope.selected = [];

	$scope.options = {
                page: 1,
                limit: 15
        }

        $scope.loadBlocks = function () {
                var params = angular.copy($scope.options);
                params.page -= 1;
                var urlParams = $.param(params)
                $scope.promise = dataService.getData("/pool/blocks?"+urlParams, function(data){
                        $scope.blocks.global = data;
                        updateMaturity();
                });
        };

        var updateMaturity = function () {
                var luck, color;
                if($scope.poolStats.global !== undefined){
                        _.each($scope.blocks.global, function(block, index){
                                if($scope.network !== undefined) {
                                        $scope.blocks.global[index].maturity = $scope.config.maturity_depth - ($scope.network.height - block.height);
                                }

                                // calculate luck
                                luck = block.shares/block.diff*100;
                                var mid = 100 ;
                                var $b = 0;
                                        if (luck <= mid){

                                                var $r = Math.floor(80 * (luck / mid));
                                            var $g = 128;
                                        }
                                        else if (luck <= 200) {

                                                $r = 255;
                                            $g = Math.floor(180 * ((mid - (luck-1) % mid) / mid));
                                        }
                                        else {
                                                $r = 255;
                                                $g = 0;
                                                $b = 0;
                                        }


                                $scope.blocks.global[index].color = (block.valid) ? "rgb(" + $r + "," + $g + "," + $b + ")" : "black";

                                $scope.blocks.global[index].luck = (luck <= 100) ? (luck) : (luck) ;
                                $scope.blocks.global[index].icon = (block.valid) ? 'done' : 'clear';
                        });
                }
        }

        $scope.$watchGroup(["blocks.global", "poolStats.global"], updateMaturity);

        // Register call with timer 
        timerService.register($scope.loadBlocks, $route.current.controller);
        $scope.loadBlocks();

        $scope.$on("$routeChangeStart", function () {
                timerService.remove($route.current.controller);
        });
});
