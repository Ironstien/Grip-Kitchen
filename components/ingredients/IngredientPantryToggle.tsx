import { InPantryToggle } from '@/components/ingredients/InPantryToggle';
import { useIngredientPantryStatus } from '@/hooks/usePantryMembership';

type IngredientPantryToggleProps = {
  ingredientId: string;
  compact?: boolean;
};

export function IngredientPantryToggle({
  ingredientId,
  compact = true,
}: IngredientPantryToggleProps) {
  const { inPantry, setInPantry, isToggling } = useIngredientPantryStatus(ingredientId);

  return (
    <InPantryToggle
      enabled={inPantry}
      onToggle={(enabled) => {
        void setInPantry(enabled);
      }}
      disabled={isToggling}
      compact={compact}
    />
  );
}
