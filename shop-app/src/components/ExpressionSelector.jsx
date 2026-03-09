import { EXPRESSIONS } from '../data/assets';

export function ExpressionSelector({ selectedExpression, onExpressionChange, skinTone }) {
  return (
    <div className="expression-selector">
      <div className="expression-header">
        <span className="color-label">Expressions</span>
        <span className="new-badge">New</span>
      </div>
      <div className="expression-cards">
        {EXPRESSIONS.map(expression => (
          <button
            key={expression.id}
            className={`expression-card ${selectedExpression === expression.id ? 'active' : ''}`}
            onClick={() => onExpressionChange(expression.id)}
            title={expression.name}
            aria-label={`Select ${expression.name} expression`}
          >
            <div className="expression-preview">
              <img 
                src={expression.file} 
                alt={expression.name}
                className="expression-img"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

