
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

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Added missing export for ContentGen.tsx
export const generateLocalContent = async (topic: string, grade: GradeLevel, language: Language) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { text: `Generate structured educational content about "${topic}" for Grade ${grade} in ${language}. 
      Include title, intro, key ingredients (terms/definitions), an example scenario with steps and result, real world usage, and a fun fact.` },
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
              properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } },
              required: ["term", "definition"]
            } 
          },
          example: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              result: { type: Type.STRING }
            },
            required: ["scenario", "steps", "result"]
          },
          realWorldUsage: { type: Type.STRING },
          funFact: { type: Type.STRING }
        },
        required: ["title", "intro", "keyIngredients", "example", "realWorldUsage", "funFact"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// Fix: Added missing export for WorksheetGen.tsx
export const analyzeTextbookImage = async (base64: string, grade: GradeLevel, language: Language) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: 'image/jpeg' } },
        { text: `Analyze this textbook page for Grade ${grade} and create a worksheet in ${language}. 
          Return JSON with title, instructions, and sections (each with title, optional subInstructions, and questions with text and optional options).` }
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
                    },
                    required: ["text", "type"]
                  }
                }
              },
              required: ["title", "questions"]
            }
          }
        },
        required: ["title", "instructions", "sections"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// Fix: Added missing export for KnowledgeBase.tsx
export const askQuestion = async (question: string, language: Language) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { text: `Explain this to a student in ${language}: ${question}. 
      Return JSON with intro, ingredients (name/desc), example (title/scenario/logic/summary), usage, and funFact.` },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intro: { type: Type.STRING },
          ingredients: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { name: { type: Type.STRING }, desc: { type: Type.STRING } },
              required: ["name", "desc"]
            } 
          },
          example: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              scenario: { type: Type.STRING },
              logic: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING }
            },
            required: ["title", "scenario", "logic", "summary"]
          },
          usage: { type: Type.STRING },
          funFact: { type: Type.STRING }
        },
        required: ["intro", "ingredients", "example", "usage", "funFact"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// Fix: Added missing export for VisualAids.tsx
export const generateVisualAid = async (topic: string, isColor: boolean) => {
  const ai = getAIClient();
  const prompt = isColor 
    ? `A high-quality, professional educational illustration of ${topic}. Detailed and pedagogical.` 
    : `A clean white-on-black chalk-style line art diagram of ${topic} for a blackboard. Accurate labels.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  let imageUrl = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
  }

  const tipsRes = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { text: `Provide 3 short pedagogical tips for teaching "${topic}" using a visual aid.` }
  });

  return { imageUrl, tips: tipsRes.text || "" };
};

export const generateSlideDeck = async (
  topic: string, 
  fileContext: { base64: string, mimeType: string } | null, 
  language: Language,
  numSlides: number = 6
): Promise<SlideDeck> => {
  const ai = getAIClient();
  const contents: any[] = [];
  if (fileContext) contents.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } });
  
  contents.push({ text: `Create an interactive, professional Slide Deck (PPT) for the topic "${topic}" in ${language}.
    ${fileContext ? "STRICTLY use only information from the provided material." : ""}
    Return exactly ${numSlides} slides in JSON format.
    
    Structure:
    - title: Main deck title
    - template: "modern", "academic", or "creative"
    - slides: Array of objects with { title: string, content: string[], visualPrompt: string }
    
    The content should be clear, concise bullet points suitable for a presentation.` 
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: contents },
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
              },
              required: ["title", "content", "visualPrompt"]
            }
          }
        },
        required: ["title", "template", "slides"]
      }
    }
  });

  const deck = JSON.parse(response.text || "{}") as SlideDeck;
  const slidesWithImages = await Promise.all(deck.slides.map(async (slide) => {
    try {
      const imgRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Educational presentation slide illustration: ${slide.visualPrompt}. Style: Professional, clean, and pedagogical.` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      let imageUrl = "";
      for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }
      return { ...slide, imageUrl };
    } catch (e) { 
      return slide; 
    }
  }));
  return { ...deck, slides: slidesWithImages };
};

export const generateSyllabusPlan = async (
  duration: number,
  durationType: 'Days' | 'Weeks' | 'Months',
  grade: GradeLevel,
  language: Language,
  fileContext: { base64: string, mimeType: string }
): Promise<SyllabusPlan> => {
  const ai = getAIClient();
  const prompt = `Act as a senior curriculum strategist. Analyze the uploaded syllabus/textbook content and create a professional coverage plan.
  Target Audience: Grade ${grade}
  Language: ${language}
  Total Duration: ${duration} ${durationType}
  
  Return in JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } },
        { text: prompt }
      ]
    },
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
              },
              required: ["period", "topic", "objective", "activity"]
            }
          },
          finalAssessment: { type: Type.STRING }
        },
        required: ["title", "timeframe", "sessions", "finalAssessment"]
      }
    }
  });
  return JSON.parse(response.text || "{}") as SyllabusPlan;
};

export const generateQuestionPaper = async (
  fileContext: { base64: string, mimeType: string }, 
  grade: GradeLevel, 
  language: Language, 
  settings: QuestionSettings
): Promise<QuestionPaper> => {
  const ai = getAIClient();
  
  const blueprintDesc = settings.sections.map(s => {
    let typeDesc = "";
    let sectionMarksTotal = 0;
    if (s.type === 'either-or') {
      sectionMarksTotal = (s.count / 2) * s.marksPerQuestion;
      typeDesc = `Either/Or Section: Generate EXACTLY ${s.count/2} pairs of questions (Total ${s.count} questions). For each pair, provide two distinct questions based on the content where the student will choose to answer only one (labeled as A or B). Each pair choice is worth ${s.marksPerQuestion} marks.`;
    } else if (s.type === 'choice' && s.choiceCount) {
      sectionMarksTotal = s.choiceCount * s.marksPerQuestion;
      typeDesc = `Choice Section: Provide ${s.count} questions, out of which student must answer any ${s.choiceCount}. Each worth ${s.marksPerQuestion} marks.`;
    } else {
      sectionMarksTotal = s.count * s.marksPerQuestion;
      typeDesc = `Compulsory Section: Student must answer all ${s.count} questions. Each worth ${s.marksPerQuestion} marks.`;
    }
    
    return `- Section ID ${s.id}: ${typeDesc} (Total weight: ${sectionMarksTotal})`;
  }).join('\n');

  const prompt = `Act as an expert Board Examiner. Create a Grade ${grade} Question Paper strictly in ${language}.
  Use the provided material as the source for questions.
  
  CONSTRAINTS:
  1. Total Exam Marks MUST BE EXACTLY: ${settings.totalMarks}
  2. Duration: ${settings.duration}
  3. Difficulty: ${settings.difficulty}
  
  STRUCTURE:
  ${blueprintDesc}
  
  IMPORTANT INSTRUCTIONS FOR "EITHER/OR" TYPE:
  - For sections of type 'either-or', you MUST provide questions in pairs.
  - Question 1A and 1B should cover similar levels of difficulty or related sub-topics.
  - Question 2A and 2B should be distinct from the first pair.
  - Ensure the questions strictly follow the 'marksPerQuestion' rule for that section.
  
  Return a JSON object with:
  - title (string)
  - instructions (string)
  - totalMarks (number)
  - duration (string)
  - sections (array of objects):
    - id (unique string matching provided IDs)
    - title (string)
    - instructions (string)
    - type (string)
    - marksPerQuestion (number)
    - totalSectionMarks (number)
    - questions (array of objects):
      - id (unique string)
      - text (string)
      - marks (number)
      - options (optional array of strings for multiple choice)`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } },
        { text: prompt }
      ]
    },
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
                      options: { type: Type.ARRAY, items: { type: Type.STRING } }
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

  return JSON.parse(response.text || "{}") as QuestionPaper;
};

export const generateLessonPlan = async (topics: string[], grade: GradeLevel, language: Language, fileContext?: { base64: string, mimeType: string }): Promise<LessonPlan> => {
  const ai = getAIClient();
  const contents: any[] = [];
  if (fileContext) contents.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } });
  contents.push({ text: `Generate a Grade ${grade} Lesson Plan for: ${topics.join(', ')} in ${language}. JSON format.` });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: contents },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}") as LessonPlan;
};

export const askChatQuestion = async (question: string, fileContext: { base64: string, mimeType: string } | null, language: Language) => {
  const ai = getAIClient();
  const contents: any[] = [];
  if (fileContext) contents.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } });
  contents.push({ text: `Answer in ${language}: ${question}.` });
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: contents } });
  return response.text || "";
};

export const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

export async function decodePCMToAudioBuffer(data: Uint8Array, ctx: AudioContext, sampleRate = 24000, numChannels = 1) {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(numChannels, dataInt16.length / numChannels, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const getDemonstrationAudio = async (text: string, language: Language) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: { parts: [{ text: `Teacher voice: ${text}` }] },
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const assessReading = async (base64Audio: string, expectedText: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ inlineData: { data: base64Audio, mimeType: 'audio/webm' } }, { text: `Assess reading of: "${expectedText}". JSON.` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          accuracyScore: { type: Type.NUMBER },
          fluencyScore: { type: Type.NUMBER },
          mispronouncedWords: { type: Type.ARRAY, items: { type: Type.STRING } },
          positiveFeedback: { type: Type.STRING },
          improvementTips: { type: Type.STRING },
          transcription: { type: Type.STRING }
        },
        required: ["accuracyScore", "fluencyScore", "mispronouncedWords", "positiveFeedback", "improvementTips", "transcription"]
      }
    }
  });
  return JSON.parse(response.text || "{}") as ReadingAssessmentResult;
};
