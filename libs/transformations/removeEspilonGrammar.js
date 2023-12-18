function removeEpsilonGrammar(grammar){
	function ArrayEqual(a1, a2){
		if (a1 == a2) return true;
		if (!a1 || !a2) return false;
		if (a1.length != a2.length) return false;
		for(var i = 0; i < a1.length; i++){
			if (a1[i] != a2[i])
				return false;
		}
		return true;
	}
	// curNT cannot be EPSILON anymore, adapt all usages
	function AppendDirect(curNT, start, stack){
		if (stack == undefined) stack = []; // initialize stack
		if (stack.find((stackItem)=>stackItem === curNT) != undefined)
			return false; // already checked
		stack.push(curNT);
		var StartCanEps = false;
		for (var i = 0; i < curNT.UsedBy.length; i++){ // Check its usage
			var parentBNF = curNT.UsedBy[i]; // used by this BNFItem
			for (var j = 0; j < parentBNF.EvalTo.length; j++){ // check its rules backwards
				var idx = parentBNF.EvalTo[j].Seq.indexOf(curNT); // find curNT
				while(idx != -1){ // no more containment -> nothing left to be changed
					var newSet = {Seq: [], Code: ""}; // a new rule (initially no code?)
					newSet.Seq = [].concat(parentBNF.EvalTo[j].Seq); // copy the original
					newSet.Seq.splice(idx, 1); // and remove curNT
					if (newSet.Seq.length > 0){ // still other BNFitems in sequence
						if (parentBNF.EvalTo.find((s)=>ArrayEqual(s.Seq, newSet.Seq)) == undefined) // sequence not contained already
							parentBNF.EvalTo.push(newSet); // append it at the end, to be checked later again in this loop
					}
					else if (curNT != parentBNF){ // becomes itself to EPSILON, so do not append
						if (AppendDirect(parentBNF, start, stack)) // but adapt its usage
							StartCanEps = true;
					}
					idx = parentBNF.EvalTo[j].Seq.indexOf(curNT, idx+1); 
				}
			}
		}
		stack.pop();
		if (curNT === start) // the start symbol can be EPSILON
			StartCanEps = true;
		return StartCanEps;
	}
	// check current nonterminals for EPSILON and remove it
	function RemoveEpsilon(curNT, start, stack){ 
		if (stack == undefined){ // first run?
			stack = []; // initialize stack
			start = curNT; // remember start symbol
		}
		if (stack.find((stackItem)=>stackItem === curNT) != undefined)
			return false; // already checked
		stack.push(curNT);
		var StartCanEps = false;
		for (var i = curNT.EvalTo.length-1; i >= 0; i--){ // iterate all evaluations backwards
			if (curNT.EvalTo[i].Seq.length == 0){ // curNT can be EPSILON
				curNT.EvalTo.splice(i,1); // not anymore
				if (AppendDirect(curNT, start)) // find all usages and add the direct transitions
					StartCanEps = true;
			}
			else{ // otherwise
				for (var j = 0; j < curNT.EvalTo[i].Seq.length; j++){ // iterate the expression parts
					var subBNF = curNT.EvalTo[i].Seq[j];
					if (subBNF.EvalTo != undefined){ // if there is a nonterminal
						if (RemoveEpsilon(subBNF, start, stack)) // check it recursively
							StartCanEps = true;
					}
				}
			}
		}
		return StartCanEps;
	}
	var bnf = parseBNF(grammar); // to BNF
	if (bnf.nonterminals.length > 1 || // multiple NT or single NT with selfrecursion
		bnf.bnf[0].rhs.find((r)=>r[0].find((s)=>s.name == bnf.s) != undefined) != undefined){
		cleanupGrammar.RemoveSelfEvaluating(bnf); // Self-Evaluation (A -> A|a >> A -> a)
		cleanupGrammar.RemoveEpsilonNT(bnf); // NTs being EPSILON only (E -> EPSILON)
		cleanupGrammar.RemoveEqualReplacements(bnf); // Doubled replacements (A -> B | B >> A -> B)
		var lbnf = linkBNF(bnf); // to linked BNF
		if (RemoveEpsilon(lbnf.Start)){ // Actual removement
			// Empty word contained
			lbnf.Start.EvalTo.push({Seq: [], Code: ""}); // then just add it
		}
		bnf = unlinkBNF(lbnf); // back to BNF
	}
	return {"result":"OK", "grammar":BNF2Text(bnf)}; // return as text
}
