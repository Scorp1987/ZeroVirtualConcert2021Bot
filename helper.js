module.exports = {
    /**
     * Replace myanmar number to english number
     * @param {string} text 
     * @returns 
     */
    replaceNumber(text){
        if (!text) return null;
        return text
            .replaceAll('၀', '0')
            .replaceAll('၁', '1')
            .replaceAll('၂', '2')
            .replaceAll('၃', '3')
            .replaceAll('၄', '4')
            .replaceAll('၅', '5')
            .replaceAll('၆', '6')
            .replaceAll('၇', '7')
            .replaceAll('၈', '8')
            .replaceAll('၉', '9');
    }
}