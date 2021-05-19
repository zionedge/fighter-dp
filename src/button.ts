import { Scene, ActionManager, ExecuteCodeAction } from "babylonjs";
import { FocusableButton, Control, TextBlock, Grid, AdvancedDynamicTexture, StackPanel } from "babylonjs-gui";
import { IFocusableControl } from "babylonjs-gui/2D/controls/focusableControl";
import { inputMapping } from "./inputController";

export class MainMenuButton extends FocusableButton {

    public textBl : TextBlock;
    public text( text : string ) : void {
        this.textBl.text = text;
    }
    public isFocused : boolean = false;
    public setupFocus( previousControl : IFocusableControl, nextControl : IFocusableControl) : void {
        this.onKeyboardEventProcessedObservable.add((evt)=>{
            if(evt.key==="Tab"){
                evt.preventDefault();
                this.blur();
                if(evt.shiftKey){
                    previousControl.focus();
                } else {
                    nextControl.focus();
                }
            }
        });
    } 

    constructor(name : string, text : string) {
        super(name);

        this.textBl = new TextBlock(name+"_text", text);
        this.textBl.textWrapping = true;
        this.textBl.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.textBl.outlineWidth = 3;
        this.textBl.outlineColor = "#9146ff";
        //this.textBl.height = "100px";
        //this.textBl.width = "200px";
        this.addControl(this.textBl);

        this.height = "50px";
        this.width = "100%";
        this.color = "white";
        this.cornerRadius = 20;
        this.background = "white";
        this.paddingBottom = "0px";
        this.paddingLeft = "0px";
        this.paddingTop = "0px";
        this.paddingRight = "0px";
        this.thickness = 0;
        this.fontFamily = "TwitchyTV";

        this.onPointerEnterObservable.add(()=>{
            this.color = "#9146ff";
            this.textBl.outlineColor = "white";
            this.background = "#9146ff"
        });

        this.onPointerOutObservable.add(()=>{
            this.color = "white";
            this.textBl.outlineColor = "#9146ff";
            this.background = "white"
        });

        this.onFocus = ()=>{
            this.color = "red";
        }
        this.onBlur = ()=>{
            this.color = "white";
        }

        return this;
    }
}

export class Label extends TextBlock {
    constructor(name : string, text : string) {
        super(name,text);

        this.outlineWidth = 3;
        this.outlineColor = "#9146ff";
        this.color = "white";
        this.fontFamily = "TwitchyTV";
    }
}

export class OptionsGrid extends Grid {

    private parentGui : AdvancedDynamicTexture;

    private playerOneLeft : MainMenuButton;
    private playerOneRight : MainMenuButton;
    private playerOneJump : MainMenuButton;
    private playerOnePunch : MainMenuButton;
    private playerOneKick : MainMenuButton;

    private playerTwoLeft : MainMenuButton;
    private playerTwoRight : MainMenuButton;
    private playerTwoJump : MainMenuButton;
    private playerTwoPunch : MainMenuButton;
    private playerTwoKick : MainMenuButton;

    private playerOneInputs : Array<string>;
    private playerTwoInputs : Array<string>;

    constructor(name : string, parent : AdvancedDynamicTexture, previous : StackPanel, scene : Scene, playerOneMap : inputMapping, playerTwoMap : inputMapping) {
        super(name);

        this.playerOneInputs = ["a","d","w","v","y"];
        this.playerTwoInputs = ["j","l","i","m","n"];
    
        this.parentGui = parent;
        this.width = 0.4;
        this.height = 0.4;
        this.addColumnDefinition(0.7);
        this.addColumnDefinition(1);
        this.addColumnDefinition(0.7);
        this.addRowDefinition(1);
        this.addRowDefinition(1);
        this.addRowDefinition(1);
        this.addRowDefinition(1);
        this.addRowDefinition(1);
        this.addRowDefinition(1);
        this.addRowDefinition(1);
        this.addRowDefinition(1);

        const controlsLabel = new Label("controlsLabel","Controls");
        const playerOneLabel = new Label("playerOneLabel","Player One");
        const playerTwoLabel = new Label("playerTwoLabel","Player Two");
        const changeKeyBtn = new MainMenuButton("changeKeyBtn","Press a key to change\nESC to cancel");
        changeKeyBtn.isEnabled = false;
        const backBtn = new MainMenuButton("backBtn","Back");
        this.playerOneLeft = new MainMenuButton("playerOneLeft","Left: A");
        this.playerOneRight = new MainMenuButton("playerOneRight","Right: D");
        this.playerOneJump = new MainMenuButton("playerOneJump","Jump: W");
        this.playerOnePunch = new MainMenuButton("playerOnePunch","Punch: V");
        this.playerOneKick = new MainMenuButton("playerOneKick","Kick: Y");

        this.playerTwoLeft = new MainMenuButton("playerTwoLeft","Left: J");
        this.playerTwoRight = new MainMenuButton("playerTwoeRight","Right: L");
        this.playerTwoJump = new MainMenuButton("playerTwoJump","Jump: I");
        this.playerTwoPunch = new MainMenuButton("playerTwoPunch","Punch: M");
        this.playerTwoKick = new MainMenuButton("playerTwoKick","Kick: N");

        this.addControl(controlsLabel,0,1);
        this.addControl(playerOneLabel,1,0);
        this.addControl(playerTwoLabel,1,2);
        this.addControl(backBtn,7,1);
        this.addControl(this.playerOneLeft, 2, 0);
        this.addControl(this.playerOneRight, 3, 0);
        this.addControl(this.playerOneJump, 4, 0);
        this.addControl(this.playerOnePunch, 5, 0);
        this.addControl(this.playerOneKick, 6, 0);
        this.addControl(this.playerTwoLeft, 2, 2);
        this.addControl(this.playerTwoRight, 3, 2);
        this.addControl(this.playerTwoJump, 4, 2);
        this.addControl(this.playerTwoPunch, 5, 2);
        this.addControl(this.playerTwoKick, 6, 2);

        backBtn.onPointerDownObservable.add(()=>{
            this.isVisible = false;
            this.parentGui.getChildren()[0].getDescendants()[0].isVisible = true;
        });

        this.playerOneLeft.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "left", true, playerOneMap, playerTwoMap);
                    playerOneMap.left = evt.sourceEvent.key.toLowerCase();
                    this.playerOneLeft.text("Left: " + playerOneMap.left);
                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });

        this.playerOneRight.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "right", true, playerOneMap, playerTwoMap);
                    playerOneMap.right = evt.sourceEvent.key.toLowerCase();
                    this.playerOneRight.text("Right: " + playerOneMap.right);
                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });

        this.playerOneJump.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "up", true, playerOneMap, playerTwoMap);
                    playerOneMap.up = evt.sourceEvent.key.toLowerCase();
                    this.playerOneJump.text("Jump: " + playerOneMap.up);
                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });

        this.playerOnePunch.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "leftPunch", true, playerOneMap, playerTwoMap);
                    playerOneMap.leftPunch = evt.sourceEvent.key.toLowerCase();
                    this.playerOnePunch.text("Punch: " + playerOneMap.leftPunch);
                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });
    
        this.playerOneKick.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "kick", true, playerOneMap, playerTwoMap);
                    playerOneMap.kick = evt.sourceEvent.key.toLowerCase();
                    this.playerOneKick.text("Kick: " + playerOneMap.kick);
                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });

        this.playerTwoLeft.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){             
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "left", false, playerOneMap, playerTwoMap);    
                    playerTwoMap.left = evt.sourceEvent.key.toLowerCase();
                    this.playerTwoLeft.text("Left: " + playerTwoMap.left);
                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });

        this.playerTwoRight.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "right", false, playerOneMap, playerTwoMap); 
                    playerTwoMap.right = evt.sourceEvent.key.toLowerCase();
                    this.playerTwoRight.text("Right: " + playerTwoMap.right);

                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });

        this.playerTwoJump.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "up", false, playerOneMap, playerTwoMap); 
                    playerTwoMap.up = evt.sourceEvent.key.toLowerCase();
                    this.playerTwoJump.text("Jump: " + playerTwoMap.up);
                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });

        this.playerTwoPunch.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "leftPunch", false, playerOneMap, playerTwoMap); 
                    playerTwoMap.leftPunch = evt.sourceEvent.key.toLowerCase();
                    this.playerTwoPunch.text("Punch: " + playerTwoMap.leftPunch);
                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });
    
        this.playerTwoKick.onPointerClickObservable.add(()=>{
            this.enableOrDisableControls();
            this.parentGui.addControl(changeKeyBtn);
            const action = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt)=>{
                if(evt.sourceEvent.key.toLowerCase()!=="escape"){
                    this.checkSameMultipleInputs(evt.sourceEvent.key.toLowerCase(), "kick", false, playerOneMap, playerTwoMap); 
                    playerTwoMap.kick = evt.sourceEvent.key.toLowerCase();
                    this.playerTwoKick.text("Kick: " + playerTwoMap.kick);
                }
                this.parentGui.removeControl(changeKeyBtn);
                scene.actionManager.unregisterAction(action);
                this.enableOrDisableControls();
            });
            scene.actionManager.registerAction(action);
        });
    }

    private enableOrDisableControls() : void {

        this.playerOneLeft.isEnabled = !this.playerOneLeft.isEnabled;
        this.playerOneRight.isEnabled = !this.playerOneRight.isEnabled;
        this.playerOneJump.isEnabled = !this.playerOneJump.isEnabled;
        this.playerOnePunch.isEnabled = !this.playerOnePunch.isEnabled;
        this.playerOneKick.isEnabled = !this.playerOneKick.isEnabled;

        this.playerTwoLeft.isEnabled = !this.playerTwoLeft.isEnabled;
        this.playerTwoRight.isEnabled = !this.playerTwoRight.isEnabled;
        this.playerTwoJump.isEnabled = !this.playerTwoJump.isEnabled;
        this.playerTwoPunch.isEnabled = !this.playerTwoPunch.isEnabled
        this.playerTwoKick.isEnabled = !this.playerTwoKick.isEnabled;
    }

    private checkSameMultipleInputs(input : string, checking : string, playerOne : boolean, playerOneMap : inputMapping, playerTwoMap: inputMapping) : void {
        if(this.playerOneInputs.includes(input)){
            const index = this.playerOneInputs.indexOf(input);
            if(index==0){
                if(playerOne){
                    playerOneMap.left = playerOneMap[checking];
                } else {
                    playerOneMap.left = playerTwoMap[checking];
                }
                this.playerOneInputs[index] = playerOneMap.left;
                this.playerOneLeft.text("Left: " + this.playerOneInputs[index]);
            } else if(index==1) {
                if(playerOne){
                    playerOneMap.right = playerOneMap[checking];
                } else {
                    playerOneMap.right = playerTwoMap[checking];
                }
                this.playerOneInputs[index] = playerOneMap.right;
                this.playerOneRight.text("Right: " + this.playerOneInputs[index]);
            } else if(index==2) {
                if(playerOne){
                    playerOneMap.up = playerOneMap[checking];
                } else {
                    playerOneMap.up = playerTwoMap[checking];
                }
                this.playerOneInputs[index] = playerOneMap.up;
                this.playerOneJump.text("Jump: " + this.playerOneInputs[index]);
            } else if(index==3) {
                if(playerOne){
                    playerOneMap.leftPunch = playerOneMap[checking];
                } else {
                    playerOneMap.leftPunch = playerTwoMap[checking];
                }
                this.playerOneInputs[index] = playerOneMap.leftPunch;
                this.playerOnePunch.text("Punch: " + this.playerOneInputs[index]);
            } else if(index==4) {
                if(playerOne){
                    playerOneMap.kick = playerOneMap[checking];
                } else {
                    playerOneMap.kick = playerTwoMap[checking];
                }
                this.playerOneInputs[index] = playerOneMap.kick;
                this.playerOneKick.text("Kick: " + this.playerOneInputs[index]);
            } else {}
            if(checking==="left"){
                if(playerOne) {
                    this.playerOneInputs[0] = input; 
                } else {
                    this.playerTwoInputs[0] = input; 
                }
            } else if(checking==="right"){
                if(playerOne) {
                    this.playerOneInputs[1] = input;
                } else {
                    this.playerTwoInputs[1] = input;
                }
            } else if(checking==="up"){
                if(playerOne) {
                    this.playerOneInputs[2] = input; 
                } else {
                    this.playerTwoInputs[2] = input; 
                }
            } else if(checking==="leftPunch") {
                if(playerOne) {
                    this.playerOneInputs[3] = input; 
                } else {
                    this.playerTwoInputs[3] = input; 
                }
            } else if(checking==="kick") {
                if(playerOne) {
                    this.playerOneInputs[4] = input;
                } else {
                    this.playerTwoInputs[4] = input;
                }
            } else {}
        } else if(this.playerTwoInputs.includes(input)) {
            const index = this.playerTwoInputs.indexOf(input);
            if(index==0) {
                if(playerOne) {
                    playerTwoMap.left = playerOneMap[checking];
                } else {
                    playerTwoMap.left = playerTwoMap[checking];
                }
                this.playerTwoInputs[index] = playerTwoMap.left;
                this.playerTwoLeft.text("Left: " + this.playerTwoInputs[index]);
            } else if(index==1) {
                if(playerOne) {
                    playerTwoMap.right = playerOneMap[checking];
                } else {
                    playerTwoMap.right = playerTwoMap[checking];
                }
                this.playerTwoInputs[index] = playerTwoMap.right;
                this.playerTwoRight.text("Right: " + this.playerTwoInputs[index]);
            } else if(index==2) {
                if(playerOne) {
                    playerTwoMap.up = playerOneMap[checking];
                } else {
                    playerTwoMap.up = playerTwoMap[checking];
                }
                this.playerTwoInputs[index] = playerTwoMap.up;
                this.playerTwoJump.text("Jump: " + this.playerTwoInputs[index]);
            } else if(index==3) {
                if(playerOne) {
                    playerTwoMap.leftPunch = playerOneMap[checking];
                } else {
                    playerTwoMap.leftPunch = playerTwoMap[checking];
                }
                this.playerTwoInputs[index] = playerTwoMap.leftPunch;
                this.playerTwoPunch.text("Punch: " + this.playerTwoInputs[index]);
            } else if(index==4) {
                if(playerOne){
                    playerTwoMap.kick = playerOneMap[checking];
                } else {
                    playerTwoMap.kick = playerTwoMap[checking];
                }
                this.playerTwoInputs[index] = playerTwoMap.kick;
                this.playerTwoKick.text("Kick: " + this.playerTwoInputs[index]);
            } else {}
            if(checking==="left"){
                if(playerOne){
                    this.playerOneInputs[0] = input;
                } else {
                    this.playerTwoInputs[0] = input;
                }
            } else if(checking==="right"){
                if(playerOne){
                    this.playerOneInputs[1] = input; 
                } else {
                    this.playerTwoInputs[1] = input; 
                }            
            } else if(checking==="up"){
                if(playerOne){
                    this.playerOneInputs[2] = input;  
                } else {
                    this.playerTwoInputs[2] = input; 
                }
            } else if(checking==="leftPunch") {
                if(playerOne){
                    this.playerOneInputs[3] = input;
                } else {
                    this.playerTwoInputs[3] = input;
                }
            } else if(checking==="kick") {
                if(playerOne){
                    this.playerOneInputs[4] = input;
                } else {
                    this.playerTwoInputs[4] = input;
                }
            } else {}
        } else {}
    }
}