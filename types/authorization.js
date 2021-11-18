module.exports = class Authorization{
    /** @type {number} */
    auth_id = null;

    /** @type {string} */
    token = null;

    /** @type {string} */
    name = null;

    /** @type {boolean} */
    query_users = false;

    /** @type {boolean} */
    query_payments = false;

    /** @type {boolean} */
    query_tickets = false;

    /** @type {boolean} */
    generate_tickets = false;

    /** @type {boolean} */
    query_auth = false;

    /** @type {boolean} */
    add_auth = false;

    /** @type {boolean} */
    update_auth = false;

    /** @type {boolean} */
    delete_auth = false;

    /** @type {boolean} */
    query_log = false;
}