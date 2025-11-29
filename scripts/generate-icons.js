const fs = require('fs');
const path = require('path');

// Create SVG icons
function generateSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0e4701;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1b6610;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Inter, -apple-system, system-ui, sans-serif" 
        font-size="${size * 0.45}" font-weight="bold" fill="white">CQ</text>
  <line x1="${size * 0.25}" y1="${size * 0.68}" x2="${size * 0.75}" y2="${size * 0.68}" 
        stroke="#f2b705" stroke-width="${size * 0.015}" stroke-linecap="round"/>
</svg>`;
}

// Write SVG files
const publicDir = path.join(__dirname, '..', 'public');

[192, 512].forEach(size => {
  const svg = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(publicDir, filename), svg);
  console.log(`✅ Generated ${filename}`);
});

console.log('\n📝 To convert SVG to PNG, you can:');
console.log('1. Visit https://cloudconvert.com/svg-to-png');
console.log('2. Upload the SVG files from the public folder');
console.log('3. Download the PNG files and save them as icon-192x192.png and icon-512x512.png');
console.log('4. Move them to the public folder\n');
console.log('Or use an online tool like https://svgtopng.com/\n');
