/**
 * Add/Update Ticket related data to Database
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-16
 */

const
    Payment = require('../types/payment'),
    Ticket = require('../types/ticket'),
    { USED, INVALID, SUCCESS, ERROR } = require('../types/ticketStatus');
const
    cryptoConfig = require('../security/config'),
    crypto = require('../security/crypto_util');
const { executeQueryAsync, getObject, connect, getInsertFieldString, getUpdateValueString, getArray, getLimitString } = require("./query")

module.exports = {
    /**
     * 
     * @param {Payment} payment 
     * @returns {Promise<Payment>}
     * 
     */
    async addPaymentAsync(payment){
        payment.submitted_date = new Date();
        const str = getInsertFieldString(payment, [
            'telegram_id',
            'telegram_file_id',
            'currency',
            'method',
            'count',
            'amount',
            'submitted_date'
        ]);
        const sql = `INSERT INTO payments ${str} RETURNING *;`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },


    /**
     * 
     * @param {number} count 
     * @param {number} payment_id 
     * @returns {Promise<Ticket[]>}
     */
    async addTicketsAsync(count, payment_id = null){
        let client;
        const tickets = [];
        try{
            // Connect to Database
            client = await connect();

            for(i=0; i<count; i++){
                let str = getInsertFieldString({payment_id: payment_id}, ['payment_id']);

                // Insert ticket to get ticket id;
                let sql = `INSERT INTO tickets ${str} RETURNING *`;
                let result = await executeQueryAsync(sql, {client: client});
                let ticket = getObject(result);
                if(!ticket) continue;

                // Update ticket with code;
                const ticket_id = ticket.ticket_id;
                const key = cryptoConfig.ticketKey;
                const code = crypto.encrypt(`${ticket_id}`, key).toString('base64url');
                str = getUpdateValueString({
                    code: code,
                    generated_date: new Date()
                },[
                    'code',
                    'generated_date'
                ]);
                sql = `UPDATE tickets SET ${str} WHERE ticket_id=${ticket_id} RETURNING *;`;
                result = await executeQueryAsync(sql, {client: client});
                ticket = getObject(result);
                if(ticket) tickets.push(ticket);
            }
        }
        finally{
            if(client)
                client.release();
            return tickets;
        }
    },


    /**
     * 
     * Add Purchase information to purchase tables, Add Ticket information to ticket tables
     * @param {Payment} payment - Payment Information
     * @param {number} ticketCount - Number of tickets
     * @returns {Promise<{ payment: Payment, tickets: Ticket[] }>} List of ticket informations
     * 
     */
    async purchaseTicketsAsync(payment, ticketCount){
        let client;
        const tickets = [];
        try{
            // Connect to Database
            client = await connect();

            // Insert Payment Information
            payment.submitted_date = new Date();
            let str = getInsertFieldString(payment, [
                'telegram_id',
                'telegram_file_id',
                'currency',
                'method',
                'amount',
                'submitted_date'
            ]);
            let sql = `INSERT INTO payments ${str} RETURNING payment_id;`;
            let result = await executeQueryAsync(sql, {client: client});
            payment = getObject(result);
            if(!payment) return { payment: null, tickets: []};
            
            for(i=0; i<ticketCount; i++){
                // Insert ticket to get ticket id;
                sql = `INSERT INTO tickets(payment_id)VALUES(${payment.payment_id}) RETURNING ticket_id;`;
                result = await executeQueryAsync(sql, {client: client});
                let ticket = getObject(result);
                if(!ticket) continue;

                // Update ticket with code;
                const ticket_id = ticket.ticket_id;
                const key = cryptoConfig.ticketKey;
                const code = crypto.encrypt(`${ticket_id}`, key).toString('base64');
                str = getUpdateValueString({
                    code: code,
                    generated_date: new Date()
                },[
                    'code',
                    'generated_date'
                ]);
                sql = `UPDATE tickets SET ${str} WHERE ticket_id=${ticket_id} RETURNING *;`;
                result = await executeQueryAsync(sql, {client: client});
                ticket = getObject(result);
                if(ticket) tickets.push(ticket);
            }
        }
        finally{
            if(client)
                client.release();
            return { payment: payment, tickets: tickets };
        }
    },


    /**
     * 
     * Update Verify date and verify by to payment information
     * @param {number} payment_id - Payment ID to find
     * @param {number} verified_by - Verified Person telegram id
     * @returns {Promise<Payment>} Return the updated Payment Information
     * 
     */
     async verifyPaymentAsync(payment_id, verified_by){
        const str = getUpdateValueString({
            verified_date: new Date(),
            verified_by: verified_by
        },[
            'verified_date',
            'verified_by'
        ]);
        const sql = `UPDATE payments SET ${str} WHERE payment_id=${payment_id} RETURNING *;`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    },


    /**
     * 
     * Use Ticket to ticket information
     * @param {string} code - Unique code that is gonna be use
     * @param {number} by_telegram_id - the telegram id of the person use
     * @returns Ticket Status
     * 
     */
    async useTicketAsync(code, by_telegram_id){
        let client;
        try{
            client = await connect();
            const ticket_id = crypto.decrypt(Buffer.from(code, 'base64url'), cryptoConfig.ticketKey);
            let sql = `SELECT * FROM tickets WHERE ticket_id='${ticket_id}';`;
            let result = await executeQueryAsync(sql, {client: client});
            let ticket = getObject(result);
            if(!ticket) return INVALID;
            if(ticket.code != code) return INVALID;
            if(ticket.added_to_group_date) return USED;

            const str = getUpdateValueString({
                added_to_group_date: new Date(),
                added_to_group_by: by_telegram_id
            },[
                'added_to_group_date',
                'added_to_group_by'
            ]);
            sql = `UPDATE tickets SET ${str} WHERE ticket_id='${ticket_id}' RETURNING *;`
            result = await executeQueryAsync(sql, {client: client});
            ticket = getObject(result);
            if(ticket) return SUCCESS;
            else return ERROR;
        }
        catch(ex){
            return INVALID;
        }
        finally{
            if(client)
                client.release();
        }
    },


    /**
     * 
     * Get user friendly ticket informations
     * @param {number} limit
     * @param {number} page
     * @returns Return user friendly ticket informations
     * 
     */
    async getTicketsAsync(limit, page){
        const limitStr = getLimitString(limit, page);
        const sql = `SELECT t.ticket_id,t.code,u.telegram_id,u.telegram_name,u.telegram_user_name,t.generated_date,t.added_to_group_date,adu.telegram_id AS by_telegram_id,adu.telegram_name AS by_telegram_name,adu.telegram_user_name AS by_telegram_user_name FROM tickets t LEFT JOIN users adu ON t.added_to_group_by=adu.telegram_id LEFT JOIN payments p ON t.payment_id=p.payment_id LEFT JOIN users u ON p.telegram_id=u.telegram_id ORDER BY t.ticket_id DESC ${limitStr};`;
        const result = await executeQueryAsync(sql);
        return getArray(result);
    },


    /**
     * 
     * Get user friendly payment information
     * @param {number} limit
     * @param {number} page
     * @returns Return user friendly payment Information
     * 
     */
    async getPaymentsAsync(limit, page){
        const limitStr = getLimitString(limit, page);
        const sql = `SELECT p.payment_id,u.telegram_id,u.telegram_name,u.telegram_user_name,p.currency,p.count,p.method,p.amount,p.submitted_date,p.verified_date,vdu.telegram_id AS by_telegram_id,vdu.telegram_name AS by_telegram_name,vdu.telegram_user_name AS by_telegram_user_name FROM payments p LEFT JOIN users vdu ON p.verified_by=vdu.telegram_id LEFT JOIN users u ON p.telegram_id=u.telegram_id ORDER BY p.payment_id DESC ${limitStr};`;
        const result = await executeQueryAsync(sql);
        return getArray(result);
    },

    
    /**
     * 
     * @param {number} payment_id 
     * @returns {Promise<Payment>}
     */
    async getPaymentByIdAsync(payment_id){
        const sql = `SELECT * from payments WHERE payment_id=${payment_id};`;
        const result = await executeQueryAsync(sql);
        return getObject(result);
    }
}