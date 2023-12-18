class Dictionary{
    constructor() {
        this._index = {}; // for each key the index in values array
        this._values = []; // the actual values
        this._keys = []; // the keys for each value
        this.size = 0; // number of valid values in dictionary
    }
    [Symbol.iterator]() {
        var index = -1;
        var data = this._values.filter((i) => i != undefined);

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    };
    set (key, value) {
        var index = this._index[key]; // get existing index for key
        if (index === undefined) { // no index contained?
            this._index[key] = this._values.length;
            this._values.push(value);
            this._keys.push(key);
            this.size++;
        }
        else
            this._values[index] = value; // overwrite
    }
    get (key) {
        var index = this._index[key]; // get index for key
        if (index !== undefined) // if there is an index
            return this._values[index]; // return value from array
    }
    remove (key) {
        var index = this._index[key]; // get index for key
        if (index === undefined) return false; // no index -> nothing to remove
        this._values[index] = undefined; // not removed to keep index-values!!!
        this._keys[index] = undefined; // not removed to keep index-values!!!
        delete this._index[key]; // key removed
        this.size--;
        return true; // removed successfully
    }
    forEach (func) {
        var i = this._values.length;
        while (i--) { // reversed iteration
            var val = this._values[i];
            if (val === undefined) continue; // not a dictionary value
            var res = func(val, this._keys[i]); // call function
            if (res) return res; // early break returns a value (used as find)
        }
    }
    reduce (func, res) {
        var i = this._values.length;
        while (i--) { // reversed iteration
            var val = this._values[i];
            if (val === undefined) continue; // not a dictionary value
            res = func(res, val, this._keys[i]); // call function
        }
        return res;
    }
    clone (skip) { // clean copy without gaps
        var res = new Dictionary();
        var last = this._values.length - 1;
        var i = -1;
        while (last > i++) { // forward iteration
            var k = this._keys[i];
            if (k === undefined || k === skip) continue; // not a dictionary value
            res.set(k, this._values[i]);
        }
        return res;
    };
}

// Universal linked data structure for EA providing maximum access performance
function linkEA(a) {
	var idS = 1; // counter for new IDs
	var gotStates = {}; // temporary dictionary for processed states
    function appendLinkedState(a, r, s) {
        var state = { // create linked state object
            ID: idS++, Name: s.Name, // generate new ID
            Start: s.Start, Final: s.Final,
            Radius: s.Radius, x: s.x, y: s.y,
            Out: new Map(), In: new Map() // maps per target-/source-ID
        }
        if (s.Start) r.Start = state; // use as start state?
        r.States.set(state.ID, state); // append to state map
    		gotStates[s.ID] = state; // remember new state with old ID
        for (var i = 0; i < s.Transitions.length; i++) { // iterate outgoing transitions
            var oldT = s.Transitions[i];
            var ts = gotStates[oldT.Target]; // target state already there? (new state by old ID)
            if (ts === undefined) // no
                ts = appendLinkedState(a, r, a.States.find((as) => as.ID === oldT.Target)); // add it recursively
			// create and add transition from state to target (Label-Array becomes a map)
            var t = { 
				Source: state, Target: ts, 
                Labels: oldT.Labels.reduce((res, cur) => { res.set(cur, cur); return res; }, new Map()), x: oldT.x, y: oldT.y 
			};
            state.Out.set(ts.ID, t); // to out-map of state with target-ID
            ts.In.set(state.ID, t); // to in-map of target with source-ID
        }
        return state; // return the new state
    }
    var result = { // The result object
		Alphabet: a.Alphabet.slice(), // The alphabet-array
        States: new Map(), // Map of states per state-ID for fast search
        Start: undefined // start state
    };
    // Start recursive append with start state (states not reachable from start are ignored)
    appendLinkedState(a, result, a.States.find((s) => s.Start === true));
    return result;
}
function unlinkEA(linked, keepTraps, keepUnreachable) {
	function appendState(r, s) {
        if (!keepTraps && !s.NoTrap) return;
        if (!keepUnreachable && !s.CanReach) return;
        var state = { // create unlinked state object
            ID: s.ID, Name: s.Name,
            Start: s.Start, Final: s.Final,
            Radius: s.Radius, x: s.x, y: s.y,
            Transitions: []
        };
        r.States.push(state); // append to automaton
        for (var t of s.Out.values()) { // iterate outgoing transitions
            if (!keepTraps && !t.Target.NoTrap)
                continue; // continue when removing traps, targets being traps are not appended
            if (!keepUnreachable && !t.Target.CanReach)
                continue; // continue when removing unreachable, targets being unreachable are not appended
            var newTransition = { Source: s.ID, Target: t.Target.ID, Labels: Array.from(t.Labels.values()), x: t.x, y: t.y };
            state.Transitions.push(newTransition);
        };
    }
	function markNoTrap(s){ // recursive marking of states being not a trap
		if (s.NoTrap) return; // already checked
		s.NoTrap = true; // not a trap
		for (var i of s.In.values()) { // check all incoming transitions
			markNoTrap(i.Source); // the sources are no traps too
		};
    }
    function markReachables(s) { // recursive marking of states being reachable
        if (s.CanReach) return; // already checked
        s.CanReach = true; // reachable
        for (var i of s.Out.values()) { // check all outgoing transitions
            markReachables(i.Target); // the targets are reachable too
        };
    }
	if (!keepTraps){ // when to remove traps, mark states being no trap
		for (var s of linked.States.values()) {
			if (s.Final) markNoTrap(s); // start at final states
		}
    }
    if (!keepUnreachable) // when to remove unreachables, mark states being reachable
        markReachables(linked.Start); // start at start state
    var result = { // The result object
        Alphabet: linked.Alphabet.slice(),
        States: [],
    };
    for (var state of linked.States.values())
        appendState(result, state);

    removeUnusedAutomatonStates(result);

    return result;
}

function removeUnusedAutomatonStates(a){
  // remove unused states
  for(var i=0; i < a.States.length; i++){
    if(a.States[i].Final) continue; 
    var hasUsedTransitions = false;
    for(var z=0; z < a.States[i].Transitions.length; z++){
      if(a.States[i].Transitions[z].Target != a.States[i].ID){
        hasUsedTransitions = true; break;  
      }
    }
    for(var x=0; x < a.States.length; x++){
      if(x == i) continue; // skip self
      for(var z=0; z < a.States[x].Transitions.length; z++){
        if(a.States[x].Transitions[z].Target == a.States[i].ID){
          hasUsedTransitions = true; break;  
        }
      }
      if(hasUsedTransitions) break;
    }
    if(!hasUsedTransitions){
      a.States.splice(i,1);
      i--;
    }
  }
}

function appendLabelDic(linkedEA){ // create/extend label-related transition maps
	for (var s of linkedEA.States.values()) {
		s.OutL = new Map(); // Map of outgoing transitions per label
		for (var t of s.Out.values()) {
			for (var l of t.Labels.values()) { // iterate labels
				var ldic = s.OutL.get(l); // try get existing label-transitions
				if (!ldic){
					ldic = [t.Target];
					s.OutL.set(l,ldic);
				}
				else
					ldic.push(t.Target);
			}
		}
        s.InL = new Map(); // Map of incoming transitions per label
        for (var t of s.In.values()) {
            for (var l of t.Labels.values()) { // iterate labels
				var ldic = s.InL.get(l); // try get existing label-transitions
				if (!ldic){
					ldic = [t.Source];
					s.InL.set(l,ldic);
				}
				else
					ldic.push(t.Source);
			}
		}
	}
}
