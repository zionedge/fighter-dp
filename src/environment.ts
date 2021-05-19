import { Scene, Mesh, MeshBuilder, Vector3, StandardMaterial, Texture, CubeTexture } from "babylonjs";
import stageOne from "../public/stages/stage.json";

export class Environment {
    private scene : Scene;
    private stage;

    constructor(scene : Scene, stage : String){
        this.scene = scene;
        if(stage==="stage.json"){
            this.stage = stageOne;
        }
    }

    // TODO IMPROVEMENTS???
    public async loadStage() {

        let assets = [];

        this.stage.assets.forEach(element => {
            if(element.type==="StandartMaterial") {
                var asset = new StandardMaterial(element.name, this.scene);
                element.properties.forEach(el => {
                    if(el.name==="diffuseTexture" || el.name==="specularTexture" || el.name==="bumpTexture") {
                        asset[el.name] = new Texture(el.value, this.scene);
                    } else {

                    }
                });
                assets.push(asset);
            } else if(element.type==="CubeTexture" && element.name==="skybox") {
                let asset = new CubeTexture(element.value,this.scene);
                this.scene.createDefaultSkybox(asset,false,18000);
            } else {

            } 
        });

        this.stage.objects.forEach(element => {
            if(element.type==="CreateGround"){
                var ground = MeshBuilder.CreateGround(element.name, element.options, this.scene);
                element.properties.forEach(el => {
                    if(el.name==="checkCollisions" || el.name==="receiveShadows"){
                        ground[el.name] = el.value;
                    } else if(el.name==="material") {
                        assets.forEach(e => {
                            if(e.name===el.value){
                                ground.material = e;
                            }
                        })
                    } else{

                    }
                });
            } else if(element.type==="CreateBox"){
                var object = MeshBuilder.CreateBox(element.name, element.options, this.scene);
                element.properties.forEach(el => {
                    if(el.name==="checkCollisions" || el.name==="isVisible"){
                        object[el.name] = el.value;
                    } else if(el.name==="material") {
                        assets.forEach(e => {
                            if(e.name===el.value){
                                object.material = e;
                            }
                        })
                    } else if(el.name==="position"){
                        object[el.name] = new Vector3(el.value.x, el.value.y, el.value.z);
                    } else {

                    }
                });
            } else {

            }     
        });
    }

    /*
    public async load() {

        const assets = await this.loadAsset()

        let ground = MeshBuilder.CreateGround("baseGround",{height: 24, width: 24, subdivisions: 2}, this.scene);
        ground.checkCollisions = true;
        ground.material = assets.groundTexture;
        
        let box = MeshBuilder.CreateBox("box", {width: 2, height: 2, depth: 2} , this.scene);
        box.position = new Vector3(11,1,-11);
        box.checkCollisions = true;
        box.material = assets.boxTexture;
        
        let wallBack = MeshBuilder.CreateBox("wallBack",{height: 20, width: 24, depth: 1},this.scene);
        wallBack.position = new Vector3(0,10,-12.5);
        
        wallBack.checkCollisions = true;
        wallBack.material = assets.wallTexture;

        let wallLeft = MeshBuilder.CreateBox("wallLeft",{height: 20, depth: 24, width: 1},this.scene);
        wallLeft.position = new Vector3(12.5,10,0);
       
        wallLeft.checkCollisions = true;
        wallLeft.material = assets.wallTexture;

        let wallRight = MeshBuilder.CreateBox("wallRight",{height: 20, depth: 24, width: 1},this.scene);
        wallRight.position = new Vector3(-12.5,10,0);
        
        wallRight.checkCollisions = true;
        wallRight.material = assets.wallTexture;

        let wallFront = MeshBuilder.CreateBox("wallFront",{height: 20, width: 24, depth: 1},this.scene);
        wallFront.position = new Vector3(0,10,12.5);
        wallFront.isVisible = false;
        wallFront.checkCollisions = true;
    }

    
    private async loadAsset() {
        let boxTexture = new StandardMaterial("boxTexture", this.scene);
        boxTexture.diffuseTexture = new Texture("textures/box-texture.png",this.scene);

        let groundTexture = new StandardMaterial("groundTexture", this.scene);
        groundTexture.diffuseTexture = new Texture("textures/ground-diffuse.png",this.scene);
        groundTexture.specularTexture = new Texture("textures/ground-specular.png",this.scene);
        groundTexture.bumpTexture = new Texture("textures/ground-bump.png",this.scene);

        let wallTexture = new StandardMaterial("wallTexture",this.scene);
        wallTexture.diffuseTexture = new Texture("textures/wall-diffuse.jpg",this.scene);
        wallTexture.specularTexture = new Texture("textures/wall-specular.jpg",this.scene);
        wallTexture.bumpTexture = new Texture("textures/wall-bump.jpg",this.scene);

        let skybox = new CubeTexture("textures/skybox.dds",this.scene);
        this.scene.createDefaultSkybox(skybox,false,18000);

        return {
            boxTexture : boxTexture,
            groundTexture : groundTexture,
            wallTexture : wallTexture
        }
    } */
}