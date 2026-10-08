/* eslint-disable no-unused-vars */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import subCategoryService from "../../services/subCategoryService";
import tagService from "../../services/tagService";
import mediaService from "../../services/mediaService";

import Toggle from "../../components/ui/Toggle";
import { slugify } from "../../components/ui/Slugify";
import RichTextEditor from "../../components/editor/RichTextEditor";

/* =========================================================
   HELPERS
========================================================= */

const DEFAULT_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Pink", hex: "#F5A3B7" },
  { name: "Blue", hex: "#9CC7E8" },
  { name: "Cream", hex: "#F4E8D2" },
  { name: "Yellow", hex: "#F5D76E" },
  { name: "Green", hex: "#A8C7A1" },
];

const DEFAULT_SIZES = [
  "0-3M",
  "3-6M",
  "6-12M",
  "1-2Y",
  "2-3Y",
  "3-4Y",
  "4-5Y",
  "5-6Y",
  "6-7Y",
  "7-8Y",
  "8-9Y",
  "9-10Y",
];

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function extractUrl(response) {
  const data = response?.data?.data || response?.data;

  return data?.secureUrl || data?.url || "";
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function generateSku(productName, variant, index = 0) {
  const base =
    String(productName || "PRODUCT")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 18) || "PRODUCT";

  const color = String(variant?.color || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .slice(0, 8);

  const size = String(variant?.size || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .slice(0, 8);

  return [base, color, size, index + 1]
    .filter(Boolean)
    .join("-");
}

function getVariantKey(variant) {
  return `${normalize(variant.color)}::${normalize(variant.size)}`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ProductForm({ mode = "create" }) {
  const navigate = useNavigate();
  const params = useParams();

  const productId =
    mode === "edit" && params.id ? Number(params.id) : null;

  /* =========================================================
     GENERAL STATE
  ========================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tags, setTags] = useState([]);

  /* =========================================================
     PRODUCT OPTIONS
  ========================================================= */

  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);

  const [newColor, setNewColor] = useState({
    name: "",
    hex: "#F5A3B7",
  });

  const [newSize, setNewSize] = useState("");

  /* =========================================================
     FORM
  ========================================================= */

  const [form, setForm] = useState({
    name: "",
    slug: "",

    description: "",

    productType: "clothing",

    isActive: true,

    categoryId: "",
    subCategoryId: "",

    imageUrl: "",

    shortDescriptionHtml: "",
    apContentHtml: "",
    apContentImageUrl: "",
    apContentVideoUrl: "",

    tagIds: [],

    images: [],

    variants: [],
  });

  /* =========================================================
     BASIC HELPERS
  ========================================================= */

  const setField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const updateVariant = (index, key, value) => {
    setForm((previous) => ({
      ...previous,

      variants: previous.variants.map((variant, i) => {
        if (i !== index) {
          return variant;
        }

        return {
          ...variant,
          [key]: value,
        };
      }),
    }));
  };

  /* =========================================================
     MASTER DATA
  ========================================================= */

  const loadMasterData = async () => {
    const [categoryResponse, subCategoryResponse, tagResponse] =
      await Promise.all([
        categoryService.list(),
        subCategoryService.list(),

        tagService.list?.() ||
          tagService.listAll?.() ||
          Promise.resolve({
            data: {
              data: [],
            },
          }),
      ]);

    const categoryData =
      categoryResponse?.data?.data ||
      categoryResponse?.data ||
      [];

    const subCategoryData =
      subCategoryResponse?.data?.data ||
      subCategoryResponse?.data ||
      [];

    const tagData =
      tagResponse?.data?.data ||
      tagResponse?.data ||
      [];

    setCategories(
      Array.isArray(categoryData)
        ? categoryData
        : []
    );

    setSubCategories(
      Array.isArray(subCategoryData)
        ? subCategoryData
        : []
    );

    setTags(
      Array.isArray(tagData)
        ? tagData
        : []
    );
  };

  /* =========================================================
     LOAD PRODUCT
  ========================================================= */

  const loadProduct = async () => {
    if (!productId) {
      return;
    }

    const response =
      await productService.get(productId);

    const product =
      response?.data?.data;

    if (!product) {
      throw new Error("Product not found");
    }

    const loadedVariants =
      (product.variants || []).map((variant) => ({
        id: variant.id,

        color: variant.color || "",
        colorHex:
          variant.colorHex || "#000000",

        size: variant.size || "",
        weight: variant.weight || "",

        price:
          variant.price ?? "",

        discountPrice:
          variant.discountPrice ?? "",

        stockQuantity:
          variant.stockQuantity ?? 0,

        sku:
          variant.sku || "",

        images:
          (variant.images || []).map(
            (image) => ({
              id: image.id,
              url: image.url,
              altText:
                image.altText || "",
              sortOrder:
                image.sortOrder ?? 0,
            })
          ),
      }));

    /* ---------------------------------------------
       BUILD COLOR OPTIONS FROM EXISTING VARIANTS
    --------------------------------------------- */

    const colorMap = new Map();

    loadedVariants.forEach((variant) => {
      if (!variant.color) {
        return;
      }

      const key =
        normalize(variant.color);

      if (!colorMap.has(key)) {
        colorMap.set(key, {
          name: variant.color,
          hex:
            variant.colorHex ||
            "#000000",
        });
      }
    });

    setColors(
      Array.from(colorMap.values())
    );

    /* ---------------------------------------------
       BUILD SIZE OPTIONS
    --------------------------------------------- */

    const uniqueSizes = [
      ...new Set(
        loadedVariants
          .map((variant) => variant.size)
          .filter(Boolean)
      ),
    ];

    setSizes(uniqueSizes);

    /* ---------------------------------------------
       SET PRODUCT
    --------------------------------------------- */

    setForm({
      name:
        product.name || "",

      slug:
        product.slug ||
        slugify(product.name || ""),

      description:
        product.description || "",

      productType:
        product.productType ||
        "clothing",

      isActive:
        product.isActive ?? true,

      categoryId:
        product.categoryId
          ? String(product.categoryId)
          : "",

      subCategoryId:
        product.subCategoryId
          ? String(product.subCategoryId)
          : "",

      imageUrl:
        product.imageUrl || "",

      shortDescriptionHtml:
        product.shortDescriptionHtml ||
        "",

      apContentHtml:
        product.apContentHtml || "",

      apContentImageUrl:
        product.apContentImageUrl ||
        "",

      apContentVideoUrl:
        product.apContentVideoUrl ||
        "",

      tagIds:
        (product.productTags || [])
          .map(
            (productTag) =>
              productTag.tagId ||
              productTag.tag?.id
          )
          .filter(Boolean),

      images:
        (product.images || []).map(
          (image) => ({
            id: image.id,
            url: image.url,
            altText:
              image.altText || "",
            sortOrder:
              image.sortOrder ?? 0,
            isMain:
              !!image.isMain,
          })
        ),

      variants: loadedVariants,
    });
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError("");

        await loadMasterData();

        if (mode === "edit") {
          await loadProduct();
        }
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load product."
        );
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, productId]);

  /* =========================================================
     SUB CATEGORIES
  ========================================================= */

  const filteredSubCategories =
    useMemo(() => {
      if (!form.categoryId) {
        return [];
      }

      return subCategories.filter(
        (subCategory) =>
          String(
            subCategory.categoryId
          ) ===
          String(form.categoryId)
      );
    }, [
      subCategories,
      form.categoryId,
    ]);

  useEffect(() => {
    if (!form.categoryId) {
      return;
    }

    if (!form.subCategoryId) {
      return;
    }

    const valid =
      subCategories.some(
        (subCategory) =>
          String(subCategory.id) ===
            String(
              form.subCategoryId
            ) &&
          String(
            subCategory.categoryId
          ) ===
            String(form.categoryId)
      );

    if (!valid) {
      setField(
        "subCategoryId",
        ""
      );
    }
  }, [
    form.categoryId,
    form.subCategoryId,
    subCategories,
  ]);

  /* =========================================================
     MEDIA UPLOAD
  ========================================================= */

  const uploadFile = async (
    file,
    folder
  ) => {
    if (!file) {
      return "";
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    if (folder) {
      formData.append(
        "folder",
        folder
      );
    }

    try {
      setUploading(true);
      setUploadPct(0);

      const response =
        await mediaService.upload(
          formData,
          (percentage) =>
            setUploadPct(percentage)
        );

      const url =
        extractUrl(response);

      if (!url) {
        throw new Error(
          "Upload succeeded but no image URL was returned."
        );
      }

      return url;
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  /* =========================================================
     PRODUCT MEDIA
  ========================================================= */

  const uploadProductMedia =
    async (files) => {
      const selected =
        Array.from(files || []);

      if (!selected.length) {
        return;
      }

      try {
        for (const file of selected) {
          const url =
            await uploadFile(
              file,
              "products/gallery"
            );

          if (!url) {
            continue;
          }

          setForm((previous) => {
            const images = [
              ...previous.images,
              {
                url,
                altText: "",
                sortOrder:
                  previous.images.length,
                isMain:
                  previous.images.length ===
                  0,
              },
            ];

            return {
              ...previous,
              images,
              imageUrl:
                previous.imageUrl ||
                url,
            };
          });
        }
      } catch (err) {
        console.error(err);

        alert(
          err?.response?.data?.message ||
            err?.message ||
            "Media upload failed."
        );
      }
    };

  const removeProductImage =
    (index) => {
      setForm((previous) => {
        const removed =
          previous.images[index];

        const images =
          previous.images.filter(
            (_, i) => i !== index
          );

        if (
          images.length &&
          !images.some(
            (image) =>
              image.isMain
          )
        ) {
          images[0] = {
            ...images[0],
            isMain: true,
          };
        }

        const main =
          images.find(
            (image) =>
              image.isMain
          ) || images[0];

        return {
          ...previous,
          images,
          imageUrl:
            previous.imageUrl ===
            removed?.url
              ? main?.url || ""
              : previous.imageUrl,
        };
      });
    };

  const makeMainImage =
    (index) => {
      setForm((previous) => {
        const images =
          previous.images.map(
            (image, i) => ({
              ...image,
              isMain: i === index,
            })
          );

        return {
          ...previous,
          images,
          imageUrl:
            images[index]?.url ||
            previous.imageUrl,
        };
      });
    };

  /* =========================================================
     COLORS
  ========================================================= */

  const addColor = () => {
    const name =
      newColor.name.trim();

    if (!name) {
      return;
    }

    const exists =
      colors.some(
        (color) =>
          normalize(color.name) ===
          normalize(name)
      );

    if (exists) {
      alert(
        "This color already exists."
      );

      return;
    }

    setColors((previous) => [
      ...previous,
      {
        name,
        hex: newColor.hex,
      },
    ]);

    setNewColor({
      name: "",
      hex: "#F5A3B7",
    });
  };

  const removeColor =
    (index) => {
      setColors((previous) =>
        previous.filter(
          (_, i) => i !== index
        )
      );
    };

  /* =========================================================
     SIZES
  ========================================================= */

  const addSize = (
    value = newSize
  ) => {
    const size =
      String(value || "").trim();

    if (!size) {
      return;
    }

    const exists =
      sizes.some(
        (existing) =>
          normalize(existing) ===
          normalize(size)
      );

    if (exists) {
      setNewSize("");
      return;
    }

    setSizes((previous) => [
      ...previous,
      size,
    ]);

    setNewSize("");
  };

  const removeSize =
    (index) => {
      setSizes((previous) =>
        previous.filter(
          (_, i) => i !== index
        )
      );
    };

  /* =========================================================
     GENERATE VARIANTS
  ========================================================= */

  const generateVariants = () => {
    if (
      !colors.length &&
      !sizes.length
    ) {
      alert(
        "Add at least one color or size."
      );

      return;
    }

    setForm((previous) => {
      const existingMap =
        new Map();

      previous.variants.forEach(
        (variant) => {
          existingMap.set(
            getVariantKey(
              variant
            ),
            variant
          );
        }
      );

      const colorValues =
        colors.length
          ? colors
          : [
              {
                name: "",
                hex: "",
              },
            ];

      const sizeValues =
        sizes.length
          ? sizes
          : [""];

      const generated = [];

      colorValues.forEach(
        (color) => {
          sizeValues.forEach(
            (size) => {
              const candidate = {
                color:
                  color.name || "",
                colorHex:
                  color.hex || "",
                size: size || "",
              };

              const key =
                getVariantKey(
                  candidate
                );

              const existing =
                existingMap.get(key);

              if (existing) {
                generated.push({
                  ...existing,

                  color:
                    candidate.color,

                  colorHex:
                    candidate.colorHex,

                  size:
                    candidate.size,
                });

                return;
              }

              const index =
                generated.length;

              generated.push({
                color:
                  candidate.color,

                colorHex:
                  candidate.colorHex,

                size:
                  candidate.size,

                weight: "",

                price: "",

                discountPrice:
                  "",

                stockQuantity: 0,

                sku: generateSku(
                  previous.name,
                  candidate,
                  index
                ),

                images: [],
              });
            }
          );
        }
      );

      return {
        ...previous,
        variants: generated,
      };
    });
  };

  /* =========================================================
     VARIANT IMAGE
  ========================================================= */

  const uploadVariantImage =
    async (index, file) => {
      if (!file) {
        return;
      }

      try {
        const url =
          await uploadFile(
            file,
            "products/variants"
          );

        if (!url) {
          return;
        }

        setForm((previous) => ({
          ...previous,

          variants:
            previous.variants.map(
              (variant, i) =>
                i === index
                  ? {
                      ...variant,

                      images: [
                        ...(variant.images ||
                          []),

                        {
                          url,
                          altText:
                            `${previous.name} ${variant.color} ${variant.size}`.trim(),

                          sortOrder:
                            (
                              variant.images ||
                              []
                            ).length,
                        },
                      ],
                    }
                  : variant
            ),
        }));
      } catch (err) {
        console.error(err);

        alert(
          err?.response?.data
            ?.message ||
            "Variant image upload failed."
        );
      }
    };

  const removeVariantImage = (
    variantIndex,
    imageIndex
  ) => {
    setForm((previous) => ({
      ...previous,

      variants:
        previous.variants.map(
          (variant, index) => {
            if (
              index !==
              variantIndex
            ) {
              return variant;
            }

            return {
              ...variant,

              images:
                (
                  variant.images ||
                  []
                ).filter(
                  (_, i) =>
                    i !==
                    imageIndex
                ),
            };
          }
        ),
    }));
  };


const getColorImages = (colorName) => {
  const variant = form.variants.find(
    (item) =>
      normalize(item.color) === normalize(colorName) &&
      item.images?.length
  );

  return variant?.images || [];
};

const uploadColorMedia = async (color, fileList) => {
  const files = Array.from(fileList || []);

  if (!files.length) return;

  try {
    const uploadedImages = [];

    for (const file of files) {
      const url = await uploadFile(
        file,
        "products/variants"
      );

      if (!url) continue;

      uploadedImages.push({
        url,
        altText: `${form.name} ${color.name}`.trim(),
        sortOrder: uploadedImages.length,
      });
    }

    if (!uploadedImages.length) return;

    setForm((previous) => ({
      ...previous,

      variants: previous.variants.map((variant) => {
        if (
          normalize(variant.color) !==
          normalize(color.name)
        ) {
          return variant;
        }

        const currentImages =
          variant.images || [];

        return {
          ...variant,

          images: [
            ...currentImages,

            ...uploadedImages.map(
              (image, index) => ({
                ...image,

                sortOrder:
                  currentImages.length +
                  index,
              })
            ),
          ],
        };
      }),
    }));
  } catch (err) {
    console.error(err);

    alert(
      err?.response?.data?.message ||
        err?.message ||
        "Variant media upload failed."
    );
  }
};

const removeColorMedia = (
  colorName,
  imageIndex
) => {
  setForm((previous) => ({
    ...previous,

    variants: previous.variants.map(
      (variant) => {
        if (
          normalize(variant.color) !==
          normalize(colorName)
        ) {
          return variant;
        }

        return {
          ...variant,

          images: (
            variant.images || []
          )
            .filter(
              (_, index) =>
                index !== imageIndex
            )
            .map((image, index) => ({
              ...image,
              sortOrder: index,
            })),
        };
      }
    ),
  }));
};

const makeColorMediaPrimary = (
  colorName,
  imageIndex
) => {
  setForm((previous) => ({
    ...previous,

    variants: previous.variants.map(
      (variant) => {
        if (
          normalize(variant.color) !==
          normalize(colorName)
        ) {
          return variant;
        }

        const images = [
          ...(variant.images || []),
        ];

        const [selected] =
          images.splice(imageIndex, 1);

        if (selected) {
          images.unshift(selected);
        }

        return {
          ...variant,

          images: images.map(
            (image, index) => ({
              ...image,
              sortOrder: index,
            })
          ),
        };
      }
    ),
  }));
};

  /* =========================================================
     TAGS
  ========================================================= */

  const toggleTag = (tagId) => {
    setForm((previous) => {
      const exists =
        previous.tagIds.includes(
          tagId
        );

      return {
        ...previous,

        tagIds: exists
          ? previous.tagIds.filter(
              (id) =>
                id !== tagId
            )
          : [
              ...previous.tagIds,
              tagId,
            ],
      };
    });
  };

  /* =========================================================
     PAYLOAD
  ========================================================= */

  const buildVariantPayload = (
    variant,
    index
  ) => {
    const price =
      numberOrNull(
        variant.price
      );

    const sellingPrice =
      numberOrNull(
        variant.discountPrice
      );

    const stock =
      numberOrNull(
        variant.stockQuantity
      );

    if (
      price === null ||
      price <= 0
    ) {
      throw new Error(
        `Variant ${
          index + 1
        }: MRP must be greater than 0.`
      );
    }

    if (
      sellingPrice !== null &&
      sellingPrice <= 0
    ) {
      throw new Error(
        `Variant ${
          index + 1
        }: Selling price must be greater than 0.`
      );
    }

    if (
      sellingPrice !== null &&
      sellingPrice > price
    ) {
      throw new Error(
        `Variant ${
          index + 1
        }: Selling price cannot be greater than MRP.`
      );
    }

    if (
      stock === null ||
      stock < 0
    ) {
      throw new Error(
        `Variant ${
          index + 1
        }: Stock is invalid.`
      );
    }

    const sku =
      String(
        variant.sku ||
          generateSku(
            form.name,
            variant,
            index
          )
      )
        .trim()
        .toUpperCase();

    return {
      weight:
        variant.weight ||
        null,

      size:
        variant.size ||
        null,

      color:
        variant.color ||
        null,

      colorHex:
        variant.colorHex ||
        null,

      colorImageUrl:
        variant.images?.[0]
          ?.url || null,

      price,

      discountPrice:
        sellingPrice,

      stockQuantity:
        stock,

      sku,

      images:
        (
          variant.images ||
          []
        ).map(
          (image, imageIndex) => ({
            url: image.url,

            altText:
              image.altText ||
              null,

            sortOrder:
              image.sortOrder ??
              imageIndex,
          })
        ),
    };
  };

  const buildPayload = () => {
    const name =
      form.name.trim();

    if (!name) {
      throw new Error(
        "Product title is required."
      );
    }

    if (
      !form.categoryId
    ) {
      throw new Error(
        "Category is required."
      );
    }

    if (
      !form.variants.length
    ) {
      throw new Error(
        "Generate at least one variant."
      );
    }

    const variants =
      form.variants.map(
        buildVariantPayload
      );

    const skuSet =
      new Set();

    variants.forEach(
      (variant) => {
        const sku =
          normalize(
            variant.sku
          );

        if (
          skuSet.has(sku)
        ) {
          throw new Error(
            `Duplicate SKU: ${variant.sku}`
          );
        }

        skuSet.add(sku);
      }
    );

    return {
      name,

      slug: slugify(
        form.slug || name
      ),

      description:
        form.description ||
        null,

      productType:
        form.productType ||
        "clothing",

      isActive:
        !!form.isActive,

      categoryId:
        Number(
          form.categoryId
        ),

      subCategoryId:
        form.subCategoryId
          ? Number(
              form.subCategoryId
            )
          : null,

      imageUrl:
        form.imageUrl ||
        form.images.find(
          (image) =>
            image.isMain
        )?.url ||
        form.images[0]?.url ||
        null,

      shortDescriptionHtml:
        form.shortDescriptionHtml ||
        null,

      apContentHtml:
        form.apContentHtml ||
        null,

      apContentImageUrl:
        form.apContentImageUrl ||
        null,

      apContentVideoUrl:
        form.apContentVideoUrl ||
        null,

      tagIds:
        form.tagIds,

      images:
        form.images.map(
          (image, index) => ({
            url: image.url,

            altText:
              image.altText ||
              null,

            sortOrder:
              image.sortOrder ??
              index,

            isMain:
              !!image.isMain,
          })
        ),

      variants,
    };
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const onSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload =
        buildPayload();

      /* =====================================================
         CREATE
      ===================================================== */

      if (mode !== "edit") {
        await productService.create(
          payload
        );

        navigate("/products");

        return;
      }

      /* =====================================================
         UPDATE PRODUCT
      ===================================================== */

      const productPayload = {
        name:
          payload.name,

        slug:
          payload.slug,

        description:
          payload.description,

        imageUrl:
          payload.imageUrl,

        isActive:
          payload.isActive,

        productType:
          payload.productType,

        categoryId:
          payload.categoryId,

        subCategoryId:
          payload.subCategoryId,

        shortDescriptionHtml:
          payload.shortDescriptionHtml,

        apContentHtml:
          payload.apContentHtml,

        apContentImageUrl:
          payload.apContentImageUrl,

        apContentVideoUrl:
          payload.apContentVideoUrl,

        tagIds:
          payload.tagIds,

        images:
          payload.images,
      };

      await productService.update(
        productId,
        productPayload
      );

      /* =====================================================
         SYNC VARIANTS
      ===================================================== */

      const existingResponse =
        await productService.getVariants(
          productId
        );

      const existingVariants =
        existingResponse?.data?.data ||
        [];

      const existingMap =
        new Map(
          existingVariants.map(
            (variant) => [
              Number(variant.id),
              variant,
            ]
          )
        );

      for (
        let index = 0;
        index <
        form.variants.length;
        index += 1
      ) {
        const variant =
          form.variants[index];

        const cleanVariant =
          buildVariantPayload(
            variant,
            index
          );

        if (variant.id) {
          await productService.updateVariant(
            productId,
            variant.id,
            cleanVariant
          );

          existingMap.delete(
            Number(
              variant.id
            )
          );
        } else {
          await productService.addVariant(
            productId,
            cleanVariant
          );
        }
      }

      /* =====================================================
         DELETE REMOVED VARIANTS
      ===================================================== */

      for (const [
        variantId,
      ] of existingMap) {
        await productService.deleteVariant(
          productId,
          variantId
        );
      }

      navigate("/products");
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          "Failed to save product."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6f7] p-6">
        <div className="max-w-7xl mx-auto">
          Loading product...
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      <form onSubmit={onSubmit}>
        {/* ===============================================
            HEADER
        =============================================== */}

        <div className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/products"
                  )
                }
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {mode ===
                  "edit"
                    ? form.name ||
                      "Edit product"
                    : "Add product"}
                </h1>

                {mode ===
                  "edit" && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Product #
                    {productId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===============================================
            CONTENT
        =============================================== */}

        <main className="max-w-7xl mx-auto px-6 py-6 pb-28">
          {error && (
            <div className="mb-5 border border-red-200 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {uploading && (
            <div className="mb-5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl px-4 py-3 text-sm">
              Uploading media
              {uploadPct
                ? ` — ${uploadPct}%`
                : "..."}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5">
            {/* =========================================
                LEFT
            ========================================= */}

            <div className="space-y-5">
              {/* =======================================
                  BASIC INFORMATION
              ======================================= */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Title
                    </label>

                    <input
                      value={
                        form.name
                      }
                      onChange={(
                        event
                      ) => {
                        const name =
                          event
                            .target
                            .value;

                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            name,

                            slug:
                              previous.slug ||
                              slugify(
                                name
                              ),
                          })
                        );
                      }}
                      placeholder="e.g. Floral Cotton Dress"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Description
                    </label>

                    <RichTextEditor
                      value={
                        form.description
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "description",
                          value
                        )
                      }
                      folder="products/description"
                      placeholder="Describe your product..."
                    />
                  </div>
                </div>
              </section>

              {/* =======================================
                  MEDIA
              ======================================= */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-semibold text-gray-900">
                    Media
                  </h2>
                </div>

                <div className="p-5">
                  {form.images
                    .length >
                  0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {form.images.map(
                          (
                            image,
                            index
                          ) => (
                            <div
                              key={`${image.url}-${index}`}
                              className={`relative group rounded-xl border overflow-hidden bg-gray-50 ${
                                image.isMain
                                  ? "ring-2 ring-gray-900"
                                  : ""
                              }`}
                            >
                              <div className="aspect-square">
                                <img
                                  src={
                                    image.url
                                  }
                                  alt={
                                    image.altText ||
                                    ""
                                  }
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {image.isMain && (
                                <div className="absolute left-2 top-2 bg-gray-900 text-white text-[11px] px-2 py-1 rounded-md">
                                  Main
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  removeProductImage(
                                    index
                                  )
                                }
                                className="absolute right-2 top-2 p-1.5 bg-white shadow rounded-md opacity-0 group-hover:opacity-100 transition"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>

                              {!image.isMain && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    makeMainImage(
                                      index
                                    )
                                  }
                                  className="absolute bottom-2 left-2 right-2 bg-white/95 text-xs font-medium py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition"
                                >
                                  Set as main
                                </button>
                              )}
                            </div>
                          )
                        )}

                        <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                          <ImagePlus className="w-6 h-6 text-gray-500 mb-2" />

                          <span className="text-sm font-medium">
                            Add media
                          </span>

                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            hidden
                            disabled={
                              uploading
                            }
                            onChange={(
                              event
                            ) => {
                              uploadProductMedia(
                                event
                                  .target
                                  .files
                              );

                              event.target.value =
                                "";
                            }}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 rounded-xl min-h-[220px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Upload className="w-8 h-8 text-gray-400 mb-3" />

                      <span className="font-medium">
                        Upload product
                        media
                      </span>

                      <span className="text-sm text-gray-500 mt-1">
                        Add product
                        images
                      </span>

                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        hidden
                        disabled={
                          uploading
                        }
                        onChange={(
                          event
                        ) => {
                          uploadProductMedia(
                            event
                              .target
                              .files
                          );

                          event.target.value =
                            "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </section>

              {/* =======================================
                  PRODUCT OPTIONS
              ======================================= */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-semibold text-gray-900">
                    Product options
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Add colors and
                    sizes to automatically
                    create product
                    variants.
                  </p>
                </div>

                <div className="p-5 space-y-7">
                  {/* COLOR */}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">
                        Color
                      </label>

                      <span className="text-xs text-gray-500">
                        {
                          colors.length
                        }{" "}
                        values
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={
                          newColor.name
                        }
                        onChange={(
                          event
                        ) =>
                          setNewColor(
                            (
                              previous
                            ) => ({
                              ...previous,

                              name: event
                                .target
                                .value,
                            })
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            event.preventDefault();

                            addColor();
                          }
                        }}
                        placeholder="e.g. Blush Pink"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      />

                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={
                            newColor.hex
                          }
                          onChange={(
                            event
                          ) =>
                            setNewColor(
                              (
                                previous
                              ) => ({
                                ...previous,

                                hex: event
                                  .target
                                  .value,
                              })
                            )
                          }
                          className="w-12 h-10 border rounded-lg cursor-pointer p-1"
                        />

                        <button
                          type="button"
                          onClick={
                            addColor
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {colors.map(
                        (
                          color,
                          index
                        ) => (
                          <div
                            key={`${color.name}-${index}`}
                            className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white"
                          >
                            <span
                              className="w-5 h-5 rounded-full border border-gray-300"
                              style={{
                                backgroundColor:
                                  color.hex,
                              }}
                            />

                            <span className="text-sm">
                              {
                                color.name
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeColor(
                                  index
                                )
                              }
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {!colors.length && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {DEFAULT_COLORS.map(
                          (
                            color
                          ) => (
                            <button
                              key={
                                color.name
                              }
                              type="button"
                              onClick={() =>
                                setColors(
                                  (
                                    previous
                                  ) => [
                                    ...previous,
                                    color,
                                  ]
                                )
                              }
                              className="inline-flex items-center gap-2 text-xs border rounded-full px-2.5 py-1.5 hover:bg-gray-50"
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full border"
                                style={{
                                  backgroundColor:
                                    color.hex,
                                }}
                              />

                              {
                                color.name
                              }
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* SIZE */}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">
                        Size
                      </label>

                      <span className="text-xs text-gray-500">
                        {
                          sizes.length
                        }{" "}
                        values
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={
                          newSize
                        }
                        onChange={(
                          event
                        ) =>
                          setNewSize(
                            event
                              .target
                              .value
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            event.preventDefault();

                            addSize();
                          }
                        }}
                        placeholder="e.g. 2-3Y"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          addSize()
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {sizes.map(
                        (
                          size,
                          index
                        ) => (
                          <div
                            key={`${size}-${index}`}
                            className="inline-flex items-center gap-2 border rounded-lg px-3 py-2"
                          >
                            <span className="text-sm font-medium">
                              {size}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeSize(
                                  index
                                )
                              }
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {!sizes.length && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {DEFAULT_SIZES.map(
                          (
                            size
                          ) => (
                            <button
                              type="button"
                              key={
                                size
                              }
                              onClick={() =>
                                addSize(
                                  size
                                )
                              }
                              className="text-xs border rounded-full px-3 py-1.5 hover:bg-gray-50"
                            >
                              {size}
                            </button>
                          )
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={
                        generateVariants
                      }
                      className="mt-5 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium"
                    >
                      Generate variants
                    </button>
                  </div>
                </div>
              </section>

              {/* =======================================
                  VARIANTS
              ======================================= */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Variants
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {
                        form
                          .variants
                          .length
                      }{" "}
                      variants
                    </p>
                  </div>
                </div>

                {form.variants
                  .length ===
                0 ? (
                  <div className="p-10 text-center">
                    <div className="text-sm font-medium text-gray-700">
                      No variants
                      generated
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                      Add colors or
                      sizes above and
                      generate your
                      variants.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left font-medium px-4 py-3 min-w-[230px]">
                            Variant
                          </th>

                          <th className="text-left font-medium px-4 py-3">
                            MRP
                          </th>

                          <th className="text-left font-medium px-4 py-3">
                            Selling
                          </th>

                          <th className="text-left font-medium px-4 py-3">
                            Inventory
                          </th>

                          <th className="text-left font-medium px-4 py-3">
                            SKU
                          </th>

                          <th className="text-right font-medium px-4 py-3">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {form.variants.map(
                          (
                            variant,
                            index
                          ) => (
                            <tr
                              key={
                                variant.id ||
                                `${variant.color}-${variant.size}-${index}`
                              }
                              className="border-t border-gray-100"
                            >
                              {/* VARIANT */}

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-11 h-11 rounded-lg border bg-gray-50 overflow-hidden flex-shrink-0">
                                    {variant
                                      .images?.[0]
                                      ?.url ? (
                                      <img
                                        src={
                                          variant
                                            .images[0]
                                            .url
                                        }
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span
                                          className="w-6 h-6 rounded-full border"
                                          style={{
                                            backgroundColor:
                                              variant.colorHex ||
                                              "#ffffff",
                                          }}
                                        />
                                      </div>
                                    )}

                                  </div>

                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {[
                                        variant.color,
                                        variant.size,
                                      ]
                                        .filter(
                                          Boolean
                                        )
                                        .join(
                                          " / "
                                        ) ||
                                        "Default"}
                                    </div>

                                    {variant.color && (
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                        <span
                                          className="w-3 h-3 rounded-full border"
                                          style={{
                                            backgroundColor:
                                              variant.colorHex ||
                                              "#ffffff",
                                          }}
                                        />

                                        {
                                          variant.color
                                        }
                                      </div>
                                    )}


                                  </div>
                                </div>
                              </td>

                              {/* MRP */}

                              <td className="px-4 py-3">
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-gray-500">
                                    ₹
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      variant.price
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateVariant(
                                        index,
                                        "price",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    className="w-28 border rounded-lg pl-7 pr-2 py-1.5"
                                  />
                                </div>
                              </td>

                              {/* SELLING */}

                              <td className="px-4 py-3">
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-gray-500">
                                    ₹
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      variant.discountPrice ??
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateVariant(
                                        index,
                                        "discountPrice",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    className="w-28 border rounded-lg pl-7 pr-2 py-1.5"
                                  />
                                </div>
                              </td>

                              {/* STOCK */}

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    variant.stockQuantity
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateVariant(
                                      index,
                                      "stockQuantity",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  className="w-24 border rounded-lg px-3 py-1.5"
                                />
                              </td>

                              {/* SKU */}

                              <td className="px-4 py-3">
                                <input
                                  value={
                                    variant.sku
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateVariant(
                                      index,
                                      "sku",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="SKU"
                                  className="w-44 border rounded-lg px-3 py-1.5 font-mono text-xs"
                                />
                              </td>

                              {/* DELETE */}

                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setForm(
                                      (
                                        previous
                                      ) => ({
                                        ...previous,

                                        variants:
                                          previous.variants.filter(
                                            (
                                              _,
                                              i
                                            ) =>
                                              i !==
                                              index
                                          ),
                                      })
                                    )
                                  }
                                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>


{/* =========================================================
    COLOR / VARIANT MEDIA
========================================================= */}

{colors.length > 0 && (
  <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b">
      <h2 className="font-semibold text-gray-900">Variant media</h2>
      <p className="text-sm text-gray-500 mt-1">
        Upload images by color. Every size of the same color shares the same gallery, like Shopify variant media.
      </p>
    </div>

    <div className="p-5 space-y-4">
      {colors.map((color) => {
        const colorImages = getColorImages(color.name);

        return (
          <div key={color.name} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-7 w-7 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: color.hex || "#ffffff" }}
                />
                <div>
                  <div className="font-medium text-gray-900">{color.name}</div>
                  <div className="text-xs text-gray-500">
                    {colorImages.length} {colorImages.length === 1 ? "image" : "images"}
                  </div>
                </div>
              </div>

              <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                Add images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  disabled={uploading}
                  onChange={(event) => {
                    uploadColorMedia(color, event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className="p-4">
              {colorImages.length === 0 ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-gray-400 hover:bg-gray-50">
                  <ImagePlus className="mb-2 h-6 w-6 text-gray-400" />
                  <div className="text-sm font-medium text-gray-800">Add images for {color.name}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    These images appear when customers select {color.name}.
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={uploading}
                    onChange={(event) => {
                      uploadColorMedia(color, event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {colorImages.map((image, imageIndex) => (
                    <div
                      key={image.id || image.url || imageIndex}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                    >
                      <img
                        src={image.url}
                        alt={image.altText || `${color.name} ${imageIndex + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {imageIndex === 0 && (
                        <span className="absolute left-2 top-2 rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white">
                          Primary
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeColorMedia(color.name, imageIndex)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-white text-red-600 shadow opacity-0 transition group-hover:opacity-100"
                        aria-label={`Remove ${color.name} image ${imageIndex + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {imageIndex !== 0 && (
                        <button
                          type="button"
                          onClick={() => makeColorMediaPrimary(color.name, imageIndex)}
                          className="absolute bottom-2 left-2 right-2 rounded-md bg-white/95 px-2 py-1.5 text-xs font-medium text-gray-800 shadow opacity-0 transition group-hover:opacity-100"
                        >
                          Set as primary
                        </button>
                      )}
                    </div>
                  ))}

                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:bg-gray-50">
                    <ImagePlus className="h-5 w-5" />
                    <span className="mt-2 text-xs">Add media</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      disabled={uploading}
                      onChange={(event) => {
                        uploadColorMedia(color, event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </section>
)}
              {/* =======================================
                  ADDITIONAL CONTENT
              ======================================= */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-semibold">
                    Additional
                    product content
                  </h2>
                </div>

                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Short
                      description
                    </label>

                    <RichTextEditor
                      value={
                        form.shortDescriptionHtml
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "shortDescriptionHtml",
                          value
                        )
                      }
                      folder="products/short-description"
                      placeholder="Short product highlights..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Additional
                      content
                    </label>

                    <RichTextEditor
                      value={
                        form.apContentHtml
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "apContentHtml",
                          value
                        )
                      }
                      folder="products/ap-content"
                      placeholder="Additional product content..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Video URL
                    </label>

                    <input
                      value={
                        form.apContentVideoUrl
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "apContentVideoUrl",
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="https://..."
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </section>

              {/* =======================================
                  SEO / URL
              ======================================= */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-semibold">
                    Search engine
                    listing
                  </h2>
                </div>

                <div className="p-5">
                  <label className="block text-sm font-medium mb-1.5">
                    URL handle
                  </label>

                  <div className="flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-gray-900/10">
                    <span className="bg-gray-50 border-r px-3 py-2 text-sm text-gray-500">
                      /products/
                    </span>

                    <input
                      value={
                        form.slug
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "slug",
                          event
                            .target
                            .value
                        )
                      }
                      onBlur={() =>
                        setField(
                          "slug",
                          slugify(
                            form.slug ||
                              form.name
                          )
                        )
                      }
                      className="flex-1 px-3 py-2 outline-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* =========================================
                RIGHT SIDEBAR
            ========================================= */}

            <aside className="space-y-5">
              {/* STATUS */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-semibold">
                    Status
                  </h2>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        Active
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Product is
                        available on
                        the store.
                      </div>
                    </div>

                    <Toggle
                      checked={
                        !!form.isActive
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "isActive",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </section>

              {/* ORGANIZATION */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-semibold">
                    Product
                    organization
                  </h2>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Category
                    </label>

                    <select
                      value={
                        form.categoryId
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "categoryId",
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full border rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">
                        Select
                        category
                      </option>

                      {categories.map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              category.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Subcategory
                    </label>

                    <select
                      value={
                        form.subCategoryId
                      }
                      disabled={
                        !form.categoryId
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "subCategoryId",
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-50"
                    >
                      <option value="">
                        Select
                        subcategory
                      </option>

                      {filteredSubCategories.map(
                        (
                          subCategory
                        ) => (
                          <option
                            key={
                              subCategory.id
                            }
                            value={
                              subCategory.id
                            }
                          >
                            {
                              subCategory.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Product type
                    </label>

                    <input
                      value={
                        form.productType
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "productType",
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Clothing"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </section>

              {/* TAGS */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-semibold">
                    Tags
                  </h2>
                </div>

                <div className="p-5">
                  {tags.length ===
                  0 ? (
                    <p className="text-sm text-gray-500">
                      No tags
                      available.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map(
                        (tag) => {
                          const active =
                            form.tagIds.includes(
                              tag.id
                            );

                          return (
                            <button
                              type="button"
                              key={
                                tag.id
                              }
                              onClick={() =>
                                toggleTag(
                                  tag.id
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${
                                active
                                  ? "bg-gray-900 border-gray-900 text-white"
                                  : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              {active && (
                                <Check className="w-3 h-3" />
                              )}

                              {
                                tag.name
                              }
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* SUMMARY */}

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-semibold">
                    Product summary
                  </h2>
                </div>

                <div className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Media
                    </span>

                    <span className="font-medium">
                      {
                        form.images
                          .length
                      }
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Colors
                    </span>

                    <span className="font-medium">
                      {
                        colors.length
                      }
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Sizes
                    </span>

                    <span className="font-medium">
                      {
                        sizes.length
                      }
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Variants
                    </span>

                    <span className="font-medium">
                      {
                        form
                          .variants
                          .length
                      }
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </main>

        {/* ===============================================
            SAVE BAR
        =============================================== */}

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {mode === "edit"
                ? "Edit product and variants"
                : "Create a new product"}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/products"
                  )
                }
                disabled={
                  saving ||
                  uploading
                }
                className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Discard
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  uploading
                }
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : mode ===
                      "edit"
                    ? "Save"
                    : "Save product"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}