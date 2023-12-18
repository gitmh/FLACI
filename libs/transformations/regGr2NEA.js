/* 
converts a regular grammar to a nea(nfa)
for R -> tN productions constructs a state transition from R to N with label t
for R -> N productions constructs a state transition from R to N with label epsilon
for R -> t productions constructs a new final state F initially, 
			constructs state transition from R to F with label t
for R -> epsilon productions changes R to a final state
*/
function convertRegularGrammar2NEA(grammar){
	
	// Helper:
	function getIDfromName(name) {
		return idNameTable.indexOf(name);
	}

	function uniqueFinalStateExists() {
		return (idUniqueFinalState != undefined); 
	}

	function createUniqueFinalState() {
		var finalState = {};
		finalState.ID = auto.States.length + 1; //ID = currently highest ID + 1
		finalState.Name = "q" + finalState.ID; 
		finalState.Final = true;
		finalState.Start = false;
		finalState.x = 0;
		finalState.y = 0;
		finalState.Radius = 30;
		finalState.Transitions = [];
		auto.States.push(finalState); //add final state to automaton states
		idUniqueFinalState = finalState.ID; //save the ID
	}

	function addTransition(source, target, label, numState) {
		var newtrans = {}; //create new transition
		newtrans.Source = source;
		newtrans.Target = target;
		newtrans.x = 0;
		newtrans.y = 0;
		newtrans.Labels = [];
		newtrans.Labels.push(label); //add label
		auto.States[numState].Transitions.push(newtrans); //add transition
	}

	function initAutomatonFromGrammar(parsedGrammar) {
		auto = { //create automaton object
			Alphabet: [],
			States: []
		};
		auto.Alphabet = parsedGrammar.terminals; //alphabet is created from the grammars terminals
		var startSymbol = parsedGrammar.s;
		var nonterminalCount = parsedGrammar.bnf.length;
		for(var i = 0; i < nonterminalCount; i++) { //create new State for each nonterminal
			newState = {};
			newState.ID = (i + 1);
			newState.Name = "q" + newState.ID;
			newState.x = 0;
			newState.y = 0;
			newState.Radius = 30;
			newState.Transitions = [];
			newState.Start = (parsedGrammar.bnf[i].name == startSymbol); //set start attribute accordingly
			newState.Final = false; //set final attribute to false first
		
			idNameTable.push(parsedGrammar.bnf[i].name); //save name for lookup
			auto.States.push(newState); //add state to automaton states
		}
	}

	function updateTransitionsWithRulesetOne(parsedGrammar, numState, numPos) { //applies to rules of form 'R -> t N'
		var source = auto.States[numState].ID;
		var target = getIDfromName(parsedGrammar.bnf[numState].rhs[numPos][0][1].name); //name 2nd element (nonterminal) -> ID
		var label = parsedGrammar.bnf[numState].rhs[numPos][0][0].name; //name 1st element (terminal)

		if(auto.States[numState].Transitions.length == 0) { //state has no transitions yet
			addTransition(source, target, label, numState);
		} else { //there are already transitions
			var matchingTransitionExisted = false;
			for(var x = 0; x < auto.States[numState].Transitions.length; x++) { //iterate through existing transitions
				var existingSource = auto.States[numState].Transitions[x].Source;
				var existingTarget = auto.States[numState].Transitions[x].Target;
				if(existingSource == source && existingTarget == target) { //matching transition found
					matchingTransitionExisted = true;
					auto.States[numState].Transitions[x].Labels.push(label); //add label only
				}
			}
			if(matchingTransitionExisted == false) { //no matching transition found
				addTransition(source, target, label, numState);
			}
		}
	}

	function updateTransitionsWithRulesetTwo(parsedGrammar, numState, numPos) { //applies to rules of form 'R -> N'
		var source = auto.States[numState].ID;
		var target = getIDfromName(parsedGrammar.bnf[numState].rhs[numPos][0][0].name); //name 1st element -> ID
		addTransition(source, target, EPSILON, numState); //epsilon transition
	}

	function updateTransitionsWithRulesetThree(parsedGrammar, numState, numPos) { //applies to rules of form 'R -> t'
		var source = auto.States[numState].ID;
		var label = parsedGrammar.bnf[numState].rhs[numPos][0][0].name;

		if(uniqueFinalStateExists()) {
			if(auto.States[numState].Transitions.length == 0) { //state has no transitions yet
				addTransition(source, idUniqueFinalState, label, numState);
			} else { //there are transitions
				var matchingTransitionExisted = false;
				for(var x = 0; x < auto.States[numState].Transitions.length; x++) { //iterate through existing transitions
					var existingSource = auto.States[numState].Transitions[x].Source;
					var existingTarget = auto.States[numState].Transitions[x].Target;
					if(existingSource == source && existingTarget == idUniqueFinalState) { //matching transition found
						matchingTransitionExisted = true;
						auto.States[numState].Transitions[x].Labels.push(label); //add label only
					}
				}
				if(matchingTransitionExisted == false) { //no matching transition found
					addTransition(source, idUniqueFinalState, label, numState);
				}
			}
		} else { //final state does not exist yet
			createUniqueFinalState();
			addTransition(source, idUniqueFinalState, label, numState);	
		}
	}

	// The actual execution
	var auto; //automaton 
	var EPSILON = ""; //epsilon labels are represented by an empty string
	var idNameTable = []; //lookup table for id->name
	idNameTable[0] = 0; //offsets everything by one (ids start at one)
	var idUniqueFinalState; //saves the id of the unique final state

	var output =  { //create outputobject
		result: "OK",
		automaton: {}
	};	
	var parsedGrammar = parseBNF(grammar); //parse grammar first
	
	initAutomatonFromGrammar(parsedGrammar);

	for(var i = 0; i < parsedGrammar.bnf.length; i++) { //run through all rules	
		for (var j = 0; j < parsedGrammar.bnf[i].rhs.length; j++) { //run through all right hand side possibilities
			var possibility = parsedGrammar.bnf[i].rhs[j][0];
			if(possibility.length == 2) {
				updateTransitionsWithRulesetOne(parsedGrammar, i, j);
			} else if(possibility.length == 1) { 
				if(parsedGrammar.bnf[i].rhs[j][0][0].type == "nt") { //right hand side is nonterminal 
					updateTransitionsWithRulesetTwo(parsedGrammar, i, j);
				} else if(parsedGrammar.bnf[i].rhs[j][0][0].type == "t") { //right hand side is terminal
					updateTransitionsWithRulesetThree(parsedGrammar, i, j);
				}
			} else if(possibility.length == 0) { //right hand side has form of 'R -> EPSILON'
				auto.States[i].Final = true; //set state to be final  
			} else { //rule has more signs than possible
				output.result = "FAILED";
				output.error = "number of signs exceeds maximum";
			}
		}
	} 
	
	output.automaton = auto;
	return output;
}