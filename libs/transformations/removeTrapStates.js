function removeTrapStates(automaton){
	function MarkIncoming(a, id){
		// Find all states connected to id and not marked already
		var incoming = a.States.filter(s=> s.Keep == undefined && s.Transitions.find(t=>t.Target == id) != undefined);
		for (var i = 0; i < incoming.length; i++)
			incoming[i].Keep = true; // Mark as state to keep 
		for (var i = 0; i < incoming.length; i++)
			MarkIncoming(a, incoming[i].ID); // Mark all states connected to these states
	}
	var a = JSON.parse(JSON.stringify(automaton));
	// Just remove all trap-states and their connections
	var finalStates = a.States.filter(s=>s.Final == true);
	for (var i = 0; i < finalStates.length; i++){ // iterate final states
		finalStates[i].Keep = true; // Mark as state to keep
		MarkIncoming(a, finalStates[i].ID); // Mark all states connected to final state
	}
	var delstates = [];
	for (var i = a.States.length-1; i >= 0; i--){
		if (a.States[i].Keep)
			delete a.States[i].Keep;
		else{
			delstates.push(a.States[i].ID);
			a.States.splice(i,1);
		}
	}
	for (var i = 0; i < a.States.length; i++){
		for (var j = a.States[i].Transitions.length-1; j >= 0; j--){
			var targetID = a.States[i].Transitions[j].Target;
			if (delstates.find(s => s == targetID) != undefined)
				a.States[i].Transitions.splice(j,1);
		}
	}
	return {"result":"OK", "automaton" : a };
}