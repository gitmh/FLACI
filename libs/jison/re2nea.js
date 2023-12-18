function re2nea (){
/* 1 Jison generated parser */
var parser = (function(){// merges Alphabet and Stackalphabet of 2 NEAs
function mergeAlphabet(base, append){
  for (var i = 0; i < append.Alphabet.length; i++){
    if (base.Alphabet.indexOf(append.Alphabet[i]) == -1)
      base.Alphabet.push(append.Alphabet[i]);
  }
  for (var i = 0; i < append.StackAlphabet.length; i++){
    if (base.StackAlphabet.indexOf(append.StackAlphabet[i]) == -1)
      base.StackAlphabet.push(append.StackAlphabet[i]);
  }
}
// inserts sub-NEA into global NEA between start and end
function insertSubNEA(nea, start, end, sub){
  mergeAlphabet(nea,sub);
  for (var i = 0; i < sub.States.length; i++){
    var s = sub.States[i]; // iterate all new states
    if (s.Start){ // the sub start state
      s.Start = false; // no start anymore
      // transition to this state from start
      start.Transitions.push({Source:start.ID, Target:s.ID, Labels:[""]});
    }
    if (s.Final){ // the sub final state
      s.Final = false; // not final anymore
      // transition from this state to end
      s.Transitions.push({Source:s.ID, Target:end.ID, Labels:[""]});
    }
    nea.States.push(s); // append all states and their transitions
  }
}
function renameNEAStatenames(nea){
  var oldnew = [];
  for (var i = 0; i < nea.States.length; i++){
    var item = {oldID: nea.States[i].ID, newID:nextID()};
    oldnew.push(item);
    nea.States[i].ID = item.newID;
    nea.States[i].Name = "q"+item.newID;
    for (var x = 0; x < nea.States.length; x++){
      for (var y = 0; y < nea.States[x].Transitions.length; y++){
        if(nea.States[x].Transitions[y].Source == item.oldID){
          nea.States[x].Transitions[y].Source = item.newID;
        }
        if(nea.States[x].Transitions[y].Target == item.oldID){
          nea.States[x].Transitions[y].Target = item.newID;
        }
      }    
    }
  }
}
// appends next-NEA at the end of base-NEA
function appendNEA(base, next){
  mergeAlphabet(base,next);
  for (var i = 0; i < next.States.length; i++){
    var s = next.States[i]; // iterate all new states
    if (s.Start){ // the sub start state
      s.Start = false; // no start anymore
      var end = base.States.find(e => e.Final == true); // current end-state
      // transition from former end-state to next former start-state
      end.Transitions.push({Source:end.ID, Target:s.ID, Labels:[""]});
      end.Final = false; // not final anymore (next-final is now final)
    }
    base.States.push(s);
  }
}
var cnt = 0;
function nextID(){
  return cnt++;
}
function newState(isStart, isFinal){
  var id = nextID();
  return {ID:id,Name:"q"+id,Start:isStart,Final:isFinal,Transitions:[],Radius:30};
}
function newNEA(){
  var nea = {Alphabet:[],StackAlphabet:["|"],States:[]};
  nea.States.push(newState(true,false));
  nea.States.push(newState(false,true));
  return nea;
}
function getEscapeRule(t){
  var or = [];
  console.log(t);
  if(t== "w"){
    for( var i = 48; i <= 57; i++ ){
      var c = String.fromCharCode(i);
      or.push(c);
    }
    for( var i = 65; i <= 90; i++ ){
      var c = String.fromCharCode(i);
      or.push(c);
    }
    for( var i = 97; i <= 122; i++ ){
      var c = String.fromCharCode(i);
      or.push(c);
    }
    or.push("_");
    return or;
  }
  if(t == "W"){
    for( var i = 32; i <= 126; i++ ){
      if(i >= 48 && i <= 57) continue;
      if(i >= 65 && i <= 90) continue;
      if(i >= 97 && i <= 122) continue;
      var c = String.fromCharCode(i);
      if(c == "_") continue;
      if(c == "\\") continue;
      if(c == "'") continue;
      if(c == "|") continue;
      if(c == " ") c = "' '";
      or.push(c);
    }
    return or;
  }
  if(t == "d"){
    for( var i = 48; i <= 57; i++ ){
      var c = String.fromCharCode(i);
      or.push(c);
    }
    return or;
  }
  if(t == "D"){
    for( var i = 32; i <= 126; i++ ){
      if(i >= 48 && i <= 57) continue;
      var c = String.fromCharCode(i);
      if(c == "\\") continue;
      if(c == "'") continue;
      if(c == "|") continue;
      if(c == " ") c = "' '";
      or.push(c);
    }
    return or;
  }
  if(t == "s"){
    or.push("' '");
    or.push("\\t");
    or.push("\\r");
    or.push("\\n");
    return or;
  }
  if(t == "S"){
    for( var i = 32; i <= 126; i++ ){
      var c = String.fromCharCode(i);
      if(c == " ") continue;
      if(c == "\\") continue;
      if(c == "'") continue;
      if(c == "|") continue;
      if(c == " ") c = "' '";
      or.push(c);
    }  
    return or;
  }
  // else
  return [t];
}
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"Start":3,"OR":4,"EOF":5,"ODER":6,"RE":7,"Ausdrücke":8,"Ausdruck":9,"Stern":10,"Plus":11,"Fragezeichen":12,"AnzahlKlammer":13,"KKlammerAuf":14,"Klasse":15,"KKlammerZu":16,"KlammerAuf":17,"KlammerZu":18,"Z":19,"Minus":20,"Escaped":21,"Dot":22,"Zeichenklasse":23,"$accept":0,"$end":1,"IGNORE":24},
terminals_: {"2":"error","5":"EOF","6":"ODER","10":"Stern","11":"Plus","12":"Fragezeichen","13":"AnzahlKlammer","14":"KKlammerAuf","16":"KKlammerZu","17":"KlammerAuf","18":"KlammerZu","19":"Z","20":"Minus","21":"Escaped","22":"Dot","24":"IGNORE"},
productions_: [0,[3,2],[4,3],[4,1],[4,0],[7,2],[7,1],[8,1],[8,2],[8,2],[8,2],[8,2],[9,3],[9,3],[9,1],[9,1],[9,1],[9,1],[23,3],[23,1],[23,1],[23,1],[23,1],[15,2],[15,1]],
performAction: function anonymous(yytext,yyleng,yylineno,yy
) {
if(!this.$) this.$ = "";

var $$ = arguments[5],$0=arguments[5].length;
switch(arguments[4]) {
case 1:
$$[$0-2+1-1].Alphabet.sort();
return JSON.stringify($$[$0-2+1-1]);
break;
case 2:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
insertSubNEA(nea, start, end,$$[$0-3+1-1]);
insertSubNEA(nea, start, end,$$[$0-3+3-1]);
this.$ = nea;
break;
case 3:this.$ = $$[$0-1+1-1];
break;
case 4:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
start.Transitions.push({Source:start.ID, Target:end.ID, Labels:[""]});
this.$ = nea;
break;
case 5:appendNEA($$[$0-2+1-1], $$[$0-2+2-1]);
this.$ = $$[$0-2+1-1]

break;
case 6:this.$ = $$[$0-1+1-1];
break;
case 7:this.$ = $$[$0-1+1-1];

break;
case 8:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
start.Transitions.push({Source:start.ID, Target:end.ID, Labels:[""]});
end.Transitions.push({Source:end.ID, Target:start.ID, Labels:[""]});
insertSubNEA(nea, start, end,$$[$0-2+1-1]);
this.$ = nea;
break;
case 9:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
end.Transitions.push({Source:end.ID, Target:start.ID, Labels:[""]});
insertSubNEA(nea, start, end,$$[$0-2+1-1]);
this.$ = nea;

break;
case 10:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
start.Transitions.push({Source:start.ID, Target:end.ID, Labels:[""]});
insertSubNEA(nea, start, end,$$[$0-2+1-1]);
this.$ = nea;
break;
case 11:$$[$0-2+2-1] = $$[$0-2+2-1].replace(/[{}]/g,"");
var parts = $$[$0-2+2-1].split(",");
var from  = parseInt(parts[0]);
var to  = parseInt(parts[1]);

var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
start.Transitions.push({Source:start.ID, Target:end.ID, Labels:[""]});

for(var x = 0; x < from; x++){
  var n = JSON.parse(JSON.stringify($$[$0-2+1-1]));
  renameNEAStatenames(n);
  appendNEA(nea,n);
}

var end = nea.States.find(e => e.Final == true);
for(var x = from; x < to; x++){
  var n = JSON.parse(JSON.stringify($$[$0-2+1-1]));
  renameNEAStatenames(n);
  appendNEA(nea,n);
  var end2 = nea.States.find(e => e.Final == true);
  end.Transitions.push({Source:end.ID, Target:end2.ID, Labels:[""]});
}


this.$ = nea;

break;
case 12:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
start.Transitions.push({Source:start.ID, Target:end.ID, Labels:$$[$0-3+2-1]});
nea.Alphabet = nea.Alphabet.concat($$[$0-3+2-1]);
this.$ = nea;
break;
case 13:this.$ = $$[$0-3+2-1];
break;
case 14:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
if($$[$0-1+1-1] == " ") $$[$0-1+1-1] = "' '";
start.Transitions.push({Source:start.ID, Target:end.ID, Labels:[$$[$0-1+1-1]]});
nea.Alphabet.push($$[$0-1+1-1]);
this.$ = nea;
break;
case 15:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
start.Transitions.push({Source:start.ID, Target:end.ID, Labels:[$$[$0-1+1-1]]});
nea.Alphabet.push($$[$0-1+1-1]);
this.$ = nea;
break;
case 16:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
$$[$0-1+1-1] = $$[$0-1+1-1].replace(/\\/g,"");
if($$[$0-1+1-1] == " ") $$[$0-1+1-1] = "' '";
var esc = getEscapeRule($$[$0-1+1-1]);
start.Transitions.push({Source:start.ID, Target:end.ID, Labels:esc});
nea.Alphabet = nea.Alphabet.concat(esc);
this.$ = nea;

break;
case 17:var nea = newNEA();
var start = nea.States.find(e => e.Start == true);
var end = nea.States.find(e => e.Final == true);
var or = [];
for( var i = 32; i <= 126; i++ ){
	var c = String.fromCharCode(i);
	if(c == "\\") continue;
	if(c == "'") continue;
	if(c == "|") continue;
	if(c == " ") c = "' '";
	or.push(c);
}
start.Transitions.push({Source:start.ID, Target:end.ID, Labels:or});
nea.Alphabet = nea.Alphabet.concat(or);
this.$ = nea;

break;
case 18:this.$ = [];
for(var i = $$[$0-3+1-1].charCodeAt(0); i <= $$[$0-3+3-1].charCodeAt(0); i++){
	this.$.push(String.fromCharCode(i));
}
break;
case 19:if($$[$0-1+1-1] == " ") $$[$0-1+1-1] = "' '";
this.$ = [$$[$0-1+1-1]];
break;
case 20:this.$ = [$$[$0-1+1-1]];
break;
case 21:$$[$0-1+1-1] = $$[$0-1+1-1].replace(/\\/g,"");
if($$[$0-1+1-1] == " ") $$[$0-1+1-1] = "' '";
this.$ = getEscapeRule($$[$0-1+1-1]);

break;
case 22:this.$ = [$$[$0-1+1-1]];
break;
case 23:this.$ = $$[$0-2+1-1].concat($$[$0-2+2-1]);


break;
case 24:this.$ = $$[$0-1+1-1];

break;
}
},
table: [{"3":1,"4":2,"5":[2,4],"6":[2,4],"7":3,"8":4,"9":5,"14":[1,6],"17":[1,7],"19":[1,8],"20":[1,9],"21":[1,10],"22":[1,11]},{"1":[3]},{"5":[1,12],"6":[1,13]},{"5":[2,3],"6":[2,3],"18":[2,3]},{"5":[2,6],"6":[2,6],"7":14,"8":4,"9":5,"14":[1,6],"17":[1,7],"18":[2,6],"19":[1,8],"20":[1,9],"21":[1,10],"22":[1,11]},{"5":[2,7],"6":[2,7],"10":[1,15],"11":[1,16],"12":[1,17],"13":[1,18],"14":[2,7],"17":[2,7],"18":[2,7],"19":[2,7],"20":[2,7],"21":[2,7],"22":[2,7]},{"15":19,"19":[1,21],"20":[1,22],"21":[1,23],"22":[1,24],"23":20},{"4":25,"6":[2,4],"7":3,"8":4,"9":5,"14":[1,6],"17":[1,7],"18":[2,4],"19":[1,8],"20":[1,9],"21":[1,10],"22":[1,11]},{"5":[2,14],"6":[2,14],"10":[2,14],"11":[2,14],"12":[2,14],"13":[2,14],"14":[2,14],"17":[2,14],"18":[2,14],"19":[2,14],"20":[2,14],"21":[2,14],"22":[2,14]},{"5":[2,15],"6":[2,15],"10":[2,15],"11":[2,15],"12":[2,15],"13":[2,15],"14":[2,15],"17":[2,15],"18":[2,15],"19":[2,15],"20":[2,15],"21":[2,15],"22":[2,15]},{"5":[2,16],"6":[2,16],"10":[2,16],"11":[2,16],"12":[2,16],"13":[2,16],"14":[2,16],"17":[2,16],"18":[2,16],"19":[2,16],"20":[2,16],"21":[2,16],"22":[2,16]},{"5":[2,17],"6":[2,17],"10":[2,17],"11":[2,17],"12":[2,17],"13":[2,17],"14":[2,17],"17":[2,17],"18":[2,17],"19":[2,17],"20":[2,17],"21":[2,17],"22":[2,17]},{"1":[2,1]},{"4":26,"5":[2,4],"6":[2,4],"7":3,"8":4,"9":5,"14":[1,6],"17":[1,7],"18":[2,4],"19":[1,8],"20":[1,9],"21":[1,10],"22":[1,11]},{"5":[2,5],"6":[2,5],"18":[2,5]},{"5":[2,8],"6":[2,8],"14":[2,8],"17":[2,8],"18":[2,8],"19":[2,8],"20":[2,8],"21":[2,8],"22":[2,8]},{"5":[2,9],"6":[2,9],"14":[2,9],"17":[2,9],"18":[2,9],"19":[2,9],"20":[2,9],"21":[2,9],"22":[2,9]},{"5":[2,10],"6":[2,10],"14":[2,10],"17":[2,10],"18":[2,10],"19":[2,10],"20":[2,10],"21":[2,10],"22":[2,10]},{"5":[2,11],"6":[2,11],"14":[2,11],"17":[2,11],"18":[2,11],"19":[2,11],"20":[2,11],"21":[2,11],"22":[2,11]},{"16":[1,27]},{"15":28,"16":[2,24],"19":[1,21],"20":[1,22],"21":[1,23],"22":[1,24],"23":20},{"16":[2,19],"19":[2,19],"20":[1,29],"21":[2,19],"22":[2,19]},{"16":[2,20],"19":[2,20],"20":[2,20],"21":[2,20],"22":[2,20]},{"16":[2,21],"19":[2,21],"20":[2,21],"21":[2,21],"22":[2,21]},{"16":[2,22],"19":[2,22],"20":[2,22],"21":[2,22],"22":[2,22]},{"6":[1,13],"18":[1,30]},{"5":[2,2],"6":[1,13],"18":[2,2]},{"5":[2,12],"6":[2,12],"10":[2,12],"11":[2,12],"12":[2,12],"13":[2,12],"14":[2,12],"17":[2,12],"18":[2,12],"19":[2,12],"20":[2,12],"21":[2,12],"22":[2,12]},{"16":[2,23]},{"19":[1,31]},{"5":[2,13],"6":[2,13],"10":[2,13],"11":[2,13],"12":[2,13],"13":[2,13],"14":[2,13],"17":[2,13],"18":[2,13],"19":[2,13],"20":[2,13],"21":[2,13],"22":[2,13]},{"16":[2,18],"19":[2,18],"20":[2,18],"21":[2,18],"22":[2,18]}],
parseError: function parseError (str, hash) {
    throw new Error(str);
},
parse: function parse (input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        shifts = 0,
        reductions = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    this.lexer.setInput(input); 
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;

    var parseError = this.yy.parseError = typeof this.yy.parseError == 'function' ? this.yy.parseError : this.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
    }

    function checkRecover (st) {
        for (var p in table[st]) if (p == TERROR) {
            //print('RECOVER!!');
            return true;
        }
        return false;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token];
        }
        return token;
    };

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected, recovered = false;
    symbol = lex(); 
    while (true) {
        // set first input
        state = stack[stack.length-1];
        // read action for current state and first input
        action = table[state] && table[state][symbol];

        // handle parse error
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                if (this.lexer.showPosition) {
                    parseError.call(this, 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+'\nExpecting '+expected.join(', '),
                        {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, expected: expected});
                } else {
                    parseError.call(this, 'Parse error on line '+(yylineno+1)+": Unexpected '"+this.terminals_[symbol]+"'",
                        {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, expected: expected});
                }
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw 'Parsing halted.'
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                symbol = lex(); 
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if (checkRecover(state)) {
                    break;
                }
                if (state == 0) {
                    throw 'Parsing halted.'
                }
                popStack(1);
                state = stack[stack.length-1];
            }
            
            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        a = action; 

        switch (a[0]) {

            case 1: // shift
                shifts++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext); // semantic values or junk only, no terminals
                stack.push(a[1]); // push state
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    symbol = lex(); 
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                reductions++;

                len = this.productions_[a[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, a[1], vstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                }

                stack.push(this.productions_[a[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept

                this.reductionCount = reductions;
                this.shiftCount = shifts;
                return true;
        }

    }

    return true;
}};/* Jison generated lexer */
var lexer = (function(){var lexer = ({EOF:"",
parseError:function parseError(str, hash) {
        if (this.yy.parseError) {
            this.yy.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext+=ch;
        this.yyleng++;
        this.match+=ch;
        this.matched+=ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        this._input = ch + this._input;
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        for (var i=0;i < this.rules.length; i++) {
            match = this._input.match(this.rules[i]);
            if (match && (match[0] != "" || i == this.rules.length - 1)) { // change MH
                lines = match[0].match(/\n/g);
                if (lines) this.yylineno += lines.length;
                this.yytext += match[0];
                this.match += match[0];
                this.matches = match;
                this.yyleng = this.yytext.length;
                this._more = false;
                this._input = this._input.slice(match[0].length);
                this.matched += match[0];
                token = this.performAction.call(this, this.yy, this, i);
                if (token) return token;
                else return;
            }
        }
        if (this._input == this.EOF) {
            return this.EOF;
        } else {
            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function () {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    }});
lexer.performAction = function anonymous(yy,yy_
) {

switch(arguments[2]) {
case 0:return 21;
break;
case 1:return 22;
break;
case 2:return 20;
break;
case 3:return 11;
break;
case 4:return 10;
break;
case 5:return 6;
break;
case 6:return 12;
break;
case 7:return 16;
break;
case 8:return 14;
break;
case 9:return 18;
break;
case 10:return 17;
break;
case 11:return 13;
break;
case 12:return 19;
break;
case 13:
break;
case 14:return 5;
break;
}
};
lexer.rules = [/^((\\[^\\]))/,/^((\.))/,/^((\-))/,/^((\+))/,/^((\*))/,/^((\|))/,/^((\?))/,/^((\]))/,/^((\[))/,/^((\)))/,/^((\())/,/^((\{\d+,\d+\}))/,/^(([^\n]))/,/^(())/,/^($)/];return lexer;})()
parser.lexer = lexer;
return parser;
})(); return parser; }
