const fs = require('fs');
const path = require('path');

const directoryPath = process.argv[2]; // Get directory path from command line argument
const outputFile = 'output.txt';

// Function to write file content into the output file
function appendFileContent(fileName, content) {
    // Write the file name
    fs.appendFileSync(outputFile, `----- ${fileName} -----\n`, 'utf8');
    // Write the content of the file
    fs.appendFileSync(outputFile, content + '\n\n', 'utf8');
}

// Recursive function to read directory and process files
function readDirectory(dirPath) {
    fs.readdir(dirPath, { withFileTypes: true }, (err, entries) => {
        if (err) {
            console.error("Unable to read the directory:", err);
            return;
        }

        entries.forEach(entry => {
            let filePath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                // If entry is a directory, recursively read this directory
                readDirectory(filePath);
            } else {
                // Read file content and append it to the output file
                fs.readFile(filePath, 'utf8', (err, content) => {
                    if (err) {
                        console.error("Error reading file:", err);
                        return;
                    }
                    appendFileContent(filePath, content);
                });
            }
        });
    });
}

// Clear the output file before appending new content
fs.writeFileSync(outputFile, '');

// Read the directory and start processing
readDirectory(directoryPath);

console.log(`All files have been concatenated into ${outputFile}`);
