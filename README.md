# Meeting Scheduler — Backend

Backend system that fully manages a custom calendar and scheduling engine, including all events (meetings, breaks, closures) stored and handled internally using MongoDB — without relying on any external calendar API.

## 🚀 Overview

This backend is responsible for:

- Calendar management
- Meeting scheduling logic
- Event handling (meetings, breaks, closures)
- Availability computation
- Data validation and consistency

All scheduling logic is handled internally, allowing complete control over how events are created, stored, and retrieved.

## ⚙️ Features

- Custom API structure
- Centralized error handling
- Token verification middleware
- MongoDB integration via Mongoose
- Creation of MongoDB indexes for fast event lookup
- Optimized response handling
- Modular route organization

## 🧱 Architecture

Designed for:

- Clear separation of logic
- Easy feature extension
- Maintainable backend structure

## 🗄️ Data Management

- All calendar data is managed internally
- Events (meetings, breaks, closures) are stored in MongoDB
- No external calendar API is used
- Indexed queries are used to efficiently retrieve existing events and compute availability

## 📦 Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose

## 🎯 Goal

To provide a fully controlled and independent scheduling backend, free from third-party calendar constraints and fully adaptable to any business logic.

## 🔗 Frontend

Works with:

→ meeting-scheduler-frontend-mobile

## 🛠️ Usage

- Define your schemas
- Extend endpoints
- Adapt scheduling logic to your needs
