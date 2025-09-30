import React, { useState } from 'react';
import { Skeleton } from '@mui/material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  priority?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 'auto',
  height = 'auto',
  className = '',
  style = {},
  onClick,
  priority = false
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <>
      {!loaded && !error && (
        <Skeleton
          variant="rectangular"
          width={width}
          height={height}
          animation="wave"
          style={{ borderRadius: style.borderRadius || 0 }}
        />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={{ 
          ...style,
          display: loaded && !error ? 'block' : 'none',
        }}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        onClick={onClick}
      />
      {error && (
        <div 
          style={{ 
            width, 
            height, 
            backgroundColor: '#f1f1f1', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: style.borderRadius || 0,
            fontSize: '14px',
            color: '#666'
          }}
        >
          Image not available
        </div>
      )}
    </>
  );
};

export default OptimizedImage;