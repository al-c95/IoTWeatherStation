import React from 'react';
import './Panel.css';

function Panel({title, value, extras = {} }) {
    return (
        <div className="panel">
            <h2>{title}</h2>
            <p className="value">{value}</p>

            {Object.keys(extras).length > 0 && (
                <div className="panel-extras">
                    {Object.entries(extras).map(([label, val]) => (
                        <p key={label}>
                            {label}: {val ?? '-'}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Panel;