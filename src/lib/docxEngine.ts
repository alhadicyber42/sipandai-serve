/**
 * DOCX Template Engine
 * Handles variable replacement in Word documents using docxtemplater
 */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

/**
 * Generate a filled DOCX document from a template
 * @param templateBase64 - Base64 string of the .docx template
 * @param data - Data object to fill into the template
 * @param outputFilename - Name of the file to download
 */
export const generateDocument = (
    templateBase64: string,
    data: any,
    outputFilename: string = "surat-keterangan-cuti.docx"
) => {
    try {
        // 1. Decode Base64 to binary
        const binaryString = window.atob(templateBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 2. Load zip
        const zip = new PizZip(bytes);

        // 3. Create docxtemplater instance
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // 4. Render document
        doc.render(data);

        // 5. Generate output blob
        const out = doc.getZip().generate({
            type: "blob",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // 6. Save file
        saveAs(out, outputFilename);

        return true;
    } catch (error) {
        console.error("Error generating document:", error);
        throw error;
    }
};

/**
 * Validate if a file is a valid DOCX
 */
export const validateDocxTemplate = (file: File): boolean => {
    const validTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ];
    // Also check extension as fallback
    const hasDocxExtension = file.name.toLowerCase().endsWith(".docx");

    return validTypes.includes(file.type) || hasDocxExtension;
};

/**
 * Convert File to Base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data URL prefix (e.g., "data:application/vnd...;base64,")
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
};
