module.exports = class Payment{
    /** @type {number} */
    payment_id = null;

    /** @type {number} */
    telegram_id = null;

    /** @type {string} */
    telegram_file_id = null;

    /** @type {string} */
    currency = null;

    /** @type {string} */
    method = null;

    /** @type {number} */
    count = null;

    /** @type {number} */
    amount = null;

    /** @type {Date} */
    submitted_date = null;

    /** @type {Date} */
    verified_date = null;

    /** @type {number} */
    verified_by = null;
}