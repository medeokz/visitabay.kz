const express = require("express");
const adminPostController = require("../controllers/adminPostController");

const router = express.Router();

router.get("/posts", adminPostController.index);
router.get("/posts/new", adminPostController.createForm);
router.post("/posts", adminPostController.create);
router.get("/posts/:id/edit", adminPostController.editForm);
router.post("/posts/:id", adminPostController.update);
router.post("/posts/:id/delete", adminPostController.remove);

module.exports = router;
