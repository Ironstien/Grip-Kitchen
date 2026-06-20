import {
  AUSTRALIAN_CONVERSION_SUGGESTIONS,
  type ConversionSuggestion,
} from '@/constants/australianConversionSuggestions';
import { isMasterUnitSymbol } from '@/lib/units';

export type { ConversionSuggestion };

type DraftLike = {
  from_unit: string;
  to_unit: string;
  factor: string;
};

function isEmptyDraft(draft: DraftLike): boolean {
  return !draft.from_unit.trim() && !draft.to_unit.trim() && !draft.factor.trim();
}

function hasRule(drafts: DraftLike[], fromUnit: string, toUnit: string): boolean {
  return drafts.some(
    (draft) =>
      !isEmptyDraft(draft) && draft.from_unit === fromUnit && draft.to_unit === toUnit,
  );
}

function relevanceScore(
  suggestion: ConversionSuggestion,
  stockUnit: string,
  purchaseUnit: string,
): number {
  const units = [stockUnit, purchaseUnit];

  if (units.includes(suggestion.from_unit) || units.includes(suggestion.to_unit)) {
    return 2;
  }

  return 0;
}

export function getAvailableConversionSuggestions(
  drafts: DraftLike[],
  masterUnits: Array<{ symbol: string }>,
  stockUnit: string,
  purchaseUnit: string,
): ConversionSuggestion[] {
  return AUSTRALIAN_CONVERSION_SUGGESTIONS.filter((suggestion) => {
    if (
      !isMasterUnitSymbol(suggestion.from_unit, masterUnits) ||
      !isMasterUnitSymbol(suggestion.to_unit, masterUnits)
    ) {
      return false;
    }

    return !hasRule(drafts, suggestion.from_unit, suggestion.to_unit);
  }).sort((left, right) => {
    const scoreDelta =
      relevanceScore(right, stockUnit, purchaseUnit) - relevanceScore(left, stockUnit, purchaseUnit);

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return (
      AUSTRALIAN_CONVERSION_SUGGESTIONS.indexOf(left) -
      AUSTRALIAN_CONVERSION_SUGGESTIONS.indexOf(right)
    );
  });
}

export function suggestionToDraft(suggestion: ConversionSuggestion): DraftLike {
  return {
    from_unit: suggestion.from_unit,
    to_unit: suggestion.to_unit,
    factor: String(suggestion.factor),
  };
}
