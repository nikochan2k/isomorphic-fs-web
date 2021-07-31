import { testAll } from "isomorphic-fs/lib/__tests__/basic";
import { WebFileSystem } from "../fs/WebFileSystem";

let fs = new WebFileSystem("/isomorphic-fs-test", 50 * 1024 * 1024);
testAll(fs);
