function convertRegexGrammar2NEA(grammar) {


	/*TODO: 
	-find a suitable way to create start and end state for nonterminals and associate a unique name? can this even happen? grammar should always be using "N"+numeric identifier, so there should be no problem?

	*/

	// Helper:
	function getIDfromName(name) {
		return idNameTable.indexOf(name);
	}

	function createState(name, start, final) {
		newState = {};
		newState.ID = auto.States.length + 1;
		//newState.Name = "q" + newState.ID;
		newState.Name = "q" + name;
		newState.x = 0;
		newState.y = 0;
		newState.Radius = 30;
		newState.Transitions = [];
		newState.Start = start;
		newState.Final = final;
		idNameTable.push(name); //save name for lookup
		auto.States.push(newState); //add state to automaton states
	}

	function addTransition(source, target, label) {
		var newtrans = {}; //create new transition
		newtrans.Source = source;
		newtrans.Target = target;
		newtrans.x = 0;
		newtrans.y = 0;
		newtrans.Labels = [];
		newtrans.Labels.push(label); //add label
		
		/*
		console.log("Transition:");
		console.log(auto.States[source - 1]);
		*/
		auto.States[source - 1].Transitions.push(newtrans); //add transition
	}

	function initAutomaton(parsedGrammar) {
		auto = { //create automaton object
			Alphabet: [],
			States: []
		};
		auto.Alphabet = parsedGrammar.terminals; //alphabet is created from the grammars terminals
		
		createState(parsedGrammar.s+"-s", true, false); //create start state
		createState(parsedGrammar.s+"-e", false, true); //create final state
		
		createStateStructure(0);
		
		createTransitions();
		//console.log(idNameTable);

	}

	function createStateStructure(bnfRow) {
//rhs.length durchlaufen [i]
//rhs[i][0].length durchlaufen
//rhs[i][0][j]
		
		for (var i = 0; i < parsedGrammar.bnf[bnfRow].rhs.length; i++) {
			for (var j = 0; j < parsedGrammar.bnf[bnfRow].rhs[i][0].length; j++) {
				var symbol = parsedGrammar.bnf[bnfRow].rhs[i][0][j];
				
				if(bnfRow == 0 && j == (parsedGrammar.bnf[bnfRow].rhs[i][0].length - 1)) {
					//first row and last right hand side symbol
					if(symbol.type == "t") { //terminal
						//createState(symbol.name, false, true); //create final state
					} else { //nonterminal
						createState(symbol.name+"-s", false, false); //create 2 states (begin and end)
						var row = 0;
						while(symbol.name != parsedGrammar.bnf[row].name) { //get matching row in grammar
							row++;
						}
						createStateStructure(row);
						createState(symbol.name+"-e", false, true);
					}
				} else {
					if(symbol.type == "t") { //terminal
						//createState(symbol.name, false, false); //create new State
					} else { //nonterminal
						createState(symbol.name+"-s", false, false); //create 2 states (begin and end)
						var row = 0;
						while(symbol.name != parsedGrammar.bnf[row].name) { //get matching row in grammar
							row++;
						}
						createStateStructure(row);
						createState(symbol.name+"-e", false, false);
					}
				}
				
			}
		}
	}

	function createTransitions() {
		for(var bnfRow = 0; bnfRow < parsedGrammar.bnf.length; bnfRow++){
			for (var i = 0; i < parsedGrammar.bnf[bnfRow].rhs.length; i++) {
				
				if(parsedGrammar.bnf[bnfRow].rhs[i][0].length == 0) { //EPSILON symbol
						var id = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-s"); //lhs symbol start
						var targetId = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-e"); //lhs symbol end
						addTransition(id, targetId, EPSILON);
				}

				for (var j = 0; j < parsedGrammar.bnf[bnfRow].rhs[i][0].length; j++) {
					var symbol = parsedGrammar.bnf[bnfRow].rhs[i][0][j];


					if(j == 0 && j == parsedGrammar.bnf[bnfRow].rhs[i][0].length - 1) { //erstes UND letztes Element
						if (symbol.type == "nt") { //nonterminal
							var id = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-s"); //lhs symbol
							var targetId = getIDfromName(symbol.name+"-s"); //symbol selbst
							addTransition(id, targetId, EPSILON);

							var id = getIDfromName(symbol.name+"-e"); //end of symbol
							var targetId = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-e"); //lhs symbol end
							addTransition(id, targetId, EPSILON);
						} else { //terminal
							createState("terminal", false, false); //create new state for terminal

							var id = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-s"); //lhs symbol
							var targetId = auto.States.length; //last added state is target
							addTransition(id, targetId, EPSILON);

							var id = auto.States.length; //last added state is id
							var targetId = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-e"); //lhs symbol end
							addTransition(id, targetId, symbol.name);
						}
					} else { //nicht erstes UND letztes Element
						if(j == 0) { //erstes Symbol
							if (symbol.type == "nt") { //nonterminal
								var id = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-s"); //lhs symbol
								var targetId = getIDfromName(symbol.name+"-s"); //symbol selbst
								addTransition(id, targetId, EPSILON);

							} else { //terminal
								var id = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-s"); //lhs symbol
								createState("terminal", false, false); //create new state for terminal
								var targetId = auto.States.length; //last added state is target
								addTransition(id, targetId, EPSILON);
							}
						}
						else if(j == parsedGrammar.bnf[bnfRow].rhs[i][0].length - 1) { //letztes Symbol
							var previousSymbol = parsedGrammar.bnf[bnfRow].rhs[i][0][j-1]; //vorheriges Symbol
							if (symbol.type == "nt") { //nonterminal
								var id = getIDfromName(symbol.name+"-e"); //end of symbol
								var targetId = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-e"); //lhs symbol end
								addTransition(id, targetId, EPSILON);

								var targetId = getIDfromName(symbol.name+"-s");
								if(previousSymbol.type == "nt") { //vorheriges ist nonterminal
									var id = getIDfromName(previousSymbol.name+"-e");
									addTransition(id, targetId, EPSILON);
								} else { //vorheriges ist terminal
									var id = auto.States.length; //last added state is previous
									addTransition(id, targetId, previousSymbol.name);
								}
								
							} else { //terminal
								createState("terminal", false, false); //create new state for terminal
								var id = auto.States.length; //last added state is id
								var targetId = getIDfromName(parsedGrammar.bnf[bnfRow].name+"-e"); //lhs symbol end
								addTransition(id, targetId, symbol.name);

								var targetId = auto.States.length; //last added state is target id
								if (previousSymbol.type == "nt") { //vorheriges ist nonterminal
									var id = getIDfromName(previousSymbol.name+"-e");
									addTransition(id, targetId, EPSILON);
								} else { //vorheriges ist terminal
									var id = auto.States.length - 1; //last but not least added state is previous
									addTransition(id, targetId, previousSymbol.name);
								}
							}
						}
						else { //"mittleres" Symbol
							var previousSymbol = parsedGrammar.bnf[bnfRow].rhs[i][0][j-1]; //vorheriges Symbol
							if (symbol.type == "nt") { //nonterminal
								var targetId = getIDfromName(symbol.name+"-s");
								if(previousSymbol.type == "nt") { //previous is nonterminal
									var id = getIDfromName(previousSymbol.name+"-e");
									addTransition(id, targetId, EPSILON);
								} else { //previous is terminal
									var id = auto.States.length; //last added state is previous id
									addTransition(id, targetId, previousSymbol.name);
								}
							} else { //terminal
								createState("terminal", false, false); //create new state for terminal
								var targetId = auto.States.length; //current symbol is last added state
								if(previousSymbol.type == "nt") { //previous is nonterminal
									var id = getIDfromName(previousSymbol.name+"-e");
									addTransition(id, targetId, EPSILON);
								} else { //previous is terminal
									var id = auto.States.length - 1; //last but not least added state is previous
									addTransition(id, targetId, previousSymbol.name);
								}
							}
						}
					}
				}
			}
		}
		
	}

	var EPSILON = "";

	var idNameTable = []; //lookup table for id->name
	idNameTable[0] = 0; //offsets everything by one (ids start at one)



	console.log("convertRegexGrammar2NEA called.");
	console.log(grammar);
	var parsedGrammar = parseBNF(grammar);
	console.log(parsedGrammar);
	var auto;
	initAutomaton(parsedGrammar);
	console.log(auto);
	var output =  { //create outputobject
		result: "OK",
		automaton: {}
	};	
	output.automaton = auto;
	return output;

}