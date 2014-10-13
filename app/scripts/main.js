/* global angular:false */
/*jshint camelcase: true */

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


//App JS starts here.
var app = angular.module('shop', ['ngRoute']);
var variants_list = [];
var attributes;

app.directive('scalable', function() {
    'use strict';
    return {
        link: function(scope, element) {
            element.bind('load', function() {
                var iw = element[0].naturalWidth;
                var ih = element[0].naturalHeight;
                var cw = element.parent()[0].clientWidth;
                var ch = element.parent()[0].clientHeight;

                var pw = iw*ch/ih;

                if (iw > cw && ih > ch) {
                    element.addClass(pw > cw ? 'cropWidth': 'cropHeight');
                }
            });
        }
    };
});

app.directive('hoverlift', function() {
    'use strict';
    return {
        link: function(scope, element) {
            element.bind('mouseenter', function() {
                element.find('paper-shadow').attr('z', '1');
            });
            element.bind('mouseleave', function() {
                element.find('paper-shadow').attr('z', '0');
            });
        }
    };
});

app.run(function($http) {
    'use strict';
    $http.defaults.headers.common['Accept-Encodings'] = 'json';
});

app.filter('charges', function() {
    'use strict';
    return function(input) {
        return input.kind==='percentage'? input.price.toString() + '%' : '₹' + input.price.toString();
    };
});

app.service('Requests', function($http) {
    'use strict';
    this.get = function(url, data, success) { $http.get(url, {'params': data}).success(success); };
    this.post = function (url, data, success) { $http.post(url, data).success(success); };
});

app.controller('HomeCtrl', function ($scope, $rootScope, Requests) {
    'use strict';
    $scope.categories = [];
    $scope.active = {category: null, view: 'list', loading: false};

    Requests.get('/general_details', {merchant: $rootScope.merchant.id}, function(response) {
        $scope.merchant = response;
        angular.forEach(response.categories, function(value, key) {
          this.push(value[0]);
        }, $scope.categories);
    });

    $scope.categoryList = function (cat) {
        $rootScope.$broadcast('categorySet', {category: cat});
    };

    $scope.track_order = function() {
        window.location = '/'+$scope.code;
//        Requests.get('/' + $scope.code,{}, function(response) {
//            console.log(response);
//            $rootScope.$broadcast('trackSet', {ord_details: response});
//        });
    };

    $scope.goToCart = function() {
        var url = 'http://';
        if ($rootScope.merchant.customDomain.trim() !== '') {
            url += $rootScope.merchant.customDomain.trim() + '/';
        }
        else {
            url += $rootScope.merchant.shortCode.trim() + '.kyash.com/';
        }
        url += 'cart/?cart_id=' + $rootScope.cartId;

        if($rootScope.isFBStore) {
            window.open(url);
        }
        else {
            window.location = url;
        }
    };

    $scope.reload = function() {
        window.location = '/';
    };
});

app.controller('CtgCtrl', function ($scope, $rootScope, Requests) {
    'use strict';

    $scope.refreshProductList = function(category) {
        $scope.active.loading = true;
        if($scope.active.category === category) {
            $scope.active.view = 'list';
            document.body.scrollTop = document.documentElement.scrollTop = 0;
            $scope.active.loading = false;
        }
        else {
            Requests.get('/category/' + category, {merchant: $rootScope.merchant.id}, function (data) {
                $scope.productList = data.products;
                $scope.attributes = data.attributes;
                $scope.active.category = category;
                $scope.active.view = 'list';
                document.body.scrollTop = document.documentElement.scrollTop = 0;
                $scope.active.loading = false;
            });
        }
    };

    if($scope.active.category === null) {
        $scope.refreshProductList('Featured');
    }

    $scope.$on('categorySet', function(event, args) {
        $scope.refreshProductList(args.category);
    });

    $scope.showProduct = function(product, attributes) {
        $rootScope.$broadcast('productSet', {product: product, attributes: attributes});
    };
});

app.controller('PdtCtrl', function ($scope, $rootScope, Requests) {
    'use strict';

//    var variants_list = [];
    $scope.$on('productSet', function(event, args) {
        var product = $scope.product = args.product;
        attributes = $scope.attributes = args.attributes;

        //TODO Default variant must be added
        Requests.get('/product_variants', {'prod_id': args.product.id}, function(data){
            $scope.variants = variants_list = data.variants;
            if(data.variants) {
                var attributes_shown = {};
                variants_list.forEach(function(variant) {
                    for(var key in variant) {
                        if (variant.hasOwnProperty(key)) {
                            console.log(key in attributes_shown);
                            if (!(key in attributes_shown)) {
                                attributes_shown[key] = {};
                                console.log(attributes_shown[key], variant[key]);
                            }
                            attributes_shown[key][variant[key]] = true;
                        }
                    }
                    console.log(Object.keys(attributes_shown))
                });
                console.log(attributes_shown);
            }
        });

        var selected_var = null;

        var available_options = {};

        /*jshint camelcase: false */
        $scope.isPurchasable = args.product.units_available > 0 && args.product.unit_price > 0;
        $scope.active.view = 'product';
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    });

    $scope.isFreeshipping = function(product) {
        /*jshint camelcase: false */
        return $rootScope.policy.free_shipping_min_order <= product.unit_price;
    };

    $scope.isCOD = function(product) {
        var policy = $rootScope.policy;
        /*jshint camelcase: false */
        return policy.has_cod && policy.min_amount_cod <= product.unit_price && policy.max_amount_cod >= product.unit_price;
    };

    $scope.addCart = function() {
        $scope.active.loading = true;
        Requests.post('/cart/', {
            'product_id': $scope.product.id,
            merchant: $rootScope.merchant.id}, function(response) {

            $scope.cart = response;
            /*jshint camelcase: false */
            $rootScope.cartId = response.cart_id;
            $rootScope.cartItemCount = response.cart_item_count;
            $rootScope.goToCart();
            $scope.active.loading = false;
        });
    };

//    available_options = {
//        varient_attribute1: {option1, option2, option3, ...},
//        varient_attribute2: {option1, option2, ...},
//    }
//
    var active_filters = {
//        varient_attrbute1: option2,
//        varient_attribute2: option5,
    }

    function filter(varient){
    //For all keys in active_filter, check if corresponding key in the varient has the same value. If yes return true, else return false.
    }

    function set_status_and_varient() {
        var shortlist = varients_list.filter(filter);
        // add 'selectable' class to all the options in the shortlist varients list.

        // add 'active' class to the options in the first varient of the shortlist

        var selected_varient = shortlist[0];
        // prices will be automatically updated by angularjs data binding.
    }

    $scope.vattr_click = function() {
        set_status_and_varient();
    }
});

app.controller('TrackCtrl', function ($scope, $rootScope, Requests) {
    'use strict';

    $scope.$on('trackSet', function(event, args) {
        $scope.odetails = args.ord_details;
        $scope.active.view = 'odetails';
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    });


});
