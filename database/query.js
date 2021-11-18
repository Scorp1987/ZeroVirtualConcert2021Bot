/**
 * Database related helper functions
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-16
 */

const
    { Pool } = require('pg'),
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    /**
     * 
     * Get string Value for sql
     * @param {*} value 
     * @returns return the string equavalent of value
     * 
     */
const getString = function(value){
    if(value instanceof Date)
        return value.toISOString();
    else
        return`${value}`;
}

module.exports = {
    /**
     * Connect to the database
     * @returns 
     */
    async connect(){
        return await pool.connect();
    },

    /**
     * 
     * Execute SQL query and return the result
     * @param {string} sql - SQL Query statement to execute
     * @returns return the query result
     * 
     */
    async executeQueryAsync(sql, opt = null){
        let client;
        // console.log(sql);
        try{
            if(!opt)
                client = await pool.connect();
            else
                client = opt.client;
            const result = await client.query(sql);
            return result;
        }
        catch (ex){
            if(opt)
                throw ex;
        }
        finally{
            if(client && !opt)
                client.release();
        }
    },

    /**
     * 
     * Generate insert string from item and insertableFields
     * @param item - Object to convert to insert sql string
     * @param {string[]} insertableFields - Fields that are allowed to insert to database
     * @returns Return part of sql string for insert (field1,field2,...)VALUES('value1','value2',...)
     * 
     */
    getInsertFieldString(item, insertableFields){
        let colstr = '';
        let valstr = '';
        insertableFields.forEach(key => {
            if(key in item){
                colstr += `,${key}`;
                valstr += ',';
                valstr += (item[key] != null) ? `'${getString(item[key])}'` : 'NULL';
            }
        });
        colstr = (colstr.length>0) ? colstr.substring(1) : '';
        valstr = (valstr.length>0) ? valstr.substring(1) : '';
        return `(${colstr})VALUES(${valstr})`;
    },

    /**
     * 
     * Generate update string from item and updatableFields
     * @param item - Object to convert to update sql string
     * @param {string[]} updatableFields - Fields that are allowed to update to database
     * @returns Return part of sql string for update field1='value1',field2='value2',...
     * 
     */
    getUpdateValueString(item, updatableFields){
        let valstr = '';
        updatableFields.forEach(key => {
            if(key in item){
                valstr += `,${key}=`;
                valstr += (item[key] != null) ? `'${getString(item[key])}'` : 'NULL';
            }
        });
        valstr = (valstr.length>0) ? valstr.substring(1) : '';
        return valstr;
    },

    /**
     * 
     * Generate select in string from values
     * @param {Array} values - list of values
     * @returns return part of sql string for select 'value1','value2',...
     * 
     */
    getInValueString(values){
        let str = '';
        values.forEach(key => {
            str += `,'${getString(key)}'`;
        });
        str = (str.length>0) ? str.substring(1) : '';
        return str;
    },

    /**
     * 
     * @param {number} limit 
     * @param {number} page 
     * @returns 
     */
    getLimitString(limit, page){
        return `OFFSET ${limit*(page-1)} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    },

    /**
     * 
     * Get the first object row from QueryResult
     * @param result - QueryResult from pool
     * @returns return first object from QueryResult.rows if found otherwise null
     * 
     */
    getObject(result){
        if(result){
            if(result.rowCount > 0)
                return result.rows[0];
            else
                return null;
        }
        else
            return null;
    },

    /**
     * 
     * Get array of object from QueryResult
     * @param result - QueryResult from pool
     * @returns {any[]} return all object from QueryResult.rows if found, otherwise null
     * 
     */
    getArray(result){
        if(result){
            if(result.rowCount > 0)
                return result.rows;
            else
                return null;
        }
        else
            return null;
    }
}