const crypto = require('crypto');

exports.encryptText = async (text) => {
    const key = Buffer.from(process.env.BUFFER_KEY, 'utf-8');
    const iv = Buffer.from(process.env.BUFFER_TEXT.toString(), 'utf-8');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
};

exports.decryptText = async (text) => {
    const key = Buffer.from(process.env.BUFFER_KEY, 'utf-8');
    const iv = Buffer.from(process.env.BUFFER_TEXT.toString(), 'utf-8');
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};
