module.exports = class Payload{
    /** @type {string} */
    type = null;

    /** @type {string} */
    step = 'STARTED';

    /** @type {boolean} */
    isCompleted = false;

    /**
     * @param {string} type
     */
    constructor(type){
        this.type = type;
    }

    complete(){
        this.step = 'COMPLETED';
        this.isCompleted = true;
    }
}