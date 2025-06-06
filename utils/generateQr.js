const qr = require('qr-image');
const fs = require('fs');
const path = require('path');

const generateQrCode = async (id) => {
    const fileName = `${id}.png`;
    const outputPath = path.join(__dirname, '..', 'public', 'img', 'items', fileName);

    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    }

    const qr_png = qr.image(id, {type: 'png'});
    const writeStream = fs.createWriteStream(outputPath);

    await new Promise((resolve, reject) => {
        qr_png.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    })

    return `${fileName}`;
}

module.exports = generateQrCode;