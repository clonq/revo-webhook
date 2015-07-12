module.exports = function(){
    var _ = require('underscore');

    this.init = function(config) {
        var self = this;
        this.params = _.defaults(config||{}, defaults)
        process.emit('http.route:create', { path:'/webhook/', trigger:'webhook:receive'});
        process.on('webhook:receive', function(pin){
            console.log('webhook:receive', pin);
            var pout = {};
            var errors = validate(pin);
            if(errors.length == 0) {
                //todo add implementation here
            } else {
                pout.error = { message: errors[0].message };
                process.emit('webhook:receive.response', pout);
            }
        });
    }

    function validate(payload) {
        return []; //todo use schema to validate the payload
    }

}

var defaults = module.exports.defaults = {
    models: {
        webhook: {
            supportedMethods: ['receive']
        }
    }
}
