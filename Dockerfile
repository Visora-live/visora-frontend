# VISORA frontend — build Angular (prod) then serve with nginx
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Angular application builder emits the site under dist/<project>/browser
COPY --from=build /app/dist/visora-frontend/browser /usr/share/nginx/html
EXPOSE 80
