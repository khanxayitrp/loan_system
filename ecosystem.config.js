module.exports = {
  apps: [
    {
      name: 'apiserver',
      script: './dist/server.js',
      // interpreter: 'tsx',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        PORT: 15520,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 15520,
      },
      
      
      instances: 'max',        // use CPU core or fixed 4
      exec_mode: 'cluster',    //  'cluster' not 'fork'
      
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // error_file: './logs/pm2-error.log',
      // out_file: './logs/pm2-out.log',
      // log_file: './logs/pm2-combined.log',
      time: true,
      
      // additional Production
      merge_logs: true,        //  logs all instance
      listen_timeout: 10000,   // timeout graceful shutdown
      kill_timeout: 5000,      // timeout before force kill
      wait_ready: false,        
    },
  ],
};
