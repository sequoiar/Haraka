// dnsbl plugin

var dns   = require('dns');

exports.register = function() {
    this.zones = this.config.get('dnsbl.zones', 'list');
    this.register_hook('connect', 'check_ip');
}

exports.check_ip = function(callback, connection) {
    this.logdebug("check_ip: " + connection.remote_ip);
    
    var ip = new String(connection.remote_ip);
    var reverse_ip = ip.split('.').reverse().join('.');
    
    if (!this.zones || !this.zones.length) {
        this.logerror("No zones");
        return callback(CONT);
    }
    
    var remaining_zones = [];
    
    var self = this;
    this.zones.forEach(function(zone) {
        self.logdebug("Querying: " + reverse_ip + "." + zone);
        dns.resolve(reverse_ip + "." + zone, "TXT", function (err, value) {
            if (!remaining_zones.length) return;
            remaining_zones.pop(); // we don't care about order really
            if (err) {
                switch (err.code) {
                    case dns.NOTFOUND:
                    case dns.NXDOMAIN:
                    case 'ENOTFOUND':
                                        break;
                    default:
                        self.loginfo("DNS error: " + err);
                }
                if (remaining_zones.length === 0) {
                    // only call declined if no more results are pending
                    return callback(CONT);
                }
                return;
            }
            remaining_zones = [];
            return callback(DENY, value);
        });
        
        remaining_zones.push(zone);
    });
    
}
