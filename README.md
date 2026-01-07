# StudyPilot

# TechSprint Hackathon Problem Statement  
## Just-in-Time Coaching for Teachers

---

## Background: A Teacher’s Lived Reality

Sunita, a Primary Teacher at a rural school in Jharkhand, stands before a Class 4 classroom where students are at four different learning levels. Today, she is attempting a new *group-based subtraction* activity she learned in a state workshop three months ago.

Midway through the lesson, the class descends into chaos. Advanced students finish early and become disruptive, while the struggling group is stuck on a conceptual block involving **zero in the tens place**.

Sunita feels a familiar surge of *implementation anxiety*. She urgently needs:
- A classroom management strategy to regain control
- A pedagogical “hook” to explain the math concept effectively

Her Cluster Resource Person (CRP) had visited two weeks ago but stayed only 20 minutes due to workload constraints. The feedback left in the logbook was generic:

> “Ensure all students are engaged and use more Teaching Learning Materials from surrounding objects.”

No specific, actionable ideas were discussed.

The next visit is at least three weeks away. With no nearby peer support and mounting pressure from upcoming terminal assessments, Sunita abandons the activity. She reverts to writing the borrowing algorithm on the board and asks students to copy it.

The spark of innovation fades—replaced by rote instruction and growing professional burnout.

This is not an isolated incident.

Teachers across the country face similar challenges due to the **absence of timely, context-aware coaching support**.

---

## The Existing Gap

Large-scale teacher training programs focus heavily on theory but fail to address the **implementation gap** of real classrooms.

Teachers are expected to:
- Implement Foundational Literacy and Numeracy (FLN)
- Manage high student-teacher ratios
- Handle multi-grade classrooms
- Respond to diverse learning needs and behaviors

However:
- In-service trainings last only 5–15 days
- Classroom realities are highly contextual and recurring
- Teachers often revert to traditional methods for control

---

## Limitations of the Current Support Architecture

The existing academic support system (CRPs, ARPs, BRPs) is constrained by its **periodic nature**.

### Key Deficiencies

**1. Lag Time Problem**  
Teachers facing immediate challenges must wait weeks for support. By the time help arrives, the moment of need has passed.

**2. Generic Feedback**  
Due to workload and limited observation time (10–30 minutes), feedback is often non-specific and non-actionable.

**3. Lack of Just-in-Time Support**  
Delayed feedback is retrospective, not proactive. Teachers need support *during* the act of teaching.

---

## Need for Personalized, Need-Based Coaching

Effective teacher coaching works best when it is:
- Context-specific
- Teacher-driven
- Responsive to real classroom challenges

Every classroom is unique. A one-size-fits-all solution does not work—especially in rural or multi-grade settings.

Teachers should be treated as skilled professionals. Coaching must shift from pointing out “gaps” to **collaboratively solving the teacher’s most pressing problems**.

---

## The Need for a Technology-Based Solution

To make high-quality coaching accessible at scale, a technology solution is required that offers **real-time, personalized support** without physical presence.

### The Solution Must Provide:

- **Immediate, Personalized Advice**  
  Teachers can ask situation-specific questions and receive actionable guidance instantly.

- **Continuous, Flexible Feedback**  
  Instead of monthly visits, teachers can receive support within hours.

- **Offline / Low-Bandwidth First Design**  
  Voice-based, multilingual, and mobile-friendly for remote areas.

- **Relevant, Micro-Learning Content**  
  Small, actionable learning units matched to the teacher’s grade level and current challenge.

This effectively creates a **personal Teaching Assistant** for every teacher.

---

## Summary Table

| Component | Details |
|--------|--------|
| **Problem Statement** | Teachers in the public education system lack a just-in-time coaching mechanism to address immediate classroom challenges, due to reliance on infrequent, physical mentor visits that provide generic feedback. |
| **Use Case** | A teacher facing a classroom management or conceptual challenge needs immediate, personalized guidance rather than waiting weeks for a mentor visit. |
| **Target Audience** | Government School Teachers (Primary & Secondary), CRPs, ARPs, BRPs |
| **Suggestive Approaches** | AI-powered classroom assistants, on-demand micro-learning modules, asynchronous digital coaching loops |
| **Key Success Metrics** | Reduced query-to-resolution time, frequency of coaching interactions, successful implementation of personalized strategies |

---

### Steps to run this project

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
