import { AssetsManager, Scene, Sound } from "babylonjs";
import assets from "../public/assets.json";

type Resource = {
    name : string,
    url : string
}

export class ResourceManager extends AssetsManager{

    public sounds : [Sound];
    public modelResources : [Resource];
    public imageResources : [Resource];

    constructor(scene : Scene) {
        super(scene);

        assets.images.forEach((value)=>{
            this.imageResources.push({name: value.name, url: value.url});
        });
        assets.models.forEach((value)=>{
            this.modelResources.push({name: value.name, url: value.url});
        });
        assets.sounds.forEach((value)=>{
            this.addBinaryFileTask(value.name,value.url).onSuccess = (task)=>{
                var sound = new Sound(value.name,task.data,scene,null,value.options);
                if(this.sounds)
                    this.sounds.push(sound);
                else
                    this.sounds = [sound];
            }
        });

        this.load();
        this.onTasksDoneObservable.addOnce(()=>{
            //this.sounds.forEach((value)=>{
                //if(value.name==="menuTheme"){
                    //value.play();
                //}
            //})
            //console.log(this.sounds.length);
        })
    }
}