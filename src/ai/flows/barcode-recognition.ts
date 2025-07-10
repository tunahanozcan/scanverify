'use server';

/**
 * @fileOverview An AI agent for recognizing barcodes from an image.
 *
 * - barcodeRecognition - A function that handles the barcode recognition process.
 * - BarcodeRecognitionInput - The input type for the barcodeRecognition function.
 * - BarcodeRecognitionOutput - The return type for the barcodeRecognition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BarcodeRecognitionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo containing a barcode, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type BarcodeRecognitionInput = z.infer<typeof BarcodeRecognitionInputSchema>;

const BarcodeRecognitionOutputSchema = z.object({
  serialNumber: z.string().describe('The serial number extracted from the barcode.'),
});
export type BarcodeRecognitionOutput = z.infer<typeof BarcodeRecognitionOutputSchema>;

export async function barcodeRecognition(input: BarcodeRecognitionInput): Promise<BarcodeRecognitionOutput> {
  return barcodeRecognitionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'barcodeRecognitionPrompt',
  input: {schema: BarcodeRecognitionInputSchema},
  output: {schema: BarcodeRecognitionOutputSchema},
  prompt: `You are an expert OCR reader specializing in extracting serial numbers from barcodes in images.

  You will receive an image containing a barcode. You will extract the serial number from the barcode and return it.

  Use the following as the primary source of information about the barcode.

  Photo: {{media url=photoDataUri}}`,
});

const barcodeRecognitionFlow = ai.defineFlow(
  {
    name: 'barcodeRecognitionFlow',
    inputSchema: BarcodeRecognitionInputSchema,
    outputSchema: BarcodeRecognitionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
