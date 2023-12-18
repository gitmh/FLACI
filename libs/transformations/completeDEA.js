
function completeDEA(automaton){
  var a = automaton; // use the same automaton directly

  // find an existing trap state
  var trapID = -1;
  var trapCreated = false;
  for(var i=0; i < a.States.length; i++){
    if(a.States[i].Final) continue; // trap state cannot be a final state
    if(a.States[i].Transitions.length == 0 || 
      (a.States[i].Transitions.length == 1 && a.States[i].Transitions[0].Target == a.States[i].ID)){
      // state has none transitions or only one to it self
      // use this state as trap state
      trapID = a.States[i].ID;
    }
  }
  // if no trap state found, create one
  if(trapID == -1){
    var trapName = "TRAP";
    var changed = true;
    var trapIDCounter = 1;
    // find a proper name which is unused yet
    while(changed){
      changed = false;
      for(var i=0; i < a.States.length; i++){
        if(a.States[i].Name == trapName){
          trapName = "TRAP"+trapIDCounter++;
          changed = true;
          break;
        }
      }
    }
    // find a new, unused ID for the state 
    for(var z=0; z < a.States.length; z++){ 
      trapID = Math.max(trapID, a.States[z].ID);
    }
    trapID = trapID + 1; // use next number
    // add the state to automaton
    a.States.push({ID:trapID, Name:trapName, x:0, y:0, Final:false, Radius:30, Transitions:[]});
    trapCreated = true;
  }
  
  // we have a trap state now, create all transitions with missing labels to it
  for(var i=0; i < a.States.length; i++){
    var labels = a.Alphabet.slice(0); // copy entire alphabet array
    // remove already used characters
    for(var z=0; z < a.States[i].Transitions.length; z++){
      for(var x=0; x < a.States[i].Transitions[z].Labels.length; x++){
        var p = labels.indexOf(a.States[i].Transitions[z].Labels[x]);
        if(p != -1) labels.splice(p,1); // remove character from the list
      }
    }

    // there are missing labels, so add a transition to trap state
    if(labels.length > 0){
      var transition = null;
      // check if we already have a transition to trap
      for(var z=0; z < a.States[i].Transitions.length; z++){
        if(a.States[i].Transitions[z].Target == trapID){
          transition = a.States[i].Transitions[z];
          break;
        }
      }
      // create transition if not exists
      if(!transition){
        transition = {"Source":a.States[i].ID,"Target":trapID,"x":0,"y":0, Labels:[]};
        a.States[i].Transitions.push(transition);  
      }  
      // add labels to transition
      for(var z=0; z < labels.length; z++){
        transition.Labels.push(labels[z]);
      }
      transition.Labels.sort(); // sort alphabetically
    }
  }

  // auto layout trap state if created this time
  if(trapCreated){
    var r = autoLayoutAutomaton(a,false,false,trapID);
    if(r.result == "OK"){
      a = r.automaton;
    }
  }    

  removeUnusedAutomatonStates(a);
  a.States.sort(function(a,b){
    if(a.ID < b.ID) return -1;
    if(a.ID > b.ID) return 1;
    return 0;
   });
  return {"result":"OK", "automaton":a, "trapID":trapID};
}


function completeMEALY(automaton){
  var a = automaton; // use the same automaton directly

  // find an existing trap state
  var trapID = -1;
  var trapCreated = false;
  for(var i=0; i < a.States.length; i++){
    if(a.States[i].Final) continue; // trap state cannot be a final state
    if(a.States[i].Transitions.length == 0 || 
      (a.States[i].Transitions.length == 1 && a.States[i].Transitions[0].Target == a.States[i].ID)){
      // state has none transitions or only one to it self
      // use this state as trap state
      trapID = a.States[i].ID;
    }
  }
  // if no trap state found, create one
  if(trapID == -1){
    var trapName = "TRAP";
    var changed = true;
    var trapIDCounter = 1;
    // find a proper name which is unused yet
    while(changed){
      changed = false;
      for(var i=0; i < a.States.length; i++){
        if(a.States[i].Name == trapName){
          trapName = "TRAP"+trapIDCounter++;
          changed = true;
          break;
        }
      }
    }
    // find a new, unused ID for the state 
    for(var z=0; z < a.States.length; z++){ 
      trapID = Math.max(trapID, a.States[z].ID);
    }
    trapID = trapID + 1; // use next number
    // add the state to automaton
    a.States.push({ID:trapID, Name:trapName, x:0, y:0, Final:false, Radius:30, Transitions:[]});
    trapCreated = true;
  }
  
  // we have a trap state now, create all transitions with missing labels to it
  for(var i=0; i < a.States.length; i++){
    var labels = a.Alphabet.slice(0); // copy entire alphabet array
    // remove already used characters
    for(var z=0; z < a.States[i].Transitions.length; z++){
      for(var x=0; x < a.States[i].Transitions[z].Labels.length; x++){
        var p = labels.indexOf(a.States[i].Transitions[z].Labels[x][0]);
        if(p != -1) labels.splice(p,1); // remove character from the list
      }
    }

    // there are missing labels, so add a transition to trap state
    if(labels.length > 0){
      var transition = null;
      // check if we already have a transition to trap
      for(var z=0; z < a.States[i].Transitions.length; z++){
        if(a.States[i].Transitions[z].Target == trapID){
          transition = a.States[i].Transitions[z];
          break;
        }
      }
      // create transition if not exists
      if(!transition){
        transition = {"Source":a.States[i].ID,"Target":trapID,"x":0,"y":0, Labels:[]};
        a.States[i].Transitions.push(transition);  
      }  
      // add labels to transition
      for(var z=0; z < labels.length; z++){
        transition.Labels.push([labels[z],""]);
      }
      
      transition.Labels.sort(function(a,b){
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
      }); // sort alphabetically
    }
  }

  // auto layout trap state if created this time
  if(trapCreated){
    var r = autoLayoutAutomaton(a,false,false,trapID);
    if(r.result == "OK"){
      a = r.automaton;
    }
  }    
  removeUnusedAutomatonStates(a);
  return {"result":"OK", "automaton":a, "trapID":trapID};
}





