# Solution Steps
Following are the steps to build the finished simulation solution. This can be completed in an aggressive 20 minute session.

1. Add drops
Change _line 468_ to 100

2. Dial Off functionality
_line 63_
```
  // turn the dial off drop cools
  if(dial == 0) { 
    // show the flame
    sim.hideFlame()
    // cool off the drops because heat is off
    for(let drop of droplets) {
      drop.coolDown();
    }
  }
  ```

3. Dial On functionality
_line 63_
```
  // turn the dial off drop cools
  if(dial > 0) { 
    sim.hideFlame()
    for(let drop of droplets) {
      drop.coolDown();
    }
  }
  ```