function removeChainsGrammar(grammar){ 
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
	function CanEvaluate(fromItem, toItem, stack){ // fromItem can evaluate to toItem?
		if (fromItem === toItem) return true; // evaluating to itself always
		if (stack == undefined) stack = []; // initialize stack
		if (stack.indexOf(fromItem) != -1) return false; // avoid endless recursion
		for (var i = 0; i < fromItem.EvalTo.length; i++){ // check evaluations
			var evalState = 0; // 0=no replacement | 1=replacement and epsilon | 2=replacement without epsilon
			for (var j = 0; j < fromItem.EvalTo[i].Seq.length; j++){ // check the expression
				var ev = fromItem.EvalTo[i].Seq[j];
				if (ev.EvalTo == undefined){ // Terminal contained in expression
					evalState = 0; // Not possible
					break; // with this expression
				}
				stack.push(fromItem); // mark as checked
				var canEval = CanEvaluate(ev,toItem, stack); // check recursively
				stack.pop(); // remove from check-stack
				if (!ev.canEps && !canEval){ // Neither epsilon nor target evaluation
					evalState = 0; // No 1:1 replacement
					break;
				}
				// 3 different states possible during check of the sequence
				//	0 = replacement still possible (at begin or all NT before can be epsilon)
				//		- ev cannot be target but epsilon >> no state change
				//		- ev can be target and also epsilon >> state = 1
				//		- ev can be target but not epsilon >> state = 2
				//	1 = all nt before can be epsilon and at least one of them can be targetItem
				//		- ev cannot be target but epsilon >> no state change
				//		- ev can be target and also epsilon >> state remains 1
				//		- ev can be target but not epsilon >> state = 2
				//	2 = a prior NT can be targetItem but not epsilon (all of the following must be epsilon-able)
				//		- ev must be epsilon-able to keep state 2
				//		- otherwise 1:1 replacement is not possible
				if (evalState == 0)
					evalState = canEval ? (ev.canEps ? 1 : 2) : 0;
				else if (evalState == 1){
					if (canEval && !ev.canEps) evalState = 2;
				}
				else{ // evalstate=2
					if (!ev.canEps){
						evalState = 0;
						break;
					}
						
				}
			}
			if (evalState > 0)
				return true;
		}
		return false;
	}
	var BNF = parseBNF(grammar);
	var lbnf = linkBNF(BNF); // link BNF
	appendFirstFollowLBNF(lbnf); // required to decide about evaluation
	var evalPairs = []; // Find NT pairs that can be equal
	for (var i = 0; i < lbnf.NonTerminals.length; i++){
		var ntA = lbnf.NonTerminals[i];
		for (var j = 0; j < lbnf.NonTerminals.length; j++){
			var ntB = lbnf.NonTerminals[j];
			if (CanEvaluate(ntA, ntB)) // Nonterminals can be equal
				evalPairs.push({A:ntA, B:ntB, Eval:ntB.EvalTo});
		}
	}
	for (var i = 0; i < lbnf.NonTerminals.length; i++){ // Reset all rules
		var nt = lbnf.NonTerminals[i];
		nt.UsedBy = [];
		nt.EvalTo = [];
	}
	for (var i = 0; i < evalPairs.length; i++){ // reconstruct rules
		var pair = evalPairs[i];
		for (var j = 0; j < pair.Eval.length; j++){
			var ev = pair.Eval[j];
			if (ev.Seq.length != 1 || ev.Seq[0].EvalTo == undefined){
				if (!ContainsSequence(pair.A.EvalTo, ev.Seq))
					pair.A.EvalTo.push(ev);
					// UsedBy not required for unlinking
			}
		}
	}
	return {"result":"OK", "grammar":BNF2Text(unlinkBNF(linkBNF(unlinkBNF(lbnf))))}; // unlink and return as text
}