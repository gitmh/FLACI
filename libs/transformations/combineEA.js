function combineEA(a1, a2){
  a1 = JSON.parse(JSON.stringify(a1)); // make a copy now
  a2 = JSON.parse(JSON.stringify(a2)); // make a copy now

  function findStateByName(a,n){
    for(var i=0; i < a.States.length; i++){
      if(a.States[i].Name == n) return a.States[i];
    }
    return null;
  }
  function findStateByID(a,id){
    for(var i=0; i < a.States.length; i++){
      if(a.States[i].ID == id) return a.States[i];
    }
    return null;
  }

  // Zr = Z1 + Z2

  // Add characters from Z A1 all missing characters from A2 
  // and add trap state for all new chars
  var stateID = 0;
  var newTrapState = null;
  for (var i1 = 0; i1 < a1.States.length; i1++){
    stateID = Math.max(stateID,a1.States[i1].ID);
  }
  for (var i1 = 0; i1 < a1.Alphabet.length; i1++){
    for (var i2 = 0; i2 < a2.Alphabet.length; i2++){
      if(a1.Alphabet.indexOf(a2.Alphabet[i2]) == -1){
        // missing character
        a1.Alphabet.push(a2.Alphabet[i2]);
        if(!newTrapState) {
          stateID++
          newTrapState = {"ID":stateID, "Start":false, "Final": false, "Name": "Trap", "Transitions" : [], "Radius": 30};
          a1.States.push(newTrapState);
        }

        for(var i=0; i < a1.States.length; i++){
          if(a1.States[i].ID == newTrapState.ID) continue;
          var hasTransition = false;
          for(var z=0; z < a1.States[i].Transitions.length; z++){
            if(a1.States[i].Transitions[z].Target == newTrapState.ID){
              hasTransition = a1.States[i].Transitions[z];
              break;
            }
          }
          if(!hasTransition){
            hasTransition = {"Source" : a1.States[i].ID, "Target" : newTrapState.ID, "Labels":[]};
            a1.States[i].Transitions.push(hasTransition);
          }
          hasTransition.Labels.push(a2.Alphabet[i2]);
        }
      }
    }
  }  
  if(newTrapState){
    var trans = {"Source":newTrapState.ID, "Target":newTrapState.ID, "Labels" : a1.Alphabet};
    newTrapState.Transitions.push(trans);
  }

  // Add characters from Z A2 all missing characters from A1 
  // and add trap state for all new chars
  stateID = 0;
  newTrapState = null;
  for (var i2 = 0; i2 < a2.States.length; i2++){
    stateID = Math.max(stateID,a2.States[i2].ID);
  }
  for (var i2 = 0; i2 < a2.Alphabet.length; i2++){
    for (var i1 = 0; i1 < a1.Alphabet.length; i1++){
      if(a2.Alphabet.indexOf(a1.Alphabet[i1]) == -1){
        // missing character
        a2.Alphabet.push(a1.Alphabet[i1]);
        if(!newTrapState) {
          stateID++;
          newTrapState = {"ID":stateID, "Start":false, "Final": false, "Name": "Trap", "Transitions" : [], "Radius": 30};
          a2.States.push(newTrapState);
        }
        for(var i=0; i < a2.States.length; i++){
          if(a2.States[i].ID == newTrapState.ID) continue;
          var hasTransition = false;
          for(var z=0; z < a2.States[i].Transitions.length; z++){
            if(a2.States[i].Transitions[z].Target == newTrapState.ID){
              hasTransition = a2.States[i].Transitions[z];
              break;
            }
          }
          if(!hasTransition){
            hasTransition = {"Source" : a2.States[i].ID, "Target" : newTrapState.ID, "Labels":[]};
            a2.States[i].Transitions.push(hasTransition);
          }
          hasTransition.Labels.push(a1.Alphabet[i1]);
        }
      }
    }
  }  
  if(newTrapState){
    var trans = {"Source":newTrapState.ID, "Target":newTrapState.ID, "Labels" : a2.Alphabet};
    newTrapState.Transitions.push(trans);
  }

  // build new result automaton

  var r = {"Alphabet" : [], "Type":a1.Type, "States": []};

  for (var i1 = 0; i1 < a1.Alphabet.length; i1++){
    r.Alphabet.push(a1.Alphabet[i1]);
  }

  // build new states
  stateID = 0;
  for (var i1 = 0; i1 < a1.States.length; i1++){
    for (var i2 = 0; i2 < a2.States.length; i2++){
      stateID++;
      var s = {"ID":stateID, "Start":false, "Final": false, "Name": a1.States[i1].Name+"-"+a2.States[i2].Name, "Transitions" : [], "Radius": 30};
      // if final in both automata than also here final
      if(a1.States[i1].Final && a2.States[i2].Final) s.Final = true;
      // if start in both automata than also here start
      if(a1.States[i1].Start && a2.States[i2].Start) s.Start = true;
      // remember where we came from
      s.fromA1 = a1.States[i1];
      s.fromA2 = a2.States[i2];
      r.States.push(s);
    }
  }

  // add transitions
  for (var i = 0; i < r.States.length; i++){
    var s = r.States[i];
    // for each alphabet character find target 
    for (var c = 0; c < r.Alphabet.length; c++){
      var cha = r.Alphabet[c];
      if(!s.fromA1.Transitions || !s.fromA2.Transitions) continue; 

      for(var t1 = 0; t1 < s.fromA1.Transitions.length; t1++){
        if(s.fromA1.Transitions[t1].Labels.indexOf(cha) != -1){
          for(var t2 = 0; t2 < s.fromA2.Transitions.length; t2++){
            if(s.fromA2.Transitions[t2].Labels.indexOf(cha) != -1){
              var target1 = findStateByID(a1,s.fromA1.Transitions[t1].Target);
              var target2 = findStateByID(a2,s.fromA2.Transitions[t2].Target);
              var targetNow = findStateByName(r,target1.Name + "-" + target2.Name);
              var newTransition = {Target:targetNow.ID, Source:s.ID, Labels:[cha]};
              var found = false;
              for(var ct=0; ct < s.Transitions.length; ct++){
                if(s.Transitions[ct].Source == s.ID && s.Transitions[ct].Target == targetNow.ID){
                  found = s.Transitions[ct];
                  break;
                }
              }
              if(found){
                if(found.Labels.indexOf(cha) == -1) found.Labels.push(cha);
              }else{
                s.Transitions.push(newTransition);                
              }
            }
          }
        }
      }
    }
  }
  // remove refernces now
  for (var i = 0; i < r.States.length; i++){
    delete r.States[i].fromA1;
    delete r.States[i].fromA2;
  }

  return {"result":"OK", "automaton":r};
}