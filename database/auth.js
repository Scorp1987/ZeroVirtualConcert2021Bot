/**
 * Get/Add/Update Tokens for Authorization
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-18
 */

const Authorization = require('../types/authorization');
const { executeQueryAsync, getObject, getInsertFieldString, getArray, getUpdateValueString, getLimitString } = require("./query");

module.exports = {
    /**
     * 
     * @param {string} token 
     * @returns {Promise<Authorization>}
     */
    async getAuthorizationByTokenAsync(token){
        const sql = `SELECT * FROM authorizations WHERE token='${token}';`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },


    /**
     * 
     * @param {number} auth_id 
     * @returns {Promise<Authorization>}
     */
    async getAuthorizationByIdAsync(auth_id){
        const sql = `SELECT * FROM authorizations WHERE auth_id='${auth_id}';`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },


    /**
     * 
     * @param {number} limit 
     * @param {number} page 
     * @returns {Promise<Authorization[]>}
     */
    async getAuthorizationsAsync(limit, page){
        const limitStr = getLimitString(limit, page);
        const sql = `SELECT * FROM authorizations ORDER BY auth_id ${limitStr};`;
        const result = await executeQueryAsync(sql);
        return getArray(result);
    },


    /**
     * 
     * @param {Authorization} authorization 
     * @returns {Promise<Authorization>}
     */
    async addAuthorizationAsync(authorization){
        const str = getInsertFieldString(authorization,[
            'token',
            'name',
            'query_users',
            'query_payments',
            'query_tickets',
            'generate_tickets'
        ]);
        const sql = `INSERT INTO authorizations ${str} RETURNING *;`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },


    /**
     * 
     * @param {Authorization} authorization 
     * @returns {Promise<Authorization>}
     */
    async updateAuthorizationAsync(auth_id, authorization){
        const str = getUpdateValueString(authorization,[
            'token',
            'name',
            'query_users',
            'query_payments',
            'query_tickets',
            'generate_tickets'
        ]);
        const sql = `UPDATE authorizations SET ${str} WHERE auth_id='${auth_id}' RETURNING *;`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },


    /**
     * 
     * @param {number} auth_id 
     * @returns {Promise<Authorization>}
     */
    async deleteAuthorizationAsync(auth_id){
        const sql = `DELETE FROM authorizations WHERE auth_id='${auth_id}' RETURNING *;`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },
}