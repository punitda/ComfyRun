FROM python:3.10

# Create working directory
WORKDIR /app

# Copy requirements file
COPY ./requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r ./requirements.txt



# Copy entire src folder to working directory
COPY ./src ./src

# Copy .env file (for local dev)
COPY .env ./

# Copy startup.sh
COPY startup.sh ./

# Create builds directory where we would copy entire template in the code
RUN mkdir builds

CMD ["sh", "./startup.sh"]