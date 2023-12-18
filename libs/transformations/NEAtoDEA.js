function linkedNea2Dea(linkedEA) {
	function removeDoubles(array, comparer){
		array.sort(comparer);
		for (var i = array.length-2; i >= 0; i--){
			if (array[i] === array[i+1])
				array.splice(i+1,1);
		}
	}
	var id = 1; // counter for state-IDs
	function getDEAState(dea, neaStates){ // build DEA-state based on set of neaStates
		var statename = neaStates.reduce((n,s)=> n === "" ? s.Name : n + "+"+s.Name,""); // name: concatenated nea-states
		var state = dea.States.get(statename); // find existing dea-state
		if (state === undefined){ // combined state not there already
			state = { // create it
				ID: id++,
				Name: statename, // combined name
				Start: neaStates.length === 1 && neaStates[0].Start === true, // original start
				Final: neaStates.find(s=>s.Final === true) !== undefined, // any final state in set
				Radius: neaStates[0].Radius, x: undefined, y: undefined,
				Out: new Map(), In: new Map() 
			};
			dea.States.set(statename, state); // append state to DEA (indexed by name)
			var dic = new Map(); // for each label the set of target states from combined state
			for (var i = 0; i < neaStates.length; i++){
				var s = neaStates[i]; // iterate all nea states in set
				for (var t of s.Out.values()) { // and their transitions
					for (var l of t.Labels.values()) { // for each label expand target states array
						var d = dic.get(l);
						if (d === undefined)
							dic.set(l, [t.Target]);
						else
							d.push(t.Target); // creates doubles!
					}
				}
			}
			for (var [l,tStates] of dic) { // iterate the states reachable with a certain label
				// sort and remove doubles to build new combined state
				removeDoubles(tStates, (a,b)=>  a.Name > b.Name ? 1 : (a.Name < b.Name ? -1 : 0));
				// determine according new dea-state recursively
				var targetstate = getDEAState(dea, tStates);
				// find existing transitions to this dea-state
				var t = state.Out.get(targetstate.ID);
				if (t === undefined) { // if there is no transition, create it
					t = { Source: state, Target: targetstate, Labels: new Map() };
					t.Labels.set(l,l);
					state.Out.set(targetstate.ID, t);
					targetstate.In.set(state.ID, t);
				}
				else // otherwise just add the current label to existing transition
					t.Labels.set(l, l);
			}
		}
		return state; // return the existing or created DEA state
	}
	removeEpsilonLinkedNEA(linkedEA);
	//optimizeLinkedNEA(linkedEA);
	var dea = { // The result object
		Alphabet: linkedEA.Alphabet.slice(),
		States: new Map(), // The states
		Start: undefined // start state
	};
	dea.Start = getDEAState(dea, [linkedEA.Start]);
	return dea;
}

function NEAtoDEA(automaton){
	var linkedEA = linkEA(automaton);
	var linkedDEA = linkedNea2Dea(linkedEA);
	var a = unlinkEA(linkedDEA, true);
	var r = completeDEA(a);
	return {"result":"OK", "automaton":r.automaton}; // true = keep traps when unlinking!
}      


