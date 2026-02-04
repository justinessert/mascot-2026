import { useParams } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';

/**
 * Bracket Display page component (placeholder)
 * Shows bracket for a specific region
 */
function BracketDisplay(): React.ReactElement {
    const { region } = useParams<{ region: string }>();
    useTitle(`${region ? region.charAt(0).toUpperCase() + region.slice(1) : ''} Region`);

    return (
        <div className="page-container">
            <h1>📊 {region ? region.charAt(0).toUpperCase() + region.slice(1) : ''} Region Bracket</h1>
            <p>Regional bracket display - to be implemented</p>
        </div>
    );
}

export default BracketDisplay;
