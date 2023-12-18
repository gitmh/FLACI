function MergeStates(s1, s2) { // transitions to and from s2 transferred to s1
	if (s1 !== s2) { // not the same state already
		for (var t of s2.Out.values()) { // iterate outgoing transitions of s2
			var s1t = s1.Out.get(t.Target.ID); // find outgoing of s1 with same target
			if (s1t === undefined) { // no transition from s1 to this target?
				s1t = { Source: s1, Target: t.Target, Labels: new Map() }; // create transition
				s1.Out.set(t.Target.ID, s1t); // add to outgoing of s1
				s1t.Target.In.set(s1.ID, s1t); // add to incoming of target
			}
			t.Target.In.delete(t.Source.ID); // remove original from target
			// append labels being not there already
			for (var l of t.Labels.values())
				s1t.Labels.set(l, l);
		}
		s2.Out = new Map(); // clear
		for (var incoming of s2.In.values()) { // iterate incoming transitions
			var s1incoming = incoming.Source.Out.get(s1.ID); // also a transition to s1
			if (s1incoming === undefined) { // no, so:
				incoming.Source.Out.delete(s2.ID);
				incoming.Source.Out.set(s1.ID, incoming);
				incoming.Target = s1; // just change the target
				incoming.x = incoming.y = undefined;
				s1.In.set(incoming.Source.ID, incoming); // and add the source
			}
			else { // if there is a transition already
				for (var l of incoming.Labels.values())
					s1incoming.Labels.set(l, l); // apply labels
				incoming.Source.Out.delete(s2.ID); // remove transition to s2
			}
		}
		s2.In = new Map(); // clear
//		s1.Name += "+" + s2.Name;
		// determine Start and Final
		if (s2.Final) s1.Final = true;
		if (s2.Start) s1.Start = true;
	}
}
function removeIsolatedStates(linkedEA){
	// remove any isolated states
	for (var s of linkedEA.States.values()) {
		if (s.In.size === 0 && s.Out.size === 0)
			linkedEA.States.delete(s.ID);
		else if (s.Start)
			linkedEA.Start = s; // determine new start state
	}
}
function removeEpsilonOptimized(linkedEA) {
	function removeSelfEpsilon(s) { // remove epsilon-self-transitions
		var selftrans = s.Out.get(s.ID); // find self-transitions
		if (selftrans === undefined) return; // no self-transition
		selftrans.Labels.delete(""); // remove epsilon-self-transition
		if (selftrans.Labels.size === 0) { // no other label
			s.Out.delete(s.ID); // remove whole
			s.In.delete(s.ID); //  self transition
		}
	}
	// merge states under certain contitions
	for (var s of linkedEA.States.values()) {
		var reloop = true;
		while (reloop){ // state to be checked multiple if merged
			removeSelfEpsilon(s); // remove any self transitions with epsilon
			reloop = false;
			for (var t of s.Out.values()) { // iterate outgoing transitions
				if (t.Labels.get("") !== undefined){ // epsilon transition
					var rev =t.Target.Out.get(s.ID); // determine opposing transition
					if (rev !== undefined && rev.Labels.get("") !== undefined){ // also an opposing epsilon transition
						// append incoming and outgoing transitions of target to s
						MergeStates(s, t.Target); // leaves target state unconnected
						reloop = true; // process this state again (because of changed out-transitions)
						break;
					}
					else if (t.Labels.size <= 1) { // isolated
						if ((t.Target.In.size === 1 && !t.Target.Start) || // no other incoming transitions at target
							(s.Out.size === 1 && !s.Final)) { // no other outgoing transitions from source
							// append incoming and outgoing transitions of target to s
							MergeStates(s, t.Target); // leaves target state unconnected
							reloop = true; // process this state again (because of changed out-transitions)
							break;
						}
					}
				}
			}
		}
	}
	// remove any isolated states
	removeIsolatedStates(linkedEA);
	// replace all remaining epsilon transitions by "real" transitions
	removeEpsilonLinkedNEA(linkedEA);	
}
function optimizeKozen(linkedEA) {
	appendLabelDic(linkedEA);
	var pairs = new Map(); // Generate pairs to be checked
	for (var s1 of linkedEA.States.values()) {
		var p = new Map();
		pairs.set(s1.ID, p);
		// no pairs of equal states, no doubled pairs (unordered)
		for (var s2 of linkedEA.States.values()) {
			if (s1 === s2) break; // Stop when reaching outer iteration
			var pair = {p:s1, q:s2};
			if (s1.Final !== s2.Final || // pairs of F and nonF states
				s1.OutL.size !== s2.OutL.size || // pairs with different number of different outgoing labels
				s1.OutL.forEach((lst, l)=> { return s2.OutL.get(l) === undefined })) // pairs where a certain label is not outgoing at both states
				pair.Marked = true; // initially marked
			p.set(s2.ID, pair);
		}
	}
	function findAllMarked(pl, ql, pairs) {
		if (pl == undefined || ql == undefined) return false;
		for(var i = 0; i < pl.length; i++){
			var pt = pl[i]; // iterate p'
			var unmarked = ql.find((qt)=> { // find unmarked {p',q'}
				if (qt === pt) return true; // equal target states are always unmarked
				var p1 = pairs.get(pt.ID).get(qt.ID);
				var p2 = pairs.get(qt.ID).get(pt.ID);
				return  !((p1 && p1.Marked) || (p2 && p2.Marked)); // not marked?
			});
			if (!unmarked) // all pairs are marked
				return true;
		}
		return false;
	}
	var changed = true;
	while (changed){
		changed = false;
		for (var po of pairs.values()) {
			for (var pair of po.values()) {
				if (pair.Marked) return; // loop pairs not marked -> continue
				// Unmarked pairs have the same outgoing labels
				for (var [l, pl] of pair.p.OutL) {// loop out-labels >> pl = reachable states from p with l
					var ql = pair.q.OutL.get(l); // ql = reachable states from q with l
					if (findAllMarked(pl,ql,pairs) ||
						findAllMarked(ql,pl,pairs)){
						pair.Marked = true;
						changed = true;
						break;
					}
				}
			}
		}
	}
	for (var s1 of linkedEA.States.values()) {
		for (var s2 of linkedEA.States.values()) {
			if (s1 === s2) break; // Stop when reaching outer iteration
			var mergepair = pairs.get(s1.ID).get(s2.ID);
			if (!mergepair.Marked){ // pair to be merged
				if ((s1.Out.size > 0 || s1.In.size > 0) &&
					(s2.Out.size > 0 || s2.In.size > 0)) // both not isolated already
					MergeStates(s1,s2); // merge
			}
		}
	}
	removeIsolatedStates(linkedEA);
}
function optimizeKozenQueued(linkedEA) {
	appendLabelDic(linkedEA);
	function addQueue(p, q, pairs, queue){
		p.In.forEach((pi)=> { // all incomings of p
			q.In.forEach((qi)=> { // all incomings of q
				// determine ID-pair
				var marked = pairs.get(pi.Source.ID).get(qi.Source.ID);
				var first, second;
				if (marked === undefined){ // to be reversed
					marked = pairs.get(qi.Source.ID).get(pi.Source.ID);
					first = qi.Source;
					second = pi.Source;
				}
				else{
					first = pi.Source;
					second = qi.Source;
				}
				if (marked) return; // already marked, not to be queued
				queue.push({
					p: first, q: second, // push pair and possible labels
					labels: pi.Labels.reduce((res,cur) => {
						if (qi.Labels.get(cur))
							res.set(cur, cur);
						return res;
					},new Dictionary())
				});
			});
		});
	}
	var pairs = new Dictionary(); // Generate pairs dictionary
	// init pairs
	linkedEA.States.forEach((s1)=> { 
		var p = new Dictionary();
		pairs.set(s1.ID, p);
		// no pairs of equal states, no doubled pairs (unordered)
		linkedEA.States.forEach((s2)=> {
			if (s1 === s2) return true; // Stop when reaching outer iteration
			p.set(s2.ID, false);
		});
	});
	var queue = []; // The pairs to be checked next
	// Find initial pairs and queue
	linkedEA.States.forEach((s1)=> { 
		var p = pairs.get(s1.ID);
		// no pairs of equal states, no doubled pairs (unordered)
		linkedEA.States.forEach((s2)=> {
			if (s1 === s2) return true; // Stop when reaching outer iteration
			var marked = false; // initially unmarked, except of
			if (s1.Final != s2.Final || // pairs of F and nonF states
				s1.OutL.size != s2.OutL.size || // pairs with different number of different outgoing labels
				s1.OutL.forEach((lst, l)=> { return s2.OutL.get(l) === undefined })){ // pairs where a certain label is not outgoing at both states
				marked = true; // initially marked
				addQueue(s1,s2,pairs,queue); // determine all pairs affected by this mark
			}
			p.set(s2.ID, marked);
		});
	});
	function findAllMarked(pl, ql, pairs){
		for(var i = 0; i < pl.length; i++){
			var pt = pl[i]; // iterate p'
			var unmarked = ql.find((qt)=> { // find unmarked {p',q'}
				if (qt === pt) return true; // equal target states are always unmarked
				return  !(pairs.get(pt.ID).get(qt.ID) || pairs.get(qt.ID).get(pt.ID)); // not marked?
			});
			if (!unmarked) // all pairs are marked
				return true;
		}
		return false;
	}
	while(queue.length > 0){
		var pair = queue.shift(); // next queue-pair
		if (pairs.get(pair.p.ID).get(pair.q.ID)) continue; // marked already
		// Unmarked pairs have the same outgoing labels (see initialization)
		pair.labels.forEach((l)=> { // loop relevant labels
			var pl = pair.p.OutL.get(l); // pl = reachable states from p with l
			var ql = pair.q.OutL.get(l); // ql = reachable states from q with l
			if (findAllMarked(pl,ql,pairs) || findAllMarked(ql,pl,pairs)) {
				pairs.get(pair.p.ID).set(pair.q.ID, true);
				addQueue(pair.p,pair.q,pairs,queue);
				return true; // break
			}
		});
	}
	linkedEA.States.forEach((s1)=> { 
		linkedEA.States.forEach((s2)=> {
			if (s1 === s2) return true; // Stop when reaching outer iteration
			if (!pairs.get(s1.ID).get(s2.ID)){ // pair to be merged
				if ((s1.Out.size > 0 || s1.In.size > 0) &&
					(s2.Out.size > 0 || s2.In.size > 0)) // both not isolated already
					MergeStates(s1,s2); // merge
			}
		});
	});
	removeIsolatedStates(linkedEA);
}
/* not working function optimizeChampCoul(linkedEA) { 
	function getPairs(linkedEA, right){
		var keys = Object.keys(linkedEA.States);
		var m = {}; // matrices + 0-initialization
		for(var a in linkedEA.Alphabet){
			m[a] = Array(keys.length);
			for (var i = 0; i < keys.length; i++){
				m[a][i] = Array(keys.length).fill(0);
				linkedEA.States[keys[i]].Index = i;
			}
		}
		var notEqPairs = {}; // the result pairs (being not part of the relation)
		var finalStates = keys.reduce((res, k)=> { // determine final states
			var sf = linkedEA.States[k];
			// when determining left the start state is the final
			if ((right && sf.Final) || (!right && sf.Start)) res.push(sf);
			return res;
		},[]);
		var queue = []; // queue of states to be checked
		for (var k in linkedEA.States){
			var s = linkedEA.States[k];
			s.OutL = {}; // extend states with a dictionary of states reachable with a certain label
			for (var k in right ? s.Out : s.In){
				var o = right ? s.Out[k] : s.In[k];
				for (var l in o.Labels){
					var ldic = s.OutL[l];
					if (!ldic){
						ldic = [right ? o.Target : o.Source];
						s.OutL[l] = ldic;
					}
					else
						ldic.push(right ? o.Target : o.Source);
				}
			}
			s.InL = {}; // extend states with a dictionary of states that can reach s with a certain label
			for (var k in right ? s.In : s.Out){
				var o = right ? s.In[k] : s.Out[k];
				for (var l in o.Labels){
					var ldic = s.InL[l];
					if (!ldic){
						ldic = [right ? o.Source : o.Target];
						s.InL[l] = ldic;
					}
					else
						ldic.push(right ? o.Source : o.Target);
				}
			}
			if ((right && !s.Final) || (!right && !s.Start)){ // not a final state
				for (var fi = 0; fi < finalStates.length; fi++){
					// add pairs (F,!F) to result and queue
					var fs = finalStates[fi];
					var ne = notEqPairs[fs.ID];
					if (!ne){
						ne = {};
						notEqPairs[fs.ID] = ne;
					}
					var pair = {i:fs, j:s}; // (i,j)
					ne[s.ID] = pair;
					queue.push(pair);
				}
			}
		}
		while (queue.length > 0){
			var pair = queue.shift(); // (i,j)
			for(var a in linkedEA.Alphabet){
				var tj = pair.j.InL[a];
				if (!tj) continue;
				for (var t = 0; t < tj.length; t++){
					var k = tj[t]; // k -a-> pair.j
					var ma = m[a];
					ma[pair.i.Index][k.Index]++;
					if (k.OutL[a] && ma[pair.i.Index][k.Index] === k.OutL[a].length){ // 
						var ti = pair.i.InL[a];
						if (!ti) continue;
						for (var t2 = 0; t2 < ti.length; t2++){
							var j = ti[t2];
							if (notEqPairs[j.ID] === undefined || notEqPairs[j.ID][k.ID] === undefined){
								if (notEqPairs[j.ID] === undefined)
									notEqPairs[j.ID] = {};
								var addpair = {i:j,j:k};
								notEqPairs[j.ID][k.ID] = addpair;
								queue.push(addpair);
							}
						}
					}
					
				}
			}
		}
		return notEqPairs;
	}
	function notIn(set,p,q){
		var s = set[p.ID];
		if (!s) return true;
		return s[q.ID] === undefined;
	}
	function cleanPairs(set,del, linkedEA){
		for (var k in linkedEA.States){
			var s = linkedEA.States[k];
			var sub = set[del.ID];
			if (sub)
				delete sub[s.ID];
		}
	}
	var notR = getPairs(linkedEA, true);
	var notL = getPairs(linkedEA, false);
	for (var pi in linkedEA.States){
		var p = linkedEA.States[pi];
		for (var qi in linkedEA.States){
			var q = linkedEA.States[qi];
			if (p === q) continue;
			if ((notIn(notR,p,q) && notIn(notR,q,p)) || // 1. (p,q) in R and (q,p) in R
				(notIn(notL,p,q) && notIn(notL,q,p))){ // 2. (p,q) in L and (q,p) in L
				//MergeStates(p,q); // merge
				//cleanPairs(notR,q,linkedEA);
				//cleanPairs(notL,q,linkedEA);
				var x = 1;
			}
			else if (notIn(notR,p,q) && notIn(notL,p,q)){  // 3. (p,q) in R and (p,q) in R)
				//MergeStates(p,q); // merge
				var x = 1;
			}
		}
	}
	removeIsolatedStates(linkedEA);
}*/
function optimizeChampCoul2(linkedEA) {
	function getPairs(linkedEA, right){
		var Rel = {};
		// Paare gleicher Elemente sind schon mal alle drin
		linkedEA.States.forEach((s)=> {
			Rel[s.ID] = {};
			Rel[s.ID][s.ID] = {q:s, p:s};
			s.OutX = new Dictionary(); // extend states with a dictionary of states reachable with a certain label
			(right ? s.Out : s.In).forEach((o)=> {
				o.Labels.forEach((l)=> {
					var ldic = s.OutX.get(l);
					if (!ldic){
						ldic = [right ? o.Target : o.Source];
						s.OutX.set(l, ldic);
					}
					else
						ldic.push(right ? o.Target : o.Source);
				});
			});
		});
		// Paare wo es ein p' mit a gibt wo alle q' mit gleichem a ein Paar (p',q') ergeben, dass bereits in Rel ist
		var changed = true;
		while (changed){
			changed = false;
			linkedEA.States.forEach((p)=> { // p
				linkedEA.States.forEach((q)=> { // q
					if (p === q || 
						(right && p.Final !== q.Final) || 
						(!right && p.Start !== q.Start) ||
						Rel[q.ID][p.ID]) 
						return; // continue
					
					var verified = true;
					q.OutX.forEach((qout, a)=> { // out-labels a
						var pout = p.OutX.get(a);
						if (!pout){
							verified = false;
							return true; // break 
						}
						var found = false;
						for (var pi = 0; pi < pout.length; pi++) {
							var ps = pout[pi]; // p'
							var allinR = true;
							for (var qi = 0; qi < qout.length; qi++){
								var qs = qout[qi];
								if (Rel[qs.ID][ps.ID] === undefined){
									allinR = false;
									break;
								}
							}
							if (allinR){
								found = true;
								break;
							}
						}
						if (!found){
							verified = false;
							return true; // break
						}
					});
					if (verified){
						Rel[q.ID][p.ID] = {q:q,p:p};
						changed = true;
						return true; // break
					}
				});
			});
		}
		return Rel;
	}
	var R = getPairs(linkedEA, true);
	var L = getPairs(linkedEA, false);
	linkedEA.States.forEach((p)=> {
		linkedEA.States.forEach((q)=> {
			if (p === q || p.Final !== q.Final) return; // continue
			if ((R[q.ID][p.ID] && R[p.ID][q.ID]) ||
				(L[q.ID][p.ID] && L[p.ID][q.ID]) ||
				(R[q.ID][p.ID] && L[q.ID][p.ID]) ||
				(R[p.ID][q.ID] && L[p.ID][q.ID])){
					MergeStates(p,q); // merge
			}
		});
	});
}
function generateNEA(nStates, nAlphabet){
	var alpha = "abcdefghijklmnopqrstuvwxyz";
	if (nAlphabet > alpha.length) nAlphabet = alpha.length;
	var result = { // The result object
		Alphabet: alpha.substring(0,nAlphabet).split(""), // up to 26
        States: new Dictionary(),
        Start: undefined 
    };
	// Generate states
	for (var i = 0; i < nStates; i++){
		result.States.set(i, {
			ID: i, Name: "q"+i,
            Start: i == 0, Final: i == (nStates-1),
            Radius: 30, x: -1, y: -1,
            Out: new Dictionary(), In: new Dictionary()
		});
		if(i == 0) result.Start = result.States.get(i);
	}
	// Generate transitions until:
	//	- All states are accessible from Start (includes Final)
	//	- There are no traps
	function isComplete(nea){
		var gotStatesNext = {};
		function registerStateNext(s){
			if (gotStatesNext[s.ID]) return;
			gotStatesNext[s.ID] = s;
			s.Out.forEach((t)=> { registerStateNext(t.Target); });
			return;
		}
		registerStateNext(nea.Start);
		if (Object.keys(gotStatesNext).length < nStates) return false;
		var gotStatesPrev = {};
		function registerStatePrev(s){
			if (gotStatesPrev[s.ID]) return;
			gotStatesPrev[s.ID] = s;
			s.In.forEach((t)=> { registerStatePrev(t.Source); });
			return;
		}
		registerStatePrev(nea.States.get(nStates-1));
		if (Object.keys(gotStatesPrev).length < nStates) return false;
		return true;
	}
	while (!isComplete(result)){
		var idFrom = Math.floor(Math.random() * nStates);
		var idTo = Math.floor(Math.random() * nStates);
		var idAlpha = Math.floor(Math.random() * (nAlphabet+1))-1; // -1 = epsilon
		var sFrom = result.States.get(idFrom);
		var sTo = result.States.get(idTo);
		var label = idAlpha == -1 ? "" : result.Alphabet[idAlpha];
		var transition = sFrom.Out.get(idTo);
		if (!transition){
			transition = {Source: sFrom, Target: sTo, Labels: new Dictionary()};
			sFrom.Out.set(idTo, transition);
			sTo.In.set(idFrom, transition);
		}
		transition.Labels.set(label,label);
	}
	return result;
}
function optimizeNEA(automaton) {
	var linkedEA = linkEA(automaton);
	var mode = prompt("0 = Optimiertes Epsilon-Entfernen\n1 = Autobisimulation\n2 = Regular Inequalities\n3 = Queued Autobisimulation\n4 = Generate NEA");
	if (mode === "0")
		removeEpsilonOptimized(linkedEA);
	else if (mode === "1")
		optimizeKozen(linkedEA);
	else if (mode === "2")
		optimizeChampCoul2(linkedEA);
	else if (mode === "3")
		optimizeKozenQueued(linkedEA);
	else if (mode === "4")
		linkedEA = generateNEA(5,2);
	else
		return {"result":"FAILED"};
	return {"result":"OK", "automaton":unlinkEA(linkedEA)};
}