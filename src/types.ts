export interface IPosition {
    x: number;
    y: number;
}

export interface IShape {
    id: string;
    x: number;
    y: number;
    size: number;
    color: string;
    type: 'circle' | 'square' | 'triangle';
    isDragging: boolean;
    
    draw(ctx: CanvasRenderingContext2D): void;
    contains(x: number, y: number): boolean;
    update(): void;
    getBoundingBox(): { x: number, y: number, w: number, h: number };
}