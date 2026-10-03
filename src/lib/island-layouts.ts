import type { Category } from './ecosystem-types';

type IslandLayout = Omit<Category, 'name' | 'description' | 'count' | 'sourceId'>;

// DB의 island.id에 대응하는 지도 표현 설정. 섬 목록과 이름은 DB 응답이 결정한다.
export const islandLayouts: Readonly<Record<number, IslandLayout>> = {
  1: {
    id: 'code',
    color: '#447aff',
    light: '#edf3ff',
    badge: [190, 123],
    center: [190, 220],
    rows: [5, 7, 8, 9, 10, 9, 8, 7, 5],
  },
  2: {
    id: 'marketplace',
    color: '#ecbb21',
    light: '#fff8dd',
    badge: [455, 51],
    center: [455, 105],
    rows: [3, 4, 5, 4, 3],
  },
  3: {
    id: 'text',
    color: '#2cbfaf',
    light: '#e7f8f7',
    badge: [720, 127],
    center: [720, 220],
    rows: [3, 5, 7, 8, 8, 7, 6, 5, 3],
  },
  4: {
    id: 'backend',
    color: '#38cb6e',
    light: '#eaf9f0',
    badge: [455, 303],
    center: [455, 350],
    rows: [2, 3, 2],
  },
  6: {
    id: 'official',
    color: '#976cf7',
    light: '#f3eeff',
    badge: [455, 506],
    center: [455, 570],
    rows: [2, 3, 4, 3, 2],
  },
  7: {
    id: 'files',
    color: '#4cc4f9',
    light: '#eaf8ff',
    badge: [190, 430],
    center: [190, 500],
    rows: [2, 3, 4, 5, 4, 4],
  },
  8: {
    id: 'community',
    color: '#fa812d',
    light: '#fff0e7',
    badge: [720, 424],
    center: [720, 500],
    rows: [3, 5, 6, 6, 5, 4, 3],
  },
};
