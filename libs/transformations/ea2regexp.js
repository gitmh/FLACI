function ea2regex(automaton, type){
	// An arbitrary set
	/*	{
			op:"|" or "?" or "*" or "+" or "&",
			set:["a", anotherArbitrarySet]
		}
	set defines an array of terminals and/or other set-objects
	op defines how the set-items are related: "&" -> concatenated, others -> OR (? -> optional,* -> Kleene,+ -> at least 1)
	*/
	var memo = {};
	function Set(a, k, i, j){
		// Original:	Rk+1(i, j) = Rk(i, j) ∪ Rk(i, k+1) ◦ Rk(k+1, k+1)* ◦ Rk(k+1, j)
		// Result=k:	Rk(i, j) = Rk-1(i, j) ∪ Rk-1(i, k) ◦ Rk-1(k, k)* ◦ Rk-1(k, j)
		// different to original description i and j are 0-based!
		// So: 			Rk(i, j) = Rk-1(i, j) ∪ Rk-1(i, k-1) ◦ Rk-1(k-1, k-1)* ◦ Rk-1(k-1, j)
		console.log("R"+k+"("+(i+1)+","+(j+1)+")");
		if (memo[""+k+""+i+""+j] != undefined){
			if (memo[""+k+""+i+""+j] == "$null$")
				return undefined;
			else
				return JSON.parse(JSON.stringify(memo[""+k+""+i+""+j]));
		}
		if (k == 0){ // basic case
			var res = {set:[], op: (i == j ? "?" : "|")}; // result-set
			var trans = a.States[i].Transitions.find(t=>t.Target == a.States[j].ID);
			if (trans != undefined){ // there are explicit transitions
				if (trans.Labels.length == 1 && trans.Labels[0] == ""){
					memo[""+k+""+i+""+j] = "";
					return ""; // a single epsilon transition
				}
				for (var n = 0; n < trans.Labels.length; n++){
					if (trans.Labels[n] == "") // epsilon transition
						res.op = "?"; // optional
					else // otherwise
						res.set.push(trans.Labels[n]); // append terminal
				}
			}
			else if (i == j){ // implicit self-loop
				memo[""+k+""+i+""+j] = "";
				return "";
			}
			else{ // no implicit or explicit transitions
				memo[""+k+""+i+""+j] = "$null$";
				return undefined;
			}
			memo[""+k+""+i+""+j] = res;
			return res;
		}
		var res = {set:[], op:"|"};
		var s1 = Set(a, k-1, i,   j);   // Rk-1(i,  j)
		if (s1 != undefined)
			res.set.push(s1);
		var s2 = Set(a, k-1, i,   k-1);	// Rk-1(i,   k-1)
		var s3 = {op:"*", set:[Set(a, k-1, k-1, k-1)]}; // Rk-1(k-1, k-1)*
		var s4 = Set(a, k-1, k-1, j);   // Rk-1(k-1, j)
		if (s2 != undefined && s4 != undefined) // s3 is never undefined
			res.set.push({op:"&", set:[s2, s3, s4]});
		if (res.set.length == 0){
			memo[""+k+""+i+""+j] = "$null$";
			return undefined;
		}
		else{
			memo[""+k+""+i+""+j] = res;
			return res;
		}
		return { // Rk(i, j) = Rk-1(i, j) ∪ Rk-1(i, k-1) ◦ Rk(k-1, k-1)* ◦ Rk-1(k-1, j)
			op: "|", set: [
				Set(a, k-1, i, j),	// Rk-1(i, j)
				{
					op: "&", set: [ // Rk-1(i, k-1) ◦ Rk(k-1, k-1)* ◦ Rk-1(k-1, j)
						Set(a, k-1, i, k-1), 					// Rk-1(i, k-1)
						{ op: "*", set: [Set(a, k-1, k-1, k-1)] },// Rk-1(k-1, k-1)*
						Set(a, k-1, k-1, j) 					// Rk-1(k-1, j)
					]
				}
			]
		};
	}
	// a < b -> -1 | a > b -> 1 | a == b -> 0
	function CompareSet(a,b){
		if (a.op == undefined){
			if (b.op == undefined)
				return a < b ? -1 : ((a > b) ? 1 : 0); // 2 simple values
			return -1; // simple vs. set
		}
		else{
			if (b.op == undefined)
				return 1; // set vs. simple
			else{ // both are real sets
				if (a.op != b.op) return a.op < b.op ? -1 : 1; // different operator
				if (a.set.length != b.set.length) return a.set.length - b.set.length; // different length
				var fa = Format(a);
				var fb = Format(b);
				// Compare formatted string result (sub-sets are sorted already)
				return fa < fb ? -1 : (fa > fb ? 1 : 0);
			}
		}
	}
	function Solve(s){
		if (s.op == undefined) // a single terminal
			return s; // remains
		var beforetxt = Format(s);
		// Solve set-items, remove doubles and irrelevants
		for (var i = s.set.length-1; i >= 0; i--){
			s.set[i] = Solve(s.set[i]); // Solve sub-sets
			if (s.set[i] == ""){
				s.set.splice(i,1);
				if (s.op == "+") s.op = "*";
				if (s.op == "|") s.op = "?";
			}
			else if (s.op != "&"){ // otherwise check for doubles and remove
				for (var j = i+1; j < s.set.length; j++){
					if (CompareSet(s.set[i], s.set[j]) == 0){
						s.set.splice(i,1);
						break;
					}
				}
			}
		}
		if (s.set.length == 0){ // empty set
			console.log(beforetxt + " -> " + Format(""));
			return ""; // empty result
		}
		if (s.op == "&"){ // Lift up sub-ANDs
			var newset = [];
			for (var i = 0; i < s.set.length; i++){
				if (s.set[i].op == "&")
					newset = newset.concat(s.set[i].set);
				else
					newset.push(s.set[i]);
			}
			s.set = newset;
		}
		else{ // | ? * + Lift up sub-ORs
			for (var i = s.set.length-1; i >= 0; i--){
				var subset = s.set[i];
				if (subset.op == undefined) continue;
				if (s.op == "+" || s.op == "*" && subset.op == "?" || subset.op == "|"){ // lift up
					for (var j = 0; j < subset.set.length; j++){ 
						if (s.set.find(s=>CompareSet(s,subset.set[j]) == 0) == undefined)
							s.set.push(subset.set[j]); // push if not creating doubles
					}
					if (s.op == "+" && (subset.op == "*" || subset.op == "?"))
						s.op = "*";
					else if (s.op == "|" && subset.op == "?")
						s.op = "?";
					s.set.splice(i,1); // remove subset
				}
/*				else if (s.op == "?"){ // no lift up
					if (subset.op == "+") 
						subset.op = "*";
					s.op == "|";
				}*/
			}
		}

		if (s.op == "&"){
			// combine sub-ors?
			var possible = 1; // if all entries are words or (optional)OR-sets of words
			for (var i = 0; i < s.set.length; i++){
				possible &= (s.set[i].op == undefined || ((s.set[i].op == "|" || s.set[i].op == "?") && s.set[i].set.reduce((p,c)=> p & (c.op == undefined),1)));
			}
			if (possible == 1){
				var newset = [""];
				var str1 = Format(s);
				for (var i = 0; i < s.set.length; i++){
					if (s.set[i].op == undefined){
						for (var j = 0; j < newset.length; j++)
							newset[j] += s.set[i];
					}
					else{
						var multiset = [];
						for (var j = 0; j < newset.length; j++){
							for (var k = 0; k < s.set[i].set.length; k++){
								multiset.push(newset[j] + s.set[i].set[k]);
							}
							if (s.set[i].op == "?") // is optional
								multiset.push(newset[j]); // push unchanged
						}
						newset = multiset;
					}
				}
				var newop = "|";
				for (var i = newset.length-1; i >= 0; i--){
					if (newset[i] == ""){
						newop = "?";
						newset.splice(i,1);
					}
				}
				var str2 = Format({op:newop,set:newset});
				if ((str2.length-2) < str1.length){ // expression got shorter
					s.op = newop;
					s.set = newset;
					s.set.sort(CompareSet);
				}
			}
			else{
				for (var i = s.set.length-2; i >= 0; i--){
					var a = s.set[i];
					var b = s.set[i+1];
					var ta = Format(a);
					var tb = Format(b);
					if (a.op == undefined){
						if (b.op == undefined)
							continue; // 2 different words
						else { // word & set
							if (tb == a+"*" || tb == "("+a+")*"){
								s.set.splice(i,1);
								b.op = "+";
							}
						}
					}
					else {
						if (b.op == undefined){ // set & word
							if (ta == b+"*" || ta == "("+b+")*"){
								s.set.splice(i+1,1);
								a.op = "+";
							}
						}
						else{ // set&set
							if (a.op == "*"){
								var op = tb.replace(ta.substring(0,ta.length-1),"");
								if (op == "*" || op == "?")
									s.set.splice(i+1,1);
								else if (op == "+")
									s.set.splice(i,1);
								else if (op == ""){
									s.set.splice(i+1,1);
									a.op = "+";
								}
							}
							else if (a.op == "+" && (b.op == "*" || b.op == "?")){
								var op = tb.replace(ta.substring(0,ta.length-1),"");
								if (op == "*" || op == "?")
									s.set.splice(i+1,1);
							}
							else if (a.op == "?" && (b.op == "*" || b.op == "+")){
								var op = tb.replace(ta.substring(0,ta.length-1),"");
								if (op == "*" || op == "+")
									s.set.splice(i,1);
							}
							else if (b.op == "*" && (a.op == "&" || a.op == "|")){
								if (ta.replace(tb.substring(0,tb.length-1),"") == ""){
									s.set.splice(i,1);
									b.op = "+";
								}
							}
						}
					}
				}
			}
		}

		if (s.set != undefined && s.op != "&"){
			for (var i = s.set.length-1; i >= 0; i--){
				for (var j = s.set.length-1; j > i; j--){
					var a = s.set[i];
					var b = s.set[j];
					var ta = Format(a);
					var tb = Format(b);
					if (a.op == undefined){
						if (b.op == undefined)
							continue; // 2 different words
						else { // word & set
							if (tb == a+b.op || tb == "("+a+")"+b.op){
								s.set.splice(i,1);
								break;
							}
						}
					}
					else {
						if (b.op == undefined){ // set & word
							if (ta == b+a.op || ta == "("+b+")"+a.op)
								s.set.splice(j,1);
						}
						else{ // set&set
							if ((a.op == "*" && ( b.op == "+" || b.op == "?")) ||
								  (a.op == "+" && ( b.op == "*" || b.op == "?")) ||
							  	(a.op == "?" && ( b.op == "+" || b.op == "*"))){
								var op = ta.replace(tb.substring(0,tb.length-1),"");
								if (op == a.op){
									a.op = "*";
									s.set.splice(j,1);
								}
							}
						}
					}
				}
			}

			//s.set.sort(CompareSet);
		}
		
		if (s.set != undefined && s.set.length == 1){ // only 1 element in set
			if (s.op == "|" || s.op == "&") // OR or concatenation
				s = s.set[0]; // lifted up >> uses parent op
			else {
				// use the single subset
				if ((s.op == "+" && (s.set[0].op == "?" || s.set[0].op == "*")) ||
				  	(s.op == "?" && (s.set[0].op == "*" || s.set[0].op == "+")))
					s.op = "*"; // gets Kleene
				if (s.set[0].op != undefined && s.set[0].op != "&")
					s.set = s.set[0].set; // replaced
			}
		}

		console.log(beforetxt + " -> " + Format(s));
		return s;
	}
	function Format(s){
		if (s.op == undefined) // a single terminal
			return s;//s.replace(/[()[\]*+.^\\?|]/g,"\\$&"); // escaped char
		var res = "";
		var sep = "";
		var curOp = (s.op == "*" || s.op == "+"  || s.op == "?") ? s.op : "";
    
    var first = null;
    var last = null;
    var next = 0;
		for (var i = 0; i < s.set.length; i++){
			var re = Format(s.set[i]);
			if(i == s.set.length-1 && re.charCodeAt(0) == first+next+1) last = re.charCodeAt(0);
			if(i == 0 && re.length == 1) first = re.charCodeAt(0); else next++;
			res += sep + re;

			if (re != "" && (s.op == "|" || s.op == "*" || s.op == "+" || s.op == "?"))
				sep = "|"; else sep = "";
//			if (re != "" && s.op != "&" && s.op != "+" && s.op != "*")
//				sep = "|"; else sep = "";
		}
		if(first && last && s.set.length > 2){
		  res = "["+String.fromCharCode(first)+"-"+String.fromCharCode(last)+"]";
		}else{
		  if (s.op != "&" && res.length > 1)
			  res = "(" + res + ")";
    }
		if (res.length > 0)
			res += curOp;
		return res;
	}
	var res = removeTrapStates(automaton);
	if (res.result != "OK") return res;
	var a = res.automaton; // nea without trap-states
	var n = a.States.length;
	var s = a.States.findIndex(o=>o.Start == true);
	var f = a.States.filter(o=>o.Final == true);
	var result = {op:"|", set:[]};
	for (var i = 0; i < f.length; i++)
		result.set.push(Set(a,n,s,a.States.indexOf(f[i])));
	result = Solve(result);
	var regex = Format(result);
	//if(regex.length > 2 && regex[0] == "(" && regex[regex.length-1] == ")")
	//  regex = regex.substring(1,regex.length-1);
	return {"result":"OK", "regex":regex };
}


