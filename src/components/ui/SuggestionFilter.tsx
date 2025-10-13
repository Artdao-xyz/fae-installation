export function SuggestionFilter() {

        const suggestions = [
                "Advanced Production Capabilites",
                "New Systems of Measurement",
        ];
  return (
        <div className="flex items-center gap-2">
                <span className="text-black/60 text-xs">Suggestions:</span>
                <ul className="flex gap-2">
                        {suggestions.map((suggestion, index) => (
                                <>
                                <button className="text-black/40 cursor-pointer">
                                        {suggestion}
                                </button>
                                {index < suggestions.length - 1 && <span className="text-black/40"> / </span>}
                                </>
                        ))}
                </ul>
        </div>
  );
}