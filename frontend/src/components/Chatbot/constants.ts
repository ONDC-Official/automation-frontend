import { KnowledgeSource } from "./types";

export const DEFAULT_ASSISTANT_ORIGIN = "http://3.108.1.82:8000";

export const SOURCE_LABELS: Record<KnowledgeSource, string> = {
    all: "All Databases",
    neo4j: "Neo4j (Graph)",
    milvus: "Milvus (Vector)",
};

export const SOURCE_ICONS: Record<KnowledgeSource, string> = {
    all: "🔍",
    neo4j: "🕸️",
    milvus: "📁",
};

export const STORAGE_KEY = "mcp_session_id";
