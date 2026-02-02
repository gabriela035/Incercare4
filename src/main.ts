import { IPosition } from './types.js';
import { SoundEngine } from './SoundEngine.js';
import { BaseShape, Circle, Square, Triangle } from './Shapes.js';

class GardenApp {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private shapes: BaseShape[] = [];
    private soundEngine: SoundEngine;
    
    private draggingShape: BaseShape | null = null;
    private dragOffset: IPosition = { x: 0, y: 0 };
    private originalPos: IPosition = { x: 0, y: 0 };

    private mouseXEl = document.getElementById('mouseX')!;
    private mouseYEl = document.getElementById('mouseY')!;
    private countEl = document.getElementById('count')!;
    private statusEl = document.getElementById('status')!;

    constructor() {
        this.canvas = document.getElementById('gardenCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.soundEngine = new SoundEngine();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInputs();
        this.setupInteractions();
        this.loop();
    }

    private resize(): void {
        const wrapper = this.canvas.parentElement!;
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;
    }

    public addShape(type: string, color: string): void {
        this.soundEngine.resume();
        const x = 50 + Math.random() * (this.canvas.width - 100);
        const y = 50 + Math.random() * (this.canvas.height - 100);
        const size = 60;

        let newShape: BaseShape;
        switch(type) {
            case 'square': newShape = new Square(x, y, size, color); break;
            case 'triangle': newShape = new Triangle(x, y, size, color); break;
            default: newShape = new Circle(x, y, size, color);
        }

        if (!this.checkCollision(newShape, this.shapes)) {
            this.shapes.push(newShape);
            this.updateStats();
            this.soundEngine.playPlantSound();
            this.statusEl.textContent = `Planted ${type}`;
        } else {
            this.soundEngine.playErrorSound();
            this.statusEl.textContent = "Too Crowded!";
        }
    }

    public clear(): void {
        this.shapes = [];
        this.updateStats();
        this.statusEl.textContent = "Garden Cleared";
    }

    private setupInputs(): void {
        document.getElementById('addBtn')?.addEventListener('click', () => {
            const type = (document.getElementById('shapeSelect') as HTMLSelectElement).value;
            const color = (document.getElementById('colorSelect') as HTMLInputElement).value;
            this.addShape(type, color);
        });
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clear());
    }

    private setupInteractions(): void {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
    }

    private getMousePos(e: MouseEvent): IPosition {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    private onMouseDown(e: MouseEvent): void {
        this.soundEngine.resume();
        const { x, y } = this.getMousePos(e);

        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (shape.contains(x, y)) {
                this.draggingShape = shape;
                this.draggingShape.isDragging = true;
                this.originalPos = { x: shape.x, y: shape.y };
                this.dragOffset = { x: x - shape.x, y: y - shape.y };
                this.shapes.splice(i, 1);
                this.shapes.push(shape);
                this.statusEl.textContent = "Dragging...";
                return;
            }
        }
    }

    private onMouseMove(e: MouseEvent): void {
        const { x, y } = this.getMousePos(e);
        this.mouseXEl.textContent = Math.round(x).toString();
        this.mouseYEl.textContent = Math.round(y).toString();

        if (this.draggingShape) {
            this.draggingShape.x = x - this.dragOffset.x;
            this.draggingShape.y = y - this.dragOffset.y;
        }
    }

    private onMouseUp(): void {
        if (!this.draggingShape) return;
        const others = this.shapes.filter(s => s !== this.draggingShape);
        
        if (this.checkCollision(this.draggingShape, others)) {
            this.draggingShape.x = this.originalPos.x;
            this.draggingShape.y = this.originalPos.y;
            this.statusEl.textContent = "Overlap Detected!";
            this.soundEngine.playErrorSound();
        } else {
            this.statusEl.textContent = "Placed";
            this.soundEngine.playDropSound();
        }
        this.draggingShape.isDragging = false;
        this.draggingShape = null;
    }

    private checkCollision(target: BaseShape, others: BaseShape[]): boolean {
        const a = target.getBoundingBox();
        for (const other of others) {
            const b = other.getBoundingBox();
            if (a.x < b.x + b.w && a.x + a.w > b.x &&
                a.y < b.y + b.h && a.y + a.h > b.y) {
                return true;
            }
        }
        return false;
    }

    private updateStats(): void {
        this.countEl.textContent = this.shapes.length.toString();
    }

    private loop(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const shape of this.shapes) {
            shape.update();
            shape.draw(this.ctx);
        }
        requestAnimationFrame(() => this.loop());
    }
}

// Wait for the window to fully load before starting
window.addEventListener('DOMContentLoaded', () => {
    new GardenApp();
});