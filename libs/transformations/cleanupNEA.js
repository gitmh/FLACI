function cleanupNEA(automaton) {
    function removeSelfEpsilon(linkedEA) { // removes self-epsilon-transitions
        for (var s of linkedEA.States.values()) { // iterate states
            var selftrans = s.Out.get(s.ID); // find self-transitions
            if (selftrans === undefined) continue; // no self-transition
            selftrans.Labels.delete(""); // remove epsilon transiton
            if (selftrans.Labels.size === 0) { // no other label
                s.Out.delete(s.ID); // remove whole
                s.In.delete(s.ID); //  self transition
            }
        };
    }
    var linkedEA = linkEA(automaton); // link NEA
    removeSelfEpsilon(linkedEA);
    // unlinking removes unreachable states and traps
    return { "result": "OK", "automaton": unlinkEA(linkedEA) };
}