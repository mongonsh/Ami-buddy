type AnimationEventListener = (data?: any) => void;

class LiveAnimationService {
    private listeners: { [key: string]: AnimationEventListener[] } = {};
    private isConnected: boolean = false;
    private socket: any = null; // Placeholder for real WebSocket

    constructor() {
        this.listeners = {};
    }

    on(event: string, callback: AnimationEventListener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event: string, callback: AnimationEventListener) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    emit(event: string, data?: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    connect(characterName: string) {
        console.log(`Connecting LiveAnimationService for ${characterName}...`);

        // Simulating connection
        setTimeout(() => {
            this.isConnected = true;
            this.emit('connected');
        }, 1000);
    }

    speak(text: string) {
        if (!this.isConnected) {
            console.warn("LiveAnimationService not connected.");
            // For now, allow speaking simulation even if "not connected" fully
        }

        console.log(`LiveBuddy Speaking: ${text}`);
        this.emit('speaking_start');

        // Simulate speech duration based on text length
        const duration = Math.max(1500, text.length * 100);

        // Analyze for keywords
        if (text.toLowerCase().includes("great job") || text.toLowerCase().includes("hello")) {
            this.emit('emotion', 'happy');
        }

        setTimeout(() => {
            this.emit('speaking_end');
            this.emit('emotion', 'neutral');
        }, duration);
    }

    disconnect() {
        this.isConnected = false;
        if (this.socket) {
            // this.socket.close(); // implementation depends on WS library
            this.socket = null;
        }
        this.emit('disconnected');
    }
}

export const liveAnimationService = new LiveAnimationService();
