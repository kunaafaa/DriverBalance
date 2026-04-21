const fs = require('fs');
const path = 'app/(dashboard)/invoices/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The exterior page wrapper is dark (first 130 lines)
// We need to restore the inner document
let parts = content.split('className="bg-white shadow-black/50 print:shadow-none');
if(parts.length === 2) {
   let doc = parts[1];
   // restore text colors in the document
   doc = doc.replace(/text-white/g, 'text-[#111827]');
   doc = doc.replace(/bg-\[\#1A1A1A\]/g, 'bg-gray-100');
   doc = doc.replace(/border-\[\#1A1A1A\]/g, 'border-gray-200');
   doc = doc.replace(/border-\[\#111111\]/g, 'border-gray-100');
   doc = doc.replace(/text-gray-400/g, 'text-gray-500');
   
   content = parts[0] + 'className="bg-white shadow-black/50 print:shadow-none' + doc;
   fs.writeFileSync(path, content);
} else {
   console.log("Could not split file!");
}
console.log('Fixed invoice text colors');
