function ka2grammar(automaton, type) {
	// helper functions:
	function getStateByID(id) {
		for (var i = 0; i < automaton.States.length; i++) {
			if (automaton.States[i].ID == id) {
				return automaton.States[i];
			}
		}
		return null;
	}

	function createTransitionalState() {
	  var maxID = 0;
	  for(var i=0; i < automaton.States.length; i++){
	    maxID = Math.max(maxID, automaton.States[i].ID);
	  }
		var newState = {};
		newState.ID = maxID+1;
		newState.Name = "q" + (newState.ID - 1);
		newState.x = 0;
		newState.y = 0;
		newState.Radius = 30;
		newState.Transitions = [];
		newState.Start = false;
		newState.Final = false;
		automaton.States.push(newState); //add to automaton states
		return newState.ID;
	}

	function addTransition(source, target, label) {
		var newtrans = {}; 
		newtrans.Source = source;
		newtrans.Target = target;
		newtrans.x = 0;
		newtrans.y = 0;
		newtrans.Labels = [];
		newtrans.Labels.push(label); 
	  for(var i=0; i < automaton.States.length; i++){
	    if(automaton.States[i].ID == source){
    		automaton.States[i].Transitions.push(newtrans); //add transition
    		break;
      }		
	  }
	}

	function normalizePushdownLength() {
		var numberOfStates = automaton.States.length; //only operate on original states
		for (var s = 0; s < numberOfStates; s++) {
			for (var t = 0; t < automaton.States[s].Transitions.length; t++) {
				for (var l = 0; l < automaton.States[s].Transitions[t].Labels.length; l++) {
					var transition = automaton.States[s].Transitions[t];
					var q1 = transition.Source;
					var q2 = transition.Target;
					var tos = transition.Labels[l][0];
					var input = transition.Labels[l][1];
					var pushdown = transition.Labels[l][2];
					
					if (pushdown.length > 2) { //needs to be normalized
						var offset = 0;
						var linkingTos; //for saving the 'linking' tos symbol
						var currentState = null; 
						while (pushdown.length - offset >= 2) {
							if (offset == 0) { //first iteration
								var newState = createTransitionalState();
								delete transition.Labels[l]; //delete old transition, keeps an 'undefined' slot in the array
								var newPushdown = pushdown.slice(-2); //copy last 2 elements into new array
								addTransition(q1, newState, [tos, input, newPushdown]); //add 'root' transition
							} else {
								if (pushdown.length - offset == 2) { //last iteration
									var newPushdown = pushdown.slice((-2 - offset), pushdown.length - offset); //copy latest 2 elements
									addTransition(currentState, q1, [linkingTos, EPSILON, newPushdown]); //add 'back' transition
								} else {
									var newState = createTransitionalState();
									var newPushdown = pushdown.slice((-2 - offset), pushdown.length - offset); //copy latest 2 elements
									addTransition(currentState, newState, [linkingTos, EPSILON, newPushdown]); //add 'inbetween' transition
								}
							}
							linkingTos = newPushdown[0];
							currentState = newState;
							offset++;
						}
					}
				}
			}
		}
	}

	function createBNF() {
		var rules = [];
		var miss = [];
		var used = [];
		for (var s = 0; s < automaton.States.length; s++) {
			if (automaton.States[s].Start) { //for start state rules are: S -> qs_$_qn
				for (var k = 0; k < automaton.States.length; k++) {
					var lhs = automaton.States[s].Name;
					var rhs = automaton.States[s].Name + "_" + automaton.StackAlphabet[0] + "_" + automaton.States[k].Name;
					lhs = lhs.replace("|","¦");
					rhs = rhs.replace("|","¦");
					if(miss.indexOf(rhs) == -1) miss.push(rhs);
					if(used.indexOf(lhs) == -1) used.push(lhs);
					rules.splice(0, 0, lhs + " -> " + rhs); //always insert rules of start state first
				}
			}
			for (var t = 0; t < automaton.States[s].Transitions.length; t++) {
				for (var l = 0; l < automaton.States[s].Transitions[t].Labels.length; l++) {
					if (typeof(automaton.States[s].Transitions[t].Labels[l]) != "undefined") {
						var q1 = getStateByID(automaton.States[s].Transitions[t].Source);
						var q2 = getStateByID(automaton.States[s].Transitions[t].Target);
						var tos = automaton.States[s].Transitions[t].Labels[l][0];
						var input = automaton.States[s].Transitions[t].Labels[l][1];
						var pushdown = automaton.States[s].Transitions[t].Labels[l][2];

						if (pushdown.length == 0) { //rules are: q1_A_q2 -> a
						  // nothing pushed
							var lhs = q1.Name + "_" + tos + "_" + q2.Name;
							var rhs = (input == EPSILON) ? "EPSILON" : input;
					    lhs = lhs.replace("|","¦");
					    rhs = rhs.replace("|","¦");

    					if(used.indexOf(lhs) == -1) used.push(lhs);
							rules.push(lhs + " -> " + rhs);
						} else if (pushdown.length == 1) { //rules are: q1_A_qi -> a q2_B_qi
             
							for (var i = 0; i < automaton.States.length; i++) {
								var lhs = q1.Name + "_" + tos + "_" + automaton.States[i].Name;
								var rhs = ((input == EPSILON) ? "EPSILON" : input) + " " + 
								          q2.Name + "_" + pushdown + "_" + automaton.States[i].Name;
  					    lhs = lhs.replace("|","¦");
  					    rhs = rhs.replace("|","¦");

                var tname = q2.Name + "_" + pushdown + "_" + automaton.States[i].Name;
  					    tname = tname.replace("|","¦");

      					if(miss.indexOf(tname) == -1) miss.push(tname);
       					if(used.indexOf(lhs) == -1) used.push(lhs);

								rules.push(lhs + " -> " + rhs);
							}
						} else if (pushdown.length == 2) { //rules are: q1_A_qi -> a q2_b_qn qn_C_qi
							for (var i = 0; i < automaton.States.length; i++) {
  							for (var n = 0; n < automaton.States.length; n++) {
									var lhs = q1.Name + "_" + tos + "_" + automaton.States[i].Name;
									var rhs = (input == EPSILON) ? "EPSILON" : input; 
									rhs += " " + q2.Name + "_" + pushdown[0] + "_" + automaton.States[n].Name;
									rhs += " " + automaton.States[n].Name + "_" + pushdown[1] + "_" + automaton.States[i].Name;
    					    lhs = lhs.replace("|","¦");
    					    rhs = rhs.replace("|","¦");

                  var tname = q2.Name + "_" + pushdown[0] + "_" + automaton.States[n].Name;
    					    tname = tname.replace("|","¦");
        					if(miss.indexOf(tname) == -1) miss.push(tname);
                  var tname = automaton.States[n].Name + "_" + pushdown[1] + "_" + automaton.States[i].Name;
    					    tname = tname.replace("|","¦");
        					if(miss.indexOf(tname) == -1) miss.push(tname);
        					if(used.indexOf(lhs) == -1) used.push(lhs);

									rules.push(lhs + " -> " + rhs);
  							  
                }
              }
						} else {
							output.result = "FAILED";
							output.error = "Unexpected pushdown length";
						}
					}
				}
			}
		}
		for(var i = 0; i < miss.length; i++){
		  if(used.indexOf(miss[i]) == -1){
		    // not used, add a x -> x rule 
		    rules.push(miss[i] + " -> " + miss[i]);
		  }
		}
		//construct text form of grammar
		var grammarString = "";
		for (var i = 0; i < rules.length; i++) {
			grammarString += rules[i] + "\n";
		}
		return parseBNF(grammarString);
	}

	
	var EPSILON = ""; //constant
	var output = {}; //create output object
	output.result = "OK"; //default result to OK

	var r = build6from7tupleKA(automaton);
	automaton = r.automaton;
	
	normalizePushdownLength();
	
	var parsedGrammar = createBNF();
  output.grammar = BNF2Text(parsedGrammar);
	
	return output;		
}
