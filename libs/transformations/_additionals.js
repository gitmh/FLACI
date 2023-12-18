var razCheckRunning = false;
var numErrors = 0;

function convertGrammarToReg(grammar){
	var Names = [];
	function LogNT(nt){
		var str = nt.Name + " -> ";
		var sep = "";
		for (var i = 0; i < nt.EvalTo.length; i++){
			str += sep;
			sep = " | ";
			var subsep = "";
			for (var j = 0; j < nt.EvalTo[i].Seq.length; j++){
				str += subsep + nt.EvalTo[i].Seq[j].Name;
				subsep = " ";
			}
			if (subsep === "")
				str += "EPSILON";
		}
		console.log(str);
	}
	function MakeRegular(lbnf, nt, stack){
		if (nt.IsRegular == true) return true; // only once
		if (stack == undefined) stack = []; // initialize stack
		if (stack.find((stackItem)=>stackItem === nt) != undefined)
			return false; // recursion/chain not supported
		stack.push(nt);
		var num = 0;
		for (var i = 0; i < nt.EvalTo.length; i++){ // iterate rules (NN or T or ɛ or TN)
			if (nt.EvalTo[i].Seq.length < 2) continue; // T or ɛ
			var fNT = nt.EvalTo[i].Seq[0]; // first of NN/TN
			var sNT = nt.EvalTo[i].Seq[1]; // second of NN/TN
			if (fNT.EvalTo == undefined) continue; // // TN
			if (!MakeRegular(lbnf, fNT, stack)) return false; // Make it regular
			nt.EvalTo.splice(i,1); // remove the old NN rule
			i--; // check current index again in next loop
			for (var j = 0; j < fNT.EvalTo.length; j++){ // iterate regular rules of fNT (TN or T or ɛ only)
				// create new rules, to be checked later
				if (fNT.EvalTo[j].Seq.length == 0) // fNT can be EPSILON
					nt.EvalTo = nt.EvalTo.concat(sNT.EvalTo); // append the CNF rules of sNT
				else if (fNT.EvalTo[j].Seq.length == 1) // fNT can be a terminal
					nt.EvalTo.push({Seq:fNT.EvalTo[j].Seq.concat([sNT]), Code:""}); // TN result
				else{ // TNN result
					num++;
					var newname = nt.Name+"."+num;
					while(Names.indexOf(newname) != -1){
						num++;
						newname = nt.Name+"."+num;
					}
					Names.push(newname); // new NT -> NN
					var newNT = {Name:newname, EvalTo:[{Seq:[fNT.EvalTo[j].Seq[1],sNT], Code:""}], UsedBy:[]};
					lbnf.NonTerminals.push(newNT);
					LogNT(newNT);
					nt.EvalTo.push({Seq:[fNT.EvalTo[j].Seq[0],newNT], Code:""}); // new rule TN
				}
			}
		}
		stack.pop();
		nt.IsRegular = true; // remember solved state
		return true;
	}
	function MakeRegular2(lbnf, nt, stack, prev, next){
		if (stack.find((stackItem)=>stackItem === nt) != undefined && prev && next)
			return false; // recursion/chain not supported
		if (nt.IsRegular == true) return true; // only once
		stack.push(nt);
		var num = 0;
		for (var i = 0; i < nt.EvalTo.length; i++){ // iterate rules (NN or N or T or ɛ or TN)
			if (nt.EvalTo[i].Seq.length < 2){ // N or T or ɛ
				if (nt.EvalTo[i].Seq.length == 1 && nt.EvalTo[i].Seq[0].EvalTo != undefined)
					if (!MakeRegular2(lbnf,nt.EvalTo[i].Seq[0],stack, prev, next)) return false;
				continue; 
			}
			var fNT = nt.EvalTo[i].Seq[0]; // first of NN/TN
			var sNT = nt.EvalTo[i].Seq[1]; // second of NN/TN
			if (fNT.EvalTo == undefined) continue; // // TN
			if (!MakeRegular2(lbnf, fNT, stack, prev, true)) return false; // Make it regular
			nt.EvalTo.splice(i,1); // remove the old NN rule
			i--; // check current index again in next loop
			for (var j = 0; j < fNT.EvalTo.length; j++){ // iterate regular rules of fNT (TN or T or ɛ only)
				// create new rules, to be checked later
				if (fNT.EvalTo[j].Seq.length == 0) // fNT can be EPSILON
					nt.EvalTo = nt.EvalTo.concat(sNT.EvalTo); // append the CNF rules of sNT
				else if (fNT.EvalTo[j].Seq.length == 1) // fNT can be a terminal
					nt.EvalTo.push({Seq:fNT.EvalTo[j].Seq.concat([sNT]), Code:""}); // TN result
				else{ // TNN result
					num++;
					var newname = nt.Name+"."+num;
					while(Names.indexOf(newname) != -1){
						num++;
						newname = nt.Name+"."+num;
					}
					Names.push(newname); // new NT -> NN
					var newNT = {Name:newname, EvalTo:[{Seq:[fNT.EvalTo[j].Seq[1],sNT], Code:""}], UsedBy:[]};
					lbnf.NonTerminals.push(newNT);
					nt.EvalTo.push({Seq:[fNT.EvalTo[j].Seq[0],newNT], Code:""}); // new rule TN
					if (!MakeRegular2(lbnf, newNT, stack, true, next)) return false; // Make it regular
				}
			}
		}
		nt.IsRegular = true; // remember solved state
		for (var i = 0; i < nt.EvalTo.length; i++){ // iterate rules (NN or T or ɛ or TN)
			if (nt.EvalTo[i].Seq.length < 2) continue; // N or T or ɛ
			if (!MakeRegular2(lbnf, nt.EvalTo[i].Seq[1], stack, true, next)) return false; // Make follower regular
		}
		stack.pop();
		return true;
	}
	//var res = removeLeftRecursionGrammar(grammar); // No left recursion
	//if (res.result == "FAILED") return res;
	var res = convertGrammarToCNF(grammar); // CNF!
	if (res.result == "FAILED") return res;
	var bnf = parseBNF(res.grammar); // Parse to BNF
	var linked = linkBNF(bnf); // Link BNF
	// Initialize Names-Array with all existing names of terminals and nonterminals
	Names = linked.NonTerminals.map(n=>n.Name).concat(linked.Terminals.map(n=>n.Name));
	// Make rules of all nonterminals regular
	for (var i = 0; i < linked.NonTerminals.length; i++){
		if (!MakeRegular(linked, linked.NonTerminals[i]))
			return {"result":"FAILED", "error":"Recursion detected!"};
		if (i > 100)
			return {"result":"FAILED", "error":"Probably endless loop!"};
	}
/*	if (!MakeRegular2(linked, linked.Start, [], false, false)) // empty stack and without rest
		return {"result":"FAILED", "error":"Recursion detected!"};*/
	bnf = unlinkBNF(linked);
	cleanupGrammar.RemoveEqualNT(bnf);
	return {"result":"OK", "grammar":BNF2Text(unlinkBNF(linkBNF(bnf)))};
}
function startCheck(){
	var checks = []; // The checks
	var countWords = 100; // count of different words checked with each grammar
	var maxWord = 6; // maximum length of a word
	for (var i = 0; i < GrammarCheck.length; i++)
		checks.push(getCheckObject(GrammarCheck[i], countWords, maxWord));
	setTimeout(doCheck, 0, checks);
}
var GrammarCheck = [
	{grammar: "N0 -> N1 b, N1 -> a | a N1, N1 -> N0 | N1 | EPSILON"},
	{grammar: "A -> c B, B -> a C | EPSILON, C -> a"},
	{grammar: "S -> A A, A -> a | EPSILON | S"},
	{grammar: "S -> ( E ) | Zahl, E -> S T, T -> + S | EPSILON, Zahl -> Ziffer Weitere, Weitere -> Ziffer Weitere | EPSILON, Ziffer -> 1"},
	{grammar: "A -> a A | D, D -> E, E -> a b"},
	{grammar: "S -> A b | b, A -> B | C, B -> b, C -> c"},
	{grammar: "E -> E + T | T, T -> T * F | F, F -> ( E ) | a "},
	{grammar: "E -> T X, X -> + T X | EPSILON, T -> F Y, Y -> * F Y | EPSILON, F -> ( E ) | a"},
	{grammar: "X -> a B, B -> c B | K, K -> a | EPSILON"},
	{grammar: "S -> X | a, X -> B | ax, B -> A S | C X, A -> a, C -> ax | aax"},
	{grammar: "S -> x | ( S R, R -> ) | _ S R"},
	{grammar: "S -> A, S -> S - A, A -> a, A -> b, A -> c"},
	{grammar: "A -> A + A | A - A | a"},
	{grammar: "S -> a S S | EPSILON"},
	{grammar: "S  -> 0 | X0 X1 | Z2 Z1, Z2 -> Z1 S, Z1 -> X0 X1, X0 -> 0, X1 -> 1"},
	{grammar: "Programm -> Anweisungen, Anweisungen -> Anweisung Anweisungen | EPSILON, Anweisung -> WH Zahl [ Anweisungen ] | RE Zahl | VW Zahl, Zahl -> Ziffer Zahl2, Zahl2 -> Ziffer Zahl2 | EPSILON, Ziffer -> 1"},
	{grammar: "S -> E E a, E -> EPSILON"},
	{grammar: "S -> A | B | C, A -> a, B -> S b, C -> x c"},
	{grammar: "S -> A B c d, A -> a | B, B -> b | EPSILON"},
	{grammar: "E  -> T E', E' -> + T E' | EPSILON, T  -> F T', T' -> * F T' | EPSILON, F  -> ( E ) | id"},
	{grammar: "S -> t S S2 | s, S2 -> e S | EPSILON",
		samples: ["tttses"]},
	{grammar: "S -> if a then S2 | s, S2 -> S else S | S",
		samples: ["if a then if a then s else s"]},
	{grammar: "S -> ( S ) | aa | a | S O S, O -> * | +"},
	{grammar: "S -> if E then S | if E then S else S, E -> a, S -> s"},
	{grammar: "S -> S1, S1 -> if E then S2, S2 -> S else S | S, E -> a, S -> s"},
	{grammar: "S ->  a A b | B | e, A -> A S | S, B -> d S w e"},
	{grammar: "S -> S a S | S b S | a | b"},
	{grammar: "S -> S S |a "},
	{grammar: "S -> K | E, E -> a, K -> K b K | EPSILON"},
	{grammar: "X -> S, S -> A bbb, A -> a | bb"},
	{grammar: "S ->  A a, A -> B b, B -> c | b"},
	{grammar: "a -> Number a | Identifer a | EPSILON, Number -> Digit Number | Digit, Digit -> 1, Identifer -> Char Identifer | Char, Char -> a | _"},
	{grammar: "S -> A a B | B b C, A -> C a B | a, B -> A bc | b, C -> c | S"},
	{grammar: "S -> a S a | b S b | EPSILON"},
	{grammar: "S -> hallo | Identifer, Identifer -> Char Identifer | Char, Char -> a | _"},
	{grammar: "E -> T | E + T, T -> F | T * F, F -> x | EPSILON"},
	{grammar: "S -> 0 | A A, A -> 1 | S S"},
	{grammar: "S -> a a"},
	{grammar: "Zuweisung -> Variable Zuweisungsoperator Zahl, Variable -> Buchstabe | Buchstabe Variable, Zahl -> Ziffer | Ziffer Zahl, Buchstabe -> a, Ziffer -> 9, Zuweisungsoperator -> := "},
	{grammar: "S -> a S a | EPSILON"},
	{grammar: "Input -> Expression | Input Expression, Expression -> Expression * Expression | Expression + Expression | Expression - Expression | Expression / Expression | Number, Number -> Digit | Number Digit, Digit -> 1"},
	{grammar: "S -> a S | A | C, A -> D, B -> a a, C -> a C B, D -> a"},
	{grammar: "S -> a Y b | a a X | a b | c C, C -> Y b b | X | EPSILON, X -> a Z b | a | b | X X, Y -> S | EPSILON, Z -> a Z Z b | a Z b"},
	{grammar: "N0 -> N1 b, N1 -> a | a N1"}
];
function getCheckObject(grammarObject, countWords, maxWord){
	var one = grammarObject.grammar.replace(/\n/g, ", ");
	var g = one.replace(/, /g, "\n");
	var b = parseBNF(g);
	return {
		oneline: one,
		bnf: b,
		gBase: g,
		gEps: removeEpsilonGrammar(g).grammar,
		gMin: cleanupGrammar(g).grammar,
		gCNF: convertGrammarToCNF(g).grammar,
		gLeft: removeLeftRecursionGrammar(g).grammar,
		gChains: removeChainsGrammar(g).grammar,
		gFactor: leftFactorGrammar(g).grammar,
		words: getCheckWords(b, grammarObject.samples, countWords, maxWord)
	};
}
function getCheckWords(bnf, samples, cntWord, maxWord){
	var result = [];
	for (var c = 0; c < cntWord; c++){ // generate words
		var word = "";
		if (c > 0){ // first word is always the empty word, otherwise:
			if (samples != undefined && samples.length >= c)
				word = samples[c-1]; // if there are fixed samples, do them first
			else{ // otherwise >> generate
				var cnt = Math.floor(Math.random()*maxWord); // maximum 6 terminals
				for(var i = 0; i < cnt; i++) // generate a random word
					word += bnf.terminals[Math.floor(Math.random()*bnf.terminals.length)];
			}
		}
		result.push(word);
	}
	return result;
}
function doCheck(checks){
	if (checks.length == 0){
		console.log("Check finished: " + numErrors + " Errors");
		if (razCheckRunning)
			setTimeout(startCheck, 0);
		return;
	}
	var c = checks[checks.length-1];
	if (c.words.length == 0){
		var lastGrammar = checks.pop();
		var d = new Date();
//		console.log(d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
//					+ " [" + lastGrammar.bnf.nonterminals.length+ "][" + lastGrammar.bnf.terminals.length + "] Finished: " + lastGrammar.oneline);
		if (razCheckRunning)
			setTimeout(doCheck, 0, checks);
		return;
	}
	var word = c.words.pop();
	var log = false;
	try
	{
		var rNormal = isWord3(c.gBase, word);
		var rEPS = isWord3(c.gEps, word);
		var rMIN = isWord3(c.gMin, word);
		var rCNF = isWord3(c.gCNF, word);
		var rLeft = isWord3(c.gLeft, word);
		var rChains = isWord3(c.gChains, word);
		var rFactor = isWord3(c.gFactor, word);
		if (rNormal != rEPS || rNormal != rMIN || rNormal != rCNF || rNormal != rLeft || rNormal != rChains  || rNormal != rFactor){
			console.log("ERROR!!! Grammar: " + c.oneline + " >> Word: " + word + " >>  Normal:" + rNormal + " Eps:"+rEPS + " Min:"+rMIN + " CNF:"+ rCNF + " Left:"+ rLeft + " Chain:"+ rChains + " Factor:"+ rFactor);
			numErrors++;
		}
	}
	catch(err){
		console.log("CATCH:" + err +" Grammar: " + c.oneline + " >> Word: " + word + " >>  Normal:" + rNormal + " Eps:"+rEPS + " Min:"+rMIN + " CNF:"+ rCNF + " Left:"+ rLeft + " Chain:"+ rChains + " Factor:"+ rFactor);
		numErrors++;
	}
	if (razCheckRunning)
		setTimeout(doCheck, 0, checks);
}
function isWord(grammar, word){
	function AppendSequence(allSeq, curSeq, w){
		var z = "";
		for (var i = 0; i < w.length; i++){
			z += w[i];
			var idx = bnf.terminals.indexOf(z);
			if (idx != -1){
				var seq = curSeq + z + " ";
				if (i+1 == w.length)
					allSeq.push(seq);
				else
					AppendSequence(allSeq, seq, w.substr(i+1));
			}
		}
	}
	var Checked = {};
	function ReduceToStart(seq){
		if (Checked[seq] != undefined) return false;
		//console.log(seq);
		Checked[seq] = true;
		if (seq.trim() == bnf.s) return true;
		for (var i = 0; i < Rules.length; i++){
			var r = Rules[i];
			var index = seq.indexOf(r.To);
			while(index != -1){
				var str = seq.substr(0,index) + " " + r.From + " " + seq.substr(index+r.To.length);
				if (ReduceToStart(str))
					return true;
				index = seq.indexOf(r.To, index+r.To.length-1);
			}
		}
	}
	var res = removeEpsilonGrammar(grammar);
	var bnf = parseBNF(res.grammar);
	if (word == "") // Empty word -> return true if allowed otherwise false
		return bnf.bnf[0].rhs.findIndex((r)=>r[0].length == 0) != -1;
	// Remove the EPSILON replacement if there is any
	for (var i = 0; i < bnf.bnf.length; i++){
		for (var j = bnf.bnf[i].rhs.length-1; j >= 0 ; j--){
			if (bnf.bnf[i].rhs[j][0].length == 0)
				bnf.bnf[i].rhs.splice(j,1);
		}
	}
	var Rules = []; // Summarize Rules
	for (var i = 0; i < bnf.bnf.length; i++){
		for (var j = 0; j < bnf.bnf[i].rhs.length; j++){
			Rules.push({From:bnf.bnf[i].name, To: bnf.bnf[i].rhs[j][0].reduce((p,c)=>p + c.name + " "," ")});
		}
	}
	var Sequences = []; // Summarize possible terminal-sequences
	AppendSequence(Sequences, " ", word);
	// Check whether one of them can be reduced to start
	for (var i = 0; i < Sequences.length; i++){
		var seq = Sequences[i];
		if (ReduceToStart(seq, Rules))
			return true;
	}
	return false;
}
function isWord2(grammar, word){
	function AppendSequence(allSeq, curSeq, w){
		var z = "";
		for (var i = 0; i < w.length; i++){
			z += w[i];
			var idx = bnf.terminals.indexOf(z);
			if (idx != -1){
				var seq = curSeq + z + " ";
				if (i+1 == w.length)
					allSeq.push(seq.trim());
				else
					AppendSequence(allSeq, seq, w.substr(i+1));
			}
		}
	}
	function Check(w, seq){
		// Terminals left but no replacement sequence
		if (w.trim().length > 0 && seq.length == 0) return false; // fail
		if (w.trim().length == 0){ // no terminals left
			if (seq.length == 0) return true; // no replacements (epsilon) >> success
			for (var i = 0; i < seq.length; i++){ // interate remaining bnf items
				if (seq[i].EvalTo == undefined || !seq[i].canEps) // if there is a terminal or NT that cannot be epsilon
					return false; // fail
			}
			return true; // there are indirect epsilon replacements >> success
		}
		return undefined;
	}
	function AppendSubOptions(t, rest, curOption, newOptions, stack){
		var seq = curOption.s; // remaining BNF sequence
		if (stack == undefined) stack = [];
		if (stack.indexOf(seq[0]) != -1){
			newOptions.push(curOption);
			return; // self-recursion only once
		}
		stack.push(seq[0]);
		for (var j = 0; j < seq[0].EvalTo.length; j++){ // iterate replacements of first NT
			if (seq[0].EvalTo[j].Seq.length == 0){ // first can be epsilon
				// leave word, ignore this sequence item
				newOptions.push({w:t+" "+rest, s:[].concat(seq.slice(1)), prev:curOption});
			}
			else if (seq[0].EvalTo[j].Seq[0].Name == t){ // first is current terminal
				// remaining word, concat remaining sequence with parent remaining sequence
				newOptions.push({w:rest, s:[].concat(seq[0].EvalTo[j].Seq.slice(1)).concat(seq.slice(1)), prev:curOption});
			}
			else if (seq[0].EvalTo[j].Seq[0].EvalTo != undefined){ // first is a nonterminal
				var interimOption = {w:t+" "+rest, s:[].concat(seq[0].EvalTo[j].Seq).concat(seq.slice(1)), prev:curOption};
				AppendSubOptions(t, rest, interimOption, newOptions, stack);
			}
		}
		stack.pop();
	}
	function Reduce(curOption, newOptions){
		var w = curOption.w; // remaining word
		var seq = curOption.s; // remaining BNF sequence
		var res = Check(w, seq); // finished?
		if (res == undefined){ // if not >> generate new options
			var arr = w.split(" ");
			var t = arr[0]; // take first terminal
			var rest = arr.slice(1).join(" ");
			if (seq.length > 0){ // epsilon is not an option
				if (seq[0].Name == t){ // sequence starts with current terminal
					// continue with remaining word and remaining BNF sequence
					newOptions.push({w:rest, s:[].concat(seq.slice(1)), prev:curOption});
				}
				else if (seq[0].EvalTo != undefined){ // sequence starts with NT
					AppendSubOptions(t, rest, curOption, newOptions); // Append further options
				}
			}
		}
		return res;
	}
	var bnf = parseBNF(grammar);
	var lbnf = linkBNF(bnf);
	appendFirstFollowLBNF(lbnf);
	var Sequences = []; // Summarize possible terminal-sequences
	AppendSequence(Sequences, "", word);
	var result = [];
	// Check whether one of them can be reduced to start
	var success = 0;
	var failed = 0;
	for (var i = 0; i < Sequences.length; i++){
		var seq = Sequences[i];
		// At begin only 1 option: seq must match start symbol
		var options = [{w:seq, s:[lbnf.Start], prev:undefined}];
		while (options.length > 0){ // as long as there are unchecked options
			var newOptions = []; // new Options created during this iteration
			for (var j = 0; j < options.length; j++){
				var res = Reduce(options[j], newOptions);
				if (res == true) { success++; result.push(options[j]);}
				if (res == false) failed++;
			}
			options = newOptions;
		}
	}
	return result.length > 0;
}
function isWord3(grammar, word){
	var bnf = parseBNF(grammar);
	var tokenlist = word.split("");
	var e = new Earley2(bnf, tokenlist);
	var success = e.parse();
	if (!success) return false;
	return true;
}

