const pdfParse = require('pdf-parse');
const fs = require('fs').promises;

class PDFService {
    async extractText(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return {
                text: data.text,
                pages: data.numpages,
                info: data.info
            };
        } catch (error) {
            console.error('PDF Extraction Error:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }

    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('File deletion error:', error);
        }
    }
}

module.exports = new PDFService();