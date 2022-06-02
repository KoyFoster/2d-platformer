import React from 'react';

interface CanvasProps {
    id: string,
    width: number,
    height: number
}

export const Canvas = (props: CanvasProps) => {
    return <canvas id={props.id} width={props.width} height={props.height} />;
}