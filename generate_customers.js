const fs = require('fs');
const path = require('path');

const firstNames = ['Ravi', 'Sita', 'Kiran', 'Priya', 'Vikram', 'Anita', 'Rajesh', 'Sneha', 'Mohammed', 'Lakshmi', 'Amit', 'Neha', 'Suresh', 'Pooja', 'Rahul', 'Anil', 'Sunita', 'Gopal', 'Kavita', 'Mahesh'];
const lastNames = ['Kumar', 'Ram', 'Reddy', 'Sharma', 'Singh', 'Desai', 'Babu', 'Rao', 'Ali', 'N', 'Patel', 'Gupta', 'Verma', 'Naidu', 'Chowdary', 'Jain', 'Iyer', 'Menon', 'Das', 'Nair'];
const areas = ['Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Kondapur', 'Gachibowli', 'Ameerpet', 'Kukatpally', 'KPHB', 'Hitech City', 'Dilsukhnagar', 'Begumpet', 'Secunderabad', 'Tolichowki', 'Miyapur', 'Uppal'];
const housingTypes = ['Plot', 'Flat', 'Villa', 'Apt', 'House', 'Block'];

const TOTAL_CUSTOMERS = 500;
let csvContent = 'Name,Phone,CAF Number,Address\n';

for (let i = 1; i <= TOTAL_CUSTOMERS; i++) {
    // Generate Random Data
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phone = '9' + Math.floor(100000000 + Math.random() * 900000000).toString(); // Random 10 digit starting with 9
    const caf = 'CAF' + (10000 + i).toString(); // CAF10001, CAF10002...
    
    const area = areas[Math.floor(Math.random() * areas.length)];
    const houseType = housingTypes[Math.floor(Math.random() * housingTypes.length)];
    const houseNo = Math.floor(1 + Math.random() * 200);
    const address = `${houseType} ${houseNo} ${area}`;

    csvContent += `${fn} ${ln},${phone},${caf},${address}\n`;
}

const outputPath = path.join(__dirname, 'Sample_customer_500.csv');
fs.writeFileSync(outputPath, csvContent);
console.log(`✅ Successfully generated ${TOTAL_CUSTOMERS} customers in Sample_customer_500.csv`);