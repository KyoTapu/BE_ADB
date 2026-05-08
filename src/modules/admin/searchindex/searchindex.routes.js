import { Router } from "express";
import { authenticate, authorize } from "../../../common/auth.middleware.js";
import {
  getSearchIndexStatus,
  rebuildSearchIndex,
  testSearchIndexQuery,
} from "./searchindex.controller.js";

const searchindexRouter = Router();

searchindexRouter.get("/", authenticate, authorize("admin"), getSearchIndexStatus);
searchindexRouter.post("/rebuild", authenticate, authorize("admin"), rebuildSearchIndex);
searchindexRouter.post("/test-query", authenticate, authorize("admin"), testSearchIndexQuery);

export default searchindexRouter;
