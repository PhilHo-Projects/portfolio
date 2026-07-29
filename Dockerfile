FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV CV_DATA_DIR=/app/runtime/cv
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server.cjs ./server.cjs
COPY server ./server
COPY public/data/resumes ./public/data/resumes
RUN mkdir -p /app/runtime/cv && chown -R node:node /app
USER node
EXPOSE 8080
CMD ["node", "server.cjs"]
