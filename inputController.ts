import { Scene, ActionManager, ExecuteCodeAction, Scalar } from "babylonjs";

export type inputMapping = { left: string, right: string, up: string, down: string, jump: string, leftPunch: string, rightPunch: string, kick: string };

export class PlayerInput {
    public inputMap : any;

    public horizontal: number = 0;
    public hAxis: number = 0;

    public jumpKeyDown = false;
    public leftPunchKeyDown = false;
    public rightPunchKeyDown = false;
    public kickKeyDown = false;

    public inputMaper : inputMapping;

    constructor(scene : Scene, input : inputMapping, inputMap : any) {

        this.inputMap = inputMap;
        this.inputMaper = input;

        scene.onBeforeRenderObservable.add(()=>{
            this.updateFromKeyboard();
        });
    }

    // input handling
    private updateFromKeyboard() : void {
        if (this.inputMap[this.inputMaper.up]) {
            this.jumpKeyDown = true;
        } else if (this.inputMap[this.inputMaper.down]) {
            //TODO DUCK
        } else {
            this.jumpKeyDown = false;
        }

        if (this.inputMap[this.inputMaper.left]) {
            this.hAxis = -1;
            this.horizontal = -1;
        } else if (this.inputMap[this.inputMaper.right]) {
            this.hAxis = 1;
            this.horizontal = 1;
        } else {
            this.hAxis = 0;
            this.horizontal = 0;
        }

        if (this.inputMap[this.inputMaper.leftPunch]) {
            this.leftPunchKeyDown = true;
        } else {
            this.leftPunchKeyDown = false;
        }

        if(this.inputMap[this.inputMaper.rightPunch]){
            this.rightPunchKeyDown = true;
        } else {
            this.rightPunchKeyDown = false;
        }

        if(this.inputMap[this.inputMaper.kick]){
            this.kickKeyDown = true;
        } else {
            this.kickKeyDown = false;
        }
    }
}