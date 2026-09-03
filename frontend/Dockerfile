FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@11.25.0

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .dsfr.yml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev"]
