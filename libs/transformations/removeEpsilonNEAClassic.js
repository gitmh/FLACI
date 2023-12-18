function removeEpsilonNEAClassic(automaton) {
    function copy(o) { return JSON.parse(JSON.stringify(o)); }; // copy element by JSON
    function AddEpsilonClosure(state, automaton, closure) {
        if (closure == undefined) { // first call
            state.e = {}; // initialize closure
            closure = state.e; // to be filled recursively
        }
        closure[state.ID] = state; // with self
        for (var i = 0; i < state.Transitions.length; i++) { // iterate its transitions
            var t = state.Transitions[i];
            if (t.Labels.find((label) => label == "") == undefined)
                continue; // no epsilon transition
            if (closure[t.Target] == undefined) { // a new one
                var epsTarget = automaton.States.find((s) => s.ID == t.Target); // get target state
                AddEpsilonClosure(epsTarget, automaton, closure); // recursive add
            }
        }
    }
    function GetClosureTransitions(state, automaton, targetstate) {
        targetstate.Final = false; // reset final state
        targetstate.Transitions = []; // reset transitions
        var transitions = new Map(); // map to collect new transitions
        for (var sid in state.e) { // iterate e-closure
            var sOrig = state.e[sid]; // a state in e-closure
            if (sOrig.Final) targetstate.Final = true;
            for (var i = 0; i < sOrig.Transitions.length; i++) {
                var tOrig = sOrig.Transitions[i]; // iterate its transitions
                var newLabels = tOrig.Labels.filter((label) => label != ""); // copy lables without e
                if (newLabels.length > 0) { // if there are real transitions
                    var epsTarget = automaton.States.find((s) => s.ID == tOrig.Target); // get target state
                    for (var tid in epsTarget.e) { // iterate its e-closure
                        var trans = transitions.get(tid); 
                        if (trans == undefined) { // a new target state
                            trans = new Map(); // initialize
                            transitions.set(tid, trans);
                        }
                        for (var l of newLabels) // add labels
                            trans.set(l,l);
                    }
                }
            }
        }
        // create result transitions
        for (var [tid, lab] of transitions) {
            targetstate.Transitions.push({
                Source: state.ID,
                Target: tid,
                Labels: Array.from(lab.values())
            });
        }
    }
    var r = copy(automaton); // copy of original
    // Extend states of original with e-closure
    for (var i = 0; i < automaton.States.length; i++)
        AddEpsilonClosure(automaton.States[i], automaton);
    // Build new transitions
    for (var i = 0; i < r.States.length; i++)
        GetClosureTransitions(automaton.States[i], automaton, r.States[i]);
    return { "result": "OK", "automaton": r };
}