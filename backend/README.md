# MoodMirror Backend

FastAPI backend with SQLModel ORM, MariaDB database, and Redis caching.

---

## 🚀 Quick Start

### Prerequisites

1. **Python 3.10+**
2. **MariaDB 10.6+** (external installation required)
3. **Docker Desktop** (for Redis)

---

### 1. Install MariaDB

**Windows:**
```bash
# Download and install from:
https://mariadb.org/download/

# Or use Chocolatey:
choco install mariadb
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mariadb-server
sudo systemctl start mariadb
sudo mysql_secure_installation
```

**macOS:**
```bash
brew install mariadb
brew services start mariadb
```

---

### 2. Create Databases

**Connect to MariaDB:**
```bash
mysql -u root -p
```

**Create databases:**
```sql
-- Create development database
CREATE DATABASE IF NOT EXISTS moodmirror_dev 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create production database
CREATE DATABASE IF NOT EXISTS moodmirror 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create user and grant privileges (adjust as needed)
CREATE USER IF NOT EXISTS 'your_db_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moodmirror_dev.* TO 'your_db_user'@'localhost';
GRANT ALL PRIVILEGES ON moodmirror.* TO 'your_db_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
EXIT;
```

---

### 3. Setup Backend Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### 4. Configure Environment

```bash
# Copy environment template
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/macOS

# Edit .env
notepad .env  # Windows
# nano .env   # Linux/macOS
```

**Required Configuration:**
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 3306)
- `DB_USER` - Database user you created
- `DB_PASSWORD` - Database password you set
- `DB_NAME_DEV` - Development database (default: moodmirror_dev)
- `DB_NAME_PROD` - Production database (default: moodmirror)
- `REDDIT_CLIENT_ID` - From https://www.reddit.com/prefs/apps
- `REDDIT_CLIENT_SECRET` - From Reddit app settings
- `JWT_SECRET_KEY` - Generate secure key
- `ENCRYPTION_KEY` - Generate secure key

**Environment Variable `ENV`:**
- `ENV=development` → Uses `DB_NAME_DEV` (moodmirror_dev)
- `ENV=production` → Uses `DB_NAME_PROD` (moodmirror)

---

### 5. Initialize Database Tables

```bash
# Run Alembic migrations to create tables
alembic upgrade head

# Or use the helper script
python app/db/init_db.py
```

This will create all tables in the appropriate database based on your `ENV` setting.

---

### 6. Start Redis

```bash
# From project root
cd ..
docker-compose -f docker-compose.dev.yml up -d
cd backend
```

---

### 7. Run Application

```bash
# Development mode (auto-reload)
uvicorn app.main:app --reload --port 8000
```

**API available at:**
- http://localhost:8000
- Docs: http://localhost:8000/docs

---

## 📁 Structure

```
backend/
├── alembic/              # Database migrations
│   ├── versions/
│   │   └── 001_initial.py  # Initial migration
│   └── env.py            # Alembic environment
├── app/
│   ├── main.py           # FastAPI application
│   ├── config.py         # Configuration (builds DATABASE_URL)
│   ├── models/
│   │   └── database.py   # SQLModel models
│   ├── db/
│   │   ├── session.py    # Database connection
│   │   ├── init_db.py    # DB initialization helper
│   │   └── init.sql      # Reference only
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── middleware/       # Middleware
│   └── utils/            # Utilities
├── .env                  # Environment variables
├── .env.example          # Environment template
└── alembic.ini           # Alembic configuration
```

---

## 🗄️ Database Models

- **User**: Reddit user profiles with unique ID
- **AnalysisLog**: Anonymized analysis metadata
- **Recommendation**: Personalized recommendations
- **SystemLog**: System activity monitoring

---

## 🔄 Database Migrations (Alembic)

**Initial Setup** (already done):
```bash
# First migration already created: alembic/versions/001_initial.py
# Apply it to create tables:
alembic upgrade head
```

**Create New Migration:**
```bash
# After modifying models in app/models/database.py
alembic revision --autogenerate -m "description of changes"

# Review the generated migration in alembic/versions/
# Then apply it:
alembic upgrade head
```

**Common Commands:**
```bash
# Apply migrations
alembic upgrade head

# Show current version
alembic current

# Show history
alembic history

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version

# Check if databases exist
mysql -u root -p
mysql> SHOW DATABASES;
mysql> USE moodmirror_dev;
mysql> EXIT;
```

### Database Access Denied
```bash
# Verify credentials in .env match database user
# Check DB_USER and DB_PASSWORD

# Test connection manually
mysql -u your_db_user -p moodmirror_dev
```

### Migrations Not Applied
```bash
# Check Alembic status
alembic current

# Apply migrations
alembic upgrade head

# If issues, check alembic/versions/ folder exists
# and contains 001_initial.py
alembic downgrade <revision>
```

**Switching Databases:**
```bash
# Development database
set ENV=development  # Windows
export ENV=development  # Linux/macOS
alembic upgrade head

# Production database
set ENV=production  # Windows
export ENV=production  # Linux/macOS
alembic upgrade head
```

---

## 🔐 Generate Security Keys

```bash
# JWT Secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Encryption Key
python -c "import os; print(os.urandom(32).hex())"
```

---

## 🐛 Troubleshooting

### MariaDB Connection Failed
```bash
# Check if running
sc query mariadb  # Windows
sudo systemctl status mariadb  # Linux
```

### Redis Connection Failed
```bash
# Check container
docker ps | findstr redis

# Restart
docker-compose -f ..\docker-compose.dev.yml restart redis
```

---

## 📚 Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLModel Docs](https://sqlmodel.tiangolo.com/)
- [MariaDB Docs](https://mariadb.com/kb/en/)

---

## 📄 License

MIT License
