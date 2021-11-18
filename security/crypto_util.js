const crypto = require('crypto');
const ALGORITHM = {
    /**
     * GCM is an authenticated encryption mode that
     * not only provides confidentiality but also 
     * provides integrity in a secured way
     */  
   BLOCK_CIPHER: 'aes-256-gcm',

   /**
    * 128 bit auth tag is recommended for GCM
    */
   AUTH_TAG_BYTE_LEN: 16,

   /**
    * NIST recommends 96 bits or 12 bytes IV for GCM
    * to promote interoperability, efficiency, and
    * simplicity of design
    */
   IV_BYTE_LEN: 12,

   /**
    * Note: 256 (in algorithm name) is key size. 
    * Block size for AES is always 128
    */
   KEY_BYTE_LEN: 32,

   /**
    * To prevent rainbow table attacks
    * */
   SALT_BYTE_LEN: 16
}

module.exports = {
    getIV: () => crypto.randomBytes(ALGORITHM.IV_BYTE_LEN),

    /**
     * To prevent rainbow table attacks
     */
    getSalt: () => crypto.randomBytes(ALGORITHM.SALT_BYTE_LEN),

    getRandomKey: () => crypto.randomBytes(ALGORITHM.KEY_BYTE_LEN),

    /**
     * 
     * @param {Buffer} password - The password to be used for generating key
     * @param {Buffer} salt - The salt to be used for generating key
     * 
     * To be used when key needs to be generated based on password.
     * The caller of this function has the responsibility to clear 
     * the Buffer after the key generation to prevent the password 
     * from lingering in the memory
     */
    getKeyFromPassword: (password, salt) => crypto.scryptSync(password, salt, ALGORITHM.KEY_BYTE_LEN),

    /**
     * 
     * @param {Buffer} message - The clear text message to be encrypted
     * @param {Buffer} key - The key to be used for encryption
     * @returns {Buffer} - Cipher text
     * 
     * The caller of this function has the responsibility to clear
     * the Buffer after the encryption to prevent the message text
     * and the key from lingering in the memory
     */
    encrypt(message, key){
        const iv = this.getIV();
        const cipher = crypto.createCipheriv(
            ALGORITHM.BLOCK_CIPHER, key, iv,
            { authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN });
        return Buffer.concat([iv, cipher.update(message), cipher.final(), cipher.getAuthTag()]);
    },

    /**
     * 
     * @param {Buffer} ciphertext - Cipher text
     * @param {Buffer} key - The key to be used for decryption
     * @returns {Buffer} - If can't decrypt, return empty string
     * 
     * The caller of this function has the responsibility to clear
     * the Buffer after the decryption to prevent the message text
     * and the key from lingering in the memory
     */
    decrypt(ciphertext, key){
        try{
            const authTag = ciphertext.slice(-ALGORITHM.AUTH_TAG_BYTE_LEN);
            const iv = ciphertext.slice(0, ALGORITHM.IV_BYTE_LEN);
            const encryptedMessage = ciphertext.slice(ALGORITHM.IV_BYTE_LEN, -ALGORITHM.AUTH_TAG_BYTE_LEN);
            const decipher = crypto.createDecipheriv(
                ALGORITHM.BLOCK_CIPHER, key, iv,
                { authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN });
            decipher.setAuthTag(authTag);
            return Buffer.concat([decipher.update(encryptedMessage), decipher.final()]);
        }
        catch{
            return Buffer.from('');
        }
    },

    /**
     * 
     * @param {Buffer} ciphertext - Ciphered password text
     * @param {Buffer} password - The password as key to decipher and check
     * @param {Buffer} salt - The salt to be used for generating key
     * @returns {Buffer} - true if match, otherwise false
     * 
     * The caller of this function has the responsibility to clear
     * the Buffer after the decryption to prevent the password
     * and the key from lingering in the memory
     */
    checkPassword(ciphertext, password, salt){
        const key = this.getKeyFromPassword(password, salt);
        const decPassword = this.decrypt(ciphertext, key);
        return Buffer.compare(Buffer.from(password), decPassword) === 0;
    }
}