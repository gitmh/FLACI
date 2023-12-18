///////////////////////////////////////////////////////////////////////////////////////////////////
var app = null;
var user = null;
///////////////////////////////////////////////////////////////////////////////////////////////////
// global access theme colors
///////////////////////////////////////////////////////////////////////////////////////////////////
var themes = null;
function getThemeColor(palette, heu){
  if(!palette) palette = "primary"; // primary, accent, warn, background
  if(!heu) heu = "default"; // default, hue-1, hue-2, hue-3
  var v = themes._PALETTES[themes._THEMES.default.colors[palette].name][themes._THEMES.default.colors[palette].hues[heu]].value;
  return "rgb("+v.join(",")+")";
}

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

function copyToClipboard(elem) {
	  // create hidden text element, if it doesn't already exist
    var targetId = "_hiddenCopyText_";
    var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
    var origSelectionStart, origSelectionEnd;
    if (isInput) {
        // can just use the original source element for the selection and copy
        target = elem;
        origSelectionStart = elem.selectionStart;
        origSelectionEnd = elem.selectionEnd;
    } else {
        // must use a temporary form element for the selection and copy
        target = document.getElementById(targetId);
        if (!target) {
            var target = document.createElement("textarea");
            target.style.position = "absolute";
            target.style.left = "-9999px";
            target.style.top = "0";
            target.id = targetId;
            document.body.appendChild(target);
        }
        target.textContent = elem.textContent;
    }
    // select the content
    var currentFocus = document.activeElement;
    target.focus();
    target.setSelectionRange(0, target.value.length);
    
    // copy the selection
    var succeed;
    try {
    	  succeed = document.execCommand("copy");
    } catch(e) {
        succeed = false;
    }
    // restore original focus
    if (currentFocus && typeof currentFocus.focus === "function") {
        currentFocus.focus();
    }
    
    if (isInput) {
        // restore prior selection
        elem.setSelectionRange(origSelectionStart, origSelectionEnd);
    } else {
        // clear temporary content
        target.textContent = "";
    }
    return succeed;
}
Date.prototype.toMysqlFormat = function() {
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate()) + " " + 
           twoDigits(this.getHours()) + ":" + twoDigits(this.getMinutes()) + ":" + twoDigits(this.getSeconds());
};

// Prevent the backspace key from navigating back.
$(document).bind('keydown', function (event) {
    var doPrevent = false;
    if (event.keyCode === 8) {
        var d = event.srcElement || event.target;
        if ((d.tagName.toUpperCase() === 'INPUT' && 
             (
                 d.type.toUpperCase() === 'TEXT' ||
                 d.type.toUpperCase() === 'PASSWORD' || 
                 d.type.toUpperCase() === 'FILE' || 
                 d.type.toUpperCase() === 'SEARCH' || 
                 d.type.toUpperCase() === 'EMAIL' || 
                 d.type.toUpperCase() === 'NUMBER' || 
                 d.type.toUpperCase() === 'DATE' )
             ) || 
             d.tagName.toUpperCase() === 'TEXTAREA') {
            doPrevent = d.readOnly || d.disabled;
        }
        else {
            doPrevent = true;
        }
    }

    if (doPrevent) {
        event.preventDefault();
    }
});
///////////////////////////////////////////////////////////////////////////////////////////////////
(function(){
  moment.locale('de');

  app = angular.module('App', [ 'ngSanitize', 'ngRoute', 'ngMaterial','ng-fastclick','pascalprecht.translate','angular-loading-bar', 'ngMessages', 'as.sortable', 'ui.codemirror', 'infinite-scroll']); 

  app.config(['$translateProvider', function ($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: 'i18n/',
      suffix: '.json'
    });
    $translateProvider.useSanitizeValueStrategy(null);
    $translateProvider.forceAsyncReload(true);
    $translateProvider.fallbackLanguage("DE");
  }]);

  app.config(function($mdThemingProvider){
     $mdThemingProvider.theme('default')
     .backgroundPalette('grey', {
      'default': '200'
     })
     .primaryPalette('light-blue', {
      'default': '700', // by default use shade 500 from the pink palette for primary intentions
      'hue-1': '400', // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': '800'  // use shade 700 for the <code>md-hue-2</code> class
     })
     .accentPalette('amber', {
      'default': 'A700', // by default use shade 500 from the pink palete for primary intentions
      'hue-1': 'A100', // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': 'A200'  // use shade 700 for the <code>md-hue-2</code> class
     });
     themes = $mdThemingProvider;
  });

  app.config(['$httpProvider',
    function($httpProvider) {
      $httpProvider.defaults.useXDomain = true;
      $httpProvider.defaults.withCredentials = true;
      delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
  ]);

  app.config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/languages', {
      templateUrl: 'views/languages/languages.html',
      authenticate: false
     })
    .when('/regexp', {
      templateUrl: 'views/regexp/regexp.html',
      authenticate: false
     })
    .when('/tdiag', {
      templateUrl: 'views/tdiag/tdiag.html',
      authenticate: false
     })
    .when('/vcc', {
      templateUrl: 'views/vcc/vcc.html',
      authenticate: false
     })
    .when('/autoedit', {
      templateUrl: 'views/autoedit/autoedit.html',
      authenticate: false
     })
    .when('/kfgedit', {
      templateUrl: 'views/kfgedit/kfgedit.html',
      authenticate: false
     })
    .when('/flaci', {
      templateUrl: 'flaci.html',
      authenticate: false
     })
    .when('/about', {
      templateUrl: 'about.html',
      authenticate: false
     })
    .when('/book', {
      templateUrl: 'book.html',
      authenticate: false
     })
    .when('/A:automatonGUID', {
//      templateUrl: 'shareAutomaton.html',
      templateUrl: 'views/autoedit/autoedit.html',
      authenticate: false
     })
    .when('/G:grammarGUID', {
//      templateUrl: 'shareGrammar.html',
      templateUrl: 'views/kfgedit/kfgedit.html',
      authenticate: false
     })
    .when('/T:diagramGUID', {
//      templateUrl: 'shareDiagram.html',
      templateUrl: 'views/tdiag/tdiag.html',
      authenticate: false
     })
    .when('/resetPassword', {
      templateUrl: 'resetPassword.html',
      authenticate: false
     })
    .when('/', {
      templateUrl: 'flaci.html',
      authenticate: false
     })
    .when('/translate', {
      templateUrl: 'translate.html',
      authenticate: false
     })
    .otherwise({ redirectTo: '/' });
    // configure html5 to get links working on jsfiddle
    $locationProvider.html5Mode(false);
  });

  app.filter('encodeURIComponent', function() {
    return window.encodeURIComponent;
  });

  app.directive('draggable', function() {
    return {
      restrict: 'A',
      link: function(scope, elm, attrs) {
        var options = scope.$eval(attrs.draggable); //allow options to be passed in
        elm.draggable(options);
      }
    };
  });

  app.directive('scrollBottom', function () {
  return {
    scope: {
      scrollBottom: "="
    },
    link: function (scope, element) {
      scope.$watchCollection('scrollBottom', function (newValue) {
        if (newValue)
        {
          $(element).scrollTop($(element)[0].scrollHeight);
        }
      });
    }
  }
  });


  app.config(function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data|ftp|mailto|file|javascript):/);
  });

  app.factory('userLogin', ['$route', '$location','$mdDialog','$mdMedia','$http','$q','$translate',
   function ( $route, $location, $mdDialog, $mdMedia, $http, $q, $translate) {
    var self = {};
    self.user = null;
    self.isOfflineMode = true;
    self.isAdmin = false;
    self.isPublisher = false;
 
    var browserLang = navigator.language || navigator.userLanguage; 
    if(browserLang.length > 2) browserLang = browserLang[0]+browserLang[1];
    browserLang = browserLang.toUpperCase();
    if(browserLang != "EN" && browserLang != "DE") browserLang = "DE";
 
    self.language = localStorage.getItem("language") !== null ? localStorage.getItem("language") : browserLang; 

    self.changeLanguage = function(s){
      $translate.use(s);
      localStorage.setItem("language",s);
      self.language = s;
    };

    self.changeLanguage(self.language);

    self.resetPasswordEmail = getURLParam("email");
    self.resetPasswordSalt = getURLParam("GUID");
    self.resetPasswordPass1 = "";
    self.resetPasswordPass2 = "";
    self.resetPasswordError = "";

    self.resetPassword = function(ev){
      if(self.resetPasswordPass1 == "") return;
      if(self.resetPasswordPass2 == "") return;

      if(self.resetPasswordPass1 != self.resetPasswordPass2) {
        self.resetPasswordError = "PASSWORDSNOMATCH";
        return;
      }
      if(self.resetPasswordPass1.length < 5 ) {
        self.resetPasswordError = "PASSWORDTOOSHORT";
        return;
      }
      self.apiPost("resetPassword",{"salt":self.resetPasswordSalt,"email":self.resetPasswordEmail,"pass":self.resetPasswordPass1})
       .success(function(data){
         if(data.result == "OK"){
           self.loginUser(data.user,true); 
         }else{
           self.resetPasswordError = "ERRORS."+data.error;
         }
       });
    };

    self.apiPost = function (url, data){
      return $http({
        url: "api/"+url+".php",
        method: "POST",
        withCredentials : true,
        useXDomain : true,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        transformRequest: function(obj) {
          var str = [];
          for(var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
        },
        data: data
       });
    };

    self.loginUser = function(u,manual){
      self.user = u;
      localStorage.setItem("salt", u.Salt);
      localStorage.setItem("userid", u.ID);
      self.isAdmin = u.Admin == "1";
      self.isPublisher = u.Publisher == "1";
      self.isOfflineMode = false;
      if(manual) $route.reload(); //path("/flaci");
    };
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    self.autoLogin = function(){
      var deferred = $q.defer();
      deferred.promise.success = function(fn) {
        deferred.promise.then(fn);
        return deferred.promise;
      }

      deferred.promise.error = function(fn) {
        deferred.promise.then(null, fn);
        return deferred.promise;
      }
      if(localStorage.getItem("salt") && localStorage.getItem("userid")){
        // auto login with salt
        self.apiPost("loginUser",{"uid":localStorage.getItem("userid"), "salt":localStorage.getItem("salt")})
         .success(function(data) { 
           if(data.result == "OK") {
             self.loginUser(data.user,false); 
             deferred.resolve("OK");
           }else{
             $location.path("/");
             deferred.reject("FAILED");
           }
         })
         .error(function(){
           $location.path("/");
           deferred.reject("FAILED");
         });  
      }else{
        deferred.resolve("OFFLINE");
        //$location.path("/");
        //deferred.reject("FAILED");
      }
      return deferred.promise;  
    };
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    self.loginClick = function(ev){
      var deferred = $q.defer();
      deferred.promise.success = function(fn) {
        deferred.promise.then(fn);
        return deferred.promise;
      }

      deferred.promise.error = function(fn) {
        deferred.promise.then(null, fn);
        return deferred.promise;
      }

      $mdDialog.show({
        templateUrl: "views/login.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.error= "";
          $scope.email =  localStorage.getItem("email") ? localStorage.getItem("email") : '';
          $scope.pass = '';

          $scope.register = function(ev) {
            self.registerClick(ev);
          };
          $scope.forgot = function(ev) {
            self.forgotClick(ev);
          };
          $scope.hide = function() {
            // try login now
            if($scope.email && $scope.email != "") localStorage.setItem("email",$scope.email);
            if($scope.email == "") return;
            if($scope.pass == "") return;
            var ok = false;
            self.apiPost("loginUser",{ "email":$scope.email, "pass":$scope.pass})
             .success(function(data) {
               if(data.result == "FAILED"){
                 $scope.error = "ERRORS."+data.error;
               }
               if(data.result == "OK"){
                 self.loginUser(data.user,true);
                 $mdDialog.hide();
                 deferred.resolve("OK");
               }
             })
             .error(function(data, status, headers, config) {
                $scope.error = "ERRORS.SERVERERROR";
             });
          };

          $scope.cancel = function() {
            $mdDialog.cancel();
            deferred.reject("CANCELED");
          };
        }
      });
      return deferred.promise;  
    };
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    self.showAlert = function(title,text){
      var alert = $mdDialog.alert({title:title, htmlContent:text, ok:'OK'});
      $mdDialog.show(alert);
    };
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    self.forgotClick = function(ev){
      var deferred = $q.defer();
      deferred.promise.success = function(fn) {
        deferred.promise.then(fn);
        return deferred.promise;
      }

      deferred.promise.error = function(fn) {
        deferred.promise.then(null, fn);
        return deferred.promise;
      }

      $mdDialog.show({
        templateUrl: "views/forgot.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.error= "";
          $scope.email =  localStorage.getItem("email") ? localStorage.getItem("email") : '';

          $scope.hide = function() {
            // try send email now
            if($scope.email && $scope.email != "") localStorage.setItem("email",$scope.email) ;
            if($scope.email == "") return;

            if(!$scope.email.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/) ) {
              $scope.error = "ERRORS.INVALIDEMAIL";
              return;
            }
            var ok = false;
            self.apiPost("forgotPassword",{ "email":$scope.email})
             .success(function(data) {
               if(data.result == "FAILED"){
                 $scope.error = "ERRORS."+data.error; //"Zurücksetzen fehlgeschlagen";
                 deferred.reject("FAILED");
               }
               if(data.result == "OK"){
                 self.showAlert("Hinweis",$translate.instant("SENDCONFIRM"));
                 $mdDialog.hide();
                 deferred.resolve("OK");
               }
             })
             .error(function(data, status, headers, config) {
                $scope.error = "ERRORS.SERVERERROR";
                deferred.reject("FAILED");
             });
          };

          $scope.cancel = function() {
            $mdDialog.cancel();
            deferred.reject("CANCELED");
          };
        }
      });
      return deferred.promise;  
    };
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    self.registerClick = function(ev){
      var deferred = $q.defer();
      deferred.promise.success = function(fn) {
        deferred.promise.then(fn);
        return deferred.promise;
      }

      deferred.promise.error = function(fn) {
        deferred.promise.then(null, fn);
        return deferred.promise;
      }

      $mdDialog.show({
        templateUrl: "views/register.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.error= "";
          $scope.email =  localStorage.getItem("email") ? localStorage.getItem("email") : '';
          $scope.pass = '';
          $scope.pass2 = '';

          $scope.hide = function() {
            // try login now
            if($scope.email && $scope.email != "") localStorage.setItem("email",$scope.email) ;
            if($scope.email == "") return;
            if($scope.pass == "") return;
            if($scope.pass2 == "") return;
            if($scope.name == "") return;
            if($scope.surname == "") return;

            if($scope.pass != $scope.pass2) {
              $scope.error = "ERRORS.PASSWORDSNOMATCH";
              return;
            }
            if($scope.pass.length < 5 ) {
              $scope.error = "ERRORS.PASSWORDTOOSHORT";
              return;
            }
            if(!$scope.email.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/) ) {
              $scope.error = "ERRORS.INVALIDEMAIL";
              return;
            }
            var ok = false;
            self.apiPost("registerUser",{ "email":$scope.email, "pass":$scope.pass, "name":$scope.name, "surname":$scope.surname})
             .success(function(data) {
               if(data.result == "FAILED"){
                 $scope.error = "ERRORS."+data.error; //"Anmeldung fehlgeschlagen";
                 deferred.reject("FAILED");
               }
               if(data.result == "OK"){
                 self.loginUser(data.user,true);
                 $mdDialog.hide();
                 deferred.resolve("OK");
               }
             })
             .error(function(data, status, headers, config) {
                $scope.error = "ERRORS.SERVERERROR";
                deferred.reject("FAILED");
             });
          };

          $scope.cancel = function() {
            $mdDialog.cancel();
            deferred.reject("CANCELED");
          };
        }
      });
      return deferred.promise;  
    };
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    self.logoutClick = function(ev){
      var deferred = $q.defer();
      deferred.promise.success = function(fn) {
        deferred.promise.then(fn);
        return deferred.promise;
      }

      deferred.promise.error = function(fn) {
        deferred.promise.then(null, fn);
        return deferred.promise;
      }
      $mdDialog.show({
        templateUrl: "views/logout.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.email = self.user.Email; 
          $scope.surname = self.user.Surname; 
          $scope.name = self.user.Name; 
          $scope.pass0 = "";
          $scope.pass = "";
          $scope.pass2 = "";

          $scope.savePass = function(){
            if($scope.pass != $scope.pass2) {
              $scope.error = "ERRORS.PASSWORDSNOMATCH";
              return;
            }
            if($scope.pass.length < 5 ) {
              $scope.error = "ERRORS.PASSWORDTOOSHORT";
              return;
            }

            self.apiPost("updateUser",{"uid":self.user.ID,"salt":self.user.Salt,"newpass":$scope.pass,"oldpass":$scope.pass0})
             .success(function(data){
               if(data.result == "OK"){
                 $scope.changePassMode = false;
                 $scope.error = "";
                 self.user.Salt = data.Salt;
                 localStorage.setItem("salt", self.user.Salt);
               }else{
                 $scope.error = data.error;
               }
             });
          };
          $scope.saveProfile = function(){
            if($scope.name == "") return;
            if($scope.surname == "") return;
          
            self.apiPost("updateUser",{"uid":self.user.ID,"salt":self.user.Salt,"name":$scope.name,"surname":$scope.surname})
             .success(function(data){
               if(data.result == "OK"){
                 self.user.Name = $scope.name;
                 self.user.Surname = $scope.surname;
                 $scope.changeProfileMode = false;
                 $scope.error = "";
               }else{
                 $scope.error = data.error;
               }
             });

          };
          $scope.saveEmail = function(){

            if(!$scope.email.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/) ) {
              $scope.error = "ERRORS.INVALIDEMAIL";
              return;
            }

            self.apiPost("updateUser",{"uid":self.user.ID,"salt":self.user.Salt,"email":$scope.email})
             .success(function(data){
               if(data.result == "OK"){
                 self.user.Email = $scope.email;
                 $scope.changeEmailMode = false;
                 $scope.error = "";
               }else{
                 $scope.error = data.error;
               }
             });
          };
          
          $scope.logout = function() {
            // try logout now
            user = null;
            localStorage.removeItem ("salt");
            localStorage.removeItem ("userid");
            // clear local storage now
            localStorage.removeItem ("localTDiagrams");
            localStorage.removeItem ("localCompilers");
            localStorage.removeItem ("localGrammars");
            localStorage.removeItem ("localAutomatons");
    
            self.apiPost("logoutUser");
            self.isOfflineMode = true;
            self.user = null;
            self.diagrams = [];
            $mdDialog.hide();
            $route.reload();
      			deferred.resolve("OK");
          };
          $scope.cancel = function() {
            $mdDialog.cancel();
            deferred.reject("CANCELED");
          };
        }
      });
      return deferred.promise;  
    };

    return self;
  }]);

  app.run(['$rootScope', '$location', 'userLogin', function ($rootScope, $location, userLogin) {
    $rootScope.$on('$routeChangeStart', function (event, next) {
        if (next.authenticate && userLogin.user == null) {
            console.log('DENY');
            event.preventDefault();
            $location.path('/');
        }
    });
  }]);

  app.directive('ngRepeatComplete', function() {
    return function(scope, element, attrs) {
      if (scope.$last){
        scope.$eval(attrs.ngRepeatComplete);
      }
    };
  })

  app.directive('ngDraggable', function($document, $parse) {
   return {
    restrict: 'A',
    link: function(scope, elem, attr) {
      var startX, startY, x = 0, y = 0,
          start, stop, drag, clone;

      var width  = elem[0].offsetWidth,
          height = elem[0].offsetHeight;

      // Obtain drag options
      start  = attr.ngDragstart;
      drag   = attr.ngDragmove;
      stop   = attr.ngDragend;
      clone  = attr.ngDragclone;
      var mover;
      var moverStartX = 0;
      var moverStartY = 0;
    
      // Bind mousedown event
      elem.on('mousedown touchstart', function(e) {
        e.preventDefault();
        if(e.originalEvent) e = e.originalEvent;

        startX = Math.round(e.touches ? e.touches[0].clientX : e.clientX) - elem[0].offsetLeft;
        startY = Math.round(e.touches ? e.touches[0].clientY : e.clientY) - elem[0].offsetTop;
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);

        $document.on('touchmove', mousemove);
        $document.on('touchend', mouseup);
		if(clone){
          mover = angular.element('<div></div>');
          var b = elem[0].getBoundingClientRect();
          mover.css({
            position: 'absolute',
            top: b.top,
            left: b.left,
            width: b.width,
            cursor:'move',
            height: b.height,
            border: '2px dashed #eee',
            background: 'rgba(0,0,255,0.2)',
            zIndex: '100'
         });
         startX = b.width/2;// Math.round(e.touches ? e.touches[0].clientX : e.clientX);
         startY = b.height/2;
         var body = angular.element(document).find('body').eq(0);
         body.append(mover);

		}
        firstDrag = true;
        if(start) {
          var invoker = $parse(start);
          invoker(scope, {x:x, y:y, $event:e, drag:this});
        }
      });

      // Handle drag event
      var firstDrag = true;
      var lastX, lastY;
      function mousemove(e) {
        if(e.originalEvent) e = e.originalEvent;
        x = Math.round(e.touches ? e.touches[0].clientX : e.clientX) - startX;
        y = Math.round(e.touches ? e.touches[0].clientY : e.clientY) - startY;
        x = Math.round(x / 10) * 10;
        y = Math.round(y / 10) * 10;
        if(!firstDrag && (lastX != x || lastY != y)){
          setPosition();
          lastX = x;
          lastY = y;
          if (drag) {
            var invoker = $parse(drag);
            invoker(scope, {x:x, y:y, $event:e});
          }
        }
        if(firstDrag && (startX != x || startY != y)) {
          firstDrag = false;
          elem.addClass("dragging");
          if (drag) {
            var invoker = $parse(drag);
            invoker(scope, {x:x, y:y, $event:e});
          }
        }  
      }

      // Unbind drag events
      function mouseup(e) {
        if(e.originalEvent) e = e.originalEvent;
        $document.unbind('mousemove', mousemove);
        $document.unbind('mouseup', mouseup);
        $document.unbind('touchmove', mousemove);
        $document.unbind('touchend', mouseup);
        if (stop) {
          var invoker = $parse(stop);
          invoker(scope, {x:x, y:y, $event:e});
        }
        elem.removeClass("dragging");
		if(clone){
		  mover.remove();
		}
      }

      // Move element, within container if provided
      function setPosition() {
	    if(clone)
          mover.css({top: y + 'px',left:  x + 'px'}); else
          elem.css({top: y + 'px',left:  x + 'px'});
      }
    }
   }
  });

  app.directive('touchevents', function() {
    return {
     restrict: 'A',
     transclude: false,
     scope: false,
     link: function(scope, element, attrs){
          var touchDown = false;
          var wasMoved = false;
          var touchX = 0;
          var touchY = 0;
          var touchCX = 0;
          var touchCY = 0;
          var lastOverElement = null;

          element.on('touchstart', function(event){ 
            var p = event.originalEvent.touches[0];
            touchDown = true;
            if(attrs.ngMousedown) {
              event.stopPropagation();
              if(!attrs.touchpassdefault && !(event.target && event.target.nodeName == 'INPUT')) event.preventDefault();
              element.trigger($.Event("mousedown", {pageX:p.pageX, pageY:p.pageY})); 
            }
            touchX = p.pageX;
            touchY = p.pageY;
            touchCX = p.clientX;
            touchCY = p.clientY;
            wasMoved = false;
          });

          element.on('touchmove', function(event){ 
            var p = event.originalEvent.touches[0];
            if(Math.abs(touchX-p.pageX) > 5 || Math.abs(touchY-p.pageY) > 5) wasMoved = true;

            if(attrs.ngMousemove) {
              event.stopPropagation();
              if(!attrs.touchpassdefault) event.preventDefault();
              element.trigger($.Event("mousemove", {pageX:p.pageX, pageY:p.pageY}));
            }
            if(attrs.ngMouseover) {
              var e = document.elementFromPoint(p.clientX, p.clientY);
              if(lastOverElement != e){
                $(lastOverElement).trigger($.Event("mouseout"));
              }
              $(e).trigger($.Event("mouseover"));
              lastOverElement = e;
            }
          });

          element.on('touchend', function(event){ 
            if(touchDown && !wasMoved){
              event.stopPropagation();
              var e = document.elementFromPoint(touchCX, touchCY);
              $(e).trigger($.Event("click",{pageX:touchX, pageY:touchY}));
            }
            if(attrs.ngMouseup) {
              event.stopPropagation();
              if(!attrs.touchpassdefault) event.preventDefault();
              element.trigger($.Event("mouseup"));
            }
            wasMoved = false;
          });
    }}
  });

  app.config(function($animateProvider) {
    $animateProvider.classNameFilter(/ng-animate-enabled/);
  });

  app.controller('AppController', ['$scope', '$route', '$location', '$mdDialog', '$mdMedia', '$http', 'userLogin',"$translate", function ($scope, $route, $location, $mdDialog, $mdMedia, $http, userLogin, $translate) {
    var self = this;
    self.userLogin = userLogin;

    self.translations = {};
    self.translationLanguage = "DE";
    self.translationLanguages = ["DE","EN","FR","IT","NL","RU","PL","CZ"];

    self.getTranslation = function(lang){
      $http.get("i18n/"+lang+".json").then(function(res){
        self.translations[lang] = res.data;
      });
    };
    self.getTranslation("DE");
    
    self.saveTranslations = function(){
      $http.get("i18n/"+self.translationLanguage+".json").then(function(res){
       // find any new content from file
       for(var key in res.data){
         if(!self.translations[self.translationLanguage][key])  self.translations[self.translationLanguage][key] = res.data[key];
         if(!res.data[key].match){
           for(var key2 in res.data[key]){
             if(!self.translations[self.translationLanguage][key][key2]) 
                 self.translations[self.translationLanguage][key][key2] = res.data[key][key2];
             if(!res.data[key][key2].match){
               for(var key3 in res.data[key][key2]){
                 if(!self.translations[self.translationLanguage][key][key2][key3]) 
                     self.translations[self.translationLanguage][key][key2][key3] = res.data[key][key2][key3];
               }
             }
           }
         }
       }
       $http({
        url: "api/saveTranslations.php",
        method: "POST",
        withCredentials : true,
        useXDomain : true,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        transformRequest: function(obj) {
          var str = [];
          for(var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
        },
        data: {"JSON":angular.toJson(self.translations[self.translationLanguage]), "lang":self.translationLanguage}
       }).success(function(data){
         if(data.result != "OK") alert(data.error);
       });
      });
    };

    self.userLogin.autoLogin(); 

    self.theme = {primary:{
                      background:{'background-color':getThemeColor("primary")},
                      color:{'color':getThemeColor("primary")},

                      hue1:{
                        background:{'background-color':getThemeColor("primary","hue-1")},
                        color:{'color':getThemeColor("primary","hue-1")},
                      },
                      hue2:{
                        background:{'background-color':getThemeColor("primary","hue-2")},
                        color:{'color':getThemeColor("primary","hue-2")},
                      }

                    },
                    accent:{
                      background:{'background-color':getThemeColor("accent")},
                      color:{'color':getThemeColor("accent")},
           
                      hue1:{
                        background:{'background-color':getThemeColor("accent","hue-1")},
                        color:{'color':getThemeColor("accent","hue-1")},
                      },
                      hue2:{
                        background:{'background-color':getThemeColor("accent","hue-2")},
                        color:{'color':getThemeColor("accent","hue-2")},
                      }
                    } 
                   };


    self.showLogin = function($event){
      userLogin.loginClick($event).success(function(){$location.path('/flaci');});
    };
    self.showRegister = function($event){
      userLogin.registerClick($event).success(function(){$location.path('/flaci');});
    };
    self.goOffline = function($event){
      $location.path('/flaci');
    };
    self.goHome = function($event){
      $location.path('/');
    };
    self.openTDiag = function($event){
      $location.path('/tdiag');
    };
    self.openVCC = function($event){
      $location.path('/vcc');
    };
    self.openKfgEdit = function($event){
      $location.path('/kfgedit');
    };
    self.openAutoEdit = function($event){
      $location.path('/autoedit');
    };
    self.openLanguages = function($event){
      $location.path('/languages');
    };
    self.openRegExpEdit = function($event){
      $location.path('/regexp');
    };
    self.openAbout = function($event){
      $location.path('/about');
    };
    self.openBook = function($event){
      $location.path('/book');
    };

  }]);



})();

var waitOneSecondArray = [];
var waitOneSecondArrayTimes = [];
var waitOneSecondArrayTimer = [];

function waitOneSecond(f,time){
  if(waitOneSecondArray.indexOf(f) == -1) waitOneSecondArray.push(f);
  var i = waitOneSecondArray.indexOf(f);
  waitOneSecondArrayTimes[i] = time ? time : 1000;
  waitOneSecondArrayTimer[i] = 0;
}
window.setInterval(function(){
  for(var i=0; i < waitOneSecondArrayTimer.length; i++) {
    waitOneSecondArrayTimer[i]++;
    if(waitOneSecondArrayTimer[i]*200 > waitOneSecondArrayTimes[i]) {
      var f = waitOneSecondArray[i];
      // remove it now
      waitOneSecondArray.splice(i,1);
      waitOneSecondArrayTimer.splice(i,1);
      waitOneSecondArrayTimes.splice(i,1);
      // call it
      f();
    }
  }
},200);


function getURLParam(strParamName){
 var strReturn = "";
 strParamName = strParamName.toLowerCase();
 var strHref = window.location.href;
 if ( strHref.indexOf("?") > -1 ){
  var strQueryString = strHref.substr(strHref.indexOf("?")+1);
  var a = strQueryString.split("&");
  for ( var i = 0; i < a.length; i++ ){
   var b = a[i].split("=");
   if (b[0].toLowerCase() == strParamName){
    strReturn = b[1];
    break;
   }
  }
 }
 return strReturn;
}


function trimEmptyHash(url) {
  return url ? url.replace(/(#.+)|#$/, '$1') : "";
}

