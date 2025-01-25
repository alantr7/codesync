export class PromiseManager {

    private _queue: PromiseSupplier[] = [];

    private concurrency: number;

    constructor(concurrent: number) {
        this.concurrency = concurrent;
    }

    private _isDone: boolean = false;

    queue(promise: PromiseSupplier) {
        this._queue.push(promise);
    }

    async perform(): Promise<void> {
        if (this._queue.length === 0) return Promise.resolve();
        this._isDone = false;
        return new Promise((resolve, reject) => {
            const min = Math.min(this._queue.length, this.concurrency);
            for (let i = 0; i < min; i++) {
                this.nextPromise(resolve);
            }
        });
    }

    private nextPromise(resolve: () => void) {
        const next = this._queue.shift();
        next && next().finally(() => {
            this.nextPromise(resolve);
        });

        if (next === undefined && !this._isDone) {
            this._isDone = true;
            resolve();
        }
    }

    public get isDone() {
        return this._isDone;
    }

}

export type PromiseSupplier = () => Promise<any>;