import * as tf from '@tensorflow/tfjs'

export default class Config {

    public static ModelPath:string = 'https://raw.githubusercontent.com/SkalskiP/ILearnMachineLearning.js/master/models/tfjs-yolo-tiny/model.json';
    public static ModelInputPixelSize:number = 416;
    public static ModelIouThreshold:number = 0.4;
    public static ModelClassProbThreshold:number = 0.5;
    public static ModelClassCount:number = 80;
    public static ModelAnchors:tf.Tensor2D = tf.tensor2d([
        [0.57273, 0.677385], [1.87446, 2.06253], [3.33843, 5.47434],
        [7.88282, 3.52778], [9.77052, 9.16828],
    ]);

}