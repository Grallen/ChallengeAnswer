///////////////////////////////////////////////////////////////////////////////////////////////////
//
//  "answer.js"
//  author: Justin Coombs (codeglitch@gmail.com)
//
//  Writen for node.js v0.10.13
//
//  Usage:
//    node answer.js testdata_01.txt
//
//  Purpose:
//    This script is an answer to a challenge question.  The question is appended at the end after the code.
//
//  Description:
//    This program takes Directed Graph data and generates a system of nodes with built in functions that
//    can be used calculate distanes of pre-definded path or to seek paths withing the graph that fulfill certain
//    criteria.  This criteria is controlled by the keeper and Die functions fed to the seek function.
//
//  Assumptions/Limitations:
//    - Edge length in the directed graph are greater than zero.  It might be able to handle some zeroes, but too many in a loop will cause it to quickly exceede maximum stack.
//    - There is only one edge joining two nodes (No "AB3, AB7").  The network is not designed to handle storing this.
//      If this is done, the second value will overwrite the first.
//    - Test data is properly formatted with no errors (No "AC5, AAQR, AB2").
//
//  Notes:
//    This took 7 hours to code.
//    I was torn initially between making a fast solution and a sophisticated one.
//    Both skills are valuable in a programmer, but given the nature of the reason for doing
//    this challenge, I chose to go with the more interesting approach.
//    Due to time restrictions, this has NOT been extensivly tested with data outside the test data providede with the challenge.
//    It would take a fair amount of time to concievecreate good test data.
//    It would be nice to create validation for the test data to make sure it fits assumptions.
//
//  This was a very enjoyable puzzle.
//
///////////////////////////////////////////////////////////////////////////////////////////////////


var fs = require('fs');
var NL = require('os').EOL;

//You can alter the data for the tests here.
//var testdata = "AB5, BC4, CD8, DC8, DE6, AD5, CE2, EB3, AE7";

function main(){
  //check if tests data defined. if not, exit
  if(typeof process.argv[2] === 'undefined'){
    console.log("Error: No test data provided." + NL);
    console.log("Usage: node thisscript.js testdata.txt" + NL);
    process.exit();
  }

  fs.readFile(process.argv[2], 'utf8', function (err,data) {
    if (err) {
      console.log("Error reading: ", process.argv[2]);
      return console.log(err);
      process.exit();
    }
    runtests(data);
  });
}

//Network
//object for holding the directed Graph has function to pass commands to the nodes
function Network(initdata) {
  this.netnodes = [];
  this.nodecount = 0;
  this.build(initdata);
}
//Network:: Breaks the init string and uses addNode to populate netnodes with node objects.
Network.prototype.build = function(initdata){
  var initdata = initdata.split(", ");
  for(var i in initdata){
    this.addNode(initdata[i][0],initdata[i][1],initdata[i][2]);
  }
}
//Network::addNode()
// Takes the node data and makes an object.  Adds it to the netnodes array and inrements node count.
Network.prototype.addNode = function(nodename, targetname, distance){
  if(typeof this.netnodes[nodename] === 'undefined'){
    this.netnodes[nodename] = new NetNode(nodename);
    this.nodecount++;
  }
  if(typeof this.netnodes[targetname] === 'undefined'){
    this.netnodes[targetname] = new NetNode(targetname);
    this.nodecount++;
  }
  this.netnodes[nodename].addTarget(this.netnodes[targetname], distance);
}
//Network::printstr()
// Can be used to print the contents of the network.
Network.prototype.printstr = function(){
  var retstr = "";
  for(var i in this.netnodes){
    retstr += this.netnodes[i].name + NL;
    for(var j in this.netnodes[i].targets){
      retstr += " " + j + ": " + this.netnodes[i].targets[j].distance + NL;
    }
  }
  retstr += NL;
  return retstr;
}
//Network::route()
// Validates some simpel issues that could be wrong with the poth variable then passes it to the nodes route function that does the work.
// (to return the total distance of the path)
Network.prototype.route = function(path){
  if(path.length > 0 && typeof this.netnodes[path[0]] === 'undefined'){
    return "NO SUCH ROUTE";
  }else if(path.length === 0){
    return "NO PATH PROVIDED";
  }else{
    return this.netnodes[path[0]].route(path, 1, 0);
  }
}
//Network::seek()
// Passes the variables necessary to the seek function of the appropriet node.
Network.prototype.seek = function(source, destination, die_funcs, keep_funcs){
  if(typeof this.netnodes[source] === 'undefined'){
    return "NO SOURCE";
  }
  return this.netnodes[source].seek([],{"path":source, "distance":0,"hops":0}, destination, die_funcs, keep_funcs);
}

//NetNode
// An object to hold the name of the node and the paths it has to other nodes.
function NetNode(name) {
  this.name = name;
  this.targets = [];
}
//NetNode::addTarget()
// This adds a path to annother node.
NetNode.prototype.addTarget = function(target, distance){
  this.targets[target.name] = {"target":target,"distance":distance};
};
//NetNode::route()
// This follows a given path from node to node and totals returns it's total distance.
NetNode.prototype.route = function(path, hop, distance){
  if(path.length > (hop * 2)){
    var targetname = path[(hop*2)];
    if(typeof this.targets[targetname] === 'undefined'){
      return "NO SUCH ROUTE";
    }else{
      distance += parseInt(this.targets[targetname].distance);
      return this.targets[targetname].target.route(path, (hop+1), distance);
    }
  }else{
    return distance;
  }
};
//NetNode::seek()
// This performs a sweep of the Directed Graph using recursion
// It collectes data by validating the current path/distance/path/location using validator function (keep_funcs array)
// It determing the swep is done by using path/distance/path/location with the kill function (die_functs array)
NetNode.prototype.seek = function(results, current, destination, die_funcs, keep_funcs){
  results = keepIf(results, current, destination, keep_funcs);
  if(dieIf(results, current, die_funcs)){ return results; }

  for(var i in this.targets){
    var next_current = { "path":current.path+i,"distance":parseInt(current.distance)+parseInt(this.targets[i].distance),"hops":current.hops+1 };
    results = this.targets[i].target.seek(results, next_current, destination, die_funcs, keep_funcs);
  }
  return results;
}


//Helper function to process the keep functions
function keepIf(results, current, destination, keep_funcs){
  var okay = false;
  if(current.hops >=1 && destination === current.path[current.path.length-1]) okay = true;
  for(var i in keep_funcs){
    if(!keep_funcs[i](results, current)){
      okay = false;
    }
  }
  if(okay){ results.push(current); }
  return results;
}

//Helper function to process the die functions
function dieIf(results, current, die_funcs){
  die = false;
  for(var i in die_funcs){
    if(die_funcs[i](results, current)){
      die = true;
    }
  }
  return die;
}

//Die function to limit hops in the graph
function makeTTLDieFunc(ttl){
  return function(results, current) {
    return (current.hops >= ttl);
  }
}

//Die function to limit distance traveled
function makeDTLDieFunc(dtl){
  return function(results, current) {
    return (current.distance >= dtl);
  }
}

//Die fundtion to prevent path longer than those already found from being considered.
function shortestDieFunc(results, current){
  for(var i in results){
    if(results[i].distance < current.distance){
      return true;
    }
  }
  return false;
}

//Keeper function to keep results less hops than or equal to the target number (lte)
function makeTTLLTEKeepFunc(lte){
  return function(results, current) {
    var keep = false;
    if(current.hops <= lte){
      keep = true;
    }
    return keep;
  }
}

//Keeper function to keep results of hops that are exactly the target number. (num)
function makeTTLExactKeepFunc(num){
  return function(results, current) {
    var keep = false;
    if(current.hops == num){
      //console.log(current);
      keep = true;
    }
    return keep;
  }
}

//Keeper function to keep results where the distance is less than the target distance
function makeDTLLTKeepFunc(lt){
  return function(results, current) {
    var keep = false;
    //console.log("makeTTLLTEKeepFunc");
    if(current.distance < lt){
      keep = true;
    }
    return keep;
  }
}

//Keeper function to keep only the result with the shortest distance.  This keeper breaks the previous plan by removing results itself.
//Could replace the kludge with a third sweep of functions that remove invalidated results
function makeKeepShortestKeepFunc(destination, otherKeepFuncs){
  return function(results, current) {
    var okay = false;
    if(current.hops >=1 && destination === current.path[current.path.length-1]) okay = true;
    for(var i in otherKeepFuncs){
      if(!otherKeepFuncs[i](results, current)){
        okay = false;
      }
    }
    if(okay){
      var shortest = true;
      for(var j in results){
        if(current.distance >= results[0].distance){
          shortest = false;
        }
      }
    }
    if(shortest == true){
      while(results.length > 0){
        results.pop();
      }
    }
    return shortest;
  };
}


//Code to run tests bellow
function runtests(testdata){
  var mynet = new Network(testdata);
  var outputcount = 1;

  //Test Paths (for tests 1-5())
  var paths = [
    "A-B-C",
    "A-D",
    "A-D-C",
    "A-E-B-C-D",
    "A-E-D"
  ];

  //Tests 1-5
  for(var i = 0; i<paths.length; i++){
    console.log("Output #" + (i+1) + ":  " + mynet.route(paths[i]));
  }
  var die_funcs = [];
  var keep_funcs = [];

  //Test 6
  die_funcs = [];
  die_funcs.push(makeTTLDieFunc(3));
  keep_funcs = [];
  keep_funcs.push(makeTTLLTEKeepFunc(3));
  console.log("Output #6:  " + mynet.seek("C", "C", die_funcs, keep_funcs).length);

  //Test 7
  die_funcs = [];
  die_funcs.push(makeTTLDieFunc(4));
  keep_funcs = [];
  keep_funcs.push(makeTTLExactKeepFunc(4));
  console.log("Output #7:  " + mynet.seek("A", "C", die_funcs, keep_funcs).length);

  //Test 8
  die_funcs = [];
  die_funcs.push(makeTTLDieFunc(mynet.nodecount));
  die_funcs.push(shortestDieFunc);
  keep_funcs = [];
  keep_funcs.push(makeKeepShortestKeepFunc("C", []));
  console.log("Output #8:  " + mynet.seek("A", "C", die_funcs, keep_funcs)[0].distance);

  //Test 9
  die_funcs = [];
  die_funcs.push(makeTTLDieFunc(mynet.nodecount));
  die_funcs.push(shortestDieFunc);
  keep_funcs = [];
  keep_funcs.push(makeKeepShortestKeepFunc("B", []));
  console.log("Output #9:  " + mynet.seek("B", "B", die_funcs, keep_funcs)[0].distance);

  //Test 10
  die_funcs = [];
  die_funcs.push(makeDTLDieFunc(30));
  keep_funcs = [];
  keep_funcs.push(makeDTLLTKeepFunc(30));
  var tenres = mynet.seek("C", "C", die_funcs, keep_funcs);
  console.log("Output #10: " + tenres.length);

  //console.log(mynet.printstr());
}

//Run Program
main();



///////////////////////////////////////////////////////////////////////////////////////////////////
// Challenge Question bellow
///////////////////////////////////////////////////////////////////////////////////////////////////
/*


A local commuter railroad services a number of towns in
Kiwiland.  Because of monetary concerns, all of the tracks are 'one-way.'
That is, a route from Kaitaia to Invercargill does not imply the existence
of a route from Invercargill to Kaitaia.  In fact, even if both of these
routes do happen to exist, they are distinct and are not necessarily the
same distance!

The purpose of this problem is to help the railroad provide its customers
with information about the routes.  In particular, you will compute the
distance along a certain route, the number of different routes between two
towns, and the shortest route between two towns.

Input:  A directed graph where a node represents a town and an edge
represents a route between two towns.  The weighting of the edge represents
the distance between the two towns.  A given route will never appear more
than once, and for a given route, the starting and ending town will not be
the same town.

Output: For test input 1 through 5, if no such route exists, output 'NO
SUCH ROUTE'.  Otherwise, follow the route as given; do not make any extra
stops!  For example, the first problem means to start at city A, then
travel directly to city B (a distance of 5), then directly to city C (a
distance of 4).

1. The distance of the route A-B-C.
2. The distance of the route A-D.
3. The distance of the route A-D-C.
4. The distance of the route A-E-B-C-D.
5. The distance of the route A-E-D.
6. The number of trips starting at C and ending at C with a maximum of 3
stops.  In the sample data below, there are two such trips: C-D-C (2
stops). and C-E-B-C (3 stops).
7. The number of trips starting at A and ending at C with exactly 4 stops.
In the sample data below, there are three such trips: A to C (via B,C,D); A
to C (via D,C,D); and A to C (via D,E,B).
8. The length of the shortest route (in terms of distance to travel) from A
to C.
9. The length of the shortest route (in terms of distance to travel) from B
to B.
10. The number of different routes from C to C with a distance of less than
30.  In the sample data, the trips are: CDC, CEBC, CEBCDC, CDCEBC, CDEBC,
CEBCEBC, CEBCEBCEBC.

Test Input:

For the test input, the towns are named using the first few letters of the
alphabet from A to D.  A route between two towns (A to B) with a distance
of 5 is represented as AB5.

Graph: AB5, BC4, CD8, DC8, DE6, AD5, CE2, EB3, AE7

Expected Output:

Output #1: 9
Output #2: 5
Output #3: 13
Output #4: 22
Output #5: NO SUCH ROUTE
Output #6: 2
Output #7: 3
Output #8: 9
Output #9: 9
Output #10: 7




*/
