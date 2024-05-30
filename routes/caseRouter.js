const Router = require("express");
const router = new Router();
const caseController = require("../controllers/caseController");

router.post("/", caseController.create);
router.get("/", caseController.getAll);
router.get("/:id", caseController.getOne);
router.get("/link/:caseLink", caseController.getByLink);
router.delete("/:id", caseController.deleteOne);
router.patch("/:id", caseController.updateOne);

module.exports = router;
