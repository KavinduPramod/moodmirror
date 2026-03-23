# MoodMirror

**Mental Health Risk Classification System**

A full-stack application that analyses anonymised Reddit user behaviour to automatically classify individuals into mental health risk levels. Combines BERT-based text understanding with behavioural signals in a hybrid deep learning model.

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.128+-green.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)

---

## Overview

MoodMirror is a research-backed mental health risk assessment platform that leverages natural language processing and behavioural analysis to identify potential mental health concerns from Reddit activity patterns.

### Key Features

- **Hybrid Deep Learning Model**: BERT + BiLSTM architecture combining semantic text understanding with sequential pattern recognition
- **Behavioural Signal Analysis**: Analyses posting patterns, sentiment trends, activity timing, and community engagement
- **Privacy-Focused**: Uses OAuth 2.0 authentication - users voluntarily connect their own Reddit accounts
- **Real-Time Assessment**: Instant risk classification with confidence scores and interpretable results
- **Clinical Validation**: Dataset validated by clinical expert using inter-rater reliability metrics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│                   React + TypeScript + Vite                      │
│              (Dashboard, OAuth Flow, Results View)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                  │
│                    FastAPI + SQLModel                            │
│            (REST API, Authentication, Data Processing)           │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │  MariaDB │    │  Redis   │    │ ML Model │
       │ (Users)  │    │ (Cache)  │    │ (BERT +  │
       │          │    │          │    │ BiLSTM)  │
       └──────────┘    └──────────┘    └──────────┘
```

---

## ML Model

### Architecture: BERT + BiLSTM

The hybrid model combines:

1. **BERT Encoder** (`bert-base-uncased`): Captures semantic meaning and contextual relationships in text
2. **Bidirectional LSTM**: Learns sequential patterns and temporal dependencies in user behaviour
3. **Fully Connected Layers**: Final classification with dropout regularisation

```
Input Text → BERT (768-dim) → BiLSTM (512-dim) → FC (128-dim) → Output (2 classes)
```

### Behavioural Features Analysed

| Feature | Description | Risk Indicator |
|---------|-------------|----------------|
| Late Night Activity | Posts between 10PM-6AM | >50% is concerning |
| Sentiment Score | Average sentiment polarity | <-0.3 indicates concern |
| Negative Post Ratio | Proportion of negative posts | >50% is elevated |
| First-Person Pronouns | "I", "me", "my" usage | >10% is elevated |
| MH Community Engagement | Participation in mental health subreddits | Context-dependent |
| Posting Frequency | Posts per day average | Very high/low is notable |
| Subreddit Diversity | Unique communities engaged | <3 indicates fixation |

### Output

- **Risk Classification**: Low / Elevated
- **Confidence Score**: Model certainty (0-100%)
- **Feature Interpretations**: Human-readable insights
- **Alerts**: Specific behavioural concerns identified

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.128+
- **Database**: MariaDB 10.6+ with SQLModel ORM
- **Caching**: Redis 7.x
- **ML**: PyTorch, Hugging Face Transformers
- **Authentication**: OAuth 2.0 (Reddit), JWT sessions

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS 4.x
- **State Management**: Zustand
- **Animations**: Framer Motion

### Infrastructure
- **Containerisation**: Docker Compose
- **Database Migrations**: Alembic

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MariaDB 10.6+
- Docker Desktop (for Redis)
- Reddit API credentials

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/moodmirror.git
cd moodmirror
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your credentials
```

### 3. Database Setup

```sql
-- Connect to MariaDB
mysql -u root -p

-- Create database
CREATE DATABASE IF NOT EXISTS moodmirror_dev 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Run migrations
alembic upgrade head
```

### 4. Start Redis

```bash
# From project root
docker-compose -f docker-compose.dev.yml up -d
```

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 6. Run Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run Backend with Docker

From project root:

```bash
docker compose up --build -d
```

This starts:
- Backend API on `http://localhost:8000`
- Redis on `localhost:6379`

Notes:
- MariaDB is **not** started by this Compose file (uses your existing external MariaDB).
- Backend reads DB credentials from `backend/.env`.
- Model file is mounted from `./model` into the backend container.

Useful commands:

```bash
docker compose logs -f backend
docker compose down
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Application
ENV=development
DEBUG=true
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/moodmirror_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Reddit OAuth
REDDIT_CLIENT_ID=your-client-id
REDDIT_CLIENT_SECRET=your-client-secret
REDDIT_REDIRECT_URI=http://localhost:5173/callback

# Model
MODEL_PATH=../model/moodmirror_model.pt
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/config` | Frontend configuration |
| `GET` | `/auth/reddit` | Initiate Reddit OAuth |
| `POST` | `/auth/callback` | OAuth callback handler |
| `POST` | `/analysis/analyze` | Perform risk assessment |

---

## Project Structure

```
moodmirror/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Configuration
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   │   ├── model_service.py    # ML model inference
│   │   │   ├── reddit_service.py   # Reddit API integration
│   │   │   └── redis_service.py    # Caching layer
│   │   ├── models/           # Database models
│   │   └── utils/            # Utilities
│   ├── alembic/              # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Route pages
│   │   ├── stores/           # Zustand stores
│   │   └── config/           # API configuration
│   └── package.json
├── model/
│   └── moodmirror_model.pt   # Trained model weights
└── docker-compose.dev.yml    # Development services
```

---

## Research Foundation

This project is built on established research in computational mental health assessment:

- **Text-based indicators**: Linguistic patterns associated with mental health conditions
- **Behavioural signals**: Activity patterns, temporal dynamics, community engagement
- **Clinical validation**: Inter-rater reliability testing with domain experts

### Ethical Considerations

- **Consent-driven**: Users must explicitly authorise access to their data
- **Non-diagnostic**: Results are risk indicators, not clinical diagnoses
- **Privacy-first**: No data is stored beyond the analysis session
- **Transparency**: Users receive interpretable explanations of all findings

---

## Disclaimer

MoodMirror is a research tool designed to identify potential risk indicators. It is **not** a substitute for professional mental health evaluation or diagnosis. If you or someone you know is struggling with mental health, please consult a qualified healthcare professional.

**Crisis Resources:**
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

---

## License

This project is developed as part of academic research. Please contact the authors for licensing information.

---

## Acknowledgements

- Hugging Face for the Transformers library
- Reddit API for data access capabilities
- Clinical collaborators for dataset validation
