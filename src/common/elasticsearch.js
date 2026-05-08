const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");

const ELASTICSEARCH_URL = trimTrailingSlash(process.env.ELASTICSEARCH_URL || "");
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || "hotel_room_inventory";
const ELASTICSEARCH_USERNAME = process.env.ELASTICSEARCH_USERNAME || "";
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD || "";

const buildHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (ELASTICSEARCH_USERNAME && ELASTICSEARCH_PASSWORD) {
    const token = Buffer.from(`${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD}`).toString("base64");
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
      ...buildHeaders(),
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
      headers: buildHeaders(),
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
            roomTypeId: { type: "integer" },
            hotelId: { type: "integer" },
            hotelName: { type: "text", fields: { keyword: { type: "keyword" } } },
            roomTypeName: { type: "text", fields: { keyword: { type: "keyword" } } },
            cityAddress: { type: "text", fields: { keyword: { type: "keyword" } } },
            countryName: { type: "text", fields: { keyword: { type: "keyword" } } },
            countryCode: { type: "keyword" },
            location: { type: "object", enabled: true },
            description: { type: "text" },
            servicesText: { type: "text" },
            snapshotDate: { type: "date" },
            availableDate: { type: "date" },
            price: { type: "float" },
            basePrice: { type: "float" },
            capacity: { type: "integer" },
            rating: { type: "float" },
            totalRooms: { type: "integer" },
            bookedRooms: { type: "integer" },
            availableRoomCount: { type: "integer" },
            amenities: { type: "keyword" },
            services: { type: "keyword" },
            searchTags: { type: "keyword" },
            indexedAt: { type: "date" },
          },
        },
      }),
    });

    return { configured: true, created: true };
  },

  async bulkIndex(documents = []) {
    if (!ELASTICSEARCH_URL) {
      return { configured: false, indexed: 0 };
    }

    await this.ensureIndex();

    if (!documents.length) {
      return { configured: true, indexed: 0 };
    }

    const lines = documents.flatMap((document) => [
      JSON.stringify({ index: { _index: ELASTICSEARCH_INDEX, _id: document.id } }),
      JSON.stringify(document),
    ]);

    const payload = `${lines.join("\n")}\n`;

    const result = await request("/_bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-ndjson",
      },
      body: payload,
    });

    return {
      configured: true,
      indexed: documents.length,
      errors: Boolean(result.errors),
    };
  },

  async replaceIndex(documents = []) {
    if (!ELASTICSEARCH_URL) {
      return { configured: false, indexed: 0 };
    }

    const existsResponse = await fetch(`${ELASTICSEARCH_URL}/${ELASTICSEARCH_INDEX}`, {
      method: "HEAD",
      headers: buildHeaders(),
    });

    if (existsResponse.status === 200) {
      await request(`/${ELASTICSEARCH_INDEX}`, { method: "DELETE" });
    }

    await this.ensureIndex();
    return this.bulkIndex(documents);
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

  async getStatus() {
    if (!ELASTICSEARCH_URL) {
      return {
        configured: false,
        indexName: ELASTICSEARCH_INDEX,
        exists: false,
        documentCount: 0,
        clusterHealth: "unconfigured",
      };
    }

    const health = await request("/_cluster/health", { method: "GET" });
    const existsResponse = await fetch(`${ELASTICSEARCH_URL}/${ELASTICSEARCH_INDEX}`, {
      method: "HEAD",
      headers: buildHeaders(),
    });

    if (existsResponse.status !== 200) {
      return {
        configured: true,
        indexName: ELASTICSEARCH_INDEX,
        exists: false,
        documentCount: 0,
        clusterHealth: health?.status || "unknown",
      };
    }

    const count = await request(`/${ELASTICSEARCH_INDEX}/_count`, { method: "GET" });

    return {
      configured: true,
      indexName: ELASTICSEARCH_INDEX,
      exists: true,
      documentCount: Number(count?.count) || 0,
      clusterHealth: health?.status || "unknown",
    };
  },
};
