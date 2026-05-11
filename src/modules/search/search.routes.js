import { Router } from "express";
import { searchController } from "./search.controller.js";
import { searchModel } from "./search.model.js";

const router = Router();
router.get("/", searchController.search);

export const searchRoute = {
  moduleName: searchModel.moduleName,
  routePath: searchModel.routePath,
  router,
};
