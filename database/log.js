/**
 * Get/Add/Update Tokens for Authorization
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-18
 */

const Log = require('../types/log');
const { executeQueryAsync, getObject, getInsertFieldString, getArray, getLimitString } = require("./query");

module.exports = {
    /**
     * 
     * @param {number} limit 
     * @param {number} page 
     * @param {number} auth_id
     * @returns {Promise<Log[]>}
     * 
     */
    async getLogsAsync(limit, page, auth_id=null){
        const limitStr = getLimitString(limit, page);
        const whereStr = (auth_id) ? `WHERE l.auth_id=${auth_id}` : '';
        const sql = `SELECT l.log_id,l.date,a.name,l.resource,l.status FROM logs l LEFT JOIN authorizations a ON l.auth_id=a.auth_id ${whereStr} ORDER BY l.log_id DESC ${limitStr};`;
        const result = await executeQueryAsync(sql);
        return getArray(result);
    },

    /**
     * 
     * @param {number} auth_id 
     * @param {string} resource 
     * @param {boolean} status
     * @returns {Promise<Log>}
     */
    async addLogAsync(auth_id, resource, status){
        const valStr = getInsertFieldString({
            date: new Date(),
            auth_id: auth_id,
            resource: resource,
            status: status
        },[
            'date',
            'auth_id',
            'resource',
            'status'
        ]);
        const sql = `INSERT INTO logs ${valStr} RETURNING *;`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    }
}