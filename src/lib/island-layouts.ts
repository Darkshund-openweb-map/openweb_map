import type { Category } from './ecosystem-types';

type IslandLayout = Omit<Category, 'name' | 'description' | 'count' | 'sourceId'>;

// DB의 island.id에 대응하는 지도 표현 설정. 섬 목록과 이름은 DB 응답이 결정한다.
export const islandLayouts: Readonly<Record<number, IslandLayout>> = {
  1: {
    id: 'code',
    color: '#447aff',
    light: '#edf3ff',
    badge: [245, 115],
    center: [245, 212],
    rows: [5, 7, 8, 9, 10, 9, 8, 7, 5],
  },
  2: {
    id: 'marketplace',
    color: '#ecbb21',
    light: '#fff8dd',
    badge: [409, 75],
    center: [408, 124],
    rows: [3, 4, 5, 4, 3],
  },
  3: {
    id: 'text',
    color: '#2cbfaf',
    light: '#e7f8f7',
    badge: [555, 99],
    center: [555, 192],
    rows: [3, 5, 7, 8, 8, 7, 6, 5, 3],
  },
  4: {
    id: 'backend',
    color: '#38cb6e',
    light: '#eaf9f0',
    badge: [405, 282],
    center: [404, 329],
    rows: [2, 3, 2],
  },
  6: {
    id: 'official',
    color: '#976cf7',
    light: '#f3eeff',
    badge: [419, 433],
    center: [417, 497],
    rows: [2, 3, 4, 3, 2],
  },
  7: {
    id: 'files',
    color: '#4cc4f9',
    light: '#eaf8ff',
    badge: [247, 375],
    center: [239, 445],
    rows: [2, 3, 4, 5, 4, 4],
  },
  8: {
    id: 'community',
    color: '#fa812d',
    light: '#fff0e7',
    badge: [584, 349],
    center: [582, 425],
    rows: [3, 5, 6, 6, 5, 4, 3],
  },
};
