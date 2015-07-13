module.exports = function(){
    var _ = require('underscore'),
        request = require('request');

    this.init = function(config) {
        var self = this;
        this.params = _.defaults(config||{}, defaults)
        process.emit('http.route:create', { path:'/webhook/*', trigger:'webhook:receive'});
        process.on('webhook:receive', function(pin){
            var pout = {};
            var errors = validate(pin);
            if(errors.length == 0) {
                if(!!self.params.mappings) {
                    self.params.mappings.forEach(function(mapping){
                        if(!!mapping && !!mapping.in && !!mapping.in.path && (mapping.in.path == pin.path)) {
                            if(!!mapping.out && !!mapping.out.method) {
                                if(mapping.out.method == 'get') {
                                    request.get(mapping.out.url, function(err, res){
                                        if(err) {
                                            pout.error = { message: err };
                                            process.emit('webhook:receive.error', pout);
                                        } else {
                                            process.emit('webhook:receive.response', res.body);    
                                        }
                                    });
                                } else if(mapping.out.method == 'post') {
                                    request.post({url: mapping.out.url, body: JSON.stringify(mapping.out.data)}, function(err, res){
                                        if(err) {
                                            pout.error = { message: err };
                                            process.emit('webhook:receive.error', pout);
                                        } else {
                                            process.emit('webhook:receive.response', res.body);    
                                        }
                                    });
                                }
                            } else {
                                // default to http get
                                request.get(mapping.out.url, function(err, res){
                                    if(err) {
                                        pout.error = { message: err };
                                        process.emit('webhook:receive.error', pout);
                                    } else {
                                        process.emit('webhook:receive.response', res.body);    
                                    }
                                });
                            }
                        }
                    });
                } else {
                    pout.error = { message: "no mappings available" };
                    process.emit('webhook:receive.error', pout);
                }
            } else {
                pout.error = { message: errors[0].message };
                process.emit('webhook:receive.error', pout);
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
