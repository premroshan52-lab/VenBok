const express = require("express");
const organizationController = require("../controllers/organization.controller");

const router = express.Router();

router.get("/", organizationController.getOrganizations);
router.get("/:id/spaces", organizationController.getOrganizationSpaces);

module.exports = router;
