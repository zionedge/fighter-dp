import "babylonjs-loaders";
import "babylonjs";
import { Engine, Scene, FreeCamera, ArcRotateCamera, Vector3, Mesh, Color4, ShadowGenerator,
SceneLoader, Quaternion, ExecuteCodeAction, ActionManager,  TransformNode, UniversalCamera, DirectionalLight, HemisphericLight} from "babylonjs";
import { AdvancedDynamicTexture, Control, Rectangle, StackPanel, TextBlock, Button } from "babylonjs-gui";
import { Environment } from "./environment";
import { Player, PlayerState } from "./characterController";
import { PlayerInput, inputMapping } from "./inputController";
import { Label, MainMenuButton, OptionsGrid } from "./button";
import { ResourceManager } from "./resourceManager";

enum State { START=0, LOADING=1, INGAME=2 };

class Game {

    private scene : Scene;
    private canvas : HTMLCanvasElement;
    private engine : Engine;

    public playerOneAssets;
    public playerTwoAssets;
    private environment : Environment;
    private player : Player;
    private playerTwo : Player;

    private state : number = 0
    private loadingScene: Scene;
    private gameScene : Scene;

    private camera : UniversalCamera;
    private camRoot : TransformNode;

    private currGameTime : number;
    private gameTimer : TextBlock;

    private input : PlayerInput;
    private playerTwoInput : PlayerInput;

    public inputMap : any;

    private playerOneHealth : number;
    private playerOneHealthBar : Rectangle;
    private playerTwoHealth : number;
    private playerTwoHealthBar : Rectangle;
    private gameResult : TextBlock;
    private restartGameButton : Button;
    private restartGameLabel : TextBlock;
    private timer : any;
    private playerOneMap : inputMapping = {up: "w", down: "s", left: "a", right: "d", jump: "c", leftPunch: "v", rightPunch: "x", kick: "y"};
    private playerTwoMap : inputMapping = {up: "i", down: "k", left: "j", right: "l", jump: "n", leftPunch: "m", rightPunch: ",", kick: "n"};
    private resourceManager : ResourceManager;

    public decreaseHP(source : Player, damageAmount : number) {
        if(source === this.player){
            this.playerTwoHealth -= damageAmount;
            this.playerTwoHealthBar.width = 0.2*(this.playerTwoHealth/100);
        } else {
            this.playerOneHealth -= damageAmount;
            this.playerOneHealthBar.width = 0.2*(this.playerOneHealth/100);
        }
        if(this.playerOneHealth<=0 || this.playerTwoHealth<=0){
            if(source===this.player){
                this.player.playerState = PlayerState.Victory;
                this.playerTwo.playerState = PlayerState.KO;
                this.gameResult.text = "Player One Wins";
            } else {
                this.playerTwo.playerState = PlayerState.Victory;
                this.player.playerState = PlayerState.KO;
                this.gameResult.text = "Player Two Wins";
            }
            this.gameResult.isVisible = true;
            this.restartGameButton.isVisible = true;
            clearInterval(this.timer);
        }                             
    }

    constructor() {
        this.canvas = this.createCanvas();

        this.engine = new Engine(this.canvas, true, { deterministicLockstep: true, lockstepMaxSteps: 4});
        this.scene = new Scene(this.engine);

        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt
            if (ev.shiftKey && ev.ctrlKey && ev.altKey) {
                if (this.scene.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene.debugLayer.show();
                }
            }
        });

        this.main();
 
    }

    // render function
    private async main(): Promise<void>{
        await this.switchStateToStart();

        this.engine.runRenderLoop(()=>{
            switch(this.state){
                case State.START:
                case State.LOADING:
                case State.INGAME:
                    this.scene.render();
                    break;
                default:
                    break;
            }   
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    // canvas for displaying scenes
    private createCanvas() : HTMLCanvasElement {
        
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "mainCanvas";
        document.body.appendChild(this.canvas);

        return this.canvas;
    }

    // starting game state setup
    // TODO vylepšit start screen -- pozadí, obrázky, ???
    private async switchStateToStart() : Promise<void> {
        this.engine.displayLoadingUI();

        this.resourceManager = new ResourceManager(this.scene);
        this.scene.actionManager = new ActionManager(this.scene);
        this.scene.clearColor = new Color4(0,0,0,1);
        let camera = new UniversalCamera("startCamera", Vector3.Zero(), this.scene);

        const font = new FontFace("TwitchyTV", "url('TwitchyTV.otf')");
        await font.load();
        document.fonts.add(font);

        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("StartUI"); 
        guiMenu.rootContainer.scaleX = window.devicePixelRatio;
        guiMenu.rootContainer.scaleY = window.devicePixelRatio;

        const panel = new StackPanel("MainMenuStackPanel");
        const startBtn = new MainMenuButton("startBtn","Start Game");
        const optionsBtn = new MainMenuButton("optionsBtn","Options");
        const aboutBtn = new MainMenuButton("aboutBtn", "About");
        const continueBtn = new MainMenuButton("continueBtn","Click to Continue");

        guiMenu.addControl(panel);

        panel.addControl(startBtn);
        panel.addControl(optionsBtn);
        panel.addControl(continueBtn);
        panel.addControl(aboutBtn);

        this.scene.onKeyboardObservable.add((ev)=>{
            if(ev.event.key==="Tab"){
                ev.event.preventDefault();
                guiMenu.moveFocusToControl(startBtn);
            }
        });

        startBtn.isVisible = false;
        optionsBtn.isVisible = false;

        startBtn.setupFocus(optionsBtn, optionsBtn);
        optionsBtn.setupFocus(startBtn, startBtn);

        const grid = new OptionsGrid("OptionsGrid",guiMenu, panel, this.scene, this.playerOneMap, this.playerTwoMap);
        guiMenu.addControl(grid);
        grid.isVisible = false;

        startBtn.onPointerDownObservable.add(()=>{
            this.switchStateToLoading();
            this.scene.detachControl();
        });

        optionsBtn.onPointerDownObservable.add(()=>{
            panel.isVisible = false;
            grid.isVisible = true;
        });

        continueBtn.onPointerDownObservable.add(()=>{
            continueBtn.isVisible = false;
            startBtn.isVisible = true;
            optionsBtn.isVisible = true;
            this.resourceManager.sounds.forEach((value)=>{
                if(value.name==="menuTheme"){
                    value.setVolume(1.0);
                    value.play();
                }
            });
        })

        await this.scene.whenReadyAsync();
        this.engine.hideLoadingUI();
        this.state = State.START;
    }

    // state where assets are loaded
    // TODO loading status???
    private async switchStateToLoading() : Promise<void> {
        this.engine.displayLoadingUI();

        this.scene.detachControl();
        this.loadingScene = new Scene(this.engine);
        this.loadingScene.clearColor = new Color4(0,0,0,1);
        let camera = new FreeCamera("loadingCamera", Vector3.Zero(), this.loadingScene);
        camera.setTarget(Vector3.Zero());

        await this.loadingScene.whenReadyAsync();
        this.scene.dispose();
        this.scene = this.loadingScene;
        this.state = State.LOADING;
        
        await this.setupGame().then(response =>{
            this.switchStateToIngame();
        });
    }

    // game scene setup with loading assets
    private async setupGame() : Promise<void> {
        this.gameScene = new Scene(this.engine);
        this.gameScene.collisionsEnabled = true;
        this.environment = new Environment(this.gameScene, "stage.json");
        let pos  = new Vector3(5,0,0);
        let rotation = Quaternion.RotationYawPitchRoll(-Math.PI/2,0,0);
        
        await this.environment.loadStage();
        await this.loadCharacterAssets(this.gameScene, "models/player.glb",pos, rotation, 1);
        pos = new Vector3(-5,0,0);
        rotation = Quaternion.RotationYawPitchRoll(Math.PI/2,0,0);
        await this.loadCharacterAssets(this.gameScene, "models/player.glb", pos, rotation, 2);
    }

    // loading player model
    private async loadCharacterAssets(scene : Scene, modelPath: string ,position : Vector3, rotation: Quaternion, playerSelector : Number) {

        async function loadCharacter() {
            
            return SceneLoader.ImportMeshAsync(null, modelPath, "", scene).then((result) =>{

                const root = result.meshes[0];
                const hit = root.getChildMeshes()[0];
                root.scaling = new Vector3(2,2,2);
                root.position = position;
                root.rotationQuaternion = rotation;
                root.checkCollisions = true;
                //root.isPickable = false;
                root.alwaysSelectAsActiveMesh = true;
                root.ellipsoid = new Vector3(0.5,0.9,0.5);
                root.ellipsoidOffset = new Vector3(0,1,0);
                root.getChildMeshes().forEach((m,i)=>{
                    if(m.name.indexOf("Box") != -1){
                        m.isVisible = false;
                    }
                    m.isPickable = false;
                    m.alwaysSelectAsActiveMesh = true;
                });

                return {
                    mesh: root as Mesh,
                    hitMesh : hit as Mesh,
                    animationGroups : result.animationGroups
                }
            });
        }

        return loadCharacter().then(assets => {
            if(playerSelector==1){
                this.playerOneAssets = assets;
            } else if(playerSelector==2){
                this.playerTwoAssets = assets;
            } else {

            }
        });
    }

    // setup final parts of game scene
    private async initGame(scene : Scene) : Promise<void> {

        let mainLight : DirectionalLight = new DirectionalLight("light", new Vector3(0, -15, 0), scene);
        let wallLight : HemisphericLight = new HemisphericLight("light2",new Vector3(0, 25, 0),scene);
        //mainLight.diffuse = new Color3(255,255,255);
        mainLight.intensity = 2;
        

        // setup camera position
        this.camRoot = new TransformNode("root");
        this.camRoot.position = new Vector3(0, 0, 0);
        this.camRoot.rotation = new Vector3(0, Math.PI, 0);

        //rotations along the x-axis (up/down tilting)
        let yTilt = new TransformNode("ytilt");
        yTilt.rotation = new Vector3(0.15, 0, 0);
        yTilt.parent = this.camRoot;

        //our actual camera
        this.camera = new UniversalCamera("cam", new Vector3(0, 1.5, -30), scene);
        this.camera.lockedTarget = this.camRoot.position;
        this.camera.fov = 0.5;
        this.camera.parent = yTilt;

        this.scene.activeCamera = this.camera;

        this.player = new Player(this.playerOneAssets, scene, this.input, "playerOne", this.camera, this.camRoot, this);
        this.playerTwo = new Player(this.playerTwoAssets, scene, this.playerTwoInput, "playerTwo", this.camera, this.camRoot, this);
        this.player.setupHit(PlayerState.LeftPunch,0.1666666716337204,this.playerTwo.hitMesh);
        this.player.setupHit(PlayerState.Kick,0.3643,this.playerTwo.hitMesh);
        this.player.setupHit(PlayerState.RightPunch,0.0844,this.playerTwo.hitMesh);
        this.playerTwo.setupHit(PlayerState.LeftPunch,0.1666666716337204,this.player.hitMesh);
        this.playerTwo.setupHit(PlayerState.Kick,0.3643,this.player.hitMesh);
        this.playerTwo.setupHit(PlayerState.RightPunch,0.0844,this.player.hitMesh);
        this.player.activatePlayerCamera(this.playerTwo.hitMesh);
        this.playerTwo.activatePlayerCamera(this.player.hitMesh);
        let shadowGenerator = new ShadowGenerator(1024,mainLight);
        shadowGenerator.usePoissonSampling = true;
        shadowGenerator.addShadowCaster(this.player.playerMesh);
        shadowGenerator.addShadowCaster(this.playerTwo.playerMesh); 
    }

    // dispay game scene
    private async switchStateToIngame() : Promise<void> {
        this.scene.detachControl();

        let scene = this.gameScene;
        scene.actionManager = new ActionManager(scene);
        this.inputMap = {};
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key.toLowerCase()] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key.toLowerCase()] = evt.sourceEvent.type == "keydown";
        }));

        this.input = new PlayerInput(scene, this.playerOneMap,this.inputMap);
        this.playerTwoInput = new PlayerInput(scene, this.playerTwoMap,this.inputMap);
        
        await this.initGame(scene);

        const ingameUI = AdvancedDynamicTexture.CreateFullscreenUI("IngameUI");
        ingameUI.rootContainer.scaleX = window.devicePixelRatio;
        ingameUI.rootContainer.scaleY = window.devicePixelRatio;
        /*
        const controlsText = new TextBlock("ControlsLabel","Movement: AD or JL\nJump: W or I\nPunch: VX or M,\nKick: Y or .\nDebug Layer: Ctrl+Alt+Shift");
        controlsText.color = "white";
        controlsText.fontSize = 24;
        controlsText.textHorizontalAlignment = 0;
        controlsText.textVerticalAlignment = 0;   
        ingameUI.addControl(controlsText);
        */
        this.gameTimer = new TextBlock("GameTimer","90");
        this.gameTimer.textVerticalAlignment = 0;
        this.gameTimer.color = "white";
        this.gameTimer.fontSize = 24;
        this.currGameTime = 90;
        ingameUI.addControl(this.gameTimer);

        const playerOneHealthBarLower = new Rectangle("playeronehealthbarlower");
        playerOneHealthBarLower.height = "5%";
        playerOneHealthBarLower.width = 0.2;
        playerOneHealthBarLower.color = "White";
        playerOneHealthBarLower.background = "Black";
        playerOneHealthBarLower.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        playerOneHealthBarLower.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        playerOneHealthBarLower.left = "20%";
        ingameUI.addControl(playerOneHealthBarLower);

        this.playerOneHealthBar = new Rectangle("playeronehealthbar");
        this.playerOneHealthBar.height = "5%";
        this.playerOneHealthBar.width = 0.2;
        this.playerOneHealthBar.color = "Red";
        this.playerOneHealthBar.background = "Red";
        this.playerOneHealthBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.playerOneHealthBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.playerOneHealthBar.left = "20%";
        this.playerOneHealth = 100;
        ingameUI.addControl(this.playerOneHealthBar);

        const playerTwoHealthBarLower = new Rectangle("playertwohealthbarlower");
        playerTwoHealthBarLower.height = "5%";
        playerTwoHealthBarLower.width = 0.2;
        playerTwoHealthBarLower.color = "White";
        playerTwoHealthBarLower.background = "Black";
        playerTwoHealthBarLower.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        playerTwoHealthBarLower.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        playerTwoHealthBarLower.left = "-20%";
        ingameUI.addControl(playerTwoHealthBarLower);

        this.playerTwoHealthBar = new Rectangle("playertwohealthbar");
        this.playerTwoHealthBar.height = "5%";
        this.playerTwoHealthBar.width = 0.2;
        this.playerTwoHealthBar.color = "Red";
        this.playerTwoHealthBar.background = "Red";
        this.playerTwoHealthBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.playerTwoHealthBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.playerTwoHealthBar.left = "-20%";
        this.playerTwoHealth = 100;
        ingameUI.addControl(this.playerTwoHealthBar);

        const playerOneNameText = new TextBlock("PlayerOneNameText",this.player.name);
        playerOneNameText.height = 0.05;
        playerOneNameText.width = 0.1;
        playerOneNameText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        playerOneNameText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        playerOneNameText.top = "3.75%";
        playerOneNameText.left = "17.5%";
        playerOneNameText.color = "white";
        ingameUI.addControl(playerOneNameText);
        
        this.gameResult = new TextBlock("GameResult","Player 1 Wins");
        this.gameResult.height = 0.2;
        this.gameResult.width = 0.25;
        this.gameResult.top = "-10%";
        this.gameResult.color = "white";
        this.gameResult.outlineWidth = 5;
        this.gameResult.outlineColor = "black";
        this.gameResult.fontSize = "4%";
        this.gameResult.isVisible = false;
        ingameUI.addControl(this.gameResult);

        this.restartGameButton = new Button("RestartGameButton");
        this.restartGameLabel = new TextBlock("RestartGameLabel","Restart game");
        this.restartGameLabel.fontSize = "3%";
        this.restartGameButton.addControl(this.restartGameLabel);
        this.restartGameButton.isVisible = false;
        this.restartGameButton.onPointerClickObservable.add(()=>{
            this.restartGameButton.isVisible = false;
            this.gameResult.isVisible = false;
            this.resetState();
        });
        ingameUI.addControl(this.restartGameButton);

        await scene.whenReadyAsync();
 
        /*this.player.playerMesh.getChildMeshes()[2].actionManager = new ActionManager(scene);
        this.player.playerMesh.getChildMeshes()[2].actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter : {
                        mesh: this.playerTwo.hitMesh,
                        usePreciseIntersection: true
                    }
                },
                (evt) => {
                    if(this.player.playerState == PlayerState.LeftPunch){
                        this.playerTwoHealth -= 10;
                        if(this.playerTwoHealth<=0){
                            this.playerTwoHealth = 100;
                            this.playerTwoHealthBar.width = 0.2;
                        } else {
                            this.playerTwoHealthBar.width = 0.2*(this.playerTwoHealth/100);
                        }                    
                    }
                }
            )
        );*/

        this.scene.dispose();
        this.state = State.INGAME;
        this.scene = scene;
        this.engine.hideLoadingUI();
       
        this.timer = setInterval(() => {
            this.currGameTime -= 1;
            if(this.currGameTime==0){
                this.resetState();
            }
            this.gameTimer.text = this.currGameTime.toString();
            //this.gameTimer.text = this.player.currAnimation.name;
        }, 1000);
    }

    private resetState() : void {
        
        this.playerOneHealth = 100;
        this.playerTwoHealth = 100;
        this.playerOneHealthBar.width = 0.2;
        this.playerTwoHealthBar.width = 0.2;
        this.player.playerMesh.position = new Vector3(5,0,0);
        this.playerTwo.playerMesh.position = new Vector3(-5,0,0);
        this.currGameTime = 90;
        this.player.playerState = PlayerState.Idle;
        this.playerTwo.playerState = PlayerState.Idle;
        this.timer = setInterval(() => {
            this.currGameTime -= 1;
            if(this.currGameTime==0){
                this.resetState();
            }
            this.gameTimer.text = this.currGameTime.toString();
            //this.gameTimer.text = this.player.currAnimation.name;
        }, 1000);
    }
}

new Game();