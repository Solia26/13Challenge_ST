const router = require("express").Router();
const { Tag, Product, ProductTag } = require("../../models");

// The `/api/tags` endpoint

router.get("/", async (req, res) => {
  const answer = await Tag.findAll({
    include: [
      {
        model: Product,
        as: "products",
      },
    ],
  });
  res.json(answer);
  // find all tags
  // be sure to include its associated Product data
});

router.get("/:id", async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  const answer = await Tag.findAll({
    where: {
      id: req.params.id,
    },
    include: [
      {
        model: Product,
        as: "products",
      },
    ],
  });
  res.json(answer);
});

// POST to create a new tag
router.post("/", async (req, res) => {
  try {
    const newTag = await Tag.create({
      tag_name: req.body.tag_name,
    });

    // If there are productIds in the request body, create associations
    if (req.body.productIds && req.body.productIds.length) {
      const productTagIdArr = req.body.productIds.map((product_id) => {
        return {
          product_id,
          tag_id: newTag.id,
        };
      });
      await ProductTag.bulkCreate(productTagIdArr);
    }

    res.status(201).json(newTag);
  } catch (err) {
    res.status(400).json(err);
  }
});

// PUT to update a tag by its `id`
router.put("/:id", async (req, res) => {
  try {
    const updatedTag = await Tag.update(
      {
        tag_name: req.body.tag_name,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );
    if (!updatedTag[0]) {
      res.status(404).json({ message: "No tag found with this id!" });
      return;
    }

    // Find all associated products from ProductTag
    const productTags = await ProductTag.findAll({
      where: { tag_id: req.params.id },
    });

    // Get list of current product_ids
    const productTagIds = productTags.map(({ product_id }) => product_id);

    // Create filtered list of new product_ids
    const newProductTags = req.body.productIds
      .filter((product_id) => !productTagIds.includes(product_id))
      .map((product_id) => {
        return {
          tag_id: req.params.id,
          product_id,
        };
      });

    // Figure out which ones to remove
    const productTagsToRemove = productTags
      .filter(({ product_id }) => !req.body.productIds.includes(product_id))
      .map(({ id }) => id);

    // Run both actions
    await Promise.all([
      ProductTag.destroy({ where: { id: productTagsToRemove } }),
      // ProductTag.bulkCreate(newProductTags),
    ]);

    res.json(updatedTag);
  } catch (err) {
    console.log("😎 ~ router.put ~ err:", err);
    res.status(400).json(err);
  }
});

// DELETE a tag by its `id`
router.delete("/:id", async (req, res) => {
  try {
    const deletedTag = await Tag.destroy({
      where: {
        id: req.params.id,
      },
    });
    if (!deletedTag) {
      res.status(404).json({ message: "No tag found with this id!" });
      return;
    }
    res.json(deletedTag);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
