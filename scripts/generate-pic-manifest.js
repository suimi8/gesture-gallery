// scripts/generate-pic-manifest.js
// Scans public/Pic folder and generates pic.json manifest

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const picDir = path.join(__dirname, '../public/Pic');
const manifestPath = path.join(picDir, 'pic.json');

// Supported image extensions
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

function generateManifest() {
    // Check if Pic folder exists
    if (!fs.existsSync(picDir)) {
        console.log('📁 Pic folder not found, creating...');
        fs.mkdirSync(picDir, { recursive: true });
        return;
    }

    // Read all files in Pic folder
    const files = fs.readdirSync(picDir);

    // Filter for image files
    const images = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
    });

    if (images.length === 0) {
        console.log('📷 No images found in Pic folder, skipping manifest generation');
        // Remove old manifest if exists
        if (fs.existsSync(manifestPath)) {
            fs.unlinkSync(manifestPath);
        }
        return;
    }

    // Sort images naturally (1, 2, 10 instead of 1, 10, 2)
    images.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });

    // Write manifest
    fs.writeFileSync(manifestPath, JSON.stringify(images, null, 2));
    console.log(`✅ Generated pic.json with ${images.length} images`);
}

generateManifest();
