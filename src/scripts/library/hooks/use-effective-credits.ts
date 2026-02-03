import { useAuth } from "../../modules/access-manager/auth.hook";
import { useGetPurchases } from "../../../services/get-purchases.service";
import { useGetUserCreditLimits } from "../../../services/get-user-credit-limits.service";

type UnitType = "PROPERTY_VALUATION" | "RESIDENT_SEARCH" | "RADARS";

interface EffectiveCredits {
  remaining: number;
  total: number;
  consumed: number;
  hasIndividualLimit: boolean;
  isLoading: boolean;
}

/**
 * Hook que retorna os créditos efetivos do usuário logado para um tipo de unidade.
 * Se o usuário tem limite individual definido, retorna dados do limite.
 * Se não tem limite, retorna os créditos da conta (comportamento padrão).
 */
export function useEffectiveCredits(unitType: UnitType): EffectiveCredits {
  const auth = useAuth();
  const userId = auth.store.user?.id;

  const { data: purchases, isLoading: isLoadingPurchases } = useGetPurchases();
  const { data: userLimits, isLoading: isLoadingLimits } =
    useGetUserCreditLimits(userId);

  const isLoading = isLoadingPurchases || isLoadingLimits;

  // Verifica se o usuário tem limite individual para este tipo
  const userLimit = userLimits?.find((l) => l.unitType === unitType);

  if (userLimit) {
    // Usuário tem limite individual - usar dados do limite
    return {
      remaining: userLimit.remaining,
      total: userLimit.limitAmount,
      consumed: userLimit.totalConsumed,
      hasIndividualLimit: true,
      isLoading,
    };
  }

  // Usuário não tem limite individual - usar créditos da conta
  const accountCredits = purchases?.[0]?.remainingUnits?.find(
    (u) => u.type === unitType
  );
  const accountRemaining = accountCredits?.unitsRemaining || 0;

  return {
    remaining: accountRemaining,
    total: accountRemaining,
    consumed: 0,
    hasIndividualLimit: false,
    isLoading,
  };
}

/**
 * Versão do hook que retorna ambos os tipos de crédito de uma vez.
 */
export function useAllEffectiveCredits(): {
  propertyValuation: EffectiveCredits;
  residentSearch: EffectiveCredits;
  radars: EffectiveCredits;
} {
  return {
    propertyValuation: useEffectiveCredits("PROPERTY_VALUATION"),
    residentSearch: useEffectiveCredits("RESIDENT_SEARCH"),
    radars: useEffectiveCredits("RADARS"),
  };
}
