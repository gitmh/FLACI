/*
converts a context free grammar to a nka(npda)
creates 3 states, 
state 1 is only for starting and pushing the initial stack symbol
state 3 is the final state
state 2 has the working transitions
	rules of form R -> nonterminal nt create a transition (nt,nt):EPSILON
	rules of other forms create a transition (left hand side, EPSILON):right hand side
*/

function convertContextFreeGrammar2NKA(grammar) {
	
	// Helper: 
	function addTransition(source, target, label) {
		var newtrans = {}; //create new transition
		newtrans.Source = source;
		newtrans.Target = target;
		newtrans.x = 0;
		newtrans.y = 0;
		newtrans.Labels = [];
		newtrans.Labels.push(label); //add label
		auto.States[source - 1].Transitions.push(newtrans); //add transition
	}

	function initAutomaton() {
		auto = { //create automaton object
			Alphabet: [],
			StackAlphabet: [],
			States:[]
		};

		for(var i = 1; i <= 3; i++) { //create three states
			var newState = {};
			newState.ID = i;
			newState.Name = "q" + (newState.ID - 1);
			newState.x = 0;
			newState.y = 0;
			newState.Radius = 30;
			newState.Transitions = [];
			newState.Start = (i == 1); //only state 1 is Start state
			newState.Final = (i == 3); //only state 3 is Final state
			auto.States.push(newState); //add to automaton states
		}
		auto.Alphabet = parsedGrammar.terminals; //alphabet consists of grammars terminals
		
		var union = parsedGrammar.terminals.concat(parsedGrammar.nonterminals); //create union of terminals, nonterminals
		//making sure the initial stack symbol is not set to something used in the union of terminals and nonterminals
		if(union.indexOf(initialStackSymbol) != -1) {
			initialStackSymbol = "#";
			if(union.indexOf(initialStackSymbol) != -1) {
				initialStackSymbol ="§";
				if(union.indexOf(initialStackSymbol) != -1) {
					output.result = "FAILED";
					output.error = "Special character for initial stack symbol is already in use.";
				}
			}
		}
		auto.StackAlphabet.push(initialStackSymbol); //initial stack symbol needs to be first element of the stack alphabet
		auto.StackAlphabet.push.apply(auto.StackAlphabet, union); //add union elements to stackalphabet
	}

	function addGeneralTransitions() {
		//the start transition ($, EPSILON):S$
		var startSymbol = parsedGrammar.s;
		var startTransitionLabel = [initialStackSymbol, EPSILON, [startSymbol, initialStackSymbol]];
		addTransition(1, 2, startTransitionLabel);

		//the final transition ($, EPSILON):EPSILON
		var finalTransitionLabel = [initialStackSymbol, EPSILON, []]; //pushdown for epsilon is empty array
		addTransition(2, 3, finalTransitionLabel);
	}

	function addWorkingTransitions(){
		//adding transitions popping the stack
		for(var i = 0; i < parsedGrammar.terminals.length; i++) { //for each terminal add transition with label (terminal, terminal):Epsilon
			var terminal = parsedGrammar.terminals[i];
			var transitionLabel = [terminal, terminal, []]; //pushdown for epsilon is empty array
		
			if(auto.States[1].Transitions.length == 1) { //there is just the transition to the final state
				addTransition(2, 2, transitionLabel); //add a new transition to itself
			} else { //the transition to itself exists already
				auto.States[1].Transitions[1].Labels.push(transitionLabel); //just add the label to the existing transition
			}
		}
	
		//adding transitions pushing on to the stack
		for(var i = 0; i < parsedGrammar.bnf.length; i++) { //run through all rules	
			for(var j = 0; j < parsedGrammar.bnf[i].rhs.length; j++) { //run through all right hand side possibilities
				var lhs = parsedGrammar.bnf[i].name; //get left hand side of the production
				var rhs = parsedGrammar.bnf[i].rhs[j][0]; //get right hand side of the production

				var pushdown = []; 
				for(var k = 0; k < parsedGrammar.bnf[i].rhs[j][0].length; k++) {
					var sign = parsedGrammar.bnf[i].rhs[j][0][k].name; //get name property of sign-object
					pushdown.push(sign);
				}
				var transitionLabel = [lhs, EPSILON, pushdown]; //transition with label (left hand side, EPSILON) : right hand side

				if(auto.States[1].Transitions.length == 1) { //there is just the transition to the final state
					addTransition(2, 2, transitionLabel); //add a new transition to itself
				} else { //the transition to itself exists already
					auto.States[1].Transitions[1].Labels.push(transitionLabel); //just add the label to the existing transition
				}
			}
		}
	}


	// the actual execution:
	var initialStackSymbol = "$";
	var EPSILON = "";
	var auto;
	var output =  { //create outputobject
		result: "OK",
		automaton: {}
	};	
	var parsedGrammar = parseBNF(grammar); //parse grammar first

	initAutomaton();
	addGeneralTransitions();
	addWorkingTransitions();

	output.automaton = auto;
	return output;
}
