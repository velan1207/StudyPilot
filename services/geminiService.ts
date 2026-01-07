
// @google/genai Coding Guidelines: Using correct imports and initialization patterns
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { 
  GradeLevel, 
  Language, 
  ReadingAssessmentResult, 
  QuestionSettings, 
  SlideDeck, 
  QuestionPaper,
  LessonPlan,
  SyllabusPlan
} from "../types";

// Always use named parameter for apiKey and obtain from process.env.API_KEY
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeParseJSON = <T>(text: string, fallback: T): T => {
  try {
    const cleaned = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", text);
    return fallback;
  }
};

export const generateHomework = async (topic: string, grade: GradeLevel, language: Language, fileContext?: { base64: string, mimeType: string } | null) => {
  const ai = getAIClient();
  const prompt = `Act as an expert primary school educator. Create a structured 3-part homework assignment for Grade ${grade} in ${language} SPECIFICALLY AND ONLY about the topic: "${topic}".
  
  IMPORTANT: IGNORE all other topics in the provided context/files. Focus EXCLUSIVELY on "${topic}".
  
  The homework must follow this EXACT structure:
  1. Part 1: Identification/Matching (Identify items related to the topic).
  2. Part 2: Creative Application (A drawing or writing task involving a concept like a 'Strong Shield').
  3. Part 3: Decision Making (A 'Tech Hero' scenario with Multiple Choice answers).

  Ensure instructions are pedagogical and age-appropriate. Return strictly valid JSON.`;

  const parts: any[] = [];
  if (fileContext) parts.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } });
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          intro: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                partNumber: { type: Type.NUMBER },
                title: { type: Type.STRING },
                instruction: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["identification", "creative", "mcq"] },
                items: { type: Type.ARRAY, items: { type: Type.STRING } },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING }
              },
              required: ["partNumber", "title", "instruction", "type"]
            }
          }
        },
        required: ["title", "intro", "tasks"]
      }
    }
  });
  return safeParseJSON(response.text || "{}", null);
};

export const generateQuestionPaper = async (
  fileContext: { base64: string, mimeType: string } | null, 
  grade: GradeLevel, 
  language: Language, 
  settings: QuestionSettings,
  specificTopic?: string
): Promise<QuestionPaper> => {
  const ai = getAIClient();
  
  const blueprintDescription = settings.sections.map((s, idx) => {
    let detail = `Section ${idx + 1}: Total ${s.count} main numbered items. Each item is worth ${s.marksPerQuestion} marks.`;
    
    if (s.type === 'either-or') {
      detail += ` \n- TYPE: INTERNAL CHOICE (EITHER/OR). 
      \n- STRICT REQUIREMENT: You MUST provide TWO full distinct questions for EVERY one of the ${s.count} main numbers.
        1. Put the first question in the "text" field.
        2. Put the alternative/choice question in the "alternativeText" field.
      \n- MARKS: Mention that each sub-choice is worth ${s.marksPerQuestion} marks.`;
    }

    if (s.marksPerQuestion === 1 && s.oneMarkVariety) {
      detail += ` \n- VARIETY: Use ${s.oneMarkVariety}.`;
    }

    if (s.type === 'any-x-among-y') {
      const x = s.choiceCount || Math.ceil(s.count * 0.7);
      detail += ` \n- TYPE: Choice Based. \n- INSTRUCTION: "Answer any ${x} questions out of ${s.count}".`;
    } 
    
    return detail;
  }).join('\n\n');

  const topicConstraint = specificTopic ? `STRICTLY FOCUS EXCLUSIVELY AND ONLY on the topic: "${specificTopic}". IGNORE all other topics from any files or context provided.` : `Base the content on the uploaded syllabus context.`;

  const prompt = `Act as an expert Academic Examiner. Create a professional Question Paper for Grade ${grade} in ${language}.
  ${topicConstraint}
  
  BLUEPRINT RULES:
  ${blueprintDescription}
  
  Return strictly valid JSON.`;

  const contents: any[] = [{ text: prompt }];
  if (fileContext) {
    contents.unshift({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: contents }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          instructions: { type: Type.STRING },
          totalMarks: { type: Type.NUMBER },
          duration: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                instructions: { type: Type.STRING },
                type: { type: Type.STRING },
                marksPerQuestion: { type: Type.NUMBER },
                totalSectionMarks: { type: Type.NUMBER },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      marks: { type: Type.NUMBER },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      alternativeText: { type: Type.STRING }
                    },
                    required: ["id", "text", "marks"]
                  }
                }
              },
              required: ["id", "title", "instructions", "type", "questions", "totalSectionMarks"]
            }
          }
        },
        required: ["title", "instructions", "totalMarks", "duration", "sections"]
      }
    }
  });

  return safeParseJSON<QuestionPaper>(response.text || "{}", { title: "", instructions: "", totalMarks: 0, duration: "", sections: [] });
};

export const generateLocalContent = async (topic: string, grade: GradeLevel, language: Language) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a rich pedagogical lesson about "${topic}" for ${grade} in ${language}. Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          intro: { type: Type.STRING },
          keyIngredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              }
            }
          },
          example: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              result: { type: Type.STRING }
            }
          },
          realWorldUsage: { type: Type.STRING },
          funFact: { type: Type.STRING }
        }
      }
    }
  });
  return safeParseJSON(response.text || "{}", { title: topic, intro: "", keyIngredients: [], example: { scenario: "", steps: [], result: "" }, realWorldUsage: "", funFact: "" });
};

export const analyzeTextbookImage = async (base64: string, grade: GradeLevel, language: Language) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: "image/jpeg" } },
        { text: `Analyze this textbook page and create a worksheet for ${grade} in ${language}. Return JSON.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          instructions: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subInstructions: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      type: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  return safeParseJSON(response.text || "{}", { title: "Worksheet", instructions: "", sections: [] });
};

export const askQuestion = async (question: string, language: Language) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Answer this in ${language}: "${question}". Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intro: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, desc: { type: Type.STRING } } } },
          example: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, scenario: { type: Type.STRING }, logic: { type: Type.ARRAY, items: { type: Type.STRING } }, summary: { type: Type.STRING } } },
          usage: { type: Type.STRING },
          funFact: { type: Type.STRING }
        }
      }
    }
  });
  return safeParseJSON(response.text || "{}", { intro: "", ingredients: [], example: { title: "", scenario: "", logic: [], summary: "" }, usage: "", funFact: "" });
};

export const generateSlideDeck = async (topic: string, fileContext: { base64: string, mimeType: string } | null, language: Language, numSlides: number = 6): Promise<SlideDeck> => {
  const ai = getAIClient();
  const parts: any[] = [];
  if (fileContext) parts.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } });
  // CRITICAL: Exclusive focus on topic
  parts.push({ text: `Create a professional Slide Deck SPECIFICALLY AND EXCLUSIVELY about "${topic}" in ${language}. MUST be exactly ${numSlides} slides. Return valid JSON. IGNORE all other topics in the context.` });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          template: { type: Type.STRING },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.ARRAY, items: { type: Type.STRING } },
                visualPrompt: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  
  return safeParseJSON<SlideDeck>(response.text || "{}", { title: topic, template: "modern", slides: [] });
};

export const generateSyllabusPlan = async (duration: number, durationType: 'Days' | 'Weeks' | 'Months', grade: GradeLevel, language: Language, fileContext: { base64: string, mimeType: string }): Promise<SyllabusPlan> => {
  const ai = getAIClient();
  const prompt = `Based on the uploaded syllabus, create a roadmap for ${grade} in ${language} spanning ${duration} ${durationType}. Return valid JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } }, { text: prompt }] }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          timeframe: { type: Type.STRING },
          sessions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                period: { type: Type.STRING },
                topic: { type: Type.STRING },
                objective: { type: Type.STRING },
                activity: { type: Type.STRING }
              }
            }
          },
          finalAssessment: { type: Type.STRING }
        }
      }
    }
  });
  return safeParseJSON<SyllabusPlan>(response.text || "{}", { title: "", timeframe: "", sessions: [], finalAssessment: "" });
};

export const askChatQuestion = async (question: string, fileContext: { base64: string, mimeType: string } | null, language: Language) => {
  const ai = getAIClient();
  const parts: any[] = [];
  if (fileContext) parts.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } });
  
  const systemInstruction = `You are a professional educational assistant. 
  Respond in ${language}. 
  Avoid complex LaTeX symbols. 
  Use standard bolding (**Text**) for emphasis and ### for section headers. 
  Use simple bullet points (* Item) for lists.`;

  parts.push({ text: `Question: ${question}` });
  
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: [{ parts }],
    config: {
      systemInstruction
    }
  });
  return response.text || "";
};

export const generateVisualAid = async (topic: string, isColor: boolean) => {
  const ai = getAIClient();
  const prompt = isColor ? `Educational diagram of ${topic}.` : `Line art diagram of ${topic}.`;
  const imgRes = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: [{ parts: [{ text: prompt }] }] });
  let imageUrl = "";
  for (const part of imgRes.candidates?.[0]?.content?.parts || []) { 
    if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`; 
  }
  return { imageUrl, tips: "Use this to explain concepts visually." };
};

export const getHelpAdvice = async (issue: string, grade: string, language: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: [{ parts: [{ text: `Advice for: ${issue}` }]}] });
  return response.text || "";
};

export const decodeBase64 = (base64: string) => { 
  const b = atob(base64); 
  const res = new Uint8Array(b.length); 
  for (let i = 0; i < b.length; i++) res[i] = b.charCodeAt(i); 
  return res; 
};

export async function decodePCMToAudioBuffer(data: Uint8Array, ctx: AudioContext, rate = 24000, channels = 1) { 
  const d = new Int16Array(data.buffer); 
  const b = ctx.createBuffer(channels, d.length / channels, rate); 
  for (let c = 0; c < channels; c++) { 
    const cd = b.getChannelData(c); 
    for (let i = 0; i < d.length / channels; i++) cd[i] = d[i * channels + c] / 32768.0; 
  } 
  return b; 
}

export const getDemonstrationAudio = async (text: string, language: Language) => { 
  const ai = getAIClient(); 
  const res = await ai.models.generateContent({ 
    model: "gemini-2.5-flash-preview-tts", 
    contents: [{ parts: [{ text }] }], 
    config: { responseModalities: [Modality.AUDIO] } 
  }); 
  return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data; 
};

export const assessReading = async (base64: string, text: string) => { 
  const ai = getAIClient(); 
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: [{ parts: [{ inlineData: { data: base64, mimeType: 'audio/webm' } }, { text }] }], 
    config: { responseMimeType: "application/json" } 
  }); 
  return safeParseJSON<ReadingAssessmentResult>(res.text || "{}", { accuracyScore: 0, fluencyScore: 0, mispronouncedWords: [], positiveFeedback: "", improvementTips: "", transcription: "" }); 
};

export const generateLessonPlan = async (topics: string[], grade: GradeLevel, language: Language, fileContext?: { base64: string, mimeType: string }): Promise<LessonPlan> => { 
  const ai = getAIClient(); 
  const parts: any[] = []; 
  if (fileContext) parts.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } }); 
  parts.push({ text: `Lesson plan for: ${topics.join(', ')}` }); 
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: [{ parts }], 
    config: { responseMimeType: "application/json" } 
  }); 
  return safeParseJSON<LessonPlan>(res.text || "{}", { title: "", objectives: [], activities: [], assessment: "" }); 
};
