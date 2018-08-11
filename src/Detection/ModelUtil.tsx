import * as tf from '@tensorflow/tfjs';
import Config from './Config';
// import {IConfig,IConfigs} from './Config';
import {IConfig} from './Config';
import ModelOutputUtil from './Utils/ModelOutputUtil';
// import { Tensor } from '@tensorflow/tfjs';

export interface IBox {
    x: number,
    y: number,
    width: number,
    height: number
    score: number,
}

export interface IModelUtil {
    detect:(model:any,imageData:tf.Tensor4D,classNo:number)=>Promise<any[]>,
}

const filterBoxes = (boxes,confs,probs,threshold,width,height) => {
    const boxScores = tf.mul(confs, probs);
    const boxClasses = tf.argMax(boxScores, -1);
    const boxClassScores = tf.max(boxScores, -1);
      
    const predictionMask = tf.greaterEqual(boxClassScores, tf.scalar(threshold)).as1D();
      
    const N = predictionMask.size
    const allIndices = tf.linspace(0, N - 1, N).toInt();
    const negIndices = tf.zeros([N], 'int32');
    const indices:any = tf.where(predictionMask, allIndices, negIndices);

    const imgDims:tf.Tensor2D = tf.tensor([height,width,height,width],[1,4])
      
    return [
        tf.gather(boxes.reshape([N, 4]), indices).mul(imgDims),
        tf.gather(boxClassScores.flatten(), indices),
        tf.gather(boxClasses.flatten(), indices),
    ];
};

const yoloPostProcess = (modelOutput,anchors,classNum) => {
    const [boxXY, boxWH, allC, allP] = ModelOutputUtil.yoloHead(modelOutput, anchors, classNum);
    const allB = ModelOutputUtil.boxesToCorners(boxXY, boxWH);
    return [allB,allC,allP]
}; 
// const classNo:number = Config.classNo; 
// const classNo:number = 80
// const classNo:number = Config.classNo; 
const configs:IConfig[] = Config.configs; 

const ModelUtil:IModelUtil[] = [ 
    {
        detect: async (model:tf.Model,input:any,classNo:number) => {
            console.log("before :", tf.memory())
            const width:number = input.shape[2]
            const height:number = input.shape[1]
            const config:IConfig = configs[0]
            console.log("(width, height) : "+width+" , " +height)
    
            const [preB,preS,preC]:tf.Tensor[] = tf.tidy(() => {
                const modelOutput: any = model.predict(input);
                const anchors = config.anchors as number[][];
                const [allB,allC,allP] = yoloPostProcess(modelOutput, tf.tensor2d(anchors,[5,2],'float32'), classNo);
                return filterBoxes(allB,allC,allP,0.01,width,height);
            });
            tf.dispose(input)
    
            if (preB==null) {
                tf.dispose([preB,preS,preC])
                // console.log("null")
                return [[]]
            };
    
            // console.log("After Inference",preB.shape,preS.shape,preC.shape)
            // console.log(preB,preS,preC)

            // console.log(await preB.data());
    
            const results:Array<number[]|number[][]> = await ModelOutputUtil.nonMaxSuppression(preB,preS,preC,config.iouThreshold)
            // console.log("After NMS :", results[0].length, results)
    
            tf.dispose([preB,preS,preC])
            tf.disposeVariables();
            console.log("after :", tf.memory(),results)
    
            return results;
        }
    },{
        detect: async (model:tf.Model,input:any,classNo:number) => {
            console.log("before :", tf.memory())
            const width:number = input.shape[2]
            const height:number = input.shape[1]
            const config:IConfig = configs[1]
            console.log("(width, height) : "+width+" , " +height+ " " + classNo);
    
            const modelOutput: any = model.predict(input);
            const [preB1,preS1,preC1]:tf.Tensor[] = tf.tidy(() => {
                const anchors = config.anchors[0] as number[][];
                const [allB,allC,allP] = yoloPostProcess(modelOutput[0], tf.tensor2d(anchors,[3,2],'float32').div(tf.scalar(32.0,'float32')), classNo);
                return filterBoxes(allB,allC,allP,0.01,width,height);
            });
            const [preB2,preS2,preC2]:tf.Tensor[] = tf.tidy(() => {
                const anchors = config.anchors[1] as number[][];
                const [allB,allC,allP] = yoloPostProcess(modelOutput[1], tf.tensor2d(anchors,[3,2],'float32').div(tf.scalar(32.0,'float32')), classNo);
                return filterBoxes(allB,allC,allP,0.01,width,height);
            });

            const preB = tf.concat([preB1,preB2]);
            const preS = tf.concat([preS1,preS2]);
            const preC = tf.concat([preC1,preC2]);
            tf.dispose([input,preB1,preB2,preS1,preS2,preC1,preC2])
    
            if (preB==null) {
                tf.dispose([preB,preS,preC])
                // console.log("null")
                return [[]]
            };
    
            // console.log("After Inference",preB.shape,preS.shape,preC.shape)
            // console.log(preB,preS,preC)

            // console.log(await preB.data());
    
            const results:Array<number[]|number[][]> = await ModelOutputUtil.nonMaxSuppression(preB,preS,preC,config.iouThreshold)
            // console.log("After NMS :", results[0].length, results)
    
            tf.dispose([preB,preS,preC])
            tf.disposeVariables();
            console.log("after :", tf.memory(),results)
    
            return results;
        }
    },{
        detect: async (model:tf.Model,input:any,classNo:number) => {
            console.log("before :", tf.memory())
            const width:number = input.shape[2]
            const height:number = input.shape[1]
            const config:IConfig = configs[1]
            console.log("(width, height) : "+width+" , " +height)
    
            const modelOutput: any = model.predict(input);
            const [preB1,preS1,preC1]:tf.Tensor[] = tf.tidy(() => {
                const anchors = config.anchors[0] as number[][];
                const [allB,allC,allP] = yoloPostProcess(modelOutput[0], tf.tensor2d(anchors,[3,2],'float32').div(tf.scalar(32.0,'float32')), classNo);
                return filterBoxes(allB,allC,allP,0.01,width,height);
            });
            const [preB2,preS2,preC2]:tf.Tensor[] = tf.tidy(() => {
                const anchors = config.anchors[1] as number[][];
                const [allB,allC,allP] = yoloPostProcess(modelOutput[1], tf.tensor2d(anchors,[3,2],'float32').div(tf.scalar(16.0,'float32')), classNo);
                return filterBoxes(allB,allC,allP,0.01,width,height);
            });

            const preB = tf.concat([preB1,preB2]);
            const preS = tf.concat([preS1,preS2]);
            const preC = tf.concat([preC1,preC2]);
            tf.dispose([input,preB1,preB2,preS1,preS2,preC1,preC2])
    
            if (preB==null) {
                tf.dispose([preB,preS,preC])
                // console.log("null")
                return [[]]
            };
    
            // console.log("After Inference",preB.shape,preS.shape,preC.shape)
            // console.log(preB,preS,preC)

            // console.log(await preB.data());
    
            const results:Array<number[]|number[][]> = await ModelOutputUtil.nonMaxSuppression(preB,preS,preC,config.iouThreshold)
            // console.log("After NMS :", results[0].length, results)
    
            tf.dispose([preB,preS,preC])
            tf.disposeVariables();
            console.log("after :", tf.memory(),results)
    
            return results;
        }
    },{
        detect: async (model:tf.FrozenModel,input:any,classNo:number) => {
            console.log("before Frozen :", tf.memory())
            const width:number = input.shape[2]
            const height:number = input.shape[1]
            console.log("(width, height) : "+width+" , " +height)
    
            const modelOutput:tf.Tensor[] = (await model.executeAsync(input)) as tf.Tensor[];
            const [boxes,scores,classes,num] = await Promise.all([
                modelOutput[0].data(),
                modelOutput[1].data(),
                modelOutput[2].data(),
                modelOutput[3].data()
            ])
            modelOutput.forEach(e => e.dispose());
            console.log(boxes,scores,classes,num);
            return [[]]
        }
    }
]

export default ModelUtil;