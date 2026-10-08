import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import mediaService from "../../services/mediaService";

// ✅ CKEditor upload adapter (uploads to your API -> Cloudinary)
class UploadAdapter {
  constructor(loader, folder = "products") {
    this.loader = loader;
    this.folder = folder;
  }

  upload() {
    return this.loader.file.then(async (file) => {
      const res = await mediaService.upload(file, { folder: this.folder, type: "IMAGE" });
      const uploaded = res?.data?.data;

      const url = uploaded?.secureUrl || uploaded?.url;
      if (!url) throw new Error("Upload failed: missing URL");

      return { default: url };
    });
  }

  abort() {}
}

function UploadPlugin(editor, folder) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    return new UploadAdapter(loader, folder);
  };
}

export default function CkEditor({ value, onChange, folder = "products" }) {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={value || ""}
      config={{
        extraPlugins: [(editor) => UploadPlugin(editor, folder)],
      }}
      onChange={(_, editor) => {
        const data = editor.getData();
        onChange?.(data);
      }}
    />
  );
}
