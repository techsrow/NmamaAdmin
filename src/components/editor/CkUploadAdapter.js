import mediaService from "../../services/mediaService";

export default class CkUploadAdapter {
  constructor(loader, folder = "products") {
    this.loader = loader;
    this.folder = folder;
  }

  async upload() {
    const file = await this.loader.file;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", this.folder);

    const res = await mediaService.upload(fd); // uses /media/upload
    const uploaded = res?.data?.data;

    const url = uploaded?.secureUrl || uploaded?.url;
    if (!url) throw new Error("Upload failed: missing URL");

    // CKEditor expects { default: "imageUrl" }
    return { default: url };
  }

  abort() {
    // optional
  }
}
