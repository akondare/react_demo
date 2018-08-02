import * as tf from '@tensorflow/tfjs'

export const v3:boolean = false; 

export class Config {

    public static ModelPath:string = v3 ? 'https://raw.githubusercontent.com/akondare/F18Model/master/model.json'
                                        : 'https://raw.githubusercontent.com/SkalskiP/ILearnMachineLearning.js/master/models/tfjs-yolo-tiny/model.json' ;
    public static ModelInputPixelSize:number = 416;
    public static ModelIouThreshold:number = 0.4;
    public static ModelClassProbThreshold:number = 0.5;
    public static ModelClassCount:number = 80;
    public static ModelAnchors:tf.Tensor2D = tf.tensor2d([
        [0.57273, 0.677385], [1.87446, 2.06253], [3.33843, 5.47434],
        [7.88282, 3.52778], [9.77052, 9.16828],
    ]);
    public static Model3Anchors:tf.Tensor2D = tf.tensor2d([
        [0.57273, 0.677385], [1.87446, 2.06253], [3.33843, 5.47434],
        [7.88282, 3.52778], [9.77052, 9.16828],
        [10,13], [16,30],  [33,23], [30,61], [62,45], [59,119], [116,90], [156,198], [373,326]
    ]);

}