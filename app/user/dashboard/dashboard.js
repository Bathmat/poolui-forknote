'use strict';

app.controller('DashboardCtrl', function($scope , $http, $route, $mdDialog, $pageVisibility, dataService, timerService, addressService, minerService) {
	$scope.minerStats = {};
	
	$scope.updateCharts = function (){
		minerService.updateStats($scope.addrStats, function(minerStats){
			$scope.minerStats = minerStats;
		});
	}

	$scope.profitCalc = {
	    hashrate: '1000',
	    multi: 'H/S'
/*	    $scope.profitCalc.multi = 'H/S'
        if ($scope.profitCalc.multi = 'H/S') {
        return $scope.profitCalc.hashrate
        } else if ($scope.profitCalc.multi = 'KH/S') {
        return ($scope.profitCalc.hashrate * 1000)
        } else if ($scope.profitCalc.multi = 'MH/S') {
        return ($scope.profitCalc.hashrate * 1000000)
        }
*/	};

    $scope.marketstats = function () {
        $http({
            method : "GET",
            url : "https://tradeogre.com/api/v1/ticker/BTC-XHV"
        }).then(function mySuccess(response) {
            $scope.COINprice = response.data.price;
        }, function myError(response) {
            $scope.COINprice = response.statusText;
        });
        $http({
            method : "GET",
            url : "https://api.coinmarketcap.com/v2/ticker/1/"
        }).then(function mySuccess(response) {
            $scope.BTCprice = response.data.data.quotes.USD.price;
        }, function myError(response) {
            $scope.BTCprice = response.statusText;
        });
    };

	// Update miners everyime addrStats
	$scope.$parent.$watch('addrStats', function(newValue, oldValue) {
		$scope.updateCharts();
	});
	
	$scope.addAddress = function (){
		if ($scope.paymentAddress){
			addressService.trackAddress($scope.paymentAddress);
			$scope.paymentAddress = "";
		}
	};

	$scope.deleteAddress = function (key, ev){
		var confirm = $mdDialog.confirm()
		.title('Hide live stats?')
		.textContent('You can add it back by entering your wallet address again')
		.ariaLabel('Stop tracking payment address')
		.targetEvent(ev)
		.ok("Remove")
		.cancel("Cancel");
		
		$mdDialog.show(confirm).then(function() {
			addressService.deleteAddress(key);
		}, function() {
			// cancel do nothing
		});
	}

	$scope.setAlarm = function(addr, bool){
		addressService.setAlarm(addr, bool);
	};

	$scope.viewPayments = function(ev, miner, addr){
		$mdDialog.show({
			locals: {
				miner: miner,
				addr: addr
			},
			controller: "MinerPaymentsCtrl",
			templateUrl: 'user/dashboard/minerpayments.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:true,
			fullscreen: !$scope.menuOpen
		})
		.then(function(answer) {
			$scope.status = 'You said the information was "' + answer + '".';
		}, function() {
			$scope.status = 'You cancelled the dialog.';
		});
	}

	// Recurring API calls and timer
	var loadData = function () {
		_.each($scope.poolList, function(pool_type) {
			dataService.getData("/pool/stats/"+pool_type, function(data){
				$scope.poolStats[pool_type] = data;
			});

			dataService.getData("/pool/blocks/"+pool_type, function(data){
				if (data.length > 0){
					$scope.lastBlock[pool_type] = data[0];
				} else {
					$scope.lastBlock[pool_type] = {
						ts: 0,
						hash: "",
						diff: 0,
						shares: 0,
						height: 0,
						valid: false,
						unlocked: false,
						pool_type: pool_type,
						value: 0
					}
				}
			});
		});

		// Call minerservice update
		$scope.updateCharts();
	};

	// No spawn xhr reqs in bg
	$pageVisibility.$on('pageFocused', function(){
		minerService.runService(true);
	});

	$pageVisibility.$on('pageBlurred', function(){
		minerService.runService(false);
	});

	// Register call with timer 
	timerService.register(loadData, $route.current.controller);
	loadData();
	
	$scope.$on("$routeChangeStart", function () {
		timerService.remove($route.current.controller);
	});
});