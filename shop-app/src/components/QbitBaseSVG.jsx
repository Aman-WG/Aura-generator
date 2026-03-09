import { QBIT_SVG_PATHS, SKIN_TONES } from '../data/assets';

// Render only the body paths - the head/face will be rendered as a separate layer
// Body paths are indices 0-6 (body, shadows, small details)
// We exclude: Head (index 7), small detail (8), eyes (9, 10)
const BODY_PATH_INDICES = [0, 1, 2, 3, 4, 5, 6];
const HEAD_PATH_INDEX = 7;
const EYE_PATH_INDICES = [9, 10];

// Separate component that renders only the eyes
export function QbitEyesSVG() {
  const eyePaths = EYE_PATH_INDICES.map(i => QBIT_SVG_PATHS[i]).filter(Boolean);
  
  return (
    <svg 
      width="250" 
      height="414" 
      viewBox="0 0 250 414" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="qbit-eyes-svg"
    >
      {eyePaths.map((path, i) => (
        <path
          key={`eye-${i}`}
          d={path.d}
          fill="#202020"
          fillRule={path.fillRule}
          clipRule={path.fillRule}
        />
      ))}
    </svg>
  );
}

export function QbitBaseSVG({ skinTone = 'default', includeHead = false }) {
  const skinColor = SKIN_TONES.find(t => t.id === skinTone)?.color || '#E5E5E5';
  
  // Get body paths only
  const bodyPaths = BODY_PATH_INDICES.map(i => QBIT_SVG_PATHS[i]).filter(Boolean);
  
  // Optionally get head and eye paths
  const headPath = includeHead ? QBIT_SVG_PATHS[HEAD_PATH_INDEX] : null;
  const eyePaths = includeHead ? EYE_PATH_INDICES.map(i => QBIT_SVG_PATHS[i]).filter(Boolean) : [];
  
  return (
    <svg 
      width="250" 
      height="414" 
      viewBox="0 0 250 414" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="qbit-base-svg"
    >
      {/* Body paths (rendered first - back layer) */}
      {bodyPaths.map((path, i) => {
        let fill;
        let opacity;
        
        switch (path.type) {
          case 'skin':
            fill = skinColor;
            break;
          case 'shadow':
            fill = '#202020';
            opacity = path.opacity;
            break;
          default:
            fill = skinColor;
        }
        
        return (
          <path
            key={`body-${i}`}
            d={path.d}
            fill={fill}
            opacity={opacity}
            fillRule={path.fillRule}
            clipRule={path.fillRule}
          />
        );
      })}
      
      {/* Head path (optional) */}
      {headPath && (
        <path
          key="head"
          d={headPath.d}
          fill={skinColor}
          fillRule={headPath.fillRule}
          clipRule={headPath.fillRule}
        />
      )}
      
      {/* Eye paths (optional) */}
      {eyePaths.map((path, i) => (
        <path
          key={`eye-${i}`}
          d={path.d}
          fill="#202020"
          fillRule={path.fillRule}
          clipRule={path.fillRule}
        />
      ))}
    </svg>
  );
}
