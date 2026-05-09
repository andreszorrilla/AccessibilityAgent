# 👁️ ClarityCam: AccessibilityAgent

**ClarityCam** es un agente de IA multimodal, manos libres y activado por voz. Este proyecto se basa en la filosofía de **Interfaz Nativamente Adaptativa (NAI)**, donde la accesibilidad es el pilar fundamental del diseño y no una característica secundaria.

El agente actúa como la interfaz misma, adaptándose a las necesidades del usuario, procesando entradas de voz y visión de forma proactiva para guiar a personas con discapacidad visual.

---

## 🚀 Características y Aprendizajes
*   **Diseño NAI (Natively Adaptive Interface):** Creación de sistemas de IA que ofrecen experiencias equivalentes para todos los usuarios por defecto.
*   **Clasificador de Intención:** Traducción de comandos de voz en lenguaje natural a acciones estructuradas.
*   **Contexto Conversacional:** Implementación de memoria a corto plazo para entender preguntas de seguimiento (ej. *"¿De qué color es eso?"*).
*   **Ingeniería de Prompts Multimodales:** Uso de **Google Gemini** para análisis de imágenes preciso y confiable.
*   **Sistema Multi-Agente:** Orquestación de agentes especializados en procesamiento de voz, análisis visual y síntesis de habla.

## 🛠️ Stack Tecnológico
*   **IA:** [Google Gemini](https://google.com) (Vertex AI).
*   **Frontend & Lógica:** [Next.js](https://nextjs.org) con TypeScript.
*   **Infraestructura:** Google Cloud Platform (Cloud Run, Artifact Registry, Secret Manager).

## 📂 Estructura del Proyecto
Los archivos principales para entender y modificar la lógica son:
- `src/app/page.tsx`: La interfaz de usuario principal.
- `src/ai/flows/`: Lógica central de los flujos de IA.
- `src/ai/intent-classifier.ts`: Definición de prompts y clasificación de intenciones.

## 📦 Configuración Rápida
1.  **Clonar:** `git clone https://github.com`
2.  **Variables de Entorno:** Crea un `.env` con `GOOGLE_GENAI_API_KEY="TU_API_KEY"`.
3.  **Instalar y Correr:**
    ```bash
    npm install
    npm run dev
    ```

---

## ✍️ Créditos y Reconocimiento
Este proyecto es un **fork** desarrollado a partir del trabajo original de **cuppibla**.

*   **Repositorio Original:** [cuppibla/AccessibilityAgent](https://github.com/cuppibla/AccessibilityAgent)
*   **Autor:** [cuppibla](https://github.com/cuppibla)

Agradecemos al autor original por la base técnica y la visión sobre interfaces accesibles que permitieron este desarrollo.

## 📄 Licencia
Este proyecto mantiene la licencia **Apache-2.0** del repositorio original.
