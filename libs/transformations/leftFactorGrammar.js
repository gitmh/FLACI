function leftFactorGrammar(grammar){
	var cnt = 0; // number of generated nonterminals
	function ProcessGroupLevel(groups, level, rhs){
		var resGroups = []; // changed groups
		var resNT = []; // new nonterminals
		for (var i = 0; i < groups.length; i++){ // for each group of equal rules (until level)
			var itemDic = {}; // build new sub-groups
			var newNT = undefined; // maybe a new NT is created
			for (var j = 0; j < groups[i].Idx.length; j++){ // check each rule in group
				var item = rhs[groups[i].Idx[j]][0][level]; // get item at process-level
				if (item === undefined){ // no item at this level (=epsilon)
					if (level == 0) // at first level
						groups[i].NT.rhs.push(rhs[groups[i].Idx[j]]); // keep the rule
					else{ // otherwise (occures only once per group)
						cnt++; // a new nt is required for all others in this group
						var newname = "F"+cnt;
						while(Names.indexOf(newname) != -1){
							cnt++;
							newname = "F"+cnt;
						}
						Names.push(newname);
						newNT = {name:newname, rhs:[[[],""]]}; // with epsilon rule only
						var newrhs = [rhs[groups[i].Idx[j]][0].slice(groups[i].Start),""]; // take relevant part of the rule
						newrhs[0].push({name:newNT.name, type:"nt"}); // append newNT
						groups[i].NT.rhs.push(newrhs); // add new rule using new NT
					}
				}
				else { // valid expression item at this level
					if (itemDic[item.name] == undefined) // not occured until here
						itemDic[item.name] = {Seq:groups[i].Seq+item.name, NT:groups[i].NT, Start:groups[i].Start, Idx:[]}; // new sub-group
					itemDic[item.name].Idx.push(groups[i].Idx[j]); // append rule-index
				}
			}
			var newGroups = []; // result groups (input for next level process)
			Object.keys(itemDic).forEach((name)=>{ // for each sub-group
				if (itemDic[name].Idx.length > 1) // real group with more than 1 element
					newGroups.push(itemDic[name]); // processed in next level
				else{ // 1 element >> unique appearance 
					if (level == 0) // at first level
						groups[i].NT.rhs.push(rhs[itemDic[name].Idx[0]]); // keep the rule
					else{ // otherwise
						if (newNT === undefined){ // if there is no newNT already
							cnt++; // create a new one
							var newname = "F"+cnt;
							while(Names.indexOf(newname) != -1){
								cnt++;
								newname = "F"+cnt;
							}
							Names.push(newname);
							newNT = {name:newname, rhs:[]}; // without epsilon rule
							var newrhs = [rhs[itemDic[name].Idx[0]][0].slice(groups[i].Start, level),""]; // take relevant part of the rule
							newrhs[0].push({name:newNT.name, type:"nt"}); // append newNT
							groups[i].NT.rhs.push(newrhs); // add new rule using new NT
						}
						// append rest of current item to newNT
						var newrhs = [rhs[itemDic[name].Idx[0]][0].slice(level),""];
						newNT.rhs.push(newrhs);
					}
				}
			});
			if (newNT != undefined) // if a new NT was created (never in level 0)
				resNT.push(newNT); // deliver it
			for (var j = 0; j < newGroups.length; j++){ // iterate resulting groups
				if (newNT != undefined){ // if a new NT was created
					newGroups[j].NT = newNT; // set it as base for remaining sub-groups
					newGroups[j].Start = level; // remember level for relevant expression parts
				}
				resGroups.push(newGroups[j]); // add to result (input for next level)
			}
		}
		// adapt input array: hold next-level-groups now
		groups.splice(0,groups.length);
		for (var i = 0; i < resGroups.length; i++)
			groups.push(resGroups[i]);
		return resNT;
	}
	function getEnumArray(len){ 
		return Array.apply(null, {length: len}).map(Number.call, Number);
	}
	var BNF = parseBNF(grammar); // get BNF
	cleanupGrammar.RemoveEqualReplacements(BNF); // remove equal rules (disturbing algorithm)
	var Names = BNF.nonterminals.concat(BNF.terminals);
	// create result object (copy without rules)
	var res = { bnf:[], s:BNF.s, nonterminals:BNF.nonterminals, terminals:BNF.terminals, lex:BNF.lex};
	for (var i = 0; i < BNF.bnf.length; i++){ // rebuild rules
		var curNT = BNF.bnf[i];
		var bRes = {name:curNT.name, rhs:[]}; // result nt without rules
		res.bnf.push(bRes); // append to result bnf
		// determine maximum rule length (number of expression items)
		var len = curNT.rhs.reduce((max,r)=> r[0].length > max ? r[0].length : max,0);
		if (len > 0){
			// at the begin there is 1 group, representing bRes, with all rules (all rule idx), beginning all with ""
			var groups = [{Seq:"", NT:bRes, Start:0, Idx:getEnumArray(curNT.rhs.length)}];
			for (var j = 0; j < len; j++){ // iterate until maximum number of expression-items in rules
				var resNT = ProcessGroupLevel(groups,j, curNT.rhs); // process a certain level
				for (var k = 0; k < resNT.length; k++) // iterate new NTs
					res.bnf.push(resNT[k]); // append them
			}
			// Since there are no double-rules >> groups-array is empty here
		}
		else // only EPSILON rule
			bRes.rhs.push([[],""]); // re-append it
	}
	
	return {"result":"OK", "grammar":BNF2Text(res)};
}