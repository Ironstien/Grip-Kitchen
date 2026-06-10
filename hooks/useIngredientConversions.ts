import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import {
  replaceIngredientConversions,
  type IngredientConversionInput,
} from '@/lib/services/ingredientConversions';

export function useIngredientConversionMutations() {
  const queryClient = useQueryClient();

  const replace = useMutation({
    mutationFn: ({
      ingredientId,
      conversions,
    }: {
      ingredientId: string;
      conversions: IngredientConversionInput[];
    }) => replaceIngredientConversions(ingredientId, conversions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  return { replace };
}
