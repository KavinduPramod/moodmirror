FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt

RUN python -c "from pathlib import Path; p = Path('requirements.txt'); b = p.read_bytes(); text = b.decode('utf-16') if b.startswith(b'\\xff\\xfe') or b.startswith(b'\\xfe\\xff') else b.decode('utf-8'); p.write_text(text, encoding='utf-8')"
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]