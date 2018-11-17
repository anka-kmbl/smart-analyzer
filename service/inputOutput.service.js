const logger = require('../service/logger.service');
class InputOutput {
    static getCommandLineParams() {
        const params =  process.argv.slice(0, 5);
        if (!params[0].includes('node')) {
            logger.log('error', 'The platform is wrong');
            process.exit();
        }
        return params;
    }

    static getPath(elem) {
        const pathArr = [];
        pathArr.push(elem.nodeName);
        let parentNode = elem.parentNode;
        while (!parentNode.nodeName.includes('document')) {
            const id = parentNode.id ? ' id:' + parentNode.id: '';
            const classList = parentNode.classList.length ? ' classList:' + parentNode.classList : '';
            pathArr.push(`${parentNode.nodeName}${id}${classList}`);
            parentNode = parentNode.parentNode;
        }
        return pathArr.reverse().join('->');
    }
}

module.exports = InputOutput;