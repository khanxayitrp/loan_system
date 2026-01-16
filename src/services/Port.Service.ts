import net from 'net';


export default class PortService {
    findAvailablePort(Port: number, callback: (err: Error | null, port?: number) => void): void {
        const server = net.createServer();
        server.once('error', (err: Error) => {
            if (err.message.includes('EADDRINUSE')) {
                // Port is in use, try the next one
                this.findAvailablePort(Port + 1, callback);
            } else {
                callback(err);
            }
                
        });
        server.once('listening', () => {
            server.close(() => callback(null, Port));
        })

        server.listen(Port);
    }
}

// export default new PortService();