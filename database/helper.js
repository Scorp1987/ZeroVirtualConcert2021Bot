/**
 * Common Database functions for this application
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-16
 */

const fs = require('fs');
const { executeQueryAsync } = require('./query');
const config = require('../config');

module.exports = {
    /**
     * Create Tables and Indexes required for application if needed
     */
    async initializeDatabaseAsync(){
        fs.readFile('./initialsetup/database_setup.sql', 'utf8', async (err, data) =>{
            if(err) throw err;
            const sql = data.replaceAll('{ownerToken}', config.ownerToken).replaceAll('{ownerName}', config.ownerName);
            await executeQueryAsync(sql);
        });
    }
}