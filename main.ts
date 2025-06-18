/**
 * Functions to operate LED Matrixes - rewritten from scratch.
 */
//% weight=5 color=#FF7000 icon="\uf03e" blockGap=8
//% groups='["Configuration", "Output", "Variables"]'
namespace ledmatrixxy {
    
    /**
     * Well known colors for a LED (referenced from Neopixel with minor adjustments for WS2812 LED strengths)
     */
    export enum LedMatrixXYColors {
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
    export enum LEDControlMode {
        //% block="24-bit G->R->B default"
        GRB = 1,
        //% block="32-bit G->R->B->W for white channel LEDs"
        GRBW = 2,
        //% block="24-bit R->G->B"
        RGB = 3
    }
    
    /**
     * Rotation options for the LED matrix
     */
    export enum RotationDirection {
        //% block="90°"
        Rotate90 = 90,
        //% block="180°"
        Rotate180 = 180,
        //% block="270°"
        Rotate270 = 270
    }
    
    /**
     * A LED Matrix
     */
    export class LEDMatrix {
        pin: DigitalPin
        width: number
        height: number
        private snake: boolean
        private row0_at_bottom: boolean
        private matrix: number[][]
        private buffer: Buffer
        private mode: LEDControlMode

        // NEW: Replaced with a 5x6 font for better spacing on 8-pixel high displays.
        private static font: { [char: string]: number[] } = {
            ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
            '!': [0x00, 0x2f, 0x00, 0x00, 0x00],
            '"': [0x00, 0x03, 0x00, 0x03, 0x00],
            '#': [0x14, 0x3f, 0x14, 0x3f, 0x14],
            '$': [0x14, 0x2a, 0x3f, 0x2a, 0x11],
            '%': [0x22, 0x11, 0x08, 0x04, 0x23],
            '&': [0x1a, 0x25, 0x25, 0x1a, 0x04],
            '\'': [0x00, 0x01, 0x02, 0x00, 0x00],
            '(': [0x00, 0x1c, 0x22, 0x00, 0x00],
            ')': [0x00, 0x22, 0x1c, 0x00, 0x00],
            '*': [0x08, 0x05, 0x1f, 0x05, 0x08],
            '+': [0x08, 0x08, 0x1f, 0x08, 0x08],
            ',': [0x00, 0x30, 0x10, 0x00, 0x00],
            '-': [0x08, 0x08, 0x08, 0x08, 0x08],
            '.': [0x00, 0x30, 0x30, 0x00, 0x00],
            '/': [0x20, 0x10, 0x08, 0x04, 0x02],
            '0': [0x1e, 0x21, 0x21, 0x1e, 0x00],
            '1': [0x00, 0x21, 0x3f, 0x20, 0x00],
            '2': [0x22, 0x21, 0x21, 0x26, 0x00],
            '3': [0x12, 0x21, 0x21, 0x1a, 0x00],
            '4': [0x0c, 0x0a, 0x09, 0x3f, 0x08],
            '5': [0x3a, 0x25, 0x25, 0x11, 0x00],
            '6': [0x1e, 0x25, 0x25, 0x18, 0x00],
            '7': [0x01, 0x01, 0x21, 0x2f, 0x00],
            '8': [0x1a, 0x25, 0x25, 0x1a, 0x00],
            '9': [0x0c, 0x12, 0x12, 0x3e, 0x00],
            ':': [0x00, 0x2a, 0x2a, 0x00, 0x00],
            ';': [0x00, 0x2a, 0x1a, 0x00, 0x00],
            '<': [0x08, 0x14, 0x22, 0x00, 0x00],
            '=': [0x14, 0x14, 0x14, 0x14, 0x14],
            '>': [0x00, 0x22, 0x14, 0x08, 0x00],
            '?': [0x02, 0x01, 0x21, 0x0d, 0x00],
            '@': [0x1e, 0x21, 0x2d, 0x2d, 0x1e],
            'A': [0x3e, 0x05, 0x05, 0x3e, 0x00],
            'B': [0x3f, 0x25, 0x25, 0x1a, 0x00],
            'C': [0x1e, 0x21, 0x21, 0x12, 0x00],
            'D': [0x3f, 0x21, 0x21, 0x1e, 0x00],
            'E': [0x3f, 0x25, 0x25, 0x21, 0x00],
            'F': [0x3f, 0x05, 0x05, 0x01, 0x00],
            'G': [0x1e, 0x21, 0x25, 0x1d, 0x00],
            'H': [0x3f, 0x04, 0x04, 0x3f, 0x00],
            'I': [0x21, 0x3f, 0x21, 0x00, 0x00],
            'J': [0x10, 0x20, 0x21, 0x1f, 0x00],
            'K': [0x3f, 0x04, 0x0a, 0x29, 0x00],
            'L': [0x3f, 0x20, 0x20, 0x20, 0x00],
            'M': [0x3f, 0x02, 0x0c, 0x02, 0x3f],
            'N': [0x3f, 0x02, 0x04, 0x08, 0x3f],
            'O': [0x1e, 0x21, 0x21, 0x1e, 0x00],
            'P': [0x3f, 0x05, 0x05, 0x02, 0x00],
            'Q': [0x1e, 0x21, 0x29, 0x3e, 0x20],
            'R': [0x3f, 0x05, 0x0d, 0x2a, 0x00],
            'S': [0x12, 0x25, 0x25, 0x19, 0x00],
            'T': [0x01, 0x01, 0x3f, 0x01, 0x01],
            'U': [0x1f, 0x20, 0x20, 0x1f, 0x00],
            'V': [0x0f, 0x10, 0x20, 0x10, 0x0f],
            'W': [0x1f, 0x20, 0x18, 0x20, 0x1f],
            'X': [0x29, 0x1a, 0x04, 0x1a, 0x29],
            'Y': [0x03, 0x04, 0x38, 0x04, 0x03],
            'Z': [0x22, 0x26, 0x2a, 0x32, 0x00],
            '[': [0x00, 0x3f, 0x21, 0x21, 0x00],
            '\\': [0x02, 0x04, 0x08, 0x10, 0x20],
            ']': [0x00, 0x21, 0x21, 0x3f, 0x00],
            '^': [0x04, 0x02, 0x01, 0x02, 0x04],
            '_': [0x20, 0x20, 0x20, 0x20, 0x20]
        };

        constructor(width: number, height: number, snake: boolean = true, row0_at_bottom: boolean, mode: LEDControlMode) {
            this.width = width
            this.height = height
            this.snake = snake
            this.row0_at_bottom = row0_at_bottom
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
         * Rotate the matrix by 90, 180, or 270 degrees clockwise.
         * For non-square matrices, this is a lossy rotation, as pixels outside the original dimensions are discarded.
         * @param direction rotation angle enum
         */
        //% block="%ledmatrix|rotate %direction"
        //% weight=63
        //% group="Configuration"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        rotate(direction: RotationDirection): void {
            const w = this.width;
            const h = this.height;
            // Create a temporary matrix with the same dimensions
            let temp = this.createMatrix(w, h);
            
            // Calculate center for rotation
            const cx = (w - 1) / 2;
            const cy = (h - 1) / 2;

            if (direction == RotationDirection.Rotate180) {
                 for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        temp[h - 1 - y][w - 1 - x] = this.matrix[y][x];
                    }
                }
            } else {
                // For 90 and 270 degrees
                for (let y_new = 0; y_new < h; y_new++) {
                    for (let x_new = 0; x_new < w; x_new++) {
                        // Translate point to be relative to center
                        const x_rel = x_new - cx;
                        const y_rel = y_new - cy;

                        let x_rot = 0;
                        let y_rot = 0;

                        // Apply inverse rotation to find source pixel
                        if (direction == RotationDirection.Rotate90) { // To get a 90 deg rotation, apply a -90 (270) rotation to find source
                             x_rot = x_rel * 0 - y_rel * 1; // cos(270)=0, sin(270)=-1
                             y_rot = x_rel * 1 + y_rel * 0; // sin(270)=-1, cos(270)=0  -- Wait, standard rotation matrix is [cos, -sin], [sin, cos]. so x' = x cos - y sin
                        } else { // 270 degrees
                             x_rot = x_rel * 0 + y_rel * 1; // cos(90)=0, sin(90)=1
                             y_rot = x_rel * -1 + y_rel * 0; // sin(90)=1, cos(90)=0
                        }

                        // Translate back to matrix coordinates
                        const sourceX = Math.round(x_rot + cx);
                        const sourceY = Math.round(y_rot + cy);

                        // Copy pixel if it's within the original matrix's bounds
                        if (sourceX >= 0 && sourceX < w && sourceY >= 0 && sourceY < h) {
                            temp[y_new][x_new] = this.matrix[sourceY][sourceX];
                        }
                    }
                }
            }
            
            this.matrix = temp;
        }

        /**
         * Flip the matrix horizontally (mirror over vertical axis)
         */
        //% block="%ledmatrix|flip horizontally"
        //% weight=62
        //% group="Configuration"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        flipX(): void {
            for (let y = 0; y < this.height; y++) {
                this.matrix[y].reverse();
            }
        }

        /**
         * Flip the matrix vertically (mirror over horizontal axis)
         */
        //% block="%ledmatrix|flip vertically"
        //% weight=61
        //% group="Configuration"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        flipY(): void {
            this.matrix.reverse();
        }

        /**
         * Print a character centered on the display
         * @param ch single character to display
         */
        //% block="%ledmatrix|print character %ch with color %rgb=ledmatrixxy_colors"
        //% weight=60
        //% group="Configuration"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        printChar(ch: string, rgb: number = 0xffffff): void {
            if (!ch || ch.length === 0 || ch.length > 1) return;
            const cols = LEDMatrix.font[ch.toUpperCase()] || LEDMatrix.font["?"]; // Use '?' for unknown chars
            const charWidth = cols.length;
            const offsetX = Math.max(0, Math.floor((this.width - charWidth) / 2));
            // Use font height of 6 and Math.floor() for centering
            const offsetY = Math.max(0, Math.floor((this.height - 6) / 2));
            for (let x = 0; x < cols.length && (x + offsetX) < this.width; x++) {
                // Loop 6 times for the new 6-pixel high font
                for (let y = 0; y < 6 && (y + offsetY) < this.height; y++) {
                    const bit = (cols[x] >> y) & 0x01;
                    this.matrix[y + offsetY][x + offsetX] = bit ? rgb : 0x000000;
                }
            }
        }
        
        /**
         * Render the LED matrix (create the buffer and send it to display).
         */
        //% blockId="ledmatrixxy_show" block="%ledmatrix|show"
        //% weight=79
        //% group="Output"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        show(): void {
            let i = 0; // buffer index
            // Iterate through each PHYSICAL pixel of the matrix
            for (let y_physical = 0; y_physical < this.height; y_physical++) {
                for (let x_physical = 0; x_physical < this.width; x_physical++) {
                    // Determine the conceptual matrix coordinates (x_matrix, y_matrix) to read from
                    // for the current physical pixel (x_physical, y_physical).

                    // Adjust X for snake layout. Snake wiring reverses columns on odd physical rows.
                    const x_matrix = (this.snake && (y_physical % 2 != 0)) ? (this.width - 1 - x_physical) : x_physical;
                    
                    // Adjust Y for the starting corner setting (vertical mirror).
                    const y_matrix = this.row0_at_bottom ? (this.height - 1 - y_physical) : y_physical;

                    const rgb = this.matrix[y_matrix][x_matrix];
                    
                    const w = (rgb >> 24) & 0xFF;
                    const r = (rgb >> 16) & 0xFF;
                    const g = (rgb >> 8) & 0xFF;
                    const b = rgb & 0xFF;

                    if (this.mode === LEDControlMode.GRB) {
                        this.buffer.setUint8(i++, g);
                        this.buffer.setUint8(i++, r);
                        this.buffer.setUint8(i++, b);
                    } else if (this.mode === LEDControlMode.GRBW) {
                        this.buffer.setUint8(i++, g);
                        this.buffer.setUint8(i++, r);
                        this.buffer.setUint8(i++, b);
                        this.buffer.setUint8(i++, w);
                    } else if (this.mode === LEDControlMode.RGB) {
                        this.buffer.setUint8(i++, r);
                        this.buffer.setUint8(i++, g);
                        this.buffer.setUint8(i++, b);
                    }
                }
            }
            ws2812b.sendBuffer(this.buffer, this.pin);
        }

        /**
         * Print a scrolling line of text
         * @param text String to scroll
         * @param rgb Color to use
         * @param speed Speed - scroll delay in milliseconds
         */
        //% block="%ledmatrix|print line %text with color %rgb=ledmatrixxy_colors at speed %speed"
        //% speed.defl=120
        //% weight=59
        //% group="Output"
        //% parts="ledmatrixxy"
        //% trackArgs=0
        //% blockGap=8
        printLine(text: string, rgb: number = 0xffffff, speed: number = 120): void {
            const gap = 1;
            const buffer: number[] = [];

            for (let i = 0; i < text.length; i++) {
                const ch = text.charAt(i).toUpperCase();
                const cols = LEDMatrix.font[ch] || LEDMatrix.font["?"]; // Use '?' for unknown chars
                for (let col of cols) {
                    buffer.push(col);
                }
                for (let g = 0; g < gap; g++) {
                    buffer.push(0x00);
                }
            }

            const totalCols = buffer.length;
            const visibleCols = this.width;
            // Add vertical centering offset for 6-pixel high font using Math.floor()
            const offsetY = Math.max(0, Math.floor((this.height - 6) / 2));

            for (let offset = 0; offset <= totalCols - visibleCols; offset++) {
                this.clear();
                for (let x = 0; x < visibleCols; x++) {
                    if (offset + x < totalCols) {
                        const colByte = buffer[offset + x];
                        // Loop 6 times for the new 6-pixel high font
                        for (let y = 0; y < 6 && (y + offsetY) < this.height; y++) {
                            const bit = (colByte >> y) & 0x01;
                            this.matrix[y + offsetY][x] = bit ? rgb : 0x000000;
                        }
                    }
                }
                this.show();
                basic.pause(speed);
            }
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
     * @param row0_at_bottom true if row 0 of the matrix is at the physical bottom corner
     * @param mode LED control sequence, GRB is the default
     */
    //% blockId="ledmatrixxy_create" block="LedMatrixXY at pin %pin|width %width length %length|snake-style %snake|row 0 at bottom %row0_at_bottom|LED control sequence %mode"
    //% width.defl=8 length.defl=8 snake.defl=true row0_at_bottom.defl=false
    //% weight=90
    //% group="Configuration"
    //% parts="ledmatrixxy"
    //% trackArgs=0,2
    //% blockSetVariable=ledmatrix
    //% blockGap=8
    export function create(pin: DigitalPin, width: number = 8, length: number = 8, snake: boolean = true, row0_at_bottom: boolean = false, mode: LEDControlMode = LEDControlMode.GRB): LEDMatrix {
        let matrix = new LEDMatrix(width, length, snake, row0_at_bottom, mode);
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
    //% weight=2 blockId="ledmatrixxy_customcolor" block="RGB value %color"
    //% group="Variables" blockGap=8
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
        let r = r$ + m; let g = g$ + m; let b = b$ + m;
        return packRGB(r, g, b);
    }
}
