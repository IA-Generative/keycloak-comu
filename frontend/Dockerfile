FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* .dsfr.yml ./
RUN npm i

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
