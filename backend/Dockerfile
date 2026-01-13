# Build stage
FROM golang:1.24.0-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Install tzdata (timezone info)
RUN apk add --no-cache tzdata

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main cmd/main.go

# Build the seeder
RUN CGO_ENABLED=0 GOOS=linux go build -o seeder cmd/seeder/*.go

# Run stage
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

# Copy binaries from builder
COPY --from=builder /app/main .
COPY --from=builder /app/seeder .

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]
