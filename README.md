# Partner AI 🚀

## Overview

Partner AI is a **human-like conversational AI companion** that goes beyond basic chatbots by combining memory, personality, and real-time interaction.

It doesn’t just reply — it **remembers, adapts, and evolves** based on conversations.

---

## ✨ Key Features

### 🧠 Smart Memory System

* **Short-term memory (Redis):** remembers recent chats instantly
* **Long-term memory (Vector DB):** stores past interactions using embeddings
* Automatically recalls and **reminds you about past conversations**
* To be production grade it decides whether to search or not 

### 💬 Human-like Conversations

* Starts conversations proactively
* Asks about you to build context over time
* Avoids robotic responses using personality + memory
* Remembers about itself too to keep realism

### ❤️ Personality Engine

* AI has:

  * Traits
  * Interests
  * Experiences
* You can **customize AI personality** by adding your own ai models with:

  * Likes/dislikes
  * Experiences
* Closeness system changes tone over time
* AI ignores too based on personality traits

### ⚡ Real-Time Interaction

* Built with **Socket.IO**
* Features:

  * Live messaging
  * Typing indicators
  * Notifications

### 🤖 Recommendation Engine

* Suggests things based on:

  * Past conversations
  * User preferences
  * Stored memories

### 🔄 Async + Scalable Backend

* Queue-based architecture using BullMQ
* Workers handle:

  * Message processing
  * Memory extraction
  * Embeddings generation

---

## 🛠 Tech Stack

### Backend

* Node.js
* Express
* Redis (Upstash)
* BullMQ

### AI / ML

* Embeddings
* Pinecone (Vector DB)
* RAG (Retrieval-Augmented Generation)

### Frontend (Web)

* React / Next.js
* Socket.IO (real-time updates)

### Infrastructure

* Render
* Queue Workers
* Async Processing Pipelines

---

## 🧩 Architecture Overview

### Flow

1. User sends message 💬
2. Message goes to queue 📥
3. Worker processes it:

   * Fetch short-term memory
   * Retrieve long-term memory (vector search)
   * Generate response
4. Response returned ⚡
5. Background jobs:

   * Extract memory
   * Store embeddings
   * Schedule a conversation starter for later

### Queues

* Message Queue
* Memory Queue

---

## 🌐 Frontend Features (Web)

* Real-time chat UI
* Typing indicators ⌨️
* Notifications 🔔
* Live updates via sockets
* Personality customization UI


---

## 📊 Current Status

* ✅ Backend: Complete
* ✅ Workers: Functional
* ✅ Memory System: Working
* ✅ Web Frontend: Complete

---

## ⚠️ Limitations

* Free-tier infra constraints (cold starts, rate limits)
* Is quite expensive if using paid models

---

## 🔮 Future Improvements

* Smarter memory filtering
* Better personality evolution
* Cost optimization (Redis + vector DB + Lesser AI calls)
* Clean the codebase
* Move to more stable infra (AWS or equivalent)

---

## ⚙️ Setup

### Prerequisites

* Node.js
* Redis (Upstash recommended)
* Pinecone account

### Installation

```
git clone <repo>
cd backend
npm install
```

### Environment Variables

```
REDIS_URL= (for pub sub)
PINECONE_API_KEY=
OPENAI_API_KEY=
EMBEDDINGS_WORKER_LINK=
UPSTASH_REDIS_URL=
MONGODB_URI=
JWT_SECRET=
Your open ai keys and email id for brevo
```

### Run

```
cd backend
npm run dev

cd ..
cd frontend
npm run dev
```

---

## 🎯 Why This Project?

This isn’t just a chatbot.

It’s an attempt to build a **memory-driven AI system** that behaves more like a human than a tool:

* Remembers you
* Learns about you
* Talks like it knows you

---

## 👨‍💻 Author

Built by Raj

---

## 📄 License

MIT
