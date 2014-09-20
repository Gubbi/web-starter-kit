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

app.config(function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: "listing.html",
            controller: 'ShopCtrl'
        })
        .when('/cart', {
            templateUrl: "cart.html",
            controller: 'CartCtrl'
        })
        .when('/product/:short_code', {
            templateUrl: 'pdt_details.html',
            controller: 'PdtCtrl'
        })
        .when('/category/:cat', {
            templateUrl: 'listing.html',
            controller: 'CtgCtrl'
        })
});

app.service('Requests', function() {
    this.getRequest = function(url, success) {
        var responseObj;
        $.ajax({
            url: url,
            type: 'GET',
            async: false,
            headers : {'Accept-Encodings': 'json'},
            dataType: "json",
            error: function(xhr, status, error) {
                var err = eval("(" + xhr.responseText + ")");
                //console.log(err.Message);
            }
        }).success(function(response, status) {
            //$scope.status = status;
            responseObj = response;
            console.log((response));
        });

        if (success) success(responseObj);
        return responseObj;
    };

    this.postRequest = function (url, data) {
        var responseObj;
        $.ajax({
            url: url,
            type: 'POST',
            async: false,
            data: data,
            headers : {'Accept-Encodings': 'json'},
            dataType: "json",
            error: function(xhr, status, error) {
                var err = eval("(" + xhr.responseText + ")");
                //console.log(err.Message);
            }
        }).success(function(response, status) {
            //$scope.status = status;
            responseObj = response;
            console.log((response));
        });
        return responseObj;
    }
});

function ShopCtrl ($scope, $http, $location, $routeParams, Requests) {
    $scope.category = "All";
    $scope.categories = ['All'];

    $scope.fetch = function() {
        $scope.product_list = Requests.getRequest('/', function(response) {
            console.log(response);
            $.each(response.categories, function(key, value) {
                $scope.categories.push(key);
            });
        });
    };

    $scope.fetch();

    //Sorting start
    var hash = { 'Lowest first': 'unit_price', 'Highest first': '-unit_price', 'Popular': ''};
    $scope.ordering = hash[$scope.sort];

    $scope.category_list = function (cat) {
        $location.url('/category/'+cat);
    };

    $scope.product_details = function(short_code) {
        $location.url('/product/'+short_code);
    };

    $scope.to_listing = function() {
        $location.url('/');
    };

    $scope.to_cart = function() {
        $location.url('/cart');
    }
}

function CtgCtrl ($scope, $location, $routeParams, Requests) {
    var cat = $routeParams.cat;
    console.log('Redirected');
    console.log(cat);
    console.log('/category/'+cat);
    if(cat === "All") {
//        $scope.product_list = Requests.getRequest('/');
        $location.url('/');
    }
    else{
        console.log('aefgbsfbgabCategory List');
//        console.log($scope.product_list);
        $scope.product_list = Requests.getRequest('/category/'+cat);
    }
}

function PdtCtrl ($scope, $location, $routeParams, Requests) {
    $scope.pdt = Requests.getRequest('/'+$routeParams.short_code);
    console.log('Details');

    $scope.add_cart = function(){
        console.log('Add Cart');
        console.log($scope.pdt.product_id);
        var data = { product_id: $scope.pdt.product_id };
        console.log('Data');
        console.log(data);
        console.log('Cart');
        $scope.cart =  Requests.postRequest('/cart/', data);
        $location.url('/cart');
    }
}

function CartCtrl($scope, $location, Requests) {
    $scope.cart = Requests.getRequest('/cart/');
    // $scope.view_cart = function(){
    //   $location.url('/cart');
    // }

    $scope.update_cart = function(quantity, product_id, remove){
        $scope.cart = Requests.postRequest('/update_amount/',
            { 'product_id': product_id,
                'remove_product': remove,
                'quantity': quantity
            }
        )
    };

    $scope.checkout = function(){
        window.location = "/checkout"
    }
}
