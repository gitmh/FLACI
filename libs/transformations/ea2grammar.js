function ea2grammar(automaton, eatype){
/*	var res = removeTrapStates(automaton);
	if (res.result != "OK") return res;
	var a = res.automaton; // nea without trap-states*/
	var a = JSON.parse(JSON.stringify(automaton));
	var bnf = { bnf:[], // initialize result grammar
				s:undefined, 
				nonterminals:[], 
				terminals:a.Alphabet};
				
	var addStateToGrammar = function(s){
		bnf.nonterminals.push(s.Name); // add state as nonterminal
		var nt = {name:s.Name, rhs:[]}; // init nt-rules
		bnf.bnf.push(nt);
		for (var j = 0; j < s.Transitions.length; j++){
			var t = s.Transitions[j]; // transitions from current state
			var targetState = a.States.find(ts=>ts.ID == t.Target); // determine target state
			var targetNT = {name:targetState.Name, type:"nt"}; // prepare nonterminal-reference
			for (var k = 0; k < t.Labels.length; k++){ // iterate lables/terminals of transitions
				if (t.Labels[k] == ""){ // epsilon-rule
					nt.rhs.push([[targetNT],""]); // -> targetNT
					if (targetState.Final) // target state is a final state
						nt.rhs.push([[],""]); // add epsilon rule
				}
				else{
					nt.rhs.push([[{name:t.Labels[k],type:"t"},targetNT],""]); // -> label targetNT
					if (targetState.Final) // target state is a final state
						nt.rhs.push([[{name:t.Labels[k],type:"t"}],""]); // -> label
				}
			}
		}
		if (s.Start){ // start-state found
			bnf.s = s.Name; // set start-symbol
			if (s.Final) // is final
				nt.rhs.push([[],""]); // add epsilon rule
		}
	};
				
	for (var i = 0; i < a.States.length; i++){
	  if(a.States[i].Start)
  		addStateToGrammar(a.States[i]);
	}
	for (var i = 0; i < a.States.length; i++){
	  if(!a.States[i].Start)
	  	addStateToGrammar(a.States[i]);
	}
	//cleanupGrammar.RemoveEqualReplacements(bnf)
	return {"result":"OK", "grammar":BNF2Text(bnf)};
}
