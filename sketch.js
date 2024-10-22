

function setup() {
	new Canvas(600,400);
  world.gravity.y = 1;
  
  config.coldColor = color(50,50,255,100);
  config.hotColor = color(255,60,20,100);
  
  droplets = new Group();
	tank = new Tank({ w:600, h:300});  
  sim = new Simulator(config, droplets, tank);
  sim.hideFlame();
}

function draw() {
	background(255);
  
  // dial controls the visibility


  // key board controls
  if(kb.pressed("up")) {
    if(dial < 10) {
      sim.speedUpFlame();
      dial++;
    } // END dial > 10 block   
  } // END kb.pressed "up"
  
  if(kb.pressed("down")) {
    if(dial > 0) {
      dial--;
      sim.slowDownFlame();
    } // DIAL < 0 block 
  } // END of kb.down block

  if(kb.pressed("right")) {
    if (sim.heat.x < 550) {
      sim.heat.x += 5;  
    }
  }

  if(kb.pressed("left")) {
    if (sim.heat.x > 400) {
      sim.heat.x -= 5;
    }
  }

  // HANDLE the temperature changes
  // when heat is on heat up the drops in the hotzone
  if(dial > 0) {

  }

  // turn the dial off drop cools
  if(dial == 0) { 

  }

  if(kb.pressed("i")) {
    this.sim.hasIce = !this.sim.hasIce;
  }
  
  if(kb.pressed("o")) {
    sim.dropsCanOverlap = !sim.dropsCanOverlap;
    if(sim.dropsCanOverlap) {
      droplets.overlap(droplets);
    } else {
      droplets.collide(droplets);
    }
  }
  
  if(kb.pressed("h")) {
    sim.showHelpMenu = !sim.showHelpMenu;
  }

  if(this.sim.hasIce) {
    image(ice,sim.config.iceX,40,100,100);
    for(let drop of droplets) {
        if( drop.inColdZone(sim.config.iceX) ) {
          drop.coolDown();
      }
    }
  }
  
  if(sim.showHelpMenu) {
    let y = 100;
    text("HELP MENU",20,y);
    text("up: increase temp",20,(y+=15));
    text("down:  decrease temp",20,(y+=15));
    text("left:  move heat left",20,(y+=15));
    text("right:  move heat right",20,(y+=15));
    text("o: let drops overlap",20,(y+=15));
    text("i: toggle ice",20,(y+=15));
    text("f: fill droplets",20,(y+=15));
    text("l: label droplets",20,(y+=15));
    text("h: toggle help menu",20,(y+=15));
  }

  if(kb.pressed("l")) {
    Drop.showLabel = !Drop.showLabel;
    for(let drop of droplets) {
      if(Drop.showLabel ) {
        drop.text = Math.round(drop.temp);
      } else {
        drop.text = " ";
      }
    }
  }

  if(kb.pressed("f")) {
    Drop.outline = !Drop.outline;
  }
  
  sim.calculateForce();
  sim.calculateColor();

  {// Draw the dial
    push();
    imageMode(CENTER);
    translate(width*0.5, 350);
    
    rotate(map(dial,0,10,0,270));
    image(dialImg, 0,0,50,50);
    pop();
    push();
    translate(width*0.5, 350);
    textAlign(CENTER);
    textSize(20);
    text(dial,0,0)
    pop();
  }


} // END draw BLOCK

let a = 0;

function preload() {
  fireAni = loadAnimation("fire.png", 
    {frameSize:[180,176], frames:5});
  fireAni.frameDelay = 34; // 4 is default; 1 is fastest
  ice  = loadImage("ice.png");
  dialImg = loadImage("dial.png");
}


class Simulator {
  constructor(config, droplets, tank) {
    this.config = config;
    this.droplets = droplets;
    this.tank = tank;
    this.createDroplets();

    this.createHeat();
    this.hasIce = this.config.hasIce;
    this.showTempLabels = this.config.showTempLabels;
    this.showHelpMenu = this.config.showHelpMenu;
  }

  colorDroplets(coldColors, hotColors) {
  createDroplets() {
    this.droplets.diameter = this.config.dropletSize;
  
    let dropCount = 0;
  
    while(dropCount < this.config.totalDrops) {
      // this.createDrop();
      new Drop(this,droplets);
      dropCount++;
    }
  }

  createDrop() {
    if(this.config.dropsCanOverlap) {
      droplets.overlap(droplets);
    }
    let d = new this.droplets.Sprite();
    d.y = 280 + random(-5,5); //random(10,20); //280 + random(-20,0);
    d.x = random(-100,100) + 330; //500;
    d.temp = this.config.waterTemp; //minDropTemp + random(3);
    d.diameter = d.diameter + random(-5,5);
    // how fast the drop heats up and cools down
    d.heatRate = this.config.dropHeatRate * random(0.5,1.1);
    d.coolRate = this.config.dropCoolRate * random(0.5,1.1);
    // the force applied to the drop when the ice is on and
    // the drop is near the top of the tank
    d.topOfTankForce = random(0.5*this.config.topOfTankForce , 1.1*this.config.topOfTankForce);
    // force when ice is on and drop is at the bottom
    d.bottomOfTankForce = random(0.5*this.config.bottomOfTankForce, 1.1*this.config.bottomOfTankForce);
    // how far from the heat before the drop starts getting warmer
    d.heatRadius = this.config.heatRadius + random(-0.25 * this.config.heatRadius,0.95*this.config.heatRadius);
    // how far from the ice before the drop starts getting colder
    d.coldRadius = this.config.coldRadius + random(-0.25 * this.config.coldRadius,0.95*this.config.coldRadius);
    d.update = () => {
      if(d.sim.config.showTempLabels) {
        d.text = Math.round(d.temp);    
      }
    }
  
    d.heatUp = () => {
      d.temp += d.heatRate;
      d.temp = Math.min(d.temp, this.config.maxDropTemp);
    }
  
    d.coolDown = () => {
      d.temp += d.coolRate;
      d.temp = Math.max(d.temp, this.config.minDropTemp);
    }

    d.inHotZone = (heatSourceX) => {
      let inRadius = d.x < (heatSourceX + d.heatRadius) && d.x > (heatSourceX - d.heatRadius); 
      return inRadius || (d.x >= heatSourceX);      
    }
  }

  createHeat() {
    this.heat = new Sprite();
    this.heat.animation = fireAni;
    this.heat.kinematic = 'static';	
    this.heat.x = this.config.heatX;
    this.heat.y = 350;
    this.heat.scale = 0.5;
    this.heat.kinematic = 'none';    
  }

  inHotZone(drop) {
    let inRadius = drop.x < (heat.x + drop.heatRadius) && drop.x > (heat.x - drop.heatRadius); 
    return inRadius || (drop.x >= heat.x);
  }

  inColdZone(drop) {
    return (drop.x < (iceX + drop.coldRadius) && drop.x > (iceX - drop.coldRadius) );
  }

  calculateColor() {
    var t;
  
    for(let drop of this.droplets) {
      let t = norm(drop.temp,this.config.minDropTemp,this.config.maxDropTemp);
      t = constrain(t,0,1);
      if(Drop.outline) {
        // make the fill transparent so we just have the outline
        drop.color = color(200,0);   
        drop.strokeColor = lerpColor(this.config.coldColor,this.config.hotColor, t); 
        drop.strokeColor = lerpColor(drop.coldColor,drop.hotColor, t); 
        drop.strokeWeight =5;
      } else {
        drop.color = lerpColor(this.config.coldColor,this.config.hotColor, t); 
        drop.color = lerpColor(drop.coldColor,drop.hotColor, t); 
        drop.strokeColor = drop.color;
        drop.strokeWeight = 2;
      }
    }
  }

  calculateForce() {
    var deltaTemp, normTemp, force;
  
    if(this.hasIce) {
      for(let drop of this.droplets) {
        // if( nearBottomTank(drop) && !inHotZone(drop)) {        
        if( drop.nearBottomTank(this.tank.bottomTank.y,sim.config.bottomOfTank)
          //&& drop.x < sim.heat.x + 30) {
          && !drop.inHotZone(sim.heat.x)) {        
              // get the normDist from coldX
              let dx = constrain(drop.x,sim.config.iceX, sim.config.heatX);
              let deltaHeatX = sim.config.heatX - dx;

              deltaHeatX = constrain(deltaHeatX,0,sim.heat.x - sim.config.iceX);
              
              let normDistFire = 1.0 - norm(deltaHeatX,0,sim.heat.x - sim.config.iceX);
              // drop.normDistFire = normDistFire;  
              // if(Drop.showLabel) {
              //   drop.text = normDistFire.toFixed(2);
              // }
              // get the normDist
              drop.bearing = lerp(0, 30,normDistFire*normDistFire)//0;
              drop.bearing += lerp(0,80,(1.0 - normDistFire)*(1.0 - normDistFire));
              drop.applyForce(drop.bottomOfTankForce);
        }  
        else if( drop.inColdZone(sim.config.iceX)){
          this.defaultForceCalculation(drop);
          // drop.color = color(100,100,255);
        } 
        else if( drop.nearTopTank(this.tank.topTank.y, sim.config.topOfTank) ) {
          //distance from ice
            drop.bearing = -140;
            // drop.speed = 1.0;
            drop.applyForce(drop.topOfTankForce);                 
        }
        else  {
          this.defaultForceCalculation(drop);
          // drop.color = color(0,255,0);
        }
        
        // make sure the droplet did not get bumped out of the tank
        if(drop.y >= this.tank.bottomTank.y) {
          drop.y = this.tank.bottomTank.y - drop.diameter - 10;
        }
      }
    } // END hasIce
    else {
      for(let drop of droplets) { 
        this.defaultForceCalculation(drop);
  
        // make sure the droplet did not get bumped out of the tank
        if(drop.y >= this.tank.bottomTank.y) {
          drop.y = this.tank.bottomTank.y - drop.diameter - 10;
        }          
      }
    } // END no Ice
  } // END calculate Force

  defaultForceCalculation = (drop) => {
    let deltaTemp = drop.temp - this.config.waterTemp ;
    let normTemp = norm(deltaTemp,0,5);
    let force = lerp(0,this.config.maxDropSpeed,normTemp*normTemp);
  
    if(deltaTemp < 0) {
      drop.direction = 'down';
      drop.speed = force;
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
  
  speedUpFlame = () => {
    sim.heat.animation.frameDelay -= 3;
  }
  
  slowDownFlame = () => {
    sim.heat.animation.frameDelay += 3;
  }

  showFlame = () => {this.heat.visible = true;}
  hideFlame = () => {this.heat.visible = false;}
} // END Simulation

class Drop {
  static showLabel =  false;
  static outline = false;

  constructor(sim, group) {
    this.sim = sim;
    this.config = sim.config;
    // this.group = group;

 
    this.drop = new group.Sprite();

    this.drop.y = 280 + random(-5,5); //random(10,20); //280 + random(-20,0);
    this.drop.x = random(-100,100) + 330; //500;
    this.drop.temp = this.config.waterTemp; //minDropTemp + random(3);
    this.drop.diameter = this.drop.diameter + random(-5,5);
    // how fast the drop heats up and cools down
    this.drop.heatRate = this.config.dropHeatRate * random(0.5,1.1);
    this.drop.coolRate = this.config.dropCoolRate * random(0.5,1.1);
    // the force applied to the drop when the ice is on and
    // the drop is near the top of the tank
    this.drop.topOfTankForce = random(0.5*this.config.topOfTankForce , 1.1*this.config.topOfTankForce);
    // force when ice is on and drop is at the bottom
    this.drop.bottomOfTankForce = random(0.5*this.config.bottomOfTankForce, 1.1*this.config.bottomOfTankForce);
    // how far from the heat before the drop starts getting warmer
    this.drop.heatRadius = this.config.heatRadius + random(-0.25 * this.config.heatRadius,0.95*this.config.heatRadius);
    // how far from the ice before the drop starts getting colder
    this.drop.coldRadius = this.config.coldRadius + random(-0.25 * this.config.coldRadius,0.95*this.config.coldRadius);
    // this.drop.update = () => { 
    //   if(Drop.showLabel) {
    //     this.drop.text = Math.round(this.drop.temp);
    //   }
    // }
    this.drop.heatUp = this.heatUp;
    this.drop.coolDown = this.coolDown;
    this.drop.inHotZone = this.inHotZone;
    this.drop.inColdZone = this.inColdZone;
    this.drop.nearBottomTank = this.nearBottomTank;
    this.drop.nearTopTank = this.nearTopTank;
  }

  // update = () => {
  //   if(Drop.showLabel) {
  //     this.drop.text = Math.round(this.drop.temp);    
  //   }
  // }

  heatUp = () => {
    this.drop.temp += this.drop.heatRate;
    this.drop.temp = Math.min(this.drop.temp, this.config.maxDropTemp);
  }

  coolDown = () => {
    this.drop.temp += this.drop.coolRate;
    this.drop.temp = Math.max(this.drop.temp, this.config.minDropTemp);
  }

  inHotZone = (heatSourceX) => {
    let inRadius = this.drop.x < (heatSourceX + this.drop.heatRadius) && 
                this.drop.x > (heatSourceX - this.drop.heatRadius); 
    return inRadius || (this.drop.x >= heatSourceX);      
  }

  inColdZone = (coldSourceX) => {    
    return (this.drop.x < (this.config.iceX + this.drop.coldRadius) && 
            this.drop.x > (this.config.iceX - this.drop.coldRadius) );    
  }

  nearTopTank = (topOfTank,offset) => {
    return (this.drop.y < topOfTank + offset);
  }

  nearBottomTank = (bottomOfTank,offset) => {
    return (this.drop.y > bottomOfTank - offset);  
  }
}

class Tank {
  constructor(dim) {
    this.dim = dim;
      
    this.tank = new Group();
    this.tank.color = 'black'
    this.tank.height = 10;
    this.tank.kinematic = 'static';

    //make the top
    this.topTank = new this.tank.Sprite();
    this.topTank.y = 5;
    this.topTank.width = this.dim.w;

    // make the bottom
    this.bottomTank = new this.tank.Sprite();
    this.bottomTank.y = this.dim.h;
    this.bottomTank.width = this.dim.w;

    //make the sides
    this.leftTank = new this.tank.Sprite();
    this.rightTank = new this.tank.Sprite();
    this.leftTank.x = 5;
    this.leftTank.y = this.dim.h * 0.5;
    this.leftTank.height = this.dim.h;
    this.leftTank.width = 10;

    this.rightTank.x = this.dim.w - 5;;
    this.rightTank.y = this.dim.h * 0.5;
    this.rightTank.height = this.dim.h;
    this.rightTank.width = 10;
  }
}

// ALL VARIABLES -------------
let dial = 0;

let config = {
  totalDrops: 0,
  dropletSize: 15,
  maxDropSpeed: 2,
  dropHeatRate: 0.04, dropCoolRate: -0.04,
  maxDropTemp: 55, minDropTemp: 45,
  waterTemp: 50,
  showTempLabels: false,
  outlineDrops: true,
  dropsCanOverlap: false,
  bottomOfTank: 50, topOfTank: 50,
  heatRadius: 90, coldRadius: 150,
  hasIce: false,
  iceX: 50, heatX: 550,
  topOfTankForce: 0.20, bottomOfTankForce: 0.40,
  showHelpMenu: false
};