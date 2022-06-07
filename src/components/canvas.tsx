import React from 'react';

interface CanvasProps {
    id: string;
    width: number;
    height: number;
}

export const Canvas = ({ id, width, height }: CanvasProps) => (
    <canvas
        id={id}
        style={{ border: '1px solid #ddd', borderRadius: '4px' }}
        width={width}
        height={height}
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
        }}
    />
);
