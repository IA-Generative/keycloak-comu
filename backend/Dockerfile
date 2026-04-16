FROM golang:1.26.2-alpine AS base

WORKDIR /workspace/backend

RUN apk add --no-cache ca-certificates git nodejs npm
RUN go install github.com/air-verse/air@v1.61.7

COPY backend/go.mod backend/go.sum ./
RUN go mod download

FROM base AS dev

WORKDIR /app

COPY backend/. ./

EXPOSE 8080

CMD ["/bin/sh", "-c", "air -c .air.toml"]

FROM base AS builder

COPY backend/. ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /tmp/server ./cmd/server
WORKDIR /tmp
RUN mkdir docs
RUN WRITE_SPEC_ONLY=true ./server

FROM node:22-alpine AS frontend-builder

WORKDIR /workspace/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/. ./
COPY --from=builder /tmp/docs/openapi.json ./
RUN HEY_API_INPUT=openapi.json npm run generate:client
RUN npm run build
# Ensure files are world-readable for arbitrary UIDs (OpenShift)
RUN chmod -R a+rX /workspace/frontend/dist

FROM alpine:3.18 AS prod

ARG VERSION="unknown"
ENV APP_VERSION=${VERSION}

WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /tmp/server /app/server
COPY --from=frontend-builder /workspace/frontend/dist /static
COPY --from=builder /workspace/backend/config /app/config

EXPOSE 8080

ENTRYPOINT ["/app/server"]
