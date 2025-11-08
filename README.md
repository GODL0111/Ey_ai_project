# Agentive AI Loan Assistant

An AI-driven conversational approach for personal loan sales that uses multiple specialized agents to handle different stages of the loan process.

## Project Overview

This project demonstrates an agentive AI system that helps customers apply for personal loans through a natural conversation. The system consists of a Master Agent that orchestrates the conversation and delegates to specialized Worker Agents for specific tasks.

## Agent Types

- **Master Agent**: Orchestrates the conversation and delegates to specialized agents
- **Sales Agent**: Handles product information, loan options, and personalized offers
- **Verification Agent**: Manages KYC, identity verification, and document collection
- **Underwriting Agent**: Assesses credit risk, evaluates eligibility, and determines loan terms
- **Document Generator**: Creates loan sanction letters and other documents

## System Architecture

```
┌─────────────────────┐           ┌─────────────────────┐
│                     │           │                     │
│    Chatbot UI       │◄─────────►│   Master Agent      │
│    (React)          │           │   (Orchestrator)    │
│                     │           │                     │
└─────────────────────┘           └─────────┬───────────┘
                                            │
                                            ▼
                 ┌───────────────┬──────────┴───────────┬───────────────┐
                 │               │                      │               │
                 ▼               ▼                      ▼               ▼
        ┌─────────────┐  ┌─────────────┐       ┌─────────────┐  ┌─────────────┐
        │             │  │             │       │             │  │             │
        │ Sales Agent │  │ Verification│       │ Underwriting│  │ Document    │
        │             │  │ Agent       │       │ Agent       │  │ Generator   │
        └──────┬──────┘  └──────┬──────┘       └──────┬──────┘  └──────┬──────┘
               │                │                     │                │
               ▼                ▼                     ▼                ▼
        ┌─────────────┐  ┌─────────────┐       ┌─────────────┐  ┌─────────────┐
        │ Mock Offer  │  │ Mock CRM    │       │ Mock Credit │  │ PDF         │
        │ API         │  │ API         │       │ Bureau API  │  │ Generator   │
        └─────────────┘  └─────────────┘       └─────────────┘  └─────────────┘
```

## Project Structure

- `/frontend`: React-based chatbot interface
- `/backend`: Express.js backend with mock APIs and agent logic

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm run install:all
   ```
3. Start the development server:
   ```
   npm start
   ```

## Features

- Natural language conversation with specialized AI agents
- Customer identification and KYC verification
- Credit risk assessment and loan eligibility
- Document upload and verification
- Automatic loan sanction letter generation

## Mock APIs

- CRM API: Provides customer information and KYC verification
- Credit Bureau API: Provides credit scores and history
- Offer API: Provides pre-approved loan offers