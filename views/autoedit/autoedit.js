function copyDivToClipboard(e) {
  var range = document.createRange();
  range.selectNode(e);
  window.getSelection().removeAllRanges(); // clear current selection
  window.getSelection().addRange(range); // to select text
  document.execCommand("copy");
  window.getSelection().removeAllRanges();// to deselect
}

app.controller('AutoEditController', function($scope, $location, $routeParams, $timeout, $interval, $mdDialog, $http, $mdMedia, $mdSidenav, $mdToast, $sce, $q, userLogin, $translate) { 
    var apiPost = function (url, data){
      if(userLogin.isOfflineMode && data.needsOnline != 1){
        // localStorage offline mode
        var deferred = $q.defer();
        deferred.promise.error = function(fn){ };
        deferred.promise.success = function (fn) {
          var result = {'result':'OK'};
          if(url == "createGrammar"){
            var d = localStorage.getItem("localGrammars");
            var grammars = JSON.parse(d ? d : "[]"); // default is array here
            var g = {ID:"local"+grammars.length, Name:data.name, Description:data.description, Title:data.title, Language:data.language, GrammarText:data.GrammarText ? data.GrammarText : '', JSON:data.JSON ? data.JSON : '{}',Changed : (new Date()).toMysqlFormat(), "CreatedFrom":data.CreatedFrom ? data.CreatedFrom : ''};
            grammars.push(g);
            result.grammar = g;
            localStorage.setItem("localGrammars",angular.toJson(grammars));
          }
          if(url == "saveGrammar"){
            var d = localStorage.getItem("localGrammars");
            var grammars = JSON.parse(d ? d : "[]"); // default is array here
            for(var i=0; i < grammars.length; i++){
              if(grammars[i].ID == data.id){
                grammars[i].Name = data.name;
                if(data.description)
                  grammars[i].Description = data.description;
                grammars[i].JSON = data.JSON;
                grammars[i].Language = data.language;
                grammars[i].GrammarText = data.GrammarText;
                grammars[i].Changed = (new Date()).toMysqlFormat();
                result.grammar = grammars[i];
              } 
            }
            localStorage.setItem("localGrammars",angular.toJson(grammars));
          }

          if(url == "getAutomatons"){
            var d = localStorage.getItem("localAutomatons");
            result.automatons = JSON.parse(d ? d : "[]"); // default is array here
            result.automatons.sort(function(a,b){ return a.Changed < b.Changed ? 1 : a.Changed > b.Changed ? -1 : 0; });
          }
          if(url == "createAutomaton"){
            var d = localStorage.getItem("localAutomatons");
            var automatons = JSON.parse(d ? d : "[]"); // default is array here
            var a = {ID:"local"+Math.ceil(Math.random()*99999999), Name:data.name, Description:data.description, Type:data.type, JSON:data.JSON ? data.JSON : '{}',Changed : (new Date()).toMysqlFormat(), "CreatedFrom":data.CreatedFrom ? data.CreatedFrom : ''};
            automatons.push(a);
            result.automaton = a;
            localStorage.setItem("localAutomatons",angular.toJson(automatons));
          }
          if(url == "saveAutomaton"){
            var d = localStorage.getItem("localAutomatons");
            var automatons = JSON.parse(d ? d : "[]"); // default is array here
            for(var i=0; i < automatons.length; i++){
              if(automatons[i].ID == data.id){
                automatons[i].Name = data.name;
                if(data.description)
                  automatons[i].Description = data.description;
                automatons[i].Type = data.type;
                automatons[i].JSON = data.JSON;
                automatons[i].Changed = (new Date()).toMysqlFormat();
                result.automaton = automatons[i];
              } 
            }
            localStorage.setItem("localAutomatons",angular.toJson(automatons));
          }
          if(url == "deleteAutomaton"){
            var d = localStorage.getItem("localAutomatons");
            var automatons = JSON.parse(d ? d : "[]"); // default is array here
            for(var i=0; i < automatons.length; i++){
              if(automatons[i].ID == data.id){
                automatons.splice(i,1);
                break;
              } 
            }
            localStorage.setItem("localAutomatons",angular.toJson(automatons));
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
    var parent = self;
    self.user = null;

    self.openTabs = [];
    self.automatons = [];
/*
    self.automata.push(
      {"ID":"1", "Name":"Beispiel DEA", "Type":"DEA",
       "JSON":JSON.stringify({
          "Alphabet":['a','b','c'],
          "States":[{"ID":"1","Name":"z1","x":"200","y":"200","Start":"true","Final":"false","Radius":"30","Transitions":[{"Source":"1","Target":"2","x":"0","y":"0","Labels":['a']}]},
                    {"ID":"2","Name":"z2","x":"350","y":"200","Start":"false","Final":"true","Radius":"30","Transitions":[{"Source":"2","Target":"2","x":"0","y":"-50","Labels":['a']}]}
           ] 
       })
      });

    self.automata.push(
      {"ID":"2", "Name":"Beispiel NEA", "Type":"NEA",
       "JSON":JSON.stringify({
          "Alphabet":['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'],
          "States":[{"ID":"1","Name":"z1","x":"100","y":"100","Start":"true","Final":"true","Radius":"30","Transitions":[{"Source":"1","Target":"2","x":"50","y":"0","Labels":['a']}]},
                    {"ID":"2","Name":"z2","x":"300","y":"100","Start":"false","Final":"false","Radius":"30","Transitions":[{"Source":"2","Target":"1","x":"50","y":"0","Labels":['c']}]},
                    {"ID":"3","Name":"z3","x":"300","y":"300","Start":"false","Final":"false","Radius":"30","Transitions":[{"Source":"3","Target":"1","x":"0","y":"0","Labels":['a','b','c']},{"Source":"3","Target":"2","x":"0","y":"0","Labels":[]}]}] 
       })
      });

    self.automata.push(
      {"ID":"3", "Name":"Beispiel DKA", "Type":"DKA",
       "JSON":JSON.stringify({
          "Alphabet":["a","b","c","d","e","f"],
          "StackAlphabet":['$','I'], 
          "States":[{"ID":"1","Name":"z1","x":"100","y":"100","Start":"true","Final":"true","Radius":"30","Transitions":[{"Source":"1","Target":"2","x":"50","y":"0","Labels":[['$','a',[]]]}]},
                    {"ID":"2","Name":"z2","x":"300","y":"100","Start":"false","Final":"false","Radius":"30","Transitions":[{"Source":"2","Target":"1","x":"50","y":"0","Labels":[['$','a',[]]]}]},
                    {"ID":"3","Name":"z3","x":"300","y":"300","Start":"false","Final":"false","Radius":"30","Transitions":[{"Source":"3","Target":"1","x":"0","y":"100","Labels":[['$','a',[]]]}]}] 
       })
      });

    self.automata.push(
      {"ID":"4", "Name":"Beispiel NKA", "Type":"NKA",
       "JSON":JSON.stringify({
          "Alphabet":["a","b","c","d","e","f"],
          "StackAlphabet":['$','I'], 
          "States":[{"ID":"1","Name":"z1","x":"100","y":"100","Start":"true","Final":"true","Radius":"30","Transitions":[{"Source":"1","Target":"2","x":"50","y":"0","Labels":[['$','a',[]]]}]},
                    {"ID":"2","Name":"z2","x":"300","y":"100","Start":"false","Final":"false","Radius":"30","Transitions":[{"Source":"2","Target":"1","x":"50","y":"0","Labels":[['$','a',[]]]}]},
                    {"ID":"3","Name":"z3","x":"300","y":"300","Start":"false","Final":"false","Radius":"30","Transitions":[{"Source":"3","Target":"1","x":"0","y":"100","Labels":[['$','a',[]]]}]}] 
       })
      });

    self.automata.push(
      {"ID":"5", "Name":"Beispiel TM", "Type":"TM",
       "JSON":JSON.stringify({
          "Alphabet":["a","b"],
          "States":[{"ID":"1","Name":"z1","x":"100","y":"100","Start":"true","Final":"false","Radius":"30","Transitions":[{"Source":"1","Target":"2","x":"0","y":"0","Labels":[['a','b','R'],['b','a','R']]}]},
                    {"ID":"2","Name":"z2","x":"300","y":"100","Start":"false","Final":"true","Radius":"30","Transitions":[]}] 
       })
      });
*/
    self.$location = $location;
    self.$mdMedia = $mdMedia;
    self.console = window.console;
    self.userLogin = userLogin;
    self.isSmallScreen = function() { return $mdMedia('sm'); };
    self.limitTextLength = function(s,len){
      if(!s) return "";
      if(s.length > len) {
        var r = s.substring(0,len);
        r += "...";
        return r;
      } else return s;
    };
    
    $scope.updateSavedJSON = function(a,json){
      for(var i=0; i < self.automatons.length; i++){
        if(self.automatons[i].ID == a.ID){
          self.automatons[i].JSON = json;
          self.buildThumbAutomaton(self.automatons[i]);
        }
      }
    };
    
    $(document).on("keypress",function(e){
      $scope.$apply(function(){
        for(var i=0; i < self.openTabs.length; i++){
          self.openTabs[i].handleKeyboardInput(e);
        }
      });      
    });
    $(document).on("paste",function(e){
      $scope.$apply(function(){
        for(var i=0; i < self.openTabs.length; i++){
          self.openTabs[i].handleKeyboardPasteInput(e);
        }
      });      
    });
    

    self.userLogin.autoLogin().success(function(){ self.loadFromServer(); }); 

   
    ////////////////////////////////////////////////////////////////////////////////
    // Main model class for Automaton
    ////////////////////////////////////////////////////////////////////////////////
    function AAutomaton (a, noSave){
      var self = this;
      self.automaton = null; 
      self.ID = a.ID;
      self.Type = a.Type;
      self.Name = a.Name;
      self.Description = a.Description;
      self.stateRadius = 30;
      self.automatonGraphZoom = 100;

      self.States = {}; // local ID based reference array to self.automaton.States

      self.userAlphabet = [];
      self.userAlphabetInput = "";
      self.userStackAlphabet = [];
      self.userStackAlphabetInput = "";
      self.selectedAlphabet = "";
      self.selectedStackAlphabet = "";

      self.transitionCircleMode = false;
      self.transitionClickMode = false;
      self.isLabelChooseOpen = false;
      self.isStateChooseOpen = false;
      self.openLabelChoosePosition = {x:0,y:0};
      self.openStateChoosePosition = {x:0,y:0};
      self.openStateChooseState = null;

      self.selectedTransition = null;
      self.selectedState = null;
      
      self.selectedTab = 0; // left side 
      self.selectedTab2 = -1; // right side
      
      self.history = []; // for undo and save
      self.historyPointer = 0;
      self.isSavedToServer = false;
      

      self.handleKeyboardInputCharacter = function(c){
        for(var i=0; i < self.automaton.Alphabet.length; i++){
          if(self.automaton.Alphabet[i] == c){
            self.automaton.simulationInput.push(self.automaton.Alphabet[i]); 
            self.makeUndoStep();
            return;
          }
        }
        // maybe we get a other case match
        for(var i=0; i < self.automaton.Alphabet.length; i++){
          if(self.automaton.Alphabet[i].toLowerCase() == c.toLowerCase()){
            self.automaton.simulationInput.push(self.automaton.Alphabet[i]); 
            self.makeUndoStep();
            return;
          }
        }
      };
      
      self.handleKeyboardPasteInput = function(e){
        if(self.isSimulationInputKeyboardOpen){
          var text = e.originalEvent.clipboardData.getData('text');
          for(var i=0; i < text.length; i++) self.handleKeyboardInputCharacter(text[i]);
        }
      };

      self.handleKeyboardInput = function(e){
        if(self.isSimulationInputKeyboardOpen){
          // try input by keyboard
          var c = String.fromCharCode(e.which);
          self.handleKeyboardInputCharacter(c);
        }
      };

      self.toJSON = function(){
        var s = angular.toJson(self.automaton);
        // clear temp data from json
        var t = JSON.parse(s);
        for(var i=0; i < t.States.length; i++){ 
          delete t.States[i].hasError;
          delete t.States[i].play;
          for(var z=0; z < t.States[i].Transitions.length; z++){
            delete t.States[i].Transitions[z].hasError;
            delete t.States[i].Transitions[z].pathPoints;
            delete t.States[i].Transitions[z].textPoint;
            delete t.States[i].Transitions[z].arrowPoints;
            delete t.States[i].Transitions[z].textAlign;
            delete t.States[i].Transitions[z].textVAlign;
            delete t.States[i].Transitions[z].hasLabelErrors;
            delete t.States[i].Transitions[z].playLabel;
            delete t.States[i].Transitions[z].play;
            delete t.States[i].Transitions[z].openLabelStackAlphabet;

          }
        }
        return angular.toJson(t);
      };

      self.saveToServer = function(){
        // lazy save with 1 sec debounce 
        // push s to server as current save state of automaton
        self.isSavedToServer = false;
        var s = self.toJSON();
        apiPost("saveAutomaton",{id:self.ID, name:self.Name, type:self.Type, JSON:s})
         .success(function(data){ if(data.result == "OK") { self.isSavedToServer = true; }});
        $scope.updateSavedJSON(a, s);
      };

      self.makeUndoStep = function(){
        if(self.isUndo) return; // not create new steps while performing an undo
        var s = self.toJSON();
        // check if it is already in history 
        if(self.history.length == 0 || s != self.history[self.historyPointer].JSON){
          self.history = self.history.slice(0,self.historyPointer+1);
          self.history.push({JSON:s,Type:self.Type}); 
          if(self.history.length > 50) self.history = self.history.slice(self.history.length-50);
          self.historyPointer = self.history.length-1;
 
          // push s to server as current save state of automaton
          if(self.history.length > 1) waitOneSecond(self.saveToServer,3000);
        }
      };

      self.undo = function (){
        if(self.historyPointer <= 0) return; // nothing to undo;
        self.historyPointer--;
        var s = self.history[self.historyPointer];
        self.isUndo = true;
        self.loadFromJSONString(s.JSON,s.Type,true);
        waitOneSecond(self.saveToServer,3000);
        console.log("Undo to step "+self.historyPointer+" of "+self.history.length);
        console.log(self.history);
        self.isUndo = false;
      };

      self.redo = function (){
        if(self.historyPointer >= self.history.length-1) return; // nothing to redo;
        self.historyPointer++;
        var s = self.history[self.historyPointer];
        self.isUndo = true;
        self.loadFromJSONString(s.JSON,s.Type,true);
        waitOneSecond(self.saveToServer,3000);
        console.log("Undo to step "+self.historyPointer+" of "+self.history.length);
        console.log(self.history);
        self.isUndo = false;
      };

      self.loadFromJSONString = function(s,t){
        self.automaton = JSON.parse(s); 
        self.Type = t;
        self.selectedAlphabet = "";
        self.selectedStackAlphabet = "";
        self.initAutomaton();
      };

      self.initAutomaton = function(){
        if(!self.automaton.acceptCache) self.automaton.acceptCache = [];
        if(!self.automaton.simulationInput) self.automaton.simulationInput = [];
        if(!self.automaton.Alphabet) {self.automaton.Alphabet = []; self.selectedAlphabet = "A0"; }
        if(!self.automaton.StackAlphabet) { self.automaton.StackAlphabet = []; self.selectedStackAlphabet = "A0"; }
        if(!self.automaton.States) {
          self.automaton.States = [];
          self.addState();
          self.selectedTab = 1;
        }
        self.bindStates();
        self.parseUserAlphabet();
        self.updatePoints();
        self.checkAutomaton();
        // we checked, try to create an undo step
        if(!noSave) self.makeUndoStep();
      };

      self.generateSVG = function(){
        var s = document.getElementById("svg"+self.ID);
        var svg = s.cloneNode(true);
        s.parentNode.appendChild(svg);

        var emptySvgDeclarationComputed = getComputedStyle($('#emptysvg')[0]);

        function explicitlySetStyle (element) {
          var cSSStyleDeclarationComputed = getComputedStyle(element);
          var i, len, key, value;
          var computedStyleStr = "";
          for (i=0, len=cSSStyleDeclarationComputed.length; i<len; i++) {
            key=cSSStyleDeclarationComputed[i];
            value=cSSStyleDeclarationComputed.getPropertyValue(key);
            if (value!==emptySvgDeclarationComputed.getPropertyValue(key)) {
              computedStyleStr+=key+":"+value+";";
            }
          }
          element.setAttribute('style', computedStyleStr);
          if(element.className.baseVal == "transitionHiddenLine") element.setAttribute('style', "display:none");
        }

        function undoExplicitlySetStyle (element) {
          element.setAttribute('style', "");
        }

        function traverse(tree,obj){
          tree.push(obj);
          if (obj.hasChildNodes()) {
            var child = obj.firstChild;
            while (child) {
              if (child.nodeType === 1 && child.nodeName != 'SCRIPT'){
                traverse(tree,child);
              }
              child = child.nextSibling;
            }
          }
          return tree;
        }
        // hardcode computed css styles inside svg
        var allElements = traverse([],svg);
        var i = allElements.length;
        while (i--) explicitlySetStyle(allElements[i]);

        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(svg);

        var i = allElements.length;
        while (i--) undoExplicitlySetStyle(allElements[i]);

        //add name spaces.
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
          source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
          source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }
        source = source.replace(/ ng-[^=]+=["][^"]*["]/g,"");
        source = source.replace(/<!--[\s\S]*?-->/g,"");
        source = source.replace(/[\n\r\t]/g,"");

        source = source.replace(/<[^>]*class="transitionHiddenLine"[^>]*>/g,"");
        source = source.replace(/<[^>]*class="stateHiddenCircle"[^>]*>/g,"");
        source = source.replace(/<[^>]*class="stateHiddenOuterCircle"[^>]*>/g,"");

        //add xml declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        //convert svg source to URI data scheme.
        var s = btoa(unescape(encodeURIComponent(source)));
        
        var url = "data:image/svg+xml;base64,"+s;
        svg.parentNode.removeChild(svg);
        return url;
      };
      
      self.downloadSVG = function(){
        /*
        var svg = self.generateSVG();
        var element = document.createElement('a');
        element.setAttribute('href', svg); 
        element.setAttribute('download', self.Name+".svg");
        element.style.opacity = 0.01;
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
        */
        
        var svg = self.generateSVG();
        var element = document.createElement('div');
        element.style.opacity = 0.01;
        document.body.appendChild(element);
        
        Pablo(element).load(svg,function(s){
          //s.viewbox([0, 0, 1000, 500]);
          var bb = s.get(0).getBBox();
          s.viewbox([bb.x-10,bb.y-10,bb.x+bb.width+10,bb.y+bb.height+10]);
          s.download("svg",self.Name+".svg",function(){
            document.body.removeChild(element);
          });
        });        
      };

      self.downloadPNG = function(){
        var svg = self.generateSVG();
        var element = document.createElement('div');
        element.style.opacity = 0.01;
        document.body.appendChild(element);
        
        Pablo(element).load(svg,function(s){
          //s.viewbox([0, 0, 1000, 500]);
          var bb = s.get(0).getBBox();
          s.viewbox([bb.x-10,bb.y-10,bb.x+bb.width+10,bb.y+bb.height+10]);
          s.download("png",self.Name+".png",function(){
            document.body.removeChild(element);
          });
        });
      };

      self.autoLayout = function(){
        if(!noSave) self.makeUndoStep();

        var r = autoLayoutAutomaton(JSON.parse(self.toJSON()),false);
        if(r.result == "OK"){
          self.automaton = r.automaton;
          self.bindStates();
          self.updatePoints();
          self.checkAutomaton();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.combineTwoEA = function(ev){
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }

        self.selectOtherAutomaton(ev,["DEA"],true).then(function(a2){
          var automaton2 = JSON.parse(a2.JSON);
          var r = combineEA(self.automaton,automaton2);
          if(r.result == "OK"){
             r = autoLayoutAutomaton(r.automaton,false);
          }
          if(r.result == "OK"){
            if(!noSave) self.makeUndoStep();
            self.automaton = r.automaton;
            self.bindStates();
            self.updatePoints();
            self.checkAutomaton();
            if(!noSave) self.makeUndoStep();
          }
        });
      };

      self.transformMinimalDEA = function(){
        if(self.Type == "NEA") {
          self.transformNEAtoDEA();
          return;
        }
        if(self.Type != "DEA") {
          self.showAlert($translate.instant("ERRORS.NODEA"));
          return;
        }
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }
        var auto = JSON.parse(self.toJSON());

        if(self.automaton.allowPartial){
          var r = completeDEA(auto);
          auto = r.automaton;
        }  

        if(!noSave) self.makeUndoStep();
        var r = DEAtoMinimalDEA(auto);
//        if(r.result == "OK"){
//           r = deleteUnusedStates(r.automaton);
//        }
        if(r.result == "OK"){
           r = autoLayoutAutomaton(r.automaton,false);
        }
        if(r.result == "OK"){
          self.automaton = r.automaton;
          self.bindStates();
          self.updatePoints();
          self.checkAutomaton();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.transformNEAeToNEA = function(){
        if(self.Type != "NEA" && self.Type != "DEA") {
          self.showAlert($translate.instant("ERRORS.NOEA"));
          return;
        }
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = removeEpsilonNEA(JSON.parse(self.toJSON()));
//        if(r.result == "OK"){
//           r = deleteUnusedStates(r.automaton);
//        }
        if(r.result == "OK"){
           r = autoLayoutAutomaton(r.automaton,false,true);
        }
        if(r.result == "OK"){
          self.automaton = r.automaton;
          //self.Type = "NEA";
          self.bindStates();
          self.updatePoints();
          self.checkAutomaton();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.transformNEAtoDEA = function(){
        if(self.Type != "NEA" && self.Type != "DEA") {
          self.showAlert($translate.instant("ERRORS.NOEA"));
          return;
        }
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }

        var r = NEAtoDEA(JSON.parse(self.toJSON()));
/*
        var r = removeEpsilonNEA(JSON.parse(self.toJSON()));
        if(r.result == "OK"){
           r = NEAtoDEA(r.automaton);
        }
        if(r.result == "OK"){
           r = deleteUnusedStates(r.automaton);
        }
        if(r.result == "OK"){
           r = DEAtoMinimalDEA(r.automaton);
        }
*/
        if(r.result == "OK"){
           r = autoLayoutAutomaton(r.automaton,true);
        }
        if(r.result == "OK"){

          // use r.automaton 
          apiPost("createAutomaton",{"name":self.Name, "type":"DEA"})
            .success(function(data) {
              if(data.result == "FAILED"){
                alert($translate.instant("ERRORS.ERRORCREATINGAUTOMATON"));
              }
              if(data.result == "OK"){
             
                apiPost("saveAutomaton",{"id":data.automaton.ID, "name":data.automaton.Name, 
                                         "description":data.automaton.Description,
                                         "type":data.automaton.Type, JSON:angular.toJson(r.automaton)})
                 .success(function(res){ if(res.result == "OK") {
                  // open it
                  data.automaton.JSON = angular.toJson(r.automaton);
                  parent.automatons.unshift(data.automaton);
                  parent.openAutomaton(data.automaton);
                }});
              }
            })
            .error(function(data, status, headers, config) {
              alert($translate.instant("ERRORS.SERVERERROR"));
            });      
        }
      };

      self.transformDEAtoNEA = function(){
        if(self.Type != "NEA" && self.Type != "DEA") {
          self.showAlert($translate.instant("ERRORS.NOEA"));
          return;
        }
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }

        var r = removeTrapStates(JSON.parse(self.toJSON()));
        if(r.result == "OK"){
          // use r.automaton 
          apiPost("createAutomaton",{"name":self.Name, "type":"NEA"})
            .success(function(data) {
              if(data.result == "FAILED"){
                alert($translate.instant("ERRORS.ERRORCREATINGAUTOMATON"));
              }
              if(data.result == "OK"){
             
                apiPost("saveAutomaton",{"id":data.automaton.ID, "name":data.automaton.Name, 
                                         "description":data.automaton.Description,
                                         "type":data.automaton.Type, JSON:angular.toJson(r.automaton)})
                 .success(function(res){ if(res.result == "OK") {
                  // open it
                  data.automaton.JSON = angular.toJson(r.automaton);
                  parent.automatons.unshift(data.automaton);
                  parent.openAutomaton(data.automaton);
                }});
              }
            })
            .error(function(data, status, headers, config) {
              alert($translate.instant("ERRORS.SERVERERROR"));
            });      
        }
      };

      self.checkForFinalState = function(){
        for(var i=0; i < self.automaton.States.length; i++){
          if(self.automaton.States[i].Final == "true" || self.automaton.States[i].Final === true)
            return true;
        }
        self.showAlert($translate.instant("ERRORS.NEEDFINALSTATE"));
        return false;
      };

      self.completeDEA = function(){
        if(self.Type != "DEA" && self.Type != "MOORE") {
          self.showAlert($translate.instant("ERRORS.NOEA"));
          return;
        }
        if(!self.checkForFinalState()) return;

        if(!noSave) self.makeUndoStep();
        var r = completeDEA(JSON.parse(self.toJSON()));
        if(r.result == "OK"){
          self.automaton = r.automaton;
          self.bindStates();
          self.updatePoints();
          self.checkAutomaton();
          if(!noSave) self.makeUndoStep();
        }
      };
      self.completeMEALY = function(){
        if(self.Type != "MEALY") {
          self.showAlert($translate.instant("ERRORS.NOEA"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = completeMEALY(JSON.parse(self.toJSON()));
        if(r.result == "OK"){
          self.automaton = r.automaton;
          self.bindStates();
          self.updatePoints();
          self.checkAutomaton();
          if(!noSave) self.makeUndoStep();
        }
      };
      self.optimizeNEA = function(){
        if(self.Type != "NEA") {
          self.showAlert($translate.instant("ERRORS.NOEA"));
          return;
        }
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = cleanupNEA(JSON.parse(self.toJSON()));
        if(r.result == "OK"){
          self.automaton = r.automaton;
          self.bindStates();
          self.updatePoints();
          self.checkAutomaton();
          if(!noSave) self.makeUndoStep();
        }
      };
      
      self.NKA7to6tuple = function(){
        if(self.Type != "NKA") {
          self.showAlert($translate.instant("ERRORS.NOKA"));
          return;
        }
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = build6from7tupleKA(JSON.parse(self.toJSON()));
        if(r.result == "OK"){
          self.automaton = r.automaton;
          self.userStackAlphabetInput = self.automaton.StackAlphabet.join(",");
          self.bindStates();
          self.updatePoints();
          self.checkAutomaton();
          if(!noSave) self.makeUndoStep();
        }
      };      
      
      self.askRemoveTrapStates = function(){
        if(self.automaton.allowPartial && self.Type == "DEA"){
          var r = removeTrapStates(JSON.parse(self.toJSON()));
          if(r.result == "OK"){
            if(r.automaton.States.length != self.automaton.States.length){
              self.showConfirm($translate.instant("AUTOEDIT.ASKREMOVETRAPSTATES")).then(function(){
                self.automaton = r.automaton;
                self.bindStates();
                self.updatePoints();
                self.checkAutomaton();
                self.makeUndoStep();
              });
            }
          }
        }else{
          if(!self.correct){
            // ask for complete
            self.showConfirm($translate.instant("AUTOEDIT.CHECKASKTOCOMPLETE")).then(function(){
              // OK clicked
              if(self.Type == "DEA" || self.Type == "MOORE"){
                if(self.checkForFinalState())
                   self.completeDEA();
              }
              if(self.Type == "MEALY")
                self.completeMEALY();
            });
          }
        }
      };

      self.transformtoLatex = function(){
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }
        var auto = JSON.parse(self.toJSON());
        var a = {automaton:auto, type:self.Type, name:self.Name, description:self.Description};
        var r = automaton2latex(a);
        var alert = $mdDialog.alert({
          title: $translate.instant("AUTOEDIT.TRANSFORM.TRANSFORMTOLATEX"),
          htmlContent: $translate.instant("AUTOEDIT.TRANSFORM.TRANSFORMTOLATEXTEXT",{"CODE":'<span class="md-button md-primary md-raised"><i class="fa fa-copy"></i> Copy</span><br><br><span class="selectable prewrap">'+r+'</span>'}),
          clickOutsideToClose: true,
          ok: 'OK'
        });
        $mdDialog.show(alert);
        setTimeout(function(){
          $('md-dialog .md-button.md-raised').on("click",function(){
            copyDivToClipboard($('md-dialog .prewrap').get(0));
          });
        },100);
      };

      self.transformEAtoGrammar = function(){
        if(self.Type != "NEA" && self.Type != "DEA") {
          self.showAlert($translate.instant("ERRORS.NOEA"));
          return;
        }
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }
        var auto = JSON.parse(self.toJSON());
        
        /*
        if(self.Type == "DEA" && self.automaton.allowPartial){
          var r = completeDEA(auto);
          auto = r.automaton;
        }  
        */

        var r = ea2grammar(auto,self.Type);
        if(r.result == "OK" && r.grammar){
          // simplify right after transform?
//          r = cleanupGrammar(r.grammar);  
//          r = removeChainsGrammar(r.grammar);

          apiPost("createGrammar",{"name":self.Name, "language":"L"})
           .success(function(data) {
             if(data.result == "FAILED"){
              self.showAlert($translate.instant("ERRORS.SERVERERROR"));
             }
             if(data.result == "OK"){
               var pr = parseBNF(r.grammar);
               var g = {bnf:pr.bnf, lex:pr.lex, inputText:r.grammar, testInput:""}; 
               apiPost("saveGrammar",{id:data.grammar.ID, name:data.grammar.Name, JSON:angular.toJson(g), GrammarText:r.grammar, language: "L"})
               .success(function(data){ if(data.result == "OK") {
                // go to kfgEdit and open grammar
                $location.path("/kfgedit");
              }});
            }
          })
          .error(function(data, status, headers, config) {
            self.showAlert($translate.instant("ERRORS.SERVERERROR"));
          });  
        }
      };

      self.transformKAtoGrammar = function(){
        if(self.Type != "DKA" && self.Type != "NKA") {
          self.showAlert($translate.instant("ERRORS.NOKA"));
          return;
        }
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }

        var r = ka2grammar(JSON.parse(self.toJSON()),self.Type);
        if(r.result == "OK" && r.grammar){

          r = cleanupGrammar(r.grammar);  
          r = removeChainsGrammar(r.grammar);

          apiPost("createGrammar",{"name":self.Name, "language":"L"})
           .success(function(data) {
             if(data.result == "FAILED"){
              self.showAlert($translate.instant("ERRORS.SERVERERROR"));
             }
             if(data.result == "OK"){
               var input = self.automaton.simulationInput.join("");
               var pr = parseBNF(r.grammar);
               var g = {bnf:pr.bnf, lex:pr.lex, inputText:r.grammar, testInput:input}; 
               apiPost("saveGrammar",{id:data.grammar.ID, name:data.grammar.Name, JSON:angular.toJson(g), GrammarText:r.grammar, language: "L"})
               .success(function(data){ if(data.result == "OK") {
                // go to kfgEdit and open grammar
                $location.path("/G"+data.grammar.GUID);
              }});
            }
          })
          .error(function(data, status, headers, config) {
            self.showAlert($translate.instant("ERRORS.SERVERERROR"));
          });  
        }
      };

      self.transformEAtoRegExp = function(){
        if(self.Type != "NEA" && self.Type != "DEA") {
          self.showAlert($translate.instant("ERRORS.NOEA"));
          return;
        }
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }

        var auto = JSON.parse(self.toJSON());

        if(self.Type == "DEA" && self.automaton.allowPartial){
          var r = completeDEA(auto);
          auto = r.automaton;
        }  

        var r = ea2regex(auto,self.Type);
        if(r.result == "OK"){

          var alert = $mdDialog.alert({
            title: $translate.instant("REGEXPEDIT.REGEXP"),
            htmlContent: $translate.instant("AUTOEDIT.TRANSFORM.EATOREGEXPTEXT",{"REGEXP":'<span class="selectable LRPaddingSpan">'+r.regex+'</span>'})+"<br><br>"+'<a class="goToRegExp md-button md-primary">'+$translate.instant("REGEXPEDIT.OPENIN")+'</a>',
            clickOutsideToClose: true,
            ok: 'OK'
          });

          $mdDialog.show(alert);
          
          $timeout(function(){
            $('.goToRegExp').on("click",function(){
              $mdDialog.hide();
              $location.path('/regexp').search({s: r.regex});
            });
          },250)
        }
      };

      self.parseUserAlphabet = function(){
        var alphabets = [
          ["a","b","c"],
          ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'],
          ['0','1','2','3','4','5','6','7','8','9'],
          ['\u2665','\u2708','\u2709','\u270E', '\u2716', '\u2744']
        ];
        var stackAlphabets = [
          ["|"],
          ['0','a','b','c'],
          ['$','0','1','2','3','4','5','6','7','8','9'],
          ['\u25CF','\u2665','\u2708','\u2709','\u270E', '\u2716', '\u2744']
        ];

        if(self.selectedAlphabet == "" && self.automaton.Alphabet && self.automaton.Alphabet.length != 0){
          // try to map the given alphabets
          var n = self.automaton.Alphabet.join("");
          if(n == alphabets[0].join("")) self.selectedAlphabet = "A0"; else
          if(n == alphabets[1].join("")) self.selectedAlphabet = "A1"; else
          if(n == alphabets[2].join("")) self.selectedAlphabet = "A2"; else
          if(n == alphabets[3].join("")) self.selectedAlphabet = "A3"; else
          if(!$('#userAlphabetInput').is(":focus"))
            {self.selectedAlphabet = "A4"; self.userAlphabetInput = self.automaton.Alphabet.join(","); }
        }
        if(self.selectedStackAlphabet == "" && self.automaton.StackAlphabet && self.automaton.StackAlphabet.length != 0){
          // try to map the given alphabets
          var n = self.automaton.StackAlphabet.join("");
          if(n == stackAlphabets[0].join("")) self.selectedStackAlphabet = "A0"; else
          if(n == stackAlphabets[1].join("")) self.selectedStackAlphabet = "A1"; else
          if(n == stackAlphabets[2].join("")) self.selectedStackAlphabet = "A2"; else
          if(n == stackAlphabets[3].join("")) self.selectedStackAlphabet = "A3"; else
          if(!$('#userStackAlphabetInput').is(":focus"))
            {self.selectedStackAlphabet = "A4"; self.userStackAlphabetInput = self.automaton.StackAlphabet.join(","); }
        }

        if(self.selectedAlphabet == "A0") self.automaton.Alphabet = alphabets[0];
        if(self.selectedAlphabet == "A1") self.automaton.Alphabet = alphabets[1];
        if(self.selectedAlphabet == "A2") self.automaton.Alphabet = alphabets[2];
        if(self.selectedAlphabet == "A3") self.automaton.Alphabet = alphabets[3];
        if(self.selectedAlphabet == "A4"){
          self.userAlphabet = [];
          var parts = self.userAlphabetInput.split(",");
          for(var i=0; i < parts.length; i++){
            if(parts[i].trim() == "") continue; 
            if(self.userAlphabet.indexOf(parts[i].trim()) >= 0) continue;
            self.userAlphabet.push(parts[i].trim());
          }
          self.automaton.Alphabet = self.userAlphabet.slice(0);
        }
        if(!$('#userAlphabetInput').is(":focus"))
          self.userAlphabetInput = self.automaton.Alphabet.join(",");

        if(self.selectedStackAlphabet == "A0") self.automaton.StackAlphabet = stackAlphabets[0];
        if(self.selectedStackAlphabet == "A1") self.automaton.StackAlphabet = stackAlphabets[1];
        if(self.selectedStackAlphabet == "A2") self.automaton.StackAlphabet = stackAlphabets[2];
        if(self.selectedStackAlphabet == "A3") self.automaton.StackAlphabet = stackAlphabets[3];
        if(self.selectedStackAlphabet == "A4"){
          self.userStackAlphabet = [];
          var parts = self.userStackAlphabetInput.split(",");
          for(var i=0; i < parts.length; i++){
            if(parts[i].trim() == "") continue; 
            if(self.userStackAlphabet.indexOf(parts[i].trim()) >= 0) continue;
            self.userStackAlphabet.push(parts[i].trim());
          }
          self.automaton.StackAlphabet = self.userStackAlphabet.slice(0);
        }

        if(self.Type == "TM"){
          if(self.automaton.StackAlphabet.length == 0) self.automaton.StackAlphabet.push("$"); // suggestion
          // special case, Alphabet must be part of stackalphabet
          self.automaton.StackAlphabet = self.automaton.StackAlphabet.concat(self.automaton.Alphabet);
          // delete double entries
          for(var i=0; i<self.automaton.StackAlphabet.length; ++i) {
            for(var j=i+1; j<self.automaton.StackAlphabet.length; ++j) {
              if(self.automaton.StackAlphabet[i] === self.automaton.StackAlphabet[j])
                self.automaton.StackAlphabet.splice(j--, 1);
            }
          }
          self.userStackAlphabet = self.automaton.StackAlphabet.slice(0);
          self.selectedStackAlphabet = "A4";
        }

        if(!$('#userStackAlphabetInput').is(":focus"))
          self.userStackAlphabetInput = self.automaton.StackAlphabet.join(",");


        if(!self.automaton.simulationInput) self.automaton.simulationInput = [];
        // find and delete missing alphabet characters in simulation input
        for(var i=0; i < self.automaton.simulationInput.length; i++){
          if(self.automaton.Alphabet.indexOf(self.automaton.simulationInput[i]) == -1) {
            self.automaton.simulationInput.splice(i,1); i--;
          }
        }

        if(!self.automaton.lastInputs) self.automaton.lastInputs = [];
        for(var i=0; i < self.automaton.lastInputs.length; i++) {
          for(var z=0; z < self.automaton.lastInputs[i].length; z++){
            if(self.automaton.Alphabet.indexOf(self.automaton.lastInputs[i][z]) == -1) {
              self.automaton.lastInputs[i].splice(z,1); z--;
            }
          }
          if(self.automaton.lastInputs[i].length == 0){
            self.automaton.lastInputs.splice(i,1);
            i--;
          }
        }

        // find and delete missing alphabet characters in automaton
        for(var i=0; i < self.automaton.States.length; i++){
          var s = self.automaton.States[i];

          if(self.Type == "DEA" || self.Type == "NEA"){
            // check for characters not in Alphabet anymore
            for(var t=0; t < s.Transitions.length; t++){
              for(var l=0; l < s.Transitions[t].Labels.length; l++){
                if(s.Transitions[t].Labels[l] == "") continue; // epsilon case
                s.Transitions[t].Labels[l] += ''; // cast to string for sure
                if(self.automaton.Alphabet.indexOf(s.Transitions[t].Labels[l]) == -1){
                  s.Transitions[t].Labels.splice(l,1); l--;
                }
              }
            }
          }
          if(self.Type == "MOORE"){
            if(s.Output && s.Output != "" && self.automaton.StackAlphabet.indexOf(s.Output) == -1){
              self.automaton.StackAlphabet.push(s.Output);
              self.selectedStackAlphabet = "A4";
              if(!$('#userStackAlphabetInput').is(":focus")){
                self.userStackAlphabetInput = self.automaton.StackAlphabet.join(",");
                self.userStackAlphabet = self.automaton.StackAlphabet.slice(0);
              }
            }
          }
          if(self.Type == "MEALY"){
            // check for characters not in Alphabet anymore
            for(var t=0; t < s.Transitions.length; t++){
              for(var l=0; l < s.Transitions[t].Labels.length; l++){
                s.Transitions[t].Labels[l][1] += ''; // cast to string for sure
                if(s.Transitions[t].Labels[l][1] != "") // epsilon case
                  if(self.automaton.StackAlphabet.indexOf(s.Transitions[t].Labels[l][1]) == -1){
                    self.automaton.StackAlphabet.push(s.Transitions[t].Labels[l][1]);
                    self.selectedStackAlphabet = "A4";
                    if(!$('#userStackAlphabetInput').is(":focus")){
                      self.userStackAlphabetInput = self.automaton.StackAlphabet.join(",");
                      self.userStackAlphabet = self.automaton.StackAlphabet.slice(0);
                    }
                  }
              }
            }            
          }
          if(self.Type == "DKA" || self.Type == "NKA"){
            // check for characters not in Alphabet anymore
            for(var t=0; t < s.Transitions.length; t++){
              for(var l=0; l < s.Transitions[t].Labels.length; l++){
                s.Transitions[t].Labels[l][0] += ''; // cast to string for sure
                s.Transitions[t].Labels[l][1] += ''; // cast to string for sure
                if(s.Transitions[t].Labels[l][0] != "") // epsilon case
                  if(self.automaton.StackAlphabet.indexOf(s.Transitions[t].Labels[l][0]) == -1){
                    s.Transitions[t].Labels.splice(l,1); l--;
                    continue;
                  }

                if(s.Transitions[t].Labels[l][1] != "") // epsilon case
                  if(self.automaton.Alphabet.indexOf(s.Transitions[t].Labels[l][1]) == -1){
                    s.Transitions[t].Labels.splice(l,1); l--;
                    continue;
                  }

                for(var z=0; z < s.Transitions[t].Labels[l][2].length; z++){                  
                  s.Transitions[t].Labels[l][2][z] += ''; // cast to string for sure
                  if(self.automaton.StackAlphabet.indexOf(s.Transitions[t].Labels[l][2][z]) == -1){
                    s.Transitions[t].Labels.splice(l,1); l--;
                    break;
                  }
                }
              }
            }
          }
          if(self.Type == "TM"){
            // check for characters not in Alphabet anymore
            for(var t=0; t < s.Transitions.length; t++){
              for(var l=0; l < s.Transitions[t].Labels.length; l++){
                s.Transitions[t].Labels[l][0] += ''; // cast to string for sure
                s.Transitions[t].Labels[l][1] += ''; // cast to string for sure
                if(self.automaton.StackAlphabet.indexOf(s.Transitions[t].Labels[l][0]) == -1){
                  s.Transitions[t].Labels.splice(l,1); l--;
                  continue;
                }
                if(self.automaton.StackAlphabet.indexOf(s.Transitions[t].Labels[l][1]) == -1){
                  s.Transitions[t].Labels.splice(l,1); l--;
                  continue;
                }
              }
            }
          }
        }
        self.checkAutomaton();
        // we checked, try to create an undo step
        if(!noSave) self.makeUndoStep();
      };

      self.bindStates = function(){
        // JSON String to number 
        for(var i=0; i < self.automaton.States.length; i++){
          var s = self.automaton.States[i];
          s.ID = parseInt(s.ID,10);
          s.x = parseInt(s.x,10); // make sure all positions are numbers not strings
          s.y = parseInt(s.y,10);
          s.Final = s.Final == "true" || s.Final === true;
          s.Start = s.Start == "true" || s.Start === true;
          s.Radius = parseInt(s.Radius,10);
          if(s.Transitions)
            for(var z=0; z < s.Transitions.length; z++){
              var t = s.Transitions[z];
              t.x = parseInt(t.x,10);
              t.y = parseInt(t.y,10);
              if(isNaN(t.x)) t.x = 0; 
              if(isNaN(t.y)) t.y = 0;
              t.Target = parseInt(t.Target,10);
              t.Source = parseInt(t.Source,10);
            }
        }
        self.States = {};
        for(var i=0; i < self.automaton.States.length; i++){
          self.States[self.automaton.States[i].ID] = self.automaton.States[i];
        }        
      };

      self.checkAutomaton = function(verbose){ 
        self.correct = true;
        var hasFinalState = false;
        for(var i=0; i < self.automaton.States.length; i++){
          var s = self.automaton.States[i];
          // reset all error markers
          s.hasError = false;
          for(var t=0; t < s.Transitions.length; t++){
            s.Transitions[t].hasError = false;  
            s.Transitions[t].hasLabelErrors = [];
          }

          if(s.Final) hasFinalState = true;
          //////////////////////////////////////////////////////
          /*
          if(self.Type == "DEA" || self.Type == "NEA"){
            // check for characters not in Alphabet anymore
            for(var t=0; t < s.Transitions.length; t++){
              for(var l=0; l < s.Transitions[t].Labels.length; l++){
                if(self.automaton.Alphabet.indexOf(s.Transitions[t].Labels[l]) == -1){
                  s.Transitions[t].hasError = true;
                  if(verbose){
                    self.showAlert("WARNUNG: "+s.Transitions[t].Labels[l]+" ist nicht im Eingabealphabet enthalten!");
                    verbose = false;
                  }
                }
              }
            }
          }*/
          //////////////////////////////////////////////////////
          if(self.Type == "DEA" || self.Type == "MOORE"){
            // check for double used alphabet characters and incomplete transitions
            for(var z=0; z < self.automaton.Alphabet.length; z++){
              var usedIn = [];
              for(var t=0; t < s.Transitions.length; t++){
                var p = s.Transitions[t].Labels.indexOf(self.automaton.Alphabet[z]);
                if(p != -1) usedIn.push({trans:s.Transitions[t],index:p});
              }
              if(usedIn.length > 1){
                for(var t=0; t < usedIn.length; t++) {
                  usedIn[t].trans.hasLabelErrors.push(usedIn[t].index);
                  usedIn[t].trans.hasError = true;
                }
                self.correct = false;
                s.hasError = true;
                if(verbose){
                  self.showAlert($translate.instant("ERRORS.TOOMANYCHARSTRANSITION",{CHAR:self.automaton.Alphabet[z],STATE:s.Name}));
                  verbose = false;
                }
              }
              if(usedIn.length == 0 && !self.automaton.allowPartial){
                self.correct = false;
                s.hasError = true; 
                if(verbose){ 
                  self.showConfirm($translate.instant("AUTOEDIT.CHECKASKTOCOMPLETE")).then(function(){
                    // OK clicked
                    if(self.checkForFinalState())
                      self.completeDEA();
                  });
                  verbose = false;
                }
              }
            }
          }
          //////////////////////////////////////////////////////
          if(self.Type == "MEALY"){
            // check for double used alphabet characters and incomplete transitions
            for(var z=0; z < self.automaton.Alphabet.length; z++){
              var usedIn = [];
              for(var t=0; t < s.Transitions.length; t++){
                for(var l=0; l < s.Transitions[t].Labels.length; l++){
                  if(s.Transitions[t].Labels[l][0] == self.automaton.Alphabet[z]) 
                    usedIn.push({trans:s.Transitions[t],index:l});
                }
              }
              if(usedIn.length > 1){
                for(var t=0; t < usedIn.length; t++) {
                  usedIn[t].trans.hasLabelErrors.push(usedIn[t].index);
                  usedIn[t].trans.hasError = true;
                }
                self.correct = false;
                s.hasError = true;
                if(verbose){
                  self.showAlert($translate.instant("ERRORS.TOOMANYCHARSTRANSITION",{CHAR:self.automaton.Alphabet[z],STATE:s.Name}));
                  verbose = false;
                }
              }
              if(usedIn.length == 0 && !self.automaton.allowPartial){
                self.correct = false;
                s.hasError = true; 
                if(verbose){ 
                  self.showConfirm($translate.instant("AUTOEDIT.CHECKASKTOCOMPLETE")).then(function(){
                    // OK clicked
                    self.completeMEALY();
                  });
                  verbose = false;
                }
              }
            }
          }
          //////////////////////////////////////////////////////
          if(true){
          //if(self.Type == "DEA" || self.Type == "NEA" || self.Type == "MEALY" || self.Type == "MOORE"){
            // check empty transitions
            for(var t=0; t < s.Transitions.length; t++){
              if(s.Transitions[t].Labels.length == 0){
                self.correct = false;
                s.hasError = true;
                s.Transitions[t].hasError = true; 
                if(verbose){ 
                  self.showAlert($translate.instant("ERRORS.EMPTYTRANSITION"));
                  verbose = false;
                }
              }
            }
          }
          //////////////////////////////////////////////////////
          if(self.Type == "DKA"){
            // check for double used alphabet characters and incomplete transitions
            for(var w=0; w < self.automaton.StackAlphabet.length; w++){
              for(var z=0; z < self.automaton.Alphabet.length; z++){
                var usedIn = [];
                for(var t=0; t < s.Transitions.length; t++){
                  for(var l=0; l < s.Transitions[t].Labels.length; l++){
                    if(s.Transitions[t].Labels[l][0] == self.automaton.StackAlphabet[w] &&
                       s.Transitions[t].Labels[l][1] == self.automaton.Alphabet[z]) usedIn.push({trans:s.Transitions[t],index:l});
                    if(s.Transitions[t].Labels[l][0] == self.automaton.StackAlphabet[w] &&
                       s.Transitions[t].Labels[l][1] == "") usedIn.push({trans:s.Transitions[t],index:l});
                  }
                }
              
                if(usedIn.length > 1){
                  for(var t=0; t < usedIn.length; t++) {
                    usedIn[t].trans.hasLabelErrors.push(usedIn[t].index);
                    usedIn[t].trans.hasError = true;
                  }
                  self.correct = false;
                  s.hasError = true;
                  if(verbose){
                    self.showAlert($translate.instant("ERRORS.MULTIPLEUSETRANSITION",{STACK:self.automaton.StackAlphabet[w],CHAR:self.automaton.Alphabet[z],STATE:s.Name}));
                    verbose = false;
                  }

                }
              }
            }
            // check empty transitions
            for(var t=0; t < s.Transitions.length; t++){
              if(s.Transitions[t].Labels.length == 0){
                self.correct = false;
                s.Transitions[t].hasError = true; 
                if(verbose){
                  self.showAlert($translate.instant("ERRORS.EMPTYTRANSITION"));
                  verbose = false;
                }
              }
            }
          }
          //////////////////////////////////////////////////////
          if(self.Type == "TM"){
            // check for double used alphabet characters 
            for(var z=0; z < self.automaton.StackAlphabet.length; z++){
              var usedIn = [];
              for(var t=0; t < s.Transitions.length; t++){
                for(var l=0; l < s.Transitions[t].Labels.length; l++){
                  if(s.Transitions[t].Labels[l][0] == self.automaton.StackAlphabet[z]) usedIn.push({trans:s.Transitions[t],index:l});
                }
              }
              if(usedIn.length > 1){
                for(var t=0; t < usedIn.length; t++) {
                  usedIn[t].trans.hasLabelErrors.push(usedIn[t].index);
                  usedIn[t].trans.hasError = true;
                }
                self.correct = false;
                s.hasError = true;
                if(verbose){
                  self.showAlert($translate.instant("ERRORS.TOOMANYCHARSTRANSITION",{CHAR:self.automaton.StackAlphabet[z],STATE:s.Name}));
                  verbose = false;
                }
              }
            }
          }
          //////////////////////////////////////////////////////
        }
        if(self.Type != "MEALY" && self.Type != "MOORE"){
          // all automatons need at least one final state but MEALY and MOORE
          if(!hasFinalState) self.correct = false;
          if(verbose && !hasFinalState) self.showAlert($translate.instant("ERRORS.NOFINALSTATE"));
        }
        if(verbose && self.correct) self.showAlert($translate.instant("AUTOEDIT.CHECKOK"));
      };

      self.addState = function(point){
        var idmax = 0;
        var x = 150;
        var y = 150;
        var numfit = 0;
        for(var z=0; z < self.automaton.States.length; z++){ 
          var found = false;
          for(var t=0; t < self.automaton.States.length; t++){ 
            var e = self.automaton.States[t];
            if("q"+numfit == e.Name) found = true;
          } 
          if(found) numfit++; else break;
        }
        for(var z=0; z < self.automaton.States.length; z++){ 
          var e = self.automaton.States[z];
          idmax = Math.max(idmax, e.ID);
        }

        if(point){
          x = point.x;
          y = point.y;
        }else{
          var minX = 100000;
          var minY = 100000;
          var maxX = 0;
          var maxY = 0;
          for(var z=0; z < self.automaton.States.length; z++){ 
            var e = self.automaton.States[z];
            minX = Math.min(e.x,minX);
            minY = Math.min(e.y,minY);
            maxX = Math.max(e.x,maxX);
            maxY = Math.max(e.y,maxY);
          }
          if(self.automaton.States.length > 0){
            x = Math.round((minX+maxX) / 2 +100+ 100*Math.random()-50);
            y = Math.round((minY+maxY) / 2 +100+ 100*Math.random()-50);
          }
        }
        // find new name for q

        var s = {"ID":idmax+1, "Name":'q'+(numfit),"x":x,"y":y,"Final":false,"Radius":self.stateRadius,"Transitions":[]};
        if(self.automaton.States.length == 0) s.Start = true;
        self.automaton.States.push(s);
       
        self.bindStates();
        self.updatePoints();
        self.checkAutomaton();
        // we checked, try to create an undo step
        self.automaton.acceptCache = []; // reset
        if(!noSave) self.makeUndoStep();
        return s;
      };

      self.addTransition = function(s1,s2){
        for(var i=0; i < s1.Transitions.length; i++){
          if(s1.Transitions[i].Target == s2.ID){ 
            return s1.Transitions[i]; // already exists
          }
        }
        var newTransition = {"Source":s1.ID,"Target":s2.ID,"x":0,"y":0, Labels:[]};

        for(var i=0; i < s2.Transitions.length; i++){
          if(s2.Transitions[i].Target == s1.ID){ 
            if((s2.Transitions[i].x + s2.Transitions[i].y) == 0){
              newTransition.x = 50;
              s2.Transitions[i].x = 50;
              break;
            }
          } 
        }
        s1.Transitions.push(newTransition);
        if(s1.ID == s2.ID) newTransition.y = -150;
        self.updatePoints();

        self.addFirstLabel(newTransition,true);
        self.checkAutomaton();
        // we checked, try to create an undo step
        if(!noSave) self.makeUndoStep();
        self.automaton.acceptCache = []; // reset
        return newTransition;
      };

      self.addLabel = function(t,z){
        t.Labels.push(z);
        if(self.Type == "DEA" || self.Type == "NEA" || self.Type == "MOORE") t.Labels.sort();
        self.checkAutomaton();
        // we checked, try to create an undo step
        if(!noSave) self.makeUndoStep();
        self.automaton.acceptCache = []; // reset
      };

      self.addFirstLabel = function(t, newTranstition){
        if(self.Type == "DKA" || self.Type == "NKA"){
          self.addLabel(t, [self.automaton.StackAlphabet[0],self.automaton.Alphabet[0],[]]);
        }
        if(self.Type == "TM"){
          self.addLabel(t, [self.automaton.Alphabet[0],self.automaton.Alphabet[0],'R']);
        }

        if((self.Type == "DEA" || self.Type == "NEA" || self.Type == "MOORE") && newTranstition){
          var s = self.States[t.Source];
          for(var i=0; i < self.automaton.Alphabet.length; i++){
            var z = self.automaton.Alphabet[i];
            var used = false;
            for(var c=0; c < s.Transitions.length; c++){
              if(s.Transitions[c].Labels.indexOf(z) != -1) used = true;
            }
            if(!used){
              self.addLabel(t,z);
              break;
            }
          }
          if(t.Labels.length == 0 && self.automaton.Alphabet.length > 0){
            self.addLabel(t,self.automaton.Alphabet[0]);
          }
          //self.addLabel(t, "");
        }

        if(self.Type == "MEALY"){
          var s = self.States[t.Source];
          for(var i=0; i < self.automaton.Alphabet.length; i++){
            var z = self.automaton.Alphabet[i];
            var used = false;
            for(var c=0; c < s.Transitions.length; c++){
              for(var l=0; l < s.Transitions[c].Labels.length; l++){
                if(s.Transitions[c].Labels[l][0] == z) {
                  used = true;
                  break;
                }
              }
              if(used) break;
            }
            if(!used){
              self.addLabel(t,[z,""]);
              break;
            }
          }
          if(t.Labels.length == 0 && self.automaton.Alphabet.length > 0){
            self.addLabel(t,[self.automaton.Alphabet[0],""]);
          }
        }
        self.checkAutomaton();
        // we checked, try to create an undo step
        if(!noSave) self.makeUndoStep();
        
        setTimeout(function(){$('#editLabelList').scrollTop(999999);},100);
      };

      self.removeLabel = function(t,z){
        for(var i=0; i < t.Labels.length; i++) 
          if(t.Labels[i] == z){
            t.Labels.splice(i,1);
            break;
          }

        if(t.Labels.length == 0) {
          if(self.Type == 'DEA')
             self.addFirstLabel(t,false); // ?
          if(self.Type == 'DKA' || self.Type == 'NKA' || self.Type == 'TM') self.removeTransition(t);
        }
        self.checkAutomaton();
        // we checked, try to create an undo step
        self.automaton.acceptCache = []; // reset
        if(!noSave) self.makeUndoStep();
      };
      
      self.changeStartState = function(s){
        if(s.Start){
          for(var i=0; i < self.automaton.States.length; i++) if(self.automaton.States[i] != s) self.automaton.States[i].Start = false;
        }else{
          for(var i=0; i < self.automaton.States.length; i++) if(self.automaton.States[i] != s){self.automaton.States[i].Start = true; break; }
        }
        // we checked, try to create an undo step
        self.automaton.acceptCache = []; // reset
        if(!noSave) self.makeUndoStep();
      };
    
      self.changeStateName = function(s){
        // prevent double names on states
        var used = false;
        for(var i=0; i < self.automaton.States.length; i++){
          if(self.automaton.States[i] == s) continue;
          if(self.automaton.States[i].Name == s.Name) used = true;
        }
        if(used){
          if(s.Name == '') s.Name = 'q';
          if(s.Name[s.Name.length-1] == 'a') s.Name = s.Name.substring(0,s.Name.length-1)+ 'b'; else
          if(s.Name[s.Name.length-1] == 'b') s.Name = s.Name.substring(0,s.Name.length-1)+ 'c'; else
          s.Name = s.Name + "a";

          self.changeStateName(s);
        }
      };

      self.removeState = function(s){
        if(self.selectedState == s) { self.selectedState = null; self.isStateChooseOpen = false; }
        if(s.Start){
          s.Start = false;
          self.changeStartState(s);
        }     

        for(var i=0; i < self.automaton.States.length; i++){
          var s2 = self.automaton.States[i];
          for(var z=0; z < s2.Transitions.length; z++){
            var t = s2.Transitions[z];
            if(t.Target == s.ID) {
              self.removeTransition(t);
              z--;
            }
          }
          if(s2.ID == s.ID){
            self.automaton.States.splice(i,1);
            i--;
          }
        } 
        delete self.States[s.ID];
        self.checkAutomaton();
        // we checked, try to create an undo step
        if(!noSave) self.makeUndoStep();
        self.automaton.acceptCache = []; // reset
      };

      self.removeTransition = function(t){
        var s = self.States[t.Source];
        for(var i=0; i < s.Transitions.length; i++){
          if(s.Transitions[i] == t) { s.Transitions.splice(i,1); break; }
        } 
        if(self.selectedTransition == t) { self.selectedTransition = null;  self.isLabelChooseOpen = false;}
        self.checkAutomaton();
        // we checked, try to create an undo step
        if(!noSave) self.makeUndoStep();
        self.automaton.acceptCache = []; // reset
      };

      self.selectOtherAutomaton = function(ev, types, withSameAlphabet){
        var deferred = $q.defer();
        $mdDialog.show({
          templateUrl: "selectOtherAutomaton.html",
          targetEvent: ev,
          clickOutsideToClose: true,
          controller: function ($scope, $mdDialog) {
            $scope.self = self;
            $scope.automata = [];
            $scope.withSameAlphabet = withSameAlphabet;
            $scope.selectedAutomaton = -1;

            $scope.refreshList = function(){
              $scope.automata = [];
              $scope.selectedAutomaton = -1;
              for(var i=0; i < parent.automatons.length; i++){
                if(parent.automatons[i].ID != self.ID){
                  if(!types || types.indexOf(parent.automatons[i].Type) != -1){
                    if($scope.withSameAlphabet){
                      var ca = JSON.parse(parent.automatons[i].JSON);
                      if(ca.Alphabet && ca.Alphabet.length == self.automaton.Alphabet.length){
                        var hasMatchAlphabet = true;
                        for(var c = 0; c < ca.Alphabet.length; c++){
                          if(self.automaton.Alphabet.indexOf(ca.Alphabet[c]) == -1){
                            // no match
                            hasMatchAlphabet = false; 
                            break;
                          }
                        }
                        if(hasMatchAlphabet) $scope.automata.push(parent.automatons[i]);
                      }
                    }else
                      $scope.automata.push(parent.automatons[i]);
                  }
                }
              }
              if($scope.automata.length > 0) 
                $scope.selectedAutomaton = $scope.automata[0].ID;
            };

            $scope.select = function(a) {
              $mdDialog.hide();
              for(var i=0; i < $scope.automata.length; i++)
                if($scope.automata[i].ID == a){
                  deferred.resolve($scope.automata[i]);
                  break;
                }
            };
            $scope.close = function() {
              $mdDialog.hide();
              deferred.reject("canceled"); 
            };

            $scope.refreshList();
          }
        });

        return deferred.promise;   
      };

      self.editDeltaTable = function(ev){
        var deferred = $q.defer();
        var newStates = [];
        $mdDialog.show({
          templateUrl: "editDeltaTable.html",
          targetEvent: ev,
          onRemoving:function(){
            var changed = false;
            for(var i=0; i < newStates.length;i++){
              r = autoLayoutAutomaton(self.automaton,false,false,newStates[i].ID);
              if(r.result == "OK"){
                self.automaton = r.automaton;
                changed = true;
              }
            }
            if(changed) {
              self.bindStates();
              self.updatePoints();
              self.checkAutomaton();
              self.makeUndoStep();
            }          
          },
          
          clickOutsideToClose: true,
          controller: function ($scope, $mdDialog) {
            $scope.self = self;
            $scope.mapped = {};
            
            $scope.copyToClipboard = function(){
              if(document.selection) { 
                var range = document.body.createTextRange();
                range.moveToElementText(document.getElementById("copyTable"+self.ID));
                range.select().createTextRange();
                document.execCommand("copy"); 

              } else 
              if (window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
                var range = document.createRange();
                range.selectNode(document.getElementById("copyTable"+self.ID));
                window.getSelection().addRange(range);
                document.execCommand("copy");
              }
            };

            $scope.remap = function(){
              for(var i=0; i < self.automaton.States.length; i++){
                var m = {};
                if(self.Type == 'NEA'){
                  m[''] = [];
                  for(var x=0; x < self.automaton.States[i].Transitions.length; x++){
                    for(var l=0; l < self.automaton.States[i].Transitions[x].Labels.length; l++){
                      if(self.automaton.States[i].Transitions[x].Labels[l] == ''){
                        for(var f=0; f < self.automaton.States.length; f++){
                          if(self.automaton.States[i].Transitions[x].Target == self.automaton.States[f].ID){
                            if(m[''].indexOf(self.automaton.States[f]) == -1)
                              m[''].push(self.automaton.States[f]);
                            break;
                          }
                        }
                        break;
                      }
                    }
                  }
                }  
                for(var z=0; z < self.automaton.Alphabet.length; z++){
                  m[self.automaton.Alphabet[z]] = [];
                  for(var x=0; x < self.automaton.States[i].Transitions.length; x++){
                    for(var l=0; l < self.automaton.States[i].Transitions[x].Labels.length; l++){
                      if(self.automaton.States[i].Transitions[x].Labels[l] == self.automaton.Alphabet[z]){
                        for(var f=0; f < self.automaton.States.length; f++){
                          if(self.automaton.States[i].Transitions[x].Target == self.automaton.States[f].ID){
                            if(m[self.automaton.Alphabet[z]].indexOf(self.automaton.States[f]) == -1)
                              m[self.automaton.Alphabet[z]].push(self.automaton.States[f]);
                            break;
                          }
                        }
                        break;
                      }
                    }
                  }
                }
                $scope.mapped[self.automaton.States[i].ID] = m;
                self.automaton.acceptCache = []; // reset
              }
              
              var t = "";
              
              t += "<tr>";
              t += "<td style='text-align:center;border-bottom:1px solid gray;border-right:1px solid gray'><b>δ</b></td>";
              if(self.Type == "NEA")
                t += "<td style='text-align:center;border-bottom:1px solid gray'><b>&epsilon;</b></td>";
              for(var i=0; i < self.automaton.Alphabet.length; i++)  
                t += "<td style='text-align:center;border-bottom:1px solid gray;white-space:nowrap'><b>"+self.automaton.Alphabet[i]+"</b></td>";
              t += "</tr>";

              for(var i=0; i < self.automaton.States.length; i++){ 
                t += "<tr>";
                t += "<td style='text-align:center;border-right:1px solid gray;padding:0.2em;white-space:nowrap'><b>"+self.automaton.States[i].Name+"</b></td>";
                var m = $scope.mapped[self.automaton.States[i].ID];
                if(self.Type == "NEA")
                  t += "<td style='text-align:center;white-space:nowrap'>"+$scope.getSet(m[''])+"</td>";
                for(var z=0; z < self.automaton.Alphabet.length; z++) {
                  t += "<td style='text-align:center;white-space:nowrap'>"+$scope.getSet(m[self.automaton.Alphabet[z]])+"</td>";
                }
                t += "</tr>";
              }
              
              setTimeout(function(){
                $('#copyTable'+self.ID).html(t);
              },100);
            };  
             

            $scope.getSet = function(a){
              var s = "";
              for(var i=0; i < a.length; i++){
                s += (i > 0 ? ', ':'') + a[i].Name;
              }
              if(self.Type == "NEA"){
                if(s == "") s = "∅"; else s = '{'+s+'}';
              }
              return s;
            }
                                 
            $scope.addLabel = function(state,character,target){
              var current = $scope.mapped[state.ID][character];
              
              var t = null;
              for(var i=0; i < state.Transitions.length; i++){
                if(state.Transitions[i].Target == target.ID){
                  t = state.Transitions[i];
                  break;
                }
              }
              if(!t){
                t = self.addTransition(state,target);
                t.Labels.pop(); // remove init character here
              }
              
              var isThere = false;
              for(var i=0; i < t.Labels.length; i++){
                if(t.Labels[i] == character){
                  isThere = true;
                  break;
                }
              }
              
              if(isThere){
                if(t.Labels.length > 1)
                  self.removeLabel(t,character); else
                  self.removeTransition(t);
              }else{
                self.addLabel(t,character);
                if(self.Type == "DEA"){
                  // remove old value
                  for(var z=0; z < current.length; z++){
                    for(var i=0; i < state.Transitions.length; i++){
                      if(state.Transitions[i].Target == current[z].ID){
                        if(state.Transitions[i].Labels.length > 1)
                          self.removeLabel(state.Transitions[i],character); else
                          self.removeTransition(state.Transitions[i]);
                        break;
                      }
                    }
                  }
                }
              }          
                
              $scope.remap();
            };
            
            $scope.addState = function(){
              newStates.push(self.addState());
              $scope.remap();
            };
                        
            $scope.close = function() {
              $mdDialog.hide();
              deferred.resolve();
            };


            $scope.remap();
          }
        });
        return deferred.promise;   
      }
      //////////////////////////////////////////////////
      // Simulation
      //////////////////////////////////////////////////
      self.showSimulationPanel = false;
      self.simulationSpeed = 1000;
      self.currentSimulationTimeout = null;

      self.toggleSimulation = function(){
        if(self.showSimulationPanel){
          self.closeSimulation();
        }else{
          self.showSimulationPanel = true;
        }
      };

      self.closeSimulation = function(){
        if(self.currentSimulationTimeout) $timeout.cancel(self.currentSimulationTimeout);
        self.currentSimulationTimeout = null;
        self.showSimulationPanel = false;
        self.simulationTrace = [];
        for(var i=0; i < self.automaton.States.length; i++) {
          self.automaton.States[i].play = false;
          for(var t=0; t < self.automaton.States[i].Transitions.length; t++){
            self.automaton.States[i].Transitions[t].play = false; 
            delete self.automaton.States[i].Transitions[t].playLabel; 
          }
        }
      };

      self.pauseSimulation = function(){
        self.simulationRunning = false;
        self.simulationPaused = true;
      }
      self.continueSimulation = function(){
        self.simulationRunning = true;
        self.simulationPaused = false;
        if(self.currentTraceItem) {
          self.currentTraceItem.transition.play = false;
          self.currentTraceItem.transition.playLabel = null;
        }
      }
      self.animateSimulation = function(machine,start){
        // stop any running simulation
        if(self.currentSimulationTimeout) $timeout.cancel(self.currentSimulationTimeout);

        var firstAccept = -1;
        for(var i=0; i < self.simulationTrace.length; i++) {
          if(firstAccept == -1 && self.simulationTrace[i].accept) firstAccept = i;
          self.simulationTrace[i].animate = false;
        }

        if(typeof(machine) == "undefined") machine = firstAccept > -1 ? firstAccept : 0;

        for(var i=0; i < self.automaton.States.length; i++) {
          self.automaton.States[i].play = false;
          for(var t=0; t < self.automaton.States[i].Transitions.length; t++){
            self.automaton.States[i].Transitions[t].play = false; 
            delete self.automaton.States[i].Transitions[t].playLabel; 
          }
        }

        function checkPaused(step){
          // paused wait for continue
          if(!self.simulationRunning){
            self.currentSimulationTimeout = $timeout(function(){
              doStep(step);
            },500);
            return true; 
          } 
          return false;
        }
        
        function doStep(step){
          if(checkPaused(step)) return;
          self.simulationTrace[machine].animateStep = step;
          var item = self.simulationTrace[machine].items[step];
          self.currentTraceItem = item;

          item.state.play = true;
          if(item.transition){
            self.currentSimulationTimeout = $timeout(function(){
              if(checkPaused(step)) return;
              //var s = $("#simulationTrace"+self.ID+"_"+machine+"_"+(step-3));
              //$("#simulationTrace"+self.ID).scrollLeft(s.length > 0 ? s.position().left : 0);

              item.state.play = false;
              item.transition.play = true;
              item.transition.playLabel = item.label;
              self.currentSimulationTimeout = $timeout(function(){
                if(checkPaused(step)) return;
                //var s = $("#simulationTrace"+self.ID+"_"+machine+"_"+(step-3));
                //$("#simulationTrace"+self.ID).scrollLeft(s.length > 0 ? s.position().left : 0);

                item.transition.play = false;
                delete item.transition.playLabel;
                doStep(step+1);
              },2000-self.simulationSpeed);      
            },2000-self.simulationSpeed);
          }else{
            self.simulationRunning = false; 
          }
        }

        setTimeout(function(){
          var s = $("#simulationTrace"+self.ID);
          var m = $("#simulationTrace"+self.ID+"_"+machine+"_0");
          s.scrollTop(m.parent().position().top);
        
        },10);
        
        self.simulationTrace[machine].animate = true;     
        self.simulationRunning = true;   
        doStep(start ? start : 0);
      };

      self.randomSimulationInputWord = function(){
        self.checkAutomaton();
        if(!self.correct) {
          self.showAlert($translate.instant("ERRORS.AUTOMATONERRORS"));
          return;
        }
        var input = self.automaton.simulationInput ? self.automaton.simulationInput.slice(0) : [];
        var joined = input.join("\n");

        if(self.Type == "NEA" || self.Type == "DEA") {
          var auto = JSON.parse(self.toJSON());
          var r = ea2grammar(auto,self.Type);
          if(r.result == "OK" && r.grammar){
            r = cleanupGrammar(r.grammar);  
            //r = removeChainsGrammar(r.grammar);
            var pr = parseBNF(r.grammar);
            
            for(var x = 0; x < 10; x++){
              var word = generateGrammarRandomWord(pr.bnf);
              if(joined != word.join("\n")){
                self.automaton.simulationInput = word;
                break;
              }
            }

          }
        }
        
        if(self.Type == "DKA" || self.Type == "NKA") {
          var auto = JSON.parse(self.toJSON());
          var r = ka2grammar(auto,self.Type);
          if(r.result == "OK" && r.grammar){
            r = cleanupGrammar(r.grammar);  
            r = removeChainsGrammar(r.grammar);
            var pr = parseBNF(r.grammar);

            for(var x = 0; x < 10; x++){
              var word = generateGrammarRandomWord(pr.bnf);
              if(joined != word.join("\n")){
                self.automaton.simulationInput = word;
                break;
              }
            }            
          }

        }               
        if(self.Type == "TM") {
          for(var x = 0; x < 10; x++){
            var word = [];
            var len = Math.ceil(Math.random()*Math.random()*20);
            for(var i=0; i < len; i++){
              var pick = Math.floor(Math.random()*self.automaton.Alphabet.length);
              word.push(self.automaton.Alphabet[pick]);
            }
            if(joined != word.join("\n")){
              self.automaton.simulationInput = word;
              break;
            }
          }            
        }
      };
      
      self.checkAccept = function(input){
        // checks if an input is accepted by the current automaton
        // input will be empty after simulation, clone it
        var old = self.simulationTrace;
        var result = false;
        self.performSimulation(input.slice(0));
        if(self.simulationTrace){
          for(var i=0; i < self.simulationTrace.length; i++){
            result = result || self.simulationTrace[i].accept;
          }
          self.simulationTrace = old;  
          result =  result ? 1 : -1;
          self.automaton.acceptCache[input.join('°')] = result;
        }
        return result;
      };

      self.checkAcceptAll = function(){
        for(var z=0; z < self.automaton.lastInputs.length; z++){
          var input = self.automaton.lastInputs[z].slice(0);
          var old = self.simulationTrace;
          var result = false;
          self.performSimulation(input.slice(0));
          if(!self.simulationTrace || self.simulationTrace.length == 0) return; // error case
          for(var i=0; i < self.simulationTrace.length; i++){
            result = result || self.simulationTrace[i].accept;
          }
          self.simulationTrace = old;  
          result =  result ? 1 : -1;
          self.automaton.acceptCache[input.join('°')] = result;
        }
      };
      //////////////////////////////////////////////////
      // Runs a simulation for given input and produces a simulationTrace
      //////////////////////////////////////////////////
      self.performSimulation = function(input){
        var breakMessageShown = false;
        self.checkAutomaton();
        if(!self.correct){
          var alert = $mdDialog.alert({title: $translate.instant("HINT"), htmlContent: $translate.instant("AUTOEDIT.ERRORHINT"), ok: $translate.instant("OK")});
          $mdDialog.show( alert ).finally(function() { alert = undefined; self.checkAutomaton(true); });
          return;
        }

        self.simulationTrace = [];
        var state = null;
        for(var i=0; i < self.automaton.States.length; i++) {
          if(self.automaton.States[i].Start){ state = self.automaton.States[i]; break; }
        }
        ///// DEA /////
        if(self.Type == "DEA"){ 
          function doStepDEA(machine,state){
            var item = {state:state,input:input.slice(0)};
            self.simulationTrace[machine].items.push(item); 
            if(input.length == 0){
              self.simulationTrace[machine].accept = state.Final;
              return;
            }
            var c = input.shift();
            // search all transitions for matching input
            for(var i=0; i < state.Transitions.length; i++){
              for(var z=0; z < state.Transitions[i].Labels.length; z++){
                if(state.Transitions[i].Labels[z] == c){
                  // we found one
                  item.transition = state.Transitions[i];
                  item.label = z;
                  doStepDEA(machine, self.States[state.Transitions[i].Target]);
                  return;
                }
              }
            }
          }
          self.simulationTrace.push({index:0,items:[]}); // M0
          doStepDEA(0,state);
        }

        ///// NEA /////
        if(self.Type == "NEA"){ 
          var neaMaschines = [];

          function cloneTraceNEA(items,steps,transition,label){
            var untilNow = [];
            for(var x=0; x < steps; x++) {
              var t = items[x];
              untilNow.push({state:t.state,input:t.input,transition:t.transition,label:t.label});
            }
            untilNow[untilNow.length-1].transition = transition;
            untilNow[untilNow.length-1].label = label;
            return untilNow;
          }

          function doNextNEAStep(){
            var changed = false;
            for(var i=0; i < neaMaschines.length; i++){
              var m = neaMaschines[i];
              if(m.stoped) continue;
              // do next step for machine m
              var item = {state:m.state, input:m.input.slice(0), pointer:0};
              self.simulationTrace[i].items.push(item); 
              self.simulationTrace[i].accept = false;
              if(m.input.length == 0){
                self.simulationTrace[i].accept = m.state.Final;
              }
              if(m.step > 200) { // break possible infinity 
                if(!breakMessageShown) self.showAlert($translate.instant("AUTOEDIT.SIMULATIONTERMINATEDSTEPS",{'STEPS':200})); 
                breakMessageShown = true;
                continue;
              }

              var c = m.input.length > 0 ? m.input.shift() : '';

              var clone = false;

              var nextMachineState = null;
              var nextMachineInput = null;
              var nextMachineStack = null;

              for(var t=0; t < m.state.Transitions.length; t++){
                for(var z=m.state.Transitions[t].Labels.length-1; z >= 0; z--){ // will use epsilon last
                  if(m.state.Transitions[t].Labels[z] == c || m.state.Transitions[t].Labels[z] == ''){ // epsilon case
                    var nextInput = m.input.slice(0);
                    if(m.state.Transitions[t].Labels[z] == '' && c != '') nextInput.unshift(c);

                    if(clone || self.simulationTrace[i].accept){
                      if(neaMaschines.length > 50) { // break possible infinity 
                        if(!breakMessageShown) self.showAlert($translate.instant("AUTOEDIT.SIMULATIONTERMINATEDMACHINES"));
                        breakMessageShown = true;
                        break;
                      }              


                      self.simulationTrace.push({index:self.simulationTrace.length, 
                        items:cloneTraceNEA(self.simulationTrace[i].items,m.step+1,m.state.Transitions[t],z) }); // add new machine 

                      neaMaschines.push({step:m.step+1,state:self.States[m.state.Transitions[t].Target],input:nextInput});
                      changed = true;

                    }else{
                      item.transition = m.state.Transitions[t];
                      item.label = z;
                      nextMachineInput = nextInput.slice(0);
                      nextMachineState = self.States[m.state.Transitions[t].Target];
                      clone = true; 
                    }
                  }
                }
              } 
 
              if(nextMachineState){
                m.step = m.step+1;
                m.input = nextMachineInput;
                m.state = nextMachineState; 
                changed = true;
              }else m.stoped = true;
            }
            return changed;
          }

          self.simulationTrace.push({index:0,items:[]}); // M0
          neaMaschines.push({step:0,state:state,input:input});
          
          while(doNextNEAStep()){
            console.log("Next simulation step with "+neaMaschines.length+" machines.");
          }

        }

        ///// MEALY /////
        if(self.Type == "MEALY"){ 
          // build a long tape first
          var output = [];
          var step = 0;
                    
          var lastEpsilonStates = [];
          function doStepMEALY(machine,state){
            var item = {state:state,input:input.slice(0),output:output.slice(0),pointer:0};
            self.simulationTrace[machine].items.push(item); 

            if(input.length == 0){
              self.simulationTrace[machine].accept = true;
              return;
            }
            var w = input[0];
            // search all transitions for matching input
            for(var i=0; i < state.Transitions.length; i++){
              for(var z=0; z < state.Transitions[i].Labels.length; z++){
                if(state.Transitions[i].Labels[z][0] == w){ 

                  // we found one
                  if(state.Transitions[i].Labels[z][1] && state.Transitions[i].Labels[z][1] != "")
                    output.push(state.Transitions[i].Labels[z][1]);
                  input.shift();

                  item.transition = state.Transitions[i];
                  item.label = z;

                  doStepMEALY(machine, self.States[state.Transitions[i].Target]);
                  return;
                }
              }
            }
          }
          self.simulationTrace.push({index:0,items:[]}); // M0
          doStepMEALY(0,state);

          // add next stack 
          for(var z=0; z < self.simulationTrace.length; z++){
            for(var i=0; i < self.simulationTrace[z].items.length; i++){
              if(i < self.simulationTrace[z].items.length-1){
                self.simulationTrace[z].items[i].nextOutput = self.simulationTrace[z].items[i+1].output; 
                self.simulationTrace[z].items[i].nextPointer = self.simulationTrace[z].items[i+1].pointer;
              }else{
                self.simulationTrace[z].items[i].nextOutput = self.simulationTrace[z].items[i].output; 
                self.simulationTrace[z].items[i].nextPointer = self.simulationTrace[z].items[i].pointer;
              }  
            }
          }
          
        }

        ///// MOORE /////
        if(self.Type == "MOORE"){ 
          var output = [];
          function doStepMOORE(machine,state){
            if(state.Output && state.Output != "") output.push(state.Output);

            var item = {state:state,input:input.slice(0),output:output.slice(0)};
            self.simulationTrace[machine].items.push(item); 
            if(input.length == 0){
              self.simulationTrace[machine].accept = true;
              return;
            }
            var c = input.shift();
            // search all transitions for matching input
            for(var i=0; i < state.Transitions.length; i++){
              for(var z=0; z < state.Transitions[i].Labels.length; z++){
                if(state.Transitions[i].Labels[z] == c){
                  // we found one
                  item.transition = state.Transitions[i];
                  item.label = z;

                  doStepMOORE(machine, self.States[state.Transitions[i].Target]);
                  return;
                }
              }
            }
          }
          self.simulationTrace.push({index:0,items:[]}); // M0
          doStepMOORE(0,state);
        }        
        ///// DKA /////
        if(self.Type == "DKA"){ 
          var stack = [self.automaton.StackAlphabet.length > 0 ? self.automaton.StackAlphabet[0] : '?'];
          var lastEpsilonStates = [];
          function doStepDKA(machine,state){
            var item = {state:state,input:input.slice(0),stack:stack.slice(0),pointer:0};
            self.simulationTrace[machine].items.push(item); 

            if(input.length == 0){
              self.simulationTrace[machine].accept = state.Final;
              if(state.Final) return;
              // search ahead if there are epsilon transitions to go
              if(lastEpsilonStates.indexOf(state) != -1){
                return; // end here, we reached another already used state
              }
              lastEpsilonStates.push(state);
              var c = stack.shift();
              for(var i=0; i < state.Transitions.length; i++){
                for(var z=0; z < state.Transitions[i].Labels.length; z++){
                  if(state.Transitions[i].Labels[z][0] == c && state.Transitions[i].Labels[z][1] == ''){
                    // we found one
                    for(var p=state.Transitions[i].Labels[z][2].length-1; p > -1; p--) 
                      stack.unshift(state.Transitions[i].Labels[z][2][p]);

                    item.transition = state.Transitions[i];
                    item.label = z;

                    doStepDKA(machine, self.States[state.Transitions[i].Target]);
                    return;
                  }
                }
              }

              return;
            }
            var c = stack.shift();
            var w = input[0];
            // search all transitions for matching input
            for(var i=0; i < state.Transitions.length; i++){
              for(var z=0; z < state.Transitions[i].Labels.length; z++){
                if(state.Transitions[i].Labels[z][0] == c && 
                  (state.Transitions[i].Labels[z][1] == w || state.Transitions[i].Labels[z][1] == '')){ // epsilon case

                  // we found one
                  for(var p=state.Transitions[i].Labels[z][2].length-1; p > -1; p--) 
                    stack.unshift(state.Transitions[i].Labels[z][2][p]);

                  if(state.Transitions[i].Labels[z][1] != '') input.shift();

                  item.transition = state.Transitions[i];
                  item.label = z;

                  doStepDKA(machine, self.States[state.Transitions[i].Target]);
                  return;
                }
              }
            }
          }
          self.simulationTrace.push({index:0,items:[]}); // M0
          doStepDKA(0,state);

          // add next stack 
          for(var z=0; z < self.simulationTrace.length; z++){
            for(var i=0; i < self.simulationTrace[z].items.length; i++){
              if(i < self.simulationTrace[z].items.length-1){
                self.simulationTrace[z].items[i].nextStack = self.simulationTrace[z].items[i+1].stack; 
                self.simulationTrace[z].items[i].nextPointer = self.simulationTrace[z].items[i+1].pointer;
              }else{
                self.simulationTrace[z].items[i].nextStack = self.simulationTrace[z].items[i].stack; 
                self.simulationTrace[z].items[i].nextPointer = self.simulationTrace[z].items[i].pointer;
              }  
            }
          }
        }
 
        ///// NKA /////
        if(self.Type == "NKA"){ 
          var nkaMaschines = [];

          function cloneTraceNKA(items,steps,transition,label){
            var untilNow = [];
            for(var x=0; x < steps; x++) {
              var t = items[x];
              untilNow.push({state:t.state,stack:t.stack,input:t.input,transition:t.transition,label:t.label});
            }
            untilNow[untilNow.length-1].transition = transition;
            untilNow[untilNow.length-1].label = label;
            return untilNow;
          }

          function doNextNKAStep(){
            var changed = false;
            for(var i=0; i < nkaMaschines.length; i++){
              var m = nkaMaschines[i];
              if(m.stoped) continue;
              // do next step for machine m
              var item = {state:m.state,stack:m.stack.slice(0), input:m.input.slice(0), pointer:0};
              self.simulationTrace[i].items.push(item); 
              self.simulationTrace[i].accept = false;
              if(m.input.length == 0){
                self.simulationTrace[i].accept = m.state.Final;
              }
              if(m.step > 200) { // break possible infinity 
                if(!breakMessageShown) self.showAlert($translate.instant("AUTOEDIT.SIMULATIONTERMINATEDSTEPS",{'STEPS':200})); 
                breakMessageShown = true;
                continue;
              }

              var c = m.stack.length > 0 ? m.stack[0] : '';
              var w = m.input.length > 0 ? m.input[0] : '';

              var clone = false;

              var nextMachineState = null;
              var nextMachineInput = null;
              var nextMachineStack = null;

              for(var t=0; t < m.state.Transitions.length; t++){
                for(var z=0; z < m.state.Transitions[t].Labels.length; z++){
                  if(m.state.Transitions[t].Labels[z][0] == c && 
                    (m.state.Transitions[t].Labels[z][1] == w || m.state.Transitions[t].Labels[z][1] == '')){ // epsilon case

                    var nextInput = m.input.slice(0);
                    if(m.state.Transitions[t].Labels[z][1] != '') nextInput.shift();

                    var nextStack = m.stack.slice(0);
                    nextStack.shift(); // pop top of stack
                    // push new characters on stack
                    for(var p=m.state.Transitions[t].Labels[z][2].length-1; p >= 0; p--) 
                      nextStack.unshift(m.state.Transitions[t].Labels[z][2][p]);

                    if(clone || self.simulationTrace[i].accept){
                      if(nkaMaschines.length > 50) { // break possible infinity 
                        if(!breakMessageShown) self.showAlert($translate.instant("AUTOEDIT.SIMULATIONTERMINATEDMACHINES"));
                        breakMessageShown = true;
                        break;
                      }              


                      self.simulationTrace.push({index:self.simulationTrace.length, 
                        items:cloneTraceNKA(self.simulationTrace[i].items,m.step+1,m.state.Transitions[t],z) }); // add new machine 

                      nkaMaschines.push({step:m.step+1,state:self.States[m.state.Transitions[t].Target],stack:nextStack,input:nextInput});
                      changed = true;

                    }else{
                      item.transition = m.state.Transitions[t];
                      item.label = z;
                      nextMachineStack = nextStack.slice(0);
                      nextMachineInput = nextInput.slice(0);
                      nextMachineState = self.States[m.state.Transitions[t].Target];
                      clone = true; 
                    }
                  }
                }
              } 
 
              if(nextMachineState){
                m.step = m.step+1;
                m.input = nextMachineInput;
                m.state = nextMachineState; 
                m.stack = nextMachineStack; 
                changed = true;
              }else m.stoped = true;
            }
            return changed;
          }

          var stack = [self.automaton.StackAlphabet.length > 0 ? self.automaton.StackAlphabet[0] : '?'];
          self.simulationTrace.push({index:0,items:[]}); // M0
          nkaMaschines.push({step:0,state:state,stack:stack,input:input});
          
          while(doNextNKAStep()){
            console.log("Next simulation step with "+nkaMaschines.length+" machines.");
          }
          // add next stack 
          for(var z=0; z < self.simulationTrace.length; z++){
            for(var i=0; i < self.simulationTrace[z].items.length; i++){
              if(i < self.simulationTrace[z].items.length-1){
                self.simulationTrace[z].items[i].nextStack = self.simulationTrace[z].items[i+1].stack; 
                self.simulationTrace[z].items[i].nextPointer = self.simulationTrace[z].items[i+1].pointer;
              }else{
                self.simulationTrace[z].items[i].nextStack = self.simulationTrace[z].items[i].stack; 
                self.simulationTrace[z].items[i].nextPointer = self.simulationTrace[z].items[i].pointer;
              }  
            }
          }
        }
        
        ///// TM /////
        if(self.Type == "TM"){ 
          // build a long tape first
          var stack = [];
          for(var i=0; i < 2000; i++)
            stack.push(self.automaton.StackAlphabet[0]);
          var stackPointer = 1000;
          var lastPointer = 1000;
          var step = 0;
          var pointerRange = [stackPointer,stackPointer+input.length];
          
          // push input on tape
          for(var i=0; i < input.length; i++){
            stack[stackPointer+i] = input[i];
          }
          
          function doStepTM(machine,state){
            step++;
            if(step > 500) { // break possible infinity 
              self.showAlert($translate.instant("AUTOEDIT.SIMULATIONTERMINATEDSTEPS",{'STEPS':500}));
              return;
            }
            
            // copy stack 
            var item = {state:state,stack:stack.slice(0),pointer:stackPointer,lastPointer:lastPointer};
            self.simulationTrace[machine].items.push(item); 
            var c = stack[stackPointer];
            // search all transitions for matching input
            for(var i=0; i < state.Transitions.length; i++){
              for(var z=0; z < state.Transitions[i].Labels.length; z++){
                if(state.Transitions[i].Labels[z][0] == c){
                  // we found one
                  stack[stackPointer] = state.Transitions[i].Labels[z][1];
                  lastPointer = stackPointer;
                  
                  if(state.Transitions[i].Labels[z][2] == 'L') {
                    stackPointer--; 
                  }
                  if(state.Transitions[i].Labels[z][2] == 'R') {
                    stackPointer++; 
                  }
                  pointerRange[0] = Math.min(pointerRange[0],stackPointer); 
                  pointerRange[1] = Math.max(pointerRange[1],stackPointer); 
                  /*
                  if(stackPointer >= stack.length-1) stack.push(self.automaton.StackAlphabet[0]);
                  if(stackPointer < 1) { stack.unshift(self.automaton.StackAlphabet[0]); stackPointer++; }
                  
                  // truncate useless stack elements
                  while(stack.length > 2 && stackPointer > 1 && 
                        stack[0] == self.automaton.StackAlphabet[0] && 
                        stack[1] == self.automaton.StackAlphabet[0]){ stack.shift(); stackPointer--; }

                  while(stack.length > 2 && stackPointer < stack.length-2 && 
                        stack[stack.length-1] == self.automaton.StackAlphabet[0] && 
                        stack[stack.length-2] == self.automaton.StackAlphabet[0]){ stack.pop(); }
                  */
                  item.transition = state.Transitions[i];
                  item.label = z;
                  doStepTM(machine, self.States[state.Transitions[i].Target]);
                  return;
                }
              }
            }
            self.simulationTrace[machine].accept = state.Final; // creash, check if we are on a final state
          }
          self.simulationTrace.push({index:0,items:[]}); // M0
          doStepTM(0,state);
          
          // truncate stack to range limits
          for(var i=0; i < self.simulationTrace[0].items.length; i++){
            for(var z=0; z < 2000-pointerRange[1]-2; z++)
              self.simulationTrace[0].items[i].stack.pop();
            for(var z=0; z < pointerRange[0]-1; z++){
              self.simulationTrace[0].items[i].stack.splice(0,1);
              self.simulationTrace[0].items[i].pointer--;
              self.simulationTrace[0].items[i].lastPointer--;
            }
          }
          // add next stack 
          for(var i=0; i < self.simulationTrace[0].items.length; i++){
            if(i < self.simulationTrace[0].items.length-1){
              self.simulationTrace[0].items[i].nextStack = self.simulationTrace[0].items[i+1].stack; 
              self.simulationTrace[0].items[i].nextPointer = self.simulationTrace[0].items[i+1].pointer;
            }else{
              self.simulationTrace[0].items[i].nextStack = self.simulationTrace[0].items[i].stack; 
              self.simulationTrace[0].items[i].nextPointer = self.simulationTrace[0].items[i].pointer;
            }  
          }
          
        }
      };

      self.addCurrentInputToLastInputs = function(){
        if(!self.automaton.simulationInput) self.automaton.simulationInput = [];
        var input = self.automaton.simulationInput.slice(0);
        var joined = input.join("\n");
        if(!self.automaton.lastInputs) self.automaton.lastInputs = [];
        var exists = false;
        for(var i=0; i < self.automaton.lastInputs.length; i++) {
          var joined2 = self.automaton.lastInputs[i].join("\n");
          if(joined2 == joined) {
            exists = true;
            break;
          }
        }
        if(!exists) self.automaton.lastInputs.unshift(input.slice(0));
        while(self.automaton.lastInputs.length > 20) self.automaton.lastInputs.pop();
      };
      //////////////////////////////////////////////////
      // Run a simulation manually 
      //////////////////////////////////////////////////

      self.runSimulation = function(){
        self.simulationPaused = false;

        self.showSimulationPanel = true;
        if(!self.automaton.simulationInput) self.automaton.simulationInput = [];
        self.simulationRunInput = self.automaton.simulationInput.slice(0);
        
        var input = self.automaton.simulationInput.slice(0);

        self.addCurrentInputToLastInputs();

        self.performSimulation(input.slice(0));

        if(!self.simulationTrace || self.simulationTrace.length == 0) return;

        var result = false;
        for(var i=0; i < self.simulationTrace.length; i++){
          result = result || self.simulationTrace[i].accept;
        }
        result =  result ? 1 : -1;
        self.automaton.acceptCache[input.join('°')] = result;

        self.animateSimulation();
      };

      //////////////////////////////////////////////////
      // Point calculation helpers for drawing graph
      //////////////////////////////////////////////////
      self.getAngle = function (p1,p2,add){
        return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI +(add ? add : 0);
      };
      self.getAngleRad = function (p1,p2,add){
        return Math.atan2(p2.y - p1.y, p2.x - p1.x)+(add ? (add / 180 * Math.PI ): 0);
      };

      self.getPointOnBezier = function (s1,s2,t1,t2,t){
        var Ax = ( (1 - t) * s1.x ) + (t * t1.x);
        var Ay = ( (1 - t) * s1.y ) + (t * t1.y);
        var Bx = ( (1 - t) * t1.x ) + (t * t2.x);
        var By = ( (1 - t) * t1.y ) + (t * t2.y);
        var Cx = ( (1 - t) * t2.x ) + (t * s2.x);
        var Cy = ( (1 - t) * t2.y ) + (t * s2.y);
        var Dx = ( (1 - t) * Ax ) + (t * Bx);
        var Dy = ( (1 - t) * Ay ) + (t * By);
        var Ex = ( (1 - t) * Bx ) + (t * Cx);
        var Ey = ( (1 - t) * By ) + (t * Cy);
        var Px = ( (1 - t) * Dx ) + (t * Ex);
        var Py = ( (1 - t) * Dy ) + (t * Ey);    
        return {x:+Px.toFixed(2), y:+Py.toFixed(2)};
      };

      self.updatePoints = function(){
        var cubicBezierValue = 2;

        for(var i=0; i < self.automaton.States.length; i++){
          var s = self.automaton.States[i];
          if(s.Transitions)
            for(var z=0; z < s.Transitions.length; z++){
              var t = s.Transitions[z];
              var s2 = self.States[t.Target];

              if(s.ID == s2.ID) {
                // self transition
                var a = self.getAngleRad(s,{x:t.x+s.x,y:t.y+s.y});
                if(a < 0) a += Math.PI*2;
                if(a <= Math.PI)
                t.pathPoints = [{x:s.x+s.Radius*4.5*Math.cos(a-Math.PI/5),y:s.y+s.Radius*4.5*Math.sin(a-Math.PI/5)},
                                {x:s.x+s.Radius*4.5*Math.cos(a+Math.PI/5),y:s.y+s.Radius*4.5*Math.sin(a+Math.PI/5)}]; else
                t.pathPoints = [{x:s.x+s.Radius*4.5*Math.cos(a+Math.PI/5),y:s.y+s.Radius*4.5*Math.sin(a+Math.PI/5)},
                                {x:s.x+s.Radius*4.5*Math.cos(a-Math.PI/5),y:s.y+s.Radius*4.5*Math.sin(a-Math.PI/5)}];
                t.pathPoints[0].x = +t.pathPoints[0].x.toFixed(2);
                t.pathPoints[0].y = +t.pathPoints[0].y.toFixed(2);
                t.pathPoints[1].x = +t.pathPoints[1].x.toFixed(2);
                t.pathPoints[1].y = +t.pathPoints[1].y.toFixed(2);
                t.textPoint = {x:s.x+Math.cos(a)*s.Radius*3.2,y:s.y+Math.sin(a)*s.Radius*3.2};
                t.textPoint.x = +t.textPoint.x.toFixed(2);
                t.textPoint.y = +t.textPoint.y.toFixed(2);
                t.textAlign = "center";
                t.textVAlign = "center";
                if(a <= Math.PI/2-Math.PI/8) t.textAlign = "left";
                if(a >= Math.PI/2+Math.PI/8 && a <= Math.PI) t.textAlign = "right";
                if(a <= Math.PI+Math.PI/2-Math.PI/8 && a >= Math.PI) t.textAlign = "right";
                if(a >= Math.PI+Math.PI/2+Math.PI/8) t.textAlign = "left";
                if(a > Math.PI/8 && a < Math.PI-Math.PI/8) t.textVAlign = "top";
                if(a > Math.PI+Math.PI/8 && a < Math.PI*2-Math.PI/8) t.textVAlign = "bottom";
                self.updateArrowPoints(s,s2,t); 
                continue;
              }
              var dis = t.y+t.x;
              var d = Math.sqrt((s2.x-s.x)*(s2.x-s.x) + (s2.y-s.y)*(s2.y-s.y));
              var a = self.getAngleRad(s,s2);
              var middle = {x:(s.x + s2.x)/2, y:(s.y + s2.y)/2};
              var mx1 = (Math.cos(a-Math.PI/2)*dis+s.x) + (Math.cos(a)*d/8)*cubicBezierValue;
              var my1 = (Math.sin(a-Math.PI/2)*dis+s.y) + (Math.sin(a)*d/8)*cubicBezierValue;
              var mx2 = (Math.cos(a-Math.PI/2)*dis+s2.x) - (Math.cos(a)*d/8)*cubicBezierValue;
              var my2 = (Math.sin(a-Math.PI/2)*dis+s2.y) - (Math.sin(a)*d/8)*cubicBezierValue;
        
              t.pathPoints = [{x:+mx1.toFixed(2),y:+my1.toFixed(2)},{x:+mx2.toFixed(2),y:+my2.toFixed(2)}];
              var p = self.getPointOnBezier(s,s2,t.pathPoints[0],t.pathPoints[1],0.5); // middle point
              var cx = (dis >= 0 ? 1:-1)*(Math.cos(a-Math.PI/2)*Math.PI/2)*10+p.x;
              var cy = (dis >= 0 ? 1:-1)*(Math.sin(a-Math.PI/2)*Math.PI/2)*10+p.y;

              t.textPoint = {x:+cx.toFixed(2),y:+cy.toFixed(2)};
              var da = a;
              if(da < 0) da = da + Math.PI*2;
              
              t.textAlign = "center";
              t.textVAlign = "center";
              if(da >= Math.PI/8 && da <= Math.PI/8*7) t.textAlign = "left";
              if(da >= Math.PI+Math.PI/8 && da <= Math.PI+Math.PI/8*7) t.textAlign = "right";
              if(cx < middle.x && t.textAlign == "left") t.textAlign = "right";
              if(cx > middle.x && t.textAlign == "right") t.textAlign = "left";
              if(da <= Math.PI/8*3 || da >= Math.PI+Math.PI/8*5) t.textVAlign = "bottom";
              if(da >= Math.PI/8*5 && da <= Math.PI+Math.PI/8*3) t.textVAlign = "top";
              if(cy > middle.y && t.textVAlign == "bottom") t.textVAlign = "top";
              if(cy < middle.y && t.textVAlign == "top") t.textVAlign = "bottom";
              self.updateArrowPoints(s,s2,t); 
            } 
        } 
      };

      self.updateArrowPoints = function(s1,s2,t){
        var state = 0;
        t.arrowPoints = [{x:s1.x,y:s1.y},{x:s2.x,y:s2.y},{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];
        var numSteps = 0;
        // binary search for spot
        function checkPoint(time){
          numSteps++;
          var p = self.getPointOnBezier(s1,s2,t.pathPoints[0],t.pathPoints[1],0.001*time);
          var d = Math.sqrt((p.x-s1.x)*(p.x-s1.x) + (p.y-s1.y)*(p.y-s1.y));
          if(d == 0) return; // problem
          if(state == 0){
            if(Math.round(d) == s1.Radius){
              t.arrowPoints[4] = p;
              p = self.getPointOnBezier(s1,s2,t.pathPoints[0],t.pathPoints[1],1-(0.001*time));
              t.arrowPoints[0] = p;
              state = 1; 
              checkPoint(time);
            }else
            if(d > Math.round(s1.Radius)) checkPoint(time / 2); else checkPoint(time * 1.5);
          }else
          if(state == 1){         
            if(Math.round(d) == Math.round(s1.Radius*1.5)){
              t.arrowPoints[5] = p;
              p = self.getPointOnBezier(s1,s2,t.pathPoints[0],t.pathPoints[1],1-(0.001*time));
              t.arrowPoints[1] = p;
              state = 2;
              return;
            }else
            if(d > Math.round(s1.Radius*1.5)) checkPoint(time / 2); else checkPoint(time * 1.5);
          }
        }
        checkPoint(250); 
        //console.log("Steps:"+numSteps);

        var a1 = self.getAngleRad(t.arrowPoints[0],t.arrowPoints[1])-Math.PI/2;
        var a2 = self.getAngleRad(t.arrowPoints[4],t.arrowPoints[5])+Math.PI/2;

        var x1 = (t.arrowPoints[1].x + Math.cos(a1)*s1.Radius*0.25);
        var y1 = (t.arrowPoints[1].y + Math.sin(a1)*s1.Radius*0.25);
        var x2 = (t.arrowPoints[1].x - Math.cos(a1)*s1.Radius*0.25);
        var y2 = (t.arrowPoints[1].y - Math.sin(a1)*s1.Radius*0.25);

        var x3 = (t.arrowPoints[5].x + Math.cos(a2)*s2.Radius*0.25);
        var y3 = (t.arrowPoints[5].y + Math.sin(a2)*s2.Radius*0.25);
        var x4 = (t.arrowPoints[5].x - Math.cos(a2)*s2.Radius*0.25);
        var y4 = (t.arrowPoints[5].y - Math.sin(a2)*s2.Radius*0.25);

        t.arrowPoints[2] = {x:+x1.toFixed(2),y:+y1.toFixed(2)};
        t.arrowPoints[3] = {x:+x2.toFixed(2),y:+y2.toFixed(2)};
        t.arrowPoints[6] = {x:+x3.toFixed(2),y:+y3.toFixed(2)};
        t.arrowPoints[7] = {x:+x4.toFixed(2),y:+y4.toFixed(2)};
      };

      /// Drag movement
      self.dragGrid = 10;
      self.dragStartX = 0;
      self.dragStartY = 0;
      self.dragStartDX = 0;
      self.dragStartDY = 0;
      self.dragStartAngle = false;
      self.isDragging = null;
      self.wasDragged = false;
      self.newTransition = null;

      self.startDrag = function(item, e, angle){
        e.preventDefault();
        e.stopPropagation();

        self.dragStartX = parseInt(item.x);
        self.dragStartY = parseInt(item.y);
        self.dragStartDX = e.pageX;
        self.dragStartDY = e.pageY;
        self.isDragging = item;
        if(angle) self.dragStartAngle = angle;
        self.wasDragged = false;

        if(self.transitionCircleMode){ 
          self.newTransition = {"Source":item,"Target":0,"x":0,"y":0, Labels:[]};
          var ddx = self.selectedTab >= 0 ? 320 : 0;
          //var ddx = self.selectedTab2 >= 0 ? 320 : 0;
          var dx = (Math.round((e.pageX - ddx + $('#SVGArea'+self.ID).scrollLeft())/self.automatonGraphZoom*100))-item.x;
          var dy = (Math.round((e.pageY - 160 + $('#SVGArea'+self.ID).scrollTop())/self.automatonGraphZoom*100))-item.y;
          self.dragStartDX -= dx;
          self.dragStartDY -= dy;
          self.newTransition.arrowPoints = [{x:item.x,y:item.y},{x:item.x,y:item.y},{x:item.x,y:item.y},{x:item.x,y:item.y}];
          self.newTransition.pathPoints = [{x:item.x,y:item.y},{x:item.x,y:item.y}];
          self.isLabelChooseOpen = false;
          self.isStateChooseOpen = false;
        }

        if(self.transitionClickMode){ 
          if(self.newTransition){
            // now we build the path
            self.addTransition(self.newTransition.Source,item);
            self.selectedState = null;
            self.isDragging = null;
            self.newTransition = null;
            self.wasDragged = true; // prevent state dialog
            $timeout(function(){
              self.transitionClickMode = false;
              self.wasDragged = false; 
            },100);
          }else{
            self.selectedState = item;
            self.newTransition = {"Source":item,"Target":0,"x":0,"y":0, Labels:[]};
            self.newTransition.arrowPoints = [{x:item.x,y:item.y},{x:item.x,y:item.y},{x:item.x,y:item.y},{x:item.x,y:item.y}];
            self.newTransition.pathPoints = [{x:item.x,y:item.y},{x:item.x,y:item.y}];
            self.showToast($translate.instant("AUTOEDIT.CLICKTARGETSTATE"));
          }
        }
      };
      self.moveDrag = function(e){
        if(!self.isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        var nx = self.isDragging.x;
        var ny = self.isDragging.y;

        if(self.newTransition){
          // move new transition arrow line
          self.newTransition.x = 0 + Math.round((e.pageX - self.dragStartDX)/self.automatonGraphZoom*100);
          self.newTransition.y = 0 + Math.round((e.pageY - self.dragStartDY)/self.automatonGraphZoom*100);

          self.newTransition.pathPoints[1] = {x:self.newTransition.Source.x+self.newTransition.x,
                                              y:self.newTransition.Source.y+self.newTransition.y};


          var dis = Math.sqrt((self.isDragging.x - self.newTransition.pathPoints[1].x)*(self.isDragging.x - self.newTransition.pathPoints[1].x)+
                              (self.isDragging.y - self.newTransition.pathPoints[1].y)*(self.isDragging.y - self.newTransition.pathPoints[1].y));

          self.newTransitionBuildState = (dis > self.isDragging.Radius*4 && self.selectedState == null);
          if(self.newTransitionBuildState){
            self.newTransition.pathPoints[1].x = Math.round(self.newTransition.pathPoints[1].x / self.dragGrid) * self.dragGrid;
            self.newTransition.pathPoints[1].y = Math.round(self.newTransition.pathPoints[1].y / self.dragGrid) * self.dragGrid;
          }            

          self.newTransition.arrowPoints[0] = {x:self.newTransition.pathPoints[1].x,y:self.newTransition.pathPoints[1].y};
          var a = self.getAngleRad(self.newTransition.pathPoints[0],self.newTransition.pathPoints[1]);

          var x1 = (self.newTransition.pathPoints[1].x + Math.cos(a-Math.PI/2)*self.stateRadius*0.25)+Math.cos(a)*-10;
          var y1 = (self.newTransition.pathPoints[1].y + Math.sin(a-Math.PI/2)*self.stateRadius*0.25)+Math.sin(a)*-10;
          var x2 = (self.newTransition.pathPoints[1].x - Math.cos(a-Math.PI/2)*self.stateRadius*0.25)+Math.cos(a)*-10;
          var y2 = (self.newTransition.pathPoints[1].y - Math.sin(a-Math.PI/2)*self.stateRadius*0.25)+Math.sin(a)*-10;

          self.newTransition.arrowPoints[2] = {x:+x1.toFixed(2),y:+y1.toFixed(2)};
          self.newTransition.arrowPoints[3] = {x:+x2.toFixed(2),y:+y2.toFixed(2)};

          self.wasDragged = true;
          return;
        }

        if(self.dragStartAngle){ 
          self.isDragging.x = self.dragStartX + Math.cos(self.dragStartAngle) * Math.round((e.pageX - self.dragStartDX)/self.automatonGraphZoom*100)*1.4;
          self.isDragging.y = self.dragStartY + Math.sin(self.dragStartAngle) * Math.round((e.pageY - self.dragStartDY)/self.automatonGraphZoom*100)*1.4;
        }else{
          self.isDragging.x = self.dragStartX + Math.round((e.pageX - self.dragStartDX)/self.automatonGraphZoom*100);
          self.isDragging.y = self.dragStartY + Math.round((e.pageY - self.dragStartDY)/self.automatonGraphZoom*100);
        }
        self.isDragging.x = Math.round(self.isDragging.x / self.dragGrid) * self.dragGrid;
        self.isDragging.y = Math.round(self.isDragging.y / self.dragGrid) * self.dragGrid;

        if(self.isDragging.x != nx || self.isDragging.y != ny)
          self.wasDragged = true;

        self.updatePoints();
      };
      self.endDrag = function(e){
        if(!self.isDragging) return;
        e.preventDefault();
        e.stopPropagation();

        if(self.transitionCircleMode){
          self.transitionCircleMode = false;
          if(self.newTransitionBuildState){
            // create new State on the fly
            var state = self.addState(self.newTransition.pathPoints[1]);
            self.selectedState = state;
            self.newTransitionBuildState = false;
          }
          if(self.selectedState && self.wasDragged){
            self.addTransition(self.isDragging,self.selectedState);
            self.selectedState = null;
          }
          if(self.wasDragged == false) {
            self.transitionClickMode = true;
          }else{
            self.newTransition = null;
          }
        }
        if(self.transitionClickMode){ 
          if(self.newTransitionBuildState){
            // create new State on the fly
            var state = self.addState(self.newTransition.pathPoints[1]);
            self.selectedState = state;
            self.newTransitionBuildState = false;
            self.addTransition(self.isDragging,self.selectedState);
            self.selectedState = null;
            self.newTransition = null;
            self.transitionClickMode = false;
            self.wasDragged = true; // prevent state dialog
          } else
            return; // no endDrag
        }     
        self.dragStartAngle = 0;
        self.isDragging = null;

        // we checked, try to create an undo step
        if(!noSave && self.wasDragged) self.makeUndoStep();

        $timeout(function(){self.wasDragged = false;},50);
      };

    
      self.getTransitionPath = function(s1,s2, t){
        return "M"+s1.x+","+s1.y+" C"+t.pathPoints[0].x+","+t.pathPoints[0].y+" "+t.pathPoints[1].x+","+t.pathPoints[1].y+" "+s2.x+","+s2.y;      
      };

      self.getArrowPoints = function(t){
        if(!t.arrowPoints) return "";
        return t.arrowPoints[0].x+","+t.arrowPoints[0].y+" "+
               t.arrowPoints[2].x+","+t.arrowPoints[2].y+" "+
               t.arrowPoints[3].x+","+t.arrowPoints[3].y;
      }

      self.openLabelChoose = function(transition, ev){
        ev.stopPropagation();
        self.isLabelChooseOpen = true;
        self.selectedTransition = transition;
        self.selectedState = null;
        self.openLabelChoosePosition = {x:ev.pageX, y:ev.pageY-112};    
        self.isStateChooseOpen = false;
        self.selectedTransition.openLabelStackAlphabet = null;
      };
      self.getOpenLabelChooseX = function(){
        var x = self.openLabelChoosePosition.x;
        var d = $('#transitionPopup'+self.ID);
        var w = $(window);
        x = Math.min(x,w.width() - d.width() - 32);
        return Math.floor(x);
      };
      self.getOpenLabelChooseY = function(){
        var y = self.openLabelChoosePosition.y;
        var d = $('#transitionPopup'+self.ID);
        var w = $(window);
        y = Math.min(y,w.height() - d.height() -112 - 32);
        return Math.floor(y);
      };

      self.toggleLabelChoose = function(transition,z){
        if(self.isLabelChooseOpen){      
          var p = transition.Labels.indexOf(z);
          if(p == -1) self.addLabel(transition,z); else self.removeLabel(transition,z);
        }
      };
      self.toggleAllLabels = function(transition,on){
        if(self.isLabelChooseOpen){  
          transition.Labels = []; // clear
          if(on){
            for(var i=0; i < self.automaton.Alphabet.length; i++) 
              self.addLabel(transition,self.automaton.Alphabet[i]);
          }    
        }
      };

      self.toggleTransitionClickMode = function(){
        self.isLabelChooseOpen = false;
        self.isStateChooseOpen = false;
        self.transitionClickMode = !self.transitionClickMode;
        if(self.transitionClickMode) self.showToast($translate.instant("AUTOEDIT.CLICKSOURCESTATE"));
      };

      self.openStateChoose = function(state, ev){
        ev.stopPropagation();
        if(self.wasDragged) return;
        if(self.isStateChooseOpen && self.openStateChooseState == state){
          self.isStateChooseOpen = false; return; // close on second click
        }
        self.openStateChooseState = state;
        self.isStateChooseOpen = true;
        self.selectedState = state;
        self.selectedTransition = null;
        self.openStateChoosePosition = {x:ev.pageX, y:ev.pageY-112};    
        self.isLabelChooseOpen = false;
      };

      self.getOpenStateChooseX = function(){
        var x = self.openStateChoosePosition.x;
        var d = $('#statePopup'+self.ID);
        var w = $(window);
        x = Math.min(x,w.width() - d.width() - 30);
        return x;
      };
      self.getOpenStateChooseY = function(){
        var y = self.openStateChoosePosition.y;
        var d = $('#statePopup'+self.ID);
        var w = $(window);
        y = Math.min(y,w.height() - d.height() -112 - 30);
        return y;
      };

      self.showToast = function(text){ 
        $mdToast.show($mdToast.simple().content(text));
      };

      self.showHint = function(id,event){
        self.showAlert($translate.instant(id),$translate.instant("DESCRIPTION"),event);
      };

      self.showAlert = function(text,title,event){ 
        var alert = $mdDialog.alert({title:title?title:$translate.instant("HINT"), htmlContent:text, ok:$translate.instant("OK")});
        if(event) alert.targetEvent(event);
        return $mdDialog.show(alert);
      };

      self.showConfirm = function(text,title,event,callback){ 
        var conf = $mdDialog.confirm({title:title?title:$translate.instant("HINT"), htmlContent:text, ok:$translate.instant("OK"), cancel:$translate.instant("CANCEL")});
        if(event) conf.targetEvent(event);
        return $mdDialog.show(conf);
      };
      self.showConfirmYesNo = function(text,title,event,callback){ 
        var conf = $mdDialog.confirm({title:title?title:$translate.instant("HINT"), htmlContent:text, ok:$translate.instant("YES"), cancel:$translate.instant("NO")});
        if(event) conf.targetEvent(event);
        return $mdDialog.show(conf);
      };

      self.closePopupPanels = function(){
        self.isLabelChooseOpen = false;
        self.isStateChooseOpen = false; 
        if(self.isSimulationInputKeyboardOpen){
          self.isSimulationInputKeyboardOpen = false;
          // add current word to last input words
          self.addCurrentInputToLastInputs();
        }
      };

      self.unselectClick = function(){
        if(self.transitionClickMode && self.newTransitionBuildState) return; // special case
        self.selectedState = null; 
        self.selectedTransition = null;
        if(self.isDragging){
          self.isDragging = null;
          self.newTransition = null;
        }
        self.transitionCircleMode = false;
        self.transitionClickMode = false;
        self.closePopupPanels();
      };

      // init point values
      self.loadFromJSONString(a.JSON,a.Type);
    }

    ////////////////////////////////////////////////////////////////////////////////
    self.buildThumbAutomaton = function(a){
      a.lastChange = function(){ return moment(this.Changed).fromNow();};
      a.thumbAutomaton = new AAutomaton(JSON.parse(angular.toJson(a)),true); // no save
      var minX = 100000;
      var minY = 100000;
      var maxX = 0;
      var maxY = 0;
      for(var z=0; z < a.thumbAutomaton.automaton.States.length; z++){ 
        var e = a.thumbAutomaton.automaton.States[z];
        minX = Math.min(e.x,minX);
        minY = Math.min(e.y,minY);
        maxX = Math.max(e.x,maxX);
        maxY = Math.max(e.y,maxY);
      }
      a.thumbAutomaton.centerX = Math.round((minX+maxX)/2);
      a.thumbAutomaton.centerY = Math.round((minY+maxY)/2);
    };

    self.loadedAutomatonCount = 10;

    self.loadMoreAutomatons = function(){
      self.loadedAutomatonCount = self.loadedAutomatonCount + 10;
    };

    self.loadFromServer = function (){
      // send local data to update server
      var d = localStorage.getItem("localAutomatons");
      var automatons = d ? d : "[]"; // default is array here

      if(!userLogin.isOfflineMode){  
        localStorage.setItem("localAutomatons","[]");
      }

      var deferred = $q.defer();
      apiPost("getAutomatons",{"automatons":automatons}).success(function(data){
        if(data.result == "OK"){
          self.automatons = data.automatons;
          if(!userLogin.isOfflineMode){  
            localStorage.setItem("localAutomatons",angular.toJson(data.automatons));
          }
          
          for(var i=0; i < self.automatons.length; i++) self.buildThumbAutomaton(self.automatons[i]);

          deferred.resolve("OK");
        }
      });
      return deferred.promise;  
    };

    self.closeAutomaton = function(a,ev){
      var isOpen = -1;
      for (var i=0; i < self.openTabs.length; i++)
        if(self.openTabs[i].ID == a.ID) isOpen = i;

      if(isOpen != -1){
        self.openTabs.splice(isOpen,1);
      }
    };
    
    self.openAutomaton = function(a){
      // init connections
      var isOpen = -1;
      for (var i=0; i < self.openTabs.length; i++)
        if(self.openTabs[i].ID == a.ID) isOpen = i;
        
      if(isOpen == -1) {
        var n = new AAutomaton(a);
        self.openTabs.push(n); 
        isOpen = self.openTabs.length-1; 
      }

      setTimeout(function(){
        $scope.$apply(function(){self.selectedTab = 1+isOpen; });
      },50);
    };

    self.createAutomaton = function(ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/autoedit/newautomaton.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.caption = $translate.instant("AUTOEDIT.CREATENEWAUTOMATON");
          $scope.title = "";
          $scope.description = "";
          $scope.type = "DEA";
          $scope.hide = function() {
            if($.trim($scope.title) == "") return;
            apiPost("createAutomaton",{"name":$scope.title, "description":$scope.description, "type":$scope.type})
             .success(function(data) {
               if(data.result == "FAILED"){
                 $scope.error = "ERRORS.SERVERERROR";
               }
               if(data.result == "OK"){
                 deferred.resolve(data.automaton);
                 $mdDialog.hide();
                 self.automatons.unshift(data.automaton);
         self.openAutomaton(data.automaton);
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

    self.editAutomaton = function (a,ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/autoedit/editautomaton.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.caption = $translate.instant("AUTOEDIT.EDITAUTOMATON");
          $scope.title = a.Name;
          $scope.description = a.Description;
          $scope.type = a.Type;
          $scope.hide = function() {
            apiPost("saveAutomaton",{"id":a.ID, "name":$scope.title,"description":$scope.description, "type":$scope.type, JSON:a.JSON})
             .success(function(data) {
               if(data.result == "OK"){
                 self.loadFromServer();
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
            deferred.reject("canceled"); 
          };
        }
      });
      return deferred.promise;    
    };

    self.downloadAutomaton = function(a,ev){
      var automaton = {"name":a.Name, "description":a.Description, "type":a.Type, "automaton":JSON.parse(a.JSON), "GUID":a.GUID };
      var file = new Blob([JSON.stringify(automaton, null, 2)], {type: "text/json;charset=utf-8"});  
      saveAs(file,"Automaton_"+a.Name+".json");
    };
    self.downloadAutomatonFromTab = function(tab,ev){
      if(!tab) return;
      for(var i=0; i < self.automatons.length; i++){
        if(self.automatons[i].ID == tab.ID){
          var a = self.automatons[i];
          self.downloadAutomaton(a,ev);
          return;
        }
      }
    };

    self.showAlert = function(text,title,event){ 
      var alert = $mdDialog.alert({title:title?title:$translate.instant("HINT"), htmlContent:text, ok:$translate.instant("OK")});
      if(event) alert.targetEvent(event);
      return $mdDialog.show(alert);
    };

    self.uploadAutomaton = function(e){
      var deferred = $q.defer();
      if(e.files.length == 0) return deferred.promise;
      var filename = e.files[0].name;
      var file = e.files[0];
      var reader = new FileReader();
      reader.onload = function(data){
        try{
          var a = {};
          if(data.target.result.indexOf('<?xml version="1.0"') === 0){
            // old AtoCC XML file, try to convert it
            filename = filename.replace(".xml","");
            a = {name:filename,description:"",type:"",
                 automaton:{simulationInput:[], Alphabet:[],States:[]}};
            
            var startState = "";
            var xmlDoc = $.parseXML( data.target.result);
            var xml = $(xmlDoc);
            xml.find("TYPE").each(function(){
              a.type = $(this).attr("value");
            });
            if(a.type != "DEA" && a.type != "NEA" && a.type != "MEALY" && a.type != "MOORE" &&
               a.type != "DKA" && a.type != "NKA" && a.type != "TM"){
              self.showAlert($translate.instant("ERRORS.AUTOMATONTYPENOTSUPPORTED"));
              return;
            }
            var hasSingleCharAlphabet = true;
            xml.find("ALPHABET").each(function(){
              $(this).find("ITEM").each(function(){
                var t = $(this).attr("value")+"";
                if(t.length > 1) hasSingleCharAlphabet = false;
                a.automaton.Alphabet.push(t);
              });
            });
            xml.find("STACKALPHABET").each(function(){
              $(this).find("ITEM").each(function(){
                if(!a.automaton.StackAlphabet) a.automaton.StackAlphabet = [];
                a.automaton.StackAlphabet.push($(this).attr("value"));
              });
            });
            xml.find("TAPEALPHABET").each(function(){
              $(this).find("ITEM").each(function(){
                if(!a.automaton.StackAlphabet) a.automaton.StackAlphabet = [];
                a.automaton.StackAlphabet.push($(this).attr("value"));
              });
            });
            xml.find("INITIALSTATE").each(function(){
              startState = $(this).attr("value");
            });
            xml.find("STACKINITIALCHAR").each(function(){
              var initStackChar = $(this).attr("value");
              var p = a.automaton.StackAlphabet.indexOf(initStackChar);
              a.automaton.StackAlphabet.splice(p,1);
              // move to first element of StackAlphabet
              a.automaton.StackAlphabet.unshift(initStackChar);
            });
            xml.find("TAPEINITIALCHAR").each(function(){
              var initStackChar = $(this).attr("value");
              var p = a.automaton.StackAlphabet.indexOf(initStackChar);
              a.automaton.StackAlphabet.splice(p,1);
              // move to first element of StackAlphabet
              a.automaton.StackAlphabet.unshift(initStackChar);
            });
            
            var stateIDs = 1;
            xml.find("STATE").each(function(){
              var s = {};
              s.ID = stateIDs; stateIDs++;
              s.Name = $(this).attr("name");
              s.x = 0;
              s.y = 0;
              s.Final = $(this).attr("finalstate") == "true";
              if(a.type == "MOORE"){
                if($(this).attr("output") && $(this).attr("output") != "")
                  s.Output = $(this).attr("output");
              }

              s.Radius = 30;
              s.Transitions = [];
              s.Start = startState == s.Name;

              $(this).find("TRANSITION").each(function(){
                var t = {};
                t.x = 0;
                t.y = 0;
                t.Labels = [];
                t.Source = s.ID;
                t.Target = $(this).attr("target"); // take name and replace later
                $(this).find("LABEL").each(function(){
                  if(a.type == "DEA" || a.type == "NEA" || a.type == "MOORE"){
                    var read = $(this).attr("read");
                    if(read == "EPSILON") read = "";
                    t.Labels.push(read);
                  }
                  if(a.type == "MEALY"){
                    var l = [];
                    l.push($(this).attr("read"));
                    l.push($(this).attr("output"));
                    t.Labels.push(l);
                  }
                  if(a.type == "DKA" || a.type == "NKA"){
                    var l = [];
                    l.push($(this).attr("topofstack"));
                    var read = $(this).attr("read");
                    if(read == "EPSILON") read = "";
                    l.push(read);
                    var w = $(this).attr("write");
                    // split w to individual characters of stack alphabet
                    if(w == "EPSILON") w = "";
                    var chars = w.split("");
                    l.push(chars);
                    t.Labels.push(l);
                  }
                  if(a.type == "TM"){
                    var l = [];
                    var read = $(this).attr("read");
                    if(read == "EPSILON") read = "";
                    l.push(read);
                    l.push($(this).attr("write"));
                    var dir = $(this).attr("direction");
                    if(dir == "LEFT") dir = "L";
                    if(dir == "RIGHT") dir = "R";
                    if(dir == "NONE") dir = "N";
                    l.push(dir);
                    t.Labels.push(l);
                  }
                });
                s.Transitions.push(t);
              });
              a.automaton.States.push(s);
            });
            
            if(hasSingleCharAlphabet)
              xml.find("LAYOUT").each(function(){
                $(this).find("SIMULATIONINPUT").each(function(){
                  $(this).find("INPUT").each(function(){
                    if(!a.automaton.lastInputs) a.automaton.lastInputs = [];
                    var t = $(this).attr("value")+"";
                    a.automaton.lastInputs.push(Array.from(t));
                  });
                });
              });  

            /*
            // we do autoLayout so we discard layout
            xml.find("LAYOUT").each(function(){
              $(this).find("STATELAYOUT").each(function(){
                for(var i=0; i < a.automaton.States.length; i++){
                  if(a.automaton.States[i].Name == $(this).attr("name")){
                    $(this).find("LEFT").each(function(){
                      a.automaton.States[i].x = $(this).attr("value");
                    });
                    $(this).find("TOP").each(function(){
                      a.automaton.States[i].y = $(this).attr("value");
                    });
                    break;
                  }
                }
              });
            });
            */
            // remap transition targets to IDs
            for(var i=0; i < a.automaton.States.length; i++){
              for(var z=0; z < a.automaton.States[i].Transitions.length; z++){
                var found = false;
                for(var t=0; t < a.automaton.States.length; t++){
                  if(a.automaton.States[i].Transitions[z].Target == a.automaton.States[t].Name){
                    // replace Names with IDs
                    a.automaton.States[i].Transitions[z].Target = a.automaton.States[t].ID;
                    found = true;
                    break;
                  }
                }
                if(!found) {
                  self.showAlert($translate.instant("ERRORS.FILEREADERROR"));
                  return;
                }
              }
            }
            var r = autoLayoutAutomaton(a.automaton,false);
            if(r.result == "OK"){
              a.automaton = r.automaton;
            }else{
              self.showAlert($translate.instant("ERRORS.FILEREADERROR"));
              return;
            }
          }else{
            a = JSON.parse(data.target.result);
          }
          if(!a.automaton){
            self.showAlert($translate.instant("ERRORS.NOVALIDAUTOMATONFILE"));
            return deferred.promise;;
          }
          apiPost("createAutomaton",{"name":a.name, "description":a.description, "type":a.type, "JSON":JSON.stringify(a.automaton) })
           .success(function(data) {
             if(data.result == "OK"){
               self.automatons.unshift(data.automaton);
               self.openAutomaton(data.automaton);
               deferred.resolve("OK"); 
             }
           });
        }catch(e){
          self.showAlert($translate.instant("ERRORS.FILEREADERROR"));
        }
      };
      reader.readAsText(file);
      $(e).val('');
      return deferred.promise;    
    };
    
    self.deleteAutomaton = function(a,ev){
      var deferred = $q.defer();
      var confirm = $mdDialog.confirm();
      confirm.title($translate.instant("AUTOEDIT.DELETEAUTOMATON"));
      confirm.htmlContent($translate.instant("AUTOEDIT.DELETEAUTOMATONASK",{'NAME':a.Name}) );
      confirm.ariaLabel($translate.instant("AUTOEDIT.DELETEAUTOMATON"));
      confirm.ok($translate.instant("DELETE"));
      confirm.cancel($translate.instant("CANCEL"));
      confirm.targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        apiPost("deleteAutomaton",{"id":a.ID})
         .success(function(data) {
           if(data.result == "OK"){
             // close tab 
             self.closeAutomaton(a,ev);
             self.loadFromServer();
             deferred.resolve("deleted"); 
           }
         });
      });     
      return deferred.promise;       
    };

    self.duplicateAutomaton = function(a,ev){
      var deferred = $q.defer();
      apiPost("createAutomaton",{"name":a.Name, "description":a.Description, "type":a.Type, "JSON":a.JSON, "CreatedFrom":a.GUID })
       .success(function(data) {
         if(data.result == "OK"){
           self.automatons.unshift(data.automaton);
           self.openAutomaton(data.automaton);
           deferred.resolve("OK"); 
         }
       });
      return deferred.promise;    
    };

    self.publishAutomaton = function(a,ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/publishto.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.title = $translate.instant("AUTOEDIT.PUBLISHTO");
          $scope.folderid = 0;
          $scope.folders = [];

          $scope.getFolders = function() {
            apiPost("getPublicFolders",{"type":"automaton", "all":"1", "needsOnline":1})
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
   
            apiPost("publishAutomaton",params)
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

    self.unpublishAutomaton = function(a,ev){
      var deferred = $q.defer();
      apiPost("unpublishAutomaton",{"id":a.ID})
       .success(function(data) {
         if(data.result == "OK"){
           self.loadFromServer();
           deferred.resolve("OK"); 
         }
       });
      return deferred.promise;    
    };

    self.showPublishedAutomatons = function(ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/autoedit/published.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.folderid = 0;
          $scope.folders = [];
          $scope.self = self;

          apiPost("getPublicFolders",{"type":"automaton", "needsOnline":1})
           .success(function(data) {
             if(data.result == "OK"){
               $scope.folders = data.folders;
             }
           });

          $scope.duplicate = function(item){
            self.duplicateAutomaton(item);
            $mdDialog.hide();
          };

          $scope.openFolder = function(f){
            for(var i=0; i < $scope.folders.length; i++) {
              $scope.folders[i].open = false;
            }
            if(f) {
              f.open = true;

              apiPost("getAutomatons",{"public":1, "folderid":f.ID, "needsOnline":1}).success(function(data){
                if(data.result == "OK"){
                  $scope.items = data.automatons;
          
                  for(var i=0; i < $scope.items.length; i++){
                    $scope.items[i].thumbAutomaton = new AAutomaton(JSON.parse(angular.toJson($scope.items[i])),true); // no save
                    var minX = 100000;
                    var minY = 100000;
                    var maxX = 0;
                    var maxY = 0;
                    for(var z=0; z < $scope.items[i].thumbAutomaton.automaton.States.length; z++){ 
                      var e = $scope.items[i].thumbAutomaton.automaton.States[z];
                      minX = Math.min(e.x,minX);
                      minY = Math.min(e.y,minY);
                      maxX = Math.max(e.x,maxX);
                      maxY = Math.max(e.y,maxY);
                    }
                    $scope.items[i].thumbAutomaton.centerX = Math.round((minX+maxX)/2);
                    $scope.items[i].thumbAutomaton.centerY = Math.round((minY+maxY)/2);
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

    self.getWeblink = function(a,ev){
      $mdDialog.show({
        templateUrl: "views/weblink.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.weblink = 'https://flaci.com/A'+a.GUID;
        }
      });
    };

    self.goToMy = function(){
      $location.path('/autoedit');
    };

    self.sharedAutomata = [];

    if($routeParams && $routeParams.automatonGUID){
      apiPost("getAutomatons",{"GUID":$routeParams.automatonGUID, "needsOnline":1}).success(function(data){
        if(data.result == "OK" && data.automatons.length == 1){

          if(self.userLogin.user && data.automatons[0].Owner == self.userLogin.user.ID){
            self.openAutomaton(data.automatons[0]);
            return;
          }
          apiPost("getAutomatons",{}).success(function(data2){
            if(data2.automatons)
            for(var i=0; i < data2.automatons.length; i++){
               if(data2.automatons[i].CreatedFrom == $routeParams.automatonGUID){
                data2.automatons[i].grammar = JSON.parse(data2.automatons[i].JSON);
                self.openAutomaton(data2.automatons[i]);

                // ask to use own copy or start over
                var conf = $mdDialog.confirm({title:$translate.instant("HINT"), htmlContent:$translate.instant("ASKMAKEANOTHERCOPY"), ok:$translate.instant("MAKEANOTHERCOPY"), cancel:$translate.instant("USEEXISTINGCOPY")});
                $mdDialog.show(conf).then(function(){
                  self.duplicateAutomaton(data.automatons[0]).then(function(){ });
                });

                return;
              }
            }
            // does not yet exist, create a new copy
            self.duplicateAutomaton(data.automatons[0]).then(function(){ });
          });
        }
      });      
    }

    self.loadFromServer();
});
