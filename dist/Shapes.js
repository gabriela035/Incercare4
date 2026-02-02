// --- Abstract Base Class ---
export class BaseShape {
    constructor(x, y, size, color, type) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.type = type;
        this.isDragging = false;
        this.pulseOffset = 0;
        // Uses current time + a random number to create a unique enough ID
        this.id = 'shape-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        this.pulseOffset = Math.random() * Math.PI * 2;
    }
    update() {
        this.pulseOffset += 0.05;
    }
    draw(ctx) {
        const breath = Math.sin(this.pulseOffset) * 2;
        const currentSize = this.size + breath;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        if (this.isDragging) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.globalAlpha = 0.8;
            ctx.scale(1.1, 1.1);
            ctx.translate(-(this.x * 0.1), -(this.y * 0.1));
        }
        this.drawShape(ctx, currentSize);
        ctx.restore();
    }
    getBoundingBox() {
        const half = this.size / 2;
        return {
            x: this.x - half,
            y: this.y - half,
            w: this.size,
            h: this.size
        };
    }
}
// --- Concrete Classes ---
export class Circle extends BaseShape {
    constructor(x, y, size, color) {
        super(x, y, size, color, 'circle');
    }
    drawShape(ctx, currentSize) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    contains(mx, my) {
        const dx = this.x - mx;
        const dy = this.y - my;
        return Math.sqrt(dx * dx + dy * dy) < this.size / 2;
    }
}
export class Square extends BaseShape {
    constructor(x, y, size, color) {
        super(x, y, size, color, 'square');
    }
    drawShape(ctx, currentSize) {
        const half = currentSize / 2;
        ctx.beginPath();
        ctx.rect(this.x - half, this.y - half, currentSize, currentSize);
        ctx.fill();
        ctx.stroke();
    }
    contains(mx, my) {
        const half = this.size / 2;
        return mx >= this.x - half && mx <= this.x + half &&
            my >= this.y - half && my <= this.y + half;
    }
}
export class Triangle extends BaseShape {
    constructor(x, y, size, color) {
        super(x, y, size, color, 'triangle');
    }
    drawShape(ctx, currentSize) {
        const height = (Math.sqrt(3) / 2) * currentSize;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - height / 2);
        ctx.lineTo(this.x - currentSize / 2, this.y + height / 2);
        ctx.lineTo(this.x + currentSize / 2, this.y + height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    contains(mx, my) {
        const half = this.size / 2;
        return mx >= this.x - half && mx <= this.x + half &&
            my >= this.y - half && my <= this.y + half;
    }
}
