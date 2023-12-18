/*
// a grammar in JSON 
var grammar = {
    "lex": {
        "rules": [
           {"expression":"[0-9]+(?:\\.[0-9]+)?\\b", "name":"Zahl"},
           {"expression":"\\*",                     "name":"Mal"},
           {"expression":"\\/",                     "name":"Durch"},
           {"expression":"-",                       "name":"Minus"},
           {"expression":"\\+",                     "name":"Plus"},
           {"expression":"\\^",                     "name":"Hoch"},
           {"expression":"\\(",                     "name":"KlammerAuf"},
           {"expression":"\\)",                     "name":"KlammerZu"},
           {"expression":"PI\\b",                   "name":"PI"},
           {"expression":"E\\b",                    "name":"E"},
           {"expression":"\\s+",                    "name":"IGNORE"}
        ]
    },

    "bnf": [
        {"name":"expressions","rhs":[[ [{"name":"e", "type":"nt"}],   "alert($1); return $1;"  ]]},

        {"name":"e","rhs":[[ [{"name":"e", "type":"nt"},{"name":"Plus", "type":"t"},{"name":"e", "type":"nt"}] ,   "$$ = $1 + $3;" ],
              [ [{"name":"e", "type":"nt"},{"name":"Minus", "type":"t"},{"name":"e", "type":"nt"}],   "$$ = $1 - $3;" ],
              [ [{"name":"e", "type":"nt"},{"name":"Mal", "type":"t"},{"name":"e", "type":"nt"}],   "$$ = $1 * $3;" ],
              [ [{"name":"e", "type":"nt"},{"name":"Durch", "type":"t"},{"name":"e", "type":"nt"}],   "$$ = $1 / $3;" ],
              [ [{"name":"e", "type":"nt"},{"name":"Hoch", "type":"t"},{"name":"e", "type":"nt"}],   "$$ = Math.pow($1, $3);" ],
              [ [{"name":"KlammerAuf", "type":"t"},{"name":"e", "type":"nt"},{"name":"KlammerZu", "type":"t"}],   "$$ = $2;" ],
              [ [{"name":"Zahl", "type":"t"}],  "$$ = Number(yytext);" ],
              [ [{"name":"E", "type":"t"}],       "$$ = Math.E;" ],
              [ [{"name":"PI", "type":"t"}],      "$$ = Math.PI;" ]]
        }
    ]
};
*/

app.controller('kfgEditController', function($scope, $location, $routeParams, $timeout, $mdDialog, $http, $mdMedia, $mdSidenav, $sce, $q, userLogin, $translate) {     
  
    var apiPost = function (url, data){
      if(userLogin.isOfflineMode && data.needsOnline != 1){
        // localStorage offline mode
        var deferred = $q.defer();
        deferred.promise.error = function(fn){ };
        deferred.promise.success = function (fn) {
          var result = {'result':'OK'};
          if(url == "getGrammars"){
            var d = localStorage.getItem("localGrammars");
            result.grammars = JSON.parse(d ? d : "[]"); // default is array here
            result.grammars.sort(function(a,b){ return a.Changed < b.Changed ? 1 : a.Changed > b.Changed ? -1 : 0; });
          }
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
          if(url == "deleteGrammar"){
            var d = localStorage.getItem("localGrammars");
            var grammars = JSON.parse(d ? d : "[]"); // default is array here
            for(var i=0; i < grammars.length; i++){
              if(grammars[i].ID == data.id){
                grammars.splice(i,1);
                break;
              } 
            }
            localStorage.setItem("localGrammars",angular.toJson(grammars));
          }
          if(url == "createAutomaton"){
            var d = localStorage.getItem("localAutomatons");
            var automatons = JSON.parse(d ? d : "[]"); // default is array here
            var a = {ID:"local"+Math.ceil(Math.random()*99999999), Name:data.name, Description:data.description, Type:data.type, JSON:data.JSON ? data.JSON : '{}',Changed : (new Date()).toMysqlFormat()};
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
    self.user = null;

    self.openTabs = [];
    self.grammars = [];

    self.$location = $location;
    self.$mdMedia = $mdMedia;
    self.userLogin = userLogin;
    self.isSmallScreen = function() { return $mdMedia('sm'); };

    self.userLogin.autoLogin().success(function(){ self.loadFromServer(); });

    self.refreshCodemirror = function(){
      // Refresh CodeMirror
      $('.CodeMirror').each(function(i, el){
        $timeout(function(){el.CodeMirror.refresh();},10);
      });
    };

    self.trustHTML = function(s){
      return $sce.trustAsHtml(s);
    };

    ////////////////////////////////////////////////////////////////////////////////
    // Main model class for Grammars
    ////////////////////////////////////////////////////////////////////////////////
    function AGrammar (g,noSave){
      var self = this;
      self.grammar = JSON.parse(g.JSON); 
      self.GrammarText = g.GrammarText;
      if(!self.grammar.inputText || self.grammar.inputText == "") self.grammar.inputText = 'Start -> EPSILON';
      if(!self.grammar.testInput) self.grammar.testInput = ""; // start with empty text
      if(!self.grammar.lastInput) self.grammar.lastInput = []; // start with empty array
      self.Name = g.Name;
      self.ID = g.ID;
      self.Language = g.Language; 
      self.parseError = null;
      self.runParser = null; 
      self.runParserTokenlist = "";
      self.printGrammar = "";
      self.buildParserOutput = "";
      self.useEarley = true;
      self.runParserOutput = "";
      self.codeMirror = null;
      self.selectedTab2 = -1;
      self.derivationTreeZoom = 100;
      self.displayAsText = true;
      self.displayDerivationList = false;
      
      self.closeExport = function(){
        self.selectedTab2 = -1;
      };

      self.showHint = function(id,event){
        self.showAlert($translate.instant(id),$translate.instant("DESCRIPTION"),event);
      };
      self.showAlert = function(text,title,event){
        var alert = $mdDialog.alert({title:title?title:$translate.instant("HINT"), htmlContent:text, ok:$translate.instant("OK")});
        if(event) alert.targetEvent(event);
        $mdDialog.show(alert);
        setTimeout(function(){ 
          $('.md-dialog-container').css("z-index","120"); 
          $('.md-dialog-backdrop').css("z-index","101");
        },100);
      };

      self.showFullGrammar = function(event){
        var alert = $mdDialog.alert({title:$translate.instant("KFGEDIT.FULLGRAMMAR"), htmlContent:self.printGrammar, ok:$translate.instant("OK")});
        if(event) alert.targetEvent(event);
        $mdDialog.show(alert);
      };

      self.showRenameNonterminal = function(ev){
        $mdDialog.show({
          templateUrl: "views/kfgedit/renamenonterminal.html",
          targetEvent: ev,
        
          clickOutsideToClose: true,
          controller: function ($scope, $mdDialog) {
            $scope.grammar = self.grammar;
            $scope.oldname = self.grammar.bnf.length > 0 ? self.grammar.bnf[0].name : "";
            $scope.hide = function() {
              if($.trim($scope.newname) == "") return;

              if(!noSave) self.makeUndoStep();
              var b = parseBNF(self.grammar.inputText);
              for(var i=0; i < b.bnf.length; i++){ 
                if(b.bnf[i].name == $scope.oldname) b.bnf[i].name = $.trim($scope.newname);
                for(var z=0; z < b.bnf[i].rhs.length; z++){ 
                  for(var t=0; t < b.bnf[i].rhs[z][0].length; t++){ 
                    if(b.bnf[i].rhs[z][0][t].name == $scope.oldname) b.bnf[i].rhs[z][0][t].name = $.trim($scope.newname);
                  }
                }
              }
              self.grammar.inputText = BNF2Text(b);
              self.parseGrammar();
              if(!noSave) self.makeUndoStep();

              $mdDialog.hide();
            };
            $scope.cancel = function() {
              $mdDialog.cancel();
            };
          }
        });
      };
     
      self.history = []; // for undo and save
      self.historyPointer = 0;
      self.isSavedToServer = false;

      self.makeUndoStep = function(){
        if(self.isUndo) return; // not create new steps while performing an undo
        var s = self.grammar.inputText;
        // check if it is already in history 
        if(self.history.length == 0 || s != self.history[self.historyPointer]){
          self.history = self.history.slice(0,self.historyPointer+1);
          self.history.push(s); 
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
        self.grammar.inputText = s;
        self.parseGrammar();
        waitOneSecond(self.saveToServer,3000);
        self.isUndo = false;
      };

      self.redo = function (){
        if(self.historyPointer >= self.history.length-1) return; // nothing to redo;
        self.historyPointer++;
        var s = self.history[self.historyPointer];
        self.isUndo = true;
        self.grammar.inputText = s;
        self.parseGrammar();
        waitOneSecond(self.saveToServer,3000);
        self.isUndo = false;
      };

      self.razTestKFG = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = razTestKFG(self.grammar.inputText);
        if(r.result == "OK"){
          self.grammar.inputText = r.grammar;
          self.parseGrammar();
          if(!noSave) self.makeUndoStep();
        }
      };


      self.isGrammarRegular = function(ev){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        var r = isGrammarRegular(self.grammar.inputText);
        if(r.result == "OK"){
          var alert = $mdDialog.alert({
            title: $translate.instant("RESULT"),
            htmlContent: $translate.instant(r.left ? "KFGEDIT.ISLEFTREGULAR" : "KFGEDIT.ISRIGHTREGULAR"),
            clickOutsideToClose: true,
            targetEvent: ev,
            ok: 'OK'
          });
          $mdDialog.show(alert);
        }else{
          var alert = $mdDialog.alert({
            title: $translate.instant("RESULT"),
            htmlContent: $translate.instant("KFGEDIT.ISNOTREGULAR")+'<br><pre>'+r.reason+'</pre>',
            clickOutsideToClose: true,
            targetEvent: ev,
            ok: 'OK'
          });
          $mdDialog.show(alert);
        }
      };

      self.checkLL1Grammar = function(ev){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        var r = checkLL1(self.grammar.inputText);
        if(r.result == "OK"){
          // show popup with results
          $mdDialog.show({
            templateUrl: "views/kfgedit/ll1.html",
            targetEvent: ev,
            clickOutsideToClose: true,
            controller: function ($scope, $mdDialog) {
              $scope.result = r;
              $scope.bnf = r.bnf;
              $scope.intersectArrays = function(x, y) {
                var arr = x.concat(y);
                var sorted_arr = arr.sort();
                var results = [];
                for (var i = 0; i < arr.length - 1; i++) {
                  if (sorted_arr[i + 1] == sorted_arr[i]) {
                      results.push(sorted_arr[i]);
                  }
                }
                return results;
              };
              for(var i=0; i < r.bnf.length; i++) r.bnf[i].firstFollow = $scope.intersectArrays(r.bnf[i].first,r.bnf[i].follow);
            }
          });
        }
      };
     
      self.cleanupGrammar = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = cleanupGrammar(self.grammar.inputText);
        if(r.result == "OK"){
          self.grammar.inputText = r.grammar;
          self.parseGrammar();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.convertGrammarToCNF = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = convertGrammarToCNF(self.grammar.inputText);
        if(r.result == "OK"){
          self.grammar.inputText = r.grammar;
          self.parseGrammar();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.removeEpsilonGrammar = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = removeEpsilonGrammar(self.grammar.inputText);
        if(r.result == "OK"){
          self.grammar.inputText = r.grammar;
          self.parseGrammar();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.insertEpsilonGrammar = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = insertEpsilonGrammar(self.grammar.inputText);
        if(r.result == "OK"){
          self.grammar.inputText = r.grammar;
          self.parseGrammar();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.removeChainsGrammar = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = removeChainsGrammar(self.grammar.inputText);
        if(r.result == "OK"){
          self.grammar.inputText = r.grammar;
          self.parseGrammar();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.leftFactorGrammar = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = leftFactorGrammar(self.grammar.inputText);
        if(r.result == "OK"){
          self.grammar.inputText = r.grammar;
          self.parseGrammar();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.removeLeftRecursionGrammar = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        if(!noSave) self.makeUndoStep();
        var r = removeLeftRecursionGrammar(self.grammar.inputText);
        if(r.result == "OK"){
          self.grammar.inputText = r.grammar;
          self.parseGrammar();
          if(!noSave) self.makeUndoStep();
        }
      };

      self.convertRegularGrammar2regex = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        var g = self.grammar.inputText;
        var r = isGrammarRegular(g);
        if(r.result == "OK" && r.left){ 
          r = leftRegular2rightRegular(g);
          g = r.grammar;
        }
        if(r.result != "OK"){
          var alert = $mdDialog.alert({
            title: $translate.instant("ERROR"),
            htmlContent: $translate.instant("KFGEDIT.CANNOTTRANSORMWITHOUTREGULAR"),
            clickOutsideToClose: true,
            ok: 'OK'
          });
          $mdDialog.show(alert);
          return;
        }
        self.saveToServer();
        var r = convertRegularGrammar2NEA(g);
        if(r.result == "OK"){
          var r = ea2regex(r.automaton,"NEA");
          if(r.result == "OK"){
            var alert = $mdDialog.alert({
              title: $translate.instant("REGEXPEDIT.REGEXP"),
              htmlContent: $translate.instant("AUTOEDIT.TRANSFORM.EATOREGEXPTEXT",{"REGEXP":'<span class="selectable LRPaddingSpan">'+r.regex+'</span>'})+"<br><br>"+'<a class="md-button md-primary" href="regexp?s='+encodeURIComponent(r.regex)+'">'+$translate.instant("REGEXPEDIT.OPENIN")+'</a>',
              clickOutsideToClose: true,
              ok: 'OK'
            });
            $mdDialog.show(alert);
          }
        }
      };

      self.convertRegularGrammar2NEA = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        var g = self.grammar.inputText;
        var r = isGrammarRegular(g);
        if(r.result == "OK" && r.left){ 
          r = leftRegular2rightRegular(g);
          g = r.grammar;
        }
        if(r.result != "OK"){
          var alert = $mdDialog.alert({
            title: $translate.instant("ERROR"),
            htmlContent: $translate.instant("KFGEDIT.CANNOTTRANSORMWITHOUTREGULAR"),
            clickOutsideToClose: true,
            ok: 'OK'
          });
          $mdDialog.show(alert);
          return;
        }
        self.saveToServer();
        var r = convertRegularGrammar2NEA(g);
        if(r.result == "OK"){
          // use r.automaton 
          apiPost("createAutomaton",{"name":"G => NEA", "type":"NEA"})
            .success(function(data) {
              if(data.result == "FAILED"){
                alert($translate.instant("ERRORS.ERRORCREATINGAUTOMATON"));
              }
              if(data.result == "OK"){
                var layout = autoLayoutAutomaton(r.automaton);
                if(layout.result == "OK") r.automaton = layout.automaton;
                apiPost("saveAutomaton",{"id":data.automaton.ID, "name":data.automaton.Name, "type":data.automaton.Type, JSON:angular.toJson(r.automaton)})
                 .success(function(data){ if(data.result == "OK") {
                  // go to autoedit
                  $location.path("/autoedit");
                }});

            
              }
            })
            .error(function(data, status, headers, config) {
              alert($translate.instant("ERRORS.SERVERERROR"));
            });      
        }
      };

      self.convertContextFreeGrammar2NKA = function(){
        self.parseGrammar();
        if(self.parseError) {
          self.showAlert($translate.instant("KFGEDIT.HASSTILLERRORS"));
          return;
        }
        self.saveToServer();
        var r = convertContextFreeGrammar2NKA(self.grammar.inputText);
        if(r.result == "OK"){
          // use r.automaton 
          apiPost("createAutomaton",{"name":"G => NKA", "type":"NKA"})
            .success(function(data) {
              if(data.result == "FAILED"){
                alert($translate.instant("ERRORS.ERRORCREATINGAUTOMATON"));
              }
              if(data.result == "OK"){
                var layout = autoLayoutAutomaton(r.automaton);
                if(layout.result == "OK") r.automaton = layout.automaton;
                apiPost("saveAutomaton",{"id":data.automaton.ID, "name":data.automaton.Name, "type":data.automaton.Type, JSON:angular.toJson(r.automaton)})
                 .success(function(data){ if(data.result == "OK") {
                  // go to autoedit
                  $location.path("/autoedit");
                }});

            
              }
            })
            .error(function(data, status, headers, config) {
              alert($translate.instant("ERRORS.SERVERERROR"));
            });      
        }
      };

      self.generateRandomWord = function(){ 
        var word = generateGrammarRandomWord(self.grammar.bnf);
        self.grammar.testInput = word.join("");
      };

      self.parseGrammar = function(keepBNF){
        if(!keepBNF) self.grammar.bnf = []; // empty grammar
        // fill grammar with rules 
        self.parseError = null;
        try {
          self.grammar.inputText = self.grammar.inputText.replace(/ε/g,"EPSILON");
          var pr = parseBNF(self.grammar.inputText);
          self.grammar.lex = pr.lex;
          if(!keepBNF){
            self.grammar.bnf = pr.bnf;
          }else{
            for(var i=0; i < pr.bnf.length; i++){
              for(var z=0; z < pr.bnf[i].rhs.length; z++){
                self.grammar.bnf[i].rhs[z][1] = pr.bnf[i].rhs[z][1];
              }
            }
          }
          self.terminals = pr.terminals;
          self.nonterminals = pr.nonterminals;
          
          var j = VCC2JISON(angular.toJson(self.grammar));

          self.buildParserOutput = "";
          if(pr.bnf.length == 0) return;

          Jison.print = function print () {
            for(var i=0; i < arguments.length; i++)
              self.buildParserOutput += arguments[i];
            self.buildParserOutput += "\n";
          };

          //var parser = Jison.Generator(j, {type: "lalr", noDefaultResolve:true}); // noDefaultResolve:true
          //self.hasConflicts = false;
          //if(parser.conflicts){
          //  self.hasConflicts = true;
            parser = Jison.Generator(j, {type: "lalr"}); // noDefaultResolve:true
          //}
          self.runParser = parser.createParser();
   
          var p = parser.generate({moduleType:"js", globalCode:""});
          // test parser here
          if(self.codeParser != p){
            // refresh on change
            self.derivationTrees = null; // reset trees on grammar change
            $("#derivationTree"+self.ID).html("");

            self.codeParser = p; 
          }
                
          var indent = "";
          var s = "﻿G = (N, T, P, s)<br><br>";

          s += 'N = {<span style="color:#f50">'+self.nonterminals.join(", ");
          s += '</span>}<br>';
          s += 'T = {<span style="color:blue">'+(self.terminals.join(", ").replace(" \u00A0,"," ' ',"));
          s += '</span>}<br>';
          s += 'P = {<br>';
          var maxlen = 0;
          for(var i=0; i < self.grammar.bnf.length; i++)
            maxlen = Math.max(maxlen, self.grammar.bnf[i].name.length);

          for(var i=0; i < maxlen; i++) indent += " ";

          for(var i=0; i < self.grammar.bnf.length; i++){
            s += "   "+'<span style="color:#f50">'+self.grammar.bnf[i].name+'</span>';
            //s += "   "+self.grammar.bnf[i].name;
            for(var t = self.grammar.bnf[i].name.length; t < maxlen; t++) s += " "; 
            s += " -&gt; ";
            for(var z=0; z < self.grammar.bnf[i].rhs.length; z++){ 
              if(self.grammar.bnf[i].rhs.length > 3)
                if(z > 0) s += "<br>"+indent+"     | ";
              if(self.grammar.bnf[i].rhs.length <= 3)
                if(z > 0) s += "| ";
              if(self.grammar.bnf[i].rhs[z][0].length == 0) s += '<span style="color:#a50;">&epsilon;</span> '
              for(var t=0; t < self.grammar.bnf[i].rhs[z][0].length; t++){
                s += (self.grammar.bnf[i].rhs[z][0][t].type == "t" ? '<span style="color:blue">' : '<span style="color:#f50">') + 
                     (self.grammar.bnf[i].rhs[z][0][t].name.indexOf('\u00A0') != -1 ? "'"+self.grammar.bnf[i].rhs[z][0][t].name+"'" : self.grammar.bnf[i].rhs[z][0][t].name)+ '</span> ';    
              }
            }
            s += "<br>";
          }
          s += '}<br>';
          s += 's = <span style="color:#f50">'+(self.grammar.bnf.length > 0 ? self.grammar.bnf[0].name : "")+'</span>';
         
          self.printGrammar = s;
          self.printGrammar = $sce.trustAsHtml('<span style="-webkit-user-select: all;user-select: all;">'+self.printGrammar+"</span>");

          // syntax highlighter for grammar
          var mode = {start: [{"regex":new RegExp("([ ]|^)"+escapeRegExp("EPSILON")+"\\b"),"token":"comment","org":"EPSILON"}]};
          mode.start.push({"regex":new RegExp("([ ]|^)"+escapeRegExp("ASCII")+"\\b"),"token":"comment","org":"ASCII"});
          for(var i=0; i < self.nonterminals.length; i++)    
            mode.start.push({"regex":new RegExp("([ ]|^)"+escapeRegExp(self.nonterminals[i])+"\\b"),"token":"string-2","org":self.nonterminals[i]});
          for(var i=0; i < self.terminals.length; i++)
            if(self.terminals[i] != "ASCII"){
//              if(self.terminals[i] == "-" || self.terminals[i] == "." || self.terminals[i] == "*" || self.terminals[i] == "," || self.terminals[i] == ";" || self.terminals[i] == "_" || self.terminals[i] == "=")
              mode.start.push({"regex":new RegExp(escapeRegExp(self.terminals[i])),"token":"string","org":self.terminals[i]}); //else
//              mode.start.push({"regex":new RegExp("\\b"+escapeRegExp(self.terminals[i])+"\\b"),"token":"string","org":self.terminals[i]});
            }
          // sort by length
          mode.start.sort(function(a,b){
            if(b.org.length == a.org.length) return b.token.length - a.token.length;
            return b.org.length - a.org.length;
          });
          mode.start.unshift({"regex":new RegExp(escapeRegExp("->")),"token":"arrow"});
          mode.start.unshift({"regex":new RegExp(escapeRegExp("|")),"token":"strong"});

          CodeMirror.defineSimpleMode("kfgedit",mode);
          if(self.codeMirror) self.codeMirror.setOption("mode","kfgedit");

        }catch(e){
          console.log(e); 
          self.parseError = e.message; 
          self.derivationTrees = null; // reset trees on grammar change
          $("#derivationTree"+self.ID).html("");
        }
      };

      self.codemirrorLoaded = function(editor){
        self.codeMirror = editor; 
      };

      if(!noSave) self.makeUndoStep();
      self.parseGrammar(); // run on load

      self.derivationList = [];

      self.derivationTreeStep = -1;
      self.nextDerivationStep = function(){
        if(!self.derivationTrees || self.derivationTrees.length == 0){
          self.run();
        }
        self.derivationTreeStep++;
        self.refreshDerivationTree();
      };

      self.rightDerivation = false;

      self.refreshDerivationTree = function(){
        var list = [];
        var stop = false;
        var lastNow = [self.derivationTrees[self.derivationTreeIndex].Content];

        function joinSatzform (n){
          var s = "";
          for(var z=0; z < n.length; z++){
            for(var i=0; i < self.terminals.length; i++)
              if(n[z] == self.terminals[i]) s += '<span class="t">'+n[z]+'</span> ';
            for(var i=0; i < self.nonterminals.length; i++)
              if(n[z] == self.nonterminals[i]) s += '<span class="nt">'+n[z]+'</span> ';
          }
          if(n == "EPSILON" || n == "&epsilon;" ) s = 'ε';
          return s;
        }

        function invisible(t){
          t.Class = "Node invisible";
          for(var i=0; i < t.Nodes.length; i++) invisible(t.Nodes[i]);
        }
        invisible(self.derivationTrees[self.derivationTreeIndex]);

        function rec(t,now){
          for(var i=0; i < self.terminals.length; i++)
            if(t.Content == self.terminals[i]) t.Class = "Node t";
          for(var i=0; i < self.nonterminals.length; i++)
            if(t.Content == self.nonterminals[i]) t.Class = "Node nt";
          if(t.Content == "&epsilon;") t.Class = "Node e";

          if(self.derivationTreeStep >= 0 && self.derivationTreeStep <= list.length) stop = true; // terminate befor reaching the end
          if(stop) return;

          var rhs = [];
          for(var i=0; i < t.Nodes.length; i++) rhs.push(t.Nodes[i].Content);
          
          if(rhs.length > 0){
            list.push({current:joinSatzform(now), node:t, rule:'<span class="nt">'+t.Content+'</span>&nbsp;→&nbsp;'+joinSatzform(rhs)});
            if(self.rightDerivation){
              for(var i=now.length-1; i > -1; i--){ 
                if(now[i] == t.Content){ 
                  now.splice.apply(now,[i,1].concat(rhs));
                  break;
                }
              }
			}else{
              for(var i=0; i < now.length; i++){ 
                if(now[i] == t.Content){ 
                  now.splice.apply(now,[i,1].concat(rhs));
                  break;
                }
              }
            } 
            lastNow = now.slice(0);  
            if(self.derivationTreeStep >= 0 && self.derivationTreeStep <= list.length) stop = true; // terminate befor reaching the end
          }

          if(self.rightDerivation){
            for(var i=t.Nodes.length-1; i > -1; i--) rec(t.Nodes[i],now);
          }else{
            for(var i=0; i < t.Nodes.length; i++) rec(t.Nodes[i],now);
          }
          if(t.Content == "" || t.Content == "EPSILON" || t.Content == "&epsilon;") {t.Content = "&epsilon;"; t.Class = "Node e"; }
        }
        rec(self.derivationTrees[self.derivationTreeIndex],lastNow);

        // left derivation
        list.push({current:joinSatzform(lastNow), node:null, rule:""});
  
        DrawTree({ 
          Container: document.getElementById("derivationTree"+self.ID),
          RootNode: self.derivationTrees[self.derivationTreeIndex]
        });    

        self.derivationList = list;
        if(self.derivationTreeStep >= list.length) self.derivationTreeStep = -1; // reset single step mode
      };

      self.derivationTreeIndex = 0;
      self.derivationTrees = [];

      self.run = function(silent){
        self.showDerivationPanel = true;
        $timeout(function(){
          self.runDerivation(silent);
        },10);
      }
      self.runDerivation = function(silent){
        self.derivationTreeStep = -1; // reset single step mode
        self.runParserTokenlist = ""; 
        document.getElementById("derivationTree"+self.ID).innerHTML = "";
        if(!self.runParser) return;

        var p = self.grammar.lastInput.indexOf(self.grammar.testInput);
        if(p >= 0) self.grammar.lastInput.splice(p,1);
        self.grammar.lastInput.unshift(self.grammar.testInput);
        while(self.grammar.lastInput.length > 10) self.grammar.lastInput.pop();
        
        try{
          var x = self.runParser.lexer.setInput(self.grammar.testInput.replace(/ /g,"\u00A0"));
          var tokenList = [];
          while(true){ 
            var t = self.runParser.terminals_[x.lex()];
            if(!t || t == "EOF") break;
            tokenList.push(t);
          }
          self.runParserTokenlist = "["+tokenList.join(", ")+"]";
          self.tooManyTrees = false;
          if(self.useEarley) {
            self.derivationTrees = [];
            var g = parseBNF(self.grammar.inputText);
            self.Earley2 = new Earley2(self.grammar,tokenList);
            self.derivationTreeIndex = 0;
            var success = self.Earley2.parse();
            if(!success){
              throw "";
            }else{
              try{
                self.derivationTrees = self.Earley2.getDerivationTrees();
              }catch(e){
                var alert = $mdDialog.alert({
                  title: $translate.instant("HINT"),
                  htmlContent: $translate.instant("KFGEDIT.TOOMANYTREES",{"INPUT":self.grammar.testInput}),
                  clickOutsideToClose: true,
                  ok: 'OK'
                });
                if(!silent) $mdDialog.show(alert);

                var src = self.codeParser;
                src = "var input = '"+escapeJavaScriptString(self.grammar.testInput.replace(/ /g,"\u00A0"))+"';\n" + 
                      src + " return parser.parse(input);";
                var tree = (new Function(src)).call({});
             
                self.derivationTrees = [tree];
                self.tooManyTrees = true;
              }
              self.refreshDerivationTree();
            }
          }else{
            var src = self.codeParser;
            src = "var input = '"+escapeJavaScriptString(self.grammar.testInput.replace(/ /g,"\u00A0"))+"';\n" + 
                  src + " return parser.parse(input);";
            var tree = (new Function(src)).call({});
             
            self.derivationTrees = [tree];
            self.derivationTreeIndex = 0;
            self.refreshDerivationTree();
          }
          self.runParserOutput = ""; //"true\n"+self.buildParserOutput; 
        }catch(e){
          var alert = $mdDialog.alert({
            title: $translate.instant("ERROR"),
            htmlContent: $translate.instant("KFGEDIT.DERIVEERROR",{"INPUT":self.grammar.testInput})+'<br><pre>'+e+'</pre>',
            clickOutsideToClose: true,
            ok: 'OK'
          });
          if(!silent) $mdDialog.show(alert);
        }      
      };

      $scope.$watch(function(){ return angular.toJson(self.grammar); },function(newValue, oldValue){
        if(oldValue && oldValue != newValue)
          waitOneSecond(self.saveToServer);
      });
             
      self.saveToServer = function(){
        // lazy save with 1 sec debounce 
        // push s to server as current save state of automaton
        self.isSavedToServer = false;
 
        var deferred = $q.defer();
        apiPost("saveGrammar",{id:self.ID, name:self.Name, JSON:angular.toJson(self.grammar), GrammarText:self.grammar.inputText, language: self.Language})
         .success(function(data){ if(data.result == "OK") {self.isSavedToServer = true; deferred.resolve("OK");}});
        return deferred.promise;  
      };
      
      self.downloadDerivationPNG = function(){
        var d = $('#derivationTree'+self.ID);
        d.css("width",d.get(0).scrollWidth);
        d.css("height",d.get(0).scrollHeight);
        html2canvas(d.get(0)).then(function (canvas) {
          d.css("width","");
          d.css("height","");
          var a = document.createElement('a');
          a.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
          a.download = self.Name+'_Derivation.png';
          $("body").append(a);
          setTimeout(function(){ a.click(); },100);
          setTimeout(function(){ $(a).remove(); },2000);
        });
      };
      
      self.downloadSyntaxPNG = function(){
        var d = $('#syntaxRules'+self.ID);
        d.css("background","white");
        d.css("width",d.get(0).scrollWidth);
        d.css("height",d.get(0).scrollHeight);
        html2canvas(d.get(0)).then(function (canvas) {
          d.css("width","100%");
          d.css("height","");
          d.css("background","");
          var a = document.createElement('a');
          a.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
          a.download = self.Name+'_Syntax.png';
          $("body").append(a);
          setTimeout(function(){ a.click(); },100);
          setTimeout(function(){ $(a).remove(); },2000);
        });
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
        itemMoved: function (event) { self.updateGrammarText(); },
        orderChanged: function (event) { self.updateGrammarText(); },
        containment: 'body',
        clone:false
      };
    
      self.updateGrammarText = function(){ 
        $timeout(function(){
          self.grammar.inputText = BNF2Text(self.grammar);
          self.parseGrammar(true); 
          self.makeUndoStep();
          if(self.grammar.testInput && self.grammar.testInput != "") self.run(true);
        },10);
      };

      self.deselectAll = function(){
        self.selectedRule = null;
        self.selectedRHS = null;
        self.selectedRHSElement = null;
      };

      self.getTokenByName = function(n){
        for(var i = 0; i < self.grammar.lex.rules.length; i++){
          if(self.grammar.lex.rules[i].name == n) return self.grammar.lex.rules[i];
        }
        return null;
      };

      self.replaceTokenSpace = function(e){
        if(e.name != " ") e.name = $.trim(e.name);
        if(e.name == "") e.name = " ";
//        if(e.name != " ") e.name = e.name.replace(/ /g,"");
        e.name = e.name.replace(/ /g,"\u00A0");
      };

      self.addToken = function(){
        var n = 1; 
        while(self.getTokenByName("T"+n)) n++;
        var t = {expression:"",name:"T"+n};
        self.grammar.lex.rules.unshift(t);
        self.selectToken(t);

        $timeout(function(){  
          $('#tokenlist_'+self.ID).animate({scrollTop: 0}, 1000);
          $('#tokenlist_'+self.ID+" input").first().focus(); 
        },200);

        self.updateGrammarText(); 
        return t.name;
      };

      self.deleteToken = function(t){
        self.grammar.lex.rules.splice(self.grammar.lex.rules.indexOf(t),1);
        self.updateTokenNamesInBNF(null,t[1]);
        if(self.selectedToken == t) self.selectedToken = null;
        if(self.selectedRHSElement && self.selectedRHSElement.name == t.name) self.selectedRHSElement = null;
        self.updateGrammarText(); 
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
        
        self.updateGrammarText();
      };

      self.getSelectedRHSText = function(){ 
        if(!self.selectedRule || !self.selectedRHS){
          return $translate.instant("TDIAG.GLOBALCODE");
        }
        var a = $translate.instant("TDIAG.SATTRIBUTEFOR")+" "+self.selectedRule.name + " -> ";
        var s = "";
        for(var i=0; i < self.selectedRHS[0].length; i++)
          s += (s != "" ? " ":"")+self.selectedRHS[0][i].name;
        if(s == "") s = "ε";
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
        while(self.getRuleByName("N"+n)) n++;
        var rhs = [ [ ] ,"" ];
        var r = {"name":"N"+n,"rhs":[rhs]};
        self.grammar.bnf.push(r);
        self.deselectAll();
        self.selectRHS(rhs,r);

        $timeout(function(){  
          $('#parserlist_'+self.ID).animate({scrollTop: 9999}, 1000);
          $('#parserlist_'+self.ID+" input").focus(); 
        },200);
        self.updateGrammarText(); 
        return r.name;
      };

      self.openAddPanelPosition = {x:0,y:0};
      self.setAddPanelPosition = function(ev){
        self.openAddPanelPosition = {x:ev.pageX, y:ev.pageY+20}; 
      };

      self.getOpenAddPanelX = function(){
        var w = $(window);
        var x = self.openAddPanelPosition.x+20;
        var d = $('#parserlistAddPanel_'+self.ID);
        x = Math.min(x,w.width()*0.8 - d.width() - 30);
        return x;
      };
      self.getOpenAddPanelY = function(){
        var w = $(window);
        var y = self.openAddPanelPosition.y - 100;
        var d = $('#parserlistAddPanel_'+self.ID);
        y = Math.min(y,w.height()*0.8 - d.height() - 30);
        return y;
      };

      self.deleteRule = function(r){
        self.deselectAll();
        self.grammar.bnf.splice(self.grammar.bnf.indexOf(r),1);
        self.updateRuleNamesInBNF(null,r.name);
        self.updateGrammarText(); 
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
        self.updateGrammarText(); 
      };

      self.addRuleRHS = function(rule) {
        var rhs = [ [ ] ,"" ];
        rule.rhs.push(rhs);
        self.deselectAll();
        self.selectRHS(rhs,rule);
        self.updateGrammarText(); 
      };

      self.deleteRuleRHS = function(rule,rhs){
        rule.rhs.splice(rule.rhs.indexOf(rhs),1);
        if(self.selectedRHS == rhs) { self.selectedRHS = null; }
        if(rule.rhs.length == 0){
          self.addRuleRHS(rule);
        }
        self.updateGrammarText(); 
      };

      self.addRuleRHSElement = function(rhs,name,type) {
        var e = {"name":name, "type":type};
        rhs[0].push(e);
        self.selectedRHSElement = e;
        self.updateGrammarText(); 
      };

      self.deleteRuleRHSElement = function(rhs,e){
        rhs[0].splice(rhs[0].indexOf(e),1);
        if(self.selectedRHSElement == e) { self.selectedRHSElement = null; }
        self.updateGrammarText(); 
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
        for(var i=0; i < self.grammar.bnf.length; i++){
          if(self.grammar.bnf[i] == r){
            for(var z=0; z < self.grammar.bnf[i].rhs.length; z++){
              if(self.grammar.bnf[i].rhs[z] == rhs){
                for(var t=0; t < self.grammar.bnf[i].rhs[z][0].length; t++){
                  if(self.grammar.bnf[i].rhs[z][0][t] == e){
                    $('#parserlist_'+self.ID+'_'+i+'_'+z+'_'+t+' input').focus();
                  }
                }
              }
            }
          }
        }
      };

      if(self.grammar.testInput && self.grammar.testInput != "") $timeout(self.run,100);
      return self;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // Grammar Editor controller
    ////////////////////////////////////////////////////////////////////////////////
    self.loadedGrammarsCount = 10;

    self.loadMoreGrammars = function(){
      self.loadedGrammarsCount = self.loadedGrammarsCount + 10;
    };

    self.loadFromServer = function (){
      // send local data to update server
      var d = localStorage.getItem("localGrammars");
      var grammars = d ? d : "[]"; // default is array here

      if(!userLogin.isOfflineMode){  
        localStorage.setItem("localGrammars","[]");
      }

      var deferred = $q.defer();
      apiPost("getGrammars",{"grammars":grammars}).success(function(data){
        if(data.result == "OK"){
          self.grammars = data.grammars;
          for(var i=0; i < self.grammars.length; i++) self.grammars[i].grammar = JSON.parse(self.grammars[i].JSON);

          if(!userLogin.isOfflineMode){  
            localStorage.setItem("localGrammars",angular.toJson(data.grammars));
          }
          for(var i=0; i < self.grammars.length; i++)
            self.grammars[i].lastChange = function(){ return moment(this.Changed).fromNow();};

          deferred.resolve("OK");
        }
      });
      return deferred.promise;  
    };

    self.closeGrammar = function(g,ev){
      var isOpen = -1;
      for (var i=0; i < self.openTabs.length; i++)
        if(self.openTabs[i].ID == g.ID) isOpen = i;

      if(isOpen != -1){
        self.openTabs.splice(isOpen,1);
      }
    };
    
    self.openGrammar = function(g){
      // init connections
      var isOpen = -1;
      for (var i=0; i < self.openTabs.length; i++)
        if(self.openTabs[i].ID == g.ID) isOpen = i;
        
      if(isOpen == -1) {
        var n = new AGrammar(g);
        self.openTabs.push(n); 
        isOpen = self.openTabs.length-1; 
      }

      $timeout(function(){
        self.selectedTab = 1+isOpen;
      },250);
    };

    self.deleteGrammar = function(g,ev){
      var deferred = $q.defer();
      var confirm = $mdDialog.confirm();
      confirm.title($translate.instant("KFGEDIT.DELETEGRAMMAR"));
      confirm.htmlContent($translate.instant("KFGEDIT.DELETEGRAMMARASK",{'NAME':g.Name}) );
      confirm.ariaLabel($translate.instant("KFGEDIT.DELETEGRAMMAR"));
      confirm.ok($translate.instant("DELETE"));
      confirm.cancel($translate.instant("CANCEL"));
      confirm.targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        apiPost("deleteGrammar",{"id":g.ID})
         .success(function(data) {
           if(data.result == "OK"){
             // close tab 
             self.closeGrammar(g,ev);
             self.loadFromServer();
             deferred.resolve("deleted"); 
           }
         });
      });     
      return deferred.promise;       
    };
  
    self.createGrammar = function(ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/kfgedit/newgrammar.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.caption = $translate.instant("KFGEDIT.CREATENEWGRAMMAR");
          $scope.self = {};
          $scope.self.title = "";
          $scope.self.description = "";
          $scope.self.language = "L";

          $scope.hide = function() {
            if($scope.self.language.length > 5) return;
            if($.trim($scope.self.title) == "") return;
            apiPost("createGrammar",{"name":$scope.self.title,"description":$scope.self.description, "language":$scope.self.language})
             .success(function(data) {
               if(data.result == "FAILED"){
                 $scope.error = "ERRORS.SERVERERROR";
               }
               if(data.result == "OK"){
                 deferred.resolve(data.grammar);
                 $mdDialog.hide();
                 self.grammars.unshift(data.grammar);
				 self.openGrammar(data.grammar);
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

    self.editGrammar = function (g,ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/kfgedit/newgrammar.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.caption = $translate.instant("KFGEDIT.EDITGRAMMAR");
          $scope.self = {};
          $scope.self.title = g.Name;
          $scope.self.description = g.Description;
          $scope.self.language = g.Language;

          $scope.hide = function() {
            if($scope.self.language.length > 5) return;
            apiPost("saveGrammar",{"id":g.ID, "name":$scope.self.title,"description":$scope.self.description, "language":$scope.self.language, JSON:g.JSON, GrammarText:g.GrammarText})
             .success(function(data) {
               if(data.result == "FAILED"){
                 $scope.error = "ERRORS.SERVERERROR";
               }
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
    
    self.downloadGrammar = function(g,ev){
      var grammar = {"name":g.Name, "description":g.Description, "language":g.Language, "grammar":JSON.parse(g.JSON), "text":g.GrammarText };
      var file = new Blob([JSON.stringify(grammar, null, 2)], {type: "text/json;charset=utf-8"});  
      saveAs(file,"Grammar_"+g.Name+".json");
    };
    
    self.downloadGrammarFromTab = function(tab,ev){
      if(!tab) return;
      for(var i=0; i < self.grammars.length; i++){
        if(self.grammars[i].ID == tab.ID){
          var g = self.grammars[i];
          self.downloadGrammar(g,ev);
          return;
        }
      }
    }
    self.showAlert = function(text,title,event){ 
      var alert = $mdDialog.alert({title:title?title:$translate.instant("HINT"), htmlContent:text, ok:$translate.instant("OK")});
      if(event) alert.targetEvent(event);
      return $mdDialog.show(alert);
    };

    self.uploadGrammar = function(e){
      var deferred = $q.defer();
      if(e.files.length == 0) return deferred.promise;
      var filename = e.files[0].name;
      var file = e.files[0];
      var reader = new FileReader();
      reader.onload = function(data){
        try{
          var g = JSON.parse(data.target.result);
          if(!g.grammar){
            self.showAlert($translate.instant("ERRORS.NOVALIDGRAMMARFILE"));
            return deferred.promise;;
          }
          apiPost("createGrammar",{"name":g.name, "description":g.description, "language":g.language, "GrammarText":g.text, "JSON":JSON.stringify(g.grammar)})
           .success(function(data) {
             if(data.result == "OK"){
               self.grammars.unshift(data.grammar);
               self.openGrammar(data.grammar);
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
    

    self.duplicateGrammar = function(g,ev){
      var deferred = $q.defer();
      apiPost("createGrammar",{"name":g.Name, "description":g.Description, "language":g.Language, "GrammarText":g.GrammarText, "JSON":g.JSON, "CreatedFrom":g.GUID})
       .success(function(data) {
         if(data.result == "OK"){
           self.grammars.unshift(data.grammar);
           self.openGrammar(data.grammar);
           deferred.resolve("OK"); 
         }
       });
      return deferred.promise;    
    };

    self.publishGrammar = function(g,ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/publishto.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.title = $translate.instant("KFGEDIT.PUBLISHTO");
          $scope.folderid = 0;
          $scope.folders = [];

          $scope.getFolders = function() {
            apiPost("getPublicFolders",{"type":"grammar","all":1})
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

            params.id = g.ID;
   
            apiPost("publishGrammar",params)
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

    self.unpublishGrammar = function(g,ev){
      var deferred = $q.defer();
      apiPost("unpublishGrammar",{"id":g.ID})
       .success(function(data) {
         if(data.result == "OK"){
           self.loadFromServer();
           deferred.resolve("OK"); 
         }
       });
      return deferred.promise;    
    };

    self.showPublishedGrammars = function(ev){
      var deferred = $q.defer();
      $mdDialog.show({
        templateUrl: "views/kfgedit/published.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.Institution = userLogin.user ? userLogin.user.Institution : 0;
          $scope.folderid = 0;
          $scope.folders = [];

          apiPost("getPublicFolders",{"type":"grammar", "needsOnline":1})
           .success(function(data) {
             if(data.result == "OK"){
               $scope.folders = data.folders;
             }
           });

          $scope.duplicate = function(item){
            self.duplicateGrammar(item);
            $mdDialog.hide();
          };

          $scope.openFolder = function(f,institution){
            for(var i=0; i < $scope.folders.length; i++) {
              $scope.folders[i].open = false;
            }
            if(f) {
              f.open = true;

              apiPost("getGrammars",{"public":1, "folderid":f.ID,"needsOnline":1}).success(function(data){
                if(data.result == "OK"){
                  $scope.items = data.grammars;
                  for(var i=0; i < $scope.items.length; i++) $scope.items[i].grammar = JSON.parse($scope.items[i].JSON);
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

    self.getWeblink = function(g,ev){
      $mdDialog.show({
        templateUrl: "views/weblink.html",
        targetEvent: ev,
        
        clickOutsideToClose: true,
        controller: function ($scope, $mdDialog) {
          $scope.weblink = 'https://flaci.com/G'+g.GUID;
        }
      });
    };

    self.goToMy = function(){
      $location.path('/kfgedit');
    };

    self.sharedGrammars = [];

    if($routeParams && $routeParams.grammarGUID){
      apiPost("getGrammars",{"GUID":$routeParams.grammarGUID, "needsOnline":1}).success(function(data){
        if(data.result == "OK" && data.grammars.length == 1){
          data.grammars[0].grammar = JSON.parse(data.grammars[0].JSON);

          if(self.userLogin.user && data.grammars[0].Owner == self.userLogin.user.ID){
            self.openGrammar(data.grammars[0]);
            return;
          }
          apiPost("getGrammars",{}).success(function(data2){
            if(data2.grammars)
            for(var i=0; i < data2.grammars.length; i++){
               if(data2.grammars[i].CreatedFrom == $routeParams.grammarGUID){
                data2.grammars[i].grammar = JSON.parse(data2.grammars[i].JSON);
                self.openGrammar(data2.grammars[i]);

                // ask to use own copy or start over
                var conf = $mdDialog.confirm({title:$translate.instant("HINT"), htmlContent:$translate.instant("ASKMAKEANOTHERCOPY"), ok:$translate.instant("MAKEANOTHERCOPY"), cancel:$translate.instant("USEEXISTINGCOPY")});
                $mdDialog.show(conf).then(function(){
                  self.duplicateGrammar(data.grammars[0]).then(function(){ });
                });

                return;
              }
            }
            // does not yet exist, create a new copy
            self.duplicateGrammar(data.grammars[0]).then(function(){ });
          });
        }
      });            
    }

    self.loadFromServer();
});


function escapeJavaScriptString(string) {
  return ('' + string).replace(/["'\\\n\r\u2028\u2029]/g, function (character) {
    // Escape all characters not included in SingleStringCharacters and
    // DoubleStringCharacters on
    // http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
    switch (character) {
      case '"':
      case "'":
      case '\\':
        return '\\' + character
      // Four possible LineTerminator characters need to be escaped:
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\u2028':
        return '\\u2028'
      case '\u2029':
        return '\\u2029'
    }
  })
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}



