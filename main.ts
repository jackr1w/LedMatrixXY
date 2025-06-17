/**
 * Well known colors for a LED (referenced from Neopixel with minor adjustments for WS2812 LED strengths)
 */
enum LedMatrixXYColors {
    //% block=red
    Red = 0xFF0000,
    //% block=orange
    Orange = 0xFF6000,
    //% block=yellow
    Yellow = 0xFFFF00,
    //% block=green
    Green = 0x00FF00,
    //% block=blue
    Blue = 0x0000FF,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xFF00FF,
    //% block=white
    White = 0xFFFFFF,
    //% block=black
    Black = 0x000000
}

/**
 * Different control modes to support RGB or RGB+W LED Matrixes
 */
enum LEDControlMode {
    //% block="24-bit G->R->B default"
    GRB = 1,
    //% block="32-bit G->R->B->W for white channel LEDs"
    GRBW = 2,
    //% block="24-bit R->G->B"
    RGB = 3
}

/**
 * Functions to operate LED Matrixes - rewritten from scratch.
 */
//% weight=5 color=#FF7000 icon="\uf03e" blockGap=8
//% groups='["Configuration", "Output", "Variables"]'
namespace ledmatrixxy {
    /**
     * A LED Matrix
     */
    export class LEDMatrix {
        pin: DigitalPin
        width: number
        height: number
        private snake: boolean
        private matrix: number[][]
        private buffer: Buffer
        private mode: LEDControlMode

        constructor(width: number, height: number, snake: boolean = true, mode: LEDControlMode) {
            this.width = width
            this.height = height
            this.snake = snake
            this.mode = mode
            let stride = mode === LEDControlMode.GRBW ? 4 : 3;
            this.matrix = this.createMatrix(width, height)
            this.buffer = pins.createBuffer(width * height * stride)  // 3 or 4 bytes per LED
        }

        private createMatrix(w: number, h: number): number[][] {
            let mat: number[][] = []
            for (let y = 0; y < h; y++) {
                mat[y] = []
                for (let x = 0; x < w; x++) {
                    mat[y][x] = 0x0  // off (black)
                }
            }
            return mat
        }

        /**
         * Set LED to a given color (0xRRGGBB).
         * You need to call ``show`` to make the changes visible.
         * @param x Horizontal position of the LED in the matrix
         * @param y Vertical position of the LED in the matrix
         * @param rgb Color, e.g. 0xFF0000 for red
         */
        //% blockId="ledmatrixxy_set_pixel_color" block="%ledmatrix|set pixel at X %x Y %y to color %rgb=ledmatrixxy_colors"
        //% weight=80
        //% group="Configuration"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        setPixel(x: number, y: number, rgb: number): void {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.matrix[y][x] = rgb
            }
        }

        /** TODO - jackr1w - consider implementing a true reset procedure
         * Clear the LED matrix (set all pixels to black).
         * You need to call ``show`` to make the changes visible.
         */
        //% blockId="ledmatrixxy_clear" block="%ledmatrix|clear"
        //% group="Configuration"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        clear(): void {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    this.matrix[y][x] = 0x000000
                }
            }
        }

        /**
         * Fill the whole matrix with a given color.
         * You need to call ``show`` to make the changes visible.
         * @param rgb Color to fill, e.g. 0x00FF00 for green
         */
        //% blockId="ledmatrixxy_fill" block="%ledmatrix|fill with color %rgb=ledmatrixxy_colors"
        //% weight=78
        //% group="Configuration"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        fill(rgb: number): void {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    this.setPixel(x, y, rgb)
                }
            }
        }
        
        /**
         * Shift matrix content in X direction
         * @param amount number of pixels to shift; negative = left, positive = right
         * @param circular whether to wrap pixels around
         */
        //% block="%ledmatrix|shift X by %amount|circular %circular"
        //% amount.defl=1
        //% weight=65
        //% group="Configuration"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        shiftX(amount: number, circular: boolean): void {
            amount = amount % this.width;
            if (amount == 0) return;
            let newMatrix: number[][] = this.createMatrix(this.width, this.height);
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    let newX = x - amount;
                    if (circular) {
                        newX = (newX + this.width) % this.width;
                        newMatrix[y][x] = this.matrix[y][newX];
                    } else {
                        if (newX >= 0 && newX < this.width) {
                            newMatrix[y][x] = this.matrix[y][newX];
                        } else {
                            newMatrix[y][x] = 0;
                        }
                    }
                }
            }
            this.matrix = newMatrix;
        }

        /**
         * Shift matrix content in Y direction
         * @param amount number of pixels to shift; negative = up, positive = down
         * @param circular whether to wrap pixels around
         */
        //% block="%ledmatrix|shift Y by %amount|circular %circular"
        //% amount.defl=1
        //% weight=64
        //% group="Configuration"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        shiftY(amount: number, circular: boolean): void {
            amount = amount % this.height;
            if (amount == 0) return;
            let newMatrix: number[][] = this.createMatrix(this.width, this.height);
            for (let y = 0; y < this.height; y++) {
                let newY = y - amount;
                if (circular) {
                    newY = (newY + this.height) % this.height;
                    for (let x = 0; x < this.width; x++) {
                        newMatrix[y][x] = this.matrix[newY][x];
                    }
                } else {
                    if (newY >= 0 && newY < this.height) {
                        for (let x = 0; x < this.width; x++) {
                            newMatrix[y][x] = this.matrix[newY][x];
                        }
                    } else {
                        for (let x = 0; x < this.width; x++) {
                            newMatrix[y][x] = 0;
                        }
                    }
                }
            }
            this.matrix = newMatrix;
        }

        /**
         * Render the LED matrix (create the buffer and send it to display).
         * @param matrix LEDMatrix object
         */
        //% blockId="ledmatrixxy_show" block="%ledmatrix|show"
        //% weight=79
        //% group="Output"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        show(): void {
            let i = 0
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    let col = this.snake && y % 2 ? (this.width - 1 - x) : x
                    let rgb = this.matrix[y][col]
                    let w = (rgb >> 24) & 0xFF
                    let r = (rgb >> 16) & 0xFF
                    let g = (rgb >> 8) & 0xFF
                    let b = rgb & 0xFF
                    if (this.mode === LEDControlMode.GRB) {
                        this.buffer.setUint8(i++, g)
                        this.buffer.setUint8(i++, r)
                        this.buffer.setUint8(i++, b)
                    } else if (this.mode === LEDControlMode.GRBW) {
                        this.buffer.setUint8(i++, g)
                        this.buffer.setUint8(i++, r)
                        this.buffer.setUint8(i++, b)
                        this.buffer.setUint8(i++, w)
                    } else if (this.mode === LEDControlMode.RGB) {
                        this.buffer.setUint8(i++, r)
                        this.buffer.setUint8(i++, g)
                        this.buffer.setUint8(i++, b)
                    }
                }
            }
            ws2812b.sendBuffer(this.buffer, this.pin);
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // Exported functions for MakeCode Blocks mode markup
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create a new LedMatrixXY driver for LED Matrix width*length.
     * @param pin the pin where the LED Matrix is connected.
     * @param width width of LED Matrix, eg: 8
     * @param length length of LED Matrix, eg: 8
     * @param snake Type of LED Matrix: true if the rows of LEDs are routed like snake (each row starts from the end of the previous row)
     * @param mode LED control sequence, GRB is the default unless you know otherwise
     */
    //% blockId="ledmatrixxy_create" block="LedMatrixXY at pin %pin|of width %width and length %length|snake-style %snake LED control sequence %mode"
    //% snake.defl=true
    //% weight=90
    //% group="Configuration"
    //% parts="ledmatrixxy"
    //% trackArgs=0,2
    //% blockSetVariable=ledmatrix
    //% blockGap=8
    export function create(pin: DigitalPin, width: number = 8, length: number = 8, snake: boolean = true, mode: LEDControlMode = LEDControlMode.GRB): LEDMatrix {
        let matrix = new LEDMatrix(width, length, snake, mode);
        matrix.pin = pin
        return matrix;
    }

    /**
     * Gets the RGB value of a known color
    */
    //% weight=2
    //% blockId="ledmatrixxy_colors" block="%color"
    //% group="Variables"
    //% blockGap=8
    export function colors(color: LedMatrixXYColors): number {
        return color;
    }

    /**
     * Just a forwarder for replacing the predefined color selectors with custom value
    */
    //% weight=2
    //% blockId="ledmatrixxy_customcolor" block="RGB value %color"
    //% group="Variables"
    //% blockGap=8
    export function customcolor(color: number): number {
        return color;
    }

    /**
     * Color creator to generate color value from R,G,B values between 0-255
    */
    //% weight=10
    //% blockId="ledmatrixxy_packrgb" block="Red %R Green %G Blue %B"
    //% group="Variables"
    //% blockGap=8
    export function packRGB(R: number, G: number, B: number): number {
        return ((R & 0xFF) << 16) | ((G & 0xFF) << 8) | (B & 0xFF);
    }

    /**
     * !!! Only for RGB+W type devices !!!
     * Color creator to generate color value from R,G,B,W values between 0-255
    */
    //% weight=8
    //% blockId="ledmatrixxy_packrgbw" block="Red %R Green %G Blue %B White %W"
    //% group="Variables"
    //% blockGap=8
    export function packRGBW(R: number, G: number, B: number, W: number): number {
        return ((W & 0xFF) << 24) | ((R & 0xFF) << 16) | ((G & 0xFF) << 8) | (B & 0xFF);
    }

    /**
     * Converts a Hue-Saturation-Luminosity value into an RGB color
     * @param h hue from 0 to 360
     * @param s saturation from 0 to 99
     * @param l luminosity from 0 to 99
     */
    //% weight=6
    //% blockId=ledmatrixxy_hsl block="hue %h saturation %s luminosity %l"
    //% group="Variables"
    //% blockGap=8
    export function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);

        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h1 = Math.idiv(h, 60);//[0,6]
        let h2 = Math.idiv((h - h1 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$: number;
        let g$: number;
        let b$: number;
        if (h1 == 0) {
            r$ = c; g$ = x; b$ = 0;
        } else if (h1 == 1) {
            r$ = x; g$ = c; b$ = 0;
        } else if (h1 == 2) {
            r$ = 0; g$ = c; b$ = x;
        } else if (h1 == 3) {
            r$ = 0; g$ = x; b$ = c;
        } else if (h1 == 4) {
            r$ = x; g$ = 0; b$ = c;
        } else if (h1 == 5) {
            r$ = c; g$ = 0; b$ = x;
        }
        let m = Math.idiv((Math.idiv((l * 2 << 8), 100) - c), 2);
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;
        return packRGB(r, g, b);
    }

}
