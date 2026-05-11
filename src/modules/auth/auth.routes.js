import { Router } from "express";
import { authenticate, authorize } from "../../common/auth.middleware.js";
import { authController } from "./auth.controller.js";

const authRouter = Router();
authRouter.get("/health", authController.health);
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", authenticate, authController.me);

const adminAuthRouter = Router();
adminAuthRouter.post("/login", authController.adminLogin);
adminAuthRouter.post("/set-admin", authenticate, authorize("admin"), authController.setAdmin);
adminAuthRouter.post("/remove-admin", authenticate, authorize("admin"), authController.removeAdmin);

export const authRoutes = [
  {
    moduleName: "auth",
    routePath: "/api/auth",
    router: authRouter,
  },
  {
    moduleName: "legacy-client-auth",
    routePath: "/api/client/auth",
    router: authRouter,
  },
  {
    moduleName: "legacy-admin-auth",
    routePath: "/api/admin/auth",
    router: adminAuthRouter,
  },
];
