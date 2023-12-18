  app.controller('LanguageController', function($scope, $location, $timeout, $interval, $mdDialog, $http, $mdMedia, $mdSidenav, $sce, $q, userLogin, $translate) { 

    var self = this;
    self.user = null;
    self.$location = $location;
    self.$mdMedia = $mdMedia;
    self.$sce = $sce;
    self.userLogin = userLogin;
    self.showAsList = false;

    self.userAlphabet = [];
    if(localStorage.getItem("userAlphabet")) self.userAlphabet = JSON.parse(localStorage.getItem("userAlphabet"));

    self.userAlphabetInput = self.userAlphabet.join(", ");
    self.selectedAlphabet = "";
    if(self.userAlphabet.length > 0)
      self.selectedAlphabet = "A5";

    self.currentAlphabet = [];
    self.currentWord = [];
    self.currentWordSet = [];
    self.currentLanguageSet = [];
    self.currentLanguageSetHasDots = false;
    self.currentLanguageSetCat = [];

    self.selectedLanguageCat = null;
    self.selectedLagnaugeCat2Len = 3;
    self.selectedLagnaugeCat3Word = [];
  
    self.userLogin.autoLogin(); 

    $scope.$watch(function(){return angular.toJson(self.currentAlphabet);},function(newValue, oldValue){
      self.currentWord = [];
      self.currentWordSet = [];
      self.currentLanguageSet = [];
      self.generateWordSetContent();
    });

    self.parseUserAlphabet = function(){  
      self.userAlphabet = [];
      var parts = self.userAlphabetInput.split(",");
      for(var i=0; i < parts.length; i++){
        if(parts[i].trim() == "") continue; 
        if(self.userAlphabet.indexOf(parts[i].trim()) >= 0) continue;
        self.userAlphabet.push(parts[i].trim());
      }
      localStorage.setItem("userAlphabet",angular.toJson(self.userAlphabet));
    };
    
    
    self.setSelectedAlphabet = function(){
      self.selectedAlphabet = self.selectedAlphabet != '' ? self.selectedAlphabet : 'A0';
      if(self.selectedAlphabet == "A5" && self.userAlphabet.length == 0) self.selectedAlphabet = 'A0';

      var letters = []; // a-z
      for (var i = 97; i <= 122; i++) {
        letters.push(String.fromCodePoint(i));
      }

      if(self.selectedAlphabet == 'A0') { self.currentAlphabet = ['0','1']; self.currentAlphabetBorder = false; }
      if(self.selectedAlphabet == 'A1') { self.currentAlphabet = letters; self.currentAlphabetBorder = false; }
      if(self.selectedAlphabet == 'A2') { self.currentAlphabet = ['0','1','2','3','4','5','6','7','8','9'];  self.currentAlphabetBorder = false; }
      if(self.selectedAlphabet == 'A3') { self.currentAlphabet = ['<i class="fa fa-book"></i>','<i class="fa fa-cloud"></i>','<i class="fa fa-eye"></i>','<i class="fa fa-flask"></i>','<i class="fa fa-heart"></i>','<i class="fa fa-star"></i>'];  self.currentAlphabetBorder = false; }
      if(self.selectedAlphabet == 'A4') { self.currentAlphabet = ['begin','end','for','while','do','repeat','until'];  self.currentAlphabetBorder = true; }
      if(self.selectedAlphabet == 'A5') { self.currentAlphabet = self.userAlphabet;  self.currentAlphabetBorder = true; }

      self.selectedLagnaugeCat2Word = [];
      self.currentLanguageSetCat = [];
      self.selectedLanguageCat = 0;
      if(self.currentAlphabet.length > 0){
        self.selectedLagnaugeCat1Char = self.currentAlphabet[0];
        self.selectedLagnaugeCat4Char1 = self.currentAlphabet[0];
        self.selectedLagnaugeCat3Word = [self.currentAlphabet[0]];
        if(self.currentAlphabet.length > 1) {
          self.selectedLagnaugeCat4Char2 = self.currentAlphabet[1]; 
          self.selectedLagnaugeCat1Char = self.currentAlphabet[1];
        }
        if(self.currentAlphabet.length > 2) { 
          self.selectedLagnaugeCat3Word.push(self.currentAlphabet[1]);
          self.selectedLagnaugeCat3Word.push(self.currentAlphabet[2]);
        }
      }
    };
    self.addCurrentWord = function(a){
      self.currentWord.push(a);
    };
    self.removeCurrentWord = function(index){
      self.currentWord.splice(index,1);
    };

    self.changeLanguageCat = function(reset){
      if(self.currentAlphabet.length == 0) return;
      if(reset) self.currentLanguageSetCat = [];

      self.currentLanguageSetCatHasMore = true;

      var oldLen = self.currentLanguageSetCat.length;
      var temp = [];
      var addThem = false;
      var last = "";
      var itemsPerClick = 10;
      if(self.currentLanguageSetCat.length == 0) 
        addThem = true; else
        last = JSON.stringify(self.currentLanguageSetCat[self.currentLanguageSetCat.length-1]);

      if(self.selectedLanguageCat != "1" && !(self.selectedLanguageCat == "3" && self.selectedLagnaugeCat3Word.length > 0)) 
         self.currentLanguageSetCat.push([]);
      function rec(w){ 
        var onlyWith = null;
        if(self.selectedLanguageCat == "1" && w.length == 0){
          onlyWith = self.selectedLagnaugeCat1Char;
        }
        for(var i = 0; i < self.currentAlphabet.length; i++){
          if(onlyWith && onlyWith != self.currentAlphabet[i]) continue;
          var nw = w.slice(); nw.push(self.currentAlphabet[i]);
          temp.push(nw);
          var catFilterd = true;
          if(self.selectedLanguageCat == "4"){
            var c1 = 0;
            var c2 = 0;
            for(var x = 0; x < nw.length; x++){
              if(nw[x] == self.selectedLagnaugeCat4Char1) c1++;
              if(nw[x] == self.selectedLagnaugeCat4Char2) c2++;
            }
            if(c1 != c2) catFilterd = false;
          }
          if(self.selectedLanguageCat == "3"){
            var sw = self.selectedLagnaugeCat3Word.join('|#|');
            if(nw.join('|#|').indexOf(sw) == -1) catFilterd = false;
          }         
          if(addThem && catFilterd) self.currentLanguageSetCat.push(nw);
          if(JSON.stringify(nw) == last) addThem = true; 
          if(self.currentLanguageSetCat.length >= oldLen + itemsPerClick) return; // break 
        }
      }

      var len = 1;
      rec([]);
      if(self.currentLanguageSetCat.length >= oldLen + itemsPerClick) return; // break 
      while(self.currentLanguageSetCat.length < oldLen + itemsPerClick){
        if(self.selectedLanguageCat == "2" && len >= self.selectedLagnaugeCat2Len) break; // end 
        for(var i=0; i < temp.length; i++){
          if(temp[i].length == len) rec(temp[i]);
          if(self.currentLanguageSetCat.length >= oldLen + itemsPerClick) return; // break 
        }
        len++;
      };

      self.currentLanguageSetCatHasMore = false;
    };

    self.generateWordSetContent = function(){
      if(self.currentAlphabet.length == 0) return;
      var oldLen = self.currentWordSet.length;
      self.currentWordSet = [];
      function rec(w){ 
        for(var i = 0; i < self.currentAlphabet.length; i++){
          var nw = w.slice(); nw.push(self.currentAlphabet[i]);
          self.currentWordSet.push(nw);
          if(self.currentWordSet.length >= oldLen + 5) return; // break 
        }
      }
      var len = 1;
      rec([]);
      while(self.currentWordSet.length < oldLen + 5){
        for(var i=0; i < self.currentWordSet.length; i++){
          if(self.currentWordSet[i].length == len) rec(self.currentWordSet[i]);
          if(self.currentWordSet.length >= oldLen + 5) return; // break 
        }
        len++;
      };

    };
  
    self.generateLanguageSetContent = function(){
      if(self.currentAlphabet.length == 0) return;
      var oldLen = self.currentLanguageSet.length;
      var temp = [];
      var addThem = false;
      var last = "";
      if(self.currentLanguageSet.length == 0) 
        addThem = true; else
        last = JSON.stringify(self.currentLanguageSet[self.currentLanguageSet.length-1]);

      function rec(w){ 
        for(var i = 0; i < self.currentAlphabet.length; i++){
          var nw = w.slice(); nw.push(self.currentAlphabet[i]);
          temp.push(nw);
          if(addThem) self.currentLanguageSet.push(nw);
          if(JSON.stringify(nw) == last) addThem = true; 
          if(self.currentLanguageSet.length >= oldLen + 5) return; // break 
        }
      }

      var len = 1;
      rec([]);
      while(self.currentLanguageSet.length < oldLen + 5){
        for(var i=0; i < temp.length; i++){
          if(temp[i].length == len) rec(temp[i]);
          if(self.currentLanguageSet.length >= oldLen + 5) return; // break 
        }
        len++;
      };

    };

    self.addLanguageSet = function(w){
      for(var i=0; i < self.currentLanguageSet.length; i++){
        if(angular.toJson(w) == angular.toJson(self.currentLanguageSet[i])) return; // already there
      }
      for(var i=0; i < self.currentLanguageSet.length; i++){
        if(self.currentLanguageSet[i].length < w.length) continue;
        if(self.currentLanguageSet[i].length > w.length){
          self.currentLanguageSet.splice(i,0,w);
          return;
        }

        for(var z=0; z < w.length; z++){
          if(self.currentLanguageSet[i][z] > w[z]) {
            self.currentLanguageSet.splice(i,0,w);
            return;
          }
        }
      }
      self.currentLanguageSet.push(w);
    };
    self.removeLanguageSet = function(index){
      self.currentLanguageSet.splice(index,1);
    };

  });


