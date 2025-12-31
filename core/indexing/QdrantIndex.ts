import { fetchwithRequestOptions } from "@continuedev/fetch";
import * as fs from "fs";
import { Chunk, ILLM, IndexTag, IndexingProgressUpdate } from "../index.js";
import { chunkDocumentWithoutId } from "./chunk/chunk.js";
import {
  CodebaseIndex,
  IndexResultType,
  MarkCompleteCallback,
  RefreshIndexResults,
} from "./types.js";

class QdrantClient {
  private baseUrl: string;

  constructor(url: string = "http://localhost:6334") {
    this.baseUrl = url;
  }

  async createCollection(name: string, vectorSize: number) {
    const url = `${this.baseUrl}/collections/${name}`;
    await fetchwithRequestOptions(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vectors: {
          size: vectorSize,
          distance: "Cosine",
        },
      }),
    });
  }

  async upsertPoints(collectionName: string, points: any[]) {
    const url = `${this.baseUrl}/collections/${collectionName}/points?wait=true`;
    await fetchwithRequestOptions(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });
  }

  async search(collectionName: string, vector: number[], limit: number = 10) {
    const url = `${this.baseUrl}/collections/${collectionName}/points/search`;
    const response = await fetchwithRequestOptions(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vector,
        limit,
        with_payload: true,
      }),
    });
    if (!response.ok) {
      throw new Error(`Qdrant search failed: ${response.statusText}`);
    }
    const json = await response.json();
    return (json as any).result;
  }
}

export class QdrantIndex implements CodebaseIndex {
  relativeExpectedTime: number = 1;
  private client: QdrantClient;
  private collectionName: string = "dependencies"; // Default collection for now

  get artifactId(): string {
    return `vectordb::qdrant::${this.embeddingsProvider.embeddingId}`;
  }

  constructor(
    private embeddingsProvider: ILLM,
    qdrantUrl?: string,
  ) {
    this.client = new QdrantClient(qdrantUrl);
  }

  async *update(
    tag: IndexTag,
    results: RefreshIndexResults,
    markComplete: MarkCompleteCallback,
    repoName: string | undefined,
  ): AsyncGenerator<IndexingProgressUpdate> {
    const files = results.compute;
    if (files.length === 0) {
      return;
    }

    const chunks: Chunk[] = [];
    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file.path, "utf8");
        for await (const chunk of chunkDocumentWithoutId(
          file.path,
          content,
          512,
        )) {
          chunks.push({
            ...chunk,
            filepath: file.path,
            digest: file.cacheKey,
            index: chunks.length,
          });
        }
      } catch (e) {
        // console.warn(`Failed to read/chunk file ${file.path}:`, e);
      }
    }

    if (chunks.length === 0) return;

    // Embed chunks
    const embeddings = await this.embeddingsProvider.embed(
      chunks.map((c) => c.content),
    );
    if (embeddings.length === 0) return;

    const vectorSize = embeddings[0].length;
    await this.client.createCollection(this.collectionName, vectorSize);

    // Prepare points
    const points = chunks.map((chunk, i) => ({
      id: Math.floor(Math.random() * 100000000), // Simple random ID for now, should be UUID or hash
      vector: embeddings[i],
      payload: {
        content: chunk.content,
        filepath: chunk.filepath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        index: chunk.index,
        digest: chunk.digest,
      },
    }));

    await this.client.upsertPoints(this.collectionName, points);

    await markComplete(files, IndexResultType.Compute);
    yield { progress: 1, desc: "Qdrant Indexing Complete", status: "done" };
  }

  async retrieve(
    tags: IndexTag[],
    text: string,
    n: number,
    directory?: string,
    filter?: string[],
  ): Promise<Chunk[]> {
    const embeddings = await this.embeddingsProvider.embed([text]);
    if (embeddings.length === 0) return [];

    const results = await this.client.search(
      this.collectionName,
      embeddings[0],
      n,
    );

    return results.map((r: any) => ({
      content: r.payload.content,
      filepath: r.payload.filepath,
      startLine: r.payload.startLine,
      endLine: r.payload.endLine,
      index: r.payload.index,
      digest: r.payload.digest,
    }));
  }
}
