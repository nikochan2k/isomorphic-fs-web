import {
  AbortError,
  AbstractWriteStream,
  NoModificationAllowedError,
  OpenWriteOptions,
  util,
} from "isomorphic-fs";
import { toArrayBuffer } from "isomorphic-fs/lib/util";
import { WebFile } from "./WebFile";
import { convertError } from "./WebFileSystem";

export class WebWriteStream extends AbstractWriteStream {
  private writer?: FileWriter;

  constructor(private wf: WebFile, options: OpenWriteOptions) {
    super(wf, options);
  }

  public async _close(): Promise<void> {
    this.writer = undefined;
    this.position = 0;
  }

  public async _truncate(size: number): Promise<void> {
    await this._process(
      (writer) => writer.truncate(size),
      () => {
        this.position = 0;
      }
    );
  }

  public async _write(buffer: ArrayBuffer | Uint8Array): Promise<void> {
    await this._process(
      (writer) => {
        const ab = toArrayBuffer(buffer);
        const blob = new Blob([ab]);
        writer.write(blob);
      },
      () => {
        this.position += buffer.byteLength;
      }
    );
  }

  protected async _seek(start: number): Promise<void> {
    await this._process(
      (writer) => writer.seek(start),
      () => {
        this.position = start;
      }
    );
  }

  private async _getWriter(): Promise<FileWriter> {
    if (this.writer != null) {
      return this.writer;
    }

    const wf = this.wf;
    const repository = wf.fs.repository;
    const path = wf.path;
    const fullPath = util.joinPaths(repository, path);
    const fs = await this.wf.wfs._getFS();
    return new Promise<FileWriter>((resolve, reject) => {
      const handle = (err: FileError) =>
        reject(convertError(repository, path, err));
      fs.root.getFile(
        fullPath,
        { create: true },
        (entry) =>
          entry.createWriter(async (writer) => {
            if (this.options.append) {
              const stats = await wf.head();
              const size = stats.size as number;
              writer.seek(size);
              this.position = size;
              resolve(writer);
            } else {
              const removeEvents = () => {
                writer.onabort = undefined as any;
                writer.onerror = undefined as any;
                writer.onwriteend = undefined as any;
              };
              writer.onabort = (ev) => {
                removeEvents();
                reject(new AbortError(repository, path, ev));
              };
              writer.onerror = (ev) => {
                removeEvents();
                reject(new NoModificationAllowedError(repository, path, ev));
              };
              writer.onwriteend = () => {
                removeEvents();
                resolve(writer);
              };
              writer.truncate(0);
            }
          }, handle),
        handle
      );
    });
  }

  private async _process(
    handle: (writer: FileWriter) => void,
    onWriteEnd: () => void
  ) {
    const writer = await this._getWriter();
    return new Promise<void>((resolve, reject) => {
      const wf = this.wf;
      const repository = wf.fs.repository;
      const path = wf.path;
      writer.onabort = (ev) => reject(new AbortError(repository, path, ev));
      writer.onerror = (ev) =>
        reject(new NoModificationAllowedError(repository, path, ev));
      writer.onwriteend = () => {
        onWriteEnd();
        resolve();
      };
      handle(writer);
    });
  }
}
