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
                                    console.log('HTTP GET', mapping.out.url);
                                    request.get(mapping.out.url, function(err, res){
                                        if(err) {
                                            pout.error = { message: err };
                                            process.emit('webhook:receive.error', pout);
                                        } else {
                                            process.emit('webhook:receive.response', res.body);    
                                        }
                                    });
                                } else if(mapping.out.method == 'post') {
                                    var curl = 'curl '+mapping.out.url+' -d \''+JSON.stringify(mapping.out.data)+'\'';
                                    require('child_process').exec(curl, function (err, stdout, stderr) {
                                        if(err) {
                                            process.emit('webhook:receive.error', pout);
                                        } else {
                                            process.emit('webhook:receive.response', {out: stdout, err: stderr})
                                        }
                                    });
                                    // todo: investigate why request.post is not working
                                    // request.post({url: mapping.out.url, body: JSON.stringify(mapping.out.data)}, function(err, res){
                                    // request.post({url: mapping.out.url, json: mapping.out.data}, function(err, res){
                                    //     if(err) {
                                    //         console.log('ERROR:', err);
                                    //         pout.error = { message: err };
                                    //         process.emit('webhook:receive.error', pout);
                                    //     } else {
                                    //         console.log('response.statusCode:', res.statusCode);
                                    //         console.log('res.headers:', res.headers);
                                    //         console.log('res.body:', res.body);
                                    //         process.emit('webhook:receive.response', res.body);    
                                    //     }
                                    // });
                                }
                            } else {
                                // default to http get
                                console.log('HTTP GET', mapping.out.url);
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
