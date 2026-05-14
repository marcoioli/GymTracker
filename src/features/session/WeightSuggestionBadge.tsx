import type { WeightSuggestion } from "../../domain/suggestions";

interface WeightSuggestionBadgeProps {
	suggestion: WeightSuggestion;
}

export function WeightSuggestionBadge({
	suggestion,
}: WeightSuggestionBadgeProps) {
	const { action, suggestedWeightKg } = suggestion;

	const modifierClass =
		action === "SUBIR"
			? "track-suggestion-badge--subir"
			: action === "BAJAR"
				? "track-suggestion-badge--bajar"
				: "track-suggestion-badge--mantener";

	const labelText =
		action === "SUBIR"
			? `Subir a ~${suggestedWeightKg} kg`
			: action === "BAJAR"
				? `Bajar a ~${suggestedWeightKg} kg`
				: `Mantener en ~${suggestedWeightKg} kg`;

	return (
		<div className={`track-suggestion-badge ${modifierClass}`}>
			<span className="track-suggestion-badge__icon">💡</span>
			<span className="track-suggestion-badge__text">{labelText}</span>
		</div>
	);
}
