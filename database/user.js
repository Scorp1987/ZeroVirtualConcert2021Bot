/**
 * Add/Update User related data to Database
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-16
 */

const User = require('../types/user');
const { getInsertFieldString, executeQueryAsync, getObject, getUpdateValueString, getLimitString, getArray } = require('./query');

module.exports = {
    /**
     * 
     * Add user information to database
     * @param {User} user - User information that is required to be added
     * @returns {Promise<User>} - Added user information. return null if unsuccessful.
     * 
     */
    async addUserAsync(user){
        const str = getInsertFieldString(user, [
            'telegram_id',
            'telegram_name',
            'telegram_user_name',
            'language'
        ]);
        const sql = `INSERT INTO users ${str} RETURNING *;`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },

    /**
     * 
     * Update user information to database
     * @param {User} user - User information that needed to update
     * @returns {Promise<User>} Updated user information. return null if unsuccessful
     * 
     */
    async updateUserAsync(user){
        const str = getUpdateValueString(user, [
            'telegram_name',
            'telegram_user_name',
            'language'
        ]);
        const sql = `UPDATE users SET ${str} WHERE telegram_id=${user.telegram_id} RETURNING *;`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },

    /**
     * 
     * Update language for the user
     * @param {number} telegram_id - Telegram id
     * @param {string} language - Language
     * @returns Return updated user information. Return null if unsuccessful.
     * 
     */
    async updateLanguageAsync(telegram_id, language){
        return await this.updateUserAsync({
            telegram_id: telegram_id,
            language: language
        });
    },

    /**
     * 
     * Update name and username of user information
     * @param {User} user - user information that needed to be updated.
     * @returns Return updated user information. Return null if unsuccessful.
     * 
     */
    async updateUserInfoAsync(user){
        return await this.updateUserAsync({
            telegram_id: user.telegram_id,
            telegram_name: user.telegram_name,
            telegram_user_name: user.telegram_user_name
        });
    },

    /**
     * Get User from database using Telegram User ID
     * @param {Number} telegram_id - Telegram User ID
     * @returns {Promise<User>} - Return user if found, otherwise null
     */
    async getUserByIdAsync(telegram_id){
        const sql = `SELECT * FROM users WHERE telegram_id=${telegram_id};`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },

    /**
     * 
     * @param {number} limit 
     * @param {number} page 
     * @returns {Promise<User[]>}
     */
    async getUsersAsync(limit, page){
        const limitStr = getLimitString(limit, page);
        const sql = `SELECT * FROM users ORDER BY telegram_name ${limitStr};`;
        const result = await executeQueryAsync(sql);
        return getArray(result);
    }
}