module.exports = class User{
    /** @type {number} */
    telegram_id = null;

    /** @type {string} */
    telegram_name = null;

    /** @type {string} */
    telegram_user_name = null;

    /** @type {string} */
    language = 'my';

    /**
     * 
     * @param {*} user
     */
    constructor(user){
        if(user.telegram_id){
            this.telegram_id = user.telegram_id;
            this.telegram_name = user.telegram_name;
            this.telegram_user_name = user.telegram_user_name;
            this.language = user.language;
        }
        else{
            this.telegram_id = user.id;
            const firstName = user.first_name ? user.first_name : '';
            const lastName = user.last_name ? user.last_name : '';
            this.telegram_name = `${firstName} ${lastName}`.trim();
            this.telegram_user_name = user.username;
        }
    }

    /**
     * 
     * @param {*} user 
     * @returns {boolean}
     */
    IsInfoEqual(user){
        if(user.telegram_id)
            return ((this.telegram_id===user.telegram_id) && (this.telegram_name===user.telegram_name) && (this.telegram_user_name===user.telegram_user_name));
        else{
            const user2 = new User(user);
            return this.IsInfoEqual(user2);
        }
    }
}