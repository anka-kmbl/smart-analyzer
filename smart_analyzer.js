const InputOutput = require('./service/inputOutput.service');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const logger = require('./service/logger.service');
const Analyzer = require('./analyzer/analyzer');

async function main() {
    logger.log('info', 'Starting a program...');
    const params = InputOutput.getCommandLineParams();

    const sampleFile = fs.readFileSync(params[2]);
    const sampleDoc = new JSDOM(sampleFile).window.document;

    const diffFile = fs.readFileSync(params[3]);
    const diffDoc = new JSDOM(diffFile).window.document;

    const elem = new Analyzer(sampleDoc, diffDoc, params[4] || 'make-everything-ok-button').analyze();

    const resPath = InputOutput.getPath(elem);
    logger.log('info', `Result path: ${resPath}`);
    return resPath;
}


main()
    .catch((err) => {
        logger.log('error', err);
        process.exit();
    });