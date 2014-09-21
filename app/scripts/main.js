/*!
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
(function () {
  'use strict';

  var querySelector = document.querySelector.bind(document);

  var navdrawerContainer = querySelector('.navdrawer-container');
  var body = document.body;
  var appbarElement = querySelector('.app-bar');
  var menuBtn = querySelector('.menu');
  var main = querySelector('main');

  function closeMenu() {
    body.classList.remove('open');
    appbarElement.classList.remove('open');
    navdrawerContainer.classList.remove('open');
  }

  function toggleMenu() {
    body.classList.toggle('open');
    appbarElement.classList.toggle('open');
    navdrawerContainer.classList.toggle('open');
    navdrawerContainer.classList.add('opened');
  }

  main.addEventListener('click', closeMenu);
  menuBtn.addEventListener('click', toggleMenu);
  navdrawerContainer.addEventListener('click', function (event) {
    if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
      closeMenu();
    }
  });
})();

var app = angular.module('shop', ['ngRoute']);

app.config(function($routeProvider) {
    'use strict';

    $routeProvider
        .when('/cart', {
            templateUrl: 'cart.html',
            controller: 'CartCtrl'
        })
        .when('/product/:shortCode', {
            templateUrl: 'pdt_details.html',
            controller: 'PdtCtrl'
        })
        .when('/category/:cat', {
            templateUrl: 'listing.html',
            controller: 'CtgCtrl'
        });
});

app.service('Requests', function() {
    'use strict';

    this.getRequest = function(url, success) {
        $.ajax({
            url: url,
            type: 'GET',
            async: false,
            headers : {'Accept-Encodings': 'json'},
            dataType: 'json',
            error: function(xhr, status, error) { }
        }).success(function(response, status) {
            if (success) {
                success(response);
            }
        });
    };

    this.postRequest = function (url, data, success) {
        $.ajax({
            url: url,
            type: 'POST',
            async: false,
            data: data,
            headers : {'Accept-Encodings': 'json'},
            dataType: 'json',
            error: function(xhr, status, error) { }
        }).success(function(response, status) {
            if (success) {
                success(response);
            }
        });
    };
});

function HomeCtrl($scope, $rootScope, $location, Requests) {
    'use strict';

    $scope.categories = [];
    $scope.activeCategory = 'Featured';

    Requests.getRequest('/general_details', function(response) {
        console.log(response);
        $scope.merchant = response;
        $.each(response.categories, function(key, value) {
            $scope.categories.push(key);
        });
        $rootScope.$broadcast('categorySet', {category: 'Featured'});
    });

    $scope.categoryList = function (cat) {
        $scope.activeCategory = cat;
        $rootScope.$broadcast('categorySet', {category: cat});
    };
}

function CtgCtrl($scope, $rootScope, $location, $routeParams, Requests) {
    'use strict';

    $scope.refreshProductList = function(category) {
        Requests.getRequest('/category/'+category, function(data) {
            console.log(data);
            $scope.productList = data.products;
        });
    };

    $scope.refreshProductList($scope.activeCategory);

    $scope.$on('categorySet', function(event, args) {
        console.log('Category Set Event Received');
        $scope.refreshProductList(args.category);
    });

    $scope.showProduct = function(shortCode) {
        $rootScope.$broadcast('productSet', {shortCode: shortCode});
    };

    //Sorting start
//    var hash = {'Lowest first': 'unit_price', 'Highest first': '-unit_price', 'Popular': ''};
//    $scope.ordering = hash[$scope.sort];
//
//    $scope.productDetails = function(shortCode) {
//        $location.url('/product/'+shortCode);
//    };
}

function PdtCtrl($scope, $location, Requests) {
    'use strict';

    $scope.$on('productSet', function(event, args) {
        Requests.getRequest('/'+args.shortCode, function(data) {
            $scope.product = data;
        });
    });

    $scope.addCart = function() {
        console.log('Add Cart');
        console.log($scope.pdt.productId);
        var data = {productId: $scope.pdt.productId};
        console.log('Data');
        console.log(data);
        console.log('Cart');
        Requests.postRequest('/cart/', data, function(response){
            $scope.cart = response;
            $location.url('/cart');
        });
    };
}

//function CartCtrl($scope, $location, Requests) {
//    'use strict';
//
//    Requests.getRequest('/cart/', function(data) {
//        $scope.cart = data;
//    });
//
//    $scope.updateCart = function(quantity, productId, remove) {
//        Requests.postRequest('/update_amount/', {
//                'productId': productId,
//                'remove_product': remove,
//                'quantity': quantity
//            }, function(data) {
//                $scope.cart = data;
//            }
//        );
//    };
//
//    $scope.checkout = function(){
//        window.location = '/checkout';
//    };
//}
