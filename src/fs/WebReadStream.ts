import { AbstractReadStream, OpenOptions } from "isomorphic-fs";
import { toArrayBuffer } from "../util/buffer";
import { WebFile } from "./WebFile";

export class WebReadStream extends AbstractReadStream {
  constructor(private wf: WebFile, options: OpenOptions) {
    super(wf, options);
  }

  public async _close(): Promise<void> {
    this.wf._close();
  }

  public async _read(size?: number): Promise<ArrayBuffer> {
    const file = await this.wf._open();
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
}
