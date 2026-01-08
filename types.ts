
export enum GradeLevel {
  G1 = 'Grade 1',
  G2 = 'Grade 2',
  G3 = 'Grade 3',
  G4 = 'Grade 4',
  G5 = 'Grade 5',
  G6 = 'Grade 6',
  G7 = 'Grade 7',
  G8 = 'Grade 8',
  G9 = 'Grade 9',
  G10 = 'Grade 10',
  G11 = 'Grade 11',
  G12 = 'Grade 12',
}

export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  BENGALI = 'Bengali',
  TELUGU = 'Telugu',
  MARATHI = 'Marathi',
  TAMIL = 'Tamil',
  GUJARATI = 'Gujarati',
  KANNADA = 'Kannada',
}

export interface TeacherContext {
  grade: GradeLevel;
  language: Language;
}

export type QuestionType = 'compulsory' | 'any-x-among-y' | 'either-or';
export type OneMarkVariety = 'MCQ' | 'Fill in the blanks' | 'True or False' | 'Statement/Reason' | 'Default';

export interface SectionBlueprint {
  id: string;
  marksPerQuestion: number;
  count: number;
  type: QuestionType;
  choiceCount?: number; 
  oneMarkVariety?: OneMarkVariety;
}

export interface QuestionSettings {
  totalMarks: number;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sections: SectionBlueprint[];
}

export interface Slide {
  title: string;
  content: string[];
  visualPrompt: string;
  imageUrl?: string;
}

export interface SlideDeck {
  title: string;
  template: 'modern' | 'academic' | 'creative';
  slides: Slide[];
}

export interface Question {
  id: string;
  text: string;
  marks: number;
  options?: string[];
  variety?: OneMarkVariety;
  alternativeText?: string;
  alternativeOptions?: string[];
}

export interface Section {
  id: string;
  title: string;
  instructions: string;
  type: QuestionType;
  questions: Question[];
  marksPerQuestion: number;
  totalSectionMarks: number;
  choiceText?: string; 
}

export interface QuestionPaper {
  title: string;
  instructions: string;
  totalMarks: number;
  duration: string;
  sections: Section[];
}

export interface SyllabusPlan {
  title: string;
  timeframe: string;
  sessions: {
    period: string;
    topic: string;
    objective: string;
    activity: string;
  }[];
  finalAssessment: string;
}

export interface LessonPlan {
  title: string;
  objectives: string[];
  activities: {
    grade: string;
    description: string;
  }[];
  assessment: string;
}

export interface ReadingAssessmentResult {
  accuracyScore: number;
  fluencyScore: number;
  mispronouncedWords: string[];
  positiveFeedback: string;
  improvementTips: string;
  transcription: string;
}

/* Added CourseOutcome for OBE Manager */
export interface CourseOutcome {
  id: string;
  code: string;
  description: string;
  targetWeightage: number;
}

/* Added ProgramOutcome for OBE Manager */
export interface ProgramOutcome {
  id: string;
  code: string;
  description: string;
}

/* Added CO_PO_Mapping for OBE Manager */
export interface CO_PO_Mapping {
  coId: string;
  poId: string;
  strength: 0 | 1 | 2 | 3;
}

export const GRADE_TEXTS: Record<string, Partial<Record<Language, string>>> = {
  'Grade 1': { [Language.ENGLISH]: "The sun is hot.", [Language.HINDI]: "सूरज गर्म है।" },
  'Grade 10': { [Language.ENGLISH]: "Quantum physics is interesting.", [Language.HINDI]: "குவாண்டம் பௌதிகம் மிகவும் சுவாரஸ்யமானது." },
};