
function deleteUnusedStates(automaton){
  var a = JSON.parse(JSON.stringify(automaton)); // make a copy first
 
  var start = null;

  for(var i=0; i < a.States.length; i++){
    if(a.States[i].Start) start = a.States[i];    
  }

  var usedStates = [start];

  function getTargetState(target){
    for(var i=0; i < a.States.length; i++){
      if(a.States[i].ID == target) return a.States[i];    
    }
    return null;
  }

  var changed = true;
  while(changed){
    changed = false;
    for(var i=0; i < usedStates.length; i++){
      for(var z=0; z < usedStates[i].Transitions.length; z++){
        var t = getTargetState(usedStates[i].Transitions[z].Target);
        if(t && usedStates.indexOf(t) == -1){ 
          usedStates.push(t);
          changed = true;
        }
      }
    }
  }  

  for(var i=0; i < a.States.length; i++){
    if(usedStates.indexOf(a.States[i]) == -1) {
      a.States.splice(i,1);
      i--;
    }
  }

  return {"result":"OK", "automaton":a};  
}       
