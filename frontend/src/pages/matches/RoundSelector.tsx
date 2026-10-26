interface RoundSelectorProps {
    rounds: any[]
    activeRound: string | null;
    onChange: (roundNumber: number) => void;
}

function RoundSelector({ rounds, activeRound, onChange }: RoundSelectorProps) {
    return (
    <div className="flex gap-2 overflow-x-auto px-4 py-4">
      {rounds.map((round) => {
        const isActive = String(round.roundNumber) === activeRound;

        return (
          <button
            key={round.roundNumber}
            onClick={() => onChange(round.roundNumber)}
            aria-current={isActive ? 'page' : undefined}
            className={
              isActive
                ? 'w-11 h-11 shrink-0 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center'
                : 'w-11 h-11 shrink-0 rounded-full text-ink-subtle font-bold flex items-center justify-center hover:bg-muted'
            }
          >
            {round.label}
          </button>
        );
      })}
    </div>
  );
}

export default RoundSelector;