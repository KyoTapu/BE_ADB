import { env } from "./env.js";

const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");

const ELASTICSEARCH_URL = trimTrailingSlash(env.elasticsearchUrl);
const ELASTICSEARCH_INDEX = env.elasticsearchIndex;

const buildHeaders = (contentType = "application/json") => {
  const headers = {};

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  if (env.elasticsearchUsername && env.elasticsearchPassword) {
    const token = Buffer.from(
      `${env.elasticsearchUsername}:${env.elasticsearchPassword}`,
    ).toString("base64");
    headers.Authorization = `Basic ${token}`;
  }

  return headers;
};

const request = async (path, options = {}) => {
  if (!ELASTICSEARCH_URL) {
    throw new Error("Elasticsearch is not configured");
  }

  const response = await fetch(`${ELASTICSEARCH_URL}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(options.contentType ?? "application/json"),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.error?.reason || "Elasticsearch request failed");
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
};

export const elasticsearchClient = {
  isConfigured() {
    return Boolean(ELASTICSEARCH_URL);
  },

  getIndexName() {
    return ELASTICSEARCH_INDEX;
  },

  async ensureIndex() {
    if (!ELASTICSEARCH_URL) {
      return { configured: false };
    }

    const existsResponse = await fetch(`${ELASTICSEARCH_URL}/${ELASTICSEARCH_INDEX}`, {
      method: "HEAD",
      headers: buildHeaders(null),
    });

    if (existsResponse.status === 200) {
      return { configured: true, created: false };
    }

    if (existsResponse.status !== 404) {
      throw new Error(`Cannot check Elasticsearch index: ${existsResponse.status}`);
    }

    await request(`/${ELASTICSEARCH_INDEX}`, {
      method: "PUT",
      body: JSON.stringify({
        mappings: {
          properties: {
            id: { type: "keyword" },
            hotelId: { type: "keyword" },
            roomTypeId: { type: "keyword" },
            hotelName: {
              type: "text",
              fields: {
                keyword: { type: "keyword" },
              },
            },
            city: {
              type: "text",
              fields: {
                keyword: { type: "keyword" },
              },
            },
            country: {
              type: "text",
              fields: {
                keyword: { type: "keyword" },
              },
            },
            roomTypeName: {
              type: "text",
              fields: {
                keyword: { type: "keyword" },
              },
            },
            bedType: {
              type: "text",
              fields: {
                keyword: { type: "keyword" },
              },
            },
            description: { type: "text" },
            amenities: { type: "keyword" },
            amenitiesText: { type: "text" },
            services: { type: "keyword" },
            servicesText: { type: "text" },
            starRating: { type: "float" },
            basePrice: { type: "float" },
            maxGuests: { type: "integer" },
            active: { type: "boolean" },
            indexedAt: { type: "date" },
          },
        },
      }),
    });

    return { configured: true, created: true };
  },

  async replaceIndex(documents = []) {
    if (!ELASTICSEARCH_URL) {
      return { configured: false, indexed: 0 };
    }

    const existsResponse = await fetch(`${ELASTICSEARCH_URL}/${ELASTICSEARCH_INDEX}`, {
      method: "HEAD",
      headers: buildHeaders(null),
    });

    if (existsResponse.status === 200) {
      await request(`/${ELASTICSEARCH_INDEX}`, {
        method: "DELETE",
      });
    }

    await this.ensureIndex();

    if (!documents.length) {
      return { configured: true, indexed: 0 };
    }

    const payload = `${documents
      .flatMap((document) => [
        JSON.stringify({ index: { _index: ELASTICSEARCH_INDEX, _id: document.id } }),
        JSON.stringify(document),
      ])
      .join("\n")}\n`;

    const result = await request("/_bulk", {
      method: "POST",
      contentType: "application/x-ndjson",
      body: payload,
    });

    return {
      configured: true,
      indexed: documents.length,
      errors: Boolean(result?.errors),
    };
  },

  async search(query = {}) {
    if (!ELASTICSEARCH_URL) {
      throw new Error("Elasticsearch is not configured");
    }

    return request(`/${ELASTICSEARCH_INDEX}/_search`, {
      method: "POST",
      body: JSON.stringify(query),
    });
  },
};
