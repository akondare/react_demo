import IDetection from "./Utils/IDetection"
import Rect from "./Utils/Rect"

interface ITransform {
    x: number,
    y: number,
    scale: number
}

enum BoardChange {
    IMG,
    TRANSFORM,
    ZONE,
    PREDS,
    TAGS
}

export class Board {
    protected static maxDim = 800;

    public main:HTMLCanvasElement
    public overlay:HTMLCanvasElement

    private mainCtx:CanvasRenderingContext2D
    private overlayCtx:CanvasRenderingContext2D
    private image:HTMLImageElement;

    private width: number;
    private height: number;
    private canvasRect: Rect; 
    private transform: ITransform;

    private zone: Rect | null;
    private preds: IDetection[] | null;
    private tags: IDetection[] | null;
    private predOrTag: boolean;

    constructor(main: HTMLCanvasElement, overlay: HTMLCanvasElement) {
        this.main = main
        this.overlay = overlay
        this.mainCtx = main.getContext('2d') as CanvasRenderingContext2D;
        this.overlayCtx = overlay.getContext('2d') as CanvasRenderingContext2D;
        this.image = new Image();
        window.onresize = this.setWindowOffset.bind(this);
        this.clear();
        this.image.addEventListener('load', this.loadImage);
        console.log(this.canvasRect,this.predOrTag,this.overlayCtx,this.zone,this.preds,this.tags)
    }

    public setImage(url: string) {
        this.image.src = url;
    }

    private setWindowOffset(e:Event):void {
        const cRect:ClientRect = this.main.getBoundingClientRect();
        this.canvasRect = new Rect(cRect.left, cRect.top, cRect.right-cRect.left, cRect.bottom-cRect.top)
    }

    private loadImage() {
        this.clear()

        // original size of image
        const fullH: number = this.image.naturalHeight;
        const fullW: number = this.image.naturalWidth;

        // set size of image on canvas based off of maximum dimensions allowed
        const ratio: number = fullH / fullW;
        let canvasH: number;
        let canvasW: number;
        if (fullW > fullH) {
            this.transform.scale = fullW / Board.maxDim;
            canvasW = Board.maxDim;
            canvasH = Board.maxDim * ratio;
        }
        else {
            this.transform.scale = fullH / Board.maxDim;
            canvasW = Board.maxDim / ratio;
            canvasH = Board.maxDim;
        }

        // draw image to canvas
        this.width = canvasW;
        this.height = canvasH;
        this.main.width = canvasW;
        this.main.height = canvasH;
        this.overlay.width = canvasW;
        this.overlay.height = canvasH;
        this.mainCtx.drawImage(this.image, 0, 0, canvasW, canvasH);

        // delete memory of object url of original file as it has been loaded into the image element
        URL.revokeObjectURL(this.image.src);
    }

    private clear() {
        this.zone = null;
        this.preds = null;
        this.tags = null
        this.redrawOverlay(BoardChange.IMG)
        this.mainCtx.clearRect(0,0,this.width,this.height)

        this.width = 0
        this.height = 0
        this.main.width = 0
        this.main.height = 0
        this.overlay.width = 0
        this.overlay.height = 0
    }

    private redrawOverlay(mode: BoardChange) {
        switch(mode) {
            case BoardChange.IMG: 
                break;
            case BoardChange.TRANSFORM:
                break;
            case BoardChange.ZONE:
                break;
            case BoardChange.PREDS:
                break;
            case BoardChange.TAGS:
                break;
        }
    }

    /* either transform changed, preds got reset, or tags got reset/added to */
    /*
    private didChangeOccur() {
        return false
    }

    private drawZone() {
        if (this.zone == null) { 
            this.overlayCtx.clearRect(0,0,this.width,this.height)
            return 
        } 
        this.overlayCtx.save();
        this.overlayCtx.restore();
    }
    private drawPreds() {
        if (this.preds == null) { 
            // this.predCtx.clearRect(0,0,this.width,this.height)
            return 
        }
        this.preds.forEach(this.drawDetection);
    }
    private drawTags() {
        if (this.tags == null) { 
            // this.tagCtx.clearRect(0,0,this.width,this.height)
            return 
        }
        this.tags.forEach(this.drawDetection);
    }

    private drawDetection(det: IDetection) {
        return
    }
    */
}