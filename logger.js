const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

const env = process.env.NODE_ENV || 'development';
const logDir = 'log';

// Создаем директорию, в которой будут храниться логи
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const filename = path.join(logDir, 'results.log');

/**
 * Уровни ошибок
 * 0: error (ошибка)
 * 1: warn  (предупреждение)
 * 2: info  (информация)
 * 3: verbose (расширенный вывод)
 * 4: debug   (отладочное сообщение)
 * 5: silly   (простое сообщение)
 */

const prefix_color = require('cluster').isMaster ? '[WEB] '.red : '[BACK]'.cyan
const prefix       = require('cluster').isMaster ? '[WEB] ' : '[BACK]'


const logger = createLogger({
    // Уровень сообщений, который нужно логировать

    transports: [
        new transports.Console({
            level: env === 'development' ? 'debug' : 'info',
            handleExceptions: true, // Логирование исключений
            format: format.combine(
                format.colorize(),       
                format.timestamp({
                    format: 'HH:mm:ss'
                }),
                format.printf(function(data){
                    return `${prefix_color} ${data.timestamp.blue} ${data.level}: ${data.message}${data.json ? '\n' + JSON.stringify(data.json, null, 2) : ''}`
                })
            )
        }),
        new transports.File({
            level: env === 'development' ? 'debug' : 'info',
            handleExceptions: true, // Логирование исключений
            format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.printf(function(data) {
                    return `${prefix} ${data.timestamp} ${data.level}: ${data.message}${data.json ? '\n' + JSON.stringify(data.json, null, 2) : ''}`
                })
            ),
            filename: filename,
        })
    ]
});

module.exports = logger