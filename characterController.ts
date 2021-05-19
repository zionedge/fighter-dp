import { Mesh, Scene, TransformNode, Vector3, UniversalCamera, Quaternion, Ray, AnimationGroup, Scalar, RayHelper, Color3, AnimationEvent} from "babylonjs";
import { PlayerInput } from "./inputController";
import { Stack } from "./helperFuctions";

type Animation = { name: string, anim: AnimationGroup, weight: number }

export enum PlayerState { Idle, Walk, Jump, LeftPunch, RightPunch, Kick, RecieveHit, KO, JumpKick, JumpLeftPunch, JumpRightPunch, WalkLeftPunch, WalkRightPunch, WalkKick, 
                            Run, RunLeftPunch, RunRightPunch, RunKick, Victory }

export class Player extends TransformNode {
    public camera : UniversalCamera;
    public scene : Scene;
    public input : PlayerInput;

    public playerMesh : Mesh;
    public hitMesh : Mesh;

    public playerState : PlayerState;
    private statesStack : Stack<PlayerState>;

    private camRoot : TransformNode;
    private game : any;

    //const values
    private playerSpeed: number = 0.05;
    private static readonly JUMP_FORCE: number = 0.15;
    private static readonly GRAVITY: number = -2.81;
    private static readonly LEFTPUNCH_DAMAGE = 6;
    private static readonly RIGHTPUNCH_DAMAGE = 6;
    private static readonly KICK_DAMAGE = 10;

    //player movement
    private deltaTime: number = 0;
    private h: number;
    private direction: boolean = true;
 
    private moveDirection: Vector3 = new Vector3();
    private inputAmt: number;

    private gravity: Vector3 = new Vector3();
    private grounded : boolean = true;
    private jumpCount : number = 1;

    private isRay : boolean = false;
    private ray : Ray;

    private idleAnimation : Animation;
    private walkAnimation : Animation;
    public currAnimation : Animation;
    private leftPunchAnimation : Animation;
    private jumpAnimation : Animation;
    private jumpKickAnimation : Animation;
    private walkBackAnimation : Animation;
    private rightPunchAnimation : Animation;
    private fallAnimation : Animation;
    private kickAnimation : Animation;
    private reciveHitAnimation : Animation;
    private KOAnimation : Animation;

    public setupHit(state : PlayerState, frame : number, target : Mesh) : void {
        
        if(state == PlayerState.LeftPunch){
            this.leftPunchAnimation.anim.children[30].animation.addEvent(new AnimationEvent(frame,()=>{
                if(this.playerMesh.getChildMeshes()[2].intersectsMesh(target,true)){
                    this.game.decreaseHP(this,Player.LEFTPUNCH_DAMAGE);
                }
            },false));
        } else if(state == PlayerState.RightPunch){
            this.rightPunchAnimation.anim.children[102].animation.addEvent(new AnimationEvent(frame,()=>{
                if(this.playerMesh.getChildMeshes()[4].intersectsMesh(target,true)){
                    this.game.decreaseHP(this,Player.RIGHTPUNCH_DAMAGE);
                }
            },false));
        } else if(state == PlayerState.Kick){
            this.kickAnimation.anim.children[186].animation.addEvent(new AnimationEvent(frame,()=>{
                if(this.playerMesh.getChildMeshes()[3].intersectsMesh(target,true)){
                    this.game.decreaseHP(this,Player.KICK_DAMAGE);
                }
            },false));
        } else {

        }
    }

    constructor (assets, scene : Scene, input : PlayerInput, name: string, camera : UniversalCamera, camRoot : TransformNode, main : any) {
        super(name,scene);
        this.scene = scene;
        this.camRoot = camRoot;
        this.camera = camera;
        this.game = main;

        this.playerMesh = assets.mesh;
        this.playerMesh.parent = this;
        this.hitMesh = assets.hitMesh;
    
       this.idleAnimation = { name: assets.animationGroups[2].name, anim: assets.animationGroups[2], weight: 1};
       this.idleAnimation.anim.loopAnimation = true;
       this.walkAnimation = { name: assets.animationGroups[9].name, anim: assets.animationGroups[9], weight: 0};
       this.walkAnimation.anim.loopAnimation = true;
       this.leftPunchAnimation = { name: assets.animationGroups[7].name, anim: assets.animationGroups[7], weight: 0};
       this.leftPunchAnimation.anim.loopAnimation = false;
       this.jumpAnimation = { name: assets.animationGroups[3].name, anim: assets.animationGroups[3], weight: 0};
       this.jumpAnimation.anim.loopAnimation = false;
       this.jumpAnimation.anim.speedRatio = 3.0;
       this.jumpKickAnimation = { name: assets.animationGroups[4].name, anim: assets.animationGroups[4], weight: 0};
       this.jumpKickAnimation.anim.loopAnimation = false;
       this.fallAnimation = { name: assets.animationGroups[0].name, anim: assets.animationGroups[0], weight: 0};
       this.fallAnimation.anim.loopAnimation = false;
       this.fallAnimation.anim.speedRatio = 3.0;
       this.rightPunchAnimation = { name: assets.animationGroups[8].name, anim: assets.animationGroups[8], weight: 0};
       this.rightPunchAnimation.anim.loopAnimation = false;
       this.kickAnimation = { name: assets.animationGroups[5].name, anim: assets.animationGroups[5], weight: 0};
       this.kickAnimation.anim.loopAnimation = false;
       this.reciveHitAnimation = { name: assets.animationGroups[1].name, anim: assets.animationGroups[1], weight: 0};
       this.reciveHitAnimation.anim.loopAnimation = false;


       this.leftPunchAnimation.anim.onAnimationGroupEndObservable.add(()=>{
           //this.currAnimation.anim.stop();
           this.input.leftPunchKeyDown = false;
           this.playerState = this.playerState===PlayerState.KO ? PlayerState.KO : (this.playerState===PlayerState.Victory ? PlayerState.Victory : PlayerState.Idle);
           this.currAnimation = this.idleAnimation;
           //this.currAnimation.anim.play(this.currAnimation.anim.loopAnimation);
       },1, false, this);

       this.jumpKickAnimation.anim.onAnimationEndObservable.add(()=>{
           //this.currAnimation.anim.stop();
           this.input.jumpKeyDown = false;
           this.input.kickKeyDown = false;
           this.playerState = this.playerState===PlayerState.KO ? PlayerState.KO : (this.playerState===PlayerState.Victory ? PlayerState.Victory : PlayerState.Idle);
           this.currAnimation = this.idleAnimation;
           //this.currAnimation.anim.play(this.currAnimation.anim.loopAnimation);
       },1,false,this);
       
        this.rightPunchAnimation.anim.onAnimationGroupEndObservable.add(()=>{
            //this.currAnimation.anim.stop();
            this.input.leftPunchKeyDown = false;
            this.playerState = this.playerState===PlayerState.KO ? PlayerState.KO : (this.playerState===PlayerState.Victory ? PlayerState.Victory : PlayerState.Idle);
            this.currAnimation = this.idleAnimation;
            //this.currAnimation.anim.play(this.currAnimation.anim.loopAnimation);
        },1,false,this);

        this.kickAnimation.anim.onAnimationGroupEndObservable.add(()=>{
            //this.currAnimation.anim.stop();
            this.input.kickKeyDown = false;
            this.playerState = this.playerState===PlayerState.KO ? PlayerState.KO : (this.playerState===PlayerState.Victory ? PlayerState.Victory : PlayerState.Idle);
            this.currAnimation = this.idleAnimation;
            //this.currAnimation.anim.play(this.currAnimation.anim.loopAnimation);
        },1,false,this);

        this.jumpAnimation.anim.onAnimationEndObservable.add(()=>{
            //this.currAnimation.anim.stop();
            this.currAnimation = this.fallAnimation;
            this.currAnimation.anim.play(this.currAnimation.anim.loopAnimation);
        },1,false,this);

        this.fallAnimation.anim.onAnimationGroupEndObservable.add(()=>{
            //this.currAnimation.anim.stop();
            this.playerState = this.playerState===PlayerState.KO ? PlayerState.KO : (this.playerState===PlayerState.Victory ? PlayerState.Victory : PlayerState.Idle);
            this.currAnimation = this.idleAnimation;
            //this.currAnimation.anim.play(this.currAnimation.anim.loopAnimation);
        },1,false,this);
       
       this.input = input;
       this.setupAnimations();
    }

    // start animations
    private setupAnimations() : void {
        this.idleAnimation.anim.setWeightForAllAnimatables(this.idleAnimation.weight);
        this.idleAnimation.anim.play(this.idleAnimation.anim.loopAnimation);
        this.currAnimation = this.idleAnimation;
        this.playerState = PlayerState.Idle;
    }

    private weightedAnimation() : void {
        if(this.currAnimation && this.currAnimation.weight!==1){
            this.currAnimation.weight = Scalar.Clamp(this.currAnimation.weight + 0.1, 0, 1);
            this.currAnimation.anim.setWeightForAllAnimatables(this.currAnimation.weight);
            if(this.currAnimation !== this.idleAnimation) {
                this.idleAnimation.weight = Scalar.Clamp(this.idleAnimation.weight - 0.1, 0, 1);
                this.idleAnimation.anim.setWeightForAllAnimatables(this.idleAnimation.weight);
            }
            if(this.currAnimation !== this.walkAnimation) {
                this.walkAnimation.weight = Scalar.Clamp(this.walkAnimation.weight - 0.1, 0, 1);
                this.walkAnimation.anim.setWeightForAllAnimatables(this.walkAnimation.weight);
            }
            if(this.currAnimation !== this.leftPunchAnimation) {
                this.leftPunchAnimation.weight = Scalar.Clamp(this.leftPunchAnimation.weight - 0.1, 0, 1);
                this.leftPunchAnimation.anim.setWeightForAllAnimatables(this.leftPunchAnimation.weight);
            }
            if(this.currAnimation !== this.rightPunchAnimation) {
                this.rightPunchAnimation.weight = Scalar.Clamp(this.rightPunchAnimation.weight - 0.1, 0, 1);
                this.rightPunchAnimation.anim.setWeightForAllAnimatables(this.rightPunchAnimation.weight);
            }  
            if(this.currAnimation !== this.kickAnimation) {
                this.kickAnimation.weight = Scalar.Clamp(this.kickAnimation.weight - 0.1, 0, 1);
                this.kickAnimation.anim.setWeightForAllAnimatables(this.kickAnimation.weight);
            }  
            if(this.currAnimation !== this.jumpAnimation) {
                this.jumpAnimation.weight = Scalar.Clamp(this.jumpAnimation.weight - 0.1, 0, 1);
                this.jumpAnimation.anim.setWeightForAllAnimatables(this.jumpAnimation.weight);
            }
            if(this.currAnimation !== this.fallAnimation) {
                this.fallAnimation.weight = Scalar.Clamp(this.fallAnimation.weight - 0.1, 0, 1);
                this.fallAnimation.anim.setWeightForAllAnimatables(this.fallAnimation.weight);
            }
            if(this.currAnimation !== this.reciveHitAnimation) {
                this.reciveHitAnimation.weight = Scalar.Clamp(this.reciveHitAnimation.weight - 0.1, 0, 1);
                this.reciveHitAnimation.anim.setWeightForAllAnimatables(this.reciveHitAnimation.weight);
            }
            if(this.currAnimation !== this.jumpKickAnimation) {
                this.jumpKickAnimation.weight = Scalar.Clamp(this.jumpKickAnimation.weight - 0.1, 0, 1);
                this.jumpKickAnimation.anim.setWeightForAllAnimatables(this.jumpKickAnimation.weight);
            }   
        }
    }

    // TODO WALK BACKWARDS, BACKWARDS ATTACKS, CROUCH, CROUCH ATTACKS, CROUCH HIT, COMBOS, DUAL PRESS ????
    private animationControl() : void {
        switch(this.playerState){
            case PlayerState.Idle: {
                if(this.input.jumpKeyDown && this.input.kickKeyDown) {
                    this.playerState = PlayerState.JumpKick;
                } else if(this.input.inputMap[this.input.inputMaper.left] ||
                    this.input.inputMap[this.input.inputMaper.right]) {
                        this.playerState = PlayerState.Walk;
                } else if(this.input.leftPunchKeyDown) {
                    this.playerState = PlayerState.LeftPunch;
                } else if(this.input.rightPunchKeyDown) {
                    this.playerState = PlayerState.RightPunch;
                } else if(this.input.kickKeyDown) {
                    this.playerState = PlayerState.Kick;
                } else if(this.input.jumpKeyDown && this.input.leftPunchKeyDown){
                    // TODO
                } else if(this.input.jumpKeyDown){
                    this.playerState = PlayerState.Jump;
                } else {
                    // idle animation??
                    if(this.currAnimation===this.idleAnimation) return;
                    if(this.currAnimation){
                        this.idleAnimation.anim.syncAllAnimationsWith(null);
                        this.currAnimation.anim.syncAllAnimationsWith(this.idleAnimation.anim.animatables[0]);
                    }
                    this.changeAnimation(this.idleAnimation);
                }
                break;
            }
            case PlayerState.Jump: {
                if(this.input.leftPunchKeyDown){
                    this.playerState = PlayerState.JumpLeftPunch;
                } else if(this.input.rightPunchKeyDown) {
                    this.playerState = PlayerState.JumpRightPunch;
                } else if(this.input.kickKeyDown) {
                    this.playerState = PlayerState.JumpKick;
                } else {
                    if(this.currAnimation===this.jumpAnimation || this.currAnimation===this.fallAnimation) return;
                    if(this.currAnimation) {
                        this.jumpAnimation.anim.syncAllAnimationsWith(null);
                        this.currAnimation.anim.syncAllAnimationsWith(this.jumpAnimation.anim.animatables[0]);
                    }
                    this.changeAnimation(this.jumpAnimation);
                }
                break;
            }
            case PlayerState.JumpKick: {
                if(this.currAnimation===this.jumpKickAnimation) return;
                if(this.currAnimation) {
                    this.jumpKickAnimation.anim.syncAllAnimationsWith(null);
                    this.currAnimation.anim.syncAllAnimationsWith(this.jumpKickAnimation.anim.animatables[0]);
                }
                this.changeAnimation(this.jumpKickAnimation);
                break;
            }
            case PlayerState.JumpLeftPunch: {
                // jumpleftpunch animation??
                break;
            }
            case PlayerState.JumpRightPunch: {
                // jumprightpunch animation??
                break;
            }
            case PlayerState.KO: {
                // KO animation
                break;
            }
            case PlayerState.Kick: {
                // kick animation
                if(this.currAnimation===this.kickAnimation) return;
                if(this.currAnimation){
                    this.kickAnimation.anim.syncAllAnimationsWith(null);
                    this.currAnimation.anim.syncAllAnimationsWith(this.kickAnimation.anim.animatables[0]);
                }
                this.changeAnimation(this.kickAnimation);
                break;
            }
            case PlayerState.LeftPunch: {
                //left punch animation
                if(this.currAnimation===this.leftPunchAnimation) return;
                if(this.currAnimation){
                    this.leftPunchAnimation.anim.syncAllAnimationsWith(null);
                    this.currAnimation.anim.syncAllAnimationsWith(this.leftPunchAnimation.anim.animatables[0]);
                }
                this.changeAnimation(this.leftPunchAnimation);
                break;
            }
            case PlayerState.RecieveHit: {
                // recieve hit animation based on previous state
                break;
            }
            case PlayerState.RightPunch: {
                // right punch animation
                if(this.currAnimation===this.rightPunchAnimation) return;
                if(this.currAnimation){
                    this.rightPunchAnimation.anim.syncAllAnimationsWith(null);
                    this.currAnimation.anim.syncAllAnimationsWith(this.rightPunchAnimation.anim.animatables[0]);
                }
                this.changeAnimation(this.rightPunchAnimation);
                break;
            }
            case PlayerState.Run: {
                // run animation 
                break;
            }
            case PlayerState.RunKick: {
                // run kick animation
                break;
            }
            case PlayerState.RunLeftPunch: {
                // run left punch animation
                break;
            }
            case PlayerState.RunRightPunch: {
                // run right punch animation
                break;
            }
            case PlayerState.Walk: {
                if(this.input.leftPunchKeyDown) {
                    this.playerState = PlayerState.WalkLeftPunch;
                } else if(this.input.rightPunchKeyDown) {
                    this.playerState = PlayerState.WalkRightPunch;
                } else if(this.input.kickKeyDown) {
                    this.playerState = PlayerState.WalkKick;
                } else if(this.input.inputMap[this.input.inputMaper.left] ||
                        this.input.inputMap[this.input.inputMaper.right]){
                    // walk animation
                    if(this.currAnimation===this.walkAnimation) return;
                    if(this.currAnimation){
                        this.walkAnimation.anim.syncAllAnimationsWith(null);
                        this.currAnimation.anim.syncAllAnimationsWith(this.walkAnimation.anim.animatables[0]);
                    }
                    this.changeAnimation(this.walkAnimation);
                } else if(this.input.jumpKeyDown) {
                    this.playerState = PlayerState.Jump;
                } else {
                    this.playerState = PlayerState.Idle;
                }
                break;
            }
            case PlayerState.WalkKick: {
                // walk kick animation
                if(this.currAnimation===this.kickAnimation) return;
                if(this.currAnimation){
                    this.kickAnimation.anim.syncAllAnimationsWith(null);
                    this.currAnimation.anim.syncAllAnimationsWith(this.kickAnimation.anim.animatables[0]);
                }
                this.changeAnimation(this.kickAnimation);
                break;
            }
            case PlayerState.WalkLeftPunch: {
                // walk left punch animation
                if(this.currAnimation===this.leftPunchAnimation) return;
                if(this.currAnimation){
                    this.leftPunchAnimation.anim.syncAllAnimationsWith(null);
                    this.currAnimation.anim.syncAllAnimationsWith(this.leftPunchAnimation.anim.animatables[0]);
                }
                this.changeAnimation(this.leftPunchAnimation);
                break;
            }
            case PlayerState.WalkRightPunch: {
                // walk right punch animation
                if(this.currAnimation===this.rightPunchAnimation) return;
                if(this.currAnimation){
                    this.rightPunchAnimation.anim.syncAllAnimationsWith(null);
                    this.currAnimation.anim.syncAllAnimationsWith(this.rightPunchAnimation.anim.animatables[0]);
                }
                this.changeAnimation(this.rightPunchAnimation);
                break;
            }
            case PlayerState.Victory: {
                break;
            }
        }
    }

    private changeAnimation(anim : Animation) {
        if(this.currAnimation != anim){
            //this.currAnimation.anim.stop();
            this.currAnimation = anim;
            this.currAnimation.anim.play(this.currAnimation.anim.loopAnimation);
        }
    } 
 
    // ground detection with ray for player mesh
    private floorRaycast( offsetx : number, offsetz : number, raycastlen : number) : Vector3 {
        let raycastFloorPos = new Vector3(this.playerMesh.position.x + offsetx, this.playerMesh.position.y + 1, this.playerMesh.position.z + offsetz);
        let ray = new Ray(raycastFloorPos, Vector3.Down(), raycastlen);

        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }
        let pick = this.scene.pickWithRay(ray, predicate);

        if(pick.hit){
            return pick.pickedPoint;
        } else {
            return Vector3.Zero();
        }
    }

    /*
    private collisionRaycast() : Vector3 {
        let raycastFloorPos = new Vector3(this.playerMesh.position.x, this.playerMesh.position.y + 0.8, this.playerMesh.position.z);
        let leftRay = new Ray(raycastFloorPos, Vector3.Left(), 0.5);
        let rightRay = new Ray(raycastFloorPos, Vector3.Right(), 0.5);
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }
        let leftPick = this.scene.pickWithRay(leftRay, predicate);
        let rightPick = this.scene.pickWithRay(rightRay, predicate);
        if(leftPick.hit || rightPick.hit){
            return leftPick.hit > rightPick.hit ? leftPick.pickedPoint : rightPick.pickedPoint;
        }  else {
            return Vector3.Zero();
        }
    }*/

    // handles jumping
    private updateGroundDetection(collision : boolean) : void {
        if(!this.isGrounded()){
            this.gravity = this.gravity.addInPlace(Vector3.Up().scale(this.deltaTime * Player.GRAVITY * 0.15));
            this.grounded = false;
        }

        if(this.gravity.y < -Player.JUMP_FORCE) {
            this.gravity.y = -Player.JUMP_FORCE;
        }

        if(this.playerState !== PlayerState.KO && this.playerState !== PlayerState.Victory){ 
            if(collision){
                this.playerMesh.moveWithCollisions(this.gravity);
            } else {
                this.playerMesh.moveWithCollisions(this.moveDirection.addInPlace(this.gravity));
            }
        }
        

        if(this.isGrounded()){
            this.gravity.y = 0;
            this.jumpCount = 1;
            this.grounded = true;
        }

        if (this.input.jumpKeyDown && this.jumpCount > 0 ) {
            this.gravity.y = Player.JUMP_FORCE;
            this.jumpCount--;
        }
    }

    // check if player mesh is touching ground
    private isGrounded() : boolean {
        if (this.floorRaycast(0,0,1.0).equals(Vector3.Zero())) {
            return false;
        } else {
            return true;
        }
    }

    // moving player mesh + runing animations
    private beforeRenderUpdate(collision: boolean) :void {
        this.updateFromControls();
        this.updateGroundDetection(collision);
    }

    // register function to be called before frame render
    public activatePlayerCamera(hit: Mesh) : UniversalCamera {
        this.scene.registerBeforeRender(()=> {
            this.playerMesh.getChildMeshes().forEach((m,i)=>{
                if(m.name.indexOf("Box") != -1){
                    m.refreshBoundingInfo(true);
               }
            });

            //
            if(!this.isRay){
                this.isRay = true;
            const vec = new Vector3(this.playerMesh.position.x, this.playerMesh.position.y+2, this.playerMesh.position.z);
            this.ray = new Ray(vec, Vector3.Left() , 1.2);
            RayHelper.CreateAndShow(this.ray,this.scene,Color3.Yellow());
            } else {
                this.ray.origin = new Vector3(this.playerMesh.position.x, this.playerMesh.position.y+2, this.playerMesh.position.z);
                this.ray.direction = this.direction ? Vector3.Left() : Vector3.Right();
                const predicate = (mesh) => {
                    return mesh==hit;
                } 
                const pick = this.scene.pickWithRay(this.ray, predicate);
                const rayLower = new Ray(new Vector3(this.playerMesh.position.x, this.playerMesh.position.y+0.5, this.playerMesh.position.z),
                (this.direction ? Vector3.Left() : Vector3.Right()),1.2);
                const pickLower = this.scene.pickWithRay(rayLower, predicate);
                
                if(pick.hit || pickLower.hit){
                    this.beforeRenderUpdate(true);     
                } else {
                    this.beforeRenderUpdate(false);
                }
            }
            
            this.animationControl();
            this.weightedAnimation();
        })
        return this.camera;
    }

    // movement update
    private updateFromControls() : void {
        this.deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

        this.moveDirection = Vector3.Zero();
        this.h = this.input.horizontal;

        if(this.input.horizontal == 1) {
            this.direction = true;            
        } else if(this.input.horizontal == -1) {
            this.direction = false;
        } else {}

        //--MOVEMENTS BASED ON CAMERA --
        let right = this.camRoot.right;
        this.moveDirection = right.scaleInPlace(this.h);

        //clamp the input value so that diagonal movement isn't twice as fast
        let inputMag = Math.abs(this.h);
        if (inputMag < 0) {
            this.inputAmt = 0;
        } else if (inputMag > 1) {
            this.inputAmt = 1;
        } else {
            this.inputAmt = inputMag;
        }

        //final movement that takes into consideration the inputs
        this.moveDirection = this.moveDirection.scaleInPlace(this.inputAmt * this.playerSpeed);

        //Rotations
        //check if there is movement to determine if rotation is needed
        let input = new Vector3(this.input.hAxis, 0, 0); 
        if (input.length() == 0) {//if there's no input detected, prevent rotation and keep player in same rotation
            return;
        }
        //rotation based on input & the camera angle
        let angle = Math.atan2(this.input.hAxis, 0);
        angle += this.camRoot.rotation.y;
        let targ = Quaternion.FromEulerAngles(0, angle, 0);
        this.playerMesh.rotationQuaternion = targ;
    }
}