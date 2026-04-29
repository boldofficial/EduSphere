FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies with uv lockfile
COPY pyproject.toml uv.lock /app/
RUN pip install --no-cache-dir --upgrade pip uv && \
    uv sync --frozen --no-dev --no-install-project && \
    uv pip install --python /app/.venv/bin/python "pyotp>=2.9.0"

# Copy the Django project code into the container
COPY . /app/
ENV PATH="/app/.venv/bin:$PATH"

# Expose the port Gunicorn will listen on
EXPOSE 8000

# Specify the command to run the backend server with optimized workers/threads
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --threads 2 --timeout 60"]
