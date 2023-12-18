function cleanupGrammar(grammar){
	var BNF = parseBNF(grammar);
	var lBNF = linkBNF(BNF); // Linked BNF conversion
	BNF = unlinkBNF(lBNF); // removes everything not reachable from start symbol
	cleanupGrammar.RemoveSelfEvaluating(BNF); // Self-Evaluation (A -> A|a >> A -> a)
	cleanupGrammar.RemoveEpsilonNT(BNF); // NTs being EPSILON only (E -> EPSILON)
	cleanupGrammar.RemoveEqualReplacements(BNF); // Doubled replacements (A -> B | B >> A -> B)
	cleanupGrammar.RemoveEqualNT(BNF); // NTs defined equally (A -> BC|D, C -> BC|D >> A -> BA|D)
	cleanupGrammar.RemoveInfiniteNT(BNF); // NTs not finally replaceable by terminals (A -> a A)
	//cleanupGrammar.RemoveInterimNT(BNF); // NTs without own function (A -> B, B -> C >> A -> C)
	return {"result":"OK", "grammar":BNF2Text(BNF)};
}

cleanupGrammar.RemoveNT = function(BNF, nt, dropUsingRules){ // Remove nonterminal
	if (BNF.s == nt && !dropUsingRules){ // start to be removed?
		// not for the reason of being epsilon only!
		var index = BNF.bnf.findIndex((b)=>b.name == nt); // find in bnf
		BNF.bnf[index].rhs = [[[],""]]; // assign epsilon rule
		return;
	}
	var index = BNF.nonterminals.indexOf(nt); // find in nonterminals
	if (index != -1) BNF.nonterminals.splice(index,1); // remove if found
	index = BNF.bnf.findIndex((b)=>b.name == nt); // find in bnf
	if (index != -1) BNF.bnf.splice(index,1); // remove if found
	var remNT = []; // for other NTs to be removed too
	for (var i = 0; i < BNF.bnf.length ; i++){ // Check remaining BNF
		for (var k = BNF.bnf[i].rhs.length-1; k >= 0; k--){ // and their replacement expressions
			if (BNF.bnf[i].rhs[k][0].length > 0){ // not an epsilon expression
				var containsNT = false;
				for (var m = BNF.bnf[i].rhs[k][0].length-1; m >= 0; m--){ // iterate expression items backwards
					if (BNF.bnf[i].rhs[k][0][m].name == nt){ // uses the NT to be removed
						BNF.bnf[i].rhs[k][0].splice(m,1); // remove from expression
						containsNT = true;
					}
				}// can result in empty expressions
				if (BNF.bnf[i].rhs[k][0].length == 0 || // became empty
					(containsNT && dropUsingRules))  // or forced drop
					BNF.bnf[i].rhs.splice(k,1); // remove whole rule
			} // so epsilon rules remain
		} // can result in no rules at all
		if (BNF.bnf[i].rhs.length == 0) // no more rules
			remNT.push(BNF.bnf[i].name); // NT to be removed too
	}
	for (var i = 0; i < remNT.length; i++) // remove further NT without rules
		cleanupGrammar.RemoveNT(BNF, remNT[i], dropUsingRules); // keep drop option
}
// In-place minimizing procedures
cleanupGrammar.RemoveSelfEvaluating = function(BNF){ // Nonterminals evaluating to themselve
	var remNT = []; // NTs to be removed completely
	for (var i = 0; i < BNF.bnf.length; i++){ // check all nonterminals
		for (var j = BNF.bnf[i].rhs.length-1; j >= 0; j--){ // check replacement expressions backwards
			if (BNF.bnf[i].rhs[j][0].length == 1 && // just a single item
				BNF.bnf[i].rhs[j][0][0].name === BNF.bnf[i].name){ // evaluating to itsself
				BNF.bnf[i].rhs.splice(j,1); // remove the self-evaluating expression
			}
		}
		if (BNF.bnf[i].rhs.length == 0) // no other expression
			remNT.push(BNF.bnf[i].name); // NT can be removed
	}
	for (var i = 0; i < remNT.length; i++) // remove all NT
		cleanupGrammar.RemoveNT(BNF, remNT[i], true); // left without rules, drop all rules using these NT
}
cleanupGrammar.RemoveEpsilonNT = function(BNF){ // Nonterminals replaced by Epsilon only
	while(true){
		var remNT = BNF.bnf.reduce(function(res, cur) { // collect epsilon-NTs
				// epsilon rules only
				if (cur.rhs.length == cur.rhs.filter((r)=>r[0].length == 0).length)
					res.push(cur.name); // collect
				return res;
			},[]);
		for (var i = 0; i < remNT.length; i++) // remove epsilon-NTs
			cleanupGrammar.RemoveNT(BNF, remNT[i], false); // keep rest of using expressions
		if (remNT.length == 0) break; // nothing to be removed >> stop
		if (remNT.length == 1 && remNT[0] == BNF.s) break; // stop when start symbol only
		// can result in NTs having NOW epsilon rules only >> reloop
	}
}
cleanupGrammar.RemoveEqualReplacements = function(BNF){ // Equal replacement-rules for a nonterminal
	for (var i = 0; i < BNF.bnf.length; i++){ // check all nonterminals
		for (var j = BNF.bnf[i].rhs.length-1; j >= 0; j--){ // check replacement expressions backwards
			var rhs1 = BNF.bnf[i].rhs[j][0];
			for (var k = j-1; k >= 0; k--){ // compare with all replacement expressions before
				var rhs2 = BNF.bnf[i].rhs[k][0];
				if (rhs1.length == rhs2.length && // equal length and equal content
					rhs1.reduce((res, cur)=>res+=" "+cur.name,"") == rhs2.reduce((res, cur)=>res+=" "+cur.name,"")){
					BNF.bnf[i].rhs.splice(j,1); // remove the checked rhs
					break; // continue with next
				}
			}
		}
	}
}
cleanupGrammar.RemoveEqualNT = function(BNF){ // remove nonterminals with equal definition
	var replaced = true;
	while(replaced){ // loop until no changes occur
		replaced = false;
		for (var i = BNF.bnf.length-1; i >= 0; i--){ // check all nonterminals (backwards)
			var bnf1 = BNF.bnf[i].rhs.reduce(function(res,cur){
				res.push(cur[0].reduce((str,r)=>str+=" "+r.name,""));
				return res;
			},[]).sort().join("|");
			for (var j = i-1; j >= 0; j--){ // compare with all nonterminals before
				var bnf2 = BNF.bnf[j].rhs.reduce(function(res,cur){
					res.push(cur[0].reduce((str,r)=>str+=" "+r.name,""));
					return res;
				},[]).sort().join("|");
				// compare rules by their sorted string representation
				if (bnf1 == bnf2){
					var expressions = BNF.bnf.reduce((res, cur)=> // find expressions using nt[i]
						res.concat(cur.rhs.filter((r)=> r[0].find((e)=>e.name == BNF.bnf[i].name) != undefined))
					,[]);
					for (var k = 0; k < expressions.length; k++){ // iterate them
						var index = expressions[k][0].findIndex((e)=>e.name == BNF.bnf[i].name);
						while(index != -1){ // as long positions can be found where nt[i] is used
							// replace nt[i] by nt[j]
							expressions[k][0][index] = {name: BNF.bnf[j].name, type: "nt"};
							index = expressions[k][0].findIndex((e,ei)=>ei > index && e.name == BNF.bnf[i].name); // more usages
						}
					}
					BNF.nonterminals.splice(BNF.nonterminals.indexOf(BNF.bnf[i].name),1); // remove nonterminal
					BNF.bnf.splice(i,1); // remove rules
					replaced = true; // change can produce more equal NT
					break; // continue with next
				}
			} // backward iteration avoids replacing the start symbol
		}
		if (replaced){ // since replacing can cause rule-doubles and self evaluation
			cleanupGrammar.RemoveEqualReplacements(BNF); // remove any
			cleanupGrammar.RemoveSelfEvaluating(BNF);
		}
	}
}
/*cleanupGrammar.RemoveInterimNT = function(BNF){ // Nonterminals with just one single-item-replacement-expression
	var replaced = true;
	while(replaced){ // loop until no changes occur
		replaced = false;
		for (var i = BNF.bnf.length-1; i >= 0; i--){ // check all nonterminals (backwards)
			if (BNF.bnf[i].name == BNF.s) continue; // except of start symbol
			if (BNF.bnf[i].rhs.length == 1 && BNF.bnf[i].rhs[0][0].length < 2){ // has just one expression with a single item
				if (BNF.bnf[i].rhs[0][0].length == 1 && BNF.bnf[i].name == BNF.bnf[i].rhs[0][0][0].name){
					// referencing itself ONLY -> remomve all rules containing this NT
					for (var j = 0; j < BNF.bnf.length; j++){
						if (j == i) continue; // self is removed below
						for (var k = BNF.bnf[j].rhs.length-1; k >= 0; k--){
							if (BNF.bnf[j].rhs[k][0].find(o=>o.name == BNF.bnf[i].name) != undefined)
								BNF.bnf[j].rhs.splice(k,1);
						}
					}
				}
				else{
					var expressions = BNF.bnf.reduce((res, cur)=> // find expressions using nt
						res.concat(cur.rhs.filter((r)=> r[0].find((e)=>e.name == BNF.bnf[i].name) != undefined))
					,[]);
					for (var j = 0; j < expressions.length; j++){ // adapt expressions
						var index = expressions[j][0].findIndex((e)=>e.name == BNF.bnf[i].name); // get the index of the nt
						while (index != -1){ // for each occurence of the nt in expression
							// assemble new expression by concatenating (in-place)
							expressions[j][0] = expressions[j][0].slice(0,index) // all before the nt-usage
												.concat(BNF.bnf[i].rhs[0][0]) // the single nt-replacement expression
												.concat(expressions[j][0].slice(index+1)); // all behind the nt-usage
							index = expressions[j][0].findIndex((e,ei)=>ei >= index && e.name == BNF.bnf[i].name);
						}
					}
				}
				BNF.nonterminals.splice(BNF.nonterminals.indexOf(BNF.bnf[i].name),1); // remove nonterminal
				BNF.bnf.splice(i,1); // remove rules
				replaced = true;
			}
		}
		if (replaced){ // since replacing can cause rule-doubles and self evaluation
			cleanupGrammar.RemoveEqualReplacements(BNF); // remove any
			cleanupGrammar.RemoveSelfEvaluating(BNF);
		}
	}
}*/

cleanupGrammar.RemoveInfiniteNT = function(BNF){ // remove nonterminals causing infinite replacements
	var keepItems = BNF.terminals;
	var changed = true;
	while (changed){
		changed = false;
		for (var i = BNF.bnf.length-1; i >= 0; i--){ // check all nonterminals (backwards)
			for (var j = BNF.bnf[i].rhs.length-1; j >= 0; j--){ // and their rules
				var exp = BNF.bnf[i].rhs[j][0]; // a right-side-expression
				if (exp.Keep) continue; // already verified
				if (exp.length == 0 || // an epsilon rule or
					exp.find(e => keepItems.indexOf(e.name) == -1) == undefined){ // verified items only
					exp.Keep = true;
					BNF.bnf[i].Keep = true;
					keepItems.push(BNF.bnf[i].name);
					changed = true;
				}
			}
		}
	}
	// remove all items not to be kept
	for (var i = BNF.bnf.length-1; i >= 0; i--){
		for (var j = BNF.bnf[i].rhs.length-1; j >= 0; j--){
			if (BNF.bnf[i].rhs[j][0].Keep)
				delete BNF.bnf[i].rhs[j][0].Keep;
			else
				BNF.bnf[i].rhs.splice(j,1);
		}
		if (BNF.bnf[i].Keep)
			delete BNF.bnf[i].Keep;
		else
			BNF.bnf.splice(i,1);
	}
}
