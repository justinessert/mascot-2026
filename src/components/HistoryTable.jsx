import { useNavigate } from 'react-router-dom';
import './HistoryTable.css';

function HistoryTable({ data, title, loading, emptyMessage, onAction, actionLabel }) {
    const navigate = useNavigate();

    return (
        <div className="history-table-container">
            <h3>{title}</h3>
            {loading && <div className="loading-text">Loading history...</div>}

            {!loading && data.length === 0 && (
                <div className="empty-state">
                    <p className="no-history">{emptyMessage}</p>
                    {onAction && actionLabel && (
                        <button onClick={onAction} className="create-bracket-btn">
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}

            {!loading && data.length > 0 && (
                <div className="table-wrapper">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th>Champion</th>
                                <th>Bracket Name</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((bracket) => (
                                <tr
                                    key={bracket.year}
                                    onClick={() => navigate(`/bracket/${bracket.year}/${bracket.bracketId}`, { state: { from: 'profile' } })}
                                    className="clickable"
                                >
                                    <td className="year-cell">{bracket.year}</td>
                                    <td className="champion-cell">
                                        {bracket.champion?.image && (
                                            <img src={bracket.champion.image} alt={bracket.champion.name} />
                                        )}
                                    </td>
                                    <td>{bracket.bracketName}</td>
                                    <td className="score-cell">{bracket.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default HistoryTable;
