import api from "./api";

const safeProgress = (onProgress, e) => {
  if (typeof onProgress !== "function") return; // ✅ prevents crash
  if (!e || !e.total) return;
  const pct = Math.round((e.loaded * 100) / e.total);
  onProgress(pct);
};

const mediaService = {
  // GET /media?type=&folder=&search=&page=&limit=
  list: (params) => api.get("/media", { params }),

  // GET /media/:id
  get: (id) => api.get(`/media/${id}`),

  /**
   * Upload to /media/upload
   *
   * Supports:
   * 1) upload(formData, onProgress)
   * 2) upload(file, { folder, type, onProgress })
   */
  upload: (input, arg2) => {
    let formData;
    let onProgress;

    // Case 1: upload(FormData, onProgress)
    if (input instanceof FormData) {
      formData = input;
      onProgress = arg2;
    } else {
      // Case 2: upload(File, { folder, type, onProgress })
      const file = input;
      const opts = arg2 || {};
      onProgress = opts.onProgress;

      formData = new FormData();
      formData.append("file", file); // ✅ backend expects "file"
      if (opts.folder) formData.append("folder", opts.folder);
      if (opts.type) formData.append("type", opts.type);
    }

    return api.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => safeProgress(onProgress, e),
    });
  },

  // ✅ helper for categories
  uploadCategoryImage: (file, onProgress) => {
    return mediaService.upload(file, {
      folder: "categories",
      type: "IMAGE",
      onProgress,
    });
  },

  // ✅ helper for subcategories
  uploadSubCategoryImage: (file, onProgress) => {
    return mediaService.upload(file, {
      folder: "subcategories",
      type: "IMAGE",
      onProgress,
    });
  },

  // ✅ helper for products (main image)
  uploadProductMainImage: (file, onProgress) => {
    return mediaService.upload(file, {
      folder: "products/main",
      type: "IMAGE",
      onProgress,
    });
  },

  // ✅ helper for product gallery images
  uploadProductGalleryImage: (file, onProgress) => {
    return mediaService.upload(file, {
      folder: "products/gallery",
      type: "IMAGE",
      onProgress,
    });
  },

  // ✅ helper for variant images
  uploadVariantImage: (file, onProgress) => {
    return mediaService.upload(file, {
      folder: "products/variants",
      type: "IMAGE",
      onProgress,
    });
  },

  // ✅ helper for CKEditor inline images
  uploadEditorImage: (file, onProgress) => {
    return mediaService.upload(file, {
      folder: "products/editor",
      type: "IMAGE",
      onProgress,
    });
  },

  // DELETE /media/:id
  remove: (id) => api.delete(`/media/${id}`),
};

export default mediaService;
