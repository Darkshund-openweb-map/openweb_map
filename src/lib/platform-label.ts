const MAX_LABEL_WIDTH = 124;

function characterWidth(character: string): number {
  if (/\s/u.test(character)) return 3.5;
  if (/[\u1100-\u11ff\u2e80-\ua4cf\uac00-\ud7af\uf900-\ufaff]/u.test(character)) return 11.5;
  return /[MW@]/u.test(character) ? 10 : 7;
}

// 배치 간격과 SVG 클릭 영역에 동일한 글자 폭을 적용한다. 전체 이름은 title/aria-label에 유지한다.
export function platformLabel(name: string): { text: string; width: number } {
  const characters = Array.from(name);
  let text = '';
  let width = 16;
  for (let index = 0; index < characters.length; index += 1) {
    const nextWidth = characterWidth(characters[index]);
    const tail = index < characters.length - 1 ? 10 : 0;
    if (width + nextWidth + tail > MAX_LABEL_WIDTH) {
      text += '…';
      width += 10;
      break;
    }
    text += characters[index];
    width += nextWidth;
  }
  return { text, width: Math.max(32, width) };
}
