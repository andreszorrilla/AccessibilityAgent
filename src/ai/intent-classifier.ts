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
  prompt: `Eres el motor de clasificación de intenciones de ClarityCam. Tu misión es mapear la consulta a una acción técnica.

### REGLAS DE PRIORIDAD CRÍTICA:
1. **IdentifyColorsInImage**: Si la consulta contiene las palabras "color", "colores", "tonos" o "paleta", CLASIFICA AQUÍ SIEMPRE, incluso si dice "qué ves".
   - *MAL:* "qué colores ves" -> DescribeImage (Incorrecto)
   - *BIEN:* "qué colores ves" -> IdentifyColorsInImage (Correcto)

2. **ReadTextInImage**: Si la consulta menciona "leer", "texto", "dice", "letras" o "palabras".
3. **AskAboutImage**: Si el usuario pregunta por un OBJETO, SUJETO o ACCIÓN específica (ej: perro, coche, persona, qué hace X).4. **DescribeImage**: Úsala cuando el usuario pida una descripción general, use el verbo "describir", 
pregunte "qué hay", "qué ves" o "qué observas", siempre que NO mencione colores o texto específicamente.
4. **DescribeImage**: Úsala cuando el usuario pida una descripción general, use el verbo "describir", pregunte "qué hay", "qué ves" o "qué observas", siempre que NO mencione colores o texto específicamente.
   - *EJEMPLO:* "podrías describir esta imagen" -> **DescribeImage** (Correcto)
5. **TakePicture**: Úsala cuando el usuario dé una orden directa de captura inmediata o mencione el acto de "sacar", "hacer" o "disparar" una foto (ej. "dispara", "toma la foto", "captura", "haz la foto ahora"). 
   *Nota: Diferénciala de StartCamera (que solo abre la cámara) porque TakePicture implica ejecutar la captura.*
4. **StartCamera (ESTADO)**: Órdenes de activar o poner la cámara: "activa la cámara", "pon la cámara", "abre la cámara", "usa la cámara", "quiero ver", "iniciar camara".

### REGLAS DE DECISIÓN:
1. **IdentifyColorsInImage (PRIORIDAD ALTA)**: Úsala SOLO si la consulta menciona explícitamente "color", "colores", "tonos" o "paleta".
2. **DescribeImage**: Úsala cuando el usuario pida una descripción general, pregunte "qué hay", "qué ves" o pida "características" sin especificar un objeto concreto.
3. **Prioridad Técnica**: Si hay un saludo ("hola") seguido de una orden, ignora el saludo y clasifica la orden.
4. **Comandos Cortos**: Palabras sueltas como "color" o "lee" son instrucciones técnicas, no consultas generales.

### EJEMPLOS DE REFERENCIA:
- "dime qué hay en la imagen" -> DescribeImage
- "qué ves" -> DescribeImage
- "¿qué colores ves?" -> IdentifyColorsInImage (Específico: color)
- "dime los colores" -> IdentifyColorsInImage
- "color" -> IdentifyColorsInImage
- "¿qué dice aquí?" -> ReadTextInImage
- "¿hay un perro?" -> AskAboutImage
- "hola" -> GeneralInquiry
- "¿Hay un hombre en la imagen?" -> AskAboutImage (Específico: hombre)
- "¿Qué está haciendo el gato?" -> AskAboutImage (Específico: gato)

### INSTRUCCIÓN DE DESAMBIGUACIÓN:
Si el usuario pregunta "qué ves" + [ATRIBUTO ESPECÍFICO], clasifica siempre según el atributo específico. 
- "Qué ves" + "texto" = ReadTextInImage
- "Qué ves" + "colores" = IdentifyColorsInImage
- "Qué ves" a secas = DescribeImage


### CAPACIDADES DEL AGENTE:
${AGENT_CAPABILITIES_AND_LIMITATIONS}

### CONSULTA DEL USUARIO:
'{userQuery}'`,
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