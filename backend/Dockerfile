FROM python:3.10

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Create working directory
WORKDIR /app

# Copy requirements file
COPY ./requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r ./requirements.txt

# Copy entire src folder to working directory
COPY ./src ./src

# Create builds directory where we would copy entire template in the code
RUN mkdir builds

CMD ["fastapi", "run", "src/main.py", "--host", "0.0.0.0", "--port", "8080"]
