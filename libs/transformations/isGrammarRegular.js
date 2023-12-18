function isGrammarRegular(grammar) {
	
	//helper:
	function isRightRegular() {
		var isRightRegular = true;
		for(var i = 0; i < parsedGrammar.bnf.length; i++) { //run through all rules	
			for (var j = 0; j < parsedGrammar.bnf[i].rhs.length; j++) { //run through all right hand side possibilities
				var possibility = parsedGrammar.bnf[i].rhs[j][0];
				
				if(possibility.length == 2) { 
					var firstSignType = parsedGrammar.bnf[i].rhs[j][0][0].type; //type of first sign
					var secondSignType = parsedGrammar.bnf[i].rhs[j][0][1].type; //type of second sign
					if(firstSignType != "t" && secondSignType != "nt") { //not of form R -> a B
						isRightRegular = false;
						reconstructInvalidProduction(i, j); //construct output error message
						return isRightRegular;
					}
				} else if(possibility.length == 1) {
					var signType = parsedGrammar.bnf[i].rhs[j][0][0].type; //type of sign
					if(signType != "t") { //rhs sign not of valid type
						isRightRegular = false;
						reconstructInvalidProduction(i, j); //construct output error message
						return isRightRegular;
					}
				}
			}
		}
		return isRightRegular;
	}

	function isLeftRegular() {
		var isLeftRegular = true;
		for(var i = 0; i < parsedGrammar.bnf.length; i++) { //run through all rules	
			for (var j = 0; j < parsedGrammar.bnf[i].rhs.length; j++) { //run through all right hand side possibilities
				var possibility = parsedGrammar.bnf[i].rhs[j][0];
				
				if(possibility.length == 2) { 
					var firstSignType = parsedGrammar.bnf[i].rhs[j][0][0].type; //type of first sign
					var secondSignType = parsedGrammar.bnf[i].rhs[j][0][1].type; //type of second sign
					if(firstSignType != "nt" && secondSignType != "t") { //not of form R -> a B
						isLeftRegular = false;
						reconstructInvalidProduction(i, j); //construct output error message
						return isLeftRegular;
					}
				} else if(possibility.length == 1) {
					var signType = parsedGrammar.bnf[i].rhs[j][0][0].type; //type of sign
					if(signType != "t") { //rhs sign not of valid type
						isLeftRegular = false;
						reconstructInvalidProduction(i, j); //construct output error message
						return isLeftRegular;
					}
				}
			}
		}
		return isLeftRegular;
	}

	function reconstructInvalidProduction(lhs, pos) { //reconstructs grammatical rule as string from object
		failedProduction = parsedGrammar.bnf[lhs].name; //left hand side
		failedProduction += " ->"; 
		for(var i = 0; i < parsedGrammar.bnf[lhs].rhs[pos][0].length; i++) {
			failedProduction += " " + parsedGrammar.bnf[lhs].rhs[pos][0][i].name; //appends the sings on the right hand side
		}
	}

	//the real execution:
	var output = {}; //create output object
	output.result = "OK";

	var parsedGrammar = parseBNF(grammar); //parse grammar first
	var failedProduction; //saves the production which keeps the grammar from being regular 
	var leftlinearCount = 0;
	var rightlinearCount = 0;

	for(var i = 0; i < parsedGrammar.bnf.length; i++) { //run through all rules	
		for (var j = 0; j < parsedGrammar.bnf[i].rhs.length; j++) { //run through all right hand side possibilities
			var possibility = parsedGrammar.bnf[i].rhs[j][0];
			if(possibility.length == 2) { 
				var firstSignType = parsedGrammar.bnf[i].rhs[j][0][0].type; //type of first sign
				var secondSignType = parsedGrammar.bnf[i].rhs[j][0][1].type; //type of second sign
				if(firstSignType == "t" && secondSignType == "nt") { //form R -> a B
					rightlinearCount++; //one more rightlinear rule
				} else if(firstSignType == "nt" && secondSignType == "t") { //form R -> B a
					leftlinearCount++; //one more leftlinear rule
				} else {
					reconstructInvalidProduction(i, j); //construct error ouput message
					output.result = "FAILED";
					output.reason = failedProduction;
					return output;
				}
			} else if(possibility.length != 1 && possibility.length != 0) { //rule length does not match
				reconstructInvalidProduction(i, j); //construct error ouput message
				output.result = "FAILED";
				output.reason = failedProduction;
				return output;
			}
		}
	}

	if(rightlinearCount >= leftlinearCount) { //supposedly a rightregular grammar
		if(isRightRegular()) {
			output.right = true;
		} else {
			output.result = "FAILED";
			output.reason = failedProduction;
		}
	} else { //supposedly a leftregular grammar
		if(isLeftRegular()) {
			output.left = true;
		} else {
			output.result = "FAILED";
			output.reason = failedProduction;
		}
	}
	return output;
}