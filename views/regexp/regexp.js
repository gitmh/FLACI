  app.controller('RegExpController', function($scope, $location, $timeout, $interval, $mdDialog, $http, $mdMedia, $mdSidenav, $sce, $q, userLogin, $translate) { 
    window.mc = this;
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
            var g = {ID:"local"+grammars.length, Name:data.name, Title:data.title, Language:data.language, GrammarText:data.GrammarText ? data.GrammarText : '', JSON:data.JSON ? data.JSON : '{}',Changed : (new Date()).toMysqlFormat()};
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
                grammars[i].JSON = data.JSON;
                grammars[i].Language = data.language;
                grammars[i].GrammarText = data.GrammarText;
                grammars[i].Changed = (new Date()).toMysqlFormat();
                result.grammar = grammars[i];
              } 
            }
            localStorage.setItem("localGrammars",angular.toJson(grammars));
          }
          if(url == "createAutomaton"){
            var d = localStorage.getItem("localAutomatons");
            var automatons = JSON.parse(d ? d : "[]"); // default is array here
            var a = {ID:"local"+Math.random(), Name:data.name, Type:data.type, JSON:data.JSON ? data.JSON : '{}',Changed : (new Date()).toMysqlFormat()};
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
    self.$location = $location;
    self.$mdMedia = $mdMedia;
    self.$sce = $sce;
    self.userLogin = userLogin;

    self.userLogin.autoLogin(); 

    self.showAlert = function(text,title){
      var alert = $mdDialog.alert({title:title?title:$translate.instant("HINT"), htmlContent:text, ok:'OK'});
      $mdDialog.show(alert);
    };

    self.isReferenceSidebarOpen = false;
    self.testInput = localStorage.getItem("regExpEditInputText") ? localStorage.getItem("regExpEditInputText") : "";
    self.testRegExp = localStorage.getItem("regExpEditInput") ? localStorage.getItem("regExpEditInput") : "";
    self.testRegExp2 = localStorage.getItem("regExpEditInput2") ? localStorage.getItem("regExpEditInput2") : "";
    self.doCompare = localStorage.getItem("RegExpDoCompare") ? localStorage.getItem("RegExpDoCompare") == 1 : false;

    self.testGrammarText = "";
    self.testGrammar = null;
    self.RegRexBNF = null;
    self.validTestRegExp = false;

    window.renderRegExpTranslations = function(id,data){
      return $translate.instant("REGEXPEDIT.RAILROAD."+id,data);
    };
    
    self.setDoCompare = function(v){
      self.doCompare = v;
      localStorage.setItem("RegExpDoCompare",self.doCompare ? 1 : 0);
      $timeout(function(){
        self.applyRegExp(self.testRegExp2, self.testInput, 'test2');
      },10);
    };
    
    self.switchTestRegExp = function(){
      var t = self.testRegExp2;
      self.testRegExp2 = self.testRegExp; 
      self.testRegExp = t; 
      self.applyRegExp(self.testRegExp, self.testInput, 'test');
      self.applyRegExp(self.testRegExp2, self.testInput, 'test2');
    };
    
    self.applyRegExp = function(re,text, element){
      localStorage.setItem("RegExpTask1",self.regExp7);
      localStorage.setItem("RegExpTask2",self.regExp8);
      localStorage.setItem("RegExpTask3",self.regExp9);
      localStorage.setItem("RegExpTask4",self.regExp10);

      var s = text; 
      var d = $('#'+element);
      var e = $('#'+element+"_error");
      var g = $('#'+element+"_grammar");
      if(element == "test") self.updateTestRegExp(false);
      if(element == "test") self.RegRexBNF = null;
      if(element == "test2") localStorage.setItem("regExpEditInput2",self.testRegExp2);
      d.html("");
      e.html("");
      g.html("");
      var p = 0;
      var error = true;
      if(re.length != 0) {
        var r = null;
        try{
          r = new RegExp("^("+re+")$","g");
          error = false;
        }catch(error){
          e.html($translate.instant("ERRORS.NOREGEXP"));
        }

        if(r) {
          s = "";    
          var lines = text.split("\n");
          for(var i=0; i < lines.length; i++){
            if(lines[i].match(r)){
              s += '<span class="regExpMatch">'+lines[i]+'</span><br>';
            }else{
              s += '<span style="color:black;">'+lines[i]+'</span><br>';
            }
          }
        }
      }
      d.html(s);

      if(!error) {
       if(element == "test") { 
         self.testAutomaton = (new re2nea()).parse(re);

         var bnf = (new re2kfg()).parse(re);
         var pr = parseBNF(bnf);
         self.testGrammarText = bnf;          

         var text = self.codeMirror.getValue();
         var t = text.split("\n");
         self.testGrammar = {bnf:pr.bnf, lex:pr.lex, inputText:bnf, testInput:t[0]}; 
         self.RegRexBNF = pr.bnf; 
         var s = "G = (N,T,P,s)\n";
         s += "N = {";
         for(var i=0; i < pr.nonterminals.length; i++) s+= (i > 0 ? ', ':'')+pr.nonterminals[i];
         s += "}\n";
         s += "T = {";
         for(var i=0; i < pr.terminals.length; i++) s+= (i > 0 ? ', ':'')+(pr.terminals[i] == ' ' ? "' '" : pr.terminals[i]);
         s += "}\n";
         s += "P = {\n";
         s += "  "+((bnf.split("\n")).join("\n  ")).trim()+"\n";
         s += "}\n";
         s += "s = "+pr.s+"\n";       
       }
    
       g.html("<div>"+$translate.instant("REGEXPEDIT.RAILROAD.TITLE")+"</div><div style='margin-top:10px' class='railroad'></div>"); //<br><div>"+$translate.instant("REGEXPEDIT.GRAMMAR")+"</div><br>"+ s);
       if(g.length > 0)
         window.renderRegExp($('.railroad',g).get(0),re,function(){});
        
       if(element == "test") self.updateTestRegExp(true);
      }
      if(element == "test2" && self.doCompare) self.checkEqual(self.testRegExp,self.testRegExp2);
      // RegExp to grammar
      // abc        => S -> a b c
      // abc|efg    => S -> a b c | e f g
      // a*         => S -> a | a S | EPSILON
      // a+         => S -> a | a S
      // [abc]      => S -> a | b | c
      // [a-z]      => S -> a ... z 
      // [a-zA-Z]      => S -> a ... z | A ... Z
    };

    self.initRegExps = function(){
      self.applyRegExp(self.regExp1, self.sampleText1, 'text1');
      self.applyRegExp(self.regExp2, self.sampleText2, 'text2');
      self.applyRegExp(self.regExp3, self.sampleText3, 'text3');
      self.applyRegExp(self.regExp4, self.sampleText4, 'text4');
      self.applyRegExp(self.regExp5, self.sampleText5, 'text5');
      self.applyRegExp(self.regExp6, self.sampleText6, 'text6');
      self.applyRegExp(self.regExp7, self.sampleText7, 'text7');
      self.applyRegExp(self.regExp8, self.sampleText8, 'text8');
      self.applyRegExp(self.regExp9, self.sampleText9, 'text9');
      self.applyRegExp(self.regExp10, self.sampleText10, 'text10');

      self.applyRegExp(self.testRegExp, self.testInput, 'test');
      self.applyRegExp(self.testRegExp2, self.testInput, 'test2');
    };

    self.saveTestInput = function(){
      localStorage.setItem("regExpEditInputText",self.testInput);
    };

    self.updateTestRegExp = function(hasValue){
      var mode;
      self.validTestRegExp = hasValue;
      if(hasValue){
        localStorage.setItem("regExpEditInput",self.testRegExp);
        var r = new RegExp("^("+self.testRegExp+")$");
        mode = function(){return {
            startStat: function() {return {inString: false};},
            token: function(stream, state) {
                // ## header matching
                matchArray = stream.match(r,true);
                if (matchArray != null && matchArray.input == matchArray[0]) {
                  stream.skipToEnd();
                  return "comment"
                }
                stream.skipToEnd();
                return null;
            }
        }};
        //mode = {start: [{sol:true,"regex":new RegExp(self.testRegExp+"$"),"token":"comment","org":self.testRegExp+"$"},{"regex":/[\s\S]/,"token":"none","org":"[\\s\\S]"}]};

        if(self.codeMirror){
          CodeMirror.defineMode("regexpedit",mode);
          self.codeMirror.setOption("mode","regexpedit");
        }
      }else{
        mode = {start: [{"regex":/[\s\S]/,"token":"none","org":"[\\s\\S]"}]};
        CodeMirror.defineSimpleMode("regexpedit",mode);
        if(self.codeMirror) self.codeMirror.setOption("mode","regexpedit");
      }
    };

    self.codemirrorLoaded = function(editor){
      self.codeMirror = editor;
      editor.on("change", function(){ 
       if(self.testGrammar){
         var text = self.codeMirror.getValue();
         var t = text.split("\n");
         self.testGrammar.testInput = t[0]; 
         self.saveTestInput();
       }
      });
    };

    self.generateRandomTestWord = function(){
      if(self.RegRexBNF){
        var generator = new RandExp(new RegExp(self.testRegExp));
        generator.max = 6;
        var words = [];
        for(var i=0; i < 50; i++){
          var w = generator.gen(); 
          //var word = generateGrammarRandomWord(self.RegRexBNF); 
          //var w = word.join(""); 
          
          if(words.indexOf(w) == -1) words.push(w);
        }
        words.sort(function(a,b){return a.length - b.length});

        var input = "";
        for(var i=0; i < 5 && i < words.length; i++) input += words[i]+"\n";
        self.testInput = input; 
        
      }
    };
   
    self.checkRegular = function(re){
      var regular = true;

      if(re.match(/\\[0-9]/)) regular = false;
 
      if(!regular){
        self.showAlert($translate.instant("REGEXPEDIT.ISNOTREGULAR"));
        return false;
      }
      return true;
    };
    
    self.checkEqual = function(re1,re2){
      self.isEqualRegExp = re1 == re2;
      var a1 = (new re2nea()).parse(re1);
      var a2 = (new re2nea()).parse(re2);
      
      if(a1 && a2){
        window.skipAutoLayout = true;
        var r1 = NEAtoDEA(JSON.parse(a1));
        var r2 = NEAtoDEA(JSON.parse(a2));
        delete window.skipAutoLayout;

        if(r1.result == "OK" && r2.result == "OK"){
          r1 = DEAtoMinimalDEA(r1.automaton,true);
          r2 = DEAtoMinimalDEA(r2.automaton,true);
          if(r1.result == "OK" && r2.result == "OK"){
            self.isEqualRegExp = JSON.stringify(r1.automaton) == JSON.stringify(r2.automaton);
          }
        }
      }
    
    };

    self.saveAsGammar = function(){
      if(self.checkRegular(self.testRegExp))
       apiPost("createGrammar",{"name":self.testRegExp, "language":"L"})
        .success(function(data) {
          if(data.result == "FAILED"){
            self.showAlert($translate.instant("ERRORS.SERVERERROR"));
          }
          if(data.result == "OK"){
            apiPost("saveGrammar",{id:data.grammar.ID, name:data.grammar.Name, JSON:angular.toJson(self.testGrammar), GrammarText:self.testGrammarText, language: "L"})
             .success(function(data){ if(data.result == "OK") {
              // go to kfgEdit and open grammar
              $location.path("/kfgedit");
            }});

            
          }
        })
        .error(function(data, status, headers, config) {
          self.showAlert($translate.instant("ERRORS.SERVERERROR"));
        });      
    };

    self.saveAsREGammar = function(){
      if(self.checkRegular(self.testRegExp))
       apiPost("createGrammar",{"name":self.testRegExp, "language":"L"})
        .success(function(data) {
          if(data.result == "FAILED"){
            self.showAlert($translate.instant("ERRORS.SERVERERROR"));
          }
          if(data.result == "OK"){

            var r = NEAtoDEA(JSON.parse(self.testAutomaton));

            if(r.result == "OK"){
              r = DEAtoMinimalDEA(r.automaton);
              if(r.result == "OK"){

                  r = autoLayoutAutomaton(r.automaton,false);
                  if(r.result == "OK"){
                    r = ea2grammar(r.automaton,"DEA");
                    if(r.result == "OK" && r.grammar){
                      var pr = parseBNF(r.grammar);
                      var g = {bnf:pr.bnf, lex:pr.lex, inputText:r.grammar, testInput:""}; 
                      apiPost("saveGrammar",{id:data.grammar.ID, name:data.grammar.Name, JSON:angular.toJson(g), 
                                             GrammarText:r.grammar, language: "L"})
                      .success(function(data){ if(data.result == "OK") {
                        // go to kfgEdit and open grammar
                        $location.path("/kfgedit");
                      }});
                    }
                  }
                
              }
            }
          }
        })
        .error(function(data, status, headers, config) {
          self.showAlert($translate.instant("ERRORS.SERVERERROR"));
        });      
    };


    self.saveAsNEA = function(){
      if(self.testAutomaton != "" && self.checkRegular(self.testRegExp)){
          // use r.automaton 
          apiPost("createAutomaton",{"name":self.testRegExp, "type":"NEA"})
            .success(function(data) {
              if(data.result == "FAILED"){
                alert($translate.instant("ERRORS.ERRORCREATINGAUTOMATON"));
              }
              if(data.result == "OK"){
                var automaton = null;
                var layout = autoLayoutAutomaton(JSON.parse(self.testAutomaton));
                if(layout.result == "OK") automaton = layout.automaton;
                apiPost("saveAutomaton",{"id":data.automaton.ID, "name":data.automaton.Name, "type":data.automaton.Type, JSON:angular.toJson(automaton)})
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

    $translate.use(userLogin.language).then(function () {
      console.log("Using language "+userLogin.language);
      $translate("REGEXPEDIT.EXAMPLES.EXPRESSION1").then(function(result){self.regExp1 = result});
      $translate("REGEXPEDIT.EXAMPLES.SAMPLETEXT1").then(function(result){self.sampleText1 = result});
      $translate("REGEXPEDIT.EXAMPLES.EXPRESSION2").then(function(result){self.regExp2 = result});
      $translate("REGEXPEDIT.EXAMPLES.SAMPLETEXT2").then(function(result){self.sampleText2 = result});
      $translate("REGEXPEDIT.EXAMPLES.EXPRESSION3").then(function(result){self.regExp3 = result});
      $translate("REGEXPEDIT.EXAMPLES.SAMPLETEXT3").then(function(result){self.sampleText3 = result});
      $translate("REGEXPEDIT.EXAMPLES.EXPRESSION4").then(function(result){self.regExp4 = result});
      $translate("REGEXPEDIT.EXAMPLES.SAMPLETEXT4").then(function(result){self.sampleText4 = result});
      $translate("REGEXPEDIT.EXAMPLES.EXPRESSION5").then(function(result){self.regExp5 = result});
      $translate("REGEXPEDIT.EXAMPLES.SAMPLETEXT5").then(function(result){self.sampleText5 = result});
      $translate("REGEXPEDIT.EXAMPLES.EXPRESSION6").then(function(result){self.regExp6 = result});
      $translate("REGEXPEDIT.EXAMPLES.SAMPLETEXT6").then(function(result){self.sampleText6 = result});

      $translate("REGEXPEDIT.EXAMPLES.SAMPLETASK1").then(function(result){self.sampleText7 = result});
      $translate("REGEXPEDIT.EXAMPLES.SAMPLETASK2").then(function(result){self.sampleText8 = result});
      $translate("REGEXPEDIT.EXAMPLES.SAMPLETASK3").then(function(result){self.sampleText9 = result});
      $translate("REGEXPEDIT.EXAMPLES.SAMPLETASK4").then(function(result){self.sampleText10 = result});

      self.regExp7 = localStorage.getItem("RegExpTask1") ? localStorage.getItem("RegExpTask1") : '';
      self.regExp8 = localStorage.getItem("RegExpTask2") ? localStorage.getItem("RegExpTask2") :'';
      self.regExp9 = localStorage.getItem("RegExpTask3") ? localStorage.getItem("RegExpTask3") :'';
      self.regExp10 = localStorage.getItem("RegExpTask4") ? localStorage.getItem("RegExpTask4") :'';

      $translate("REGEXPEDIT.REGEXP").then(function(result){ $timeout(self.initRegExps,100); });
    });
    var s = getURLParam("s");
    if(s && s != ""){
      self.selectedTab = 2;
      self.testRegExp = decodeURIComponent(s);
    }
  });


