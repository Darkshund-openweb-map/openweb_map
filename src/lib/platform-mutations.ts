import type { EcosystemSnapshot, Platform } from './ecosystem-types';

export function validatePlatform(platform: Platform, snapshot: EcosystemSnapshot): Platform {
  const name = platform.name.trim();
  const description = platform.description.trim();
  if (!name || name.length > 40) throw new Error('플랫폼 이름은 1~40자로 입력해 주세요.');
  if (description.length > 500) throw new Error('설명은 500자 이하로 입력해 주세요.');
  if (!snapshot.categories.some((category) => category.id === platform.category)) {
    throw new Error('플랫폼 유형을 선택해 주세요.');
  }
  if (
    snapshot.platforms.some(
      (item) => item.id !== platform.id && item.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    throw new Error('같은 이름의 플랫폼이 이미 있습니다.');
  }
  let domain: string;
  try {
    const raw = platform.domain.trim();
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname.includes('.') ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw new Error();
    domain = url.hostname;
  } catch {
    throw new Error('도메인은 example.com 형식으로 입력해 주세요.');
  }
  return { ...platform, name, domain, description };
}

export function removePlatformData(snapshot: EcosystemSnapshot, id: string): EcosystemSnapshot {
  const platform = snapshot.platforms.find((item) => item.id === id);
  if (!platform) return snapshot;
  const removedEvents = snapshot.events.filter((event) => event.platform === id);
  return {
    ...snapshot,
    platforms: snapshot.platforms.filter((item) => item.id !== id),
    events: snapshot.events.filter((event) => event.platform !== id),
    relations: snapshot.relations.filter(
      (relation) => relation.source !== id && relation.target !== id,
    ),
    categories: snapshot.categories.map((category) =>
      category.id === platform.category
        ? { ...category, count: Math.max(0, category.count - removedEvents.length) }
        : category,
    ),
    exposureRows: snapshot.exposureRows.map((row) => ({
      ...row,
      count: Math.max(
        0,
        row.count - removedEvents.filter((event) => event.exposures.includes(row.name)).length,
      ),
    })),
  };
}

export function replacePlatformData(
  snapshot: EcosystemSnapshot,
  platform: Platform,
): EcosystemSnapshot {
  const original = snapshot.platforms.find((item) => item.id === platform.id);
  if (!original) throw new Error('수정할 플랫폼을 찾을 수 없습니다.');
  const eventCount = snapshot.events.filter((event) => event.platform === platform.id).length;
  return {
    ...snapshot,
    platforms: snapshot.platforms.map((item) => (item.id === platform.id ? platform : item)),
    categories: snapshot.categories.map((category) => {
      if (original.category === platform.category) return category;
      if (category.id === original.category)
        return { ...category, count: Math.max(0, category.count - eventCount) };
      if (category.id === platform.category)
        return { ...category, count: category.count + eventCount };
      return category;
    }),
  };
}
