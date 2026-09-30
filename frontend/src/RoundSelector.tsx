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
                ? 'w-10 h-10 shrink-0 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center'
                : 'w-10 h-10 shrink-0 rounded-full text-gray-500 font-bold flex items-center justify-center hover:bg-gray-100'
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