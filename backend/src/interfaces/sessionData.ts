// src/interfaces/sessionData.ts
export interface SessionData {
    sessionId: string;
    subscriberId: string;
    participantType: string;
    domain: string;
    createdAt: string; // ISO timestamp
    transactions: Record<string, TransactionDetails>; // Example transactions object
  }
  
  export interface TransactionDetails {
    transactionMode: string; // Type of transaction (auto/manual)
    state: string; // State of the transaction
    data: Record<string, any>; // Additional transaction details
    createdAt: string; // ISO timestamp
  }
  