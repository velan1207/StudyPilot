
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

export const generateSyllabusPlan = async (duration: number, durationType: 'Days' | 'Weeks' | 'Months', grade: GradeLevel, language: Language, fileContext: { base64: string, mimeType: string }): Promise<SyllabusPlan> => {
  const ai = getAIClient();
  
  const prompt = `FAST GENERATION MODE: Based on the syllabus, create a high-impact roadmap for ${grade} in ${language} for ${duration} ${durationType}. 
  Provide exactly 5-8 key sessions that cover the most critical parts of the content.
  Keep descriptions brief and actionable. Return valid JSON.`;

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
              }
            }
          }
        },
        required: ["title", "timeframe", "sessions"]
      }
    }
  });
  return safeParseJSON<SyllabusPlan>(response.text || "{}", { title: "", timeframe: "", sessions: [], finalAssessment: "" });
};

// Fix: This is the primary implementation of getHelpAdvice using structured JSON output.
export const getHelpAdvice = async (issue: string, grade: string, language: string) => {
  const ai = getAIClient();
  const prompt = `Act as a master classroom management coach. Provide advice for a teacher dealing with: "${issue}" in ${grade}. 
  Language: ${language}.
  IMPORTANT: Do not use markdown symbols like #, *, or ---.
  Return strictly valid JSON.`;

  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A one sentence empathetic summary of the root cause." },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Short catchy title (e.g. Immediate Fix)" },
                description: { type: Type.STRING, description: "The core advice. Use plain text only." },
                actionStep: { type: Type.STRING, description: "One specific actionable sentence." }
              }
            }
          },
          teacherTip: { type: Type.STRING, description: "A final encouraging professional tip." }
        },
        required: ["summary", "sections", "teacherTip"]
      }
    }
  });
  return safeParseJSON(response.text || "{}", null);
};

export const generateQuestionPaper = async (
  syllabusFile: { base64: string, mimeType: string } | null, 
  formatFile: { base64: string, mimeType: string } | null,
  grade: GradeLevel, 
  language: Language, 
  settings: QuestionSettings,
  specificTopic?: string,
  useContextFormat?: boolean
): Promise<QuestionPaper> => {
  const ai = getAIClient();
  
  let structureInstruction = "";
  
  if (useContextFormat && formatFile) {
    structureInstruction = `
    STRICT STRUCTURAL TEMPLATE:
    1. Analyze the file provided as the "FORMAT SOURCE" (Previous Year Paper/Sample).
    2. Mirror its EXACT layout: section names, marks distribution, choices (internal or external), and question types (MCQ, short, long).
    3. DO NOT use the content (questions) from the FORMAT SOURCE.
    4. Generate ENTIRELY NEW questions based on the "CONTENT SOURCE" or Topic.
    `;
  } else {
    const blueprintDescription = settings.sections.map((s, idx) => {
      const questionsToAnswer = s.type === 'any-x-among-y' ? (s.choiceCount || s.count) : s.count;
      const sectionExpectedScore = questionsToAnswer * s.marksPerQuestion;

      let detail = `SECTION ${idx + 1}:
      - TITLE: Use a standard academic title (e.g. "Section A")
      - QUESTION TYPE: ${s.type.toUpperCase()}
      - MARKS PER QUESTION: ${s.marksPerQuestion}
      - TOTAL QUESTIONS YOU MUST GENERATE: ${s.count}
      - STUDENT MUST CHOOSE AND ANSWER: ${questionsToAnswer}
      - CALCULATED TOTAL FOR THIS SECTION (totalSectionMarks): ${sectionExpectedScore}`;
      
      if (s.type === 'either-or') {
        detail += ` \n- FORMAT: INTERNAL CHOICE. For each of the ${s.count} items, you MUST provide "text" (Choice A) AND "alternativeText" (Choice B).`;
      }

      if (s.type === 'any-x-among-y') {
        detail += ` \n- INSTRUCTION: "Answer any ${questionsToAnswer} out of the ${s.count} following questions."`;
      }

      if (s.marksPerQuestion === 1 && s.oneMarkVariety) {
        detail += ` \n- VARIETY: Only use ${s.oneMarkVariety} for this section.`;
      }

      return detail;
    }).join('\n\n');

    structureInstruction = `
    STRICT PAPER CONSTRAINTS:
    1. TOTAL MARKS (Sum of all section answerable marks) MUST BE EXACTLY: ${settings.totalMarks}
    2. DURATION (As text) MUST BE EXACTLY: "${settings.duration}"
    3. DIFFICULTY LEVEL: ${settings.difficulty}
    
    EXAM STRUCTURE (BLUEPRINT):
    ${blueprintDescription}
    `;
  }

  const topicConstraint = specificTopic ? `STRICTLY FOCUS CONTENT ON: "${specificTopic}".` : `Base the content on the uploaded content context.`;

  const prompt = `Act as an expert Academic Examiner for Grade ${grade} in ${language}. Generate a professional Question Paper.

  ${structureInstruction}

  ${topicConstraint}

  JSON OUTPUT RULES:
  - Return strictly valid JSON.
  - No "coId" or "bloomLevel" fields.
  - The sum of totalSectionMarks must match the intended paper total.`;

  const parts: any[] = [];
  
  if (syllabusFile) {
    parts.push({ text: "CONTENT SOURCE (Syllabus/Notes): Use this for question content." });
    parts.push({ inlineData: { data: syllabusFile.base64, mimeType: syllabusFile.mimeType } });
  }

  if (formatFile && useContextFormat) {
    parts.push({ text: "FORMAT SOURCE (Template Paper): Use this for structure/layout ONLY." });
    parts.push({ inlineData: { data: formatFile.base64, mimeType: formatFile.mimeType } });
  }

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: { parts },
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

export const generateLocalContent = async (topic: string, grade: GradeLevel, language: Language): Promise<any> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create structured educational content for Grade ${grade} in ${language} about "${topic}". Include local references relevant to students in this region.`,
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
        },
        required: ["title", "intro", "keyIngredients", "example", "realWorldUsage", "funFact"]
      }
    }
  });
  return safeParseJSON(response.text || "{}", null);
};

export const analyzeTextbookImage = async (base64: string, grade: GradeLevel, language: Language): Promise<any> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: 'image/jpeg' } },
        { text: `Analyze this textbook page and create a clean, structured worksheet for Grade ${grade} in ${language}. Ensure the questions are pedagogically sound and match the identified concepts.` }
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
  return safeParseJSON(response.text || "{}", null);
};

export const askQuestion = async (question: string, language: Language): Promise<any> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explain "${question}" in ${language} for students using simple analogies and a structured format.`,
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
              properties: {
                name: { type: Type.STRING },
                desc: { type: Type.STRING }
              }
            }
          },
          example: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              scenario: { type: Type.STRING },
              logic: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING }
            }
          },
          usage: { type: Type.STRING },
          funFact: { type: Type.STRING }
        }
      }
    }
  });
  return safeParseJSON(response.text || "{}", null);
};

export const generateVisualAid = async (topic: string, isColor: boolean): Promise<{ imageUrl: string, tips: string }> => {
  const ai = getAIClient();
  const style = isColor ? "colorful illustration" : "blackboard style line art";
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `Create an accurate educational diagram of "${topic}" in ${style}. Also provide a short paragraph of teaching tips on how to use this visual aid in a classroom.` }
      ]
    }
  });

  let imageUrl = '';
  let tips = '';

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    } else if (part.text) {
      tips += part.text;
    }
  }

  return { imageUrl, tips };
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
    contents: { parts },
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

const generateSlideImage = async (prompt: string): Promise<string> => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional, educational illustration for a presentation slide showing: ${prompt}. No text in image.` }]
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (err: any) {
    console.warn("Slide image generation failed:", err.message);
  }
  return "";
};

export const generateSlideDeck = async (topic: string, fileContext: { base64: string, mimeType: string } | null, language: Language, numSlides: number = 6): Promise<SlideDeck> => {
  const ai = getAIClient();
  const parts: any[] = [];
  if (fileContext) parts.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } });
  
  const prompt = `Act as an expert Educational Designer. Create a professional Slide Deck in ${language} about "${topic}". 
  CONSTRAINTS:
  - Generate EXACTLY ${numSlides} slides.
  - Slide 1: Title Slide.
  - Slide ${numSlides}: Conclusion.
  - Each slide: 1 title, 3 bullet points.
  - visualPrompt: Detailed prompt for an image generator (NO TEXT IN IMAGE).
  - Return strictly valid JSON.`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          template: { type: Type.STRING, enum: ["modern", "academic", "creative"] },
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
  
  const result = safeParseJSON<SlideDeck>(response.text || "{}", { title: topic, template: "modern", slides: [] });
  
  if (!result.slides || result.slides.length === 0) {
    throw new Error("Generation failed: No content produced.");
  }

  const imageRequests = result.slides.map(async (slide, index) => {
    if (slide.visualPrompt) {
      await new Promise(r => setTimeout(r, index * 500));
      slide.imageUrl = await generateSlideImage(slide.visualPrompt);
    }
    return slide;
  });

  await Promise.all(imageRequests);

  return result;
};

export const askChatQuestion = async (question: string, fileContext: { base64: string, mimeType: string } | null, language: Language) => {
  const ai = getAIClient();
  const parts: any[] = [];
  if (fileContext) parts.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } });
  
  const systemInstruction = `You are a professional educational assistant. Respond in ${language}. Avoid complex LaTeX symbols. Use standard bolding (**Text**) for emphasis and ### for section headers. Use simple bullet points (* Item) for lists.`;

  parts.push({ text: `Question: ${question}` });
  
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: { parts },
    config: { systemInstruction }
  });
  return response.text || "";
};

export const getDemonstrationAudio = async (text: string, language: Language) => { 
  const ai = getAIClient(); 
  const res = await ai.models.generateContent({ 
    model: "gemini-2.5-flash-preview-tts", 
    contents: [{ parts: [{ text }] }], 
    config: { responseModalalities: [Modality.AUDIO] } 
  }); 
  return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data; 
};

export async function assessReading(base64: string, text: string) { 
  const ai = getAIClient(); 
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: 'audio/webm' } }, 
        { text: `Assess this reading audio against the target text: "${text}". Provide accuracy and fluency scores.` }
      ]
    },
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
        }
      }
    } 
  }); 
  return safeParseJSON<ReadingAssessmentResult>(res.text || "{}", { accuracyScore: 0, fluencyScore: 0, mispronouncedWords: [], positiveFeedback: "", improvementTips: "", transcription: "" }); 
};

export const generateLessonPlan = async (topics: string[], grade: GradeLevel, language: Language, fileContext?: { base64: string, mimeType: string }): Promise<LessonPlan> => { 
  const ai = getAIClient(); 
  const parts: any[] = []; 
  if (fileContext) parts.push({ inlineData: { data: fileContext.base64, mimeType: fileContext.mimeType } }); 
  parts.push({ text: `Create a lesson plan for: ${topics.join(', ')} for Grade ${grade} in ${language}.` }); 
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: { parts }, 
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                grade: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          assessment: { type: Type.STRING }
        }
      }
    } 
  }); 
  return safeParseJSON<LessonPlan>(res.text || "{}", { title: "", objectives: [], activities: [], assessment: "" }); 
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
