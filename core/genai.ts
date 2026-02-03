/**
 * @fileoverview GenAI Service for VirtuaStudio
 * Wraps Google Gemini API to provide generative capabilities for 3D scenes.
 */

import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client lazily
// Note: process.env.API_KEY is injected by the build environment/runtime
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

/**
 * Generates an executable Three.js script to create a 3D object based on a prompt.
 * 
 * @param prompt User description of the object (e.g., "a cyberpunk crate")
 * @returns The raw function body string
 */
export async function generateThreeJSScript(prompt: string): Promise<string> {
  const modelId = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are a specialized 3D Asset Generator for Three.js.
    
    TASK:
    Write the complete BODY of a JavaScript function that generates a THREE.Group.
    The function receives 'THREE' as an argument.
    
    STRICT CODE STRUCTURE:
    const group = new THREE.Group();
    // ... create geometries/materials and add to group ...
    return group;

    RULES:
    1. You MUST start with "const group = new THREE.Group();".
    2. You MUST end with "return group;".
    3. Do NOT wrap code in markdown blocks (no \`\`\`).
    4. Do NOT use external texture loaders or async operations.
    5. Use standard THREE geometries (Box, Sphere, Cylinder, Cone, Torus, Extrude, Lathe) combined to form shapes.
    6. Return ONLY the javascript code. No explanations.
  `;

  try {
    const aiClient = getAI();
    if (!aiClient) {
      throw new Error("API key not available");
    }
    
    const response = await aiClient.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }, 
      }
    });

    let code = response.text || '';
    
    // Cleanup markdown if present (e.g. ```javascript ... ```)
    code = code.replace(/^```[a-z]*\s*/i, '').replace(/```$/i, '').trim();
    
    return code;
  } catch (error) {
    console.error("GenAI Generation Failed:", error);
    throw error;
  }
}