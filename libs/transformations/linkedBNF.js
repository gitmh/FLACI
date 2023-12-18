// Creates a data structure of mutual referencing terminals and nonterminals (never try to stringify!)
function linkBNF(BNF, keepUnused){
	// 	Each terminal and nonterminal is a BNFItem:
	// 	{ 
	//		Name: "name",	// Nonterminal-descriptor or terminal-text
	//		UsedBy: [		// BNFItems using this item in at least one of their rules
	//					{BNFItem},
	//					{BNFItem},
	//					...
	//				],
	//		EvalTo: [		// Array of replacement rules for this BNFItem (undefined for terminals)
	//					{
	//						Seq: [{BNFItem},...], // Sequqence of BNFItems able to replace this BNFItem (empty for EPSILON)
	//						Code: "the code being delivered with every rule"
	//						first:	[		// !!!OPTIONAL: first-set of this sequence
	//									{BNFItem},... 	// containing terminal BNFItems only
	//									{Name:"ɛ"},...	// special BNFItem representing EPSILON
	//								]
	//					}
	//				],
	//		first:	[		// !!!OPTIONAL: first-set of this BNFItem
	//					{BNFItem},... 	// containing terminal BNFItems only
	//					{Name:"ɛ"},...	// special BNFItem representing EPSILON
	//				]
	//		follow:	[		// !!!OPTIONAL: follow-set of this BNFItem
	//					{BNFItem},... 	// containing terminal BNFItems only
	//					{Name:"$"},...	// special BNFItem representing end of input
	//				],
	//		F1: true/false	// !!!OPTIONAL: LL1 requirement 1 fulfilled?
	//		F2: true/false	// !!!OPTIONAL: LL1 requirement 2 fulfilled?
	//	}
	// 	The linkedBNF-object:
	//	{
	//		Start: BNFItem, // always the start symbol with its underlying recursive relation
	//		NonTerminals: [BNFItem, ...], // All the nonterminals plain (including start)
	//		Terminals: [BNFItem, ...], // All the terminals plain
	//		Lex: {} 		// The Lex object contained in each BNF
	//	}
	function AppendBNF(lbnf, curNT, pr){ // Append rules of the current nonterminal to linkedBNF
		// Find all lines with curNT on the left
		var rules = pr.bnf.filter((b)=> b.name == curNT.Name);
		rules.forEach((r)=> { // for each line (probably just one)
			r.rhs.forEach((s)=>{ // and their | separated expressions
				var set ={Seq: [], Code: s[1]}; // create a new EvalSet (and keep code)
				curNT.EvalTo.push(set); // where curNT can be replaced by
				s[0].forEach((i)=>{ // iterate the expression parts
					var flatArray = i.type == "nt" ? lbnf.NonTerminals : lbnf.Terminals;
					var item = flatArray.find((bnfitem)=>bnfitem.Name == i.name); // already contained?
					var create = (item == undefined);
					if (create){ // if not, create BNFItem
						if (i.type == "nt") // a nonterminal
							item = {Name: i.name, UsedBy: [], EvalTo: []}; // with EvalTo
						else  // a terminal
							item = {Name: i.name, UsedBy: [], EvalTo: undefined}; // without EvalTo
						flatArray.push(item); // append to flat Array
					}
					if (item.UsedBy.find((uItem)=>uItem === curNT) == undefined) // curNT not used already?
						item.UsedBy.push(curNT); // append it
					set.Seq.push(item); // extend current set by this BNFItem
					if (i.type == "nt" && create) // Nonterminals being just created
						AppendBNF(lbnf, item, pr); // are checked recursively
				});
			});
		});
	}
	function OrderByBNF(lbnf, bnf){
		var resNT = [];
		for (var i = 0; i < bnf.bnf.length; i++){
			var nt = lbnf.NonTerminals.find((n)=>n.Name == bnf.bnf[i].name);
			if (nt != undefined)
				resNT.push(nt);
		}
		lbnf.NonTerminals = resNT;
	}
	var result = {Start: {Name: BNF.s, UsedBy: [], EvalTo: []}, NonTerminals: [], Terminals: [], Lex: BNF.lex }; // Begin with the start symbol
	result.NonTerminals.push(result.Start); // Append it as the first nonterminal
	AppendBNF(result, result.Start, BNF); // Append all other
	if (keepUnused == true){ // keep unreachable NT and their rules?
		for (var i = 0; i < BNF.bnf.length; i++){ // iterate ALL source nt
			var nt = result.NonTerminals.find((n)=>n.Name == BNF.bnf[i].name);
			if (nt == undefined){ // NT not used currently
				var subNT = {Name: BNF.bnf[i].name, UsedBy: [], EvalTo: []}; // create it
				result.NonTerminals.push(subNT); // append it
				AppendBNF(result, subNT, BNF); // Append all used in rules
			}
		}
	}
	OrderByBNF(result, BNF);
	return result; // return the linked BNF
}
// Unlinks a linked BNF to normal BNF
function unlinkBNF(linkedBNF, withFirstAndFollow){
	function GetBNF(nt){ // get bnf object for a non terminal
		var bnf = {name: nt.Name, rhs: []} // with name and its rules
		for(var i = 0; i < nt.EvalTo.length; i++){ // for each replacement expression
			var r = [[],nt.EvalTo[i].Code]; // create a new EPSILON rule (keep code)
			for(var j = 0; j < nt.EvalTo[i].Seq.length; j++){ // for each realexpression item
				r[0].push({ // Append the item
					name: nt.EvalTo[i].Seq[j].Name, // with name
					type: nt.EvalTo[i].Seq[j].EvalTo == undefined ? "t" : "nt" // and type
					});
			}
			if (withFirstAndFollow == true)
				r.push(nt.EvalTo[i].first.map((e)=> e.Name));
			bnf.rhs.push(r); // append the rule
		}
		if (withFirstAndFollow == true){
			bnf.first = nt.first.map((e)=>e.Name);
			bnf.follow = nt.follow.map((e)=>e.Name);
			bnf.F1 = nt.F1;
			bnf.F2 = nt.F2;
		}
		return bnf;
	}
	return { // The BNF result object
		bnf: linkedBNF.NonTerminals.map(GetBNF), // get bnf for every nonterminal
		terminals: linkedBNF.Terminals.map((t)=>t.Name), // get plain terminals
		nonterminals: linkedBNF.NonTerminals.map((t)=>t.Name), // get plain nonterminals
		s: linkedBNF.Start.Name, // the start symbol
		lex: linkedBNF.Lex, // the lex
	};
}
// appends first- and follow-set to BNFItems of linkedBNF
// returns: 0=LL1, 1=LL1-requirement1 failed, 2=LL1-requirement2 failed, 3=both requirements failed
function appendFirstFollowLBNF(lbnf){
	// Helper
	function sortCheckUnique(array){ // sort array in place, remove doubles, return false if any
		function sortItemName(a,b){ // name comparer
			return (a.Name === b.Name) ? 0 : (a.Name < b.Name ? -1 : 1);
		}
		var result = true;
		array.sort(sortItemName); // sort array
		// remove doubles if there are any
		for (var i = array.length-2; i >= 0; i--){
			if (array[i+1] === array[i]){
				array.splice(i+1,1);
				result = false; // remember that there are doubles
			}
		}
		return result;
	}
	function SetCanEpsilon(lbnf){ // gives each NT an according indicator
		var gotChange = false;
		for (var i = 0; i < lbnf.NonTerminals.length; i++){
			var nt = lbnf.NonTerminals[i]; // check each nonterminal
			if (nt.EvalTo.find((e)=>e.Seq.length == 0) != undefined){
				nt.canEps = true; // direct EPSILON replacement
				gotChange = true;
			}
		}
		while (gotChange){ // as long as there are changes
			gotChange = false;
			for (var i = 0; i < lbnf.NonTerminals.length; i++){
				var nt = lbnf.NonTerminals[i]; // check each nonterminal
				if (nt.canEps == true) continue;
				for (var j = 0; j < nt.EvalTo.length; j++){ // check rules
					if (nt.EvalTo[j].Seq.find((s)=>s.EvalTo == undefined) != undefined)
						continue; // Rules containing terminals are ignored
					var canE = true; // initialize
					for (var k = 0; k < nt.EvalTo[j].Seq.length; k++){
						var bnfItem = nt.EvalTo[j].Seq[k]; // each NT in sequence
						canE &= (bnfItem.canEps == true); // must be epsilon-able
						if (canE == false) break;
					}
					if (canE){ // there is at least one rule epsilon-able
						nt.canEps = true;
						gotChange = true;
						break;
					}
				}
			}
		}
	}
	function InitFirstSets(lbnf){ // Initialize also with nonterminals
		for (var i = 0; i < lbnf.NonTerminals.length; i++){
			var nt = lbnf.NonTerminals[i]; // check each nonterminal
			nt.first = nt.canEps ? [{Name:"ɛ"}] : []; // initialize first set
			for (var j = 0; j < nt.EvalTo.length; j++){ // check rules
				for (var k = 0; k < nt.EvalTo[j].Seq.length; k++){ // check sequence
					var bnfItem = nt.EvalTo[j].Seq[k]; // next sequence item
					if (bnfItem !== nt) // not self
						nt.first.push(bnfItem); // part of first-set (nt to be resolved later)
					if (bnfItem.canEps == undefined) break;
				}
			}
			sortCheckUnique(nt.first); // remove any doubles and sort
		}
	}
	function ResolveFirstSets(lbnf){ // Resolve nonterminals in first-sets
		var gotChange = true;
		while (gotChange){ // as long as NTs are solved
			gotChange = false;
			for (var i = 0; i < lbnf.NonTerminals.length; i++){
				var nt = lbnf.NonTerminals[i]; // check each nonterminal
				for (var j = nt.first.length-1; j >= 0; j--){ // check first sets (backwards)
					var firstItem = nt.first[j];
					if (firstItem.EvalTo == undefined) continue; // Terminals remain
					nt.first.splice(j,1); // NTs are removed and replaced
					for (var k = 0; k < firstItem.first.length; k++){ // check first-Items of NT
						var subFirst = firstItem.first[k];
						if (subFirst != nt && subFirst.Name != "ɛ") // if not self and not epsilon
							if(nt.first.indexOf(subFirst) == -1){
	  						 nt.first.push(subFirst); // append it as replacement
							}
					  if(firstItem.Name != subFirst.Name) gotChange = true; // NT found
					}
				}
				sortCheckUnique(nt.first); // remove doubles and sort
			}
		}
	}
	function firstOfSequence(sequence, startAt){ // return first-set of a T-NT-sequence
		var seqfirst = [{Name:"ɛ"}]; // initialize set with epsilon
		for(var k = startAt; k < sequence.length; k++){ // check next sequence items
			var eIndex = seqfirst.findIndex((e)=>e.Name == "ɛ"); // epsilon contained?
			if (eIndex != -1) seqfirst.splice(eIndex,1); // if so -> remove it
			else break; // otherwise set is complete
			// Append the first-set of the current sequence item
			if (sequence[k].EvalTo == undefined)
				seqfirst.push(sequence[k]);
			else
				seqfirst = seqfirst.concat(sequence[k].first);
		}
		return seqfirst;
	}
	function GetRuleFirstSet(bnfItem){ // determine first-set of the rules
		var uniqueSet = []; // collect all sub-first-sets
		for (var i = 0; i < bnfItem.EvalTo.length; i++){ // iterate evaluations
			bnfItem.EvalTo[i].first = firstOfSequence(bnfItem.EvalTo[i].Seq,0);
			sortCheckUnique(bnfItem.EvalTo[i].first); // remove any doubles
			uniqueSet = uniqueSet.concat(bnfItem.EvalTo[i].first); // append to check-set
		}
		// false if there are overlaps or set is empty
		return sortCheckUnique(uniqueSet) && uniqueSet.length > 0;
	}
	function InitFollowSets(lbnf){ // Initialize also with nonterminals
		for (var n = 0; n < lbnf.NonTerminals.length; n++){
			var nt = lbnf.NonTerminals[n]; // check each nonterminal
			nt.follow = nt === lbnf.Start ? [{Name:"$"}] : []; // initialize follow set
			for (var i = 0; i < nt.UsedBy.length; i++){ // iterate the using nonterminals
				for (var j = 0; j < nt.UsedBy[i].EvalTo.length; j++){ // iterate their rules
					var sequence = nt.UsedBy[i].EvalTo[j].Seq; // Each a sequence of BNFItems
					var index = sequence.indexOf(nt); // First occurrence of nt
					while (index != -1){ // for each occurence
						var seqfollow = firstOfSequence(sequence, index+1); // Determine first-set after nt
						var eIndex = seqfollow.findIndex((e)=>e.Name == "ɛ"); // epsilon contained?
						if (eIndex != -1){ // if so
							seqfollow.splice(eIndex,1); // remove epsilon
							if (nt.UsedBy[i] !== nt) // if not self
								seqfollow.push(nt.UsedBy[i]); // using nonterminal to be resolved later
						}
						nt.follow = nt.follow.concat(seqfollow); // append to follow-set of nt
						index = sequence.indexOf(nt, index+1);
					}
				}
			}
			sortCheckUnique(nt.follow); // sort them and remove doubles
		}
	}
	function ResolveFollowSets(lbnf){ // Resolve nonterminals in follow-sets
		var gotChange = true;
		while (gotChange){ // as long as NTs are solved
			gotChange = false;
			for (var i = 0; i < lbnf.NonTerminals.length; i++){
				var nt = lbnf.NonTerminals[i]; // check each nonterminal
				for (var j = nt.follow.length-1; j >= 0; j--){ // check follow sets (backwards)
					var followItem = nt.follow[j];
					if (followItem.EvalTo == undefined) continue; // Terminals remain
					//gotChange = true; // NT found
					nt.follow.splice(j,1); // NT is removed and replaced
					for (var k = 0; k < followItem.follow.length; k++){ // check its follow-Items
						var subFollow = followItem.follow[k];
						if (subFollow != nt) // if not self
							if(nt.follow.indexOf(subFollow) == -1){
								nt.follow.push(subFollow); // append it as replacement
							}
					  if(followItem.Name != subFollow.Name) gotChange = true; // NT found
					}
				}
				sortCheckUnique(nt.follow); // remove doubles and sort
			}
		}
	}
	var res = 0; // intially both requirements fulfilled
	SetCanEpsilon(lbnf); // find NTs that can be epsilon
	InitFirstSets(lbnf); // Initialize first sets (also with NTs)
	ResolveFirstSets(lbnf); // Resolve NTs in first sets to terminals
	for (var i = 0; i < lbnf.NonTerminals.length; i++){
		var nt = lbnf.NonTerminals[i]; // check each nonterminal
		// determine first-sets of the rules und find overlaps
		nt.F1 = GetRuleFirstSet(nt) // first-sets of replacements are not overlapping?
		if (!nt.F1) // otherwise
			res |= 1; // 1. requirement failed
	}
	InitFollowSets(lbnf); // Initialize follow sets (also with NTs)
	ResolveFollowSets(lbnf); // Resolve NTs in followsets sets to terminals
	for (var i = 0; i < lbnf.NonTerminals.length; i++){
		var nt = lbnf.NonTerminals[i]; // check each nonterminal
		var set = [].concat(nt.first); // take the first-set
		nt.F2 = true;
		if (set.findIndex((e)=>e.Name == "ɛ") != -1){ // if first contains epsilon
			set = set.concat(nt.follow); // append the follow-set
			nt.F2 = sortCheckUnique(set); // and check for overlaps to determine F2
			if (!nt.F2)
				res |= 2; // 2. requirement failed;
		}
	}
	return res;
}