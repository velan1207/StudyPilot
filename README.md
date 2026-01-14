# StudyPilot 🚀  
### AI-Powered Teaching Assistant for Multi-Grade Classrooms

StudyPilot is an AI-powered teaching assistant designed to support teachers in government and under-resourced schools. It provides real-time classroom guidance, grade-wise content generation, and scheduling support to help teachers manage multi-grade classrooms effectively.

---

## 📌 Problem Statement

Teachers in under-resourced schools often manage multiple grades in a single classroom. While periodic training programs exist, teachers lack real-time, personalized support when classroom activities fail or students face conceptual confusion. Support from CRPs and ARPs is infrequent and usually generic, forcing teachers to revert to rote teaching methods. This gap between training and classroom implementation reduces student engagement, limits innovation, and increases teacher burnout.

---

## 🎯 Objective

To provide teachers with a real-time, AI-powered teaching assistant that supports both instructional preparation and classroom management during live classroom situations.

---

## 💡 Solution Overview

StudyPilot acts as a **co-teacher**, offering instant, practical support without replacing the teacher’s authority. It enables teachers to generate academic content, manage schedules, and receive classroom management guidance using a simple web interface.

---
## 🎥 Demo Video

▶️ **Watch the 3-minute demo here:**  
https://docs.google.com/videos/d/1hdyhX9cCn1TlxuVFb0JAFEUEkhk4pu6qKKkdwYoUmJA/edit?usp=sharing

The video demonstrates:
- Teacher dashboard and grade-wise workspace
- AI-powered content generation
- Daily & weekly scheduling
- Help Mode for real-time classroom support

---

## ✨ Key Features

- **Grade-wise Workspace** – Separate workspace for each grade
- **AI Content Generation**
  - Lesson Plans
  - Question Papers
  - PPT / Slide Content
  - Concept Explanations
- **Help Mode**
  - Real-time classroom management guidance
  - Student interaction and engagement strategies
- **Multilingual Support**
  - English, Tamil, Hindi, Marathi
- **Scheduling**
  - Daily and Weekly class schedules
- **Offline-Friendly Usage**
  - Save AI-generated content
  - Print and reuse in low-internet environments
- **Vault**
  - Store and manage generated resources securely

---

## 🧠 Methodology

StudyPilot uses a **mode-based AI approach**:
- **Content Mode** – Academic content generation
- **Help Mode** – Classroom behavior and interaction support

This separation ensures context-aware and actionable AI responses instead of generic outputs.

---

## 🏗️ Technology Stack

### Google Technologies
- **Google Gemini (via Google AI Studio)** – AI intelligence and multilingual responses
- **Firebase Authentication** – Email & password authentication
- **Cloud Firestore** – Storage for schedules, chats, and saved content
- **Google Cloud Infrastructure** – Underlying platform

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Vite

---

## 📂 Architecture Overview

Teacher → StudyPilot Web App → Mode-Based AI Layer → Google Gemini → Firebase / Google Cloud

---

## 🎓 Target Users

- Primary and secondary school teachers
- Multi-grade classrooms
- Under-resourced and low-connectivity schools

---

## 🚀 Future Enhancements

- Student dashboard
- Voice-based classroom support
- Offline-first sync
- Analytics for teacher insights
- Expanded regional language support

---

## 🏆 Hackathon Relevance

StudyPilot addresses a real-world education challenge by providing **just-in-time teacher support**, reducing classroom stress, and enabling innovation in low-resource environments using Google’s AI ecosystem.

---

## 📄 License

This project is developed as a hackathon prototype for educational and demonstration purposes.


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
