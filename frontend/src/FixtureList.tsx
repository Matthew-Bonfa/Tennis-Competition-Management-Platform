import { useState, useEffect } from "react";
import fetchApi from './api'
import FixtureCard from './FixtureCard'

interface FixtureListProps {
    sectionId: string | undefined;
    round: string | null;
}

function FixtureList({ sectionId, round }: FixtureListProps) {
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (round === null) {
            return;
        }

        setLoading(true);
        setError(false);

        fetchApi(`/fixtures?sectionId=${sectionId}&round=${round}`)
            .then(setFixtures)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [sectionId, round]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="text-red-600 px-4">Failed to load fixtures.</p>;
    }

    return (
        <div className="px-4 pb-8">
            {fixtures.map((fixture) => (
                <FixtureCard key={fixture.matchId} fixture={fixture} />
            ))}
        </div>
    );
}

export default FixtureList;
