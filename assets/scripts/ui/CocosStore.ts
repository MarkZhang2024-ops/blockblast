import { sys } from 'cc';
import type { KeyValueStore } from '../core/Storage';

/** Cocos 本地存储适配。算法和存档结构不依赖引擎 API。 */
export class CocosStore implements KeyValueStore {
  get(key: string): string | null {
    const value = sys.localStorage.getItem(key);
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  }

  set(key: string, value: string): void {
    sys.localStorage.setItem(key, value);
  }

  remove(key: string): void {
    sys.localStorage.removeItem(key);
  }
}
