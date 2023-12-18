function checkLL1(grammartext){ // checks LL1 requirements
	var bnf = parseBNF(grammartext); // to BNF
	var lbnf = linkBNF(bnf, true); // to linked BNF
	var res = appendFirstFollowLBNF(lbnf); // determine first- and follow-sets
	var resbnf = unlinkBNF(lbnf, true);
	return {
		result: "OK",
		F1: (res & 1) == 0,
		F2: (res & 2) == 0,
		bnf: resbnf.bnf // unlink and keep sets
	};
}

function isLL1(grammar){
	var lbnf = linkBNF(grammar, true); // to linked BNF
	var res = appendFirstFollowLBNF(lbnf); // determine first- and follow-sets
	var resbnf = unlinkBNF(lbnf, true);
    return (res & 1) == 0 && (res & 2) == 0;
}
