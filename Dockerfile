FROM python:3.10.12

# WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgdal-dev \
    gdal-bin \
    libgeos-dev

RUN pip install GDAL==`gdal-config --version`

WORKDIR /app
COPY ./backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend /app/backend

RUN apt-get update && apt-get install -y npm
WORKDIR /app/frontend
COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend /app/frontend

RUN npm run relocate

WORKDIR /app

EXPOSE 8000

CMD ["python", "backend/manage.py", "runserver", "0.0.0.0:8000"]