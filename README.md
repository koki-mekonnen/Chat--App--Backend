NestJS Chat Backend with WebSockets, Prisma, and Redis

## Overview

This is a real-time chat application backend built with NestJS, featuring WebSocket communication, Prisma ORM for database operations, and Redis for pub/sub functionality. The application is fully dockerized for easy deployment.
Features

   * Real-time messaging using WebSockets

   * User authentication and authorization

   * Message persistence with Prisma ORM

   * Redis for pub/sub pattern implementation

   * Dockerized environment for development and production

   * Scalable architecture for handling multiple chat rooms

## Prerequisites

   * Docker (v20.10+)

   * Docker Compose (v2.0+)

   * Node.js (v18+)

  * npm (v9+)

## Technologies Used

   * NestJS - Backend framework

   * WebSockets - Real-time communication

   * Prisma - ORM for database operations

   * PostgreSQL - Primary database

   * Redis - Pub/sub and caching

   *  Docker - Containerization

   *  JWT - Authentication

## Key Commands

    make up - Start all services

    make down - Stop and remove containers

    make build - Rebuild containers

    make logs - View container logs

    make migrate - Run database migrations

    make clean - Remove all containers and clean up

## Access

    API: http://localhost:3001

    Redis Url: redis://localhost:6379 

    WebSocket: ws://localhost:3001/chat

## Services

    Backend: NestJS with WebSockets

    Database: PostgreSQL

    Cache/PubSub: Redis

Edit .env file to configure your environment variables.

## Learn More

For more information, you can check out my GitHub: [Selamawit](https://github.com/koki-mekonnen).

