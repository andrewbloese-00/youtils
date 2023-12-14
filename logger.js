function Logger(){
    function error(...args){
        console.error('[ERROR]',...args)
    }
    function warn(...args){
        console.warn('[WARN]',...args)
    }
    function info(...args){
        console.info('[INFO]',...args)
    }
    function log(...args){
        console.log('[LOG]',...args)
    }
    function print(...args){
        console.log(...args)
    }
    return { 
        error,warn,info,log,print
    }

}

module.exports = Logger