const fs = require('fs');
const p = 'src/routes/app.financeiro.tsx';
let c = fs.readFileSync(p, 'utf-8');

const gridStart = c.indexOf('<div className="grid gap-6 lg:grid-cols-2 mb-6">');
const tableStart = c.indexOf('<Card className="shadow-card overflow-x-auto">');
const tableEndStr = '</Card>\n\n      <Dialog open={openModal} onOpenChange={setOpenModal}>';
const tableEnd = c.indexOf(tableEndStr);

if (gridStart !== -1 && tableStart !== -1 && tableEnd !== -1) {
    const chartsBlock = c.substring(gridStart, tableStart);
    // table block goes up to the closing Card before Dialog
    const tableBlock = c.substring(tableStart, tableEnd + '</Card>'.length);
    
    // Replace the combined area
    const newArea = tableBlock + '\n\n      ' + chartsBlock.trim();
    
    c = c.slice(0, gridStart) + newArea + '\n\n      ' + c.slice(tableEnd + '</Card>'.length).trimStart();
    
    fs.writeFileSync(p, c);
    console.log('Swapped successfully!');
} else {
    console.log('Could not find the sections.');
    console.log({ gridStart, tableStart, tableEnd });
}
