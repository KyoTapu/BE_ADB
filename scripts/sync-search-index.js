import { checkDatabaseConnection } from "../src/configs/postgres.js";
import { elasticsearchClient } from "../src/configs/elasticsearch.js";
import { searchRepository } from "../src/modules/search/search.repository.js";

const run = async () => {
  if (!elasticsearchClient.isConfigured()) {
    throw new Error("ELASTICSEARCH_URL is not configured");
  }

  await checkDatabaseConnection();

  const documents = await searchRepository.getSearchIndexDocuments();
  const result = await elasticsearchClient.replaceIndex(documents);

  console.log(
    JSON.stringify(
      {
        success: true,
        indexName: elasticsearchClient.getIndexName(),
        indexed: result.indexed,
        errors: result.errors || false,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
