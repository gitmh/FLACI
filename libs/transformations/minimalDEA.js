
function DEAtoMinimalDEA (automaton, rename){
  var a = automaton; 
  removeUnusedAutomatonStates(a);
 
  // Schritt 1: 2D Matrix erstellen 
  var M = [];
  for(var i=0; i < a.States.length; i++) {
    M[i] = [];
  }

  // Schritt 2: Felder markieren wo genau einer von beiden ein Endzustand ist
  for(var i=0; i < a.States.length; i++) 
    for(var z=0; z < a.States.length; z++) {
      M[i][z] = false;
      // die untere hälfte der Tabelle ist immer X
      if(z > i) M[i][z] = true;
      if(a.States[i].Final == true && a.States[z].Final == false ) M[i][z] = true;
      if(a.States[z].Final == true && a.States[i].Final == false ) M[i][z] = true;
    }
 
  // Hilfsfunktion für Schritt 3
  function findTargetIndexForInput(state,character){
    for(var i=0; i < state.Transitions.length; i++)
      for(var z=0; z < state.Transitions[i].Labels.length; z++)
        if(state.Transitions[i].Labels[z] == character){
          // Übergang gefunden mit dem Zeichen
          var ID = state.Transitions[i].Target;
          // Zustandsindex bestimmten
          for(var w=0; w < a.States.length; w++) if(a.States[w].ID == ID) return w;
        }
    return -1; // nicht gefunden
  }
  
  // Schritt 3: Für jedes unmarkierte Paar teste, ob für ein Zeichen ein gemeinsames bereits markiertes Paar existiert
  var changed = true;
  var p = null;
  while(changed){
    changed = false;
    for(var i=0; i < a.States.length; i++) 
      for(var z=0; z < a.States.length; z++) 
        if(z < i && M[i][z] == false){
          var s1 = a.States[i];
          var s2 = a.States[z];
          for(var w=0; w < a.Alphabet.length; w++){
            var z1 = findTargetIndexForInput(s1, a.Alphabet[w]);
            var z2 = findTargetIndexForInput(s2, a.Alphabet[w]);
            if(z1 == -1 || z2 == -1) continue; // es gibt keinen Übergang mit dem Zeichen
            if((z1 > z2 && M[z1][z2]) || (z1 < z2 && M[z2][z1])) { M[i][z] = true; changed = true; }
          }
        } 
  }
  // Schritt 4: solange wiederholen bis changed == false      

  // Schritt 5: Unmarkierte Zustände verschmelzen
  for(var i=0; i < a.States.length; i++) 
    for(var z=0; z < a.States.length; z++) {
      if(z < i && M[i][z] == false){
        // i und z verschmelzen zu i
        var s1 = a.States[z];
        var s2 = a.States[i];
          
        for(var w=0; w < s2.Transitions.length; w++){
          var isThere = null;
          for(var t=0; t < s1.Transitions.length; t++){
            if(s1.Transitions[t].Target == s2.Transitions[w].Target) isThere = s1.Transitions[t];
          }        
          if(isThere == null){
            s2.Transitions[w].Source = s1.ID;
            s1.Transitions.push(s2.Transitions[w]); // Übergang umhängen
            isThere = s2.Transitions[w];
          }
          for(var t=0; t < s2.Transitions[w].Labels.length; t++){
            var isLabel = false;
            for(var k=0; k < isThere.Labels.length; k++){
              if(s2.Transitions[w].Labels[t] == isThere.Labels[k]) isLabel = true; 
            }
            if(isLabel == false)
              isThere.Labels.push(s2.Transitions[w].Labels[t]);
          }
        }   
        s1.Name = s1.Name+"+"+s2.Name;     
        if(s2.Start) s1.Start = true; // Startzustand
        
        for(var w=0; w < a.States.length; w++){
          var isThere = null;
          for(var t=0; t < a.States[w].Transitions.length; t++){
            if(a.States[w].Transitions[t].Target == s1.ID) isThere = a.States[w].Transitions[t];
          }
          for(var t=0; t < a.States[w].Transitions.length; t++){
            if(a.States[w].Transitions[t].Target == s2.ID) {
              if(!isThere) {
                a.States[w].Transitions[t].Target = s1.ID; // einfach umbenennen das Ziel
              } else {
                // Verbindung besteht schon, nur fehlende Labels ergänzen
                for(var x=0; x < a.States[w].Transitions[t].Labels.length; x++) {
                  var isLabel = false;
                  for(var y=0; y < isThere.Labels.length; y++) 
                    if(isThere.Labels[y] == a.States[w].Transitions[t].Labels[x]) isLabel = true;
                  if(!isLabel) isThere.Labels.push(a.States[w].Transitions[t].Labels[x]);
                }  
                a.States[w].Transitions.splice(t,1); t--;
              }
            }
          }
        }
        s2.ID = -1; // löschen wir später
      }
    }
    
  // nicht mehr benötigte Zustände entfernen  
  for(var i=0; i < a.States.length; i++){
    if(a.States[i].ID == -1){ 
      a.States.splice(i,1); i--; 
    }
  }
  a.Alphabet.sort();
  a.States.sort(function(a,b){
    if(a.ID < b.ID) return -1;
    if(a.ID > b.ID) return 1;
    return 0;
   });

  // labels wieder alphabetisch ordnen, falls durcheinander
  for(var w=0; w < a.States.length; w++){
    for(var t=0; t < a.States[w].Transitions.length; t++){
      a.States[w].Transitions[t].Labels.sort();
    }
  }
  // Zustände neu benennen, nach Übergängen alphabetisch geordnet, 
  // um immer identische Benennung zu erhalten (isomorphe Automaten)
  if(rename){
    var na = JSON.parse(JSON.stringify(a));
    var start = null;
    for(var i=0; i < a.States.length; i++){
      if(a.States[i].Start) start = a.States[i];
      a.States[i].Transitions.sort(function(a,b){
        var s1 = a.Labels.join(""); 
        var s2 = b.Labels.join(""); 
        return (s1).localeCompare(s2);
      });
    }
    if(start){
      var counter = 0;
      var s = {ID:(counter+1),Name:"q"+counter,Transitions:[],Start:true,Final:start.Final};
      na.States = [s];

      function findStateByID(a,id){
        for(var i=0; i < a.States.length; i++){
          if(a.States[i].ID == id) return a.States[i];
        }
        return null;
      } 
      
      var oldNew = [];
      oldNew[start.ID] = s.ID;

      function replaceTransitions(from){
        var newStatesCreated = false;
        for(var i=0; i < from.Transitions.length; i++){
          var ts = findStateByID(a,from.Transitions[i].Target);
          if(!oldNew[ts.ID]){
            counter++;
            var ns = {ID:(counter+1),Name:"q"+counter, Transitions:[],Final:ts.Final};
            na.States.push(ns);
            oldNew[ts.ID] = ns.ID;
            newStatesCreated = true;
            replaceTransitions(ts);
          }
          var tt = findStateByID(na,oldNew[from.ID]);
          var t = {Source:tt.ID, Target:oldNew[ts.ID], Labels:from.Transitions[i].Labels};
          tt.Transitions.push(t);
        }
      }
      replaceTransitions(start);

      // neuen Automat verwenden
      a = na;
    }
  }
  return {"result":"OK", "automaton":a};  
}       

