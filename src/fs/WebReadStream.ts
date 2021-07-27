import { AbstractReadStream, OpenOptions, util } from "isomorphic-fs";
import { toArrayBuffer } from "../util/buffer";
import { WebFile } from "./WebFile";
import { convertError } from "./WebFileSystem";

export class WebReadStream extends AbstractReadStream {
  private file?: File;

  constructor(private wf: WebFile, options: OpenOptions) {
    super(wf, options);
  }

  public async _close(): Promise<void> {
    this._dispose();
  }

  public async _read(size?: number): Promise<ArrayBuffer> {
    const file = await this._open();
    let blob: Blob;
    if (size == null) {
      blob = file.slice(this.position, this.position + this.bufferSize);
    } else {
      blob = file.slice(this.position, this.position + size);
    }
    this.position += blob.size;
    const buffer = await toArrayBuffer(blob);
    return buffer;
  }

  protected async _seek(start: number): Promise<void> {
    this.position = start;
  }

  private _dispose() {
    if (!this.file) {
      return;
    }

    this.file = undefined;
  }

  private _open(): Promise<File> {
    return new Promise<File>(async (resolve, reject) => {
      if (this.file) {
        resolve(this.file);
        return;
      }
      const wf = this.wf;
      const wfs = wf.wfs;
      const repository = wfs.repository;
      const path = wf.path;
      const handle = (err: FileError) =>
        reject(convertError(repository, path, err));
      const fullPath = util.joinPaths(repository, path);
      const fs = await wfs._getFS();
      fs.root.getFile(
        fullPath,
        { create: false },
        (entry) => {
          entry.file((file) => {
            this.file = file;
            resolve(this.file);
          }, handle);
        },
        handle
      );
    });
  }
}
