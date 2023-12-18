function removeEpsilonLinkedNEA(linkedEA) {
    function removeSelfEpsilon(linkedEA) { // removes self-epsilon-transitions
        for(var s of linkedEA.States.values()){ // iterate states
            var selftrans = s.Out.get(s.ID); // find self-transitions
            if (selftrans === undefined) continue; // no self-transition
            selftrans.Labels.delete(""); // remove epsilon transiton
            if (selftrans.Labels.size === 0) { // no other label
                s.Out.delete(s.ID); // remove whole
                s.In.delete(s.ID); //  self transition
            }
        };
    }
    function createEClosure(linkedEA) { // determine direct neighbor states reachable with epsilon
        for (var s of linkedEA.States.values()) { // iterate states
/*            for (var t of s.Out.values()) { // iterate outgoing transitions
                if (t.Labels.get("") !== undefined) { // epsilon transition?
                    if (s.EFollow === undefined) s.EFollow = new Map(); // initialize map with follow-states
                    s.EFollow.set(t.Target.ID, t.Target); // add target state
                }
            }*/
            for (var t of s.In.values()) { // iterate incoming transitions
                if (t.Labels.get("") !== undefined) { // epsilon transition?
                    if (s.ELead === undefined) s.ELead = new Map(); // initialize map with leading-states
                    s.ELead.set(t.Source.ID, t.Source); // add source state
                }
            }
        }
    }
    function setFinal(s, stack) { // set states final that can reach an end state
        s.Final = true; // this state is final
        if (s.ELead === undefined) return; // no incoming epsilon transitions
        if (stack === undefined) stack = {};
        if (stack[s.ID] !== undefined) return;
        stack[s.ID] = s; // "stack" to avoid endless recursion
        // iterate all states reaching s with epsilon
        for (var e of s.ELead.values())
            setFinal(e, stack);// they are to be final too
        delete stack[s.ID];
    }
/*    function addStartState(s, startStates) { // collect states than can reach start state
        s.Start = false; // reset
        if (startStates.get(s.ID) !== undefined) return; // already added
        startStates.set(s.ID, s); // add
        if (s.ELead === undefined) return; // no incoming epsilon transitions
        // iterate all states reaching s with epsilon
        for (var e of s.ELead.values())
            addStartState(e, startStates);// they are start states too
    }*/
    var bypass = new Map(); // find all epsilon-replacement transitions
/*    function getFollowTransitions(incoming, s, stack) { // redirect incoming-transitions to all epsilon-targets of s
        if (s.EFollow === undefined) return []; // no outgoing epsilon transitions
        if (stack === undefined) stack = {};
        if (stack[s.ID] !== undefined) return [];
        stack[s.ID] = s; // "stack" to avoid endless recursion
        for (var target of s.EFollow.values()) { // iterate epsilon-transition-target-states
            for (var t of incoming.values()) { // iterate the original incoming transitions
                var tKey = t.Source.ID + " " + target.ID; // key for this state transition
                var bp = bypass.get(tKey);
                if (!bp) { // not a bypass already
                    bp = { Source: t.Source, Target: target, Labels: new Map(t.Labels) };
                    bypass.set(tKey, bp); // insert as a new bypass
                }
                else { // extend labels of bypass
                    for (var l of t.Labels.values())
                        bp.Labels.set(l, l);
                }
            }
            // add redirected incoming-transitions to epsilon-targets of target recursively
            getFollowTransitions(incoming, target, stack);
        }
        delete stack[s.ID];
    }*/
    function getLeadingTransitions(outgoing, s, stack) { // redirect outgoing-transitions to all epsilon-sources of s
        if (s.ELead === undefined) return []; // no incoming epsilon transitions
        if (stack === undefined) stack = {};
        if (stack[s.ID] !== undefined) return [];
        stack[s.ID] = s; // "stack" to avoid endless recursion
        for (var source of s.ELead.values()) { // iterate epsilon-transition-source-states
            for (var t of outgoing.values()) { // iterate the original outgoing transitions
                var tKey = source.ID + " " + t.Target.ID; // key for this transition
                var bp = bypass.get(tKey);
                if (!bp) { // not a bypass already
                    bp = { Source: source, Target: t.Target, Labels: new Map(t.Labels) };
                    bypass.set(tKey, bp); // insert as a new bypass
                }
                else { // extend labels of bypass
                    for (var l of t.Labels.values())
                        bp.Labels.set(l, l);
                }
            }
            // add redirected outgoing-transitions from epsilon-sources of source recursively
            getLeadingTransitions(outgoing, source, stack);
        }
        delete stack[s.ID];
    }
    // The actual removement
    removeSelfEpsilon(linkedEA); // remove any epsilon-self-transitions
    createEClosure(linkedEA); // find all direct epsilon transitions of each state
    for (var s of linkedEA.States.values()) // set all states final 
        if (s.Final) setFinal(s); // that can reach a final-state with epsilon-transitions
    // Determine all states that can be a start state (can reach start with epsilon)
//    var startStates = new Map();
//    addStartState(linkedEA.Start, startStates);
    for (var s of linkedEA.States.values()) { // iterate states   
/*        if (s.EFollow !== undefined) { // if there are outgoing epsilon-transitions
            var incoming = new Map();
            for (var t of s.In.values()) { // get incoming non-epsilon-transitions
                if (t.Labels.size > 1 || t.Labels.get("") === undefined) {
                    var inc = { Source: t.Source, Target: t.Target, Labels: new Map(t.Labels) };
                    inc.Labels.delete("");
                    incoming.set(t.Source.ID, inc);
                }
            }
            if (incoming.size > 0) // non-epsilon-transitions found
                getFollowTransitions(incoming, s); // get replacement transitions
        }*/
        if (s.ELead !== undefined) { // if there are incoming epsilon-transitions
            var outgoing = new Map();
            for (var t of s.Out.values()) { // get outgoing non-epsilon-transitions
                if (t.Labels.size > 1 || t.Labels.get("") === undefined) {
                    var out = { Source: t.Source, Target: t.Target, Labels: new Map(t.Labels) };
                    out.Labels.delete("");
                    outgoing.set(t.Target.ID, out);
                }
            }
            if (outgoing.size > 0) // non-epsilon-transitions found
                getLeadingTransitions(outgoing, s); // get replacement transitions
        }
    }
    // append the replacement-transitions
    for (var tb of bypass.values()) {
        var t = tb.Source.Out.get(tb.Target.ID); // already existing Out transition to target?
        if (t === undefined) { // if not, there is also no In transition
            tb.Source.Out.set(tb.Target.ID, tb); // both are
            tb.Target.In.set(tb.Source.ID, tb);  // added
        }
        else { // transition exists already
            for (var l of tb.Labels.values())
                t.Labels.set(l, l); // just append the labels
        }
    }
    // remove all replaced epsilon-transitions
    for (var s of linkedEA.States.values()) {
        for (var t of s.Out.values()) { // iterate out transitions
            t.Labels.delete(""); // remove epsilon label
            if (t.Labels.size === 0) // no other labels
                s.Out.delete(t.Target.ID); // remove object
        }
        for (var t of s.In.values()) { // iterate in transitions
            t.Labels.delete(""); // remove epsilon label
            if (t.Labels.size === 0) // no other labels
                s.In.delete(t.Source.ID); // remove object
        }
    }
/*    var minStates = undefined;
    var minStart = undefined;
    for (s of startStates.values()) {
        linkedEA.Start = s;
        s.Start = true;
        var opt = unlinkEA(linkedEA);
        if (minStart == undefined || opt.States.length < minStates) {
            minStart = s;
            minStates = opt.States.length;
        }
        s.Start = false;
    }
    linkedEA.Start = minStart;
    minStart.Start = true;*/
    return linkedEA;
}

function removeEpsilonNEA(automaton) {
    var linkedEA = linkEA(automaton); // link NEA
    removeEpsilonLinkedNEA(linkedEA);
    return { "result": "OK", "automaton": unlinkEA(linkedEA, true, true) };
}