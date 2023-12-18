// make 6 tuple NKA from current 7 tuple
function build6from7tupleKA(automaton) {
  var startName = "START";
  var endName = "END";
  // find free startname 
  var inUse = true;
  while(inUse){
    inUse = false;
    for(var i=0; i < automaton.States.length; i++){
      if(automaton.States[i].Name == startName){
        inUse = true;
        break;
      }
    }
    if(inUse){
      startName += "_";
    }
  }        
  var inUse = true;
  while(inUse){
    inUse = false;
    for(var i=0; i < automaton.States.length; i++){
      if(automaton.States[i].Name == endName){
        inUse = true;
        break;
      }
    }
    if(inUse){
      endName += "_";
    }
  }        
  // add new stack character
  var newStackCharacter = ["#","$","§","%","!","°","@","*","+","XYZ"];
  while(newStackCharacter.length > 0 && automaton.StackAlphabet.indexOf(newStackCharacter[0]) >= 0){  
    newStackCharacter.splice(0,1);
  }
  automaton.StackAlphabet.unshift(newStackCharacter[0]);

	var newEndState = {};
	var maxID = 0;
	for(var i=0; i < automaton.States.length; i++){
	  maxID = Math.max(maxID, automaton.States[i].ID);
	}
	newEndState.ID = maxID + 1;
	newEndState.Name = endName;
	newEndState.x = 0;
	newEndState.y = 0;
	newEndState.Radius = 30;
	newEndState.Transitions = [];
	newEndState.Start = false;
	newEndState.Final = true;
	automaton.States.push(newEndState); //add to automaton states
	
	// for each final state we add a transition to newEndState for each possible top of stack
  for(var i=0; i < automaton.States.length; i++){
    if(automaton.States[i].Final){
      var endState = automaton.States[i];
      var newtrans = {}; 
      newtrans.Source = endState.ID; // will also produce newEndState -> newEndState loop at the end
      newtrans.Target = newEndState.ID;
      newtrans.x = 0;
      newtrans.y = 0;
      newtrans.Labels = [];
      for(var t=0; t < automaton.StackAlphabet.length; t++){
        var tos = automaton.StackAlphabet[t];
	      newtrans.Labels.push([tos, "", []]); 
      }
      endState.Transitions.push(newtrans); //add transition	
      if(automaton.States[i].ID != newEndState.ID)
        automaton.States[i].Final = false;
    }
  }	
  // unset old start state but keep reference
  var olsStartState = null;
  
  for(var i=0; i < automaton.States.length; i++){
    if(automaton.States[i].Start){
      olsStartState = automaton.States[i];
      olsStartState.Start = false;
    }
  }    

  // add new start state
	var newStartState = {};
	newStartState.ID = maxID + 2;
	newStartState.Name = startName;
	newStartState.x = 0;
	newStartState.y = 0;
	newStartState.Radius = 30;
	newStartState.Transitions = [];
	newStartState.Start = true;
	newStartState.Final = false;
	automaton.States.push(newStartState); //add to automaton states

  // add new transition to old start state with new stack character
  var newtrans = {}; 
  newtrans.Source = newStartState.ID;
  newtrans.Target = olsStartState.ID;
  newtrans.x = 0;
  newtrans.y = 0;
  newtrans.Labels = [];
  newtrans.Labels.push([automaton.StackAlphabet[0], "", 
                       [automaton.StackAlphabet[1],automaton.StackAlphabet[0]]]); 
  newStartState.Transitions.push(newtrans); //add transition	
  
  var r = autoLayoutAutomaton(automaton,false,false,newStartState.ID);
  if(r.result == "OK"){
    automaton = r.automaton;
    var r = autoLayoutAutomaton(r.automaton,false,false,newEndState.ID);
    if(r.result == "OK"){
      automaton = r.automaton;
    }
  }
  return {"result":"OK", "automaton":automaton};
}	
