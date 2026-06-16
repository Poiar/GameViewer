import { Router } from "express";
import authRoutes from "./auth.js";
import gameRoutes from "./games.js";
import releaseRoutes from "./releases.js";
import seriesRoutes from "./series.js";
import dlcRoutes from "./dlc.js";
import collectionRoutes from "./collections.js";
import inventoryRoutes from "./inventory.js";
import favoriteRoutes from "./favorites.js";
import dashboardRoutes from "./dashboard.js";
import lookupRoutes from "./lookup.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/games", gameRoutes);
router.use("/releases", releaseRoutes);
router.use("/series", seriesRoutes);
router.use("/dlc", dlcRoutes);
router.use("/collections", collectionRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/lookup", lookupRoutes);

export { router as apiRouter };
export default router;
