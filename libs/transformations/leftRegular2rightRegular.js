//converts a left regular grammar to a right regular grammar
function leftRegular2rightRegular(grammar) {
	
	// helper:
	function isStartSymbolInRHS() {
		for(var i = 0; i < parsedGrammar.bnf.length; i++) { //run through all rules	
			for (var j = 0; j < parsedGrammar.bnf[i].rhs.length; j++) { //run through all right hand side possibilities
				var possibility = parsedGrammar.bnf[i].rhs[j][0];
				for(var k = 0; k < parsedGrammar.bnf[i].rhs[j][0].length; k++) { //run through all signs
					var rhsSign = parsedGrammar.bnf[i].rhs[j][0][k].name;
					if(rhsSign == originalStartSymbol) { //there is a production which has the Startsymbol on the righthand side
						return true;
					}
				}
			}
		}
		return false;
	}

	function convertRules() {
		for(var i = 0; i < parsedGrammar.bnf.length; i++) { //run through all rules	
			for (var j = 0; j < parsedGrammar.bnf[i].rhs.length; j++) { //run through all right hand side possibilities
				var possibility = parsedGrammar.bnf[i].rhs[j][0];
				var lhs = parsedGrammar.bnf[i].name; 
				if(lhs == startSymbol) { //left hand side is start symbol
					if(possibility.length == 2) { //form S -> A a
						var rule = {}; //create rule A -> a
						rule.lhs = parsedGrammar.bnf[i].rhs[j][0][0].name; //1st sign on rhs
						rule.rhs = parsedGrammar.bnf[i].rhs[j][0][1].name; //2nd sign on rhs
						newGrammar.push(rule); 
					} else if (possibility.length == 1) {
						var rhsSign = parsedGrammar.bnf[i].rhs[j][0][0]; //sign on rhs
						if(rhsSign.type == "t") { //form S -> a 
							var rule = {}; //create rule S -> a
							rule.lhs = lhs;
							rule.rhs = rhsSign.name;
							newGrammar.unshift(rule); //add to beginning of new grammar
						} else { //form S -> A
							var rule = {}; //create rule A -> epsilon
							rule.lhs = rhsSign.name;
							rule.rhs = "EPSILON";
							newGrammar.push(rule);
						}
					} else { //form S -> EPSILON
						var rule = {}; //create rule S -> epsilon
						rule.lhs = lhs;
						rule.rhs = "EPSILON";
						newGrammar.unshift(rule); //add to beginning of new grammar 
					}
				} else { //left hand side is any nonterminal but the start symbol
					if(possibility.length == 2) { //form A -> B a
						var rule = {}; //create rule B -> a A
						rule.lhs = parsedGrammar.bnf[i].rhs[j][0][0].name; //1st sign on rhs
						rule.rhs = parsedGrammar.bnf[i].rhs[j][0][1].name + " " + lhs; //2nd sign on rhs and lhs terminal
						newGrammar.push(rule);
					} else if (possibility.length == 1) {
						var rhsSign = parsedGrammar.bnf[i].rhs[j][0][0];
						if(rhsSign.type == "t") { //form A -> a
							var rule = {}; //create rule S -> a A
							rule.lhs = startSymbol;
							rule.rhs = rhsSign.name + " " + lhs; //sign on rhs and lhs terminal
							newGrammar.unshift(rule); //add to beginning of new grammar
						} else { //form A -> B
							var rule = {}; //create rule B -> A
							rule.lhs = rhsSign.name;
							rule.rhs = lhs;
							newGrammar.push(rule); 
						}
					} else { //form A -> EPSILON
						var rule = {}; //create rule S -> A
						rule.lhs = startSymbol;
						rule.rhs = lhs;
						newGrammar.unshift(rule); //add to beginning of new grammar
					}			
				}
			}
		}
	}

	function constructText() {
		var textualGrammar = "";
		for(var i = 0; i < newGrammar.length; i++) {
			textualGrammar += newGrammar[i].lhs;
			textualGrammar += " -> "
			textualGrammar += newGrammar[i].rhs;
			textualGrammar += "\n";
		}
		return textualGrammar;
	}


	// the real execution:
	var parsedGrammar = parseBNF(grammar); //parse grammar first
	var originalStartSymbol = parsedGrammar.s; //backup the original start symbol of the grammar
	var startSymbol; //saves the startsymbol of the new grammar
	var newGrammar = []; //saves the new grammar
	var output = {}; //create output object
	
	if(isStartSymbolInRHS()) { //incase the start symbol is part of a production
		startSymbol = "$"; //create a new, different start symbol	
		var union = parsedGrammar.terminals.concat(parsedGrammar.nonterminals); //create union of terminals, nonterminals
		//making sure the new start symbol is not used is the old grammar already
		if(union.indexOf(startSymbol) != -1) {
			startSymbol = "#";
			if(union.indexOf(startSymbol) != -1) {
				startSymbol ="§";
				if(union.indexOf(startSymbol) != -1) {
					console.log("new start symbol could not be created")
					output.result = "FAILED";
					output.error = "Special character for new start symbol is already in use.";
					return output;
				}
			}
		}
		var rule = {}; //create a rule: original start symbol -> epsilon
		rule.lhs = originalStartSymbol;
		rule.rhs = "EPSILON";
		newGrammar.push(rule);
	} else { //start symbol can be kept as is
		startSymbol = originalStartSymbol; //default to original symbol
	}

	convertRules(); //do actual left to right conversion of rules
	var textGrammar = constructText(); //construct textual representation of the new grammar
	output.grammar = textGrammar; 
	output.result = "OK";
	return output;
}