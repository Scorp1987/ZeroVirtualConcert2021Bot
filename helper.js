module.exports = {
    /**
     * Replace myanmar number to english number
     * @param {string} text 
     * @returns 
     */
    replaceNumber(text){
        if (!text) return null;
        return text
            .replace('၀', '0')
            .replace('၁', '1')
            .replace('၂', '2')
            .replace('၃', '3')
            .replace('၄', '4')
            .replace('၅', '5')
            .replace('၆', '6')
            .replace('၇', '7')
            .replace('၈', '8')
            .replace('၉', '9');
    }
}