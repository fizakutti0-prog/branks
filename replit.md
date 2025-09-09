# Overview

This is an AI Companion Telegram Bot that provides personality-driven conversations with a romantic AI girlfriend character. The bot speaks in Hinglish (Hindi + English mix) and maintains a flirtatious, caring personality. It features a freemium model with daily usage limits, premium subscriptions, and an invite system for bonus usage. The bot integrates with Google's Gemini AI API for conversational responses and includes an Express.js admin panel for management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Bot Framework
- **Technology**: Telegraf.js for Telegram Bot API integration
- **Rationale**: Provides comprehensive Telegram bot functionality with middleware support and easy command handling
- **Features**: Message handling, inline keyboards, file uploads, webhook support, and conversation memory

## Backend Architecture
- **Framework**: Express.js web server
- **Purpose**: Serves admin panel and provides REST API endpoints
- **Template Engine**: EJS for server-side rendering
- **Static Assets**: Public directory for CSS, JS, and images

## Database Design
- **Technology**: SQLite3 with custom Database class wrapper
- **Tables**:
  - `users`: Stores user profiles, premium status, usage limits, and invite tracking
  - `messages`: Tracks message history and types for analytics
  - `images`: Manages image rotation system
  - `conversations`: Stores chat history for contextual AI responses and memory
- **Rationale**: SQLite chosen for simplicity and file-based storage suitable for small to medium scale deployment

## Memory System
- **Conversation Tracking**: Each user's chat history is stored and retrieved for contextual responses
- **Smart Context**: AI includes last 8 messages in prompts for natural, continuous conversations
- **Memory Management**: Automatic cleanup keeps 50 recent messages per user, with daily maintenance at 3 AM
- **Personalization**: Bot remembers previous conversations and can reference past topics naturally

## AI Integration
- **Primary API**: Google Gemini Chat API
- **Backup API**: Secondary Gemini API for failover
- **Personality System**: Predefined prompt templates for consistent character behavior
- **Language**: Hinglish (Hindi + English mix) for regional appeal

## User Management System
- **Freemium Model**: 
  - Free users: 17 daily messages, 3 daily images
  - Premium users: 250 daily messages, 60 daily images
- **Invite System**: Bonus messages (12) and images (4) for successful referrals
- **Rate Limiting**: 1-minute cooldown for image requests
- **Daily Reset**: Automated cron job resets usage counters

## Security & Limits
- **User Verification**: Telegram ID-based authentication
- **Usage Tracking**: Per-user daily and total counters
- **Cooldown System**: Prevents spam with time-based restrictions
- **Premium Management**: Time-based premium subscriptions with expiration

# External Dependencies

## Core Services
- **Telegram Bot API**: Primary interface for bot interactions
- **Google Gemini AI**: Conversational AI service for generating responses
- **Node.js Runtime**: Server environment with npm package management

## NPM Packages
- **telegraf**: Telegram bot framework for Node.js
- **express**: Web application framework for admin panel
- **sqlite3**: SQLite database driver
- **axios**: HTTP client for external API calls
- **node-cron**: Scheduled task management for daily resets
- **multer**: File upload handling middleware
- **ejs**: Template engine for admin interface

## System Dependencies
- **File System**: Local storage for SQLite database and static assets
- **Environment Variables**: Configuration for API keys and bot tokens
- **Process Management**: Background cron jobs for maintenance tasks