import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import CkUploadAdapter from "./CkUploadAdapter";

export default function RichTextEditor({
  value,
  onChange,
  folder = "products",
  placeholder = "Write here...",
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <CKEditor
        editor={ClassicEditor}
        data={value || ""}
        config={{
          placeholder,
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "|",
            "blockQuote",
            "insertTable",
            "|",
            "imageUpload",
            "undo",
            "redo",
          ],
        }}
        onReady={(editor) => {
          editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
            return new CkUploadAdapter(loader, folder);
          };
        }}
        onChange={(_event, editor) => {
          const data = editor.getData();
          onChange?.(data);
        }}
      />
    </div>
  );
}
