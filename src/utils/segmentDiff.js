const jsdiff = require('diff');

/**
 * 判断分段粒度
 * @param {string} content
 * @returns {'paragraph'|'line'}
 */
function getSegmentType(content) {
    // 阈值根据实际情况调整
    return content.length > 2000 ? 'paragraph' : 'line';
}

/**
 * 按粒度分段
 * @param {string} content
 * @param {'paragraph'|'line'} type
 * @returns {string[]}
 */
function splitContent(content, type) {
    if (type === 'paragraph') {
        // 按两个及以上换行分段
        return content.split(/\n{2,}/);
    }
    // 按单行分段
    return content.split('\n');
}

/**
 * 生成分段diff
 * @param {string} oldContent
 * @param {string} newContent
 * @returns {object} diff json
 */
function generateSegmentDiffs(oldContent, newContent) {
    const type = getSegmentType(newContent);
    const oldSegments = splitContent(oldContent || '', type);
    const newSegments = splitContent(newContent || '', type);
    const maxLen = Math.max(oldSegments.length, newSegments.length);
    const diffs = [];
    for (let i = 0; i < maxLen; i++) {
        const oldSeg = oldSegments[i] || '';
        const newSeg = newSegments[i] || '';
        if (oldSeg !== newSeg) {
            const diff = jsdiff.createPatch(`segment${i}`, oldSeg, newSeg);
            diffs.push({ index: i, diff });
        }
    }
    return { type, segments: diffs };
}

module.exports = {
    getSegmentType,
    splitContent,
    generateSegmentDiffs
};