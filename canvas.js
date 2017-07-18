// store all game classes, methods, and objects.
var Game = {};

//   ***  Math utility functions
Math.randRange = function (min, max) {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
};


//  wrapper for class Shape  ***  Utility functions for drawing shapes
(function () {
    class Shape {

        // Triangle: Draws a triangle with the origin at the top point
        static Triangle(ctx, x, y, width, height) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width / 2, y + height);
            ctx.lineTo(x - width / 2, y + height);
            ctx.fill();
        }

        // Semi Circle: Draws a semi circle with the origin at vertex
        static SemiCircle(ctx, x, y, radius) {
            ctx.beginPath();
            var endAngle = Math.PI;
            ctx.arc(x, y, radius, 0, endAngle);
            ctx.stroke();
        }

        // Line: Draws a line with origin at left coordinate
        static Line(ctx, startX, startY, endX, endY) {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    Game.Shape = Shape;
})();

// wrapper for class Boundary
(function () {
    function Boundary(left, top, width, height) {
        this.left = left || 0;
        this.top = top || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.right = this.left + this.width;
        this.bottom = this.top + this.height;
    }
    
    Boundary.prototype.set = function (left, top, /*optional*/width, /*optional*/height) {
        this.left = left;
        this.top = top;
        this.width = width || this.width;
        this.height = height || this.height
        this.right = (this.left + this.width);
        this.bottom = (this.top + this.height);
    }

    Boundary.prototype.within = function (b) {
        return (b.left <= this.left &&
            b.right >= this.right &&
            b.top <= this.top &&
            b.bottom >= this.bottom);
    }

    Boundary.prototype.overlaps = function (b) {
        return (this.left < b.right &&
            b.left < this.right &&
            this.top < b.bottom &&
            b.top < this.bottom);
    }

    // add class Boundary to Game object
    Game.Boundary = Boundary;
})();

// wrapper for class Camera
(function () {
    
    // possibles axis to move the camera
    var AXIS = {
        NONE: "none",
        HORIZONTAL: "horizontal",
        VERTICAL: "vertical",
        BOTH: "both"
    };

    // Camera constructor
    function Camera(xView, yView, canvasWidth, canvasHeight, worldWidth, worldHeight) {
        // position of camera (left-top coordinate)
        this.xView = xView || 0;
        this.yView = yView || 0;

        // distance from followed object to border before camera starts move
        this.xDeadZone = 0; // min distance to horizontal borders
        this.yDeadZone = 0; // min distance to vertical borders

        // viewport dimensions
        this.wView = canvasWidth;
        this.hView = canvasHeight;

        // allow camera to move in vertical and horizontal axis
        this.axis = AXIS.BOTH;

        // object that should be followed
        this.followed = null;

        // rectangle that represents the viewport
        this.viewportRect = new Game.Boundary(this.xView, this.yView, this.wView, this.hView);

        // rectangle that represents the world's boundary (room's boundary)
        this.worldRect = new Game.Boundary(0, 0, worldWidth, worldHeight);

    }

    // gameObject needs to have "x" and "y" properties (as world(or room) position)
    Camera.prototype.follow = function (gameObject, xDeadZone, yDeadZone) {
        this.followed = gameObject;
        this.xDeadZone = xDeadZone;
        this.yDeadZone = yDeadZone;
    }

    Camera.prototype.update = function () {
        // keep following the player (or other desired object)
        if (this.followed != null) {
            if (this.axis == AXIS.HORIZONTAL || this.axis == AXIS.BOTH) {
                // moves camera on horizontal axis based on followed object position
                if (this.followed.x - this.xView + this.xDeadZone > this.wView)
                    this.xView = this.followed.x - (this.wView - this.xDeadZone);
                else if (this.followed.x - this.xDeadZone < this.xView)
                    this.xView = this.followed.x - this.xDeadZone;

            }
            if (this.axis == AXIS.VERTICAL || this.axis == AXIS.BOTH) {
                // moves camera on vertical axis based on followed object position
                if (this.followed.y - this.yView + this.yDeadZone > this.hView)
                    this.yView = this.followed.y - (this.hView - this.yDeadZone);
                else if (this.followed.y - this.yDeadZone < this.yView)
                    this.yView = this.followed.y - this.yDeadZone;
            }

        }

        // update viewportRect
        this.viewportRect.set(this.xView, this.yView);

        // don't let camera leaves the world's boundary
        if (!this.viewportRect.within(this.worldRect)) {
            if (this.viewportRect.left < this.worldRect.left)
                this.xView = this.worldRect.left;
            if (this.viewportRect.top < this.worldRect.top)
                this.yView = this.worldRect.top;
            if (this.viewportRect.right > this.worldRect.right)
                this.xView = this.worldRect.right - this.wView;
            if (this.viewportRect.bottom > this.worldRect.bottom)
                this.yView = this.worldRect.bottom - this.hView;
        }

    }

    // add class Camera to Game object
    Game.Camera = Camera;

})();

// wrapper for class Unit
(function () {

    // Unit Class
    class Unit {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.xv = 0;
            this.yv = 0;
            this.width = 50;
            this.height = 50;
            this.gravity = 8;
            this.onGround = false;
        }
        updatePosition(worldWidth, worldHeight, groundBlockTotal) {
            // update position
            this.yv += this.gravity;
            this.x += this.xv;
            this.y += this.yv;

            // check if on ground
            this.checkGround(groundBlockTotal);
            /*if (this.y < 350) {
                this.onGround = false;
            } else {
                this.onGround = true;
                this.y = 350;
                this.xv *= 0.8;
            }*/

            // check if collided with world boundary
            if (this.x - this.width / 2 < 0) {
                this.x = this.width / 2;
            }
            if (this.y - this.height / 2 < 0) {
                this.y = this.height / 2;
            }
            if (this.x + this.width / 2 > worldWidth) {
                this.x = worldWidth - this.width / 2;
            }
            if (this.y + this.height / 2 > worldHeight) {
                this.y = worldHeight - this.height / 2;
            }
        }
        checkGround(groundBlockTotal) {

            // start looping through the ground blocks starting at the guess to find which block unit is currently inside
            for (var i = 1; i < groundBlockTotal + 1; i++ ) {

                var block = Game.map.ground.groundBlocks[i];

                if (Game.map.ground.groundBlocks[i + 1]) {
                    var nextBlock = Game.map.ground.groundBlocks[i + 1];
                }
                
                // Is unit inside the current ground block?
                if ((this.x >= block.x && this.x <= block.x + block.width) || (this.x + this.width >= block.x && this.x + this.width <= block.x + block.width)) {

                    // Is unit also inside the next ground block (necessary for going backwards)?
                    if ((this.x >= nextBlock.x && this.x <= nextBlock.x + nextBlock.width) || (this.x + this.width >= nextBlock.x && this.x + this.width <= nextBlock.x + nextBlock.width)) {

                        // which ground block is higher?
                        if (nextBlock.y < block.y) {  // Next ground block is higher

                            // Is unit in the air?
                            if (this.y > nextBlock.y) {
                                this.onGround = true;
                                this.y = nextBlock.y - this.height;
                                this.xv *= 0.8;
                            }
                            // Unit is in the air, no collision detected
                            else {
                                this.onGround = false;
                            }
                            break;
                        }
                        else { // Current ground block is higher

                            // Is unit in the air?
                            if (this.y > block.y) {
                                this.onGround = true;
                                this.y = block.y - this.height;
                                this.xv *= 0.8;
                            }
                                // Unit is in the air, no collision detected
                            else {
                                this.onGround = false;
                            }
                            break;
                        }
                    }

                    // unit is only inside current ground block
                    else {

                        // Is  unit in the air?
                        if (this.y > block.y) {
                            this.onGround = true;
                            this.y = block.y - this.height;
                            this.xv *= 0.8;
                        }

                        // Unit is in the air no collision is detected
                        else {
                            this.onGround = false;
                        }

                        // break out of the loop
                        break;
                    }     
                }
            }
        }
    }

    // Player Unit
    class PlayerUnit extends Unit {
        constructor(x,y){
            super(x, y);
            this.name = "Player";
        }
        draw(ctx,xView, yView) { // Drawing the player

            // before drawing need to convert player's world position into canvas position
            var xCanvas = this.x - xView;
            var yCanvas = this.y - yView;

            // outside rectangle
            ctx.fillStyle = 'rgb(200,0,0)';
            ctx.fillRect(xCanvas, yCanvas, 50, 50);

            // eyes
            ctx.fillStyle = 'rgb(250,250,250)';
            ctx.strokeStyle = 'rgb(250,250,250)';
            if (this.onGround) {
                Game.Shape.Triangle(ctx, xCanvas + 12.5, yCanvas + 10, 10, 10);
                Game.Shape.Triangle(ctx, xCanvas + 37.5, yCanvas + 10, 10, 10);
            } else {
                Game.Shape.SemiCircle(ctx, xCanvas + 12.5, yCanvas + 15, 5);
                Game.Shape.SemiCircle(ctx, xCanvas + 37.5, yCanvas + 15, 5);
            }
        }
        getMoveInput() {
            // check for movement
            if (Game.controls.left) { // Move Left
                if (this.xv > -10 && this.xv < 10) {
                    this.xv -= 2;
                }
            }
            if (Game.controls.right) { // Move Right
                if (this.xv > -10 && this.xv < 10) {
                    this.xv += 2;
                }
            }
            if (Game.controls.up) { // Jump
                if (this.onGround) {
                    this.yv = -70;
                }
            }
        }
        update(worldWidth, worldHeight, groundBlockTotal) {
            this.getMoveInput();
            this.updatePosition(worldWidth, worldHeight, groundBlockTotal);
        }
    }

    // Enemy Unit
    class EnemyUnit extends Unit {
        constructor(x, y) {
            super(x, y);
            this.name = "Enemy";
        }
        draw(ctx, xView, yView) {

            // before drawing need to convert enemy's world position into canvas position
            var xCanvas = this.x - xView;
            var yCanvas = this.y - yView;

            // outside rectangle
            ctx.fillStyle = 'rgb(50,100,50)';
            ctx.fillRect(xCanvas, yCanvas, 50, 50);

            // eyes
            ctx.strokeStyle = 'rgb(250,250,250)';
            Game.Shape.Line(ctx, xCanvas + 5, yCanvas + 10, xCanvas + 20, yCanvas + 15);
            Game.Shape.Line(ctx, xCanvas + 30, yCanvas + 15, xCanvas + 45, yCanvas + 10);
        }
        trackPlayer(target) {
            if (this.x < target.x) {
                this.xv = 4;
            } else if (this.x > target.x) {
                this.xv = -4;
            } else {
                this.xv = 0;
            }
        }
        update(worldWidth, worldHeight,groundBlockTotal,target) {
            this.trackPlayer(target);
            this.updatePosition(worldWidth, worldHeight, groundBlockTotal);
        }
    }

    // add Unit classes to Game object
    Game.Unit = Unit;
    Game.PlayerUnit = PlayerUnit;
    Game.EnemyUnit = EnemyUnit;

})();

// wrapper for class Ground
(function () {
    function Ground(xStart, yMax) {
        
        // position x where ground starts
        this.xStart = xStart;

        // width of entire ground chunk
        this.chunkWidth = 0;

        // maximum height of ground block
        this.yMax = yMax;

        // array holding ground blocks
        this.groundBlocks = {};

    }

    // Generate ground blocks
    Ground.prototype.generate = function (chunkWidth, blockCount) { 

        this.groundBlocks.blockTotal = blockCount;
        // amount of blocks generated in chunk
        var blockCount = blockCount;

        // set chunk width
        this.chunkWidth = chunkWidth;

        // counter variable to hold the amount of width remaining for block sizes to be based on
        var remainingWidth = chunkWidth;
      

        // create new blocks until the block count has reached zero
        do {
            if(this.groundBlocks[blockCount+1]) {
                this.groundBlocks[blockCount] = new GroundBlock(this.groundBlocks[blockCount+1],remainingWidth, blockCount, this.yMax);
                remainingWidth -= this.groundBlocks[blockCount].width;
                blockCount--;
            } else {
                this.groundBlocks[blockCount] = new GroundBlock(null,remainingWidth,blockCount,this.yMax);
                remainingWidth -= this.groundBlocks[blockCount].width;
                blockCount--;
            }
        } while (blockCount > 0);
    }
    // draw map adjusted to camera
    Ground.prototype.draw = function (ctx, canvas, xView, yView) {

        // start with i=1 since the blocks will be generated starting at index "1"
        for (var i = 1; i < this.groundBlocks.blockTotal +1 ; i++) {
            this.groundBlocks[i].draw(ctx, canvas, xView, yView);
        }


    }

    function GroundBlock(previous, remainingWidth, blockCount, yMax) {

        this.name = "Ground Block " + blockCount;
        // maximum width the block can be
        var maxWidth = remainingWidth / blockCount;

        // check if previous block has been created
        if (previous != null) {

            // if max with equals the amount of width remaining, set width to equal max width
            if(maxWidth == remainingWidth) {
                this.width = maxWidth;
                this.x = previous.x - this.width;
            }
            // else pick a random width between a minimum width and the max width
            else {
                this.width = Math.randRange(50, maxWidth);
                this.x = previous.x - this.width;
            }
        // if previous block is null
        } else {
            // if max with equals the amount of width remaining, set width to equal max width
            if (maxWidth == remainingWidth) {
                this.width = maxWidth;
                this.x = 0;
            }
                // else pick a random width between a minimum width and the max width
            else {
                this.width = Math.random()*maxWidth;
                this.x = remainingWidth - this.width;
            }
        }

        // choose a random y starting coordinate
        this.y = Math.randRange(300, yMax);

    }

    GroundBlock.prototype.draw = function (ctx, canvas, xView, yView) {

        // find the block's position relative to the camera
        var xCanvas = this.x - xView;
        var yCanvas = this.y - yView;

        // draw block
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillRect(xCanvas, yCanvas, this.width, canvas.height - yCanvas);
    }

    // add class Ground to our Game object
    Game.Ground = Ground;

})();

// Game Script
(function () {

    // prepare game canvas
    var canvas = document.getElementById("myCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext("2d");

    // set up object to represent world
    Game.map = {
        width: 5000,
        height: 3000,
        ground: new Game.Ground(0,canvas.height/2)
    };

    // initialize player
    var Player = new Game.PlayerUnit(200,350);    

    // initialize enemy
    var Enemy = new Game.EnemyUnit(600, 350);

    // initialize camera
    var Camera1 = new Game.Camera(0, 0, canvas.width, canvas.height, Game.map.width, Game.map.height);
    Camera1.follow(Player, 600, 100);

    // initialize ground
    Game.map.ground.generate(Game.map.width, 20);

    // initialize Quadtree
    Game.quadtree = new QuadTree({ x: 0, y: 0, width: canvas.width, height: canvas.height });

    // Game update function
    var update = function () {
        Player.update(Game.map.width, Game.map.height, Game.map.ground.groundBlocks.blockTotal);
        Enemy.update(Game.map.width, Game.map.height, Game.map.ground.groundBlocks.blockTotal, Player);

        Game.quadtree.clear();
        Game.quadtree.insert(Player);
        Game.quadtree.insert(Enemy);

        for (var i = 1; i < Game.map.ground.groundBlocks.blockTotal+1; i++) {
            Game.quadtree.insert(Game.map.ground.groundBlocks[i]);
        }

        detectCollision();

        Camera1.update();
    }

    function detectCollision() {
        var objects = [];
        Game.quadtree.getAllObjects(objects);

        for (var x = 0, len = objects.length; x < len; x++) {
            Game.quadtree.findObjects(obj = [], objects[x]);

            for (y = 0, length = obj.length; y < length; y++) {

                // DETECT COLLISION ALGORITHM
                if (objects[x] != obj[y] &&
                    (objects[x].x < obj[y].x + obj[y].width &&
                    objects[x].x + objects[x].width > obj[y].x &&
                    objects[x].y < obj[y].y + obj[y].height &&
                    objects[x].y + objects[x].height > obj[y].y)) {
                    console.log(objects[x].name + " is colliding with " + obj[y].name + "!");
                }
            }
        }
    };

    // Game draw function
    var draw = function () {

        // clears canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // redraw all objects
        Game.map.ground.draw(ctx, canvas, Camera1.xView, Camera1.yView);
        Player.draw(ctx, Camera1.xView, Camera1.yView);
        Enemy.draw(ctx, Camera1.xView, Camera1.yView);

        Game.playerpos = [Player.x, Player.y];
    }

    var gameLoop = function () {
        update();
        draw();
    }

    // add play/pause capabilities

    var runningId = -1;

    Game.play = function () {
        if (runningId == -1) {
            runningId = setInterval(function () {
                gameLoop();
            }, 1000 / 30);
        }
    }

    Game.togglePause = function () {
        if (runningId == -1) {
            Game.play();
        } else {
            clearInterval(runningId);
            runningId = -1;
        }
    }

})();

Game.controls = {
    left: false,
    up: false,
    right: false,
    down: false,
};

window.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
        case 37: // left arrow
            Game.controls.left = true;
            break;
        case 38: // up arrow
            Game.controls.up = true;
            break;
        case 39: // right arrow
            Game.controls.right = true;
            break;
    }
}, false);

window.addEventListener("keyup", function (e) {
    switch (e.keyCode) {
        case 37: // left arrow
            Game.controls.left = false;
            break;
        case 38: // up arrow
            Game.controls.up = false;
            break;
        case 39: // right arrow
            Game.controls.right = false;
            break;
        case 80: // key P pauses the game
            Game.togglePause();
            break;
    }
}, false);


// start the game whn the page is loaded
window.onload = function () {
    Game.play();
}