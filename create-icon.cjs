const { Jimp } = require('jimp');

// Colors
const BG_COLOR = 0x1e293bff; // Slate 900
const ACCENT_COLOR = 0x10b981ff; // Emerald 500
const SIZE = 256;

async function createIcon() {
    const image = new Jimp({ width: SIZE, height: SIZE, color: BG_COLOR });

    // Draw growth chart line (simple ascending)
    // Points: (32, 200) -> (96, 160) -> (160, 100) -> (224, 60)

    // Draw thick line segments
    for (let x = 0; x < SIZE; x++) {
        for (let y = 0; y < SIZE; y++) {
            // Simple line equation y = mx + c with thickness
            // Line 1: x in [32, 224], y approx 224 - 0.75 * x
            // Tolerance based on distance

            // Check if point is near the line segment
            // Let's implement a simpler draw: straight lines or fill a region
            // Or better: draw a centered wallet/shield shape and upward arrow on top

            // Draw upward arrow
            // Arrow shaft:
            if (x >= 118 && x <= 138 && y >= 64 && y <= 168) {
                image.setPixelColor(ACCENT_COLOR, x, y);
            }
            // Arrow head (simple triangle)
            if (y >= 32 && y <= 64) {
                // Triangle base 128 (center 128), height 32
                // 16 left/right per y step down? No.
                // let w = (y - 32) * 2; // Width increases as goes down
                // if (x >= 128 - w && x <= 128 + w) ...
                // Actually standard arrow head:
                // center (128, 32)
                // left (96, 64), right (160, 64)

                let dy = y - 32;
                let dx = Math.abs(x - 128);
                if (dx <= dy && dy <= 32) {
                    image.setPixelColor(ACCENT_COLOR, x, y);
                }
            }
        }
    }

    // Add "F" text or symbol? Maybe simpler.
    // Let's just draw a large stylized "F" or Chart icon.
    // Actually, simple upward trending bars is classic.

    // Bar 1
    image.scan(48, 144, 40, 64, (x, y, idx) => {
        image.setPixelColor(0x334155ff, x, y); // Lighter slate
    });
    // Bar 2
    image.scan(108, 112, 40, 96, (x, y, idx) => {
        image.setPixelColor(0x475569ff, x, y); // Even lighter
    });
    // Bar 3 (Emerald - highest)
    image.scan(168, 64, 40, 144, (x, y, idx) => {
        image.setPixelColor(ACCENT_COLOR, x, y);
    });

    // Save
    await image.write('resources/icon.png');
    console.log('Icon generated successfully!');
}

createIcon().catch(console.error);
// End of file
