
function setup() { // BEGIN block
	new Canvas(600,400);
  // textSize(24);
  // textAlign(CENTER);  
	world.gravity.y = 1;
	
	coldColor = color(50,50,255);
	hotColor = color(255,60,20);
	
	// make some drops
	droplets = new Group();
	droplets.diameter = dropletSize;
	
	let dropCount = 0;
	while( dropCount < totalDrops ) {
		makeDrop();
		dropCount++;
	} // END while 
	
	makeTank();
	heat = new Sprite();
	heat.animation = fireAni;
	heat.kinematic = 'static';
	heat.x = heatX;
	heat.y = 340;
	heat.scale = 0.45;

} // END Setup

function draw() {
	background(200);
	text("dial = " + dial, 300 ,50);
	
	// Problem 1 Dial Up
	if( kb.pressed("up") ) {
		if( dial < 10 ) {
			dial++; // this is the same as dial=dial + 1
			heat.animation.frameDelay -= 3;	
		} // END Dial < 10		
	} //END kb up
	
	// Problem 2 Dial Down
	if( kb.pressed("down") ) {
		if( dial > 0 ) {
			dial--; // this is the same as dial=dial + 1
			heat.animation.frameDelay += 3;	
		} // END Dial < 10		
	} //END kb up

  //Problem 3 Dial Off
	if(dial==0) {
		heat.visible = false;
		for(let drop of droplets) {
			drop.coolDown();
		}
	} 
  
  // Problem 4 Dial On
	if( dial > 0) {
    heat.visible = true;
		for(let drop of droplets) {
			drop.heatUp();
		} // END for..of
	} // END dial > 0
	
  // Problem 5 Pressed Left
	if(kb.pressed("left")) {
    if(heatX >= 400) {
      heat.x -= 5;
    }
	} // END kb "left"  

  // Problem 6 Pressed Right
	if(kb.pressed("right")) {
    if(heatX < 550) {
      heat.x += 5;
    }
	} // END kb "left"
  
	//Problem 7 Toggle Ice
	if(kb.pressed("i")) {
		hasIce = !hasIce;
	} // END kb "i"

	//Problem 8 Toggle Overlap
	if(kb.pressed("o")) {
		dropsCanOverlap = !dropsCanOverlap;
    if(dropsCanOverlap) {
      droplets.overlap(droplets);
    } else {
      droplets.collide(droplets);
    }
	} // END kb "i"

	// Problem 9: Toggle Show Help Menu
	if( kb.pressed("h")) {
		if( showHelpMenu == true ) {
			showHelpMenu = false;
		} else {
			showHelpMenu = true;
		}
		print("showHelpMenu = ",showHelpMenu);
	} // END kb "h"
  
  // Problem 10 Ice Effect
  if(hasIce == true) {
    image(ice, iceX, 40, 100, 100);
    for(let drop of droplets) {
      if(inColdZone(drop)) {
        drop.coolDown();
      }
    }
  } // END has Ice
	
	
	// Problem 11: Help Menu
	if(showHelpMenu) {
		let y = 100;
		text("HELP MENU", 20, y);
		text("up: increase temp", 20, (y+=15));
		text("down: decrease temp", 20, (y+=15));
		text("left: move heat left", 20, (y+=15));
		text("right: move heat right", 20, (y+=15));
		text("o: let drops overlap", 20, (y+=15));
		text("i: toggle ice", 20, (y+=15));
		text("h: toggle help", 20, (y+=15));
	}
	
	calculateColor();
	calculateForce();
} // END draw

function makeTank() {
	let tankDim = { w:600, h:300};
	
	tank = new Group();
	tank.color = 'black'
	tank.height = 10;
	tank.kinematic = 'static';
	
	//make the top
	topTank = new tank.Sprite();
	topTank.y = 5;
	topTank.width = tankDim.w;
	
	// make the bottom
	bottomTank = new tank.Sprite();
	bottomTank.y = tankDim.h;
	bottomTank.width = tankDim.w;
	
	//make the sides
	leftTank = new tank.Sprite();
	rightTank = new tank.Sprite();
	leftTank.x = 5;
	leftTank.y = tankDim.h * 0.5;
	leftTank.height = tankDim.h;
	leftTank.width = 10;
	
	rightTank.x = tankDim.w - 5;;
	rightTank.y = tankDim.h * 0.5;
	rightTank.height = tankDim.h;
	rightTank.width = 10;
}

function preload() {
  fireAni = loadAnimation("fire.png", 
    {frameSize:[180,176], frames:5});
  fireAni.frameDelay = 34; // 4 is default; 1 is fastest
ice  = loadImage("ice.png");
}

function calculateColor() {
  var t;

  for(let drop of droplets) {
    let t = norm(drop.temp,minDropTemp,maxDropTemp);
    t = constrain(t,0,1);
    if(outlineDrops) {
      drop.color = color(200,0);   
    } else {
      drop.color = lerpColor(coldColor,hotColor, t); 
    }
    drop.strokeColor = lerpColor(coldColor,hotColor, t); 
    drop.strokeWidth = 5;
  }
}

function calculateForce() {
  var deltaTemp, normTemp, force;

  if(hasIce) {
    for(let drop of droplets) {
      if( nearBottomTank(drop) && !inHotZone(drop)) {        
        drop.bearing = 0;
        drop.applyForce(drop.bottomOfTankForce);
      }  
      else if( inColdZone(drop)){
        defaultForceCalculation(drop);
        drop.color = color(100,100,255);
      } 
      else if( nearTopTank(drop) ) {
        //distance from ice
          drop.bearing = -140;
          // drop.speed = 1.0;
          drop.applyForce(drop.topOfTankForce);                 
      }
      else  {
        defaultForceCalculation(drop);
        // drop.color = color(0,255,0);
      }
      
      // make sure the droplet did not get bumped out of the tank
      if(drop.y >= bottomTank.y) {
        drop.y = bottomTank.y - drop.diameter - 10;
      }
    }
  } // END hasIce
  else {
    for(let drop of droplets) { 
      defaultForceCalculation(drop);

      // make sure the droplet did not get bumped out of the tank
      if(drop.y >= bottomTank.y) {
        drop.y = bottomTank.y - drop.diameter - 10;
      }          
    }
  } // END no Ice
} // END calculate Force

function makeDrop() {
  if(dropsCanOverlap) {
    droplets.overlap(droplets);
  }
  let d = new droplets.Sprite();
  d.y = 280 + random(-5,5); //random(10,20); //280 + random(-20,0);
  d.x = random(-100,100) + 330; //500;
  d.temp = waterTemp; //minDropTemp + random(3);
  d.diameter = d.diameter + random(-5,5);
  // how fast the drop heats up and cools down
  d.heatRate = dropHeatRate * random(0.5,1.1);
  d.coolRate = dropCoolRate * random(1.0,1.1);
  // the force applied to the drop when the ice is on and
  // the drop is near the top of the tank
  d.topOfTankForce = random(0.5*topOfTankForce , 1.1*topOfTankForce);
  // force when ice is on and drop is at the bottom
  d.bottomOfTankForce = random(0.5*bottomOfTankForce, 1.1*bottomOfTankForce);
  // how far from the heat before the drop starts getting warmer
  d.heatRadius = heatRadius + random(-0.25 * heatRadius,0.95*heatRadius);
  // how far from the ice before the drop starts getting colder
  d.coldRadius = coldRadius + random(-0.25 * coldRadius,0.95*coldRadius);
  d.update = () => {
    if(showTempLabels) {
      d.text = Math.round(d.temp);    
    }
  }

  d.heatUp = () => {
    d.temp += d.heatRate;
    d.temp = Math.min(d.temp, maxDropTemp);
  }

  d.coolDown = () => {
    d.temp += d.coolRate;
    d.temp = Math.max(d.temp, minDropTemp);
  }
}

// return true if this drop is near the flame
function inHotZone(drop) {
  return (drop.x < (heat.x + drop.heatRadius) && drop.x > (heat.x - drop.heatRadius) );
}

// return true if this drop is near the ice cube
function inColdZone(drop) {
  return (drop.x < (iceX + drop.coldRadius) && drop.x > (iceX - drop.coldRadius) );
}

// return true if this drop is near the top of the tank
function nearTopTank(drop) {
  return (drop.y < topOfTank);
}

// return true if this drop is near the bottom of the tank
function nearBottomTank(drop) {
  return (drop.y > bottomTank.y - bottomOfTank);
}

// use the difference in temperature between
// the drop and the water to calculate a force
function defaultForceCalculation(drop) {
  deltaTemp = drop.temp - waterTemp ;
  normTemp = norm(deltaTemp,0,5);
  force = lerp(0,maxDropSpeed,normTemp*normTemp);

  if(deltaTemp < 0) {
    // drop.direction = 'down';
    // drop.speed = force;
    drop.bearing = 90;
    drop.applyForce(force);
  } 
  if(deltaTemp > 0) {
    // drop.direction = 'up';
    // drop.speed = force;
    drop.bearing = -90;
    drop.applyForce(0.3);
  }
  if(deltaTemp == 0) {
    drop.speed = 0;
  }
}



// ALL VARIABLES -------------
let dial = 0;

// vars for the droplets
let totalDrops = 50;
let dropletSize = 15;
let maxDropSpeed = 2;
let dropHeatRate = 0.02, dropCoolRate = -0.04;
let maxDropTemp = 55, minDropTemp = 45;

let showTempLabels = true, outlineDrops = true;

let waterTemp = 50;

let dropsCanOverlap = false;
let bottomOfTank = 50, topOfTank = 50;
let heatRadius = 90, coldRadius = 150;
let hasIce = false;
let iceX = 50, heatX = 500;
let topOfTankForce = 0.20, bottomOfTankForce = 0.40;

let showHelpMenu = false;

