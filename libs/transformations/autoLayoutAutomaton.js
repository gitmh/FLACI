function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function ptLineDistSq ( x1,  y1,  x2,  y2, px,  py){
  var pd2 = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
  var x, y;
  if (pd2 == 0) {
    // Points are coincident.
    x = x1;
    y = y2;
  } else {
    var u = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / pd2;
    x = x1 + u * (x2 - x1);
    y = y1 + u * (y2 - y1);
  }
  return (x - px) * (x - px) + (y - py) * (y - py);
}

function ptLineDist ( x1,  y1,  x2,  y2, px,  py){
  var r = Math.sqrt(ptLineDistSq(x1, y1, x2, y2, px, py));
  if(px < x1 && px < x2) return 999999; // not on line anymore
  if(px > x1 && px > x2) return 999999; // not on line anymore
  if(py < y1 && py < y2) return 999999; // not on line anymore
  if(py > y1 && py > y2) return 999999; // not on line anymore
  return r;
}

function lineIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
  var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
  var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
  if (isNaN(x)||isNaN(y)) {
    return false;
  } else {
    if (x1>=x2) {
      if (!(x2<=x&&x<=x1)) {return false;}
    } else {
      if (!(x1<=x&&x<=x2)) {return false;}
    }
    if (y1>=y2) {
      if (!(y2<=y&&y<=y1)) {return false;}
    } else {
      if (!(y1<=y&&y<=y2)) {return false;}
    }
    if (x3>=x4) {
      if (!(x4<=x&&x<=x3)) {return false;}
    } else {
      if (!(x3<=x&&x<=x4)) {return false;}
    }
    if (y3>=y4) {
      if (!(y4<=y&&y<=y3)) {return false;}
    } else {
      if (!(y3<=y&&y<=y4)) {return false;}
    }
  }
  if(x1 == x3 && y1 == y3) return false;
  if(x1 == x4 && y1 == y4) return false;
  if(x2 == x3 && y2 == y3) return false;
  if(x2 == x4 && y2 == y4) return false;
  return true;
}


function autoLayoutAutomaton (automaton,rename,transitionsOnly,onlyOneState) {
  if(window.skipAutoLayout) return {"result":"OK","automaton":automaton};

  function getTransitionDistance(a,t,verbose){
    var s1 = null;
    var s2 = null;
    for(var i=0; i < a.States.length; i++){ 
      if(a.States[i].ID == t.Source) s1 = a.States[i];
      if(a.States[i].ID == t.Target) s2 = a.States[i];
    }
    if(s1 && s2){
      var d = Math.sqrt( (s2.x-s1.x)*(s2.x-s1.x) + (s2.y-s1.y)*(s2.y-s1.y) );
      if(verbose) console.log("Distance "+s1.Name+" <-> "+s2.Name+" = "+d);
      return d;
    }
    if(verbose) console.log("Distance = error not found");
    return 999999;
  }

  function hasTransitionTo(s1,s2){
    for(var i=0; i < s1.Transitions.length; i++)
      if(s1.Transitions[i].Target == s2.ID) return s1.Transitions[i];
    return null;
  }

  function getPointOnBezier (s1,s2,t1,t2,t){
    var Ax = ( (1 - t) * s1.x ) + (t * t1.x);
    var Ay = ( (1 - t) * s1.y ) + (t * t1.y);
    var Bx = ( (1 - t) * t1.x ) + (t * t2.x);
    var By = ( (1 - t) * t1.y ) + (t * t2.y);
    var Cx = ( (1 - t) * t2.x ) + (t * s2.x);
    var Cy = ( (1 - t) * t2.y ) + (t * s2.y);
    var Dx = ( (1 - t) * Ax ) + (t * Bx);
    var Dy = ( (1 - t) * Ay ) + (t * By);
    var Ex = ( (1 - t) * Bx ) + (t * Cx);
    var Ey = ( (1 - t) * By ) + (t * Cy);
    var Px = ( (1 - t) * Dx ) + (t * Ex);
    var Py = ( (1 - t) * Dy ) + (t * Ey);    
    return {x:+Px.toFixed(2), y:+Py.toFixed(2)};
  }

  function getAngleRad (p1,p2,add){
    return Math.atan2(p2.y - p1.y, p2.x - p1.x)+(add ? (add / 180 * Math.PI ): 0);
  }

  function getIntersectionsPenality(a, t, verbose){
    var s1 = null;
    var s2 = null;
    for(var i=0; i < a.States.length; i++){ 
      if(a.States[i].ID == t.Source) s1 = a.States[i];
      if(a.States[i].ID == t.Target) s2 = a.States[i];
    }
    // Übergänge auf sich selbst sollten niemals durch andere Übergänge gekreuzt werden
    if(s1 && s2){
      var t1 = hasTransitionTo(s1,s1);
      if(t1 && t1.y == -40 && s1.y > s2.y && Math.abs(s2.x-s1.x) <= 220) {
        if(verbose) console.log("Penality crossing self "+s1.Name+" <-> "+s2.Name); 
        return 999999; 
      }
      if(t1 && t1.y ==  40 && s1.y < s2.y && Math.abs(s2.x-s1.x) <= 220) {
        if(verbose) console.log("Penality crossing self "+s1.Name+" <-> "+s2.Name); 
        return 999999; 
       }
      if(t1 && t1.x ==  40 && s1.x < s2.x && Math.abs(s2.y-s1.y) <= 220) {
        if(verbose) console.log("Penality crossing self "+s1.Name+" <-> "+s2.Name); 
        return 999999; 
      }
      if(t1 && t1.x == -40 && s1.x > s2.x && Math.abs(s2.y-s1.y) <= 220) {
        if(verbose) console.log("Penality crossing self "+s1.Name+" <-> "+s2.Name); 
        return 999999; 
      }

      var t2 = hasTransitionTo(s2,s2);
      if(t2 && t2.y == -40 && s1.y < s2.y && Math.abs(s2.x-s1.x) <= 220) {
        if(verbose) console.log("Penality crossing self "+s1.Name+" <-> "+s2.Name);  
        return 999999; 
      }
      if(t2 && t2.y ==  40 && s1.y > s2.y && Math.abs(s2.x-s1.x) <= 220) {
        if(verbose) console.log("Penality crossing self "+s1.Name+" <-> "+s2.Name); 
        return 999999; 
      }
      if(t2 && t2.x ==  40 && s1.x > s2.x && Math.abs(s2.y-s1.y) <= 220) {
        if(verbose) console.log("Penality crossing self "+s1.Name+" <-> "+s2.Name); 
        return 999999; 
      }
      if(t2 && t2.x == -40 && s1.x < s2.x && Math.abs(s2.y-s1.y) <= 220) {
        if(verbose) console.log("Penality crossing self "+s1.Name+" <-> "+s2.Name); 
        return 999999; 
      }
      
    }
    // Gebogene Übergänge sollten nicht in Zustandsnähe sein (Mittelpunkt)
    if(s1 != s2 && t.x != 0){
      // gebogener Übergang, Mittelpunkt berechnen
      var dis = t.y+t.x;
      var d = Math.sqrt((s2.x-s1.x)*(s2.x-s1.x) + (s2.y-s1.y)*(s2.y-s1.y));
      var angle = getAngleRad(s1,s2);
      var middle = {x:(s1.x + s2.x)/2, y:(s1.y + s2.y)/2};
      var cubicBezierValue = 2;
      var mx1 = (Math.cos(angle-Math.PI/2)*dis+s1.x) + (Math.cos(angle)*d/8)*cubicBezierValue;
      var my1 = (Math.sin(angle-Math.PI/2)*dis+s1.y) + (Math.sin(angle)*d/8)*cubicBezierValue;
      var mx2 = (Math.cos(angle-Math.PI/2)*dis+s2.x) - (Math.cos(angle)*d/8)*cubicBezierValue;
      var my2 = (Math.sin(angle-Math.PI/2)*dis+s2.y) - (Math.sin(angle)*d/8)*cubicBezierValue;
        
      t.pathPoints = [{x:+mx1.toFixed(2),y:+my1.toFixed(2)},{x:+mx2.toFixed(2),y:+my2.toFixed(2)}];

      var p = getPointOnBezier (s1,s2,t.pathPoints[0],t.pathPoints[1],0.5);

      for(var i=0; i < a.States.length; i++){ 
        if(a.States[i] == s1 || a.States[i] == s2) continue;
        var d = Math.sqrt( (a.States[i].x - p.x)*(a.States[i].x - p.x) + (a.States[i].y - p.y)*(a.States[i].y - p.y) );
        if(d < 200) {
          if(verbose) console.log("Penality bend transition "+s1.Name+" <-> "+s2.Name+" too close to "+a.States[i].Name);
          return 3333+(2000-d*10);
        }
      }    
    }

    // Übergänge sollen niemals andere Zustände durchkreuzen
    for(var i=0; i < a.States.length; i++){ 
      if(a.States[i] == s1 || a.States[i] == s2) continue;

      var d = ptLineDist(s1.x,s1.y,s2.x,s2.y,a.States[i].x,a.States[i].y);
      
      if(d == 0) {if(verbose) console.log("Penality crossing state "+s1.Name+" <-> "+s2.Name+" crosses "+a.States[i].Name); return 999999; }
      if(d <  50) {if(verbose) console.log("Penality crossing almost state "+s1.Name+" <-> "+s2.Name+" crosses "+a.States[i].Name); return 1000; }
    }

    // Übergänge zwischen Zuständen sollten sich wenn möglich nicht kreuzen
    for(var i=0; i < a.States.length; i++){ 
      if(a.States[i] == s1 || a.States[i] == s2) continue;
      // Schnittpunkte bestimmen zwischen anderen Übergängen bestimmen 
      for(var z=0; z < a.States[i].Transitions.length; z++){
        var t1, t2;
        for(var t=0; t < a.States.length; t++){ 
          if(a.States[t].ID == a.States[i].Transitions[z].Source) t1 = a.States[t];
          if(a.States[t].ID == a.States[i].Transitions[z].Target) t2 = a.States[t];
        }
        // 4 Punkte s1,s2,t1,t2 
        if(lineIntersect(s1.x,s1.y,s2.x,s2.y,t1.x,t1.y,t2.x,t2.y)) { 
          if(verbose) console.log("Penality crossing transitions "+s1.Name+" <-> "+s2.Name+" crosses "+t1.Name+" <-> "+t2.Name); 
          return 3333;
        }
      } 
    }

    return 0; // keine Penality
  }

  function calculateLayoutValue(a,verbose){
    var sum = 0;
    for(var i=0; i < a.States.length; i++){
      if(a.States[i].Start){ 
        var t1 = hasTransitionTo(a.States[i],a.States[i]);
        if(t1 && t1.x == -40) sum += 999999; // Kringel nicht um Start machen
      }
      for(var z=0; z < a.States[i].Transitions.length; z++){
        //if((a.States[i].x-150) % 200 != 0 || (a.States[i].y-200) % 200 != 0) sum += 500;
  

        if(a.States[i].Transitions[z].Target != a.States[i].ID)
          sum += getTransitionDistance(a,a.States[i].Transitions[z],verbose);
        sum += getIntersectionsPenality(a,a.States[i].Transitions[z],verbose);
      }
    }
    return sum;
  }


  var usedCombinations = [];

  function makeLayoutTry() {
    var a = JSON.parse(JSON.stringify(automaton)); // make a copy first
    // Schritt 1: Zustände neu mischen
    shuffle(a.States);

    for(var i=1; i < a.States.length; i++){
      if(a.States[i].Start ){
        var t = a.States[0];
        a.States[0] = a.States[i];  
        a.States[i] = t;
        break;
      } 
    }
    if(a.States.length > 0){
      a.States[0].x = 150;
      a.States[0].y = 150;
    }

    // Schritt 2: Zustände neu platzieren
    var freePlaces = [];
    var gridsize = Math.ceil(Math.sqrt(a.States.length));
    for(var i=0; i < gridsize+1; i++) { // eins mehr in X erlauben
      for(var z=0; z < gridsize; z++) {
        if(i == 0 && z == 0) continue;
        freePlaces.push({x:150+220*i,y:150+220*z});
      }
    }    

    for(var i=0; i < a.States.length; i++){
      if(rename) a.States[i].Name = "q"+(i);
      if(i > 0){
        var p = Math.floor(Math.random()*freePlaces.length);
        var n = freePlaces.splice(p,1);
      
        a.States[i].x = n[0].x;
        a.States[i].y = n[0].y;
      }

      for(var z=0; z < a.States[i].Transitions.length; z++){
        a.States[i].Transitions[z].x = 0;
        a.States[i].Transitions[z].y = 0;
      }
    }

    var combination = "";
    for(var i=0; i < a.States.length; i++){
      combination += a.States[i].ID+"|"+a.States[i].x+"|"+a.States[i].y+",";
    }

    if(usedCombinations.indexOf(combination) != -1) return;
    usedCombinations.push(combination);

    // Neu ausrichten der Selbstübergänge
    for(var i=0; i < a.States.length; i++){
      for(var z=0; z < a.States[i].Transitions.length; z++){
        if(a.States[i].Transitions[z].Source == a.States[i].Transitions[z].Target) {
          var directions = [{x:0,y:-40},{x:0,y:-40},{x:40,y:0},{x:-40,y:0}];
          var r = Math.floor(Math.random()*directions.length);
          var t = directions.splice(r,1);
          var best = t[0];
          a.States[i].Transitions[z].x = best.y;
          a.States[i].Transitions[z].y = best.x;
          var before = calculateLayoutValue(a);

          while(directions.length > 0){
            r = Math.floor(Math.random()*directions.length);
            t = directions.splice(r,1);
            a.States[i].Transitions[z].x = t[0].y;
            a.States[i].Transitions[z].y = t[0].x;
            var after = calculateLayoutValue(a);
            if(before > after) {before = after; best = t[0]; }
          }

          a.States[i].Transitions[z].x = best.y;
          a.States[i].Transitions[z].y = best.x;
        }
      }
    }

    return {"automaton":a,"sum":calculateLayoutValue(a) };
  }


  function makeLayoutTryOneState(s) {
    var a = JSON.parse(JSON.stringify(automaton)); // make a copy first
    // Schritt 1: Zustände neu mischen
    shuffle(a.States);
    var state = null;
    for(var i=0; i < a.States.length; i++){
      if(a.States[i].ID == s){
        state = a.States[i];
        break;
      } 
    }

    // Schritt 2: Freie Plätze suchen
    var freePlaces = [];
    var gridsize = Math.ceil(Math.sqrt(a.States.length));
    for(var i=0; i < gridsize+1; i++) { // eins mehr in X erlauben
      for(var z=0; z < gridsize; z++) {
        if(i == 0 && z == 0) continue;
        var free = true;
        for(var x=0; x < a.States.length; x++){
          if(a.States[x].x == 150+220*i && a.States[x].y == 150+220*z) {free = false; break;}
        }
        if(free) freePlaces.push({x:150+220*i,y:150+220*z});
      }
    }

    var p = Math.floor(Math.random()*freePlaces.length);
    state.x = freePlaces[p].x;
    state.y = freePlaces[p].y;
    var rearange = [];
    for(var i=0; i < a.States.length; i++){
      for(var z=0; z < a.States[i].Transitions.length; z++){
        if(a.States[i].Transitions[z].Source == state.ID || a.States[i].Transitions[z].Target == state.ID){
          a.States[i].Transitions[z].x = 0;
          a.States[i].Transitions[z].y = 0;
          rearange.push(a.States[i].Transitions[z]);
        }
      }
    }

    // Neu ausrichten der Selbstübergänge
    for(var i=0; i < a.States.length; i++){
      for(var z=0; z < a.States[i].Transitions.length; z++){
        if(rearange.indexOf(a.States[i].Transitions[z]) == -1) continue;

        if(a.States[i].Transitions[z].Source == a.States[i].Transitions[z].Target) {
          var directions = [{x:0,y:-40},{x:0,y:-40},{x:40,y:0},{x:-40,y:0}];
          var r = Math.floor(Math.random()*directions.length);
          var t = directions.splice(r,1);
          var best = t[0];
          a.States[i].Transitions[z].x = best.y;
          a.States[i].Transitions[z].y = best.x;
          var before = calculateLayoutValue(a);

          while(directions.length > 0){
            r = Math.floor(Math.random()*directions.length);
            t = directions.splice(r,1);
            a.States[i].Transitions[z].x = t[0].y;
            a.States[i].Transitions[z].y = t[0].x;
            var after = calculateLayoutValue(a);
            if(before > after) {before = after; best = t[0]; }
          }

          a.States[i].Transitions[z].x = best.y;
          a.States[i].Transitions[z].y = best.x;
        }
      }
    }

    return {"automaton":a,"sum":calculateLayoutValue(a) };
  }

  var a = null;
  if(!transitionsOnly && !onlyOneState){
    var tries = [];
    var maxTries = Math.ceil(1000 / automaton.States.length);
    for(var i=0; i < maxTries; i++) tries.push(makeLayoutTry());

    tries.sort(function(a,b){ return a.sum - b.sum; }); 

    a = tries[0].automaton;
  }else{
    if(onlyOneState){
      var tries = [];
      for(var i=0; i < 100; i++) tries.push(makeLayoutTryOneState(onlyOneState));
      tries.sort(function(a,b){ return a.sum - b.sum; }); 
      a = tries[0].automaton;
    }else
      a = automaton; // direkt den vorhandenen Automaten verwenden 
  }
  // Schritt 3: Übergänge neu ausrichten
  function arrangeTransitions(s1,s2,distance){
    if(s1 && s2 && s1.ID == s2.ID){
      // Übergang auf sich selbst
      return;
    }
    if(distance == 0 && s1 && s2 && hasTransitionTo(s1,s2) && hasTransitionTo(s2,s1)){
      var trans1 = hasTransitionTo(s1,s2); 
      trans1.x = 50;
      trans1.y = 0;
      var trans2 = hasTransitionTo(s2,s1); 
      trans2.x = 50;
      trans2.y = 0;
      return;
    }
    if(s1 && s2 && hasTransitionTo(s1,s2) && hasTransitionTo(s2,s1)){
      var trans1 = hasTransitionTo(s1,s2); 
      trans1.x = 55*distance;
      trans1.y = 0;
      var trans2 = hasTransitionTo(s2,s1); 
      trans2.x = 55*distance;
      trans2.y = 0;
      return;
    }
    if(s1 && s2 && hasTransitionTo(s1,s2) && s1.x != s2.x && s1.y != s2.y ){
      var trans = hasTransitionTo(s1,s2); 
      // Einzelbiegungen immer so, dass keine Zustände gekreuzt werden wenn geht
      var v0  = calculateLayoutValue(a);
      trans.x = 55*distance;
      trans.y = 0;
      var v1  = calculateLayoutValue(a);
      trans.x = -55*distance;
      var v2  = calculateLayoutValue(a);
      if(v2 > v1) 
        trans.x = 55*distance;
      if(v2 >= v0 && v1 >= v0) 
        trans.x = 0;
      return;
    }
    if(s1 && s2 && hasTransitionTo(s2,s1) && s1.x != s2.x && s1.y != s2.y){
      var trans = hasTransitionTo(s2,s1); 
      var v0  = calculateLayoutValue(a);
      trans.x = 55*distance;
      trans.y = 0;
      var v1  = calculateLayoutValue(a);
      trans.x = -55*distance;
      var v2  = calculateLayoutValue(a);
      if(v2 > v1) 
        trans.x = 55*distance;
      if(v2 >= v0 && v1 >= v0) 
        trans.x = 0;
      return;
    }
  }

  for(var i=0; i < a.States.length; i++){
    for(var z=0; z < a.States.length; z++){
      if(onlyOneState && a.States[z].ID != onlyOneState && a.States[i].ID != onlyOneState) continue;

      var d = Math.sqrt( (a.States[z].x-a.States[i].x)*(a.States[z].x-a.States[i].x) + (a.States[z].y-a.States[i].y)*(a.States[z].y-a.States[i].y) );
      arrangeTransitions(a.States[i],a.States[z],Math.floor(d/220)-1);
    }
  }

  console.log("-------------------");
  console.log("-> Total:"+calculateLayoutValue(a,true));
  return {"result":"OK","automaton":a};

}



