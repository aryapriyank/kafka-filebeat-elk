FROM python:3.11-slim

WORKDIR /app

# Copy requirements file (if you have one, if not this will be created)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python script
COPY microservice.py .

# Create logs directory
RUN mkdir -p logs

CMD ["python", "microservice.py"]