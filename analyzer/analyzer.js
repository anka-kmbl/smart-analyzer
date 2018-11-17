const logger = require('../service/logger.service');
const config = require('../config/analyzer.config');

class Analyzer {
    constructor(
        sampleDoc,
        diffDoc,
        id
    ) {
        this.sampleDoc = sampleDoc;
        this.diffDoc = diffDoc;
        this.id = id;
    };

    getSearchElemParams(searchElem) {
        const paramsMap = {};
        for (const i of searchElem.getAttributeNames()) {
            const attr = searchElem.getAttribute(i);
            paramsMap[i] = attr.toString();
        }
        paramsMap.textContent = searchElem.textContent.trim();
        paramsMap.localName = searchElem.localName;
        return paramsMap;
    }



    analyze() {
        const paramsMap = this.getSearchElemParams(this.findById(this.id, this.sampleDoc));
        logger.log('info', `Got an element info: ${JSON.stringify(paramsMap)}`);
        const doc = this.diffDoc;
        const item = this.findById(paramsMap.id, doc);
        if (item) {
            return item;
        }
        const foundElemsScoreMap = new Map();
        for (const [param, v] of Object.entries(paramsMap)) {
            logger.log('info', `Start searching by ${param}: ${v}`);
            let elems;
            if (param === 'textContent') {
                const elemList = Array.from(doc.querySelectorAll(`${paramsMap.localName}`));
                elems = elemList.filter((v) => v.innerHTML === v);
            } else {
                for (let part of v.split(' ')) {
                    const elemList = doc.querySelectorAll(`${paramsMap.localName}[${param}*="${part}"]`);
                    elems = !elems ? Array.from(elemList) : elems.concat(Array.from(elemList));
                }
            }


            if (elems && elems.length) {
                logger.log('info', `Found ${elems.length} element(s)`);
                for (let elem of elems) {
                    if (foundElemsScoreMap.has(elem)) {
                        continue;
                    }
                    for (const [p, v] of Object.entries(paramsMap)) {
                        if (!foundElemsScoreMap.has(elem)) {
                            foundElemsScoreMap.set(elem, 0);
                        }
                        let relativeScore = 0;
                        if (p === 'textContent') {
                            relativeScore = this.getRelativeScore(v, elem.textContent.trim());
                        } else {
                            const attrValue = elem.getAttribute(p);
                            if (attrValue) {
                                relativeScore = this.getRelativeScore(v, attrValue.toString());
                            }
                        }
                        foundElemsScoreMap.set(elem, foundElemsScoreMap.get(elem) + relativeScore);


                    }
                }

            }
        }
        const maxElemScore = {
            elem: null,
            score: 0
        };

        for (const [elem, score] of foundElemsScoreMap.entries()) {
            if ((score / Object.keys(paramsMap).length) >= config.MIN_MATCH_PERCENT) {
                logger.log('info', 'This element is likely to be the one we are searching for:');
                logger.log('info', JSON.stringify(this.getSearchElemParams(elem)));
                logger.log('info', `Score: ${score}. MaxScore: ${maxElemScore.score}`);
                if (score > maxElemScore.score) {
                    maxElemScore.elem = elem;
                    maxElemScore.score = score;
                }
            }
        }
        const res = maxElemScore.elem || false;
        if (res) {
            logger.log('info', `Got the element with score: ${maxElemScore.score}`);
            logger.log('info', JSON.stringify(this.getSearchElemParams(maxElemScore.elem)));

            logger.log('info', `Initial element: ${JSON.stringify(paramsMap)}`);
        }
        return res;
    }

    getRelativeScore(searchVal, sampleVal) {
        if (searchVal.toLowerCase() === sampleVal.toLowerCase()) {
            logger.log('info', `Total equal! search attribute: ${sampleVal}. +1 score`);
            return 1;
        }

        let count = 0;
        let sample = sampleVal.toLowerCase().split(' ');
        let search = searchVal.toLowerCase().split(' ');
        for (let str of sample) {
            if (search.includes(str)) {
                count += 1;
            }
        }
        const score = Math.round((count / search.length) * 100) / 100;
        if (score) {
            logger.log('info', `The values are partially equal. SearchVal: ${searchVal}. SampleVal: ${sampleVal}. Score: ${score}`);
        }
        return score;
    }

    findById(id, doc) {
        const item = doc.querySelector(`[id="${id}"]`);
        return item || false;
    }

}

module.exports = Analyzer;
