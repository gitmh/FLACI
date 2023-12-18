function convertGrammarToCNF(grammar){
	var Names = []; // global name array to generate unique names
	var cnt = 0;
	function SeparateNTSequences(nt){
		var num = 0;
		var result = [];
		for (var i = 0; i < nt.EvalTo.length; i++){ // Check rules
			var e = nt.EvalTo[i];
			while (e.Seq.length > 2){ // as long as there are more than 2 items in sequence
				num++; // count
				// find a unique name
				var newname = nt.Name+"."+num;
				while(Names.indexOf(newname) != -1){
					num++;
					newname = nt.Name+"."+num;
				}
				Names.push(newname);
				// create a new nt representing rest of the expression
				var subNT = {Name:newname, EvalTo:[{Seq:e.Seq.slice(1), Code:""}], UsedBy:[]};
				e.Seq = [e.Seq[0],subNT]; // replace rest of expression by new nt
				result.push(subNT); // remember the new nt
				e = subNT.EvalTo[0]; // continue while loop with rest of expression
			}
		}
		return result;
	}
	function ReplaceTerminal(terminal){
		var nt = undefined;
		for (var i = 0; i < terminal.UsedBy.length; i++){ // for each NT where terminal is used
			for (var j = 0; j < terminal.UsedBy[i].EvalTo.length; j++){ // for each rule of the NT
				if (terminal.UsedBy[i].EvalTo[j].Seq.length == 1) continue; // single items remain
				for (var k = 0; k < terminal.UsedBy[i].EvalTo[j].Seq.length; k++){ // in all other rules
					if ( terminal.UsedBy[i].EvalTo[j].Seq[k] === terminal){ // replace all occurences
						if (nt == undefined){ // first time create a new nonterminal
							cnt++;
							var newname = "T"+cnt;
							while(Names.indexOf(newname) != -1){ // with a unique name
								cnt++;
								newname = "T"+cnt; 
							}
							Names.push(newname);
							nt = {Name:newname, EvalTo:[{Seq:[terminal], Code:""}], UsedBy:[]};
						}
						terminal.UsedBy[i].EvalTo[j].Seq[k] = nt; // replace 
					}
				}
			}
		}
		return nt;
	}
	function isCNF(grammar){
		var bnf = parseBNF(grammar); // Parse to BNF
		for (var i = 0; i < bnf.bnf.length; i++){
			for (var j = 0; j < bnf.bnf[i].rhs.length ; j++){
				var ev = bnf.bnf[i].rhs[j][0];
				if (ev.length == 0 && bnf.bnf[i].name != bnf.s)
					return false; // NT can be epsilon (except of start symbol)
				if (ev.length == 1 && ev[0].type != "t")
					return false; // single target item is not a terminal
				if (ev.length > 2)
					return false; // more than 2 target items
				if (ev.length == 2 && (ev[0].type != "nt" || ev[1].type != "nt"))
					return false; // one of the target items is not NT
			}
		}
		return true;
	}
	if (isCNF(grammar)) // already in CNF
		return {"result":"OK", "grammar":grammar};
	// Preparation
	var res = removeEpsilonGrammar(grammar); // remove epsilon
	if (res.result == "FAILED") return res; // any problems when removing epsilon?
	res = cleanupGrammar(res.grammar); // Remove all unnecessary stuff
	if (res.result == "FAILED") return res; // any problems with minimizing?
	res = removeChainsGrammar(res.grammar); // Rebuild BNF without chain rules
	if (res.result == "FAILED") return res; // any problems with removing chains?
	var bnf = parseBNF(res.grammar); // Parse to BNF
	cleanupGrammar.RemoveEqualNT(bnf);
	cleanupGrammar.RemoveSelfEvaluating(bnf);
	cleanupGrammar.RemoveEqualReplacements(bnf);
	var linked = linkBNF(bnf); // Link BNF (drops unused stuff)
	// Initialize Names-Array with all existing names of terminals and nonterminals
	Names = linked.NonTerminals.map(n=>n.Name).concat(linked.Terminals.map(n=>n.Name));
	// Determine start symbol
	var iEpsilon = linked.Start.EvalTo.findIndex((e)=>e.Seq.length == 0); // Start can be epsilon?
	var StartBNF = linked.Start; // Determine start for CNF conversion
	if (iEpsilon >= 0 && linked.Start.EvalTo.length != 1){ // empty word is allowed and it is not the only evaluation
		// Insert new start symbol
		linked.Start.EvalTo.splice(iEpsilon,1); // remove epsilon from old start symbol
		// create new start symbol, evaluating to epsilon and old start symbol
		var newname = "S."+linked.Start.Name;
		while(Names.indexOf(newname) != -1) // with a unique name
			newname = "S"+newname;
		Names.push(newname);// extend Names-array
		var newStart = {Name:newname, UsedBy:[], EvalTo:[{Seq:[linked.Start],Code:""},{Seq:[],Code:""}]};
		linked.Start.UsedBy.push(newStart); // old start symbol now used by new start symbol
		linked.NonTerminals = [newStart].concat(linked.NonTerminals); // add new start symbol as first NonTerminals
		linked.Start = newStart; // set new start symbol
	}
	for (var i = 0; i < linked.Terminals.length; i++){ // Check each terminal
		var newNT = ReplaceTerminal(linked.Terminals[i]); // Replace it in complex rules by a new NT
		if (newNT != undefined) // if a new NT was created
			linked.NonTerminals.push(newNT); // append it to NT-list
	}
	var checkUntil = linked.NonTerminals.length;
	for (var i = (iEpsilon >= 0 ? 1 : 0); i < checkUntil; i++){ // check all NTs (maybe except of start)
		var newNT = SeparateNTSequences(linked.NonTerminals[i]); // separate sequences of more than 2 NTs
		linked.NonTerminals = linked.NonTerminals.concat(newNT); // append newly created NTs at the end
	}
	bnf = unlinkBNF(linked);
	cleanupGrammar.RemoveEqualNT(bnf); // during NT sequence separation equal NTs can be created
	return {"result":"OK", "grammar":BNF2Text(bnf)};
}