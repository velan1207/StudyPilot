# StudyPilot – Just-in-Time AI Classroom Assistant

## Overview

**StudyPilot** is an AI-powered classroom assistant designed to support teachers in multi-grade, low-resource public schools in India. The platform provides **real-time, personalized pedagogical and classroom management support** at the exact moment teachers face challenges during instruction. Instead of relying on periodic, generic training or infrequent mentor visits, Sahayak enables **just-in-time coaching**, helping teachers confidently implement innovative teaching practices inside real classrooms.

---

## Problem Statement

Teachers in government schools often manage:
- Multi-grade classrooms with diverse learning levels  
- High student-to-teacher ratios  
- Limited teaching-learning materials  
- Infrequent and delayed academic support from mentors (CRP/BRP/ARP)

When teachers encounter live classroom challenges—such as student disengagement, conceptual blocks, or activity breakdowns—there is **no immediate support mechanism**. As a result, teachers often abandon innovative practices and revert to rote instruction, impacting student learning outcomes and increasing teacher burnout.

---

## Solution

Sahayak acts as a **personal AI teaching assistant** that teachers can access anytime using voice, text, or images. It delivers **context-aware, localized, and actionable guidance** aligned to the teacher’s immediate classroom situation.

Key capabilities include:
- Instant pedagogical suggestions for live classroom challenges  
- Local-language explanations using simple analogies  
- Differentiated worksheets generated from textbook images  
- Blackboard-friendly visual aids (diagrams, charts, step-by-step drawings)  
- Voice-based interactions for low-literacy and low-connectivity contexts  

---

## Key Features

- **Just-in-Time Coaching:** Immediate, situation-specific guidance during class  
- **Multilingual Support:** Responses in local Indian languages  
- **Multimodal Input:** Text, voice, and textbook image uploads  
- **Differentiated Learning:** Grade-wise worksheets from a single source  
- **Offline-First Design:** Works in low or intermittent network conditions  
- **Teacher-Centric UX:** Minimal typing, voice-first interactions  

---

## Google AI Technologies Used

- **Google Gemini** – Multimodal content generation and contextual reasoning    
- **Vertex AI Vision** – Understanding textbook images and visual inputs  
- **Firebase** – Authentication, database, hosting, and offline-first support  
- **Firebase Studio** – Rapid prototyping and deployment for hackathon use  

---

## Architecture Overview

Teacher (Mobile/Web Interface)
↓
Firebase (Auth, Firestore, Hosting, Offline Cache)
↓
Google Gemini (Text + Image Reasoning)
↓
↓
Personalized, Local-Language Classroom Support


---

## Target Users

- Government Primary & Secondary School Teachers  
- Cluster Resource Persons (CRPs)  
- Block & Academic Resource Persons (BRPs/ARPs)  
- DIET & SCERT faculty (secondary system-level insights)

---

## Impact

- Reduces **query-to-resolution time** from weeks to minutes  
- Increases sustained use of **innovative teaching practices**  
- Improves teacher confidence and classroom engagement  
- Creates data-driven insights for system-level academic support  

---

## Alignment with NEP 2020

- Supports **Foundational Literacy and Numeracy (FLN)**  
- Enables **continuous professional development**  
- Promotes **teacher autonomy and contextualized pedagogy**  
- Encourages technology-enabled, need-based training  

---

## Getting Started (Prototype)

1. Clone the repository  
2. Set up Firebase project and enable Authentication & Firestore  
3. Configure Google Cloud project with Gemini and Vertex AI access  
4. Deploy using Firebase Hosting / Firebase Studio  
5. Access the app via web or mobile browser  

---

## Future Enhancements

- AI-powered weekly lesson planners  
- Real-time analytics dashboards for DIET/SCERT  
- Student learning progress insights  
- Parent communication support  
- Expanded offline capabilities  

---

## License

This project is developed as part of a hackathon and is intended for educational and demonstration purposes.

---

## Team

Built with a strong focus on **teacher empathy**, **system awareness**, and **scalable impact** in public education.

---

### Steps to run this project

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
