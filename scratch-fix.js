const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix charts
      content = content.replace(/stroke="#000000"/g, 'stroke="#A855F7"');
      content = content.replace(/stopColor="#000000"/g, 'stopColor="#A855F7"');
      
      // Remove light shadow
      content = content.replace(/shadow-gray-200\/20/g, 'shadow-black/50');
      content = content.replace(/shadow-gray-200\/50/g, 'shadow-black/50');
      
      // Fix background hover issues from script collision
      content = content.replace(/hover:bg-\[\#A855F7\]/g, 'hover:bg-[#9333EA]');

      // Fix text-white on search input placeholder
      content = content.replace(/placeholder:text-gray-500/g, 'placeholder:text-gray-600');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(process.cwd(), 'app'));
console.log('Fixed chart styling and shadows.');
