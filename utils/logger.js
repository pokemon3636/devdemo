const log4js = require('log4js');
log4js.configure({
    appenders: {
        out: { type: 'console' },
        task: {
            type: 'dateFile',
            filename: 'logs/error',
            pattern: '-yyyy-MM-dd.log',
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ['out'], level: 'info' },
        task: { appenders: ['task'], level: 'info' }
    }
});


const dateFileLog = log4js.getLogger('task');
exports.logger = dateFileLog;