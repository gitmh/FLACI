function insertEpsilonGrammar(grammar){ // Append empty word to language
	var res = removeEpsilonGrammar(grammar); // remove any epsilons
	if (res.result == "FAILED") return res; // any problems when removing epsilon?
	var BNF = parseBNF(grammar);
	if (res.grammar.indexOf("EPSILON") == -1){ // if emtpy word not contained already
		var newname = "S."+BNF.s; // new start NT name
		while(BNF.nonterminals.indexOf(newname) != -1 ||
			  BNF.terminals.indexOf(newname) != -1)
			newname = "S"+newname; // unique
		BNF.nonterminals.unshift(newname); // Append new NT at begin
		BNF.bnf.unshift({ // assign 2 replacement options at begin
			name: newname, // the old start symbol and EPSILON
			rhs: [[[{name: BNF.s, type: "nt"}],""],[[],""]] 
			});
		BNF.s = newname; // Use it as new start symbol
	}
	return {"result":"OK", "grammar":BNF2Text(BNF)};
}