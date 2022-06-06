import React from 'react';

interface CanvasProps {
    id: string,
    width: number,
    height: number
}

export const Canvas = (props: CanvasProps) => {
    return <canvas id={props.id} style={{ border: '1px solid #ddd', borderRadius: '4px' }} width={props.width} height={props.height} onClick={e => { e.preventDefault(); e.stopPropagation() }} />;
}