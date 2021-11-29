import { Nullable } from './types';

export type Consumer<T> = (value: T) => void;

export interface Sub {
    unsub(): void;
};

export interface Publisher<T> {
    sub(consumer: Consumer<T>): Sub;
};

const INIT_SUBSCRIBER: Sub = {
    unsub: () => undefined,
};

export class Subscription<T> implements Sub {
    private consumers: Nullable<Map<object, Consumer<T>>>;
    private key: Nullable<object>;

    constructor(consumers: Map<object, Consumer<T>>, key: object) {
        this.consumers = consumers;
        this.key = key;
    }

    public unsub(): void {
        if (this.consumers && this.key) {
            this.consumers.delete(this.key);
        }

        this.consumers = null;
        this.key = null;
    }
}

export class PubSub<T> implements Publisher<T> {
    private consumers: Map<object, Consumer<T>>;

    constructor() {
        this.consumers = new Map<object, Consumer<T>>()
    }

    public get size(): number {
        return this.consumers.size;
    }

    public sub(consumer: Consumer<T>): Sub {
        if (!consumer) {
            return INIT_SUBSCRIBER;
        }

        const key = {};
        this.consumers.set(key, consumer);
        return new Subscription(this.consumers, key);
    }

    public pub(value: T) {
        if (this.consumers.size === 0) {
            return;
        }

        this.consumers.forEach(consume => consume(value));
    }

    public clear() {
        this.consumers.clear();
        this.consumers = new Map<object, Consumer<T>>();
    }
}