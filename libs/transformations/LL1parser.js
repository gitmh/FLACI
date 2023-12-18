

function VCC2LL1Parser (jsonString){
  function renameNT(old,n){
    for(var i=0; i < j.bnf.length; i++){ 
      if(j.bnf[i].name == old) j.bnf[i].name = n;
      for(var z=0; z < j.bnf[i].rhs.length; z++){ 
        for(var t=0; t < j.bnf[i].rhs[z][0].length; t++){ 
          if(j.bnf[i].rhs[z][0][t].name == old) j.bnf[i].rhs[z][0][t].name = n;
        }
      }
    }
  }

        var j = JSON.parse(jsonString);
        // transformation will only work if grammar is LL1
        var r = isLL1(j);

        if(!r){
          throw ("Grammar is not LL1!");
          return;
        }

        for(var i = 0; i < j.bnf.length; i++){
          if(j.bnf[i].name.match(/[^a-zA-Z0-9]/)){
            var n = j.bnf[i].name.replace(/[^a-zA-Z0-9]/g,"")+Math.ceil(Math.random()*100000);
            renameNT(j.bnf[i].name,n);
          }
        }        
        var code = "";
        code += '/* FLACI generated parser */\n\n';

        code += 'var parser = new (function() {\n';
        if(j.globalCode && j.globalCode != ""){
          code += '  /* global code */\n  '+j.globalCode+'\n\n';
        }

        code += '  /* lexer: translates input into token list */\n'+
                '  this.lexer = function (input){\n'+
                '    var tokenlist = [];\n';

        code += '    while(input.length > 0){\n';


        for(var i = 0; i < j.lex.rules.length; i++){
          code += '      // Token '+j.lex.rules[i].name+'\n'+
                  '      var m = input.match(/('+j.lex.rules[i].expression+')/);\n'+
                  '      if(m && m.index === 0) {\n'+
                  '        tokenlist.push(["'+j.lex.rules[i].name+'",input.substring(0,m[0].length)]);\n'+
                  '        input = input.substring(m[0].length);\n'+
                  '        continue;\n'+
                  '      }\n';
        }
        code += '      // no matching Token \n'+
                '      throw new Error("Error: No matching Token for "+input.substring(0,20));\n'+
                '    }\n'+
                '    tokenlist.push(["EOF",""]); // end of file \n'+
                '    for(var ig=0; ig < tokenlist.length; ig++) if(tokenlist[ig][0] == "IGNORE") {tokenlist.splice(ig,1);ig--;}\n'+
                '    return tokenlist;\n'+
                '  }\n';
/*
        // special case ignore
        for(var i = 0; i < j.lex.rules.length; i++){
          if(j.lex.rules[i].name == "IGNORE") 
            code += '    // ignore characters in input\n'+
                    '    input = input.replace(/('+j.lex.rules[i].expression+')/g,"");\n';
        }
*/

        var EOFused = false; 
        for(var i = 0; i < j.bnf.length; i++){
          for(var z = 0; z < j.bnf[i].rhs.length; z++){
            for(var t = 0; t < j.bnf[i].rhs[z][0].length; t++)
              if(j.bnf[i].rhs[z][0][t].name == "EOF" && j.bnf[i].rhs[z][0][t].type == "t") EOFused = true;
          }  
        }

        if(!EOFused && j.bnf.length > 0){ //  && j.bnf[0].rhs.length > 1
          // add extra start rule for EOF
          j.bnf.unshift({name:"___START___",rhs:[[[{name:j.bnf[0].name, type:"nt"},{name:"EOF", type:"t"}],"$$ = $1;"]]});
        }

        code += '  /* parser: parses a token list */\n'+
                '  this.parser = function(tokenlist){\n';

        for(var i = 0; i < j.bnf.length; i++){
          code += '    function rule_'+j.bnf[i].name+' (){\n';
          var epsilon = false;
          var maxlength = 0;
          for(var z = 0; z < j.bnf[i].rhs.length; z++){
            maxlength = Math.max(maxlength,j.bnf[i].rhs[z][0].length);
          }
          code += '      var $$ = ""';
          for(var z = 0; z < maxlength; z++){
            code += ',$'+(z+1)+' = ""';
          }
          code += ';\n';

          for(var z = 0; z < j.bnf[i].rhs.length; z++){            
            for(var t = 0; t < j.bnf[i].rhs[z][0].length; t++){

              var spaces = ""; for(var sx = 0; sx < t; sx++) spaces += ' ';
              if(j.bnf[i].rhs[z][0][t].type == "t"){
                code += spaces+'      if(tokenlist[0][0] == "'+j.bnf[i].rhs[z][0][t].name+'") {\n';
                code += spaces+'        $'+(t+1)+' = tokenlist[0][1]; // assign token value \n';
                code += spaces+'        tokenlist.splice(0,1); // delete first token from list \n';

              }else{
                code += spaces+'      if($'+(t+1)+' = rule_'+j.bnf[i].rhs[z][0][t].name+'()) {\n';
                code += spaces+'        if($'+(t+1)+' == "ɛ-case") $'+(t+1)+' = ""; \n';
              } 

              if(t == j.bnf[i].rhs[z][0].length-1){
                var plus = [];
                for(var pt = 0; pt < j.bnf[i].rhs[z][0].length; pt++){
                  plus.push("$"+(pt+1)); 
                }
                if(j.bnf[i].rhs[z][1] == "")
                  code += spaces+'        $$ = '+plus.join(' + ')+';\n'; else
                  code += spaces+'        '+j.bnf[i].rhs[z][1]+"\n";

                code += spaces+'        return $$;\n';
              }        
            }
            for(var t = j.bnf[i].rhs[z][0].length-1; t > -1 ; t--){
                var spaces = ""; for(var sx = 0; sx < t; sx++) spaces += ' ';
                code += spaces+'      }\n';
            }

            if(j.bnf[i].rhs[z][0].length == 0) epsilon = true;
          }
          if(epsilon) 
            code += '      return "ɛ-case"; // Epsilon  \n'+
                    '    }\n'; 
          else
            code += '      return false; // no match for this rule found \n'+
                    '    }\n';

        }
        code += '    return rule_'+j.bnf[0].name+'(); // start parsing with first rule \n'+
                '  };\n';
        code += '  /* parse: call to execute lexer and parser at once */\n'+
                '  this.parse = function(input){\n'+
                '    return this.parser(this.lexer(input));\n'+
                '  };\n';
        code += '});\n'+
                '/* gloabl variable parser, use with parser.parse("input") */\n\n';

        return code;
}

