import { useParams } from 'react-router-dom';

/**
 * Bracket View page component (placeholder)
 * Shows a shared bracket by year and UUID
 */
function BracketView() {
    const { year, uuid } = useParams();

    return (
        <div className="page-container">
            <h1>📋 Viewing Bracket</h1>
            <p>Year: {year}</p>
            <p>Bracket ID: {uuid}</p>
            <p>Shared bracket view - to be implemented</p>
        </div>
    );
}

export default BracketView;
