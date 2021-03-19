/* jshint esversion: 6*/
var Physics = pc.createScript('physics');

Physics.states = {
    idle:{
        animation: "Idle Looping"
    },
    walk:{          
        animation: "Sonic Walk Fast Loop"
    },
    jog:{
        animation: "Sonic Jog Loop"
    },
    run:{
        animation: "Running"
    },
    jump:{
        animation: "Short Jump"
    },
    brake:{
        animation: "Smooth Brakes Loop"
    },
    grind:{
        animation: "Grind Forward Loop"
    }
};

// initialize code called once per entity
Physics.prototype.initialize = function() {
    // static vars
    this.FSP = 0;
    this.Ready = false;
    this.CamPoint = 1;
    this.Grinding = false;
    this.GrindParent = null;
    this.GrindPoint = 0;
    
    // this.setAnimation()
    // Random starting animation...
    var choice1 = (Math.floor(Math.random() * 100) > 50) ? "Sonic Wait Idle 1":"Idle 0";
    var choice2 = (Math.floor(Math.random() * 100) > 50) ? "Idle Looping":"Idle 0";
    var choice3 = (Math.floor(Math.random() * 100) > 50) ? "ReadyUP":"Ready Pose";
    var choice4 = (Math.floor(Math.random() * 100) > 50) ? "Idle 5":"Idle 3";
    
    let picked1 = (Math.random() > 0.5) ? choice1:choice2;
    let picked2 = (Math.random() > 0.5) ? choice3:choice4;
    
    var animation = (Math.random() > 0.5) ? picked1:picked2;

    this.entity.findByName('Body').animation.play(animation);
    
    // Plays the sound Ready go..
    this.app.once('stage:ready',function(){
        // alert(); 
        this.entity.findByName('Body').sound.play('Ready');
    },this);

    this.app.once('stage:go',function(){
        this.entity.findByName('Body').sound.play("Go");
        // this.FSP +=  20;
        this.Ready = true;
    },this);
    
    // this.app.keyboard.on(pc.EVENT_KEYDOWN, this.KEYDOWN,this);
    // this.app.keyboard.on(pc.EVENT_KEYUP, this.KEYUP, this);
    
    this.entity.collision.on('collisionstart',function(result){
        if(result.other.parent.name === 'Grind'){
            this.Grinding = true;
            this.GrindParent = result.other.parent;
        }
    },this);
};

Physics.prototype.postUpdate = function(dt){
    if(this.Ready){
        var cam = this.app.root.findByName('Camera');
        var point = this.entity.findByName("Campoint " + this.CamPoint.toString());
        cam.setPosition(cam.getPosition().lerp(cam.getPosition(),point.getPosition(),0.054));
        cam.lookAt(this.entity.getLocalPosition());
    }
};

// update code called every frame
Physics.prototype.update = function(dt) {
    var model = this.entity.findByName('Body');
    var start = this.entity.getLocalPosition();
    var end = new pc.Vec3();
    end.copy(this.entity.findByName('Body').forward).scale(-5).add(start);
    this.app.renderLine(start,end,pc.Color.RED);
    model.animation.speed = this.FSP/7+1;
    
    var result = this.app.systems.rigidbody.raycastFirst(start,end);
    
    if(result && result.entity.name != this.entity.name){
        // temp.copy(result.normal.normalize()).scale(0.3).add(result.point.normalize());
        // this.app.renderLine(result.point, temp, pc.Color.BLUE);
        // var a = result.entity.getLocalEulerAngles().x - 90;
        
        // model.setLocalEulerAngles(a,model.getLocalEulerAngles().y,model.getLocalEulerAngles().z);
    }
    
    if(this.Ready){
        if(this.FSP > -0.000674){
            // basics
            if(this.Grinding === false){
                if(this.app.keyboard.isPressed(pc.KEY_W)){
                    let force = model.up.clone().scale(this.FSP);
                    this.entity.rigidbody.applyForce(force);
                    this.FSP += 0.085; // How fast he gains speed
                }else{
                    this.FSP = pc.math.lerp(this.FSP,0,0.778654);
                }
                if(this.app.keyboard.isPressed(pc.KEY_A)){
                    model.rotateLocal(0,0,-2);
                  this.FSP -= 0.10; //How fast he loses from turning
                } 
                
                if(this.app.keyboard.isPressed(pc.KEY_D)){
                    model.rotateLocal(0,0,2);
                }
                if (this.app.keyboard.isPressed(pc.KEY_E)){
                    model.translateLocal(4,0,0);
                }
            }else{
                this.setAnimation('grind',0.12);
                var points = this.GrindParent.findByName('WayPoints').children;
                var currrentP = points[this.GrindPoint];
                var distance = currrentP.getLocalPosition().distance(this.entity.getLocalPosition());
                var length = points.length;
                // var lookto = currrentP.getLocalPosition();
                // var lookfrom = new pc.Vec3();
                this.FSP = 0;         
                
                if(this.Grinding){
                    this.DisableRigidbody();
                    this.entity.lookAt(currrentP.getLocalPosition());
                    this.entity.translateLocal(0,0,-0.25);
                    model.setLocalEulerAngles(-90,0,-180);
                }
                  
                if(distance < 0.25){
                    if(this.GrindPoint != length-1){
                        this.GrindPoint++;
                    }else{
                        this.entity.setLocalEulerAngles(0,0,0);
                        model.setLocalEulerAngles(90,0,0);
                        this.EnableRigidbody();
                        this.Grinding = false;
                    }
                }
            }
            
            // animations
            if(!this.Grinding){
                if(this.FSP < 0.1){
                    this.setAnimation('idle',0.11);
                }else if(this.FSP > 0.1 && this.FSP < 0.4){
                    this.setAnimation('walk',0.12);                
                }else if(this.FSP > 8 && this.FSP < 12){
                    this.setAnimation('jog',0.11);
                }else if(this.FSP > 66 && this.FSP < 78){
                    this.setAnimation('run',0.12);
                }
            }
            
        }else{
            // this.setAnimation("jump");
        }   
    }
};

Physics.prototype.DisableRigidbody = function(){
    this.entity.rigidbody.enabled = false;
};

Physics.prototype.EnableRigidbody = function(){
    this.entity.rigidbody.enabled = true;
};

Physics.prototype.setAnimation = function(state,blend,loop){
    var model = this.entity.findByName('Body');
    // alert(this.entity.findByName('Body').animation.data.currAnim);
    if(model.animation.data.currAnim !== Physics.states[state].animation){
        model.animation.play(Physics.states[state].animation,blend);
    }
};

// swap method called for script hot-reloading
// inherit your script state here
// Physics.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/
