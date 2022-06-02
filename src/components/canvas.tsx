import React, { useEffect, useMemo, useRef } from "react";

interface CanvasProps {
    id: string,
    width: number,
    height: number
}

export const Canvas = (props: CanvasProps) => {
    // const ref = React.createRef<HTMLCanvasElement>();

    // should work but ain't
    // // onMount or rerender
    // useMemo(() => {
    //     if (ref.current !== null) {
    //         const ctx = ref.current?.getContext('2d')!; // The '!' tells TS that the context always exists
    //         // flip y axis
    //         console.log('Ref:', ref);
    //         ctx.transform(1, 0, 0, -1, 0, ref.current?.height as number)
    //     }
    // }, [ref]);

    return <canvas /*ref={ref}*/ id={props.id} width={props.width} height={props.height} />;
}