var player, controller;
var w_canvas = 800;
var h_canvas = 500;

var gameover = false;
var asteroids = [];

context = document.querySelector("canvas").getContext("2d");
context.canvas.width = w_canvas;
context.canvas.height = h_canvas;

player = {
    x: w_canvas / 2,
    y: h_canvas / 2,
    x_velocity: 0,
    y_velocity: 0,
    velocity: 0,
    max_velocity: 4,

    turning_speed: 5 / 360 * 2 * Math.PI, //Affects the speed with which the player turns
    forward_speed: 0.3,
    velocity_direction: 0,
    direction: 0, //Angle between 0 and 2PI

    player_wingspan: 16,
    player_height: 16,
    player_hitbox: 5,

    print: function () {
        context.fillStyle = "#0000ff";

        //Draws the player
        context.translate(player.x, player.y); //Makes the coords relative to the center of the player
        context.rotate(player.direction); //Rotates the path that is going to be made
        context.beginPath();
        context.lineTo(-player.player_wingspan / 2, player.player_height / 2);
        context.lineTo(0, -player.player_height / 2);
        context.lineTo(player.player_wingspan / 2, player.player_height / 2);
        context.lineTo(0, player.player_height / 4);
        context.lineTo(-player.player_wingspan / 2, player.player_height / 2);
        context.fill();
        context.rotate(-player.direction); //Cancels the rotation
        context.translate(-player.x, -player.y); //Makes the coords absolute again
    },

    movement: function () {
        //console.log("movement", player.x + " " + player.y);
        if (controller.forward) {
            let last_y_velocity = player.velocity * -Math.cos(player.velocity_direction);
            let last_x_velocity = player.velocity * Math.sin(player.velocity_direction);
            let now_y_velocity = player.forward_speed * -Math.cos(player.direction);
            let now_x_velocity = player.forward_speed * Math.sin(player.direction);
            let y_velocity = last_y_velocity + now_y_velocity;
            let x_velocity = last_x_velocity + now_x_velocity;

            //console.log(last_x_velocity, last_y_velocity, now_x_velocity, now_y_velocity, x_velocity, y_velocity);

            player.velocity = Math.sqrt(Math.pow(x_velocity, 2) + Math.pow(y_velocity, 2));

            //Domain of atan is from -Pi/2 to Pi/2
            if (x_velocity > 0) {
                player.velocity_direction = Math.atan(y_velocity / x_velocity) + Math.PI / 2;
            }
            else {
                player.velocity_direction = Math.atan(y_velocity / x_velocity) + 3 * Math.PI / 2;
            }

        }

        if (controller.left) {
            player.direction -= player.turning_speed;
            if (player.direction < 0) {
                player.direction += 2 * Math.PI;
            }
        }

        if (controller.right) {
            player.direction += player.turning_speed;
            if (player.direction > 2 * Math.PI) {
                player.direction -= 2 * Math.PI;
            }
        }

        player.y_velocity = player.velocity * -Math.cos(player.velocity_direction);
        player.x_velocity = player.velocity * Math.sin(player.velocity_direction);

        if (player.velocity > player.max_velocity) {
            player.velocity -= player.forward_speed; //Friction to prevent infinite growth
        }

        player.x = (player.x + w_canvas + player.x_velocity) % w_canvas;
        player.y = (player.y + h_canvas + player.y_velocity) % h_canvas;
    }


}


controller = {

    forward: false,
    left: false,
    right: false,
    shooting: false,

    keyListener: function (event) {
        var key_state = event.type == "keydown" ? true : false;

        switch (event.keyCode) {
            case 65: //a key
                controller.left = key_state;
                break;
            case 87: //w key
                controller.forward = key_state;
                break;
            case 68: //d key
                controller.right = key_state;
                break;
        }
    }

}

class Asteroid {

    constructor(x, y, velocity, direction, size) {

        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.direction = direction;
        this.size = size;
        this.size_multiplier = 5;
        this.y_velocity = velocity * -Math.cos(direction)
        this.x_velocity = velocity * Math.sin(direction);
    }


    print() {
        context.fillStyle = "#1f180c";
        context.beginPath();
        context.arc(this.x, this.y, this.size * 5, 0, 2 * Math.PI);
        context.fill();
    }

    movement() {
        this.x += this.x_velocity;
        this.y += this.y_velocity;
    }

    outofbondaries() {
        if(this.x_velocity > 0 && this.x > w_canvas) return true;
        if(this.x_velocity < 0 && this.x < 0) return true;
        if(this.y_velocity < 0 && this.y < 0) return true;
        if(this.y_velocity > 0 && this.y > h_canvas) return true;
    }

    collision(){
        let x = player.x - this.x;
        let y = player.y - this.y;
        let distance = Math.sqrt(x*x + y*y);
        if( distance < (this.size * this.size_multiplier + player.player_hitbox)){ //There as a collision
            gameover = true;
        }
    }
}

function CalcAsteroids() {
    for (var asteroid of asteroids) {
        asteroid.movement();
        asteroid.print();
        //asteroid.collision();

        //Check if the asteroid has left the screen
        let trash = asteroid.outofbondaries();
        if (trash) {

            //Removes the asteroid that got out of the screen
            //https://stackoverflow.com/questions/10024866/remove-object-from-array-using-javascript
            let idx = asteroids.indexOf(asteroid);
            if (idx !== -1) {
                asteroids.splice(idx, 1);
            }
        }
    }
}

for(var i = 0; i < 100; i ++){
CreateAsteroid();
}

function loop() {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, w_canvas, h_canvas);

    //console.log(player.direction);

    if(!gameover){
    player.movement();
    player.print();
    }

    CalcAsteroids();

window.requestAnimationFrame(loop);
}

function CreateAsteroid(){

    let outside_angle = Math.random() * 2*Math.PI; //Defines the position from where the asteroid starts from
    let inside_angle = Math.random() * 2*Math.PI; //Defines the position where the asteroid heads to

    //The constants multiplied by define the "radius" of where we are coming from
    //Makes so we come from outside the screen
    let outside_x = w_canvas/2 + Math.sin(outside_angle) * 550;
    let outside_y = h_canvas/2 + -Math.cos(outside_angle) * 400;

    //The constants multiplied by define the "radius" of where we are going to
    //Makes so we have almost all paths in the screen
    let inside_x = w_canvas/2 + Math.sin(inside_angle) * 350;
    let inside_y = h_canvas/2 + -Math.cos(inside_angle) * 300;

    //Gets the displacement
    let movement_x = inside_x - outside_x;
    let movement_y = inside_y - outside_y;


    //Calculates the angle given the displacement
    var angle;
    if(movement_x > 0){
        angle = Math.atan(movement_y/movement_x) + Math.PI/2;
    }
    else{
        angle = Math.atan(movement_y/movement_x) + 3 * Math.PI / 2;
    }

    console.log("outside", outside_angle, "inside", inside_angle, "outx", outside_x, "outy", outside_y, "inx", inside_x, "iny", inside_y, "movx", movement_x, "movy", movement_y, "angle", angle);

    asteroids.push(new Asteroid(outside_x, outside_y, 2, angle, 1));

}

window.addEventListener("keydown", controller.keyListener);
window.addEventListener("keyup", controller.keyListener);
window.requestAnimationFrame(loop);