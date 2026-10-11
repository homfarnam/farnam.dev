import { useLoader } from "@react-three/fiber";
import { FileLoader } from "three";

/**
 * Reader for the binary containers written by scripts/bake-geo.mjs:
 * [u32 headerLength][JSON header][padding][buffers…]. Loaded through
 * useLoader so it suspends and is cached by URL.
 */
interface BufferInfo {
  offset: number;
  length: number;
  type: "Int16Array" | "Uint8Array" | "Uint32Array" | "Float32Array";
}

type TypedArrayFor<T extends BufferInfo["type"]> = T extends "Int16Array"
  ? Int16Array
  : T extends "Uint8Array"
    ? Uint8Array
    : T extends "Uint32Array"
      ? Uint32Array
      : Float32Array;

const CONSTRUCTORS = { Int16Array, Uint8Array, Uint32Array, Float32Array } as const;

export interface GeoContainer<H> {
  header: H & { buffers: Record<string, BufferInfo> };
  get<T extends BufferInfo["type"]>(key: string, type: T): TypedArrayFor<T>;
}

export function parseContainer<H>(data: ArrayBuffer): GeoContainer<H> {
  const view = new DataView(data);
  const jsonLength = view.getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 4, jsonLength))) as GeoContainer<H>["header"];
  const start = Math.ceil((jsonLength + 4) / 4) * 4;
  return {
    header,
    get(key, type) {
      const info = header.buffers[key];
      if (!info || info.type !== type) throw new Error(`Missing ${type} buffer "${key}"`);
      return new CONSTRUCTORS[type](data, start + info.offset, info.length) as TypedArrayFor<typeof type>;
    },
  };
}

export function useGeoBinary(url: string): ArrayBuffer {
  return useLoader(FileLoader, url, (loader) => {
    loader.setResponseType("arraybuffer");
  }) as unknown as ArrayBuffer;
}

export interface MapHeader {
  width: number;
  height: number;
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number };
}

export interface CityHeader {
  id: string;
  name: string;
  radius: number;
  quant: number;
  waterSize: number;
}
