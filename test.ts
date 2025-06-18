// Test file for the ledmatrixxy extension.
// To run these tests, open the simulator and click "Run Tests".

// --- UNIT TESTS ---
// These tests check the pure logic of the color functions.

// Test Suite for Color Packing and Conversion
describe("ledmatrixxy.colors", () => {
    // Test the packRGB function
    it("should pack R, G, B values into a single number", () => {
        // Test pure red
        const red = ledmatrixxy.packRGB(255, 0, 0);
        if (red !== 0xFF0000) {
            throw "packRGB failed for red";
        }

        // Test pure green
        const green = ledmatrixxy.packRGB(0, 255, 0);
        if (green !== 0x00FF00) {
            throw "packRGB failed for green";
        }

        // Test pure blue
        const blue = ledmatrixxy.packRGB(0, 0, 255);
        if (blue !== 0x0000FF) {
            throw "packRGB failed for blue";
        }

        // Test a mixed color
        const magenta = ledmatrixxy.packRGB(255, 0, 255);
        if (magenta !== 0xFF00FF) {
            throw "packRGB failed for magenta";
        }

        // Test black (all off)
        const black = ledmatrixxy.packRGB(0, 0, 0);
        if (black !== 0x000000) {
            throw "packRGB failed for black";
        }
    });

    // Test the HSL to RGB conversion function
    it("should convert HSL values to the correct RGB number", () => {
        // HSL Red (hue=0)
        const red = ledmatrixxy.hsl(0, 99, 50);
        if (red !== 0xFF0000) {
            throw "HSL conversion failed for red";
        }

        // HSL Green (hue=120)
        const green = ledmatrixxy.hsl(120, 99, 50);
        if (green !== 0x00FF00) {
            throw "HSL conversion failed for green";
        }

        // HSL Blue (hue=240)
        const blue = ledmatrixxy.hsl(240, 99, 50);
        if (blue !== 0x0000FF) {
            throw "HSL conversion failed for blue";
        }
    });

    // Test the colors enum block
    it("should return the correct value from the colors enum", () => {
        const orange = ledmatrixxy.colors(ledmatrixxy.LedMatrixXYColors.Orange);
        if (orange !== 0xFF6000) {
            throw "Colors enum block returned wrong value for Orange";
        }
    });
});

// --- VISUAL TESTS ---
// These tests will run on the simulator. Observe the 8x8 matrix
// display in the simulator to verify the output is correct.

// Create a matrix instance for visual tests
// NOTE: For tests, we use a virtual pin like `DigitalPin.P0`.
const matrix = ledmatrixxy.create(DigitalPin.P0, 8, 8, true, ledmatrixxy.LEDControlMode.GRB);

describe("ledmatrixxy.visuals", () => {
    // Test the clear() function
    it("should clear the display to all black", () => {
        matrix.fill(ledmatrixxy.colors(ledmatrixxy.LedMatrixXYColors.Blue));
        matrix.show();
        basic.pause(500); // Should be all blue
        matrix.clear();
        matrix.show();
        basic.pause(500); // Should be all black
        // Manually check if the simulator is black
    });

    // Test the fill() function
    it("should fill the display with a single color", () => {
        matrix.fill(ledmatrixxy.colors(ledmatrixxy.LedMatrixXYColors.Green));
        matrix.show();
        basic.pause(1000); // Should be all green
        matrix.clear();
        matrix.show();
    });

    // Test setPixel()
    it("should light up individual pixels correctly", () => {
        matrix.clear();
        // Draw a red 'X'
        for (let i = 0; i < 8; i++) {
            matrix.setPixel(i, i, 0xFF0000);
            matrix.setPixel(7 - i, i, 0xFF0000);
        }
        matrix.show();
        basic.pause(1000); // Should show a red X
        matrix.clear();
        matrix.show();
    });

    // Test shiftX()
    it("should shift the content horizontally", () => {
        matrix.clear();
        matrix.setPixel(3, 3, 0x0000FF);
        matrix.show();
        basic.pause(500); // A single blue pixel in the middle

        matrix.shiftX(1, false); // Shift right by 1
        matrix.show();
        basic.pause(500); // Pixel should be at (4, 3)

        matrix.shiftX(-2, false); // Shift left by 2
        matrix.show();
        basic.pause(500); // Pixel should be at (2, 3)
        
        matrix.clear();
        matrix.show();
    });

    // Test rotate()
    it("should rotate the content", () => {
        matrix.clear();
        // Draw a line on the left
        for (let i = 0; i < 8; i++) {
            matrix.setPixel(0, i, 0xFFFF00);
        }
        matrix.show();
        basic.pause(700); // Should be a yellow vertical line on the left

        matrix.rotate(ledmatrixxy.RotationDirection.Rotate90);
        matrix.show();
        basic.pause(700); // Should be a yellow horizontal line on the top

        matrix.rotate(ledmatrixxy.RotationDirection.Rotate90);
        matrix.show();
        basic.pause(700); // Should be a yellow vertical line on the right

        matrix.clear();
        matrix.show();
    });
    
    // Test flipX() and flipY()
    it("should flip the content", () => {
        matrix.clear();
        // Draw an 'L' shape
        for(let i = 0; i < 5; i++) matrix.setPixel(1, i, 0xFF00FF);
        for(let i = 1; i < 4; i++) matrix.setPixel(i, 4, 0xFF00FF);
        matrix.show();
        basic.pause(700); // Should be a purple 'L'

        matrix.flipX(); // Flip horizontally
        matrix.show();
        basic.pause(700); // Should be a backwards 'L'

        matrix.flipY(); // Flip vertically
        matrix.show();
        basic.pause(700); // Should be an upside-down backwards 'L'

        matrix.clear();
        matrix.show();
    });

    // Test printChar()
    it("should print a character", () => {
        matrix.clear();
        matrix.printChar("A", ledmatrixxy.colors(ledmatrixxy.LedMatrixXYColors.White));
        matrix.show();
        basic.pause(1000); // Should show a white 'A'
        
        matrix.clear();
        matrix.printChar("?", ledmatrixxy.colors(ledmatrixxy.LedMatrixXYColors.Yellow));
        matrix.show();
        basic.pause(1000); // Should show a yellow '?'

        matrix.clear();
        matrix.show();
    });
    
    // Test printLine() - This is a blocking visual test
    it("should scroll a line of text", () => {
        // This test scrolls "HELLO" across the display.
        // It's a blocking call, so the test will pause here until it's done.
        matrix.printLine("HELLO", 150, 0x00FFFF);
    });
});
