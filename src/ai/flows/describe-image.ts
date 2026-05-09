'use server';
/**
 * @fileOverview An image description AI agent.
 *
 * - describeImage - A function that handles the image description process.
 * - DescribeImageInput - The input type for the describeImage function.
 * - DescribeImageOutput - The return type for the describeImage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit'; // Assuming genkit uses its own z or re-exports zod

type DescriptionPreference = "concise" | "detailed";

// Original input schema from the page/caller
const DescribeImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().optional().describe('An optional question about the image.'),
  detailPreference: z.enum(["concise", "detailed"] as [DescriptionPreference, ...DescriptionPreference[]])
    .optional()
    .default("concise")
    .describe('The desired level of detail for the description: "concise" or "detailed". Defaults to "concise".')
});
export type DescribeImageInput = z.infer<typeof DescribeImageInputSchema>;

// Schema for the output remains the same
const DescribeImageOutputSchema = z.object({
  description: z.string().describe('A description of the image.'),
});
export type DescribeImageOutput = z.infer<typeof DescribeImageOutputSchema>;

// Define a new schema for the prompt's direct input, including our boolean flag
const DescribeImagePromptInputSchema = DescribeImageInputSchema.extend({
    isDetailed: z.boolean().describe("Boolean flag indicating if a detailed description is requested.")
});

// TODO: Replacing describeImage

export async function describeImage(input: DescribeImageInput): Promise<DescribeImageOutput> {
  // return { description: "CODIGO AUN IMPLEMENTADO"};
  return describeImageFlow(input);
}


/***********************************************************************************/
// Uncomment the code below to embed conditional logic directly into our prompt.
/***********************************************************************************/
/***********************************************************************************/

const prompt = ai.definePrompt({
  name: 'describeImagePrompt',
  input: {
    schema: DescribeImagePromptInputSchema, 
  },
  output: {
    schema: DescribeImageOutputSchema,
  },
  prompt: `Eres un asistente de IA que ayuda a un usuario con discapacidad visual a entender una imagen.

{{#if isDetailed}}
Proporciona una descripción muy detallada y exhaustiva de la imagen. 
Céntrate en los detalles específicos, incluyendo elementos sutiles, relaciones espaciales y texturas si son evidentes.
{{else}}
Proporciona una descripción concisa de la imagen. 
Céntrate en el sujeto principal, los objetos clave y las actividades o el contexto primario.
{{/if}}

Destaca los objetos principales, las actividades y los colores.

{{#if question}}
El usuario también tiene la siguiente pregunta sobre la imagen: {{{question}}}
Por favor, responde a esta pregunta basándote en el contenido de la imagen, 
teniendo en cuenta también el nivel de detalle solicitado 
({{#if isDetailed}}detallado{{else}}conciso{{/if}}) 
para tu respuesta.
{{/if}}

Aquí está la imagen:

{{media url=photoDataUri}}
`,
});

/***********************************************************************************/
/***********************************************************************************/

// REPLACE ME PART 1: add flow here
// Define the prompt using the template from Step 1

// Define the flow
const describeImageFlow = ai.defineFlow<
  typeof DescribeImageInputSchema,
  typeof DescribeImageOutputSchema
>(
  {
    name: 'describeImageFlow',
    inputSchema: DescribeImageInputSchema,
    outputSchema: DescribeImageOutputSchema,
  },
  async (pageInput) => {
    const preference = pageInput.detailPreference || "concise";

    // Prepare the input for the prompt, including the new boolean flag
    const promptInputData = {
      ...pageInput,
      isDetailed: preference === "detailed",
    };

    const { output } = await prompt(promptInputData);
    return output!;
  }
);
