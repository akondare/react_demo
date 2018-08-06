// import * as tf from '@tensorflow/tfjs'
// import Classes from "./Classes"

const version:number = 0; 
// const classNumber:number = Classes.length; 

export interface IConfig {
    path:string,
    size:{width:number,height:number},
    iouThreshold:number
    probThreshold:number
    // classNumber:number,
    anchors:number[][] | number[][][],
}

export interface IConfigs {
    version:number,
    modelNames:string[],
    configs:IConfig[]
    classNo:number
}

const Config:IConfigs = {
    classNo: 7,
    configs: [
        {
            anchors: [
                [0.57273, 0.677385], 
                [1.87446, 2.06253], 
                [3.33843, 5.47434],
                [7.88282, 3.52778], 
                [9.77052, 9.16828] 
            ],
            // classNumber: 7,
            iouThreshold: 0.4,
            path: 'https://raw.githubusercontent.com/SkalskiP/ILearnMachineLearning.js/master/models/tfjs-yolo-tiny/model.json', 
            probThreshold:0.4,
            size: {
                height:416,
                width:416,
            },
        },{
            anchors: [[
                [81,82],
                [135,169],
                [344,319],
            ], [
                [10,14],
                [23,27],
                [37,58],
            ]],
            // classNumber: 7,
            iouThreshold: 0.7,
            path: 'https://raw.githubusercontent.com/akondare/F18Model/master/model.json',
            probThreshold: 0.3,
            size:{
                height:416,
                width:416,
            },
        },
    ],
    modelNames: [
        "Yolo v2",
        "Yolo v3",
    ],
    version,
} 

export default Config;