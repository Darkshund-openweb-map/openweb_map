import { EXPOSURE_CATEGORIES } from '@/lib/exposure-categories';

export function ExposureCategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      노출 정보 유형
      <select required value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled>
          유형 선택
        </option>
        {value && !EXPOSURE_CATEGORIES.includes(value) && (
          <option value={value}>{value} (기존 분류)</option>
        )}
        {EXPOSURE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </label>
  );
}
