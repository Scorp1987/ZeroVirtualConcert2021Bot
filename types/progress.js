const
    User = require('./user'),
    Payload = require('./payload');

module.exports = class Progress{
    /** @type {User} */
    user = null;

    /** @type {Payload} */
    payload = null;

    /**
     * @param {User} user
     * @param {Payload} payload
     */
    constructor(user, payload = null){
        this.user = user;
        this.payload = payload;
    }
}