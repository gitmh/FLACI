var bnfparser = null;
(function() {

/* Jison generated parser */
var parser = (function(){console.log("BNF parsing");
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"Start":3,"Regeln":4,"EOF":5,"Regel":6,"Identifier":7,"Arrow":8,"RHSs":9,"Items":10,"newlines":11,"Points":12,"maybeNewline":13,"Stroke":14,"Item":15,"Epsilon":16,"Newline":17,"$accept":0,"$end":1,"IGNORE":18},
terminals_: {"2":"error","5":"EOF","7":"Identifier","8":"Arrow","12":"Points","14":"Stroke","16":"Epsilon","17":"Newline","18":"IGNORE"},
productions_: [0,[3,1],[3,1],[4,1],[4,2],[6,3],[9,2],[9,4],[9,5],[9,7],[10,1],[10,2],[15,1],[15,1],[11,1],[11,2],[11,1],[13,2],[13,0]],
performAction: function anonymous(yytext,yyleng,yylineno,yy
) {
if(!this.$) this.$ = "";

var $$ = arguments[5],$0=arguments[5].length;
switch(arguments[4]) {
case 1:// lookup nonterminals and mark them as such
var nonterminals = [];
for(var i=0; i < $$[$0-1+1-1].length; i++){
  nonterminals.push($$[$0-1+1-1][i].name);
}
for(var i=0; i < $$[$0-1+1-1].length; i++){
  for (var z=0; z < $$[$0-1+1-1][i].rhs.length; z++){
    for (var t=0; t < $$[$0-1+1-1][i].rhs[z][0].length; t++){
      if($$[$0-1+1-1][i].rhs[z][0][t].type == "unknown")
        if(nonterminals.indexOf($$[$0-1+1-1][i].rhs[z][0][t].name) >= 0) 
          $$[$0-1+1-1][i].rhs[z][0][t].type = "nt"; else 
          $$[$0-1+1-1][i].rhs[z][0][t].type = "t";
    }
  }
}
console.log($$[$0-1+1-1]);
return $$[$0-1+1-1];
break;
case 2:return [];
break;
case 3:this.$ = [$$[$0-1+1-1]];
break;
case 4:this.$ = [$$[$0-2+1-1]].concat($$[$0-2+2-1]);
break;
case 5:this.$ = {name:$.trim($$[$0-3+1-1]), rhs:$$[$0-3+3-1]};

break;
case 6:this.$ = [[$$[$0-2+1-1],""]];
break;
case 7:var p1 = {name:$$[$0-4+1-1], type:"unknown"};
var p3 = {name:$$[$0-4+3-1], type:"unknown"};

if($$[$0-4+1-1].match(/"[^"]+"/) || $$[$0-4+1-1].match(/'[^']+'/)) {
  $$[$0-4+1-1] = $$[$0-4+1-1].substring(1,$$[$0-4+1-1].length-1);
  $$[$0-4+1-1] = $$[$0-4+1-1].replace(/ /g,"\u00A0");
  p1 = {name:$$[$0-4+1-1], type:"t"};
}
if($$[$0-4+3-1].match(/"[^"]+"/) || $$[$0-4+3-1].match(/'[^']+'/)) {
  $$[$0-4+3-1] = $$[$0-4+3-1].substring(1,$$[$0-4+3-1].length-1);
  $$[$0-4+3-1] = $$[$0-4+3-1].replace(/ /g,"\u00A0");
  p3 = {name:$$[$0-4+3-1], type:"t"};
}

this.$ = [[p1, {name:'...', type:"unknown"}, p3],""];

if(p1.name.length == 1 && p3.name.length == 1){
  this.$ = [];
  var from = p1.name.charCodeAt(0);
  var to = p3.name.charCodeAt(0);
  for(var i = from; i <= to; i++) this.$.push([[{name:String.fromCharCode(i), type:"t"}] , ""]);
}

if(isNaN(p1.name) == false && isNaN(p3.name) == false){
  this.$ = [];
  var from = parseInt(p1.name);
  var to = parseInt(p3.name);
  for(var i = from; i <= to; i++) this.$.push([[{name:i+"", type:"t"}] , ""]);
}
break;
case 8:this.$ = [[$$[$0-5+1-1],""]].concat($$[$0-5+5-1]);
break;
case 9:var p1 = {name:$$[$0-7+1-1], type:"unknown"};
var p3 = {name:$$[$0-7+3-1], type:"unknown"};

if($$[$0-7+1-1].match(/"[^"]+"/) || $$[$0-7+1-1].match(/'[^']+'/)) {
  $$[$0-7+1-1] = $$[$0-7+1-1].substring(1,$$[$0-7+1-1].length-1);
  $$[$0-7+1-1] = $$[$0-7+1-1].replace(/ /g,"\u00A0");
  p1 = {name:$$[$0-7+1-1], type:"t"};
}
if($$[$0-7+3-1].match(/"[^"]+"/) || $$[$0-7+3-1].match(/'[^']+'/)) {
  $$[$0-7+3-1] = $$[$0-7+3-1].substring(1,$$[$0-7+3-1].length-1);
  $$[$0-7+3-1] = $$[$0-7+3-1].replace(/ /g,"\u00A0");
  p3 = {name:$$[$0-7+3-1], type:"t"};
}

this.$ = [[p1, {name:'...', type:"unknown"}, p3],""];

if(p1.name.length == 1 && p3.name.length == 1){
  this.$ = [];
  var from = p1.name.charCodeAt(0);
  var to = p3.name.charCodeAt(0);
  for(var i = from; i <= to; i++) this.$.push([[{name:String.fromCharCode(i), type:"t"}] , ""]);
}

if(isNaN(p1.name) == false && isNaN(p3.name) == false){
  this.$ = [];
  var from = parseInt(p1.name);
  var to = parseInt(p3.name);
  for(var i = from; i <= to; i++) this.$.push([[{name:i+"", type:"t"}] , ""]);
}
this.$ = this.$.concat($$[$0-7+7-1]);

break;
case 10:this.$ = $$[$0-1+1-1];
break;
case 11:this.$ = $$[$0-2+1-1].concat($$[$0-2+2-1]);
break;
case 12:this.$ = []; // just empty

break;
case 13:this.$ = [{name:$.trim($$[$0-1+1-1]), type:"unknown"}];
if($$[$0-1+1-1].match(/"[^"]+"/) || $$[$0-1+1-1].match(/'[^']+'/)) {
  $$[$0-1+1-1] = $$[$0-1+1-1].substring(1,$$[$0-1+1-1].length-1);
  var v = $.trim($$[$0-1+1-1]); 
  if(v == "") v = " "; // single space case
  v = v.replace(/ /g,"\u00A0");
  this.$ = [{name:v, type:"t"}];
}
break;
case 14:this.$ = "";
break;
case 16:this.$ = "";
break;
case 17:this.$ = $$[$0-2+1-1] + $$[$0-2+2-1];
break;
case 18:this.$ = '';
break;
}
},
table: [{"3":1,"4":2,"5":[1,3],"6":4,"7":[1,5]},{"1":[3]},{"1":[2,1]},{"1":[2,2]},{"1":[2,3],"4":6,"6":4,"7":[1,5]},{"8":[1,7]},{"1":[2,4]},{"7":[1,10],"9":8,"10":9,"15":11,"16":[1,12]},{"1":[2,5],"7":[2,5]},{"5":[1,16],"11":13,"13":14,"14":[2,18],"17":[1,15]},{"5":[2,13],"7":[2,13],"12":[1,17],"14":[2,13],"16":[2,13],"17":[2,13]},{"5":[2,10],"7":[1,19],"10":18,"14":[2,10],"15":11,"16":[1,12],"17":[2,10]},{"5":[2,12],"7":[2,12],"14":[2,12],"16":[2,12],"17":[2,12]},{"1":[2,6],"7":[2,6]},{"14":[1,20]},{"1":[2,14],"5":[1,16],"7":[2,14],"11":21,"13":22,"14":[2,18],"17":[1,15]},{"1":[2,16],"7":[2,16]},{"7":[1,23]},{"5":[2,11],"14":[2,11],"17":[2,11]},{"5":[2,13],"7":[2,13],"14":[2,13],"16":[2,13],"17":[2,13]},{"7":[2,18],"13":24,"16":[2,18],"17":[1,25]},{"1":[2,15],"7":[2,15]},{"7":[2,17],"14":[2,17],"16":[2,17]},{"5":[1,16],"11":26,"13":27,"14":[2,18],"17":[1,15]},{"7":[1,10],"9":28,"10":9,"15":11,"16":[1,12]},{"7":[2,18],"13":22,"16":[2,18],"17":[1,25]},{"1":[2,7],"7":[2,7]},{"14":[1,29]},{"1":[2,8],"7":[2,8]},{"7":[2,18],"13":30,"16":[2,18],"17":[1,25]},{"7":[1,10],"9":31,"10":9,"15":11,"16":[1,12]},{"1":[2,9],"7":[2,9]}],
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
case 0:return 16;
break;
case 1:return 12;
break;
case 2:return 17;
break;
case 3:return 14;
break;
case 4:return 8;
break;
case 5:return 7;
break;
case 6:
break;
case 7:return 5;
break;
}
};
lexer.rules = [/^((EPSILON))/,/^((\.\.\.))/,/^((\n))/,/^((\|))/,/^((->))/,/^((('[^'\n]+')|([^\n\r\t\s|]+)))/,/^(([\s\n\t\r]))/,/^($)/];return lexer;})()
parser.lexer = lexer;
return parser;
})(); bnfparser = parser
})();

