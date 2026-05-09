'use server';

import { ai } from '@/ai/ai-instance';
import { z } from 'zod';

// Definición de las categorías de intención posibles
export type IntentCategory =
  // Intenciones de Análisis de Imagen
  | "DescribeImage"
  | "AskAboutImage"
  | "ReadTextInImage"
  | "IdentifyColorsInImage"

  // Intenciones de Control
  | "TakePicture"
  | "StartCamera"
  | "SelectImage"
  | "StopSpeaking"

  // Intenciones de Preferencias
  | "SetDescriptionDetailed"
  | "SetDescriptionConcise"

  // Intenciones de Respaldo
  | "GeneralInquiry"       // Preguntas generales sobre funciones o interacción social
  | "OutOfScopeRequest"    // Fuera de las capacidades definidas
  | "Unknown";             // No se pudo determinar

// 1. Definición del Esquema de Entrada
const ClassifyIntentInputSchema = z.object({
  userQuery: z.string().describe("La consulta del usuario a clasificar."),
});
export type ClassifyIntentInput = z.infer<typeof ClassifyIntentInputSchema>;

// 2. Definición del Esquema de Salida
const ClassifyIntentOutputSchema = z.object({
  intent: z.string().describe("Categoría de intención clasificada. Debe ser una de: DescribeImage, AskAboutImage, ReadTextInImage, IdentifyColorsInImage, TakePicture, StartCamera, SelectImage, StopSpeaking, SetDescriptionDetailed, SetDescriptionConcise, GeneralInquiry, OutOfScopeRequest."),
});
export type ClassifyIntentOutput = z.infer<typeof ClassifyIntentOutputSchema>;

// Capacidades y Limitaciones del Agente para el prompt
const AGENT_CAPABILITIES_AND_LIMITATIONS = `
**Capacidades Principales (Lo que el Agente PUEDE HACER):**
* **Análisis de Imagen:**
    * DescribeImage: Proporcionar una descripción general (solo si no se pide algo específico como colores o texto).
    * AskAboutImage: Responder preguntas específicas sobre el contenido visual (ej. "¿Hay un perro?", "¿De qué color es el coche?").
    * ReadTextInImage: Leer cualquier texto encontrado en la imagen.
    * IdentifyColorsInImage: Identificar los colores dominantes.
* **Control de Entrada de Imagen:**
    * TakePicture: Capturar una foto usando la cámara activa.
    * StartCamera: Activar la cámara (ej. "usa la cámara", "toma otra foto").
    * SelectImage: Permitir al usuario elegir un archivo de imagen de su dispositivo.
* **Control de Voz y Audio:**
    * StopSpeaking: Detener la salida de voz actual (texto a voz).
* **Gestión de Preferencias:**
    * SetDescriptionDetailed: Hacer que las descripciones futuras sean más detalladas.
    * SetDescriptionConcise: Hacer que las descripciones futuras sean más breves o concisas.
* **Interacción General:**
    * GeneralInquiry: Manejar frases de cortesía (ej. "hola", "gracias") o preguntas sobre sus propias funciones (ej. "¿qué puedes hacer?", "ayuda").

**Limitaciones (Lo que el Agente NO PUEDE HACER y debe clasificarse como OutOfScopeRequest):**
* No puede generar ni crear imágenes nuevas.
* No puede editar ni modificar imágenes (ej. "quita el fondo", "pon el coche azul").
* No puede analizar videos ni transmisiones en vivo más allá de capturar un fotograma.
* No puede responder preguntas de cultura general no relacionadas con la imagen.
`;

// 3. Definición del Prompt (Optimizado con Few-Shot y Reglas de Prioridad)
const classifyIntentPrompt = ai.definePrompt({
  name: 'classifyIntentPrompt',
  input: { schema: ClassifyIntentInputSchema },
  output: { schema: ClassifyIntentOutputSchema },
  config: {
    temperature: 0, // Determinismo absoluto para evitar GeneralInquiry por error
  },
  prompt: `Eres el motor de clasificación de intenciones de ClarityCam.

  ### PRIORIDAD
  
  1. IdentifyColorsInImage
  Si menciona "color", "colores", "tonos" o "paleta".
  
  2. ReadTextInImage
  Si menciona "leer", "texto", "dice", "letras", "palabras".
  
  3. AskAboutImage
  Si pregunta por un objeto, sujeto o acción específica.
  
  4. DescribeImage
  Si pide descripción general:
  - "qué ves"
  - "qué hay"
  - "qué observas"
  - "describe la imagen"
  
  5. TakePicture
  Si pide capturar foto inmediatamente:
  - "toma la foto"
  - "captura"
  - "dispara"
  
  6. StartCamera
  Si pide abrir o activar cámara:
  - "usa la cámara"
  - "abre cámara"
  
  ### EJEMPLOS
  
  "qué ves en la imagen" -> DescribeImage
  "qué colores ves" -> IdentifyColorsInImage
  "qué dice aquí" -> ReadTextInImage
  "hay un perro?" -> AskAboutImage
  "usa la cámara" -> StartCamera
  "toma la foto" -> TakePicture
  "hola" -> GeneralInquiry
  ### CONSULTA DEL USUARIO
  {{userQuery}}`
});

// 4. Definición del Flujo
export const classifyIntentFlow = ai.defineFlow<
  typeof ClassifyIntentInputSchema,
  typeof ClassifyIntentOutputSchema
>(
  {
    name: 'classifyIntentFlow',
    inputSchema: ClassifyIntentInputSchema,
    outputSchema: ClassifyIntentOutputSchema,
  },
  async (input) => {
    console.log("User Query:", input.userQuery);
    if (!input.userQuery || input.userQuery.trim() === "") {
        return { intent: "Unknown" };
    }

    try {
      const { output } = await classifyIntentPrompt(input);

      if (!output || !output.intent) {
          return { intent: "Unknown" };
      }

      const validCategories: string[] = [
          "DescribeImage", "AskAboutImage", "ReadTextInImage", "IdentifyColorsInImage",
          "TakePicture", "StartCamera", "SelectImage", "StopSpeaking",
          "SetDescriptionDetailed", "SetDescriptionConcise",
          "GeneralInquiry", "OutOfScopeRequest",
      ];

      if (validCategories.includes(output.intent)) {
          console.log(`Clasificado como: ${output.intent}`);
          return { intent: output.intent };
      } else {
          console.warn(`Categoría inválida devuelta por el modelo: "${output.intent}".`);
          return { intent: "Unknown" };
      }
    } catch (error) {
      console.error(`Error en el flujo de clasificación:`, error);
      return { intent: "Unknown" };
    }
  }
);