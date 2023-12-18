function BNF2Text (b){
          var maxlen = 0;
          for(var i=0; i < b.bnf.length; i++)
            maxlen = Math.max(maxlen, b.bnf[i].name.length);

          var s = "";
          for(var i=0; i < b.bnf.length; i++){
            s += b.bnf[i].name;
            for(var t = b.bnf[i].name.length; t < maxlen; t++) s += " "; 
            s += " -> ";
            if(b.bnf[i].rhs.length == 0) s += 'EPSILON ';
            for(var z=0; z < b.bnf[i].rhs.length; z++){ 
              if(z > 0) s += "| ";
              if(b.bnf[i].rhs[z][0].length == 0) s += 'EPSILON ';
              
              for(var t=0; t < b.bnf[i].rhs[z][0].length; t++){
                s += (b.bnf[i].rhs[z][0][t].name.indexOf("\u00A0") != -1 || b.bnf[i].rhs[z][0][t].name.indexOf('->')!= -1 || b.bnf[i].rhs[z][0][t].name.indexOf('...') != -1 || b.bnf[i].rhs[z][0][t].name.indexOf('|') != -1 ? "'"+b.bnf[i].rhs[z][0][t].name.replace(/\u00A0/g," ")+"'" : b.bnf[i].rhs[z][0][t].name)+ ' ';    
              }
            }  
            s += "\n";
          }
          return s;
}

function parseBNF (inputText){
          var bnf = bnfparser.parse(inputText);
          // pack same left hand sides 
          for(var i=0; i < bnf.length; i++){
            for(var z=i+1; z < bnf.length; z++){
              if(bnf[z].name == bnf[i].name){
                // combine rules
                bnf[i].rhs = bnf[i].rhs.concat(bnf[z].rhs);
                bnf.splice(z,1);
                i--;
                break;
              }
            }
          }
          var terminals = [];
          var nonterminals = [];
          for(var i=0; i < bnf.length; i++){
            if(nonterminals.indexOf(bnf[i].name) < 0)
               nonterminals.push(bnf[i].name);  

            for(var z=0; z < bnf[i].rhs.length; z++){
              var code = "";
              if(bnf[i].rhs[z][0].length == 0) // epsilon case
                code = '{Content:"EPSILON", Nodes:[]}';

              for(var t=0; t < bnf[i].rhs[z][0].length; t++){
                if(bnf[i].rhs[z][0][t].type == "t") code += (code != "" ? ",":"")+'{Content:"'+bnf[i].rhs[z][0][t].name.replace(/"/g,'\\"')+'", Nodes:[]}';
                if(bnf[i].rhs[z][0][t].type == "nt") code += (code != "" ? ",":"")+'$'+(t+1);

                if(bnf[i].rhs[z][0][t].type == "t" && terminals.indexOf(bnf[i].rhs[z][0][t].name) < 0)
                  terminals.push(bnf[i].rhs[z][0][t].name);  
                if(bnf[i].rhs[z][0][t].type == "nt" && nonterminals.indexOf(bnf[i].rhs[z][0][t].name) < 0)
                  nonterminals.push(bnf[i].rhs[z][0][t].name);  
              }
              // generate Code for the parser
              bnf[i].rhs[z][1] = '$$ = {Content:"'+bnf[i].name.replace(/"/g,'\\"')+'", Nodes:[ '+code+' ] };';
            }
          }

          //if(bnf.length > 0 && bnf[0].rhs.length == 1){
          //  bnf[0].rhs[0][1] += "return $$;";
          //}

          terminals.sort(function(a,b){
            if(a == "ASCII") a = '.';
            if(b == "ASCII") b = '.';
            return b.length - a.length;
          });
          nonterminals.sort(function(a,b){
            return b.length - a.length;
          });

          var hasSpaces = false;
          var lex = { "rules":[] };
          for(var i=0; i < terminals.length; i++){
            lex.rules.push({"expression":(terminals[i] == "ASCII" ? '[^\\t\\r\\n\\s]' : escapeRegExp(terminals[i])),"name":terminals[i]});
            if(terminals[i].indexOf("\u00A0") != -1) hasSpaces = true;
          }
          if(hasSpaces)
            lex.rules.push({"expression":"[\\t\\r\\n]","name":"IGNORE"}); else
            lex.rules.push({"expression":"[\\t\\r\\n\\s]","name":"IGNORE"});

          var s = "";
          if(bnf.length > 0) s = bnf[0].name;
          
          return {"bnf":bnf, "terminals":terminals, "nonterminals":nonterminals, "s": s, "lex":lex } ;
}

function VCC2JISON (jsonString){
        var j = JSON.parse(jsonString);
        // transform lex objects to arrays
        if(j.lex){
          j.lex.tokennames = [];
          for(var i = 0; i < j.lex.rules.length; i++){
            j.lex.tokennames.push(j.lex.rules[i].name);
            j.lex.rules[i] = [j.lex.rules[i].expression, j.lex.rules[i].name];
          }
        }
        // special case ignore
        for(var i = 0; i < j.lex.rules.length; i++){
          j.lex.rules[i][0] = "("+j.lex.rules[i][0]+")"; // auto bracket for ^(...)
          if(j.lex.rules[i][1] == "IGNORE") 
             j.lex.rules[i][1] = ""; else
             j.lex.rules[i][1] = "return '"+j.lex.rules[i][1].replace(/'/g,"\\'")+"';"
        }
        // special case end of file
        j.lex.rules.push(["$","return 'EOF';"]);
          
        j.actionInclude = 'if(!this.$) this.$ = "";'+"\n";
        // special bnf needs to be a single object no array
        var bnf = {};
        // find EOF use
        var EOFused = false; 
        for(var i = 0; i < j.bnf.length; i++){
          for(var z = 0; z < j.bnf[i].rhs.length; z++){
            for(var t = 0; t < j.bnf[i].rhs[z][0].length; t++)
              if(j.bnf[i].rhs[z][0][t].name == "EOF" && j.bnf[i].rhs[z][0][t].type == "t") EOFused = true;
          }  
        }

        if(!EOFused && j.bnf.length > 0){ //  && j.bnf[0].rhs.length > 1
          // add extra start rule for EOF
          j.bnf.unshift({name:"___#START#___",rhs:[[[{name:j.bnf[0].name, type:"nt"}],"return $1;"]]});
        }

        for(var i = 0; i < j.bnf.length; i++){
          // special case add EOF to all right hand sides of first none-terminal
          if(!EOFused && i == 0) 
            for(var z = 0; z < j.bnf[i].rhs.length; z++) j.bnf[i].rhs[z][0].push({name:"EOF",type:"t"});

          // combine rhs to strings
          for(var z = 0; z < j.bnf[i].rhs.length; z++){
            var s = "";
            var defaultCode = "$$ = ";
            if(j.bnf[i].rhs[z][0].length == 0) defaultCode += "''";
            for(var t = 0; t < j.bnf[i].rhs[z][0].length; t++){
              s += (s != "" ? " ":"") + j.bnf[i].rhs[z][0][t].name;
              defaultCode += "$"+(t+1)+(t < j.bnf[i].rhs[z][0].length-1 ? ' + ':'');
            } 
            defaultCode += ";";
            if($.trim(j.bnf[i].rhs[z][1]) == "") j.bnf[i].rhs[z][1] = defaultCode;
            j.bnf[i].rhs[z][0] = s; // override with string

          }
          bnf[j.bnf[i].name] = j.bnf[i].rhs;
        }
        j.bnf = bnf;
  return j;
}


var RandomWeightedChoice = function (table, temperature, randomFunction, influence) {
  influence = influence || 1.5; // Seems fine, difficult to tune
  if (typeof(temperature)=="undefined") temperature =  50; // in [0,100], 50 is neutral
  if (temperature === null) temperature = 50; // if no temperature given, 50 is neutral
  temperature = isNaN(temperature) ? 50 : temperature;
  var T = (temperature - 50) / 50;
  if (typeof(randomFunction)=="undefined") randomFunction = Math.random;

  var nb = table.length;
  if(!nb) return null; // No item given.

  var total = 0;
  table.forEach(function(element, index) {
    total += element.weight;
  });

  var avg = total / nb;

  // Compute amplified urgencies (depending on temperature)
  var ur = {};
  var urgencySum = 0;
  table.forEach(function(element, index) {
    var urgency = element.weight + T * influence * (avg - element.weight);
    if (urgency < 0) urgency = 0;
    urgencySum += urgency;
    ur[element.id] = (ur[element.id] || 0 ) + urgency;
  });

  var cumulatedUrgencies = {};
  var currentUrgency = 0;
  Object.keys(ur).forEach(function(id, index) {
    currentUrgency += ur[id];
    cumulatedUrgencies[id] = currentUrgency;
  });

  if(urgencySum < 1) return null; // No weight given

  // Choose
  var choice = randomFunction() * urgencySum;

  var ids = Object.keys(cumulatedUrgencies);
  for(var i=0; i<ids.length; i++) {
    var id = ids[i];
    var urgency = cumulatedUrgencies[id];
    if(choice <= urgency) {
      return id;
    }    
  }
};


function generateGrammarRandomWord(bnf){
  var p1 = generateGrammarRandomWordPass(bnf);
  var p2 = generateGrammarRandomWordPass(bnf);
  var p3 = generateGrammarRandomWordPass(bnf);
  if(p1.length > p2.length)
   if(p1.length > p3.length) return p1; else
   if(p3.length >= p1.length) return p3;
  if(p2.length > p1.length)
   if(p2.length > p3.length) return p2; else
   if(p3.length >= p2.length) return p3;
  return p1;
}

function generateGrammarRandomWordPass(bnf){
  var s = [];
  var g = JSON.parse(JSON.stringify(bnf)); // make a copy for weights
  for(var i=0; i < g.length; i++){
    for(var z=0; z < g[i].rhs.length; z++){
      g[i].rhs[z][2] = (1 / ( g[i].rhs[z][0].length + 1))*100; // start weight
    }
  }

  function choose(n){
    var table = [];
    for(var i=0; i < n.rhs.length; i++){
      // n.rhs[i][0] = [{"name":"e", "type":"nt"},{"name":"Plus", "type":"t"},{"name":"e", "type":"nt"}] 
      // n.rhs[i][1] = "$$ = $1 + $3;"
      // n.rhs[i][2] = 1; 
      for(var z=0; z < n.rhs[i][0].length; z++){
        if(n.rhs[i][0][z].name == n.name) n.rhs[i][2] = n.rhs[i][2] / 2;
      }
      table.push({weight:n.rhs[i][2], id:i});
    } 
    function pickAndRun(){
      var pick = RandomWeightedChoice(table);
      if(!pick) return false;
      for(var i=0; i < n.rhs.length; i++)
        if(i != pick) n.rhs[i][2] = n.rhs[i][2] * 1.2; // next time it will be more likely to choose this one

      for(var i=0; i < n.rhs[pick][0].length; i++){
        if(n.rhs[pick][0][i].type == "t") s.push(n.rhs[pick][0][i].name); else {
          // resolve Nonterminal and choose again
          for(var z=0; z < g.length; z++){
            if(g[z].name == n.rhs[pick][0][i].name) { 
              var cr = choose(g[z]); 
              if(!cr) {
                // undo last choice
                return false;
              }
              break; 
            }
          }
        }
      }
      return true;
    }
    
    return pickAndRun();
  }
  var rc = choose(g[0]);
  return rc ? s : [];
}

function nonterminalInfo (p){
    var out = ["<h3>Nonterminals</h3><dl>"];
    for(var nt in p.nonterminals){
        out.push("<dt>",nt,"</dt>");
        out.push("<dd>", "nullable: "+(p.nonterminals[nt].nullable ? 'Yes':'No')+"<br/>firsts: "+p.nonterminals[nt].first+"<br/>follows: "+p.nonterminals[nt].follows);
        out.push("</dd>");
    }
    out.push("</dl>");
    return out.join("\n");
}

function productions (p){
    var out = ['<ol start="0">'];
    p.productions.forEach(function (prod) {
            out.push("<li id='prod_"+prod.id+"'>", prod, "</li>");
            });
    out.push('</ol>');
    return out.join("");
}


function printActionDetails (p, a, token) {
  var out = "<div class='details'>";
  if (!a || !a[0]) return '';

  if (a[0] instanceof Array) {
    a.forEach(function (ar) { out += printActionDetails_(p, ar, token); });
  } else {
      out += printActionDetails_(p, a, token);
  }

  return out+"</div>";
}

function printActionDetails_ (p, a, token) {
    var out = '';
    if (a[0] == 1) {
      var link = "<a href='#state_"+a[1]+"'>Go to state "+a[1]+"</a>";
      out += "- Shift "+p.symbols[token]+" then "+link+"<br />";
    }
    else if (a[0] == 2) {
      var text = "- Reduce by "+a[1]+") "+p.productions[a[1]];
      out += text+"<br />";
    }
    return out;
}

function printAction (a){
    var actions = {"1":"s", "2":"r","3":"a"};
    if (!a[0]) return '';
    var out = '',
      ary = [];

    if (a[0] instanceof Array) {
        for(var i=0;i<a.length;i++)
            ary.push('<span class="action_'+(actions[a[i][0]])+'">'+(actions[a[i][0]])+(a[i][1]||'')+'</span>');
    } else {
        ary.push('<span class="action_'+(actions[a[0]])+'">'+(actions[a[0]])+(a[1]||'')+'</span>');
    }

    out += ary.join(',');

    return out;
}

function lrTable (p){
    var actions = {"1":"s", "2":"r","3":"a"};
    var gs = p.symbols.slice(0).sort();
    var out = ['<table border="1">','<thead>','<tr>'];
    out.push('<th>&#8595;states','</th>');
    var ntout = [];
    gs.shift();
    gs.forEach(function(t){
      if (p.nonterminals[t])
      ntout.push('<th class="nonterm nt-'+t+'"">',t,'</th>');
      else if (t != 'error' || p.hasErrorRecovery)
        out.push('<th>',t,'</th>');
    });
    out.push.apply(out, ntout);
    out.push('</tr>','</thead>');

    for (var i=0,state;i < p.table.length;i++){
      state=p.table[i];
      if (!state) continue;
      ntout = [];
      out.push('<tr><td class="row_'+i+' state" id="state_'+i+'">',i);
//      out.push('<div class="details">');
//      p.states.item(i).forEach(function (item, k) {
//          out.push(item,'<br />');
//      });
//      out.push('</div>');
      out.push('</td>');
      gs.forEach(function(ts){
        if (ts == 'error' && !p.hasErrorRecovery)
            return;
        var t = p.symbols_[ts];

        if (p.nonterminals[ts]){
          if (typeof state[t] === 'number')
            ntout.push('<td class="nonterm nt-'+t+'">',state[t],'</td>');
          else
            ntout.push('<td class="nonterm">&nbsp;</td>');
        } else if (state[t]) {
          out.push('<td id="act-'+i+'-'+t+'" class="row_'+i+' '+' action" style="'+(state[t] == 3 ? "background:#dfd" : '')+'">',printAction(state[t])); // printActionDetails(p,state[t], t)
        } else
          out.push('<td>&nbsp;</td>');
      });
      out.push.apply(out, ntout);
      out.push('</tr>');
    }

    out.push('</table>');

    return out.join("");

    $("#table").html("<h3>"+p.type+" Parse Table</h3><p>Click cells to show details (double-click to show details for the entire row of cells)</p>"+out.join(""));

    p.resolutions.forEach(function (res){
      var r = res[2];
      var el = document.getElementById('act-'+res[0]+'-'+p.symbols_[res[1]]);
      if (r.bydefault) {
        el.className += ' conflict';
      }
      if (el)
        el.title += r.msg+"\n"+"("+r.s+", "+r.r+") -> "+r.action;
    });

}

