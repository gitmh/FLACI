/* ACHTUNG!
Bei Grammatiken der Form S -> SSx | Sx entstehen leere Regelmengen (hier für S)
*/
function removeLeftRecursionGrammar(grammar){
	function ContainsSequence(evalto, seq){
		for (var i = 0; i < evalto.length; i++){
			var s = evalto[i].Seq;
			if (seq.length != s.length) continue;
			var equal = true;
			for (var j = 0; j < s.length; j++){
				if (s[j] !== seq[j]){
					equal = false;
					break;
				}
			}
			if (equal) return true;
		}
		return false;
	}
	var res = removeEpsilonGrammar(grammar); // remove epsilon
	if (res.result == "FAILED") return res; // any problems with removing epsilon?
	var noEpsGrammar = res.grammar.replace(" | EPSILON", ""); // remove remaining rule
	var addEps = (noEpsGrammar != res.grammar); // S -> EPSILON possible?
	res = removeChainsGrammar(noEpsGrammar); // Rebuild BNF without chain rules
	if (res.result == "FAILED") return res; // any problems with removing chains?
	var BNF = parseBNF(res.grammar);
	var lbnf = linkBNF(BNF); // for more comfortable rule access
	var Names = lbnf.NonTerminals.map(n=>n.Name).concat(lbnf.Terminals.map(n=>n.Name));
	// Paulls Algorithm
	var numNT = lbnf.NonTerminals.length; // fix loop limit to original NT
//	console.log("Start: " + BNF2Text(unlinkBNF(lbnf)));
	for (var i = 0; i < numNT; i++){ // iterate all original NT
		var xi = lbnf.NonTerminals[i];
		for (var j = 0; j < i; j++){ // iterate all NT processed before
			var xj = lbnf.NonTerminals[j];
			for (var k = xi.EvalTo.length-1; k >= 0 ; k--){ // iterate rules of NT
				if (xj == xi.EvalTo[k].Seq[0]){ // indirect recursion
					for (var m = 0; m < xj.EvalTo.length; m++){ // take all rules of xj
						// add new rule with rule of first NT expanded by current rule without first NT
						var rule = {Seq: xj.EvalTo[m].Seq.concat(xi.EvalTo[k].Seq.slice(1))};
						if (!ContainsSequence(xi.EvalTo, rule.Seq))
							xi.EvalTo.push(rule);
					}
					xi.EvalTo.splice(k,1); // remove old rule
				}
			}
		}
//		console.log(xi.Name+"-A: " + BNF2Text(unlinkBNF(lbnf)));
		var newNT = undefined;
		for (var k = xi.EvalTo.length-1; k >= 0 ; k--){ // iterate rules of NT
			if (xi == xi.EvalTo[k].Seq[0]){ // direct
				if (newNT == undefined){
					var newname = "N."+xi.Name;
					while(Names.indexOf(newname) != -1) // with a unique name
						newname = "N"+newname; 
					Names.push(newname);
					newNT = {Name: newname, EvalTo: [{Seq:[], Code:""}]}; // with epsilon-rule
					for (var m = 0; m < xi.EvalTo.length; m++){ // all original rules
						if (xi.EvalTo[m].Seq[0] !== xi) // not starting with self-recursion
							xi.EvalTo[m].Seq.push(newNT); // expanded with new NT
					}
					lbnf.NonTerminals.push(newNT);
				}
				// on any occurence -> append the new replacement rule
				var rule = {Seq: xi.EvalTo[k].Seq.slice(1).concat([newNT]),Code:""};
				if (!ContainsSequence(newNT.EvalTo, rule.Seq))
					newNT.EvalTo.push(rule);
				xi.EvalTo.splice(k,1); // remove current rule
			}
		}
//		console.log(xi.Name+"-B: " + BNF2Text(unlinkBNF(lbnf)));
	}
	BNF = unlinkBNF(lbnf);
	if (addEps)
		BNF.bnf.find(b=>b.name == BNF.s).rhs.push([[],""]);
	return {"result":"OK", "grammar":BNF2Text(BNF)};
}