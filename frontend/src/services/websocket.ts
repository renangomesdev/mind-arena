import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export const createStompClient = () => {
    return new Client({
        brokerURL: WS_URL,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });
};
