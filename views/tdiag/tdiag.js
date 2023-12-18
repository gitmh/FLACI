  app.controller('TDiagController', function($scope, $location, $routeParams, $timeout, $interval, $mdDialog, $http, $mdMedia, $mdSidenav, $sce, $q, userLogin, $translate, $window) { 

    var apiPost = function (url, data){
      if(userLogin.isOfflineMode && data.needsOnline != 1){
        // localStorage offline mode
        var deferred = $q.defer();
        deferred.promise.error = function(fn){ };
        deferred.promise.success = function (fn) {
          var result = {'result':'OK'};
          if(url == "createCompiler"){
            var d = localStorage.getItem("localCompilers");
            var compilers = JSON.parse(d ? d : "[]"); // default is array here
            var a = {ID:"local"+Math.ceil(Math.random()*99999999), Name:data.name, "Type":data.type, "InputLanguage":data.input, "Generator":data.generator, "OutputLanguage":data.output, "LastInput":data.LastInput ? data.LastInput : "", JSCode:data.jscode ? data.jscode : "", JSON: data.JSON ? data.JSON : '{"lex":{"rules":[{"name":"IGNORE","expression":""}]}, "bnf":[{"name":"Start","rhs":[[[],""]]}]}', Changed : (new Date()).toMysqlFormat()};
            compilers.push(a);
            result.compiler = a;    
            localStorage.setItem("localCompilers",angular.toJson(compilers));
          }
          if(url == "saveCompiler"){
            var d = localStorage.getItem("localCompilers");
            var compilers = JSON.parse(d ? d : "[]"); // default is array here
            for(var i=0; i < compilers.length; i++){
              if(compilers[i].ID == data.id){
                compilers[i].Name = data.name;
                if(data.JSON) compilers[i].JSON = data.JSON;
                if(data.input) compilers[i].InputLanguage = data.input;
                if(data.output) compilers[i].OutputLanguage = data.output ? data.output : "";
                if(data.generator) compilers[i].Generator = data.generator;
                if(data.JSCode) compilers[i].codeParser = data.JSCode;
                if(data.lastinput) compilers[i].LastInput = data.lastinput;
                compilers[i].Changed = (new Date()).toMysqlFormat();
                result.compiler = compilers[i];
              } 
            }
            localStorage.setItem("localCompilers",angular.toJson(compilers));
          }
          if(url == "deleteCompiler"){
            var d = localStorage.getItem("localCompilers");
            var compilers = JSON.parse(d ? d : "[]"); // default is array here
            for(var i=0; i < compilers.length; i++){
              if(compilers[i].ID == data.id){
                compilers.splice(i,1);
                break;
              } 
            }
            localStorage.setItem("localCompilers",angular.toJson(compilers));
          }

          if(url == "getTDiagrams"){
            var d = localStorage.getItem("localTDiagrams");
            result.diagrams = JSON.parse(d ? d : "[]"); // default is array here
            result.diagrams.sort(function(a,b){ return a.Changed < b.Changed ? 1 : a.Changed > b.Changed ? -1 : 0;  });
          }
          if(url == "createTDiagram"){
            var d = localStorage.getItem("localTDiagrams");
            var diagrams = JSON.parse(d ? d : "[]"); // default is array here
            var a = {ID:"local"+diagrams.length, Name:data.name, Description:data.description, JSON:data.JSON ? data.JSON : '[]', Changed : (new Date()).toMysqlFormat(),"CreatedFrom":data.CreatedFrom ? data.CreatedFrom : ''};
            diagrams.push(a);
            result.diagram = a;
            localStorage.setItem("localTDiagrams",angular.toJson(diagrams));
          }
          if(url == "saveTDiagram"){
            var d = localStorage.getItem("localTDiagrams");
            var diagrams = JSON.parse(d ? d : "[]"); // default is array here
            for(var i=0; i < diagrams.length; i++){
              if(diagrams[i].ID == data.id){
                diagrams[i].Name = data.name;
                if(data.description)
                  diagrams[i].Description = data.description;
                diagrams[i].JSON = data.JSON;
                diagrams[i].Changed = (new Date()).toMysqlFormat();
                result.diagram = diagrams[i];
              } 
            }
            localStorage.setItem("localTDiagrams",angular.toJson(diagrams));
          }
          if(url == "deleteTDiagram"){
            var d = localStorage.getItem("localTDiagrams");
            var diagrams = JSON.parse(d ? d : "[]"); // default is array here
            for(var i=0; i < diagrams.length; i++){
              if(diagrams[i].ID == data.id){
                diagrams.splice(i,1);
                break;
              } 
            }
            localStorage.setItem("localTDiagrams",angular.toJson(diagrams));
          }

          if(url == "getGrammars"){
            var d = localStorage.getItem("localGrammars");
            result.grammars = JSON.parse(d ? d : "[]"); // default is array here
            result.grammars.sort(function(a,b){ return a.Changed < b.Changed ? 1 : a.Changed > b.Changed ? -1 : 0; });
          }
          fn(result); 
          return deferred.promise;
        };

        return deferred.promise;  
      }else
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

    var self = this;
    var tdiag = self;
    self.user = null;
    self.openTabs = [];
    self.diagrams = [];
    self.compilers = [];

    for(var i=0; i < predefinedCompilers.length; i++) 
      self.compilers.push(JSON.parse(angular.toJson(predefinedCompilers[i])));   

    self.loadCompilersFromLocalStorage = function(){
      if(localStorage.getItem("localCompilers")){
        var d = localStorage.getItem("localCompilers");
        var compilers = JSON.parse(d ? d : "[]"); // default is array here
        for(var i=0; i < compilers.length; i++){
          var found = false;
          for(var z=0; z < self.compilers.length; z++){
            if(self.compilers[z].ID == compilers[i].ID) { self.compilers[z] = compilers[i]; found = true; break; }
          }
          if(!found) self.compilers.push(compilers[i]);
        }
      }
    };

    self.$location = $location;
    self.$mdMedia = $mdMedia;
    self.$sce = $sce;
    self.userLogin = userLogin;

    self.toHTML = function(s) {
      return $sce.trustAsHtml(s.replace(/\n/g,"<br>"));
    };


    self.userLogin.autoLogin().success(function(){ self.loadFromServer(); }); 

    self.refreshCodemirror = function(){
      // Refresh CodeMirror
      $('.CodeMirror').each(function(i, el){
        $timeout(function(){el.CodeMirror.refresh();},10);
      });
    };

    $scope.updateSavedJSON = function(a,json){
      for(var i=0; i < self.diagrams.length; i++){
        if(self.diagrams[i].ID == a.ID) self.diagrams[i].JSON = json;
      }
    };


    self.updateCompilerCache = function(c){
      if(!c) return;
      for(var i=0; i < self.compilers.length; i++)
        if(self.compilers[i].ID == c.ID){
          self.compilers[i] = c;
          return;
        }
      self.compilers.push(c);
    };

    self.getCompilerFromServer = function(element){
      var deferred = $q.defer();
      var done = false;
      if(element.source == ""){
        deferred.reject(); 
        return deferred.promise; 
      }

      self.loadCompilersFromLocalStorage();

      for(var i=0; i < self.compilers.length; i++)
        if(self.compilers[i].ID == element.source){
          deferred.resolve(self.compilers[i]);
          done = true;
          break;
        }
      
      if(!done){
        apiPost("getCompiler",{"id":element.source,"needsOnline":true}).success(function(data){
          if(data.result == "OK"){
            self.compilers.push(data.compiler);
            deferred.resolve(data.compiler);
          }else{
            deferred.reject();
          }
        }).error(function(){ deferred.reject(); });
      }
      return deferred.promise; 
    };

    ////////////////////////////////////////////////////////////////////////////////
    // Main model class for Diagram
    ////////////////////////////////////////////////////////////////////////////////
    self.copyCompilerURLToClipboard = function(e,d,ev){
      copyToClipboard(document.getElementById(e));
      self.showAlert($translate.instant("TDIAG.COPYCOMPILERURLSUCCESS"),"",ev);
    };

    self.showAlert = function(text,title,event){
      var alert = $mdDialog.alert({title:title?title:$translate.instant("HINT"), htmlContent:text, ok:$translate.instant("OK")});
      if(event) alert.targetEvent(event);
      $mdDialog.show(alert);
    };

    function ADiagram (d){
      var self = this;
      self.gridSize = 50;
      self.elements = [];
      self.Name = d.Name;
      self.ID = d.ID;
      self.GUID = d.GUID;
      
      self.history = []; // for undo and save
      self.historyPointer = 0;
      self.isSavedToServer = false;

      self.currentSelected = [];
      self.dragginStartSelected = false;
      self.newElement = null;
      self.isComponentSidebarOpen = false;

      self.showAlert = function(text,title,event){
        parent.showAlert(text,title,event);
      };

      self.updateCompiler = function(c){
        if(c.preset) return;

        if(c.written != "TDL" && c.source != "")  {
          self.makeUndoStep();
          c.source = "";
        }
        for(var i=0; i < tdiag.compilers.length; i++)
          if(tdiag.compilers[i].ID == c.source){
            var changed = false;
            if(tdiag.compilers[i].Name != c.name){
              tdiag.compilers[i].Name = c.name;
              changed = true;
            }
            if(tdiag.compilers[i].InputLanguage != c.input){
              tdiag.compilers[i].InputLanguage = c.input;
              changed = true;
            }
            if(tdiag.compilers[i].OutputLanguage != c.output){
              tdiag.compilers[i].OutputLanguage = c.output;
              changed = true;
            }
            if(tdiag.compilers[i].Generator != c.generator){
              tdiag.compilers[i].Generator = c.generator;
              changed = true;
            }

            if(changed)
              apiPost("saveCompiler",{id:tdiag.compilers[i].ID, name:c.name, input:c.input, output:c.output, generator:c.generator});
            break;
          }
      };

      self.toJSON = function(){
        var s = angular.toJson(self.elements);
        // clear temp data from json
        var t = JSON.parse(s);
        for(var i=0; i < t.length; i++){
          delete t[i].startX;
          delete t[i].startY;
          delete t[i].zIndex;
          // clear generated code, regenerate next time
          if(t[i].type == "compiler" && (t[i].dockedBottomLeft || t[i].written == "TDL")) t[i].code = ""; 
          if(t[i].type == "interpreter" && (t[i].dockedBottomLeft || t[i].written == "TDL")) t[i].code = ""; 
          if(t[i].type == "program" && t[i].dockedBottomLeft) t[i].code = ""; 
          if(t[i].type == "ea" && t[i].dockedLeft) t[i].code = ""; 
        }

        return angular.toJson(t);
      };

      self.createCompiler = function(Name,Type,Input,Output,Generator){
        var deferred = $q.defer();
        apiPost("createCompiler",{"name":Name, "type":Type, "input":Input, "output":Output, "generator":Generator})
         .success(function(data) {
          if(data.result == "FAILED"){
            self.showAlert($translate.instant("ERRORS.SERVERERROR"));
          }
          if(data.result == "OK"){
            deferred.resolve(data.compiler);
          }
         })
         .error(function(data, status, headers, config) {
            self.showAlert($translate.instant("ERRORS.SERVERERROR"));
         });
        return deferred.promise;  
      };

      self.openCompiler = function(e,ev){
        tdiag.getCompilerFromServer(e).then(function(c){
          $mdDialog.show({
            templateUrl: "views/tdiag/vcc.html",
            targetEvent: ev,
        
            clickOutsideToClose: false,
            controller: function ($scope, $mdDialog) {
              $scope.c = new ACompiler(c);
              $scope.self = self;
              $timeout(function(){$scope.c.buildParser();},10);
              $timeout(function(){tdiag.refreshCodemirror();},1000);
              $scope.cancel = function() {
                $scope.c.saveToServer();
                $mdDialog.cancel();
              };
            }
          });

        },function(){
          // compiler does not exist yet, create and open it
          self.createCompiler(e.name,e.type,e.input,e.output,e.generator).then(function(c){ 
            e.source = c.ID; 
            self.openCompiler(e,ev); 
          });
        });
      };

      self.isCodeDefined = function(e){
        if(e.type == "compiler" && e.written == "JS" && !e.preset && (!e.code || e.code == "")) return false;
        if(e.type == "interpreter" && e.written == "JS" && !e.preset && (!e.code || e.code == "")) return false;
        if(e.source && e.source != "") return true;
        if(e.code && e.code != "") return true;
        return false;
      };

      self.isSelected = function(e){
        for(var i=0; i < self.currentSelected.length; i++)
        if(self.currentSelected[i].id == e.id) return true;
        return false;
      };

      self.getHTMLElement = function(id){
        return $("#d"+self.ID+"_"+id);
      };

      self.refreshDiagram = function(){
        self.redrawDiagram();
        $timeout(function(){ self.redrawDiagram(); },1);
      };

      self.highlightRunElement = function(e){
        var d = self.getHTMLElement(e.id);
        $(".shapeblock",d).each(function(i,e){
          if($(e).hasClass("triangle")){
            //$("div",e).effect("highlight",{"border-top-color": 'rgb(25,118,210)'}, 500);
          }else{
            $(e).effect("highlight",{color: 'rgb(25,118,210)'}, 500);
          }
        });
      };

      self.bringToFront = function(e,add){
        var is = e.zIndex;  
        while(is > self.elements.length) is--;
        for(var i=0; i < self.elements.length; i++){
          if(self.elements[i].zIndex > is) self.elements[i].zIndex--;
        }
        e.zIndex = self.elements.length+(add ? add : 0);
        self.refreshDiagram();
      };

      self.selectElement = function(e){
        function recSelect(element){
          self.currentSelected.push(element);
          if(element.dockedTop) {
            var d = self.getElementByID(element.dockedTop);
            if(!self.isSelected(d)) recSelect(d);
          }  
          if(element.dockedLeft) {
            var d = self.getElementByID(element.dockedLeft);
            if(!self.isSelected(d)) recSelect(d);
          }  
          if(element.dockedRight) {
            var d = self.getElementByID(element.dockedRight);
            if(!self.isSelected(d)) recSelect(d);
          }  
          if(element.dockedBottom) {
            var d = self.getElementByID(element.dockedBottom);
            if(!self.isSelected(d)) recSelect(d);
          }  
          if(element.dockedBottomLeft) {
            var d = self.getElementByID(element.dockedBottomLeft);
            if(!self.isSelected(d)) recSelect(d);
          }  
          if(element.dockedBottomRight) {
            var d = self.getElementByID(element.dockedBottomRight);
            if(!self.isSelected(d)) recSelect(d);
          }  
        }

        if(self.currentSelected.length == 1 &&  self.currentSelected[0].id == e.id) { 
          // select all
          if(self.currentSelected[0].type == "comment"){
            self.currentSelected = [];
            for(var i=0; i < self.elements.length; i++)
              if(self.elements[i].type == "comment") self.currentSelected.push(self.elements[i]);
          }else{
            self.currentSelected = [];
            recSelect(e);
          }
          for(var i=0; i < self.currentSelected.length; i++)
            self.bringToFront(self.currentSelected[i]); 
          return; 
        }

        self.currentSelected = [e];
        self.bringToFront(e,+1); 
      };

      self.unselectElement = function(){
        self.currentSelected = [];
      };

      self.reconnectElements = function(){
        for(var i=0; i < self.elements.length; i++){
          var e = self.elements[i];
          e.dockedTop = null;
          e.dockedLeft = null;
          e.dockedRight = null;
          e.dockedBottom = null;
          e.dockedBottomLeft = null;
          e.dockedBottomRight = null;
        }
        // build all matching docks
        for(var i=0; i < self.elements.length; i++){
          var e = self.elements[i];
/*
          if(e.type == "compiler"){
            for(var z=0; z < self.elements.length; z++){
              var e2 = self.elements[z];
              if(e2.type == "compiler"){
                // T -> T
                if(e2.x == e.x +3*self.gridSize && e2.y == e.y)
                  if(e2.output != "" && (e2.input == e.output || e2 == self.newElement)){
                    e2.input = e.output;
                    e2.dockedLeft = e.id;
                    e.dockedRight = e2.id;
                  }
                if(e2.x == e.x +3*self.gridSize && e2.y == e.y)
                  if(e.output != "" && (e2.input == e.output || (e == self.newElement && !e.dockedLeft))){
                    e.output = e2.input;
                    e2.dockedLeft = e.id;
                    e.dockedRight = e2.id;
                  }
              }
            }       
          }
*/
          if(e.type == "program"){
            for(var z=self.elements.length-1; z > -1; z--){
              var e2 = self.elements[z];
              if(e2.type == "compiler"){
                if(e2.output != "" &&
                   e2.x == e.x - 3*self.gridSize &&
                   e2.y == e.y + self.gridSize)
                  if((e2.output != "" && (e2.written == "JS")) && (e2.output == e.written || e == self.newElement))
                  if(!e.dockedBottomLeft){
                    //e.written = e2.output; 
                    e2.dockedRight = e.id;
                    e.dockedBottomLeft = e2.id;
                  }
                if(e2.x == e.x + self.gridSize &&
                   e2.y == e.y + self.gridSize)
                  if(e2.input == e.written || e == self.newElement)
                  if(!e.dockedBottomRight){
                    //e.written = e2.input; 
                    e2.dockedLeft = e.id;
                    e.dockedBottomRight = e2.id;
                  }
                if(e2.x == e.x - 3*self.gridSize &&
                   e2.y == e.y + self.gridSize)
                  if((e2.output != "" && (e2.written == "JS")) && (e2.output == e.written || e2 == self.newElement))
                  if(!e.dockedBottomRight){
                    //e2.output = e.written; 
                    e2.dockedRight = e.id;
                    e.dockedBottomLeft = e2.id;
                  }
                if(e2.x == e.x + self.gridSize &&
                   e2.y == e.y + self.gridSize)
                  if(e2.input == e.written || e2 == self.newElement)
                  if(!e.dockedBottomRight && !e.dockedBottomLeft){
                    //e2.input = e.written; 
                    e2.dockedLeft = e.id;
                    e.dockedBottomRight = e2.id;
                  }
              }
            }
          }
        }      
        // build all matching compiler compiler docks
        for(var i=0; i < self.elements.length; i++){
          var e = self.elements[i];
          if(e.type == "compiler"){
            for(var z=0; z < self.elements.length; z++){
              var e2 = self.elements[z];
              if(e2.type == "compiler"){
                if((e2.x == e.x -2*self.gridSize && e2.y == e.y - self.gridSize))
                  if(e2.written == e.input || e2 == self.newElement){
                    //e2.written = e.input;
                    e2.dockedBottomRight = e.id;
                    e.dockedLeft = e2.id;
                  }
                if((e2.x == e.x +2*self.gridSize && e2.y == e.y - self.gridSize))
                  if(e.output != "" && (e2.written == e.output || e2 == self.newElement)){
                    //e2.written = e.output;
                    e2.dockedBottomLeft = e.id;
                    e.dockedRight = e2.id;
                  }
              } 

              if(e2.type == "interpreter"){
                if((e2.x == e.x -1*self.gridSize && e2.y == e.y - 2*self.gridSize))
                  if(e2.written == e.input || e2 == self.newElement){
                    //e2.written = e.input;
                    e2.dockedBottomRight = e.id;
                    e.dockedLeft = e2.id;
                  }
                if((e2.x == e.x +3*self.gridSize && e2.y == e.y - 2*self.gridSize))
                  if(e.output != "" && (e2.written == e.output || e2 == self.newElement)){
                    //e2.written = e.output;
                    e2.dockedBottomLeft = e.id;
                    e.dockedRight = e2.id;
                  }
              } 
            }       
          }
        }
        // build all matching interpreter top docks
        for(var i=0; i < self.elements.length; i++){
          var e = self.elements[i];
          if(e.type == "interpreter"){
            for(var z=0; z < self.elements.length; z++){
              var e2 = self.elements[z];
              if(e2.type == "program" && e2.written != "JS"){
                if(e2.x == e.x && e2.y == e.y - 2*self.gridSize)
                  if(e2.written == e.input || e2 == self.newElement){
                    e2.written = e.input;
                    e2.dockedBottom = e.id;
                    e.dockedTop = e2.id;
                  }
              }
              if(e2.type == "compiler" && (e2.written != "JS")) {
                if(e2.x == e.x-self.gridSize && e2.y == e.y - 2*self.gridSize)
                  if(e2.written == e.input || e2 == self.newElement){
                    e2.written = e.input;
                    e2.dockedBottom = e.id;
                    e.dockedTop = e2.id;
                  }
              }
              if(e2.type == "interpreter" && (e2.written != "JS")) {
                if(e2.x == e.x && e2.y == e.y - 3*self.gridSize)
                  if(e2.written == e.input || e2 == self.newElement){
                    e2.written = e.input;
                    e2.dockedBottom = e.id;
                    e.dockedTop = e2.id;
                  }
              }
            }
          }
        }

        // build all matching E/A docks
        for(var i=0; i < self.elements.length; i++){
          var e = self.elements[i];
          if(e.type == "ea"){
            for(var z=0; z < self.elements.length; z++){
              var e2 = self.elements[z];
              if(e2.type == "program"){
                if((e2.x == e.x + self.gridSize && e2.y == e.y) && (e2.dockedBottom != null || (e2.written == "JS" ))) {
                  e2.dockedLeft = e.id;
                  e.dockedRight = e2.id;
                  if(e == self.newElement) e.name = $translate.instant("TDIAG.IOBLOCK")[0];
                }
                if((e2.x == e.x - self.gridSize && e2.y == e.y) && (e2.dockedBottom != null || (e2.written == "JS" ))) {
                  e2.dockedRight = e.id;
                  e.dockedLeft = e2.id;
                  if(e == self.newElement) e.name = $translate.instant("TDIAG.IOBLOCK")[2];
                }
              }
            }       
          }
        }
        // unbind if not matching blocks
        for(var i=0; i < self.elements.length; i++){
          var e = self.elements[i];
          if(e.type == "program"){
            for(var z=self.elements.length-1; z > -1; z--){
              var e2 = self.elements[z];
              if(e2.type == "compiler"){
                if(e2.output != "" && 
                   e2.x == e.x - 3*self.gridSize &&
                   e2.y == e.y + self.gridSize)
                  if((e2.output != "" && (e2.written == "JS" )) && (e2.output == e.written || e == self.newElement))
                  if(1==1 || !e.dockedBottomLeft){
                    if(e2.dockedLeft){
                      var wrongType = false;
                      for(var w=0; w < self.elements.length; w++){
                        if(self.elements[w].id == e2.dockedLeft && self.elements[w].type == "compiler") wrongType = true;
                      }
                      if(wrongType) { // do not connect this one
                        e2.dockedRight = null;
                        e.dockedBottomLeft = null;
                        continue;
                      } 
                    }
                    e.written = e2.output; 
                    e2.dockedRight = e.id;
                    e.dockedBottomLeft = e2.id;
                  }
                if(e2.x == e.x + self.gridSize &&
                   e2.y == e.y + self.gridSize)
                  if(e2.input == e.written || e == self.newElement)
                  if(1==1 || !e.dockedBottomRight){
                    if(e2.dockedRight){
                      var wrongType = false;
                      for(var w=0; w < self.elements.length; w++){
                        if(self.elements[w].id == e2.dockedRight && self.elements[w].type == "compiler") wrongType = true;
                      }
                      if(wrongType) { // do not connect this one
                        e2.dockedLeft = null;
                        e.dockedBottomRight = null;
                        continue;
                      } 
                    }
                    e.written = e2.input; 
                    e2.dockedLeft = e.id;
                    e.dockedBottomRight = e2.id;
                  }
                if(e2.x == e.x - 3*self.gridSize &&
                   e2.y == e.y + self.gridSize)
                  if((e2.output != "" && (e2.written == "JS" )) && (e2.output == e.written || e2 == self.newElement))
                  if(1==1 || !e.dockedBottomRight){
                    if(e2.dockedLeft){
                      var wrongType = false;
                      for(var w=0; w < self.elements.length; w++){
                        if(self.elements[w].id == e2.dockedLeft && self.elements[w].type == "compiler") wrongType = true;
                        if(self.elements[w].id == e2.dockedLeft && self.elements[w].type == "program"){
                          e.name = self.elements[w].name;
                        }
                      }
                      if(wrongType) { // do not connect this one
                        e2.dockedRight = null;
                        e.dockedBottomLeft = null;
                        continue;
                      } 
                    }
                    e2.output = e.written; 
                    e2.dockedRight = e.id;
                    e.dockedBottomLeft = e2.id;

                  }
              }
            }
          }
          if(e.type == "compiler"){
            for(var z=0; z < self.elements.length; z++){
              var e2 = self.elements[z];
              if(e2.type == "compiler"){
                if((e2.x == e.x -2*self.gridSize && e2.y == e.y - self.gridSize))
                  if(e2.written == e.input || e2 == self.newElement){
                    if(e.dockedRight){
                      var wrongType = false;
                      for(var w=0; w < self.elements.length; w++){
                        if(self.elements[w].id == e.dockedRight && self.elements[w].type == "program") wrongType = true;
                        if(self.elements[w].id == e.dockedRight && self.elements[w].type == "interpreter") wrongType = true;
                      }
                      if(wrongType) { // do not connect this one
                        e2.dockedBottomRight = null;
                        e.dockedLeft = null;
                        continue;
                      } 
                    }
                    e2.written = e.input;
                    e2.dockedBottomRight = e.id;
                    e.dockedLeft = e2.id;
                  }
                if((e2.x == e.x +2*self.gridSize && e2.y == e.y - self.gridSize))
                  if(e2.written == e.output || e2 == self.newElement){
                    if(e.dockedLeft){
                      var wrongType = false;
                      for(var w=0; w < self.elements.length; w++){
                        if(self.elements[w].id == e.dockedLeft && self.elements[w].type == "program") wrongType = true;
                        if(self.elements[w].id == e.dockedLeft && self.elements[w].type == "interpreter") wrongType = true;
                        if(self.elements[w].id == e.dockedLeft && self.elements[w].type == "compiler"){
                          //if(self.elements[w].output == "") {wrongType = true; break; } // skip interpreters
                          e2.name = self.elements[w].name;
                          e2.source = self.elements[w].source;
                          e2.input = self.elements[w].input;
                          e2.output = self.elements[w].output;
                        }
                      }
                      if(wrongType) { // do not connect this one
                        e2.dockedBottomLeft = null;
                        e.dockedRight = null;
                        continue;
                      } 
                    }
                    e2.written = e.output;
                    e2.dockedBottomLeft = e.id;
                    e.dockedRight = e2.id;
                  }
              } 

              if(e2.type == "interpreter"){
                if((e2.x == e.x -1*self.gridSize && e2.y == e.y - 2*self.gridSize))
                  if(e2.written == e.input || e2 == self.newElement){
                    if(e.dockedRight){
                      var wrongType = false;
                      for(var w=0; w < self.elements.length; w++){
                        if(self.elements[w].id == e.dockedRight && self.elements[w].type == "program") wrongType = true;
                        if(self.elements[w].id == e.dockedRight && self.elements[w].type == "compiler") wrongType = true;
                      }
                      if(wrongType) { // do not connect this one
                        e2.dockedBottomRight = null;
                        e.dockedLeft = null;
                        continue;
                      } 
                    }
                    e2.written = e.input;
                    e2.dockedBottomRight = e.id;
                    e.dockedLeft = e2.id;
                  }
                if((e2.x == e.x +3*self.gridSize && e2.y == e.y - 2*self.gridSize))
                  if(e.output != "" && (e2.written == e.output || e2 == self.newElement)){
                    if(e.dockedLeft){
                      var wrongType = false;
                      for(var w=0; w < self.elements.length; w++){
                        if(self.elements[w].id == e.dockedLeft && self.elements[w].type == "program") wrongType = true;
                        if(self.elements[w].id == e.dockedLeft && self.elements[w].type == "compiler") wrongType = true;
                        if(self.elements[w].id == e.dockedLeft && self.elements[w].type == "interpreter"){
                          //if(self.elements[w].output == "") {wrongType = true; break; } // skip interpreters
                          e2.name = self.elements[w].name;
                          e2.source = self.elements[w].source;
                          e2.input = self.elements[w].input;
                          e2.output = self.elements[w].output;
                        }
                      }
                      if(wrongType) { // do not connect this one
                        e2.dockedBottomLeft = null;
                        e.dockedRight = null;
                        continue;
                      } 
                    }
                    e2.written = e.output;
                    e2.dockedBottomLeft = e.id;
                    e.dockedRight = e2.id;
                  }
              } 

            }       
          }
        }


      };

      self.redrawDiagram = function(){
        function resetRec(e,x,y,list){
          if(list.indexOf(e) != -1) return; // already done
           
          if(e.dockedLeft) resetRec(e.dockedLeft,x,y,list);
          if(e.dockedRight) resetRec(e.dockedRight,x,y,list);
          if(e.dockedTop) resetRec(e.dockedTop,x,y,list);
          if(e.dockedBottom) resetRec(e.dockedBottom,x,y,list);
          if(e.dockedBottomLeft) resetRec(e.dockedBottomLeft,x,y,list);
          if(e.dockedBottomRight) resetRec(e.dockedBottomRight,x,y,list);
          
          list.push(e);
          e.x += x;
          e.y += y;
        }
        var changed = true;
        while(changed){
          changed = false;
          for(var z=0; z < self.elements.length; z++){
            var e = self.elements[z];
            if(e.x < 0 || e.y < 0){
              // reset to 0,0 at minimum
              resetRec(e,e.x < 0 ? -e.x : 0,e.y < 0 ? -e.y :0,[]);
              changed = true;
              break;
            }
          }     
        }

        self.reconnectElements();

        for(var z=0; z < self.elements.length; z++){
          var e = self.elements[z];
          var d = self.getHTMLElement(e.id);
          d.css({"z-index":e.zIndex});
        }  
      };

      self.getElementByID = function(id){
        for(var z=0; z < self.elements.length; z++)
          if(self.elements[z].id == id) return self.elements[z];
        return null;
      };
        
      self.deleteElement = function(e){
        self.elements.splice(self.elements.indexOf(e),1);
        if(self.currentSelected.length == 1 && self.currentSelected[0] == e)
           self.currentSelected = [];
        self.refreshDiagram();
      };  

      self.deleteElements = function(es){
        for(var i=0; i < es.length; i++)
          self.deleteElement(es[i]);
        es.splice(0);
        self.makeUndoStep();
      };  
      
      self.copyElement = function(e){
        var n = {type:e.type};
        n.x = e.x + Math.round(self.gridSize / 2);
        n.y = e.y + Math.round(self.gridSize / 2);

        n.source = "";

        if(e.type == 'compiler' || e.type == 'interpreter'){
          n.name = e.name;
          n.input = e.input;
          n.output = e.output;
          n.generator = e.generator;
          n.written = e.written;
          n.code = e.code;
          if(e.preset || e.written == "JS") {
            n.source = e.source;
            n.preset = e.preset;
          }else
          tdiag.getCompilerFromServer(e).then(function(c){
            apiPost("createCompiler",{"name":c.Name + " "+$translate.instant("TDIAG.COPY"), "type":c.Type, "jscode":c.codeParser, "input":c.InputLanguage, "output":c.OutputLanguage, "generator": c.Generator, "LastInput":c.LastInput, "JSON":c.JSON}).success(function(data){ 
              n.name = data.compiler.Name;
              n.source = data.compiler.ID;
              tdiag.updateCompilerCache(data.compiler);
            });
          });
        }
        if(e.type == 'program'){
          n.name = e.name;
          n.written = e.written;
          n.code = e.code;
        }
        if(e.type == 'ea'){
          n.name = e.name;
          n.code = e.code;
        }
        if(e.type == 'comment'){
          n.name = e.name;
          self.unselectElement();
        }

        self.addElement(n);
        self.selectElement(n);
        return n;
      };

      self.copyElements = function(es){
        var n = null;
        for(var i=0; i < es.length; i++)
          n = self.copyElement(es[i]);
        self.selectElement(n); // select again
        self.makeUndoStep();
      };  
      
      self.addElement = function(e){
        // find unique id for element
        var maxID = 0;
        for(var i=0; i < self.elements.length; i++){
          maxID = Math.max(self.elements[i].id, maxID);
        }
        e.id = maxID+1;
        self.elements.push(e);
        self.refreshDiagram();
      };

      self.importCompilerFromURL = function(e,url){
        if(url.indexOf("https://flaci.com/c") === 0){
          url = url.replace("https://flaci.com/c","");
          var p = url.split("g"); 
          var id = p[0];
          tdiag.getCompilerFromServer({source:id}).then(function(c){
            apiPost("createCompiler",{"name":c.Name + " "+$translate.instant("TDIAG.COPY"), "type":c.Type, "jscode":c.codeParser, "input":c.InputLanguage, "output":c.OutputLanguage, "generator": c.Generator, "LastInput":c.LastInput, "JSON":c.JSON}).success(function(data){ 
              e.name = c.Name;
              e.input = c.InputLanguage;
              e.output = c.OutputLanguage;
              e.generator = c.Generator;
              e.written = "TDL";
              e.source = data.compiler.ID;
              tdiag.updateCompilerCache(data.compiler);
              self.makeUndoStep();
            });
          },function(){
            // not found
          });
        }
      };
          
      self.elementDragStart = function(e,x,y,event){
        self.dragginStartSelected = !self.isSelected(e);
        if(self.dragginStartSelected) self.selectElement(e);
        self.wasDragged = false;
            
        for(var i=0; i < self.currentSelected.length; i++){      
          self.currentSelected[i].startX = self.currentSelected[i].x;
          self.currentSelected[i].startY = self.currentSelected[i].y;
        }     
      };
  
      self.elementDragMove = function(e,x,y,event){
        var dx = x - e.startX;
        var dy = y - e.startY;
        if(dx != 0 || dy != 0) self.wasDragged = true;

        for(var i=0; i < self.currentSelected.length; i++){      
          self.currentSelected[i].x = self.currentSelected[i].startX + dx;
          self.currentSelected[i].y = self.currentSelected[i].startY + dy;
        }     

        self.refreshDiagram();  
      };
  
      self.elementDragEnd = function(e,x,y,event){
        setTimeout(function(){
          var d = self.getHTMLElement(e.id);
          if(!self.dragginStartSelected && !self.wasDragged && !d.hasClass("dragging")) self.selectElement(e); 
          self.makeUndoStep();
          self.dragginStartSelected = false;
          self.refreshDiagram();   
        },1);       
      };    

      self.compilerIndex = 0;      
      self.interpreterIndex = 0;      

      self.newElementDragMove = function(type,x,y){
        self.isComponentSidebarOpen = false;
        var p = $("#editor_"+self.ID).offset(); 
        var w = $("#editor_"+self.ID).width();
        var h = $("#editor_"+self.ID).height();
        x -= p.left;
        y -= p.top;
        if(x >= -50 && y >= -50 && x <= w && y <= h){
          if(self.newElement == null) {
            self.newElement = {id:"e"+Math.round(Math.random()*10000), type:type, x:x, y:y, zIndex:0};
            if(type == "compiler") {
              self.newElement.input = "L-In";
              self.newElement.output = "L-Out";
              self.newElement.written = "L";
              self.newElement.generator = "LALR";
              self.newElement.source = "";
              self.newElement.name = "Compiler "+(self.compilerIndex++);
            }  
            if(type == "interpreter") {
              self.newElement.input = "In";
              self.newElement.output = "";
              self.newElement.written = "L";
              self.newElement.generator = "LALR";
              self.newElement.source = "";
              self.newElement.name = "Interpreter "+(self.interpreterIndex++);
            }  
            if(type == "program") {
              self.newElement.name = "P";
              self.newElement.written = "L";
              self.newElement.source = "";
            }  
            if(type == "ea") {
              self.newElement.name = $translate.instant("TDIAG.IOBLOCK");
              self.newElement.source = "";
            }  
            if(type == "comment") {
              self.newElement.name = $translate.instant("TDIAG.COMMENT");
              self.newElement.source = "";
            }  
            self.addElement(self.newElement);
            self.selectElement(self.newElement);
          }  
          var edit = $('#editor_'+self.ID);
          var scrollX = edit.scrollLeft();
          var scrollY = edit.scrollTop();
          
          self.newElement.x = Math.round(x/10)*10+scrollX;
          self.newElement.y = Math.round(y/10)*10+scrollY;
          self.refreshDiagram();
        }else{
          if(self.newElement) {
            self.deleteElement(self.newElement);
            self.newElement = null;
          }  
        }
        return true;
      };     

      self.newElementDragEnd = function(x,y){
        self.newElement = null;
      };
             
      self.makeUndoStep = function(){
        if(self.isUndo) return; // not create new steps while performing an undo
        var s = self.toJSON();
        // check if it is already in history 
        if(self.history.length == 0 || s != self.history[self.historyPointer]){
          self.history = self.history.slice(0,self.historyPointer+1);
          self.history.push(s); 
          if(self.history.length > 50) self.history = self.history.slice(self.history.length-50);
          self.historyPointer = self.history.length-1;
 
          // push s to server as current save state of diagram
          if(self.history.length > 1) waitOneSecond(self.saveToServer,2000);
        }
      };

      self.undo = function (){
        if(self.historyPointer <= 0) return; // nothing to undo;
        self.historyPointer--;
        var s = self.history[self.historyPointer];
        self.isUndo = true;
        self.loadFromJSONString(s);
        waitOneSecond(self.saveToServer,2000);
        self.unselectElement();
        self.isUndo = false;
      };

      self.redo = function (){
        if(self.historyPointer >= self.history.length-1) return; // nothing to redo;
        self.historyPointer++;
        var s = self.history[self.historyPointer];
        self.isUndo = true;
        self.loadFromJSONString(s);
        waitOneSecond(self.saveToServer,2000);
        self.unselectElement();
        self.isUndo = false;
      };

      self.loadFromJSONString = function(s){
        self.elements = JSON.parse(s);
        var updateCompilerNow = function(e){
            tdiag.getCompilerFromServer(e).then(function(c){
              tdiag.updateCompilerCache(c);
            },function(){
              // not found anymore
              e.source = ""; 
            });
        };
        for(var i=0; i < self.elements.length; i++)
          if(self.elements[i].source) updateCompilerNow(self.elements[i]);

        self.refreshDiagram();
        self.makeUndoStep();
      };

      self.saveToServer = function(s){
        // lazy save with 1 sec debounce 
        // push s to server as current save state of automaton
        self.isSavedToServer = false;
        var s = self.toJSON();
        apiPost("saveTDiagram",{id:self.ID, name:self.Name, JSON:s})
         .success(function(data){ 
           if(data.result == "OK") {
             self.isSavedToServer = true; 
           }
         });
        $scope.updateSavedJSON(d, s);
      };
             
      self.sAttributePanelSize = 0;
      self.changeAttributePanelSize = function(n){  }; // will be set from compiler

      self.selectSource = function(e,edit,ev){
        var deferred = $q.defer();
        if(e == null){
          return deferred;
        }

        var compilers = [];
        
        for(var i=0; i < tdiag.compilers.length; i++){ 
          if(tdiag.compilers[i].preset && tdiag.compilers[i].Type == e.type){
            compilers.push(tdiag.compilers[i]);
            continue;
          }
          for(var z=0; z < self.elements.length; z++){ 
            if(self.elements[z].type == e.type)
              if(tdiag.compilers[i].ID == self.elements[z].source) { 
                var inside = false;
                for(var t=0; t < compilers.length; t++){
                  if(compilers[t].ID == tdiag.compilers[i].ID) {inside = true; break;}
                }
                if(!inside) compilers.push(tdiag.compilers[i]); 
                break; 
              }
          }
        } 

        $mdDialog.show({
          templateUrl: "views/tdiag/selectsource.html",
          targetEvent: ev,
        
          clickOutsideToClose: true,
          controller: function ($scope, $mdDialog) { 
            var s = {};
            s.element = e;
            s.compilers = compilers;
            s.selectedSource = e.source != "" ? e.source : 0; 
            s.selectedCode = e.code ? e.code : "";
            s.isEdit = edit;
            s.useVCC = e.written == "TDL";
            s.selectedSourceGrammar = null;

            s.grammars = [];

            apiPost("getGrammars",{}).success(function(data){
              if(data.result == "OK"){
                s.grammars = data.grammars;
                if(s.grammars.length > 0) s.selectedSourceGrammar = s.grammars[0];
              }
            });


            $scope.self = s;
            $scope.$sce = $sce;
            s.buildDownloadURI = function(data){
              return "data:application/octet-stream;base64,"+btoa(data);
            };

            $scope.reloadFromURL = function(){
              $scope.disableReloadBtn = true;
              $.get( e.fromURL, {}, function( data ) {
                $timeout(function(){
                  s.selectedCode = data;
                  $scope.disableReloadBtn = false;
                },0);
              },"text").fail(function(e){
                $timeout(function(){
                  self.showAlert("Error downloading "+e.fromURL,"Error",null);
                  $scope.disableReloadBtn = false;
                },0);
              });                  
            };

            $scope.hide = function() {
              e.code = "";
              if(s.selectedSource == 'import'){
                self.importCompilerFromURL(e,s.importURL);
                $mdDialog.hide();
                return;
              }
              if(s.selectedSource == 'newcompiler'){
                e.name = "Compiler";
                e.source = "";
                e.written = "TDL";
                e.preset = false;
                e.input = "L-in";
                e.output = "L-out";
              }
              if(s.selectedSource == 'newcompilerFromG'){
                e.name = "Compiler "+s.selectedSourceGrammar.Name;
                e.input = "L-in";
                e.output = "L-out";
                e.source = "";
                var grammar = JSON.parse(s.selectedSourceGrammar.JSON);
                for(var i=0; i < grammar.bnf.length; i++){
                  for(var z=0; z < grammar.bnf[i].rhs.length; z++){
                    grammar.bnf[i].rhs[z][1] = ""; // reset s-attribute
                  }
                } 

                apiPost("createCompiler",{"name":e.name, "type":"Compiler", "input":e.input, "output":e.output, "generator":"LALR",
                                          "JSON":JSON.stringify(grammar)}).success(function(data){ 
                  e.source = data.compiler.ID;
                  tdiag.updateCompilerCache(data.compiler);
                  self.makeUndoStep();
                });
                e.written = "TDL";
                e.preset = false;
              }
              if(s.selectedSource == 'newinterpreter'){
                e.name = "Interpreter";
                e.source = "";
                e.written = "TDL";
                e.preset = false;
                e.input = "L-in";
                e.output = "";
              }
              if(s.selectedSource == 'newinterpreterFromG'){
                e.name = "Interpreter "+s.selectedSourceGrammar.Name;
                e.source = "";
                e.written = "TDL";
                e.preset = false;
                e.input = "L-in";
                e.output = "";

                var grammar = JSON.parse(s.selectedSourceGrammar.JSON);
                for(var i=0; i < grammar.bnf.length; i++){
                  for(var z=0; z < grammar.bnf[i].rhs.length; z++){
                    grammar.bnf[i].rhs[z][1] = ""; // reset s-attribute
                  }
                } 

                apiPost("createCompiler",{"name":e.name, "type":"Interpreter", "input":e.input, "output":e.output, "generator":"LALR",
                                          "JSON":JSON.stringify(grammar)}).success(function(data){ 
                  e.source = data.compiler.ID;
                  tdiag.updateCompilerCache(data.compiler);
                  self.makeUndoStep();
                });
                e.preset = false;
              }
              // selected one from the list
              if((e.type == "compiler" || e.type == "interpreter")){
                for(var i=0; i < s.compilers.length; i++) if(s.compilers[i].ID == s.selectedSource){
                  e.input = s.compilers[i].InputLanguage;
                  e.output = s.compilers[i].OutputLanguage;
                  e.generator = s.compilers[i].Generator;
                  e.name = s.compilers[i].Name;
                  e.preset = s.compilers[i].preset;
                  e.written = "TDL";
                  e.source = s.selectedSource;
                }
                if(e.preset) e.written = "JS"; // special case for presets
                e.code = s.selectedCode;
              }else
              if(e.type == "compiler" || e.type == "interpreter"){
                e.code = s.selectedCode;
              }
              if(e.type == "program"){
                e.code = s.selectedCode;
              }
              if(e.type == "ea"){
                e.code = s.selectedCode;
              }
              $mdDialog.hide();
              self.makeUndoStep();
            };

            $scope.cancel = function() {
              $mdDialog.cancel();
              deferred.reject("canceled"); 
            };
          }
        });
        return deferred.promise;       
      };
   
      self.loadFromJSONString(d.JSON); 
      return self;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // Main model class for Compiler (VCC)
    ////////////////////////////////////////////////////////////////////////////////
    function ACompiler (c){
      var self = this;
      self.gridSize = 50;
      self.showScannerTest = false;
      self.showCompilerTest = false;
      self.showParseTable = false;
      self.showBuildHints = false;
      self.currentSAttributePlaceholder = "";

      self.sAttributePanelSize = 0;
      try{
        if(window.localStorage){
          var sAttributePanelSize = window.localStorage.getItem("sAttributePanelSize");
          if(sAttributePanelSize) self.sAttributePanelSize = parseInt(sAttributePanelSize);
        }
      }catch(e){}
      self.changeAttributePanelSize = function(n){
        self.sAttributePanelSize += n;
        if(self.sAttributePanelSize > 2) self.sAttributePanelSize = 2;
        if(self.sAttributePanelSize < 0) self.sAttributePanelSize = 0;
        try{
          if(window.localStorage){
            window.localStorage.setItem("sAttributePanelSize",self.sAttributePanelSize);
          }
        }catch(e){}
      };

      self.Name = c.Name;
      self.ID = c.ID;
      self.preset = c.preset === true || c.preset === "true";

      self.isSavedToServer = false;
      self.InputLanguage = c.InputLanguage;
      self.OutputLanguage = c.OutputLanguage;
      self.Generator = c.Generator;
  
      self.selectedToken = null;
      self.selectedRule = null;
      self.selectedRHS = null;
      self.selectedRHSElement = null;

      self.codeParser = "";
      self.runParser = null;
      self.runParserInput = c.LastInput ? c.LastInput : "";
      self.runParserOutput = "";
      self.runParserTokenlist = "";
      self.runParserHTMLMode = false;

      self.parseTable = []; 

      self.history = []; // for undo and save
      self.historyPointer = 0;

      self.makeUndoStep = function(){
        if(self.isUndo) return; // not create new steps while performing an undo
        var s = angular.toJson(self.grammar);
        // check if it is already in history 
        if(self.history.length == 0 || s != self.history[self.historyPointer]){
          self.history = self.history.slice(0,self.historyPointer+1);
          self.history.push(s); 
          if(self.history.length > 50) self.history = self.history.slice(self.history.length-50);
          self.historyPointer = self.history.length-1;
 
          // push s to server as current save state of diagram
          if(self.history.length > 1) waitOneSecond(self.saveToServer,2000);
        }
      };
      self.delayMakeUndoStep = function(){
        waitOneSecond(self.makeUndoStep,2000);
      };

      self.undo = function (){
        if(self.historyPointer <= 0) return; // nothing to undo;
        self.historyPointer--;
        var s = self.history[self.historyPointer];
        self.isUndo = true;
        self.loadFromJSONString(s);
        waitOneSecond(self.saveToServer,2000);
        self.isUndo = false;
      };

      self.redo = function (){
        if(self.historyPointer >= self.history.length-1) return; // nothing to redo;
        self.historyPointer++;
        var s = self.history[self.historyPointer];
        self.isUndo = true;
        self.loadFromJSONString(s);
        waitOneSecond(self.saveToServer,2000);
        self.isUndo = false;
      };

      self.loadFromJSONString = function(s){
        // save selections
        var st = self.selectedToken;
        var sr = self.selectedRule;
        var srhs = self.selectedRule && self.selectedRHS ? self.selectedRule.rhs.indexOf(self.selectedRHS) : -1;

        self.grammar = JSON.parse(s);

        // restore selections
        if(st)
        for(var i=0; i < self.grammar.lex.rules.length; i++){
          if(self.grammar.lex.rules[i].expression == st.expression) { 
            self.selectToken(self.grammar.lex.rules[i]);
            break;
          }
        }
        // matching name is even better
        if(st)
        for(var i=0; i < self.grammar.lex.rules.length; i++){
          if(self.grammar.lex.rules[i].name == st.name) { 
            self.selectToken(self.grammar.lex.rules[i]);
            break;
          }
        }

        if(sr)
        for(var i=0; i < self.grammar.bnf.length; i++){
          if(self.grammar.bnf[i].name == sr.name){
            if(srhs != -1 && self.grammar.bnf[i].rhs.length > srhs)
              self.selectRHS(self.grammar.bnf[i].rhs[srhs],self.grammar.bnf[i]); else
              self.selectRule(self.grammar.bnf[i]);
          }
        }

        self.makeUndoStep();
      };

      self.loadFromJSONString(c.JSON);

      self.tokenListSortOptions = {
        //restrict move across columns. move only within column.
        accept: function (sourceItemHandleScope, destSortableScope) {
          var isInSameList = sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
          return isInSameList;
        },
        dragStart: function(event){ },
        dragEnd: function(event){ },
        itemMoved: function (event) { self.makeUndoStep(); },
        orderChanged: function (event) { self.makeUndoStep(); },
        containment: 'body',
        clone:false
      };

      self.sameListSortOptions = {
        //restrict move across columns. move only within column.
        accept: function (sourceItemHandleScope, destSortableScope) {
          var isInSameList = false; //sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
          if(sourceItemHandleScope.itemScope.sortableScope.element.hasClass("parserRuleRightHandSideElements")){
            // right hand side sub elements
            if(destSortableScope.element.hasClass("parserRuleRightHandSideElements")) isInSameList = true;
          }
          if(sourceItemHandleScope.itemScope.sortableScope.element.hasClass("parserRuleRightHandSides")){
            // right hand sides
            if(destSortableScope.element.hasClass("parserRuleRightHandSides")) isInSameList = true;
          }
          if(sourceItemHandleScope.itemScope.sortableScope.element.hasClass("parserRuleElements")){
            // rule blocks
            if(destSortableScope.element.hasClass("parserRuleElements")) isInSameList = true;
          }
          return isInSameList;
        },
        dragStart: function(event){ self.addElementOpen = false; },
        dragEnd: function(event){ },
        itemMoved: function (event) { self.makeUndoStep(); },
        orderChanged: function (event) { self.makeUndoStep(); },
        containment: 'body',
        clone:false
      };
 
      self.deselectAll = function(){
        self.selectedRule = null;
        self.selectedRHS = null;
        self.selectedRHSElement = null;
        self.currentSAttribute = "";
      };

      self.getTokenByName = function(n){
        for(var i = 0; i < self.grammar.lex.rules.length; i++){
          if(self.grammar.lex.rules[i].name == n) return self.grammar.lex.rules[i];
        }
        return null;
      };

      self.addToken = function(){
        var n = 1; 
        while(self.getTokenByName("token"+n)) n++;
        var t = {expression:"",name:"token"+n};
        self.grammar.lex.rules.unshift(t);
        self.selectToken(t);

        setTimeout(function(){  
          $('#tokenlist_'+self.ID).animate({scrollTop: 0}, 1000);
          $('#tokenlist_'+self.ID+" input").first().focus(); 
        },100);

        self.makeUndoStep();
        return t.name;
      };

      self.deleteToken = function(t){
        self.grammar.lex.rules.splice(self.grammar.lex.rules.indexOf(t),1);
        self.updateTokenNamesInBNF(null,t[1]);
        if(self.selectedToken == t) self.selectedToken = null;
        if(self.selectedRHSElement && self.selectedRHSElement.name == t.name) self.selectedRHSElement = null;
        self.makeUndoStep();
      };

      // TODO: problem when you type a tokenname which is already there and used like "xxx" and you tube "xxxy"
      self.updateTokenNamesInBNF = function(newname, oldname){
        for(var i = 0; i < self.grammar.bnf.length; i++)
          for(var z = 0; z < self.grammar.bnf[i].rhs.length; z++) 
            for(var t = 0; t < self.grammar.bnf[i].rhs[z][0].length; t++) {
              if(self.grammar.bnf[i].rhs[z][0][t].name == oldname && self.grammar.bnf[i].rhs[z][0][t].type == "t") {
                 if(newname == null) {
                   self.grammar.bnf[i].rhs[z][0].splice(t,1); 
                   t--; 
                 } else
                   self.grammar.bnf[i].rhs[z][0][t].name = newname;
              }
            }
        
        self.makeUndoStep();
      };

      self.getSelectedRHSText = function(){ 
        if(!self.selectedRule || !self.selectedRHS){
          return $translate.instant("TDIAG.GLOBALCODE");
        }
        var a = $translate.instant("TDIAG.SATTRIBUTEFOR")+" "+self.selectedRule.name + " -> ";

        var s = "";
        var c = "$$ = ";
        for(var i=0; i < self.selectedRHS[0].length; i++){
          s += (s != "" ? " ":"")+self.selectedRHS[0][i].name;
          c += '$'+(i+1) + (i < self.selectedRHS[0].length-1 ? " + ":";");
        }
        if(s == "") s = "ε";

        self.currentSAttributePlaceholder = c;
        return a+s;
      };

      self.getRuleByName = function(n){
        for(var i = 0; i < self.grammar.bnf.length; i++){
          if(self.grammar.bnf[i].name == n) return self.grammar.bnf[i];
        }
        return null;
      };

      self.deleteParserRule = function(){
        if(self.selectedRule){  
          self.deleteRule(self.selectedRule);
          self.selectedRule = null;
        }
      };

      self.deleteParserRHS = function(){
        if(self.selectedRHS){  
          self.deleteRuleRHS(self.selectedRule,self.selectedRHS);
          self.selectedRHS = null;
        }
      };

      self.deleteParserRHSElement = function(){
        if(self.selectedRHSElement){  
          self.deleteRuleRHSElement(self.selectedRHS, self.selectedRHSElement);
          self.selectedRHSElement = null;
        }
      };
   
      self.deleteParserSelection = function(){
        if(self.selectedRHSElement){  
          self.deleteRuleRHSElement(self.selectedRHS, self.selectedRHSElement);
          self.selectedRHSElement = null;
          return;
        }
        if(self.selectedRHS){  
          self.deleteRuleRHS(self.selectedRule,self.selectedRHS);
          self.selectedRHS = null;
          return;
        }
        if(self.selectedRule){  
          self.deleteRule(self.selectedRule);
          self.selectedRule = null;
          return;
        }
      };

      self.addRule = function() {
        var n = 1; 
        while(self.getRuleByName("rule"+n)) n++;
        var rhs = [ [ ] ,"" ];
        var r = {"name":"rule"+n,"rhs":[rhs]};
        self.grammar.bnf.push(r);
        self.deselectAll();
        self.selectRHS(rhs,r);

        setTimeout(function(){  
          $('#parserlist_'+self.ID).animate({scrollTop: 9999}, 1000);
          $('#parserlist_'+self.ID+" input").focus(); 
        },100);
        self.makeUndoStep();
        return r.name;
      };

      self.openAddPanelPosition = {x:0,y:0};
      self.setAddPanelPosition = function(ev){
        self.openAddPanelPosition = {x:ev.pageX, y:ev.pageY+20}; 
      };

      self.getOpenAddPanelX = function(){
        var w = $(window);
        var x = self.openAddPanelPosition.x - (w.width()*0.1);
        var d = $('#parserlistAddPanel_'+self.ID);
        x = Math.min(x,w.width()*0.8 - d.width() - 30);
        return x;
      };
      self.getOpenAddPanelY = function(){
        var w = $(window);
        var y = self.openAddPanelPosition.y - (w.height()*0.1);
        var d = $('#parserlistAddPanel_'+self.ID);
        y = Math.min(y,w.height()*0.8 - d.height() - 30);
        return y;
      };

      self.deleteRule = function(r){
        self.deselectAll();
        self.grammar.bnf.splice(self.grammar.bnf.indexOf(r),1);
        self.updateRuleNamesInBNF(null,r.name);
        self.makeUndoStep();
      };

      self.updateRuleNamesInBNF = function(newname, oldname){
        for(var i = 0; i < self.grammar.bnf.length; i++)
          for(var z = 0; z < self.grammar.bnf[i].rhs.length; z++) 
            for(var t = 0; t < self.grammar.bnf[i].rhs[z][0].length; t++) {
              if(self.grammar.bnf[i].rhs[z][0][t].name == oldname && self.grammar.bnf[i].rhs[z][0][t].type == "nt") {
                 if(newname == null) {
                   self.grammar.bnf[i].rhs[z][0].splice(t,1); 
                   t--; 
                 } else
                   self.grammar.bnf[i].rhs[z][0][t].name = newname;
              }
            }        
        self.makeUndoStep();
      };

      self.addRuleRHS = function(rule) {
        var rhs = [ [ ] ,"" ];
        rule.rhs.push(rhs);
        self.deselectAll();
        self.selectRHS(rhs,rule);
        self.makeUndoStep();
      };

      self.deleteRuleRHS = function(rule,rhs){
        rule.rhs.splice(rule.rhs.indexOf(rhs),1);
        if(self.selectedRHS == rhs) { self.selectedRHS = null; }
        if(rule.rhs.length == 0){
          self.addRuleRHS(rule);
        }
        self.makeUndoStep();
      };

      self.addRuleRHSElement = function(rhs,name,type) {
        var e = {"name":name, "type":type};
        rhs[0].push(e);
        self.selectedRHSElement = e;
        self.makeUndoStep();
      };

      self.deleteRuleRHSElement = function(rhs,e){
        rhs[0].splice(rhs[0].indexOf(e),1);
        if(self.selectedRHSElement == e) { self.selectedRHSElement = null; }
        self.makeUndoStep();
      };


      self.selectToken = function(t) {
        self.selectedToken = t;
      };

      self.selectRule = function(r){ 
        self.selectedRule = r;
        self.selectedRHS = null; 
        self.selectedRHSElement = null;
      }; 

      self.selectRHS = function(rhs,r){
        self.selectedRule = r;
        self.selectedRHS = rhs;
        self.selectedRHSElement = null;
      }; 

      self.selectRHSElement = function(e,rhs,r) {
        self.selectedRHSElement = e;
        self.selectedRHS = rhs;
        self.selectedRule = r;
      };

      self.saveToServer = function(){
        self.isSavedToServer = false;
        self.buildParser();
        if(self.ID < 0) return; // predefined compiler
        var deferred = $q.defer();
        apiPost("saveCompiler",{id:self.ID, name:self.Name, input:self.InputLanguage, output:self.OutputLanguage, generator:self.Generator, jscode:self.codeParser, JSON:angular.toJson(self.grammar), lastinput: self.runParserInput})
         .success(function(data){ 
           if(data.result == "OK") {
             self.isSavedToServer = true;
             tdiag.updateCompilerCache(data.compiler);
             self.makeUndoStep();
             deferred.resolve("OK");
           }
         });
        return deferred.promise;  
      };

      self.buildParser = function(){
        self.buildParserOutput = "";
        var j = VCC2JISON(angular.toJson(self.grammar));

        Jison.print = function print () {
          for(var i=0; i < arguments.length; i++)
            self.buildParserOutput += arguments[i];
          self.buildParserOutput += "\n";
        };
        self.codeParser = null;
        self.runParser = null;
        self.parseTable = []; 
        var parser;
        try{
          if(self.Generator == "LL1"){
            self.codeParser = VCC2LL1Parser(angular.toJson(self.grammar));
            eval(self.codeParser);
            self.runParser = parser;
            self.runParserType = "LL1";
          }else{

            parser = Jison.Generator(j, {type: "lalr"}); // noDefaultResolve:true
            if (!parser.conflicts) {
              //self.buildParserOutput = 'Generating LALR(1) Parser - successfully!'+"\n\n" + self.buildParserOutput ;
            } else {
              self.buildParserOutput = $translate.instant("ERRORS.LALR1GENERATORCONFLICTS")+"\n\n" + self.buildParserOutput;
            }

            //parser.resolutions.forEach(function (res) {
            //  var r = res[2];
            //  if (!r.bydefault) return;
            //  self.buildParserOutput += (r.msg+"\n"+"("+r.s+", "+r.r+") -> "+r.action)+"\n";
            //});

            var p = parser.generate({moduleType:"js", globalCode:j.globalCode}); // real parser JS file, we can store this in upload/vcc/id.js
            // test parser here
            self.codeParser = p; 
            self.runParser = parser.createParser();
            self.runParserType = "LALR";

            self.parseTable = $sce.trustAsHtml(lrTable(parser));
          }

 
        }catch(e){
          self.buildParserOutput = ' ' + e;
        }
       
        self.buildParserOutputHTML = $sce.trustAsHtml(self.buildParserOutput);  

        //if (runParser.computeLookaheads) runParser.computeLookaheads();
        //window.parser = parser;
        //$('#parseNoneTerminalList_'+self.ID).html(nonterminalInfo(parser));
        //$('#parseProductions_'+self.ID).html(productions(parser));
        //$('#parseTabel_'+self.ID).html(lrTable(parser));
      };

      self.buildParser(); // build on load

      self.run = function(){
        self.runParserTokenlist = ""; 
        if(!self.runParser) return;

        if(self.runParserType == "LALR"){  
          try{
            var x = self.runParser.lexer.setInput(self.runParserInput);
            var tokenList = [];
            while(true){ 
              var t = self.runParser.terminals_[x.lex()];
              if(!t || t == "EOF") break;
              tokenList.push(t);
            }
            self.runParserTokenlist = "["+tokenList.join(", ")+"]";

            var src = self.codeParser;
            src = "var input = '"+escapeJavaScriptString(self.runParserInput)+"';\n" + src + " return parser.parse(input);";
            self.runParserOutput = (new Function(src)).call({})+"";
            //self.runParserOutput = $sce.trustAsHtml(self.runParserOutput);
          }catch(e){
            self.runParserOutput = e+'';
          }
        }

        if(self.runParserType == "LL1"){
          try{
            self.runParserTokenlist = JSON.stringify(self.runParser.lexer(self.runParserInput));
            var src = self.codeParser;
            eval(src);
            self.runParserOutput = parser.parse(self.runParserInput);
          }catch(e){
            self.runParserOutput = e+'';
          }
        }
      };

      self.runScanner = function(){
        self.runParserTokenlist = ""; 
        if(self.buildParserOutput != "") self.runParserTokenlist = self.buildParserOutput+"\n"+"Maybe a regular expression in your tokens is invalid.\nCheck for proper escape sequences.";
        if(!self.runParser) return;

        if(self.runParserType == "LL1"){
          try{
            self.runParserTokenlist = JSON.stringify(self.runParser.lexer(self.runParserInput));
            var src = self.codeParser;
            eval(src);
            var tokenList = [];
            tokenList = parser.lexer(self.runParserInput);
            var s = "";
            // skip EOF Token
            for(var i=0; i < tokenList.length-1; i++)
              s += (i > 0 ? ', ':'')+'['+tokenList[i][0]+',"'+tokenList[i][1]+'"]'; 
            self.runParserTokenlist = "("+s+")";

          }catch(e){
            self.runParserOutput = e+'';
          }
        }

        if(self.runParserType == "LALR"){  
          try{
            var x = self.runParser.lexer.setInput(self.runParserInput);
            var tokenList = [];
            while(true){ 
              var token = x.lex();
              var value = x.match;
              var t = self.runParser.terminals_[token];
              if(!t || t == "EOF") break;
              tokenList.push({v:value,token:t});
            }
            var s = "";
            for(var i=0; i < tokenList.length; i++)
              s += (i > 0 ? ', ':'')+'['+tokenList[i].token+',"'+tokenList[i].v+'"]'; 
            self.runParserTokenlist = "("+s+")";

          }catch(e){
            var s = "";
            for(var i=0; i < tokenList.length; i++)
              s += (i > 0 ? ', ':'')+'['+tokenList[i].token+',"'+tokenList[i].v+'"]'; 
            self.runParserTokenlist = "("+s+")";
            self.runParserTokenlist += "\n"+ e+'';
          }
        }
      };

      return self;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // Diagram Editor controller
    ////////////////////////////////////////////////////////////////////////////////
    self.loadedDiagramsCount = 10;

    self.loadMoreDiagrams = function(){
      self.loadedDiagramsCount = self.loadedDiagramsCount + 10;
    };

    self.loadFromServer = function (){
      var deferred = $q.defer();

      // send local data to update server
      var d = localStorage.getItem("localTDiagrams");
      var diagrams = d ? d : "[]"; // default is array here
      var c = localStorage.getItem("localCompilers");
      var compilers = c ? c : "[]"; // default is array here

      if(!userLogin.isOfflineMode){  
        localStorage.setItem("localCompilers","[]");
        localStorage.setItem("localTDiagrams","[]");
      }
      apiPost("getTDiagrams",{"diagrams":diagrams,"compilers":compilers}).success(function(data){
        if(data.result == "OK"){
          self.diagrams = data.diagrams;
          // now replace everything in localStorage with server data
          if(!userLogin.isOfflineMode){  
            localStorage.setItem("localTDiagrams",angular.toJson(data.diagrams));
          }

          for(var i=0; i < self.diagrams.length; i++){
            self.diagrams[i].lastChange = function(){ return moment(this.Changed).fromNow();};
            self.diagrams[i].thumbElements = JSON.parse(self.diagrams[i].JSON);
            
            var minX = 100000;
            var minY = 100000;
            for(var z=0; z < self.diagrams[i].thumbElements.length; z++){ 
              var e = self.diagrams[i].thumbElements[z];
              minX = Math.min(e.x,minX);
              minY = Math.min(e.y,minY);
            }
            minX -= 10;
            minY -= 10;
            for(var z=0; z < self.diagrams[i].thumbElements.length; z++){ 
              var e = self.diagrams[i].thumbElements[z];
              e.x -= minX;
              e.y -= minY;
            }
          }

          deferred.resolve("OK");
        }
      });
      return deferred.promise;  
    };

    self.closeDiagram = function(d,ev){
      var isOpen = -1;
      for (var i=0; i < self.openTabs.length; i++)
        if(self.openTabs[i].ID == d.ID) isOpen = i;

      if(isOpen != -1){
        if(self.openTabs[isOpen].saveToServer) self.openTabs[isOpen].saveToServer();
        self.openTabs.splice(isOpen,1);
      }
    };
    
    self.openDiagram = function(d){
      // init connections
      var isOpen = -1;
      for (var i=0; i < self.openTabs.length; i++)
        if(self.openTabs[i].ID == d.ID) isOpen = i;
        
      if(isOpen == -1) {        
        var n = new ADiagram(d);
        self.openTabs.push(n); 
        isOpen = self.openTabs.length-1; 
        setTimeout(function(){
          $scope.$apply(function(){self.selectedTab = 1+isOpen; self.openTabs[isOpen].redrawDiagram(); });
        },50);
      }else{
        self.selectedTab = 1+isOpen;
        self.openTabs[isOpen].redrawDiagram();
      }
    };

    self.createDiagram = function(ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/tdiag/newdiagram.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.caption = $translate.instant("TDIAG.CREATEDIAGRAM");
          $scope.hide = function() {
            if($.trim($scope.title) == "") return;
            apiPost("createTDiagram",{"name":$scope.title,"description":$scope.description ? $scope.description : ""})
             .success(function(data) {
               if(data.result == "FAILED"){
                 $scope.error = "ERRORS.SERVERERROR";
               }
               if(data.result == "OK"){
                 deferred.resolve(data.diagram);
                 $mdDialog.hide();
                 self.diagrams.unshift(data.diagram);
         self.openDiagram(data.diagram);
               }
             })
             .error(function(data, status, headers, config) {
                $scope.error = "ERRORS.SERVERERROR";
             });
          };
          $scope.cancel = function() {
            $mdDialog.cancel();
            deferred.reject("canceled"); 
          };
        }
      });
      return deferred.promise;       
    };

    self.editDiagram = function (d,ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/tdiag/newdiagram.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.caption = $translate.instant("TDIAG.EDITDIAGRAM");
          $scope.title = d.Name;
          $scope.description = d.Description;
          $scope.hide = function() {
            apiPost("saveTDiagram",{"id":d.ID, "name":$scope.title,"description":$scope.description ? $scope.description : "", JSON:d.JSON})
             .success(function(data) {
               if(data.result == "OK"){
                 self.loadFromServer();
                 $mdDialog.hide();
                 deferred.resolve("OK");
               }
             });
          };
          $scope.cancel = function() {
            $mdDialog.cancel();
            deferred.reject("canceled"); 
          };
        }
      });
      return deferred.promise;    
    };

    self.deleteDiagram = function(d,ev){
      var deferred = $q.defer();
      var confirm = $mdDialog.confirm();
      confirm.title($translate.instant("TDIAG.DELETEDIAGRAM"));
      confirm.htmlContent($translate.instant("TDIAG.DELETEDIAGRAMASK",{'NAME':d.Name}) );
      confirm.ariaLabel($translate.instant("TDIAG.DELETEDIAGRAM"));
      confirm.ok($translate.instant("DELETE"));
      confirm.cancel($translate.instant("CANCEL"));
      confirm.targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        apiPost("deleteTDiagram",{"id":d.ID})
         .success(function(data) {
           if(data.result == "OK"){
             // close tab 
             self.closeDiagram(d,ev);
             self.loadFromServer();
             deferred.resolve("deleted"); 
           }
         });
      });     
      return deferred.promise;       
    };

    self.downloadDiagramFromTab = function(tab,ev){
      if(!tab) return;
      for(var i=0; i < self.diagrams.length; i++){
        if(self.diagrams[i].ID == tab.ID){
          var d = self.diagrams[i];
          self.downloadDiagram(d,ev);
          return;
        }
      }
    }

    self.downloadDiagram = function(d,ev){
      var diagram = {"name":d.Name, "description":d.Description, "diagram":JSON.parse(d.JSON)};
      var compilers = [];
      var download = [];
      var elements = JSON.parse(d.JSON);
      var saved = false;
      function saveFileNow(){
        if(saved) return; 
        saved = true;
        diagram.compilers = compilers;
        var file = new Blob([JSON.stringify(diagram, null, 2)], {type: "text/json;charset=utf-8"});  
        saveAs(file,"Diagram_"+d.Name+".json");
      }

      for(var i=0; i < elements.length; i++){
        if(!elements[i].preset && (elements[i].type == 'compiler' || elements[i].type == 'interpreter') && elements[i].source != ""){
          download.push({"id":elements[i].source,"e":elements[i]});
        }
      }
      // get all compilers  
      for(var i=0; i < download.length; i++){
        self.getCompilerFromServer(download[i].e).then(function(c){ 
          var r = {"id":c.ID, "name":c.Name, "type":c.Type, "jscode":c.codeParser, "input":c.InputLanguage, "output":c.OutputLanguage, "generator":c.Generator, "LastInput":c.LastInput, "compiler":JSON.parse(c.JSON)};
          compilers.push(r);
          var alldone = true;
          for(var i=0; i < download.length; i++) {
            if(download[i].id == c.ID) download[i].done = true;
            if(!download[i].done) alldone = false;
          }
          // check for complete
          if(alldone) saveFileNow();
        });
      }
      
      if(download.length == 0) saveFileNow();
    };

    self.showAlert = function(text,title,event){ 
      var alert = $mdDialog.alert({title:title?title:$translate.instant("HINT"), htmlContent:text, ok:$translate.instant("OK")});
      if(event) alert.targetEvent(event);
      return $mdDialog.show(alert);
    };

    self.uploadDiagram = function(e){
      var deferred = $q.defer();
      if(e.files.length == 0) return deferred.promise;
      var filename = e.files[0].name;
      var file = e.files[0];
      var reader = new FileReader();
      reader.onload = function(data){
        try{
          var d = JSON.parse(data.target.result);
          if(!d.diagram){
            self.showAlert($translate.instant("ERRORS.NOVALIDDIAGRAMFILE"));
            return deferred.promise;;
          }

          var oldnewIDs = [];
          var elements = d.diagram;
          var saved = false;

          function doSaveNow(){
            if(saved) return; 
            saved = true;
            apiPost("createTDiagram",{"name":d.name, "description":d.description, "JSON":JSON.stringify(d.diagram) })
            .success(function(data) {
              if(data.result == "OK"){
                // now update all compilers inside
                var j = JSON.parse(data.diagram.JSON);
                for(var i=0; i < j.length; i++){
                  if(j[i].type == "compiler" || j[i].type == "interpreter"){
                    for(var z=0; z < oldnewIDs.length; z++) 
                      if(oldnewIDs[z].old == j[i].source) j[i].source = oldnewIDs[z].new;
                  }
                }  
                data.diagram.JSON = angular.toJson(j);
                apiPost("saveTDiagram",{"id":data.diagram.ID, "name":data.diagram.Name, "description":data.diagram.Description, "JSON":data.diagram.JSON })
                 .success(function(sd) {
                   if(sd.result == "OK"){
                     self.diagrams.unshift(data.diagram);
                     self.openDiagram(data.diagram);
                     deferred.resolve("OK");
                   }
                 });
              }
            });
          }
          function saveCompiler(c){
            // store compile as new compiler and replace ID 
            apiPost("createCompiler",{"name":c.name, "type":c.type, "jscode":c.jscode, "input":c.input, "output":c.output, "generator":c.generator, "LastInput":c.LastInput, "JSON":JSON.stringify(c.compiler)}).success(function(data){ 
              var alldone = true;
              for(var i=0; i < oldnewIDs.length; i++) {
                if(oldnewIDs[i].old == c.id) oldnewIDs[i].new = data.compiler.ID;
                if(oldnewIDs[i].new == null) alldone = false;
              }
              // check for complete
              if(alldone) doSaveNow();
            });
          }
          
          for(var i=0; i < elements.length; i++){
            if(!elements[i].preset && (elements[i].type == 'compiler' || elements[i].type == 'interpreter') && elements[i].source != ""){
              var isThere = false;
              for(var z=0; z < oldnewIDs.length; z++){
                if(oldnewIDs[z].old == elements[i].source) isThere = true;
              }
              if(!isThere) oldnewIDs.push({"old":elements[i].source,"new":null, "e":elements[i]});
            }
          }
          
          for(var i=0; i < oldnewIDs.length; i++){
            for(var z=0; z < d.compilers.length; z++){
              if(d.compilers[z].id == oldnewIDs[i].old){
                saveCompiler(d.compilers[z]);
              }
            }
          }

          if(oldnewIDs.length == 0) doSaveNow();

        }catch(e){
          self.showAlert($translate.instant("ERRORS.FILEREADERROR"));
        }
      };
      reader.readAsText(file);
      $(e).val('');
      return deferred.promise;    
    };   
    
    self.duplicateDiagram = function(d,ev){
      var deferred = $q.defer();
      var oldnewIDs = [];
      // before we can duplicate the diagram we have to duplicate compilers used inside.
      var elements = JSON.parse(d.JSON);
      var duplicated = false;
      function doDuplicate(){
       if(duplicated) return;
       duplicated = true;
       apiPost("createTDiagram",{"name":d.Name, "description":d.Description, "JSON":d.JSON, "CreatedFrom":d.GUID })
        .success(function(data) {
          if(data.result == "OK"){
            // now update all compilers inside
            var j = JSON.parse(data.diagram.JSON);
            for(var i=0; i < j.length; i++){
              if(j[i].type == "compiler" || j[i].type == "interpreter"){
                for(var z=0; z < oldnewIDs.length; z++) 
                  if(oldnewIDs[z].old == j[i].source) j[i].source = oldnewIDs[z].new;
              }
            }  
            data.diagram.JSON = angular.toJson(j);
            apiPost("saveTDiagram",{"id":data.diagram.ID, "name":data.diagram.Name, "description":data.diagram.Description, "JSON":data.diagram.JSON })
             .success(function(sd) {
               if(sd.result == "OK"){
                 self.diagrams.unshift(data.diagram);
                 self.openDiagram(data.diagram);
                 deferred.resolve("OK");
               }
             });
          }
        });
      }

      function doCompilerClone(c){
        apiPost("createCompiler",{"name":c.Name, "type":c.Type, "jscode":c.codeParser, "input":c.InputLanguage, "output":c.OutputLanguage, "generator":c.Generator, "LastInput":c.LastInput, "JSON":c.JSON}).success(function(data){ 
          var alldone = true;
          for(var i=0; i < oldnewIDs.length; i++) {
            if(oldnewIDs[i].old == c.ID) oldnewIDs[i].new = data.compiler.ID;
            if(oldnewIDs[i].new == null) alldone = false;
          }
          // check for complete
          if(alldone) doDuplicate();
        });
      }

      for(var i=0; i < elements.length; i++){
        if(!elements[i].preset && (elements[i].type == 'compiler' || elements[i].type == 'interpreter') && elements[i].source != ""){
          var isThere = false;
          for(var z=0; z < oldnewIDs.length; z++){
            if(oldnewIDs[z].old == elements[i].source) isThere = true;
          }
          if(!isThere) oldnewIDs.push({"old":elements[i].source,"new":null, "e":elements[i]});
       }
      }
      for(var i=0; i < oldnewIDs.length; i++){
        self.getCompilerFromServer(oldnewIDs[i].e).then(function(r){ doCompilerClone(r); })
      }

      if(oldnewIDs.length == 0) doDuplicate();

      return deferred.promise;    
    };

    self.publishDiagram = function(a,ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/publishto.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.title = $translate.instant("TDIAG.PUBLISHTO");
          $scope.folderid = 0;
          $scope.folders = [];

          $scope.getFolders = function() {
            apiPost("getPublicFolders",{"all":1,"type":"diagram" })
             .success(function(data) {
               if(data.result == "OK"){
                 $scope.folders = data.folders;
                 if($scope.folders.length > 0) $scope.folderid = $scope.folders[0].ID; else $scope.folderid = 0;
               }
             });
          };
          $scope.getFolders();

          $scope.publish = function() {
            var params = {};
            if($scope.folderid != 0) 
              params.folderid = $scope.folderid; else
              params.foldername = $scope.newFolderName;

            params.id = a.ID;
   
            apiPost("publishTDiagram",params)
             .success(function(data) {
               if(data.result == "OK"){
                 $mdDialog.hide();
                 self.loadFromServer();
                 deferred.resolve("OK"); 
               }
             });
          };

          $scope.cancel = function() {
            $mdDialog.cancel();
            deferred.reject("canceled"); 
          };
        }
      });
      return deferred.promise;       
    };

    self.unpublishDiagram = function(a,ev){
      var deferred = $q.defer();
      apiPost("unpublishTDiagram",{"id":a.ID})
       .success(function(data) {
         if(data.result == "OK"){
           self.loadFromServer();
           deferred.resolve("OK"); 
         }
       });
      return deferred.promise;    
    };

    self.showPublishedDiagrams = function(ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/tdiag/published.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.folderid = 0;
          $scope.folders = [];

          apiPost("getPublicFolders",{"type":"diagram","needsOnline":1})
           .success(function(data) {
             if(data.result == "OK"){
               $scope.folders = data.folders;
             }
           });

          $scope.openDiagram = function(item){
            $window.open('/T'+item.GUID, '_blank');
          };

          $scope.duplicate = function(item){
            self.duplicateDiagram(item);
            $mdDialog.hide();
          };

          $scope.openFolder = function(f){
            for(var i=0; i < $scope.folders.length; i++) {
              $scope.folders[i].open = false;
            }
            if(f) {
              f.open = true;

              apiPost("getTDiagrams",{"public":1, "folderid":f.ID, "needsOnline":1}).success(function(data){
                if(data.result == "OK"){
                  $scope.items = data.diagrams;
                  for(var i=0; i < $scope.items.length; i++){
                    $scope.items[i].lastChange = function(){ return moment(this.Changed).fromNow();};
                    $scope.items[i].thumbElements = JSON.parse($scope.items[i].JSON);
            
                    var minX = 100000;
                    var minY = 100000;
                    for(var z=0; z < $scope.items[i].thumbElements.length; z++){ 
                      var e = $scope.items[i].thumbElements[z];
                      minX = Math.min(e.x,minX);
                      minY = Math.min(e.y,minY);
                    }
                    minX -= 10;
                    minY -= 10;
                    for(var z=0; z < $scope.items[i].thumbElements.length; z++){ 
                      var e = $scope.items[i].thumbElements[z];
                      e.x -= minX;
                      e.y -= minY;
                    }
                  }

                }
              });

            }
          };

          $scope.cancel = function() {
            $mdDialog.cancel();
            deferred.reject("canceled"); 
          };
        }
      });
      return deferred.promise;      
    };

    self.getWeblink = function(d,ev){
      $mdDialog.show({
        templateUrl: "views/weblink.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.weblink = 'https://flaci.com/T'+d.GUID;
        }
      });
    };

    self.goToMy = function(){
      $location.path('/tdiag');
    };

    self.sharedDiagrams = [];

    if($routeParams && $routeParams.diagramGUID){  
      apiPost("getTDiagrams",{"GUID":$routeParams.diagramGUID, "needsOnline":1}).success(function(data){
        if(data.result == "OK" && data.diagrams.length == 1){

          if(self.userLogin.user && data.diagrams[0].Owner == self.userLogin.user.ID){
            self.openDiagram(data.diagrams[0]);
            return;
          }
          apiPost("getTDiagrams",{}).success(function(data2){
            if(data2.diagrams)
            for(var i=0; i < data2.diagrams.length; i++){
               if(data2.diagrams[i].CreatedFrom == $routeParams.diagramGUID){
                data2.diagrams[i].grammar = JSON.parse(data2.diagrams[i].JSON);
                self.openDiagram(data2.diagrams[i]);

                // ask to use own copy or start over
                var conf = $mdDialog.confirm({title:$translate.instant("HINT"), htmlContent:$translate.instant("ASKMAKEANOTHERCOPY"), ok:$translate.instant("MAKEANOTHERCOPY"), cancel:$translate.instant("USEEXISTINGCOPY")});
                $mdDialog.show(conf).then(function(){
                  self.duplicateDiagram(data.diagrams[0]).then(function(){ });
                });

                return;
              }
            }
            // does not yet exist, create a new copy
            self.duplicateDiagram(data.diagrams[0]).then(function(){ });
          });
        }
      });            
    }

    ////////////////////////////////////////////////////////////////////////
    self.runSelectedElements = function(diagram, elements){
      // pick runnable elements from left to right and top to down
      var picked = [];
      var allElements = elements.slice(0); 
      for(var i = 0; i < allElements.length; i++){
        if(allElements[i].dockedBottom){
          var db = diagram.getElementByID(allElements[i].dockedBottom);
          if((db.written == "JS") && db.code != "") if(picked.indexOf(db) == -1) picked.push(db);
          if(db.dockedBottom){
            var db2 = diagram.getElementByID(db.dockedBottom);
            if((db2.written == "JS") && db2.code != "") if(picked.indexOf(db2) == -1) picked.push(db2);
          }
          continue;
        }

        if(allElements[i].written == "JS") 
          if(picked.indexOf(allElements[i]) == -1) picked.push(allElements[i]);
      }
      picked.sort(function(a, b){
        if(a.x != b.x) return a.x - b.x;
        if(a.y != b.y) return a.y - b.y;
        return 0;
      });
      self.runElements(diagram,picked);    
    };
    ////////////////////////////////////////////////////////////////////////
    self.runElements = function(diagram, elements){
      diagram.addRunLog = function(s){
          var was = s;
          // remove non-printable characters for output log.
          var re = /[\0-\x08\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
          s = s.replace(re, "");
          if(s != was){
            // may be binary data, make it also HTML escaped
            s = s.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
          }
          this.runLog += (this.runLog != "" ? '\n':'')+s;
      }
      diagram.runLog = "";
      diagram.isLogSidebarOpen = true; 
      diagram.isComponentSidebarOpen = false;
      var downloadURLS = [];
      for(var z=0; z < diagram.elements.length; z++){
        if(diagram.elements[z].fromURL && diagram.elements[z].fromURL != "") {
           downloadURLS.push({e:diagram.elements[z],done:false});
        }
      }
      var es = elements.slice();
      function runIt(){
        if(es.length > 0){
          self.runElement(diagram, es[0]).then(function(out){
            diagram.addRunLog(out);
            es.splice(0,1);
            setTimeout(runIt,750);
          },function(out){
            diagram.addRunLog(out);
            es.splice(0,1);
            //stop here
            if(es.length == 0) runIt();
          });  
        }else{
          // we are done
          if(diagram.runLog == "") diagram.runLog = $translate.instant("TDIAG.NORUNNABLECONTENT");
        }
      }
      if(downloadURLS.length > 0){
        $(downloadURLS).each(function(i,item){
          var dt = item.e;
          $.get( dt.fromURL, {}, function( data ) {
            dt.code = data;
            item.done = true;
            // check all done
            for(var i=0; i < downloadURLS.length; i++){
              if(!downloadURLS[i].done) return;
            }
            // all done
            runIt();
          },"text").fail(function(){
            item.done = true;
            // check all done
            for(var i=0; i < downloadURLS.length; i++){
              if(!downloadURLS[i].done) return;
            }
            // all done
            runIt();
          });            
        });
      } else runIt();
    };
    ////////////////////////////////////////////////////////////////////////
    // run diagram element
    ////////////////////////////////////////////////////////////////////////
    self.runElement = function(diagram, e){
      var deferred = $q.defer();

      var runLog = [];
       
      function runCodeElement(src, input, argIn){
        try{
          //return (new Function("input", src)).call({}, input);
          var runOutput = (new Function("input","argument", src)).call({},input, argIn);
          console.log(runOutput);
          if(typeof runOutput != "string") runOutput = JSON.stringify(runOutput);
          runLog.push($translate.instant("TDIAG.OUTPUT")+"\n"+runOutput);
        }catch(e){ 
          runOutput = e+"";
          console.log(runOutput);
          runLog.push($translate.instant("TDIAG.OUTPUT")+"\n"+runOutput);
        }
        return runOutput;
      }

      function getLokalCompilerCode(e){ // TODO:
        for(var i=0; i < self.compilers.length; i++)
          if(e.source == self.compilers[i].ID){
            if(e.written == "TDL") return self.compilers[i].JSON; // provide plain VCC JSON 
          }
        return "";
      }

      function runCompiler(e, input, generator, argIn) {
        var deferred = $q.defer();
        var runOutput="";

        if(e.type == "compiler")
          runLog.push($translate.instant("TDIAG.LOGCOMPILERRUN",{'COMPILER':"("+e.input+" ⇒ "+e.output+", "+e.written+")"}));
        if(e.type == "interpreter")
          runLog.push($translate.instant("TDIAG.LOGINTERPRETERRUN",{'INTERPRETER':e.input}));
        // already compiled, just use it
        if(e.written == "JS" && !e.preset){
          try{
            var src = e.code;
            src = "var input = '"+escapeJavaScriptString(input)+"';\n" + src + " return parser.parse(input);";
            var out = (new Function("input","argument",src)).call({},input,argIn);
            console.log(out);
            if(typeof out != "string") out = JSON.stringify(out);

            if(out.match("Jison generated parser")) 
              runLog.push($translate.instant("TDIAG.OUTPUT")+
                (e.type == "interpreter" ?
                  $translate.instant("TDIAG.LOGOUTPUTINTERPRETERVCC",{'INTERPRETER': e.input}) : 
                  $translate.instant("TDIAG.LOGOUTPUTCOMPILERVCC",{'COMPILER': e.input+" ⇒ "+e.output})
                )
              ); else
              runLog.push($translate.instant("TDIAG.OUTPUT")+"\n"+out);

            deferred.resolve(out); 

            return deferred.promise;

          }catch(e){ runOutput += e+"\n"; }
          
          if(runOutput != "") runLog.push($translate.instant("ERROR")+ ": "+runOutput);
          deferred.reject("");
          return deferred.promise;
        }

        self.getCompilerFromServer(e).then(function(compiler){
            var j = VCC2JISON(compiler.JSON);
            Jison.print = function print () {
              for(var i=0; i < arguments.length; i++)
                runOutput += arguments[i];
              runOutput += "\n";
            };
            var parser;
            try{

              var out = "";
              if(compiler.ID == "vcc" && generator == "LL1"){
                out = VCC2LL1Parser(input);
              }

              if(compiler.ID != "vcc" || (compiler.ID == "vcc" && generator == "LALR")){
                parser = Jison.Generator(j, {type: "lalr"}); // noDefaultResolve:true
              
                var p = parser.generate({moduleType:"js", globalCode:j.globalCode});
                src = p;
                src = "var input = '"+escapeJavaScriptString(input)+"';\n" + src + " return parser.parse(input);";
                out = (new Function("input","argument",src)).call({},input,argIn);

              }

              console.log(out);
              if(typeof out != "string") out = JSON.stringify(out);

              var ct = null;
              if(e.dockedRight){
                ct = diagram.getElementByID(e.dockedRight);
              }

              if(out.match("Jison generated parser") || out.match("FLACI generated parser")) 
                runLog.push($translate.instant("TDIAG.OUTPUT")+
                
                (compiler.Type == "interpreter" ?
                $translate.instant("TDIAG.LOGOUTPUTINTERPRETERVCC",{'INTERPRETER': ct ? ct.input : compiler.InputLanguage}) : 
                $translate.instant("TDIAG.LOGOUTPUTCOMPILERVCC",{'COMPILER': ct? ct.input +" ⇒ "+ct.output : compiler.InputLanguage+" ⇒ "+compiler.OutputLanguage})
                )); else
                runLog.push($translate.instant("TDIAG.OUTPUT")+"\n"+out);

              deferred.resolve(out);
              return;
            }catch(e){ runOutput += e+"\n"; }
            
            if(runOutput != "") runLog.push($translate.instant("ERROR")+ ": "+runOutput);
            deferred.reject("");
        });

        return deferred.promise;      
      }

      function placeOutput(e,out){
        if(e.dockedRight){
          var r = diagram.getElementByID(e.dockedRight);
          r.code = out; // place output as code for next brick 
          diagram.highlightRunElement(r);

          if(r.type == "compiler")
            runLog.push($translate.instant("TDIAG.LOGWRITECOMPILER",{'COMPILER':"("+r.input+" ⇒ "+r.output+", "+r.written+")"}));
          if(r.type == "interpreter")
            runLog.push($translate.instant("TDIAG.LOGWRITEINTERPRETER",{'INTERPRETER':r.input}));
          if(r.type == "program")
            runLog.push($translate.instant("TDIAG.LOGWRITEPROGRAM",{'PROGRAM':"("+r.name+", "+r.written+")"}));
          if(r.type == "ea")
            runLog.push($translate.instant("TDIAG.LOGWRITEIO",{'NAME':r.name}));
        }
      }

      if(e.type == "program"){ // try to run JavaScript
        diagram.highlightRunElement(e);

        var programInput = "";
        if(e.dockedLeft) {
          var dl = diagram.getElementByID(e.dockedLeft);
          // can only be E/A brick
          programInput = dl.code;
          diagram.highlightRunElement(dl);
          if(dl.type == "ea")
            runLog.push($translate.instant("TDIAG.LOGUSEIO",{'NAME':dl.name}));
        }      

        runLog.push($translate.instant("TDIAG.LOGRUNPROGRAM",{'NAME':e.Name}));
        var runOutput = runCodeElement(e.code,programInput);

        placeOutput(e,runOutput);

        deferred.resolve(runLog.join(' \n'));    
      }


      if(e.type == "compiler"){
        diagram.highlightRunElement(e);
        var compilerInput = "";
        var compilerGenerator = "LALR";

        var dl = null;
        if(e.dockedLeft) {
          dl = diagram.getElementByID(e.dockedLeft);
          if((dl.type == 'compiler' || dl.type == 'interpreter') && dl.source != "") dl.code = getLokalCompilerCode(dl);
          compilerInput = dl.code;
          compilerGenerator = dl.generator ? dl.generator : "LALR";
 
          diagram.highlightRunElement(dl);
          if(dl.type == "compiler")
            runLog.push($translate.instant("TDIAG.LOGCOMPILERUSE",{'COMPILER':"("+dl.input+" ⇒ "+dl.output+", "+dl.written+")"}));
          if(dl.type == "interpreter")
            runLog.push($translate.instant("TDIAG.LOGINTERPRETERUSE",{'INTERPRETER':dl.input}));
          if(dl.type == "program")
            runLog.push($translate.instant("TDIAG.LOGPROGRAMUSE",{'PROGRAM':"("+dl.name+", "+dl.written+")"}));
        }
         

        if(e.source != "" && (e.written != "JS" || e.preset )) {
          // direct run a system interpreter
          runCompiler(e,compilerInput,compilerGenerator).then(function(out){
            placeOutput(e,out);
            deferred.resolve(runLog.join(' \n'));    
          },function(){
            deferred.reject(runLog.join(' \n'));    
          });
        }else
        if(e.code && e.code != ""){
          // run
          if(e.type == "compiler")
            runLog.push($translate.instant("TDIAG.LOGCOMPILERRUN",{'COMPILER':"("+e.input+" ⇒ "+e.output+", "+e.written+")"})); else
          if(e.type == "interpreter")
            runLog.push($translate.instant("TDIAG.LOGINTERPRETERRUN",{'INTERPRETER':e.input+", "+e.written}));
            else
            runLog.push($translate.instant("TDIAG.LOGRUNELEMENT",{'NAME':e.Name}));
            
          var code = e.code  + "\nreturn parser.parse(input);";
          var out = runCodeElement(code,compilerInput);
          placeOutput(e,out);
          deferred.resolve(runLog.join(' \n'));    
        }            
      }


      if(e.type == "interpreter"){
        diagram.highlightRunElement(e);
        var interpreterInput = "";
        var compilerGenerator = "LALR";

        if(e.dockedTop) {
          var input = diagram.getElementByID(e.dockedTop);

          if((input.type == 'compiler' || input.type == 'interpreter') && input.source != "") input.code = getLokalCompilerCode(input);
          interpreterInput = input.code;
          compilerGenerator = input.generator ? input.generator : compilerGenerator;

          diagram.highlightRunElement(input);

/*
          if(input.type == "compiler")
            runLog.push($translate.instant("TDIAG.LOGCOMPILERUSE",{'COMPILER':"("+input.input+" ⇒ "+input.output+", "+input.written+")"}));
          if(input.type == "interpreter")
            runLog.push($translate.instant("TDIAG.LOGINTERPRETERUSE",{'INTERPRETER':dt.input}));
          if(input.type == "program")
            runLog.push($translate.instant("TDIAG.LOGPROGRAMUSE",{'PROGRAM':"("+dt.name+", "+dt.written+")"}));
*/         

          var interpreterInputLeft = "";

          if(input.dockedLeft) {
            var dl = diagram.getElementByID(input.dockedLeft);
            if((dl.type == 'compiler' || dl.type == 'interpreter') && dl.source != "") dl.code = getLokalCompilerCode(dl);

            interpreterInputLeft = dl.code;
            compilerGenerator = dl.generator ? dl.generator : compilerGenerator;

            diagram.highlightRunElement(dl);

            if(dl.type == "compiler")
              runLog.push($translate.instant("TDIAG.LOGCOMPILERUSE",{'COMPILER':"("+dl.input+" ⇒ "+dl.output+", "+dl.written+")"}));
            if(dl.type == "interpreter")
              runLog.push($translate.instant("TDIAG.LOGINTERPRETERUSE",{'INTERPRETER':dl.input}));
            if(dl.type == "program")
              runLog.push($translate.instant("TDIAG.LOGPROGRAMUSE",{'PROGRAM':"("+dl.name+", "+dl.written+")"}));
          }

          if(input.type == 'interpreter' && input.dockedTop) {
            var dt = diagram.getElementByID(input.dockedTop);
            if(dt.type == 'program'){
              interpreterInputLeft = dt.code;

//            interpreterInput = "var input = '"+escapeJavaScriptString(dt.code)+"';\n" + interpreterInput;
//            interpreterInput += "\nreturn parser.parse(input);";

              diagram.highlightRunElement(dt);

              runLog.push($translate.instant("TDIAG.LOGPROGRAMUSE",{'PROGRAM':"("+dt.name+", "+dt.written+")"}));
            }
          }

          if(input.type == "compiler")
            runLog.push($translate.instant("TDIAG.LOGCOMPILERUSE",{'COMPILER':"("+input.input+" ⇒ "+input.output+", "+input.written+")"}));
          if(input.type == "interpreter")
            runLog.push($translate.instant("TDIAG.LOGINTERPRETERUSE",{'INTERPRETER':input.input}));
          if(input.type == "program")
            runLog.push($translate.instant("TDIAG.LOGPROGRAMUSE",{'PROGRAM':"("+input.name+", "+input.written+")"}));

          if(e.source != "" && (e.written != "JS" || e.preset)){
            // direct run a system interpreter
            runCompiler(e,interpreterInput,compilerGenerator,interpreterInputLeft).then(function(out){
              placeOutput(input,out);
              deferred.resolve(runLog.join(' \n'));    
            },function(){
              deferred.reject(runLog.join(' \n'));    
            });
          }else
          if(e.code && e.code != ""){
            runLog.push($translate.instant("TDIAG.LOGRUNELEMENT",{'NAME':e.Name}));
            var code = e.code  + "\nreturn parser.parse(input);";
            var out = runCodeElement(code,interpreterInput,interpreterInputLeft);
            placeOutput(input,out);
            deferred.resolve(runLog.join(' \n'));    
          }            

        }

      }
      return deferred.promise;      
    };

    self.logPanelSize = 0;
    self.changeLogPanelSize = function(n){
      self.logPanelSize += n;
      if(self.logPanelSize > 2) self.logPanelSize = 2;
      if(self.logPanelSize < 0) self.logPanelSize = 0;
    };

    self.loadFromServer();

  });



