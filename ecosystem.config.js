require('dotenv').config();
module.exports = {
    apps: [
        {
            name: 'chat-backend',
            script: 'dist/main.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'development',
                PORT: 3001,
                REDIS_URL: process.env.REDIS_URL,
                DATABASE_URL: process.env.DATABASE_URL,
                JWT_SECRET: process.env.JWT_SECRET,
                SOCKET_IO_PATH: '/socket.io'
            },
            node_args: '--max-http-header-size=16384',
            listen_timeout: 5000,
        }
    ]
};