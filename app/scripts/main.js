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

  //var navdrawerContainer = querySelector('.pure-menu');
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
    $scope.moreCategories = [];
    $scope.active = {category: null, view: 'list', loading: false};

    Requests.get('/general_details', {merchant: $rootScope.merchant.id}, function(response) {
        $scope.merchant = response;
        $scope.attributes = response.attributes;
        $scope.other_attributes = response.other_attributes;
        angular.forEach(response.categories, function(value, key) {
          if($scope.categories.length < 5)
            this.push(value[0]);
          else
            $scope.moreCategories.push(value[0]);
        }, $scope.categories);
    });

    $scope.categoryList = function (cat) {
        $rootScope.$broadcast('categorySet', {category: cat});
    };

    $scope.trackOrder = function() {
        window.location = '/'+$scope.code;
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

    $scope.showProduct = function(product) {
        $rootScope.$broadcast('productSet', {product: product});
    };
});

app.controller('PdtCtrl', function ($scope, $rootScope, Requests) {
    'use strict';

    function hash(obj) {
        return JSON.stringify(obj);
    }

    $scope.activeFilters = {};
    $scope.checkColorRegEx = function(value) {
        var regexp = /^#([0-9a-f]{3}){1,2}$/i;
        return value.match(regexp) != null;
    };

    $scope.$on('productSet', function(event, args) {
        var product = $scope.product = args.product;
        var variantsList = $scope.variantsList = [];
        var other_attributes = [].concat($scope.other_attributes, 'unit_price', 'units_available');
        $scope.fullAttributes = $scope.selectedVariant = {};
        $scope.imageUrl = product.photo[0];

        Requests.get('/product_variants', {id: args.product.id}, function(data) {
            if(data.variants) {
                var defaultVariant = {};

                other_attributes.forEach(function(attribute) {
                    defaultVariant[attribute] = product[attribute];
                });

                variantsList.push(defaultVariant);
                variantsList.push.apply(variantsList, data.variants);

                variantsList.forEach(function(variant) {
                    var variantName;
                    Object.keys(variant).forEach(function(key) {
                        if (key === 'units_available' || key === 'unit_price') return;

                        if (!(key in $scope.fullAttributes)) {
                            $scope.fullAttributes[key] = {};
                        }

                        if(typeof variant[key] === 'object') variantName = variant[key]['colorhex'] || variant[key]['price'];
                        else variantName = variant[key];

                        $scope.fullAttributes[key][hash(variant[key])] = {caption: variantName, active: false, selectable: true, filtered: false};
                    });
                });

                setStatusAndVariant();
            }
        });

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

    function filter(variant) {
        var matches = true;

        Object.keys($scope.activeFilters).every( function(key) {
            if (hash(variant[key]) !== $scope.activeFilters[key]) { matches = false;  return false;}
        });
        return matches;
    }

    function setData(attributeName, option, data) {
        if(attributeName) {
            angular.extend($scope.fullAttributes[attributeName][option], data);
        }
        else {
            Object.keys($scope.fullAttributes).forEach( function(name) {
                Object.keys($scope.fullAttributes[name]).forEach( function(value) {
                    angular.extend($scope.fullAttributes[name][value], data);
                });
            });
        }
    }

    function setStatusAndVariant() {
        var shortlist = $scope.variantsList.filter(filter);

        // Reset classes for all options.
        setData(null, null, {active: false, selectable: false});

        // add 'selectable' class to all the options in the shortlist variants list.
        for(var i=0; i < shortlist.length; i++) {
            Object.keys(shortlist[i]).forEach( function(attribute) {
                if (attribute === 'unit_price' || attribute === 'units_available') return;

                if (i==0) setData(attribute, hash(shortlist[0][attribute]), {active: true});

                setData(attribute, hash(shortlist[i][attribute]), {selectable: true});
            });
        }

        $scope.selectedVariant = shortlist[0];
    }

    $scope.filterToggle = function(variantAttr, option) {
        if($scope.fullAttributes[variantAttr][option]['selectable']) {
            if ($scope.activeFilters[variantAttr] === option) {
                delete $scope.activeFilters[variantAttr];
                setData(variantAttr, option, {filtered: false});
            }
            else {
                if (variantAttr in $scope.activeFilters) {
                    setData(variantAttr, $scope.activeFilters[variantAttr], {filtered: false});
                }
                $scope.activeFilters[variantAttr] = option;
                setData(variantAttr, option, {filtered: true});
            }
        }
        else {
            Object.keys($scope.activeFilters).forEach(function(key) {
                setData(key, $scope.activeFilters[key], {filtered: false});
                delete $scope.activeFilters[key];
            });
            $scope.activeFilters[variantAttr] = option;
            setData(variantAttr, option, {filtered: true});
        }
        setStatusAndVariant();
    };
});
