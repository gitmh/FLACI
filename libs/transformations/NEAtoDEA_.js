
function NEAtoDEA(automaton){
  var a = automaton;

  // Schritt 1: Liste mit allen neuen Zuständen für DEA konstruieren

  var IDs = [];
  for(var i=0; i < a.States.length; i++) 
    if(a.States[i].Start) 
      IDs.unshift(a.States[i].ID); else // Startzustand ganz vorn hinstellen
      IDs.push(a.States[i].ID);

  // aus ["1", "2", "3"] wird ["1", "2", "1|2", "3", "1|3", "2|3", "1|2|3"]
  function arrayCombinations(array) {
    var fn = function(active, rest, a) {
      if (active.length == 0 && rest.length == 0)
        return;
      if (rest.length == 0) {
        a.push(active);
      } else {
        fn(active, rest.slice(1), a);
        fn(rest[0] + (active != "" ? "|":"") + active, rest.slice(1), a);
      }
      return a;
    }
    return fn("", array.reverse(), []);
  }

  var cs = arrayCombinations(IDs);
  cs.push(""); // leeres Array am Schluss

  var b = JSON.parse(JSON.stringify(automaton)); // noch eine Kopie erstellen
  b.States = []; // alle Zustände löschen, Alphabet bleibt erhalten

  function sameArrayContent (a1, a2){
    a1.sort();
    a2.sort();
    return a1.join("|") === a2.join("|");
  }

  // Schritt 2: neuen Zustände anlegen, erster Zustand ist wieder Startzustand
  for(var i=0; i < cs.length; i++){
    // Endzustand, wenn einer der Zustände aus dem Ursprungsautomaten Endzustand war
    var fin = false;
    var ids = cs[i].split("|"); 
    var currentStates = [];
    for(var w=0; w < ids.length; w++)
      for(var z=0; z < a.States.length; z++) {
        if(a.States[z].ID == ids[w]) currentStates.push(a.States[z]);
        if(a.States[z].ID == ids[w] && a.States[z].Final) fin = true;
      }
    var s = {"ID":(i+1), "Name":"q"+(i),"x":150+(i%5)*200, "y":150+(Math.floor(i/5))*200, "Start":i == 0, "Final":fin, "Radius":30, "Transitions":[]};
    b.States.push(s);

    // Übergänge anlegen
    
      // für jedes Zeichen alle Ziel-Zustände suchen
    for(var z=0; z < a.Alphabet.length; z++) {
      var oldIDs = [];
      for (var c = 0; c < currentStates.length; c++){
        for(var w=0; w < currentStates[c].Transitions.length; w++) {
          if(currentStates[c].Transitions[w].Labels.indexOf(a.Alphabet[z]) != -1 && 
             oldIDs.indexOf(currentStates[c].Transitions[w].Target) == -1) 
            oldIDs.push(currentStates[c].Transitions[w].Target);
        }
      }
      // in oldIDs sind nun alle alten Zielzustände für das Eingabezeichen, neuen Zustandsnamen suchen
      var target = 0;
      for(var w=0; w < cs.length; w++) {
        if(sameArrayContent(cs[w].split("|"),oldIDs)){ target = w+1; break;}// neue Zustands ID 
        if(cs[w] == "" && oldIDs.length == 0) { target = w+1; break;}
      } 
      
      var isThere = null;
      for(var w=0; w < s.Transitions.length; w++) {
        if(s.Transitions[w].Target == target) { isThere = s.Transitions[w]; break; }
      }
      if(!isThere){
        // neuen Übergang anlegen
        var isThere = {"Source":(i+1), "Target":target, "x":0, "y":0, "Labels":[]};
        s.Transitions.push(isThere);
      }
      if(isThere.Labels.indexOf(a.Alphabet[z]) == -1) isThere.Labels.push(a.Alphabet[z]);
    }
  }

  return {"result":"OK", "automaton":b};  
}       
