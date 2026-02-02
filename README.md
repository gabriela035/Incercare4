# Incercare4

I'm glad to hear it's working! This is a great way to learn—breaking down a working system piece by piece.

Since there is a lot of code, I will split the explanation into **three parts**:

1. **Part 1: The Setup & Foundations** (File Structure, `types.ts`, `SoundEngine.ts`)
2. **Part 2: The Shapes Logic** (`Shapes.ts` - Classes and Inheritance)
3. **Part 3: The Main Application** (`main.ts` - The "Brain" of the app)

Let's start with Part 1.

---

### Part 1: The Setup & Foundations

This project uses a modular structure. Instead of one giant file, we have small, focused files that talk to each other.

#### 1. The Configuration: `tsconfig.json`

This file is the "instruction manual" for the TypeScript compiler (`tsc`).

* `"target": "ES6"`: Tells TypeScript to translate your code into modern JavaScript (ES6) that browsers understand.
* `"module": "ES2015"`: Enables the use of `import` and `export` statements, allowing us to split the code into multiple files.
* `"outDir": "./dist"`: Keeps your project clean by putting all the compiled `.js` files into a separate folder named `dist`.
* `"rootDir": "./src"`: Tells the compiler that your actual source code lives in `src`.

#### 2. The Contracts: `src/types.ts`

This file defines **Interfaces**. Interfaces don't "do" anything (they don't run code); they are just rules. They describe what an object *must* look like.

```typescript
export interface IPosition {
    x: number;
    y: number;
}

```

* **Line 1:** `export` means "let other files use this". `interface` defines the shape of an object.
* **Lines 2-3:** Any object labeled as `IPosition` **must** have an `x` and a `y` number. We use this later for mouse coordinates.

```typescript
export interface IShape {
    id: string;
    // ... x, y, size, color ...
    isDragging: boolean;
    
    draw(ctx: CanvasRenderingContext2D): void;
    contains(x: number, y: number): boolean;
    update(): void;
    getBoundingBox(): { x: number, y: number, w: number, h: number };
}

```

* **Why do we need this?** This is a contract. It guarantees that whether we have a Circle, Square, or Triangle, the main app *knows* they all have a `draw()` method and an `x` position. The app doesn't need to know *how* a square draws itself, only that it *can*.

#### 3. The Audio: `src/SoundEngine.ts`

This class wraps the browser's "Web Audio API" to make sounds without MP3 files.

```typescript
export class SoundEngine {
    private ctx: AudioContext;

    constructor() {
        // Line 6: Browsers are tricky. Some use 'AudioContext', old Safari uses 'webkitAudioContext'.
        // This line checks which one exists and uses it.
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        this.ctx = new AudioContextClass();
    }

```

* **The Context:** Think of `AudioContext` as the "power outlet" for sound. You can't make noise without plugging into it.

```typescript
    public resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

```

* **Why this exists:** Browsers block audio from playing automatically (to stop annoying ads). Audio starts in a "suspended" (paused) state. We must call this `resume()` function the first time the user clicks something to "unlock" the sound.

```typescript
    private playSound(freq: number, type: OscillatorType, duration: number) {
        // Line 28: Create an Oscillator. This is a math formula that generates a tone.
        const osc = this.ctx.createOscillator();
        
        // Line 29: Create a GainNode. This is a volume knob.
        const gain = this.ctx.createGain();

        // Line 31-32: Configure the sound (Frequency = pitch, Type = shape of wave).
        osc.type = type; 
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Line 35-36: Connect the wires: Oscillator -> Volume -> Speakers (destination)
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // Line 38: Turn it on!
        osc.start();
        
        // Line 40: "Ramp to value" fades the volume to 0 over 'duration' seconds.
        // If we just stopped it abruptly, you would hear a nasty "click" noise.
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
        
        // Line 41: Turn it off after the fade is done.
        osc.stop(this.ctx.currentTime + duration);
    }

```

* **Oscillator Types:**
* `'sine'`: Smooth, round sound (like a flute or a gentle beep). We use this for "Planting".
* `'square'`: Harsh, buzzy sound (like old Nintendo games). We use this for "Dropping".
* `'sawtooth'`: Very sharp sound. We use this for "Errors".



### Part 2: The Shapes Logic (`src/Shapes.ts`)

This file demonstrates **Object-Oriented Programming (OOP)**. We use a concept called **Inheritance** so we don't have to rewrite the same code (like "color", "dragging", or "animation") for every single shape.

#### 1. The Abstract Base Class (`BaseShape`)

Think of `BaseShape` as the "parent" or "blueprint." You cannot see a generic "Shape" in real life—it must be specific (like a Circle). That is why we mark the class as `abstract`.

```typescript
export abstract class BaseShape implements IShape {
    public id: string;
    public isDragging: boolean = false;
    protected pulseOffset: number = 0; // "protected" means only children (Circle, Square) can access this

    constructor(
        public x: number,
        public y: number,
        public size: number,
        public color: string,
        public type: 'circle' | 'square' | 'triangle'
    ) {
        // Create a unique ID
        this.id = 'shape-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        // Randomize the start of the "breathing" animation.
        // If we didn't do this, all shapes would pulse in perfect sync, which looks robotic.
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

```

**The `draw()` Method (The Wrapper):**
This is a clever trick. The parent handles the settings (color, shadow, scale), but asks the child to do the actual drawing.

```typescript
    draw(ctx: CanvasRenderingContext2D): void {
        // Animation Math: Sine wave creates a smooth value between -1 and +1
        const breath = Math.sin(this.pulseOffset) * 2; 
        const currentSize = this.size + breath; // Shape grows/shrinks slightly

        ctx.save(); // 1. Save current canvas state
        ctx.fillStyle = this.color;
        
        // Visual Feedback for Dragging
        if (this.isDragging) {
            ctx.shadowBlur = 20; // Add glow
            ctx.scale(1.1, 1.1); // Make it pop out
            // We must adjust position because scaling shifts the coordinate system
            ctx.translate(-(this.x * 0.1), -(this.y * 0.1));
        }

        // 2. Call the ABSTRACT method.
        // BaseShape says: "I set the color, now YOU draw the specific lines."
        this.drawShape(ctx, currentSize); 

        ctx.restore(); // 3. Restore state so the next shape isn't affected
    }

```

#### 2. The Concrete Classes (The Children)

These classes `extends BaseShape`. They get all the logic above for free, but they *must* define the specific math for their shape.

**The Circle:**

```typescript
export class Circle extends BaseShape {
    // We pass data up to the parent using 'super'
    constructor(x: number, y: number, size: number, color: string) {
        super(x, y, size, color, 'circle');
    }

    drawShape(ctx: CanvasRenderingContext2D, currentSize: number): void {
        ctx.beginPath();
        // Canvas command: arc(x, y, radius, startAngle, endAngle)
        ctx.arc(this.x, this.y, currentSize / 2, 0, Math.PI * 2); 
        ctx.fill();
        ctx.stroke();
    }

    contains(mx: number, my: number): boolean {
        // Collision: Pythagorean theorem (Distance Formula).
        // If distance from mouse to center is less than radius, we clicked it.
        const dx = this.x - mx;
        const dy = this.y - my;
        return Math.sqrt(dx * dx + dy * dy) < this.size / 2;
    }
}

```

**The Square:**

```typescript
export class Square extends BaseShape {
    drawShape(ctx: CanvasRenderingContext2D, currentSize: number): void {
        // Canvas command: rect(top_left_x, top_left_y, width, height)
        // We subtract half the size to ensure it draws centered on (x,y)
        const half = currentSize / 2;
        ctx.beginPath();
        ctx.rect(this.x - half, this.y - half, currentSize, currentSize);
        ctx.fill();
        ctx.stroke();
    }
    // contains() uses simple bounding box math (is X > left AND X < right?)
}

```

#### 3. Bounding Boxes (`getBoundingBox`)

We use this for collision between two shapes. Calculating if a generic Triangle overlaps a Circle is mathematically heavy. To keep it fast, we put an invisible box around every shape.

```typescript
    getBoundingBox() {
        const half = this.size / 2;
        return {
            x: this.x - half,
            y: this.y - half,
            w: this.size,
            h: this.size
        };
    }

```

If "Box A" touches "Box B", the app counts it as a collision. This is a standard technique in game development called **AABB Collision** (Axis-Aligned Bounding Box).

### Part 3: The Main Application (`src/main.ts`)

This is the "Director" of the show. It brings the Canvas, the Sound Engine, and the Shapes together. It handles the **Game Loop** and user input.

#### 1. The Setup & State

The `GardenApp` class holds the "state" of the application—variables that change as you use it.

```typescript
    // State variables
    private draggingShape: BaseShape | null = null; // What are we holding?
    private dragOffset: IPosition = { x: 0, y: 0 }; // Where did we grab it?
    private originalPos: IPosition = { x: 0, y: 0 }; // Where was it before?

```

* **`draggingShape`**: When you aren't clicking anything, this is `null`. When you click a circle, this variable "holds" that specific circle object.
* **`dragOffset`**: If you click the *edge* of a square, you don't want the square to suddenly snap its center to your mouse cursor. We calculate the difference so it moves naturally relative to where you grabbed it.
* **`originalPos`**: This is our "Undo" memory. If you drop a shape in an invalid spot (overlapping another), we use this to teleport it back home.

#### 2. The Animation Loop (`loop()`)

Canvas doesn't remember drawings. If you move a circle 1 pixel to the right, you have to erase the whole screen and redraw everything. This happens 60 times a second.

```typescript
    private loop(): void {
        // 1. Clear the screen (Erase the whiteboard)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Update and Draw every single shape
        for (const shape of this.shapes) {
            shape.update(); // Update "pulse" animation
            shape.draw(this.ctx); // Draw pixels
        }

        // 3. Ask the browser to call this function again ASAP
        requestAnimationFrame(() => this.loop());
    }

```

* **`requestAnimationFrame`**: This is better than `setInterval`. It pauses if you switch tabs (saving battery) and syncs with your monitor's refresh rate for smooth motion.

#### 3. Interaction Logic: `onMouseDown`

This is where we select a shape. There is a very important detail here: the **Backwards Loop**.

```typescript
    private onMouseDown(e: MouseEvent): void {
        const { x, y } = this.getMousePos(e);

        // We loop BACKWARDS (from end to start)
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            
            if (shape.contains(x, y)) {
                // Found it!
                this.draggingShape = shape;
                // ... (save original pos, etc) ...

                // "Bring to Front" logic:
                // We remove it from the array and add it to the end.
                // Things at the end of the array are drawn LAST (on top).
                this.shapes.splice(i, 1);
                this.shapes.push(shape);
                
                return; // Stop looking. We only want to pick up one thing.
            }
        }
    }

```

**Why backwards?**
Imagine a stack of pancakes. The one you put down last is on top. If you click on the stack, you want to touch the *top* pancake, not the bottom one. In code, the last item in the array is the "top" one.

#### 4. Interaction Logic: `onMouseUp` (The Drop)

This handles the "Physics" collision check.

```typescript
    private onMouseUp(): void {
        if (!this.draggingShape) return;

        // Create a list of "everyone else"
        const others = this.shapes.filter(s => s !== this.draggingShape);
        
        // Check if we hit anyone
        if (this.checkCollision(this.draggingShape, others)) {
            // COLLISION! Bad drop.
            // Snap back to the saved position
            this.draggingShape.x = this.originalPos.x;
            this.draggingShape.y = this.originalPos.y;
            
            this.soundEngine.playErrorSound();
        } else {
            // SUCCESS!
            this.soundEngine.playDropSound();
        }

        // Let go
        this.draggingShape.isDragging = false;
        this.draggingShape = null;
    }

```

#### 5. The Collision Math (`checkCollision`)

This uses **AABB (Axis-Aligned Bounding Box)** logic. It checks if two rectangles overlap.

```typescript
    // 'a' is the shape we are holding
    // 'b' is the other shape
    if (a.x < b.x + b.w &&   // Is A's left side to the left of B's right side?
        a.x + a.w > b.x &&   // Is A's right side to the right of B's left side?
        a.y < b.y + b.h &&   // Is A's top above B's bottom?
        a.y + a.h > b.y) {   // Is A's bottom below B's top?
            return true; // If ALL are true, they are overlapping.
    }
